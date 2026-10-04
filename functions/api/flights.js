const DEFAULT_MARKUP_RATE = 0.40;

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders
    }
  });
}

function extractIata(value = "") {
  const clean = String(value).trim().toUpperCase();
  const paren = clean.match(/\(([A-Z]{3})\)/);
  if (paren) return paren[1];
  if (/^[A-Z]{3}$/.test(clean)) return clean;
  return null;
}

function envValue(env, name, fallback = "") {
  const value = env?.[name];
  return value == null ? fallback : String(value);
}

async function getAccessToken(baseUrl, env) {
  const clientId = envValue(env, "AMADEUS_CLIENT_ID");
  const clientSecret = envValue(env, "AMADEUS_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("AMADEUS_NOT_CONFIGURED");

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret
  });

  const response = await fetch(baseUrl + "/v1/security/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) throw new Error("AMADEUS_AUTH_FAILED");
  return data.access_token;
}

async function resolveIata(baseUrl, token, value) {
  const direct = extractIata(value);
  if (direct) return direct;

  const url = new URL(baseUrl + "/v1/reference-data/locations");
  url.searchParams.set("subType", "CITY,AIRPORT");
  url.searchParams.set("keyword", String(value || "").trim());
  url.searchParams.set("page[limit]", "5");
  url.searchParams.set("view", "LIGHT");

  const response = await fetch(url, { headers: { Authorization: "Bearer " + token } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !Array.isArray(data.data) || data.data.length === 0) {
    throw new Error("LOCATION_NOT_FOUND");
  }
  const location = data.data.find((item) => item.iataCode) || data.data[0];
  if (!location?.iataCode) throw new Error("LOCATION_NOT_FOUND");
  return location.iataCode;
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function markupRate(env) {
  const raw = Number(envValue(env, "FLIGHT_MARKUP_RATE", String(DEFAULT_MARKUP_RATE)));
  if (!Number.isFinite(raw)) return DEFAULT_MARKUP_RATE;
  return Math.min(1, Math.max(0, raw));
}

function publicPrice(baseAmount, currency, env) {
  const base = safeNumber(baseAmount);
  if (base === null) return null;
  const amount = base * (1 + markupRate(env));
  const noDecimals = currency === "XOF" || currency === "XAF";
  return noDecimals ? Math.round(amount) : Math.round(amount * 100) / 100;
}

function summarizeSegment(segment) {
  return {
    from: segment.departure?.iataCode || "",
    to: segment.arrival?.iataCode || "",
    departureAt: segment.departure?.at || "",
    arrivalAt: segment.arrival?.at || "",
    carrierCode: segment.carrierCode || "",
    flightNumber: segment.number || "",
    duration: segment.duration || ""
  };
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== "GET") {
    return json({ error: "Méthode non autorisée." }, 405, { Allow: "GET" });
  }

  try {
    const requestUrl = new URL(request.url);
    const origin = requestUrl.searchParams.get("origin");
    const destination = requestUrl.searchParams.get("destination");
    const departureDate = requestUrl.searchParams.get("departureDate");
    const returnDate = requestUrl.searchParams.get("returnDate");
    const adults = requestUrl.searchParams.get("adults") || "1";

    if (!origin || !destination || !departureDate) {
      return json({ error: "Départ, destination et date aller sont obligatoires." }, 400);
    }

    const adultCount = Math.max(1, Math.min(9, parseInt(adults, 10) || 1));
    const amadeusEnv = envValue(env, "AMADEUS_ENV", "production").toLowerCase();
    const baseUrl =
      envValue(env, "AMADEUS_BASE_URL") ||
      (amadeusEnv === "test" ? "https://test.api.amadeus.com" : "https://api.amadeus.com");

    const token = await getAccessToken(baseUrl, env);
    const [originCode, destinationCode] = await Promise.all([
      resolveIata(baseUrl, token, origin),
      resolveIata(baseUrl, token, destination)
    ]);

    const url = new URL(baseUrl + "/v2/shopping/flight-offers");
    url.searchParams.set("originLocationCode", originCode);
    url.searchParams.set("destinationLocationCode", destinationCode);
    url.searchParams.set("departureDate", departureDate);
    if (returnDate) url.searchParams.set("returnDate", returnDate);
    url.searchParams.set("adults", String(adultCount));
    url.searchParams.set("max", "12");

    const response = await fetch(url, { headers: { Authorization: "Bearer " + token } });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const providerMessage =
        payload?.errors?.[0]?.detail ||
        payload?.errors?.[0]?.title ||
        "La recherche de vols a échoué.";
      return json({ error: providerMessage }, response.status);
    }

    const carriers = payload?.dictionaries?.carriers || {};
    const offers = (payload.data || [])
      .map((offer) => {
        const currency = offer.price?.currency || "";
        const amount = publicPrice(offer.price?.grandTotal || offer.price?.total, currency, env);
        if (amount === null) return null;

        const itineraries = (offer.itineraries || []).map((itinerary) => ({
          duration: itinerary.duration || "",
          segments: (itinerary.segments || []).map(summarizeSegment)
        }));
        const firstSegment = itineraries?.[0]?.segments?.[0];
        const carrierCode = firstSegment?.carrierCode || "";
        const segmentCount = itineraries?.[0]?.segments?.length || 0;

        return {
          id: offer.id,
          origin: originCode,
          destination: destinationCode,
          price: { amount, currency },
          airline: { code: carrierCode, name: carriers[carrierCode] || carrierCode },
          stops: Math.max(0, segmentCount - 1),
          seats: offer.numberOfBookableSeats || null,
          itineraries
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.price.amount - b.price.amount);

    return json({
      origin: originCode,
      destination: destinationCode,
      testMode: amadeusEnv === "test",
      markupRate: markupRate(env),
      offers
    });
  } catch (error) {
    if (error.message === "AMADEUS_NOT_CONFIGURED") {
      return json({ error: "Le moteur de vols n'est pas encore connecté au fournisseur de tarifs." }, 503);
    }
    if (error.message === "AMADEUS_AUTH_FAILED") {
      return json({ error: "Connexion au fournisseur de vols impossible. Vérifiez les identifiants API." }, 502);
    }
    if (error.message === "LOCATION_NOT_FOUND") {
      return json({ error: "Ville ou aéroport introuvable. Essayez par exemple Lomé (LFW) ou Paris (PAR)." }, 400);
    }
    console.error("flights", error);
    return json({ error: "Erreur temporaire pendant la recherche de vols." }, 500);
  }
}

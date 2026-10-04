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

function normalizeCabin(value = "") {
  const cabin = String(value).trim().toLowerCase();
  if (["first", "business", "premium_economy", "economy"].includes(cabin)) return cabin;
  if (cabin === "premium economy" || cabin === "premium-economy") return "premium_economy";
  return "economy";
}

function isoDurationBetween(start, end) {
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return "";
  const mins = Math.round((b - a) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return "PT" + (h ? h + "H" : "") + (m ? m + "M" : "");
}

function passengerList(adults, children, infants) {
  const result = [];
  for (let i = 0; i < adults; i += 1) result.push({ type: "adult" });
  for (let i = 0; i < children; i += 1) result.push({ type: "child" });
  for (let i = 0; i < infants; i += 1) result.push({ type: "infant_without_seat" });
  return result;
}

function duffelSegment(segment) {
  const operating = segment.operating_carrier || segment.marketing_carrier || {};
  const marketing = segment.marketing_carrier || operating || {};
  return {
    from: segment.origin?.iata_code || "",
    to: segment.destination?.iata_code || "",
    departureAt: segment.departing_at || "",
    arrivalAt: segment.arriving_at || "",
    carrierCode: marketing.iata_code || operating.iata_code || "",
    airlineName: operating.name || marketing.name || "",
    flightNumber: segment.marketing_carrier_flight_number || "",
    duration: segment.duration || isoDurationBetween(segment.departing_at, segment.arriving_at)
  };
}

function duffelItinerary(slice) {
  const segments = (slice?.segments || []).map(duffelSegment);
  return {
    duration: slice?.duration || (
      segments.length
        ? isoDurationBetween(segments[0].departureAt, segments[segments.length - 1].arrivalAt)
        : ""
    ),
    segments
  };
}

async function searchDuffel(params, env) {
  const token = envValue(env, "DUFFEL_ACCESS_TOKEN");
  if (!token) throw new Error("DUFFEL_NOT_CONFIGURED");

  const originCode = extractIata(params.origin);
  const destinationCode = extractIata(params.destination);
  if (!originCode || !destinationCode) throw new Error("DUFFEL_NEEDS_IATA");

  const slices = [
    { origin: originCode, destination: destinationCode, departure_date: params.departureDate }
  ];
  if (params.returnDate) {
    slices.push({
      origin: destinationCode,
      destination: originCode,
      departure_date: params.returnDate
    });
  }

  const body = {
    data: {
      slices,
      passengers: passengerList(params.adults, params.children, params.infants),
      cabin_class: normalizeCabin(params.cabin)
    }
  };

  const response = await fetch("https://api.duffel.com/air/offer_requests?return_offers=true", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Duffel-Version": "v2",
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      payload?.errors?.[0]?.message ||
      payload?.errors?.[0]?.title ||
      "Recherche de vols momentanément indisponible.";
    const error = new Error("DUFFEL_FAILED");
    error.providerMessage = message;
    error.status = response.status;
    throw error;
  }

  const requestData = payload?.data || {};
  const rawOffers = Array.isArray(requestData.offers) ? requestData.offers : [];
  const offers = rawOffers
    .map((offer) => {
      const currency = offer.total_currency || "";
      const amount = publicPrice(offer.total_amount, currency, env);
      if (amount === null) return null;
      const itineraries = (offer.slices || []).map(duffelItinerary);
      const firstSegment = itineraries?.[0]?.segments?.[0] || {};
      const airlineName = firstSegment.airlineName || offer.owner?.name || "Compagnie aérienne";
      const airlineCode = firstSegment.carrierCode || offer.owner?.iata_code || "";
      const segmentCount = itineraries?.[0]?.segments?.length || 0;

      return {
        id: offer.id,
        origin: originCode,
        destination: destinationCode,
        price: { amount, currency },
        airline: { code: airlineCode, name: airlineName },
        stops: Math.max(0, segmentCount - 1),
        seats: null,
        expiresAt: offer.expires_at || null,
        live: requestData.live_mode === true,
        itineraries
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.price.amount - b.price.amount)
    .slice(0, 12);

  return {
    origin: originCode,
    destination: destinationCode,
    liveMode: requestData.live_mode === true,
    testMode: requestData.live_mode !== true,
    markupRate: markupRate(env),
    offers
  };
}

async function getAmadeusAccessToken(baseUrl, env) {
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

async function resolveAmadeusIata(baseUrl, token, value) {
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

function summarizeAmadeusSegment(segment, carriers = {}) {
  const code = segment.carrierCode || "";
  return {
    from: segment.departure?.iataCode || "",
    to: segment.arrival?.iataCode || "",
    departureAt: segment.departure?.at || "",
    arrivalAt: segment.arrival?.at || "",
    carrierCode: code,
    airlineName: carriers[code] || code,
    flightNumber: segment.number || "",
    duration: segment.duration || ""
  };
}

async function searchAmadeus(params, env) {
  const amadeusEnv = envValue(env, "AMADEUS_ENV", "production").toLowerCase();
  const baseUrl =
    envValue(env, "AMADEUS_BASE_URL") ||
    (amadeusEnv === "test" ? "https://test.api.amadeus.com" : "https://api.amadeus.com");

  const token = await getAmadeusAccessToken(baseUrl, env);
  const [originCode, destinationCode] = await Promise.all([
    resolveAmadeusIata(baseUrl, token, params.origin),
    resolveAmadeusIata(baseUrl, token, params.destination)
  ]);

  const url = new URL(baseUrl + "/v2/shopping/flight-offers");
  url.searchParams.set("originLocationCode", originCode);
  url.searchParams.set("destinationLocationCode", destinationCode);
  url.searchParams.set("departureDate", params.departureDate);
  if (params.returnDate) url.searchParams.set("returnDate", params.returnDate);
  url.searchParams.set("adults", String(params.adults));
  if (params.children) url.searchParams.set("children", String(params.children));
  if (params.infants) url.searchParams.set("infants", String(params.infants));
  url.searchParams.set("travelClass", normalizeCabin(params.cabin).toUpperCase());
  url.searchParams.set("max", "12");

  const response = await fetch(url, { headers: { Authorization: "Bearer " + token } });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error("AMADEUS_FAILED");
    error.providerMessage =
      payload?.errors?.[0]?.detail ||
      payload?.errors?.[0]?.title ||
      "Recherche de vols momentanément indisponible.";
    error.status = response.status;
    throw error;
  }

  const carriers = payload?.dictionaries?.carriers || {};
  const offers = (payload.data || [])
    .map((offer) => {
      const currency = offer.price?.currency || "";
      const amount = publicPrice(offer.price?.grandTotal || offer.price?.total, currency, env);
      if (amount === null) return null;

      const itineraries = (offer.itineraries || []).map((itinerary) => ({
        duration: itinerary.duration || "",
        segments: (itinerary.segments || []).map((segment) => summarizeAmadeusSegment(segment, carriers))
      }));
      const firstSegment = itineraries?.[0]?.segments?.[0] || {};
      const segmentCount = itineraries?.[0]?.segments?.length || 0;

      return {
        id: offer.id,
        origin: originCode,
        destination: destinationCode,
        price: { amount, currency },
        airline: {
          code: firstSegment.carrierCode || "",
          name: firstSegment.airlineName || firstSegment.carrierCode || "Compagnie aérienne"
        },
        stops: Math.max(0, segmentCount - 1),
        seats: offer.numberOfBookableSeats || null,
        expiresAt: null,
        live: amadeusEnv !== "test",
        itineraries
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.price.amount - b.price.amount);

  return {
    origin: originCode,
    destination: destinationCode,
    liveMode: amadeusEnv !== "test",
    testMode: amadeusEnv === "test",
    markupRate: markupRate(env),
    offers
  };
}

function intParam(url, name, fallback = 0, min = 0, max = 9) {
  const raw = parseInt(url.searchParams.get(name) || String(fallback), 10);
  if (!Number.isFinite(raw)) return fallback;
  return Math.max(min, Math.min(max, raw));
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== "GET") {
    return json({ error: "Méthode non autorisée." }, 405, { Allow: "GET" });
  }

  const requestUrl = new URL(request.url);
  const params = {
    origin: requestUrl.searchParams.get("origin"),
    destination: requestUrl.searchParams.get("destination"),
    departureDate: requestUrl.searchParams.get("departureDate"),
    returnDate: requestUrl.searchParams.get("returnDate"),
    adults: intParam(requestUrl, "adults", 1, 1, 9),
    children: intParam(requestUrl, "children", 0, 0, 8),
    infants: intParam(requestUrl, "infants", 0, 0, 4),
    cabin: requestUrl.searchParams.get("cabin") || "economy"
  };

  if (!params.origin || !params.destination || !params.departureDate) {
    return json({ error: "Départ, destination et date aller sont obligatoires." }, 400);
  }

  if (params.infants > params.adults) {
    return json({ error: "Le nombre de bébés sans siège ne peut pas dépasser le nombre d’adultes." }, 400);
  }

  const preferred = envValue(env, "FLIGHT_PROVIDER", "auto").toLowerCase();
  const attempts = preferred === "duffel"
    ? ["duffel", "amadeus"]
    : preferred === "amadeus"
      ? ["amadeus", "duffel"]
      : ["duffel", "amadeus"];

  let lastError = null;

  for (const provider of attempts) {
    try {
      if (provider === "duffel") {
        const result = await searchDuffel(params, env);
        return json({ ...result, source: "niaba" });
      }
      const result = await searchAmadeus(params, env);
      return json({ ...result, source: "niaba" });
    } catch (error) {
      lastError = error;
      if (
        error.message === "DUFFEL_NOT_CONFIGURED" ||
        error.message === "DUFFEL_NEEDS_IATA" ||
        error.message === "AMADEUS_NOT_CONFIGURED" ||
        error.message === "AMADEUS_AUTH_FAILED" ||
        error.message === "DUFFEL_FAILED" ||
        error.message === "AMADEUS_FAILED"
      ) {
        continue;
      }
      if (error.message === "LOCATION_NOT_FOUND") {
        return json({
          error: "Ville ou aéroport introuvable. Utilisez si possible le code IATA, par exemple Lomé (LFW) ou Paris (PAR)."
        }, 400);
      }
    }
  }

  console.error("flight providers unavailable", lastError);
  return json({
    error: "La recherche automatique n’est pas encore disponible pour ce trajet.",
    quoteOnly: true
  }, 503);
}

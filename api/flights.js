const MARKUP_RATE = 0.40;

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function extractIata(value = "") {
  const clean = String(value).trim().toUpperCase();
  const paren = clean.match(/\(([A-Z]{3})\)/);
  if (paren) return paren[1];
  if (/^[A-Z]{3}$/.test(clean)) return clean;
  return null;
}

async function getAccessToken(baseUrl) {
  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("AMADEUS_NOT_CONFIGURED");
  }

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
  if (!response.ok || !data.access_token) {
    throw new Error("AMADEUS_AUTH_FAILED");
  }

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

  const response = await fetch(url, {
    headers: { Authorization: "Bearer " + token }
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || !Array.isArray(data.data) || data.data.length === 0) {
    throw new Error("LOCATION_NOT_FOUND");
  }

  const location = data.data.find((item) => item.iataCode) || data.data[0];
  if (!location || !location.iataCode) throw new Error("LOCATION_NOT_FOUND");
  return location.iataCode;
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function publicPrice(baseAmount, currency) {
  const base = safeNumber(baseAmount);
  if (base === null) return null;
  const amount = base * (1 + MARKUP_RATE);
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

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return send(res, 405, { error: "Méthode non autorisée." });
  }

  try {
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      adults = "1"
    } = req.query || {};

    if (!origin || !destination || !departureDate) {
      return send(res, 400, { error: "Départ, destination et date aller sont obligatoires." });
    }

    const adultCount = Math.max(1, Math.min(9, parseInt(adults, 10) || 1));
    const amadeusEnv = String(process.env.AMADEUS_ENV || "production").toLowerCase();
    const baseUrl =
      process.env.AMADEUS_BASE_URL ||
      (amadeusEnv === "test"
        ? "https://test.api.amadeus.com"
        : "https://api.amadeus.com");

    const token = await getAccessToken(baseUrl);
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

    const response = await fetch(url, {
      headers: { Authorization: "Bearer " + token }
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const providerMessage =
        payload?.errors?.[0]?.detail ||
        payload?.errors?.[0]?.title ||
        "La recherche de vols a échoué.";
      return send(res, response.status, { error: providerMessage });
    }

    const carriers = payload?.dictionaries?.carriers || {};
    const offers = (payload.data || [])
      .map((offer) => {
        const currency = offer.price?.currency || "";
        const amount = publicPrice(offer.price?.grandTotal || offer.price?.total, currency);
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
          price: {
            amount,
            currency
          },
          airline: {
            code: carrierCode,
            name: carriers[carrierCode] || carrierCode
          },
          stops: Math.max(0, segmentCount - 1),
          seats: offer.numberOfBookableSeats || null,
          itineraries
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.price.amount - b.price.amount);

    return send(res, 200, {
      origin: originCode,
      destination: destinationCode,
      testMode: amadeusEnv === "test",
      offers
    });
  } catch (error) {
    if (error.message === "AMADEUS_NOT_CONFIGURED") {
      return send(res, 503, {
        error: "Le moteur de vols n'est pas encore connecté au fournisseur de tarifs."
      });
    }
    if (error.message === "AMADEUS_AUTH_FAILED") {
      return send(res, 502, {
        error: "Connexion au fournisseur de vols impossible. Vérifiez les identifiants API."
      });
    }
    if (error.message === "LOCATION_NOT_FOUND") {
      return send(res, 400, {
        error: "Ville ou aéroport introuvable. Essayez par exemple Lomé (LFW) ou Paris (PAR)."
      });
    }

    console.error(error);
    return send(res, 500, { error: "Erreur temporaire pendant la recherche de vols." });
  }
};

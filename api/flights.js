import { onRequest } from "../functions/api/flights.js";

export default async function handler(req, res) {
  try {
    const proto = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers.host || "niabavoyage.com";
    const url = new URL(req.url || "/api/flights", `${proto}://${host}`);

    const request = new Request(url.toString(), {
      method: req.method || "GET",
      headers: req.headers
    });

    const response = await onRequest({
      request,
      env: process.env
    });

    res.status(response.status);

    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const body = await response.text();
    res.send(body);
  } catch (error) {
    console.error("Vercel flight adapter", error);
    res.status(500).json({
      error: "Erreur temporaire pendant la recherche de vols."
    });
  }
}

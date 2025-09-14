// parse "lat,lng" strings or {latitude, longitude} objects → [lat, lng] | null
export function parseLocation(loc) {
  if (!loc) return null;

  if (typeof loc === "string") {
    const [a, b] = loc.split(",").map((x) => Number(x.trim()));
    return Number.isFinite(a) && Number.isFinite(b) ? [a, b] : null;
  }

  if (typeof loc === "object") {
    const lat = Number(loc.latitude ?? loc.lat);
    const lng = Number(loc.longitude ?? loc.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
  }

  return null;
}

// normalize seconds/millis/micros → millis (for Date())
export function tsToMillis(t) {
  const n = typeof t === "bigint" ? Number(t) : Number(t);
  if (!Number.isFinite(n)) return Date.now();
  if (n > 1e14) return Math.floor(n / 1000); // micros → millis
  if (n < 1e11) return n * 1000;             // seconds → millis
  return n;                                   // already millis
}

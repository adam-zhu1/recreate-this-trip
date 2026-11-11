// Shared helpers. Everything hangs off one global so the files can load
// with plain script tags (no build step).
window.RTT = {
  views: {},   // route name -> { title, nav, order, render(el, args) }
  parts: {},   // optional pieces other views use if they're loaded
};

RTT.$ = (sel, root) => (root || document).querySelector(sel);

RTT.esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

RTT.fmt = (n) => (n == null || isNaN(n)) ? "?" : Math.round(n).toLocaleString("en-US");

// localStorage can throw (private mode, blocked storage), so wrap it.
RTT.load = (key, fallback) => {
  try {
    const v = localStorage.getItem("rtt." + key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) {
    return fallback;
  }
};
RTT.save = (key, value) => {
  try { localStorage.setItem("rtt." + key, JSON.stringify(value)); } catch (e) { /* fine */ }
};

// Airports: built lazily from the rows in data/airports.js.
RTT.airport = (code) => {
  if (!RTT.airportRows) return null;
  if (!RTT._airports) {
    RTT._airports = {};
    for (const r of RTT.airportRows) {
      RTT._airports[r[0]] = { code: r[0], name: r[1], city: r[2], country: r[3], lat: r[4], lon: r[5] };
    }
  }
  return RTT._airports[String(code || "").trim().toUpperCase()] || null;
};

// Great-circle distance in statute miles.
RTT.miles = (a, b) => {
  const R = 3958.8, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

RTT.thumb = (id) => "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg";

// OurAirports uses the airport's own town for some big airports
RTT.cityFix = {
  ATH: "Athens", BRU: "Brussels", FRA: "Frankfurt", NRT: "Tokyo", TPE: "Taipei", IAD: "Washington",
  KIX: "Osaka", ICN: "Seoul", CGK: "Jakarta", SCL: "Santiago", GRU: "São Paulo", MXP: "Milan",
  FCO: "Rome", AMS: "Amsterdam", ZRH: "Zurich", VIE: "Vienna", CPH: "Copenhagen", ARN: "Stockholm",
  OSL: "Oslo", HEL: "Helsinki", LGW: "London", STN: "London", ORY: "Paris", DUB: "Dublin",
  YVR: "Vancouver", YUL: "Montreal", MEL: "Melbourne", SYD: "Sydney", HKG: "Hong Kong",
};

RTT.cityName = (code) => {
  const a = RTT.airport(code);
  if (!a) return code;
  if (RTT.cityFix[a.code]) return RTT.cityFix[a.code];
  // OurAirports city names can be long ("Paris (Roissy-en-France, ...)"), keep the first bit
  return (a.city || a.name).split(" (")[0].split(",")[0];
};

// Every stop on a trip, start to finish
RTT.stops = (trip) => [trip.from, ...(trip.via || []), trip.to].filter(Boolean);

RTT.tripMiles = (trip) => {
  const s = RTT.stops(trip).map(RTT.airport);
  if (s.some((a) => !a)) return null;
  let m = 0;
  for (let i = 1; i < s.length; i++) m += RTT.miles(s[i - 1], s[i]);
  return m;
};

// What to use for the points math: what they booked with, or the usual way
RTT.tripProgram = (trip) => trip.program || trip.usual || "";

// "2024-06" -> "Jun 2024"
RTT.month = (ym) => {
  const [y, m] = String(ym || "").split("-");
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return m ? names[Number(m) - 1] + " " + y : y || "";
};

// Points along the great circle between two airports, so long flights curve
// like they do on a real route map. Longitudes are kept continuous so a
// Pacific crossing doesn't streak across the whole map.
RTT.arc = function (a, b, n) {
  n = n || 64;
  const rad = Math.PI / 180;
  const toVec = (p) => [Math.cos(p.lat * rad) * Math.cos(p.lon * rad), Math.cos(p.lat * rad) * Math.sin(p.lon * rad), Math.sin(p.lat * rad)];
  const va = toVec(a), vb = toVec(b);
  const dot = Math.min(1, Math.max(-1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]));
  const w = Math.acos(dot);
  if (w < 1e-6) return [[a.lat, a.lon], [b.lat, b.lon]];
  const pts = [];
  let prevLon = null;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const s1 = Math.sin((1 - t) * w) / Math.sin(w), s2 = Math.sin(t * w) / Math.sin(w);
    const x = s1 * va[0] + s2 * vb[0], y = s1 * va[1] + s2 * vb[1], z = s1 * va[2] + s2 * vb[2];
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) / rad;
    let lon = Math.atan2(y, x) / rad;
    if (prevLon != null) {
      while (lon - prevLon > 180) lon -= 360;
      while (lon - prevLon < -180) lon += 360;
    }
    prevLon = lon;
    pts.push([lat, lon]);
  }
  return pts;
};

// "ATH → EWR" for the big label, "Athens to Newark" for the line under it
RTT.codes = (t) => (t.from === t.to ? RTT.esc(t.from) + " &#8635;" : RTT.esc(t.from) + " &rarr; " + RTT.esc(t.to));
RTT.cities = (t) => (t.from === t.to
  ? "Around the world from " + RTT.esc(RTT.cityName(t.from))
  : RTT.esc(RTT.cityName(t.from)) + " to " + RTT.esc(RTT.cityName(t.to)));

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

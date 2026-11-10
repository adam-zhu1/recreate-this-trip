// Turning a pasted link into something we can look up.
RTT.links = {};

// Handles watch?v=, youtu.be/, /shorts/, /embed/, /live/, m. and music. hosts.
RTT.links.youtubeId = function (text) {
  let url;
  try {
    url = new URL(text.trim().startsWith("http") ? text.trim() : "https://" + text.trim());
  } catch (e) {
    return null;
  }
  const host = url.hostname.replace(/^(www|m|music)\./, "");
  let id = null;
  if (host === "youtu.be") {
    id = url.pathname.slice(1).split("/")[0];
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else {
      const m = url.pathname.match(/^\/(shorts|embed|live|v)\/([^/?#]+)/);
      if (m) id = m[2];
    }
  }
  return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
};

// dailydrop.com/pages/<slug> trip write-ups embed the same videos
RTT.links.articleSlug = function (text) {
  try {
    const url = new URL(text.trim().startsWith("http") ? text.trim() : "https://" + text.trim());
    if (!/(^|\.)dailydrop\.com$/.test(url.hostname)) return null;
    const m = url.pathname.match(/\/pages\/([^/?#]+)/);
    return m ? m[1] : null;
  } catch (e) {
    return null;
  }
};

// YouTube's oEmbed endpoint allows browser requests and needs no API key.
// It gives the title, channel and thumbnail. (No description; that needs the Data API.)
RTT.links.oembed = async function (id) {
  const url = "https://www.youtube.com/oembed?format=json&url=" +
    encodeURIComponent("https://www.youtube.com/watch?v=" + id);
  const res = await fetch(url);
  if (!res.ok) throw new Error("YouTube said " + res.status);
  return res.json();
};

RTT.links.findTrip = function (text) {
  const trips = RTT.trips || [];
  const id = RTT.links.youtubeId(text);
  if (id) return { id, trip: trips.find((t) => t.youtube === id) || null };
  const slug = RTT.links.articleSlug(text);
  if (slug) return { slug, trip: trips.find((t) => t.article && t.article.includes(slug)) || null };
  return null;
};

// For videos I haven't added yet: guess the airline and cabin from the title.
// Plain keyword matching, nothing fancy, and the form lets you fix it.
RTT.links.guess = function (title) {
  const t = (title || "").toLowerCase();
  const airlines = [
    ["air france", "Air France"], ["emirates", "Emirates"], ["lufthansa", "Lufthansa"],
    ["etihad", "Etihad"], ["singapore", "Singapore Airlines"], ["qatar", "Qatar Airways"],
    ["cathay", "Cathay Pacific"], ["ana ", "ANA"], ["japan airlines", "Japan Airlines"], ["jal", "Japan Airlines"],
    ["swiss", "SWISS"], ["british airways", "British Airways"], ["united", "United"],
    ["delta", "Delta"], ["american airlines", "American Airlines"], ["korean air", "Korean Air"],
    ["turkish", "Turkish Airlines"], ["virgin", "Virgin Atlantic"], ["qantas", "Qantas"], ["eva air", "EVA Air"],
  ];
  const cabins = [
    ["la première", "First"], ["la premiere", "First"], ["first class", "First"], ["suite", "First"],
    ["residence", "First"], ["apartment", "First"], ["business class", "Business"], ["qsuite", "Business"],
    ["polaris", "Business"], ["premium economy", "Premium economy"], ["economy", "Economy"],
  ];
  const airline = (airlines.find(([k]) => t.includes(k)) || [])[1] || "";
  const cabin = (cabins.find(([k]) => t.includes(k)) || [])[1] || "";
  return { airline, cabin };
};

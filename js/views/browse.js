// Trips, the home page once you're in: a greeting with where your points
// stand, any routes you're watching, then every flight in the library.
RTT.views.trips = {
  title: "Trips",
  nav: "Trips",
  icon: "trips",
  order: 1,
  render(el) {
    const trips = (RTT.trips || []).slice().sort((a, b) => (b.published || "").localeCompare(a.published || ""));
    const filters = [
      ["all", "All", () => true],
      ["first", "First", (t) => t.cabin === "First"],
      ["business", "Business", (t) => t.cabin === "Business"],
    ];
    let current = "all";

    const u = RTT.auth && RTT.auth.user();
    const hour = new Date().getHours();
    const hello = (hour < 5 ? "Good evening" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening") +
      (u && u.id !== "demo" ? ", " + RTT.esc(u.name) : "");

    el.innerHTML = `
      <div class="page-head">
        <h1>${hello}</h1>
        <p class="muted">${RTT.parts.summary ? RTT.parts.summary() : ""}</p>
      </div>
      <div id="watch"></div>
      <div class="toolbar">
        ${trips.length ? `<div class="seg" id="seg" role="group" aria-label="Cabin"></div>` : "<span></span>"}
        <form class="paste" id="paste">
          <input id="link" type="url" inputmode="url" autocomplete="off" placeholder="Paste a YouTube link" aria-label="YouTube link" required>
          <button type="submit">Go</button>
        </form>
      </div>
      <div id="result"></div>
      ${trips.length ? `<div class="grid" id="list"></div>` : ""}
      <div id="adventures"></div>`;

    drawWatching(RTT.$("#watch", el), trips);
    RTT.parts.paste(RTT.$("#paste", el), RTT.$("#result", el));
    if (!trips.length) return;

    const draw = () => {
      RTT.$("#seg", el).innerHTML = filters.map(([k, label]) =>
        `<button type="button" class="${k === current ? "on" : ""}" data-k="${k}">${label}</button>`).join("");
      const shown = trips.filter(filters.find((f) => f[0] === current)[2]);
      RTT.$("#list", el).innerHTML = shown.map((t, i) => RTT.parts.tripRow(t, i)).join("");
      RTT.anim.scan(RTT.$("#list", el));
    };
    RTT.$("#seg", el).addEventListener("click", (e) => {
      const k = e.target.getAttribute("data-k");
      if (k && k !== current) { current = k; draw(); }
    });
    draw();

    if (RTT.adventures && RTT.adventures.length) {
      RTT.$("#adventures", el).innerHTML = `
        <h2>Off the plane</h2>
        <div class="rail">
          ${RTT.adventures.map((a) => `
            <a class="tcard" href="https://www.youtube.com/watch?v=${RTT.esc(a.youtube)}" target="_blank" rel="noopener">
              <div class="thumb"><img src="${RTT.thumb(a.youtube)}" alt="" loading="lazy"></div>
              <div class="r">${RTT.esc(a.short)}</div>
            </a>`).join("")}
        </div>`;
    }
  },
};

// "305,000 points across 4 cards. 2 trips you can book now."
RTT.parts.summary = function () {
  const bal = RTT.load("balances", {}) || {};
  const banks = Object.keys(RTT.banks || {}).filter((b) => bal[b] > 0);
  const total = banks.reduce((a, b) => a + bal[b], 0);
  if (!total) return `Add your card balances on <a href="#/points">Points</a> to see which trips you can book.`;
  const ready = RTT.reach ? (RTT.trips || []).filter((t) => t.points && RTT.reach(t, bal).pct >= 100).length : 0;
  return `<a href="#/points">${RTT.fmt(total)} points</a> across ${banks.length} ${banks.length === 1 ? "card" : "cards"}. ` +
    (ready ? `${ready} ${ready === 1 ? "trip" : "trips"} you can book now.` : "Not enough for any priced trip yet.");
};

// Routes you're watching, as one quiet strip. Only shows when there are some.
function drawWatching(el, trips) {
  const list = (RTT.load("watching", []) || [])
    .map((w) => ({ ...w, t: trips.find((t) => w && t.id === w.trip) }))
    .filter((w) => w.t);
  if (!list.length) return;
  el.innerHTML = `
    <div class="watching">
      <span class="w-label">Seat alerts</span>
      <div class="w-list">${list.map((w) => `
        <a href="#/trip/${w.t.id}"><b>${RTT.esc(w.t.from)} &rarr; ${RTT.esc(w.t.to)}</b> <span>${RTT.esc(String(w.when || "").toLowerCase())}</span></a>`).join("")}
      </div>
      <span class="w-note">Preview only. There's no live seat data behind this.</span>
    </div>`;
}

// Short label for what a trip cost: "85k miles", "Cash", or nothing.
RTT.costPill = function (t) {
  if (t.program === "cash") return "Cash";
  if (t.points == null) return "";
  return (t.points >= 1000 ? Math.round(t.points / 1000) + "k" : t.points) + " miles";
};

// One trip as a card: the video thumbnail does most of the talking.
RTT.parts.tripRow = function (t, i) {
  const pill = RTT.costPill(t);
  // with balances on the Points tab, show how close you are
  const bal = RTT.load("balances", {}) || {};
  const r = RTT.reach && t.points && Object.keys(bal).length ? RTT.reach(t, bal) : null;
  return `
    <a class="tcard" href="#/trip/${t.id}">
      <div class="thumb"><img src="${RTT.thumb(t.youtube)}" alt="" loading="lazy">${pill ? `<span class="pill">${pill}</span>` : ""}</div>
      <div class="r">${RTT.codes(t)}</div>
      <div class="a">${RTT.cities(t)}</div>
      <div class="a">${RTT.esc(t.airline)} ${RTT.esc(t.cabin)}</div>
      ${r ? `<div class="st ${r.pct >= 100 ? "ok" : ""}">${r.pct >= 100 ? "You can book this" : r.pct + "% of the way there"}</div>` : ""}
    </a>`;
};

// Paste box: a video in the library opens its page; anything else gets a preview and a short form.
RTT.parts.paste = function (form, out) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = RTT.$("input", form).value;
    const found = RTT.links.findTrip(text);
    if (!found) { out.innerHTML = `<p class="error">That isn't a YouTube link.</p>`; return; }
    if (found.trip && RTT.views.trip) { location.hash = "#/trip/" + found.trip.id; return; }
    if (!found.id) { out.innerHTML = `<p class="error">Not added yet. Try the YouTube link.</p>`; return; }
    out.innerHTML = `<p class="muted small">Looking it up...</p>`;
    try {
      const info = await RTT.links.oembed(found.id);
      out.innerHTML = `
        <div class="panel">
          <div class="head">
            <img src="${RTT.esc(info.thumbnail_url)}" alt="">
            <div><b>${RTT.esc(info.title)}</b><div class="small muted">${RTT.esc(info.author_name)}</div></div>
          </div>
          <div id="unknown"></div>
        </div>`;
      if (RTT.parts.unknownTrip) RTT.parts.unknownTrip(RTT.$("#unknown", out), found.id, info);
    } catch (err) {
      out.innerHTML = `<p class="error">Couldn't load that video. Is it public?</p>`;
    }
  });
};

// Trips: every flight in the library as a card, a filter, and a paste box.
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

    el.innerHTML = `
      <div class="page-head">
        <div><h1>Trips</h1><p class="muted">${trips.length ? trips.length + " flights from their videos" : "Paste one of their videos to start"}</p></div>
        <form class="paste" id="paste">
          <input id="link" type="url" inputmode="url" autocomplete="off" placeholder="Paste a YouTube link" aria-label="YouTube link" required>
          <button type="submit">Go</button>
        </form>
      </div>
      <div id="result"></div>
      ${trips.length ? `<div class="seg" id="seg"></div><div class="grid" id="list"></div>` : ""}
      <div id="adventures"></div>`;

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

// Short label for what a trip cost: "85k miles", "Cash", or nothing.
RTT.costPill = function (t) {
  if (t.program === "cash") return "Cash";
  if (t.points == null) return "";
  return (t.points >= 1000 ? Math.round(t.points / 1000) + "k" : t.points) + " miles";
};

// One trip as a card: the video thumbnail does most of the talking.
RTT.parts.tripRow = function (t, i) {
  const pill = RTT.costPill(t);
  // with balances in the wallet, show how close you are
  const bal = RTT.load("balances", {});
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

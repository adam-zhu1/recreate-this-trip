// The Trips tab: every trip in the library, filters, and a paste box.
RTT.views.trips = {
  title: "Their trips",
  nav: "Trips",
  order: 1,
  render(el) {
    const trips = (RTT.trips || []).slice().sort((a, b) => (b.published || "").localeCompare(a.published || ""));
    const filters = [
      ["all", "All", () => true],
      ["first", "First", (t) => t.cabin === "First"],
      ["business", "Business", (t) => t.cabin === "Business"],
      ["priced", "Price in the video", (t) => t.points != null],
    ];
    let current = "all";

    el.innerHTML = `
      <div class="listhead">
        <div>
          <h1>Their trips</h1>
          <p class="muted" style="margin:0">${trips.length ? trips.length + " flights from Kara and Nate's videos." : "Paste one of their videos to start."}</p>
        </div>
        <form class="paste-mini" id="paste">
          <input id="link" type="url" inputmode="url" autocomplete="off" placeholder="Paste a YouTube link" aria-label="YouTube link" required>
          <button type="submit">Go</button>
        </form>
      </div>
      <div id="result"></div>
      ${trips.length ? `<div class="chips" id="chips"></div>` : ""}
      <div class="triplist" id="list"></div>
      <div id="adventures"></div>`;

    RTT.parts.paste(RTT.$("#paste", el), RTT.$("#result", el));
    if (!trips.length) return;

    const draw = () => {
      RTT.$("#chips", el).innerHTML = filters.map(([k, label]) =>
        `<button type="button" class="chip ${k === current ? "on" : ""}" data-k="${k}">${label}</button>`).join("");
      const shown = trips.filter(filters.find((f) => f[0] === current)[2]);
      RTT.$("#list", el).innerHTML = shown.length
        ? shown.map((t, i) => RTT.parts.tripRow(t, i)).join("")
        : `<p class="empty">Nothing matches that.</p>`;
      RTT.anim.scan(RTT.$("#list", el));
    };
    RTT.$("#chips", el).addEventListener("click", (e) => {
      const k = e.target.getAttribute("data-k");
      if (k) { current = k; draw(); }
    });
    draw();

    if (RTT.adventures && RTT.adventures.length) {
      RTT.$("#adventures", el).innerHTML = `
        <h2>Not about points, still great</h2>
        <p class="muted small">A few non-flight videos I'd send anyone to first.</p>
        <div class="triplist">
          ${RTT.adventures.map((a, i) => `
            <a class="trow reveal" style="--i:${i}" href="https://www.youtube.com/watch?v=${RTT.esc(a.youtube)}" target="_blank" rel="noopener">
              <img src="${RTT.thumb(a.youtube)}" alt="" loading="lazy">
              <div><div class="r">${RTT.esc(a.short)}</div><div class="c">${RTT.esc(a.summary)}</div></div>
            </a>`).join("")}
        </div>`;
    }
  },
};

// One trip as a compact row. Used here, on the hub and under "more trips".
RTT.parts.tripRow = function (t, i) {
  const prog = RTT.programs && RTT.programs[RTT.tripProgram(t)];
  const route = t.from === t.to ? RTT.esc(t.from) + " around the world" : RTT.esc(t.from) + " &rarr; " + RTT.esc(t.to);
  const cost = t.program === "cash" ? "Paid cash"
    : t.points != null ? RTT.fmt(t.points) + " miles" + (t.taxes ? " + " + RTT.esc(t.taxes) : "")
    : "Price not in the video";
  const banks = prog && t.program !== "cash" ? Object.keys(prog.partners).map((b) => `<span class="mini">${RTT.esc(RTT.bankShort[b])}</span>`).join("") : "";
  return `
    <a class="trow reveal" style="--i:${Math.min(i || 0, 8)}" href="#/trip/${t.id}">
      <img src="${RTT.thumb(t.youtube)}" alt="" loading="lazy">
      <div>
        <div class="r">${route}</div>
        <div class="a">${RTT.esc(t.airline)} ${RTT.esc(t.cabin)}</div>
        <div class="c">${cost}</div>
        ${banks ? `<div style="margin-top:.3rem">${banks}</div>` : ""}
      </div>
    </a>`;
};

// Paste box behavior: library video -> its page; anything else -> preview + form.
RTT.parts.paste = function (form, out) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = RTT.$("input", form).value;
    const found = RTT.links.findTrip(text);
    if (!found) {
      out.innerHTML = `<p class="error">That doesn't look like a YouTube or dailydrop.com link.</p>`;
      return;
    }
    if (found.trip && RTT.views.trip) { location.hash = "#/trip/" + found.trip.id; return; }
    if (!found.id) {
      out.innerHTML = `<p class="error">I haven't added that article yet. Try the YouTube link for the same trip.</p>`;
      return;
    }
    out.innerHTML = `<p class="muted small">Looking it up...</p>`;
    try {
      const info = await RTT.links.oembed(found.id);
      out.innerHTML = `
        <div class="card enter" style="margin-bottom:1rem">
          <div style="display:flex;gap:.9rem;align-items:center">
            <img src="${RTT.esc(info.thumbnail_url)}" alt="" style="width:120px;border-radius:7px">
            <div><b>${RTT.esc(info.title)}</b><div class="small muted">${RTT.esc(info.author_name)}</div></div>
          </div>
          <div id="unknown"></div>
        </div>`;
      if (RTT.parts.unknownTrip) RTT.parts.unknownTrip(RTT.$("#unknown", out), found.id, info);
      else RTT.$("#unknown", out).innerHTML = `<p class="small muted" style="margin:.75rem 0 0">Trip details for this one aren't in yet.</p>`;
    } catch (err) {
      out.innerHTML = `<p class="error">Couldn't load that video (${RTT.esc(err.message)}). Is it public?</p>`;
    }
  });
};

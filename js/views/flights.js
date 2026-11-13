// My flights: a personal log drawn on a map.
RTT.views.flights = {
  title: "My flights",
  nav: "My flights",
  order: 2,
  render(el) {
    let flights = RTT.load("flights", []);

    el.innerHTML = `
      <div class="page-head"><div><h1>My flights</h1><p class="muted">Every flight you've taken, on one map.</p></div></div>
      <section class="mapband"><div id="map"></div><span class="sample" id="sample" hidden>Example</span><div id="layers"></div></section>
      <div id="stats"></div>
      <form class="addrow" id="add">
        <input name="from" type="text" maxlength="3" placeholder="From" aria-label="From airport" list="codes" autocomplete="off" required>
        <span class="to">&rarr;</span>
        <input name="to" type="text" maxlength="3" placeholder="To" aria-label="To airport" list="codes" autocomplete="off" required>
        <input name="date" type="text" placeholder="When (optional)" aria-label="When">
        <button type="submit">Add flight</button>
      </form>
      <p class="error" id="err" hidden></p>
      <ul class="log" id="log"></ul>
      <datalist id="codes"></datalist>`;

    if (!window.L) {
      RTT.$("#map", el).innerHTML = "<p class='muted' style='padding:20px'>The map didn't load.</p>";
      return;
    }

    const map = L.map(RTT.$("#map", el), { worldCopyJump: true, minZoom: 1, scrollWheelZoom: false, zoomControl: false }).setView([30, -40], 2);
    // Esri's light gray canvas: free with attribution, no key, quiet enough that the routes stand out
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
      attribution: "Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors",
      maxZoom: 10,
    }).addTo(map);
    const mine = L.layerGroup().addTo(map);

    // 3000+ airports is too many for a datalist, so fill it as people type
    const codes = RTT.$("#codes", el);
    el.addEventListener("input", (e) => {
      if (e.target.list !== codes) return;
      const q = e.target.value.trim().toUpperCase();
      if (q.length < 2) { codes.innerHTML = ""; return; }
      codes.innerHTML = (RTT.airportRows || [])
        .filter((r) => r[0].startsWith(q) || (q.length > 2 && r[2].toUpperCase().startsWith(q)))
        .slice(0, 12)
        .map((r) => `<option value="${r[0]}">${RTT.esc(RTT.cityName(r[0]))}, ${RTT.esc(r[1])}</option>`).join("");
    });

    const SAMPLE = [{ from: "PIT", to: "ORD" }, { from: "ORD", to: "CDG" }, { from: "CDG", to: "MIA" }];

    function draw(animate) {
      mine.clearLayers();
      const empty = !flights.length;
      const list = empty ? SAMPLE : flights;
      RTT.$("#sample", el).hidden = !empty;
      const bounds = [];
      list.forEach((f, idx) => {
        const a = RTT.airport(f.from), b = RTT.airport(f.to);
        if (!a || !b) return;
        const line = RTT.arc(a, b);
        const pl = L.polyline(line, { color: "#2a2f3a", weight: 2.2, opacity: empty ? 0.35 : 0.9 }).addTo(mine);
        if (animate === "all" || (animate === "newest" && idx === 0)) RTT.anim.drawLine(pl);
        // put the dots on the line's own ends so Pacific crossings stay in one piece
        [[a, line[0]], [b, line[line.length - 1]]].forEach(([p, ll]) => {
          L.circleMarker(ll, { radius: 4, color: "#2a2f3a", weight: 1.2, fillColor: "#fff", fillOpacity: 1, opacity: empty ? 0.4 : 1 })
            .bindTooltip(p.code + ", " + RTT.cityName(p.code)).addTo(mine);
        });
        bounds.push(...line);
      });
      if (bounds.length) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 5 });

      RTT.$("#log", el).innerHTML = flights.map((f, i) => {
        const a = RTT.airport(f.from), b = RTT.airport(f.to);
        return `<li><div><div class="r">${RTT.esc(f.from)} &rarr; ${RTT.esc(f.to)}</div>
          <div class="m">${RTT.esc(RTT.cityName(f.from))} to ${RTT.esc(RTT.cityName(f.to))}, ${RTT.fmt(RTT.miles(a, b))} miles${f.date ? ", " + RTT.esc(f.date) : ""}</div></div>
          <button class="x" data-i="${i}" aria-label="Remove flight">&times;</button></li>`;
      }).join("");

      if (RTT.parts.flightStats) RTT.parts.flightStats(RTT.$("#stats", el), flights);
    }

    RTT.$("#add", el).addEventListener("submit", (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const from = String(f.get("from")).trim().toUpperCase();
      const to = String(f.get("to")).trim().toUpperCase();
      const err = RTT.$("#err", el);
      const bad = [from, to].filter((c) => !RTT.airport(c));
      if (bad.length || from === to) {
        err.textContent = bad.length ? "Unknown airport code: " + bad.join(", ") : "From and To are the same airport.";
        err.hidden = false;
        return;
      }
      err.hidden = true;
      flights.unshift({ from, to, date: String(f.get("date") || "").trim() });
      RTT.save("flights", flights);
      e.target.reset();
      e.target.from.focus();
      draw("newest");
    });

    RTT.$("#log", el).addEventListener("click", (e) => {
      const i = e.target.getAttribute("data-i");
      if (i == null) return;
      flights.splice(Number(i), 1);
      RTT.save("flights", flights);
      draw();
    });

    if (RTT.parts.knLayer) RTT.parts.knLayer(RTT.$("#layers", el), map);
    // Leaflet measures its box on creation; let layout settle, then draw
    setTimeout(() => { map.invalidateSize(); draw("all"); }, 60);
  },
};

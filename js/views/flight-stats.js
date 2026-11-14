// Totals above the map, plus an optional layer with the library's flights.
RTT.parts.flightStats = function (el, flights) {
  let miles = 0;
  const airports = new Set(), countries = new Set();
  for (const f of flights) {
    const a = RTT.airport(f.from), b = RTT.airport(f.to);
    if (!a || !b) continue;
    const d = RTT.miles(a, b);
    miles += d;
    airports.add(a.code); airports.add(b.code);
    countries.add(a.country); countries.add(b.country);
  }
  // rough air time: ~500 mph cruise plus half an hour each for taxi, climb and landing
  const hours = flights.length ? miles / 500 + flights.length * 0.5 : 0;
  const laps = miles / 24901; // Earth's circumference in miles
  el.innerHTML = `
    <div class="stats">
      <div><b data-v="${flights.length}">0</b><span>flights</span></div>
      <div><b data-v="${Math.round(miles)}">0</b><span>miles${laps >= 0.1 ? ", " + laps.toFixed(1) + " times around Earth" : ""}</span></div>
      <div><b data-v="${Math.round(hours)}">0</b><span>hours in the air</span></div>
      <div><b data-v="${countries.size}">0</b><span>${countries.size === 1 ? "country" : "countries"}</span></div>
    </div>`;
  el.querySelectorAll("[data-v]").forEach((b) => RTT.anim.count(b, Number(b.getAttribute("data-v")), 800));
};

RTT.parts.knLayer = function (el, map) {
  const trips = (RTT.trips || []).filter((t) => RTT.stops(t).every((c) => RTT.airport(c)));
  if (!trips.length) return;
  const layer = L.layerGroup();
  for (const t of trips) {
    const s = RTT.stops(t).map(RTT.airport);
    for (let i = 1; i < s.length; i++) {
      L.polyline(RTT.arc(s[i - 1], s[i]), { color: "#c98a00", weight: 1.8, opacity: 0.9, dashArray: "4 5" })
        .bindTooltip(`${t.airline} ${t.cabin}: ${RTT.stops(t).join(" → ")}`)
        .on("click", () => (location.hash = "#/trip/" + t.id))
        .addTo(layer);
    }
  }
  const on = RTT.load("knLayer", false);
  el.innerHTML = `<label class="kn"><input type="checkbox" id="kn" ${on ? "checked" : ""}> Kara and Nate's trips</label>`;
  if (on) layer.addTo(map);
  RTT.$("#kn", el).addEventListener("change", (e) => {
    if (e.target.checked) layer.addTo(map); else map.removeLayer(layer);
    RTT.save("knLayer", e.target.checked);
  });
};

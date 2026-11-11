// The trip page. Library trips (#/trip/<id>) and ones people type in (#/custom?...).
RTT.views.trip = {
  title: "Trip",
  tab: "trips",
  render(el, args) {
    const trip = (RTT.trips || []).find((t) => t.id === args[0]);
    if (!trip) {
      el.innerHTML = `<a class="back" href="#/trips">&larr; Trips</a><h1>Trip not found</h1>`;
      return;
    }
    document.title = trip.airline + " " + trip.cabin + " · Recreate This Trip";
    drawTrip(el, trip);
  },
};

RTT.views.custom = {
  title: "Your trip",
  tab: "trips",
  render(el, args, q) {
    drawTrip(el, {
      id: "custom", custom: true,
      youtube: q.get("v") || "", title: q.get("title") || "",
      airline: q.get("airline") || "", cabin: q.get("cabin") || "",
      from: (q.get("from") || "").toUpperCase(), to: (q.get("to") || "").toUpperCase(),
      program: q.get("program") || "",
      points: q.get("points") ? Number(q.get("points")) : null,
    });
  },
};

function drawTrip(el, trip) {
  const progKey = RTT.tripProgram(trip);
  const prog = RTT.programs && RTT.programs[progKey];
  const cash = trip.program === "cash";
  const title = trip.from && trip.to ? RTT.codes(trip) : RTT.esc(trip.title || "Your trip");
  const sub = [trip.airline, trip.cabin].filter(Boolean).join(" ") + (trip.published ? ", " + RTT.month(trip.published) : "");

  let figure;
  if (cash) {
    figure = `<div class="big word">Paid cash</div>${trip.cashPrice ? `<div class="unit">${RTT.esc(trip.cashPrice)}</div>` : ""}`;
  } else if (trip.points != null) {
    figure = `<div class="big"><span data-count="${trip.points}">0</span></div>
      <div class="unit"><b>${RTT.esc(prog ? prog.name : "")}</b> miles${trip.taxes ? " + " + RTT.esc(trip.taxes) : ""}</div>`;
  } else {
    figure = `<div class="big word">Price not shown</div>${prog ? `<div class="unit">Usually booked with <b>${RTT.esc(prog.name)}</b></div>` : ""}`;
  }

  const partners = prog && !cash ? Object.entries(prog.partners || {}) : [];
  const ratio = (r) => (r === 1 ? "" : `<small>1:${r}</small>`);

  el.innerHTML = `
    <a class="back" href="#/trips">&larr; Trips</a>
    <div class="trip-top">
      ${trip.youtube ? `
        <div class="video" id="video" role="button" aria-label="Play video" tabindex="0">
          <img src="${RTT.thumb(trip.youtube)}" alt=""><span class="play"></span>
        </div>` : ""}
      <div>
        <h1 class="codes">${title}</h1>
        ${trip.from && trip.to ? `<div class="cityline">${RTT.cities(trip)}</div>` : ""}
        <div class="sub">${RTT.esc(sub)}</div>
        ${figure}
        ${partners.length ? `<div class="from"><span class="l">Transfers from</span>${partners.map(([b, r]) =>
          `<span class="tag">${RTT.esc(RTT.bankShort[b])}${ratio(r)}</span>`).join("")}</div>` : ""}
      </div>
    </div>

    <div id="goal"></div>
    <div class="folds" id="folds"></div>
    <div id="related"></div>`;

  const video = RTT.$("#video", el);
  if (video) {
    const play = () => {
      video.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${RTT.esc(trip.youtube)}?autoplay=1"
        title="${RTT.esc(trip.title || "video")}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    };
    video.addEventListener("click", play, { once: true });
    video.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); play(); } });
  }

  if (RTT.parts.goal) RTT.parts.goal(RTT.$("#goal", el), trip);
  drawFolds(RTT.$("#folds", el), trip, prog);
  if (!trip.custom) drawRelated(RTT.$("#related", el), trip);
}

function drawFolds(el, trip, prog) {
  const cash = trip.program === "cash";
  const dist = RTT.tripMiles(trip);
  const stops = RTT.stops(trip);
  const fold = (title, body, id) => `<details class="fold"${id ? ` id="${id}"` : ""}><summary>${title}</summary><div>${body}</div></details>`;
  let html = "";

  if (prog && !cash) {
    html += fold("How to book it", `
      <ol class="howto">
        <li>Find award space on ${RTT.esc(prog.name)} for ${RTT.esc(trip.from)} to ${RTT.esc(trip.to)}.</li>
        <li>${Object.keys(prog.partners).length ? "Transfer your card points (it can't be undone)." : "Earn the miles directly. No big US card transfers here."}</li>
        <li>Book on the ${RTT.esc(prog.name)} site${trip.taxes ? ` and pay the taxes (they paid ${RTT.esc(trip.taxes)})` : ""}.</li>
      </ol>
      <p class="small muted" style="margin:12px 0 0">Prices are from the video and change often.</p>`);
  }

  html += `<div id="alert"></div>`;

  const facts = [
    trip.program && !cash ? ["Booked with", (prog ? prog.name : trip.program) + (trip.confidence === "LIKELY" ? " (likely)" : "")] : null,
    trip.aircraft ? ["Plane", trip.aircraft] : null,
    trip.cashPrice && !cash ? ["Ticket worth", trip.cashPrice] : null,
    dist ? ["Distance", RTT.fmt(dist) + " miles" + (stops.length > 2 ? ", " + (stops.length - 1) + " flights" : "")] : null,
    stops.length > 2 ? ["Route", stops.join(" → ")] : null,
  ].filter(Boolean);
  const notes = [trip.highlight, trip.note].filter(Boolean);
  if (facts.length || notes.length || (trip.sources || []).length) {
    html += fold("Trip details", `
      ${trip.from && trip.to ? `<div class="route">${RTT.anim.routeSvg(trip.from, trip.to, { h: 110 })}</div>` : ""}
      ${facts.length ? `<dl class="facts" style="margin-top:20px">${facts.map(([k, v]) => `<dt>${k}</dt><dd>${RTT.esc(v)}</dd>`).join("")}</dl>` : ""}
      ${notes.map((n) => `<p>${RTT.esc(n)}</p>`).join("")}
      ${(trip.sources || []).length ? `<p class="small muted">Sources: ${trip.sources.map((s, i) =>
        `<a href="${RTT.esc(s)}" target="_blank" rel="noopener">${i + 1}</a>`).join(", ")}</p>` : ""}`, "details");
  }
  el.innerHTML = html;

  if (RTT.parts.alert) RTT.parts.alert(RTT.$("#alert", el), trip);
  const det = RTT.$("#details", el);
  if (det) det.addEventListener("toggle", () => { if (det.open) RTT.anim.fly(RTT.$("svg", det), 1600); });
}

function drawRelated(el, trip) {
  if (!RTT.parts.tripRow) return;
  const others = (RTT.trips || []).filter((t) => t.id !== trip.id);
  const score = (t) => (t.airline === trip.airline ? 2 : 0) + (t.cabin === trip.cabin ? 1 : 0) + (t.points != null ? 0.5 : 0);
  const pick = others.sort((a, b) => score(b) - score(a)).slice(0, 3);
  if (!pick.length) return;
  el.innerHTML = `<h2>More trips</h2><div class="grid">${pick.map((t, i) => RTT.parts.tripRow(t, i)).join("")}</div>`;
}

// Short form for videos that aren't in the library yet
RTT.parts.unknownTrip = function (el, id, info) {
  const g = RTT.links.guess(info.title);
  const progOptions = Object.entries(RTT.programs || {})
    .filter(([k]) => k !== "cash")
    .map(([k, p]) => `<option value="${k}">${RTT.esc(p.name)}</option>`).join("");
  el.innerHTML = `
    <form id="manual" class="balances">
      <div><label>From</label><input name="from" type="text" maxlength="3" placeholder="JFK" required></div>
      <div><label>To</label><input name="to" type="text" maxlength="3" placeholder="CDG" required></div>
      <div><label>Airline</label><input name="airline" type="text" value="${RTT.esc(g.airline)}"></div>
      <div><label>Cabin</label><input name="cabin" type="text" value="${RTT.esc(g.cabin)}"></div>
      <div><label>Program</label><select name="program"><option value="">Not sure</option>${progOptions}</select></div>
      <div><label>Points</label><input name="points" type="number" min="0" step="500"></div>
      <button type="submit">Build it</button>
    </form>
    <p class="error" id="merr" hidden></p>`;
  RTT.$("#manual", el).addEventListener("submit", (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const from = String(f.get("from")).trim().toUpperCase(), to = String(f.get("to")).trim().toUpperCase();
    const bad = [from, to].filter((c) => !RTT.airport(c));
    if (RTT.airportRows && bad.length) {
      const m = RTT.$("#merr", el);
      m.textContent = "Unknown airport code: " + bad.join(", ");
      m.hidden = false;
      return;
    }
    const q = new URLSearchParams({ v: id, title: info.title });
    for (const [k, v] of f.entries()) if (v) q.set(k, k === "from" || k === "to" ? String(v).trim().toUpperCase() : v);
    location.hash = "#/custom?" + q.toString();
  });
};

// How far a set of balances gets you toward a trip: every partner bank's
// points converted at its ratio, plus miles already in the airline program.
RTT.reach = function (trip, balances) {
  const key = RTT.tripProgram(trip), prog = RTT.programs && RTT.programs[key];
  if (!prog || key === "cash" || !trip.points) return { pct: 0, total: 0 };
  let total = balances[key] || 0;
  for (const [b, r] of Object.entries(prog.partners)) total += (balances[b] || 0) * r;
  return { total, pct: Math.min(100, Math.floor((total / trip.points) * 100)) };
};

// "Your points": tap the cards you have, type the balances, and see how
// close you are plus the transfers that get you there.
RTT.parts.goal = function (el, trip) {
  const progKey = RTT.tripProgram(trip);
  const prog = RTT.programs && RTT.programs[progKey];
  if (!prog || progKey === "cash") return;

  const balances = RTT.load("balances", {});
  const mine = new Set(RTT.load("cards", []));
  const target = trip.points;

  // "direct" = miles already sitting in this airline program
  const sources = [
    ...Object.entries(prog.partners).map(([b, r]) => ({ key: b, label: RTT.banks[b], short: RTT.bankShort[b], ratio: r })),
    { key: "direct", label: prog.name, short: "Airline miles", ratio: 1 },
  ];
  const balKey = (k) => (k === "direct" ? progKey : k);

  el.innerHTML = `
    <section class="calc">
      <h2>Your points</h2>
      <div class="chips" id="cards">
        ${sources.map((s) => `<button type="button" class="chip ${mine.has(s.key) ? "on" : ""}" data-k="${s.key}">${RTT.esc(s.short)}</button>`).join("")}
      </div>
      <div class="collapse" id="box"><div>
        <div class="balances" id="inputs"></div>
        ${target == null ? `<div class="balances"><div><label>Miles needed (your guess)</label>
          <input type="number" id="target" min="0" step="1000" placeholder="100000"></div></div>` : ""}
        <div id="progress"></div>
        <div class="saved">Saved on this device only.</div>
      </div></div>
    </section>`;

  function drawInputs() {
    const chosen = sources.filter((s) => mine.has(s.key));
    RTT.$("#inputs", el).innerHTML = chosen.map((s) => `
      <div><label>${RTT.esc(s.label)}</label>
      <input type="number" min="0" step="1000" data-b="${s.key}" value="${balances[balKey(s.key)] || ""}" placeholder="0"></div>`).join("");
    RTT.$("#box", el).classList.toggle("open", chosen.length > 0);
  }

  let lastPct = 0;
  function update() {
    const need = target != null ? target : Number((RTT.$("#target", el) || {}).value);
    const out = RTT.$("#progress", el);
    if (!need || !mine.size) { out.innerHTML = ""; lastPct = 0; return; }

    // Airline miles first (no transfer), then the biggest bank balances.
    const have = sources
      .filter((s) => mine.has(s.key) && balances[balKey(s.key)] > 0)
      .map((s) => ({ ...s, raw: balances[balKey(s.key)], miles: balances[balKey(s.key)] * s.ratio }))
      .sort((a, b) => (a.key === "direct" ? -1 : b.key === "direct" ? 1 : b.miles - a.miles));

    let got = 0;
    const steps = [];
    for (const s of have) {
      if (got >= need) break;
      const use = Math.min(s.miles, need - got);
      got += use;
      if (s.key === "direct") steps.push(`Use ${RTT.fmt(use)} airline miles you already have`);
      else {
        const pts = Math.min(s.raw, Math.ceil(use / s.ratio / 1000) * 1000); // transfers go in 1,000s
        steps.push(`Move <b>${RTT.fmt(pts)}</b> ${RTT.esc(s.short)} points${s.ratio !== 1 ? ` &rarr; ${RTT.fmt(pts * s.ratio)} miles` : ""}`);
      }
    }
    const total = have.reduce((a, s) => a + s.miles, 0);
    const pct = Math.min(100, Math.floor((total / need) * 100));
    const short = Math.max(0, need - total);

    out.innerHTML = `
      <div class="result">
        <div class="pct" id="pct">${lastPct}%</div>
        <div>
          <div class="meter ${pct >= 100 ? "done" : ""}"><div style="width:${lastPct}%"></div></div>
          <p>${short > 0 ? RTT.fmt(short) + " miles short" : "You have enough"}</p>
        </div>
        ${steps.length ? `<ol class="tsteps">${steps.map((s) => `<li>${s}</li>`).join("")}</ol>` : ""}
      </div>`;

    const bar = RTT.$(".meter > div", out), label = RTT.$("#pct", out);
    requestAnimationFrame(() => requestAnimationFrame(() => (bar.style.width = pct + "%")));
    const from = lastPct;
    RTT.anim.count(label, pct - from, 700, (v) => Math.round(from + v) + "%");
    if (pct === from) label.textContent = pct + "%";
    lastPct = pct;
  }

  RTT.$("#cards", el).addEventListener("click", (e) => {
    const k = e.target.getAttribute("data-k");
    if (!k) return;
    mine.has(k) ? mine.delete(k) : mine.add(k);
    e.target.classList.toggle("on");
    // remember card picks across trips (the "direct" chip is per program, don't save it)
    RTT.save("cards", [...mine].filter((x) => x !== "direct"));
    drawInputs();
    update();
  });
  el.addEventListener("input", (e) => {
    const b = e.target.getAttribute("data-b");
    if (b) { balances[balKey(b)] = Number(e.target.value) || 0; RTT.save("balances", balances); }
    update();
  });
  drawInputs();
  update();
};

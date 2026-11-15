// Points: your card balances on one side, every priced trip on the other,
// ranked by how close those balances get you. Everything updates as you type.
RTT.views.points = {
  title: "Points",
  nav: "Points",
  icon: "points",
  order: 3,
  render(el) {
    const bal = RTT.load("balances", {}) || {};
    const banks = Object.keys(RTT.banks || {});
    const partners = (b) => Object.values(RTT.programs || {}).filter((p) => p.partners && p.partners[b]).length;
    const priced = (RTT.trips || []).filter((t) => t.points && t.program !== "cash" && RTT.programs[RTT.tripProgram(t)]);
    const unpriced = (RTT.trips || []).filter((t) => !t.points && t.program !== "cash" && RTT.programs[RTT.tripProgram(t)]);

    el.innerHTML = `
      <div class="page-head">
        <h1>Points</h1>
        <p class="muted">Every trip uses these balances. Change one and the trip list moves with it.</p>
      </div>
      <div class="points">
        <section class="panel-card banks">
          <div class="total">
            <span class="muted small">Total points</span>
            <b id="tot" class="num">0</b>
            <div class="split" id="split"></div>
          </div>
          ${banks.map((b) => `
            <div class="wrow">
              <span class="logo l-${b}">${RTT.esc(RTT.bankShort[b][0])}</span>
              <div class="wname"><b>${RTT.esc(RTT.banks[b])}</b><small>${partners(b)} airline partners</small></div>
              <input type="number" inputmode="numeric" min="0" step="1000" data-b="${b}" value="${bal[b] || ""}" placeholder="0" aria-label="${RTT.esc(RTT.banks[b])} balance">
            </div>`).join("")}
          <p class="saved">Saved on this device only.</p>
        </section>

        <section class="panel-card ranked">
          <div class="card-head"><h3>Trips by how close you are</h3><span class="muted small" id="ready"></span></div>
          <ul class="reach" id="reach"></ul>
          ${unpriced.length ? `
            <div class="card-head sub"><h3>No price in the video</h3></div>
            <ul class="maxes" id="maxes"></ul>` : ""}
        </section>
      </div>`;

    let shown = 0;
    const lastPct = {};
    function draw() {
      const sum = banks.reduce((a, b) => a + (bal[b] || 0), 0);
      const from = shown;
      RTT.anim.count(RTT.$("#tot", el), sum - from, 500, (v) => RTT.fmt(from + v));
      if (sum === from) RTT.$("#tot", el).textContent = RTT.fmt(sum);
      shown = sum;
      RTT.$("#split", el).innerHTML = sum ? banks.filter((b) => bal[b] > 0).map((b) =>
        `<span class="l-${b}" style="flex:${bal[b]}" title="${RTT.esc(RTT.bankShort[b])}"></span>`).join("") : "";

      const scored = priced.map((t) => ({ t, ...RTT.reach(t, bal) })).sort((a, b) => b.pct - a.pct || a.t.points - b.t.points);
      const ready = scored.filter((s) => s.pct >= 100).length;
      RTT.$("#ready", el).textContent = ready ? `${ready} of ${scored.length} in reach` : "";
      RTT.$("#reach", el).innerHTML = scored.map((s) => {
        const short = Math.max(0, s.t.points - s.total);
        const prog = RTT.programs[RTT.tripProgram(s.t)];
        return `
          <li><a href="#/trip/${s.t.id}">
            <img src="${RTT.thumb(s.t.youtube)}" alt="" loading="lazy">
            <div class="rc">
              <div class="rt"><b>${RTT.codes(s.t)}</b><span class="num">${s.pct}%</span></div>
              <div class="meter ${s.pct >= 100 ? "done" : ""}"><div style="width:${lastPct[s.t.id] || 0}%" data-w="${s.pct}"></div></div>
              <small>${RTT.esc(s.t.airline)} ${RTT.esc(s.t.cabin)}, ${RTT.fmt(s.t.points)} ${RTT.esc(prog.name)} miles</small>
              <small class="${short ? "" : "ok"}">${short ? RTT.fmt(short) + " miles short" : "You can book this"}</small>
            </div></a></li>`;
      }).join("");
      scored.forEach((s) => (lastPct[s.t.id] = s.pct));
      requestAnimationFrame(() => requestAnimationFrame(() =>
        el.querySelectorAll("[data-w]").forEach((d) => (d.style.width = d.getAttribute("data-w") + "%"))));

      const maxes = RTT.$("#maxes", el);
      if (maxes) {
        maxes.innerHTML = unpriced.map((t) => {
          const prog = RTT.programs[RTT.tripProgram(t)];
          const r = RTT.reach(Object.assign({}, t, { points: 1 }), bal);
          return `<li><a href="#/trip/${t.id}"><b>${RTT.codes(t)}</b><span>${RTT.esc(t.airline)} ${RTT.esc(t.cabin)}</span>
            <span class="num">${r.total ? "Up to " + RTT.fmt(r.total) + " " + RTT.esc(prog.name) + " miles" : "None of your cards transfer here"}</span></a></li>`;
        }).join("");
      }
    }

    el.addEventListener("input", (e) => {
      const b = e.target.getAttribute("data-b");
      if (!b) return;
      bal[b] = Math.max(0, Number(e.target.value) || 0);
      RTT.save("balances", bal);
      // the card picker on trip pages follows these balances
      const cards = new Set(RTT.load("cards", []) || []);
      bal[b] > 0 ? cards.add(b) : cards.delete(b);
      RTT.save("cards", [...cards]);
      draw();
    });
    draw();
  },
};

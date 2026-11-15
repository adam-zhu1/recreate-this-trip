// The front page: what this is, three things it does, who made it, and a way in.
RTT.views.landing = {
  title: "",
  public: true,
  bare: true,
  render(el) {
    const trips = RTT.trips || [];
    const priced = trips.filter((t) => t.points && t.program && t.program !== "cash" && t.from !== t.to);
    const board = trips.filter((t) => t.from !== t.to)
      .sort((a, b) => (RTT.costPill && RTT.costPill(b) ? 1 : 0) - (RTT.costPill && RTT.costPill(a) ? 1 : 0)).slice(0, 5);
    const ex = priced[0];
    const cta = RTT.auth && RTT.auth.ok()
      ? `<a class="btn" href="#/trips">Back to your trips</a>`
      : `<a class="btn" href="#/demo">Try the demo</a>`;

    el.innerHTML = `
      <section class="hero">
        <div id="heromap"></div>
        <div class="hero-in wrap">
          <h1>Fly the trips Kara and Nate fly.</h1>
          <p class="lede">Pick a flight from their videos. See what it cost in points, and how close your own cards already get you.</p>
          <div class="cta">${cta}<button type="button" class="btn line-light" data-scroll="features">How it works</button></div>
          <p class="fanline">A fan project. Not affiliated with Kara and Nate or Daily Drop.</p>
        </div>
      </section>

      <section class="features wrap" id="features">
        <div class="feat">
          <div class="feat-text">
            <h2>Every trip, priced.</h2>
            <p>${trips.length || "Their"} flights from their videos, with the miles they paid and the program they booked with.</p>
          </div>
          <div class="feat-vis">
            <table class="board">
              <thead><tr><th>From</th><th>To</th><th>Airline</th><th class="n">Paid</th></tr></thead>
              <tbody>${board.map((t) => `
                <tr><td class="c">${RTT.esc(t.from)}</td><td class="c">${RTT.esc(t.to)}</td>
                <td>${RTT.esc(t.airline)}</td><td class="n">${(RTT.costPill && RTT.costPill(t)) || `<span class="dim">Not shown</span>`}</td></tr>`).join("")}
              </tbody>
            </table>
          </div>
        </div>

        <div class="feat">
          <div class="feat-text">
            <h2>Your points, one number.</h2>
            <p>Add your card balances once. Every trip shows how close you are and which transfers get you there.</p>
          </div>
          <div class="feat-vis">
            <div class="mock-card">
              <div class="mc-codes">${ex ? RTT.codes(ex) : "ATH &rarr; EWR"}</div>
              <div class="muted small">${ex ? RTT.esc(ex.airline + " " + ex.cabin) : "Emirates First"}, ${ex ? RTT.fmt(ex.points) : "85,000"} miles</div>
              <div class="mc-row"><span class="mc-pct">73%</span><div class="meter"><div style="width:73%"></div></div></div>
              <div class="mc-steps"><span>Move 30,000 Bilt points</span><span>Move 40,000 Amex points &rarr; 32,000 miles</span></div>
            </div>
          </div>
        </div>

        <div class="feat">
          <div class="feat-text">
            <h2>Your own flight map.</h2>
            <p>Log the flights you've taken and watch the map fill in, next to theirs.</p>
          </div>
          <div class="feat-vis">
            <svg class="arcs" viewBox="0 0 400 220" aria-hidden="true">
              <path d="M40 160 Q 120 40 210 120"/><path d="M210 120 Q 290 30 360 90"/><path class="theirs" d="M60 180 Q 200 60 330 170"/><path d="M210 120 Q 250 170 300 190"/>
              <circle cx="40" cy="160" r="4"/><circle cx="210" cy="120" r="4"/><circle cx="360" cy="90" r="4"/><circle cx="60" cy="180" r="4"/><circle cx="330" cy="170" r="4"/><circle cx="300" cy="190" r="4"/>
            </svg>
          </div>
        </div>
      </section>

      <section class="why wrap" id="why">
        <div class="why-note">
          <h2>Why I built this</h2>
          <p>I've watched Kara and Nate since 8th grade. Every time they fly something like Air France La Première,
          I end up asking the same thing: could I actually do that with my points? This is the tool I wanted for that question.</p>
          <p class="sig"><a href="https://adamzhu.dev">Adam Zhu</a></p>
        </div>
        <div class="why-real">
          <h3>What's real and what isn't</h3>
          <ul>
            <li>The ${trips.length} trips in the library, each checked against the video or a write-up. Sources are on every trip page.</li>
            <li>Transfer partners and all the math on your balances.</li>
            <li>Prices are what the videos showed at the time. Award prices move a lot.</li>
            <li>Seat alerts are a preview. There's no live seat data behind them.</li>
            <li>There's no server. Your balances and flights stay in your browser.</li>
          </ul>
        </div>
      </section>

      <section class="cta-band wrap">
        <h2>Take a look around.</h2>
        <p class="muted">No account needed. It opens with a few card balances filled in so there's something to see.</p>
        ${cta}
      </section>`;

    el.querySelector("[data-scroll]").addEventListener("click", () =>
      RTT.$("#features", el).scrollIntoView({ behavior: RTT.anim.calm() ? "auto" : "smooth" }));
    if (RTT.parts.hero) RTT.parts.hero(RTT.$("#heromap", el));
  },
};

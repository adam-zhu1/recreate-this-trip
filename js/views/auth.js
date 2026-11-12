// Demo sign in. There's no server: this only decides which screens to show
// and fills the account with sample data the first time. Not real security,
// and nothing here is private.
RTT.auth = {
  accounts: {
    demo: { pass: "demo", name: "Demo" },
    karaandnate: { pass: "firstclass", name: "Kara and Nate" },
  },
  user() {
    const s = RTT.load("session", null);
    const a = s && RTT.auth.accounts[s.user];
    return a ? { id: s.user, name: a.name } : null;
  },
  ok() { return !!RTT.auth.user(); },
  signIn(user, pass) {
    const id = String(user || "").trim().toLowerCase();
    const a = RTT.auth.accounts[id];
    if (!a || a.pass !== pass) return false;
    RTT.save("session", { user: id, at: Date.now() });
    if (!RTT.load("seeded", false)) RTT.auth.seed();
    return true;
  },
  out() {
    try { localStorage.removeItem("rtt.session"); } catch (e) { /* fine */ }
  },
  // Sample balances, the flights from the videos as a starting log, and two
  // example seat alerts. All of it can be edited or deleted in the app.
  seed() {
    if (!Object.keys(RTT.load("balances", {})).length) {
      RTT.save("balances", { chase: 120000, amex: 95000, capone: 60000, bilt: 30000 });
      RTT.save("cards", ["chase", "amex", "capone", "bilt"]);
    }
    if (!RTT.load("flights", []).length && RTT.trips && RTT.airportRows) {
      const log = [];
      const trips = RTT.trips.slice().sort((a, b) => (a.published || "").localeCompare(b.published || ""));
      for (const t of trips) {
        const s = RTT.stops(t);
        for (let i = 1; i < s.length; i++) {
          if (RTT.airport(s[i - 1]) && RTT.airport(s[i])) log.unshift({ from: s[i - 1], to: s[i], date: RTT.month(t.published) });
        }
      }
      RTT.save("flights", log);
    }
    if (!RTT.load("watching", []).length) {
      RTT.save("watching", [
        { trip: "emirates-first-90", when: "Next 11 months" },
        { trip: "air-france-la-premiere", when: "Summer" },
      ]);
    }
    RTT.save("seeded", true);
  },
};

RTT.views.login = {
  title: "Sign in",
  public: true,
  bare: true,
  render(el, args, q) {
    if (RTT.auth.ok()) { location.replace("#/" + (RTT.views.dashboard ? "dashboard" : "trips")); return; }
    const demo = q.get("demo") === "1";
    el.innerHTML = `
      <div class="auth">
        <form class="auth-card" id="f" novalidate>
          <h1>Sign in</h1>
          <div><label for="u">Username</label><input id="u" name="u" autocomplete="username" value="${demo ? "demo" : ""}" required></div>
          <div><label for="p">Password</label><input id="p" name="p" type="password" autocomplete="current-password" value="${demo ? "demo" : ""}" required></div>
          <p class="error" id="err" hidden>That username and password don't match.</p>
          <button type="submit">Sign in</button>
        </form>
        <div class="demo-hint">
          <span>Just looking? Use the demo account: <b>demo</b> / <b>demo</b></span>
          <button type="button" class="link" id="fill">Fill it in</button>
        </div>
      </div>`;

    const f = RTT.$("#f", el);
    RTT.$("#fill", el).addEventListener("click", () => { f.u.value = "demo"; f.p.value = "demo"; f.querySelector("button").focus(); });
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!RTT.auth.signIn(f.u.value, f.p.value)) {
        RTT.$("#err", el).hidden = false;
        f.classList.remove("shake"); void f.offsetWidth; f.classList.add("shake");
        return;
      }
      const next = q.get("next");
      location.hash = "#/" + (next || (RTT.views.dashboard ? "dashboard" : "trips"));
    });
    if (!demo) f.u.focus();
  },
};

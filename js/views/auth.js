// Demo accounts. There's no server: this only decides whose name goes on
// the greeting and fills the browser with starter data the first time.
// Not real security, and nothing here is private.
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
    if (!Object.keys(RTT.load("balances", {}) || {}).length) {
      RTT.save("balances", { chase: 120000, amex: 95000, capone: 60000, bilt: 30000 });
      RTT.save("cards", ["chase", "amex", "capone", "bilt"]);
    }
    if (!(RTT.load("flights", []) || []).length && RTT.trips && RTT.airportRows) {
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
    if (!(RTT.load("watching", []) || []).length) {
      RTT.save("watching", [
        { trip: "emirates-first-90", when: "Next 11 months" },
        { trip: "air-france-la-premiere", when: "Summer" },
      ]);
    }
    RTT.save("seeded", true);
  },
};

// One-click ways in. #/demo is what "Try the demo" opens; #/for/<name> is a
// personal link that opens a named account. Both seed the data on first use.
RTT.auth.links = { "kara-and-nate": ["karaandnate", "firstclass"] };

RTT.views.demo = {
  public: true,
  bare: true,
  render() {
    RTT.auth.signIn("demo", "demo");
    location.replace("#/trips");
  },
};

RTT.views.for = {
  public: true,
  bare: true,
  render(el, args) {
    const who = RTT.auth.links[args[0]];
    if (!who || !RTT.auth.signIn(who[0], who[1])) RTT.auth.signIn("demo", "demo");
    location.replace("#/trips");
  },
};

// Hash router and the one page frame: a slim top bar with three tabs once
// you're in (a bottom tab bar on phones), and the full-bleed front page.
(function () {
  const view = RTT.$("#view");
  const top = RTT.$("#top"), tabbar = RTT.$("#tabbar");

  const ICONS = {
    trips: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10.5 9.5 4 2.5-4 2.5z"/>',
    flights: '<circle cx="12" cy="12" r="9"/><path d="M3.5 9h17M3.5 15h17M12 3c-2.8 3-2.8 15 0 18M12 3c2.8 3 2.8 15 0 18"/>',
    points: '<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10h18M16 15h2"/>',
  };
  RTT.icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ""}</svg>`;

  // Old links from earlier versions of the site land somewhere sensible
  const MOVED = { login: "demo", dashboard: "trips", home: "trips", wallet: "points", about: "" };

  const tabs = () => Object.entries(RTT.views).filter(([, v]) => v.nav).sort((a, b) => a[1].order - b[1].order);
  const authed = () => !!(RTT.auth && RTT.auth.ok());

  function drawTop(active) {
    const u = RTT.auth && RTT.auth.user();
    const links = tabs().map(([name, v]) =>
      `<a href="#/${name}" class="${name === active ? "on" : ""}"${name === active ? ' aria-current="page"' : ""}>${RTT.icon(v.icon || name)}<span>${v.nav}</span></a>`).join("");
    const right = u
      ? `<button type="button" class="quiet" data-out>${u.id === "demo" ? "Exit demo" : "Sign out"}</button>`
      : `<a class="btn sm" href="#/demo">Try the demo</a>`;
    top.innerHTML = `
      <a class="brand" href="#/${u ? "trips" : ""}">Recreate this trip</a>
      ${u && active ? `<nav class="tabs" aria-label="Main">${links}</nav>` : ""}
      <div class="top-right">${right}</div>`;
    tabbar.innerHTML = u && active ? links : "";
    document.body.classList.toggle("has-tabs", !!(u && active));
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-out]") && RTT.auth) { RTT.auth.out(); location.hash = "#/"; }
  });

  function route() {
    const hash = location.hash.replace(/^#\/?/, "");
    const [path, query] = hash.split("?");
    const parts = path.split("/").filter(Boolean);
    if (parts[0] in MOVED) {
      location.replace("#/" + (parts[0] === "login" && authed() ? "trips" : MOVED[parts[0]]));
      return;
    }

    let name = parts[0] || "landing";
    if (!RTT.views[name]) name = authed() ? "trips" : "landing";
    const v = RTT.views[name];

    // Everything behind the front page is the demo, so a shared link to a
    // trip just opens it in the demo account instead of asking anyone to sign in.
    if (!v.public && !authed() && RTT.auth) RTT.auth.signIn("demo", "demo");

    const full = !!v.bare;
    document.body.dataset.mode = full ? "public" : "app";
    drawTop(full ? null : (v.tab || name));

    view.innerHTML = "";
    view.className = full ? "" : "wrap page";
    void view.offsetWidth;
    view.classList.add("enter");
    document.title = v.title ? v.title + " | Recreate This Trip" : "Recreate This Trip";
    v.render(view, parts.slice(1), new URLSearchParams(query || ""));
    if (RTT.anim) RTT.anim.scan(view);
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", route);
  route();
})();

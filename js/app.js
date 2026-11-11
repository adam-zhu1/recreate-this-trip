// Hash router plus the two page frames: the public one (landing, sign in,
// about) and the app one (sidebar on desktop, tab bar on phones).
(function () {
  const view = RTT.$("#view");
  const side = RTT.$("#side"), tabbar = RTT.$("#tabbar"), mtop = RTT.$("#mtop"), pnav = RTT.$("#pnav");

  const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    trips: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10.5 9.5 4 2.5-4 2.5z"/>',
    flights: '<circle cx="12" cy="12" r="9"/><path d="M3.5 9h17M3.5 15h17M12 3c-2.8 3-2.8 15 0 18M12 3c2.8 3 2.8 15 0 18"/>',
    wallet: '<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10h18M16 15h2"/>',
    about: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    out: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l4-4-4-4M14 12H4"/>',
  };
  RTT.icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ""}</svg>`;

  const brand = () => `<a class="brand" href="#/${RTT.views.dashboard ? "dashboard" : ""}">Recreate this trip</a>`;
  const tabs = () => Object.entries(RTT.views).filter(([, v]) => v.nav).sort((a, b) => a[1].order - b[1].order);
  const authed = () => !RTT.auth || RTT.auth.ok();

  function drawApp(active) {
    const links = tabs().map(([name, v]) =>
      `<a href="#/${name}" class="${name === active ? "on" : ""}">${RTT.icon(v.icon || name)}<span>${v.nav}</span></a>`).join("");
    const u = RTT.auth && RTT.auth.user();
    const initials = u ? u.name.split(/\s+/).filter((w) => w !== "and").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "";
    side.innerHTML = `
      ${brand()}
      <nav>${links}</nav>
      <div class="side-foot">
        ${u ? `<div class="me"><span class="av">${RTT.esc(initials)}</span><div><b>${RTT.esc(u.name)}</b><small>Demo account</small></div>
          <button class="icon-btn" data-out title="Sign out" aria-label="Sign out">${RTT.icon("out")}</button></div>` : ""}
        <p>Fan-made. Not affiliated with Kara and Nate or Daily Drop.</p>
      </div>`;
    tabbar.innerHTML = links;
    mtop.innerHTML = `${brand()}${u ? `<button class="icon-btn" data-out aria-label="Sign out">${RTT.icon("out")}</button>` : ""}`;
  }

  function drawPublic() {
    if (!RTT.auth) { pnav.innerHTML = ""; return; }
    pnav.innerHTML = `
      ${RTT.views.about ? `<a href="#/about">About</a>` : ""}
      ${authed() ? `<a class="btn sm" href="#/${RTT.views.dashboard ? "dashboard" : "trips"}">Open app</a>`
                 : `<a href="#/login">Sign in</a><a class="btn sm" href="#/login?demo=1">Try the demo</a>`}`;
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-out]") && RTT.auth) { RTT.auth.out(); location.hash = "#/"; }
  });

  function route() {
    const hash = location.hash.replace(/^#\/?/, "");
    const [path, query] = hash.split("?");
    const parts = path.split("/").filter(Boolean);
    const fallback = RTT.views.landing ? "landing" : (tabs()[0] || [])[0];
    let name = parts[0] || fallback;
    if (!RTT.views[name]) name = fallback;
    const v = RTT.views[name];

    if (v && !v.public && !authed()) {
      location.replace("#/login?next=" + encodeURIComponent(hash));
      return;
    }
    const mode = v && (v.bare || (v.public && !authed())) ? "public" : "app";
    document.body.dataset.mode = mode;
    if (mode === "app") drawApp(v && v.tab ? v.tab : name); else drawPublic();

    view.innerHTML = "";
    view.className = mode === "public" && v && !v.bare ? "wrap pad" : "";
    void view.offsetWidth;
    view.classList.add("enter");
    if (!v) { view.innerHTML = "<h1>Recreate this trip</h1>"; return; }
    document.title = v.title ? v.title + " · Recreate This Trip" : "Recreate This Trip";
    v.render(view, parts.slice(1), new URLSearchParams(query || ""));
    if (RTT.anim) RTT.anim.scan(view);
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", route);
  route();
})();

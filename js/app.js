// Tiny hash router with tabs: #/ , #/trips , #/trip/<id> , #/flights , #/about
(function () {
  const view = RTT.$("#view");
  const nav = RTT.$("#nav");

  function tabs() {
    return Object.entries(RTT.views)
      .filter(([, v]) => v.nav)
      .sort((a, b) => a[1].order - b[1].order);
  }

  function drawNav(current) {
    const items = tabs();
    // trip pages live under the Trips tab
    const active = RTT.views[current] && RTT.views[current].tab ? RTT.views[current].tab : current;
    nav.innerHTML = items.map(([name, v]) =>
      `<a href="#/${name === "home" ? "" : name}" data-v="${name}" class="${name === active ? "on" : ""}">${v.nav}</a>`
    ).join("") + `<span class="ind"></span>`;
    moveIndicator();
  }

  let lastLeft = null;
  function moveIndicator() {
    const on = nav.querySelector("a.on"), ind = nav.querySelector(".ind");
    if (!ind) return;
    if (!on) { ind.style.width = "0"; return; }
    // start from where the last tab was so it slides across
    if (lastLeft != null) {
      ind.style.transition = "none";
      ind.style.transform = `translateX(${lastLeft.x}px)`;
      ind.style.width = lastLeft.w + "px";
      ind.offsetWidth; // force layout
      ind.style.transition = "";
    }
    ind.style.transform = `translateX(${on.offsetLeft}px)`;
    ind.style.width = on.offsetWidth + "px";
    lastLeft = { x: on.offsetLeft, w: on.offsetWidth };
  }
  window.addEventListener("resize", moveIndicator);

  function route() {
    const hash = location.hash.replace(/^#\/?/, "");
    const [path, query] = hash.split("?");
    const parts = path.split("/").filter(Boolean);
    let name = parts[0] || "home";
    if (!RTT.views[name]) name = RTT.views.home ? "home" : (tabs()[0] || [])[0];
    const v = RTT.views[name];

    drawNav(name);
    view.innerHTML = "";
    view.classList.remove("enter");
    void view.offsetWidth;
    view.classList.add("enter");
    if (!v) {
      view.innerHTML = "<h1>Recreate This Trip</h1><p class='muted'>Paste a Kara and Nate flight video, see how you'd book the same trip with points. Still building this.</p>";
      return;
    }
    document.title = v.title ? v.title + " · Recreate This Trip" : "Recreate This Trip";
    v.render(view, parts.slice(1), new URLSearchParams(query || ""));
    if (RTT.anim) RTT.anim.scan(view);
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", route);
  route();
})();

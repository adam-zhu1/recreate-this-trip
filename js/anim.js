// Small animation helpers. Everything here checks prefers-reduced-motion
// and just jumps to the end state if the user asked for less motion.
RTT.anim = {};

RTT.anim.calm = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

// Count a number up from 0. el.textContent ends as the formatted value.
RTT.anim.count = function (el, to, ms, fmt) {
  fmt = fmt || RTT.fmt;
  if (RTT.anim.calm() || !to) { el.textContent = fmt(to); return; }
  const start = performance.now();
  ms = ms || 900;
  (function tick(now) {
    const t = Math.max(0, Math.min(1, (now - start) / ms));
    el.textContent = fmt(to * easeOut(t));
    if (t < 1) requestAnimationFrame(tick);
  })(start);
};

// Fade things in as they scroll into view. Add class "reveal" (and
// optionally style="--i:2" to stagger), then call scan() after rendering.
RTT.anim.scan = function (root) {
  (root || document).querySelectorAll("[data-count]").forEach((el) => {
    RTT.anim.count(el, Number(el.getAttribute("data-count")));
    el.removeAttribute("data-count");
  });
  const els = (root || document).querySelectorAll(".reveal:not(.in)");
  if (RTT.anim.calm() || !("IntersectionObserver" in window)) {
    els.forEach((e) => e.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }
  }, { rootMargin: "0px 0px -40px 0px" });
  els.forEach((e) => io.observe(e));
};

// An abstract route: two airports and a curved line between them that
// draws itself, with a little plane flying along it.
// Returns the svg markup; call RTT.anim.fly(svgEl) to start it.
RTT.anim.routeSvg = function (from, to, opts) {
  opts = opts || {};
  const w = 320, h = opts.h || 120, y = h - 22;
  const d = `M 30 ${y} Q ${w / 2} ${-h * 0.35} ${w - 30} ${y}`;
  return `
    <svg viewBox="0 0 ${w} ${h}" aria-hidden="true">
      <path class="arc-ghost" d="${d}"></path>
      <path class="arc-path" d="${d}"></path>
      <circle class="arc-dot" cx="30" cy="${y}" r="5"></circle>
      <circle class="arc-dot" cx="${w - 30}" cy="${y}" r="5"></circle>
      <text class="arc-label" x="30" y="${y + 20}" text-anchor="middle">${RTT.esc(from)}</text>
      <text class="arc-label" x="${w - 30}" y="${y + 20}" text-anchor="middle">${RTT.esc(to)}</text>
      <g class="arc-plane-g"><path class="arc-plane" d="M-7,-1.2 L4,-1.2 L8,0 L4,1.2 L-7,1.2 Z M-2,-1 L-5,-6 L-2.5,-6 L2,-1 Z M-2,1 L-5,6 L-2.5,6 L2,1 Z M-7,-1 L-8.5,-3.5 L-7,-3.5 L-5,-1 Z M-7,1 L-8.5,3.5 L-7,3.5 L-5,1 Z"></path></g>
    </svg>`;
};

RTT.anim.fly = function (svg, ms) {
  if (!svg) return;
  const path = svg.querySelector(".arc-path"), plane = svg.querySelector(".arc-plane-g");
  const len = path.getTotalLength();
  const place = (t) => {
    const p = path.getPointAtLength(len * t);
    const q = path.getPointAtLength(Math.min(len, len * t + 1));
    const ang = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI;
    plane.setAttribute("transform", `translate(${p.x},${p.y}) rotate(${ang})`);
    plane.style.opacity = t >= 1 ? 0 : 1; // land, then disappear
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len * (1 - t);
  };
  if (RTT.anim.calm()) { place(1); return; }
  ms = ms || 1800;
  const start = performance.now();
  (function tick(now) {
    const t = Math.max(0, Math.min(1, (now - start) / ms));
    place(easeInOut(t));
    if (t < 1 && svg.isConnected) requestAnimationFrame(tick);
  })(start);
};
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

// Leaflet polylines are SVG paths; this makes a newly added one draw in.
RTT.anim.drawLine = function (line) {
  if (RTT.anim.calm() || !line._path) return;
  const len = line._path.getTotalLength();
  line._path.style.setProperty("--len", len);
  line._path.style.strokeDasharray = len;
  line._path.classList.add("draw");
  line._path.addEventListener("animationend", () => {
    line._path.style.strokeDasharray = "";
    line._path.classList.remove("draw");
  }, { once: true });
};

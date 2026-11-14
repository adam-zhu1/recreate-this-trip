// What a seat alert for this exact trip could look like. A mockup:
// there's no award availability data behind it.
RTT.parts.alert = function (el, trip) {
  if (trip.program === "cash" || !trip.from || !trip.to) return;
  const prog = RTT.programs && RTT.programs[RTT.tripProgram(trip)];

  el.innerHTML = `
    <details class="fold">
      <summary>Seat alert</summary>
      <div>
        <div class="mock">
          <span class="lbl">Mockup</span>
          <div class="row">
            <div><label>When</label>
              <select id="when"><option>Next 11 months</option><option>Spring</option><option>Summer</option><option>Fall</option><option>Winter</option></select></div>
            <button type="button" id="set">Watch this route</button>
          </div>
          <div id="pinged"></div>
        </div>
        <p class="small muted" style="margin:12px 0 0">Not live. <a href="#/about">Why</a></p>
      </div>
    </details>`;

  RTT.$("#set", el).addEventListener("click", () => {
    if (!trip.custom) {
      const list = RTT.load("watching", []).filter((w) => w.trip !== trip.id);
      list.unshift({ trip: trip.id, when: RTT.$("#when", el).value });
      RTT.save("watching", list);
    }
    RTT.$("#pinged", el).innerHTML = `
      <div class="ping"><span class="dot"></span>
        <div><b>${RTT.esc(trip.from)} &rarr; ${RTT.esc(trip.to)}, 2 seats open</b><br>
        <span class="small muted">Mar 14, ${trip.points != null ? RTT.fmt(trip.points) + " " : ""}${RTT.esc(prog ? prog.name : "")} miles</span></div>
      </div>`;
  });
};

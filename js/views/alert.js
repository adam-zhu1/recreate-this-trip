// A seat alert for this exact trip. Only a preview: there's no award
// availability data behind it, so it just remembers the route you picked.
RTT.parts.alert = function (el, trip) {
  if (trip.program === "cash" || !trip.from || !trip.to) return;
  const watching = (RTT.load("watching", []) || []).find((w) => w && w.trip === trip.id);

  el.innerHTML = `
    <details class="fold">
      <summary>Seat alert</summary>
      <div>
        <div class="row alert-row">
          <div><label for="when">When</label>
            <select id="when">${["Next 11 months", "Spring", "Summer", "Fall", "Winter"].map((w) =>
              `<option${watching && watching.when === w ? " selected" : ""}>${w}</option>`).join("")}</select></div>
          <button type="button" id="set">${watching ? "Update" : "Watch this route"}</button>
        </div>
        <p class="small" id="pinged">${watching ? `Watching ${RTT.esc(trip.from)} &rarr; ${RTT.esc(trip.to)}, ${RTT.esc(String(watching.when || "").toLowerCase())}.` : ""}</p>
        <p class="small muted note">Preview only. There's no live seat data behind this.</p>
      </div>
    </details>`;

  RTT.$("#set", el).addEventListener("click", () => {
    const when = RTT.$("#when", el).value;
    if (!trip.custom) {
      const list = (RTT.load("watching", []) || []).filter((w) => w && w.trip !== trip.id);
      list.unshift({ trip: trip.id, when });
      RTT.save("watching", list);
    }
    RTT.$("#set", el).textContent = "Update";
    RTT.$("#pinged", el).innerHTML = `Watching ${RTT.esc(trip.from)} &rarr; ${RTT.esc(trip.to)}, ${RTT.esc(when.toLowerCase())}.` +
      (trip.custom ? "" : ` It's listed on <a href="#/trips">Trips</a>.`);
  });
};

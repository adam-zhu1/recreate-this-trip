// The dark map at the top of the front page: every trip in the library
// drawn as a yellow arc. Purely decorative, so no zoom or dragging.
RTT.parts.hero = function (box) {
  const trips = (RTT.trips || []).filter((t) => RTT.stops(t).every((c) => RTT.airport(c)));
  if (!window.L || !trips.length) return;

  const map = L.map(box, {
    zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false,
    boxZoom: false, keyboard: false, touchZoom: false, tap: false, worldCopyJump: false,
  });
  L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
    attribution: "Tiles &copy; Esri", maxZoom: 6,
  }).addTo(map);

  const legs = [];
  for (const t of trips) {
    const s = RTT.stops(t).map(RTT.airport);
    for (let i = 1; i < s.length; i++) legs.push(RTT.arc(s[i - 1], s[i]));
  }
  // keep the routes on the right so the headline has room on the left
  const pts = legs.flat();
  const wide = innerWidth > 700;
  map.fitBounds(pts, { paddingTopLeft: [wide ? innerWidth * 0.3 : 20, 40], paddingBottomRight: [20, wide ? 40 : 200] });
  // never zoom out so far that the world stops filling the box
  const minZ = Math.ceil(Math.log2(box.clientHeight / 256));
  if (map.getZoom() < minZ) map.setZoom(minZ, { animate: false });
  map.panInsideBounds([[-84, -720], [84, 720]], { animate: false });

  setTimeout(() => {
    map.invalidateSize();
    legs.forEach((line, i) => {
      const pl = L.polyline(line, { color: "#ffcd1f", weight: 1.6, opacity: 0.9, interactive: false });
      setTimeout(() => {
        if (!box.isConnected) return;
        pl.addTo(map);
        RTT.anim.drawLine(pl);
        [line[0], line[line.length - 1]].forEach((ll) =>
          L.circleMarker(ll, { radius: 2.5, stroke: false, fillColor: "#fff", fillOpacity: 0.9, interactive: false }).addTo(map));
      }, RTT.anim.calm() ? 0 : 200 + i * 120);
    });
  }, 50);
};

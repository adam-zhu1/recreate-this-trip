// Wallet: your card point balances, entered once and used on every trip.
RTT.views.wallet = {
  title: "Wallet",
  nav: "Wallet",
  icon: "wallet",
  order: 3,
  render(el) {
    const bal = RTT.load("balances", {});
    const banks = Object.keys(RTT.banks || {});
    const partners = (b) => Object.values(RTT.programs || {}).filter((p) => p.partners && p.partners[b]).length;

    el.innerHTML = `
      <div class="page-head"><div><h1>Wallet</h1><p class="muted">Every trip uses these balances.</p></div></div>
      <div class="wallet">
        <div class="panel-card total">
          <span class="muted small">Total points</span>
          <b id="tot" class="num">0</b>
          <div class="split" id="split"></div>
        </div>
        <div class="panel-card">
          ${banks.map((b) => `
            <div class="wrow">
              <span class="logo l-${b}">${RTT.esc(RTT.bankShort[b][0])}</span>
              <div class="wname"><b>${RTT.esc(RTT.banks[b])}</b><small>${partners(b)} airline partners</small></div>
              <input type="number" inputmode="numeric" min="0" step="1000" data-b="${b}" value="${bal[b] || ""}" placeholder="0" aria-label="${RTT.esc(RTT.banks[b])} balance">
            </div>`).join("")}
        </div>
      </div>
      <p class="saved">Saved on this device only.</p>`;

    let shown = 0;
    function totals() {
      const sum = banks.reduce((a, b) => a + (bal[b] || 0), 0);
      const from = shown;
      RTT.anim.count(RTT.$("#tot", el), sum - from, 500, (v) => RTT.fmt(from + v));
      if (sum === from) RTT.$("#tot", el).textContent = RTT.fmt(sum);
      shown = sum;
      RTT.$("#split", el).innerHTML = sum ? banks.filter((b) => bal[b] > 0).map((b) =>
        `<span class="l-${b}" style="flex:${bal[b]}" title="${RTT.esc(RTT.bankShort[b])}"></span>`).join("") : "";
    }
    el.addEventListener("input", (e) => {
      const b = e.target.getAttribute("data-b");
      if (!b) return;
      bal[b] = Number(e.target.value) || 0;
      RTT.save("balances", bal);
      // the card picker on trip pages follows the wallet
      const cards = new Set(RTT.load("cards", []));
      bal[b] > 0 ? cards.add(b) : cards.delete(b);
      RTT.save("cards", [...cards]);
      totals();
    });
    totals();
  },
};

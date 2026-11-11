// Which bank points move into which airline program, and at what ratio
// (airline miles you get per 1 bank point). From the banks' public
// transfer partner pages as of Nov 2026. These change, and banks run
// transfer bonuses all the time, so always check before moving points.
RTT.banks = {
  chase: "Chase Ultimate Rewards",
  amex: "Amex Membership Rewards",
  citi: "Citi ThankYou",
  capone: "Capital One Miles",
  bilt: "Bilt Rewards",
};

RTT.bankShort = { chase: "Chase", amex: "Amex", citi: "Citi", capone: "Capital One", bilt: "Bilt" };

RTT.programs = {
  flyingblue: { name: "Air France-KLM Flying Blue", partners: { chase: 1, amex: 1, citi: 1, capone: 1, bilt: 1 } },
  emirates:   { name: "Emirates Skywards",          partners: { chase: 1, amex: 0.8, citi: 0.8, capone: 0.75, bilt: 1 } },
  aeroplan:   { name: "Air Canada Aeroplan",        partners: { chase: 1, amex: 1, capone: 1, bilt: 1 } },
  lifemiles:  { name: "Avianca LifeMiles",          partners: { amex: 1, citi: 1, capone: 1 } },
  milesmore:  { name: "Lufthansa Miles & More",     partners: {} },
  etihad:     { name: "Etihad Guest",               partners: { amex: 1, citi: 1, capone: 1, bilt: 1 } },
  krisflyer:  { name: "Singapore KrisFlyer",        partners: { chase: 1, amex: 1, citi: 1, capone: 1 } },
  avios:      { name: "British Airways / Qatar Avios", partners: { chase: 1, amex: 1, citi: 1, capone: 1, bilt: 1 } },
  ana:        { name: "ANA Mileage Club",           partners: { amex: 1 } },
  jal:        { name: "JAL Mileage Bank",           partners: { bilt: 1 } },
  asiamiles:  { name: "Cathay Pacific Asia Miles",  partners: { amex: 0.8, citi: 1, capone: 1, bilt: 1 } },
  virgin:     { name: "Virgin Atlantic Flying Club", partners: { chase: 1, amex: 1, citi: 1, capone: 1, bilt: 1 } },
  united:     { name: "United MileagePlus",         partners: { chase: 1, bilt: 1 } },
  aadvantage: { name: "American AAdvantage",        partners: { citi: 1, bilt: 1 } },
  alaska:     { name: "Alaska Mileage Plan",        partners: { bilt: 1 } },
  turkish:    { name: "Turkish Miles&Smiles",       partners: { citi: 1, capone: 1, bilt: 1 } },
  cash:       { name: "Paid cash", partners: {} },
};

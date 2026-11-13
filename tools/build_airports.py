import csv, json, sys
src, csrc, out = sys.argv[1], sys.argv[2], sys.argv[3]
countries = {r["code"]: r["name"] for r in csv.DictReader(open(csrc, encoding="utf-8"))}
rows = []
for r in csv.DictReader(open(src, encoding="utf-8")):
    iata = (r["iata_code"] or "").strip()
    if len(iata) != 3 or r["type"] not in ("large_airport", "medium_airport") or r["scheduled_service"] != "yes":
        continue
    rows.append([iata, r["name"], r["municipality"], countries.get(r["iso_country"], r["iso_country"]),
                 round(float(r["latitude_deg"]), 3), round(float(r["longitude_deg"]), 3)])
rows.sort()
seen, uniq = set(), []
for r in rows:
    if r[0] in seen: continue
    seen.add(r[0]); uniq.append(r)
with open(out, "w", encoding="utf-8") as f:
    f.write("// Airports with scheduled service, from OurAirports (public domain).\n")
    f.write("// [iata, name, city, country, lat, lon]\n")
    f.write("RTT.airportRows = " + json.dumps(uniq, ensure_ascii=False, separators=(",", ":")) + ";\n")
print(len(uniq))

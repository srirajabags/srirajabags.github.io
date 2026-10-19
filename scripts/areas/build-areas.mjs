// Builds site/assets/data/areas.json: the regions, towns and shop counts
// behind the area pages (/carry-bags-*/) and the "Areas we supply" map.
//
//   GRIST_URL=... GRIST_API_KEY=... GRIST_DOC_ID=... \
//     node scripts/areas/build-areas.mjs --states <ne_10m_admin_1_states_provinces.geojson>
//
// Run by hand when the picture has changed (a new region, a few months of
// orders), not in the deploy: the counts are "as of" the run date.
//
//   1. Orders (last 12 months) joined to Areas in Grist: distinct customers
//      per town, towns grouped into the regions below by Grist's district.
//   2. Each town's position from OpenStreetMap's Nominatim, looked up once and
//      kept in geocode-cache.json (1 request a second, as Nominatim asks).
//      A result outside the region's state is rejected and reported.
//   3. State outlines from Natural Earth (public domain), simplified to SVG
//      paths for the map.
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "..", "site", "assets", "data", "areas.json");
const CACHE = join(HERE, "geocode-cache.json");

// ---- regions -------------------------------------------------------------
// Grist's District column still uses the pre-2022 districts in places
// (Anantapur, Kurnool, Mahbubnagar...). Regions are matched on it.
const AP = "Andhra Pradesh", TG = "Telangana", KA = "Karnataka";
const REGIONS = [
    { key: "kurnool-nandyal", name: "Kurnool & Nandyal", page: "/carry-bags-kurnool-nandyal/", days: "1–2 days", state: AP, districts: ["kurnool", "nandyal"] },
    { key: "anantapur", name: "Anantapur & Sri Sathya Sai", page: "/carry-bags-anantapur/", days: "1–2 days", state: AP, districts: ["anantapur", "sri sathya sai"] },
    { key: "kadapa", name: "Kadapa & Annamayya", page: "/carry-bags-kadapa/", days: "3–4 days", state: AP, districts: ["kadapa", "annamaya"] },
    { key: "guntur", name: "Guntur & Palnadu", page: "/carry-bags-guntur/", days: "1–2 days", state: AP, districts: ["guntur", "palnadu", "bapatla"] },
    { key: "prakasam", name: "Ongole & Prakasam", page: "/carry-bags-prakasam/", days: "1–2 days", state: AP, districts: ["prakasam"] },
    { key: "krishna-godavari", name: "Krishna & Godavari", page: "/carry-bags-krishna-godavari/", days: "2–3 days", state: AP, districts: ["krishna", "west godavari", "east godavari"] },
    { key: "mahabubnagar", name: "Mahabubnagar region", page: "/carry-bags-mahabubnagar/", days: "1–2 days", state: TG, districts: ["mahbubnagar", "vikarabad", "ranga reddy"] },
    { key: "nalgonda", name: "Nalgonda region", page: "/carry-bags-nalgonda/", days: "3–4 days", state: TG, districts: ["nalgonda", "suryapet"] },
    { key: "khammam", name: "Khammam", page: "/carry-bags-khammam/", days: "3–4 days", state: TG, districts: ["khammam"] },
    { key: "north-telangana", name: "North Telangana", page: "/carry-bags-north-telangana/", days: "3–4 days", state: TG, districts: ["karimnagar", "warangal", "adilabad", "nizamabad", "kamareddy", "medak"] },
    { key: "karnataka", name: "Karnataka", page: "/carry-bags-karnataka/", days: "3–4 days", state: KA, anyDistrict: true },
    // Smaller areas: on the map and the list, no page of their own.
    { key: "hyderabad", name: "Hyderabad", page: null, days: "1–2 days", state: TG, districts: ["hyderabad"] },
    { key: "chittoor", name: "Chittoor", page: null, days: "3–4 days", state: AP, districts: ["chittoor"] },
    { key: "nellore", name: "Nellore", page: null, days: "3–4 days", state: AP, districts: ["nellore"] },
    { key: "visakhapatnam", name: "Visakhapatnam", page: null, days: null, state: AP, districts: ["visakhapatnam"] },
];

// Grist town names as the office typed them -> how the website shows them.
const RENAME = {
    "Kurnool(a)": "Kurnool", "Kurnool(b)": "Kurnool", "Atmakur(Kurnool)": "Atmakur", "Atmakur(Mahbubnagar)": "Atmakur",
    "Maddur(mnbr)": "Maddur", "Achampet(palnadu)": "Achampet", "Chityal(Nalgonda)": "Chityal", "Yerraguntla(kadapa)": "Yerraguntla",
    "yerraguntla(kurnool)": "Yerraguntla", "Narasapura(Kolar)": "Narasapura", "Bellary": "Ballari", "Hospet": "Hosapete",
    "Tumkur": "Tumakuru", "Gulbarga": "Kalaburagi", "K.G.F": "KGF", "KR Puram": "Bengaluru", "Chickmagalur": "Chikkamagaluru",
    "Chikballapur": "Chikkaballapur", "Vijayapura": "Vijayapura (Bengaluru Rural)", "Chittor": "Chittoor", "Markapuram": "Markapur",
    "madakasira": "Madakasira", "kundurpi": "Kundurpi", "saidapur": "Saidapur", "wyra": "Wyra", "patancheru": "Patancheru",
    "Vishakapatnam": "Visakhapatnam", "TurpuGangavaram": "Turpu Gangavaram",
};
const DROP = new Set(["I.P LIST", "H Cross", "Rampura(Bellary)"]);
// Listed on the pages but not drawn: no confident location found.
const NO_DOT = new Set(["Ankur|khammam", "East Gangavaram|prakasam"]);
// Where a bare name finds the wrong place, the search is pinned down.
const GEO_HINT = {
    "Vijayapura (Bengaluru Rural)": "Vijayapura, Devanahalli, Bangalore Rural",
    "Atmakur|kurnool-nandyal": "Atmakur, Nandyal", "Atmakur|mahabubnagar": "Atmakur, Wanaparthy",
    "Achampet|guntur": "Achampet, Palnadu", "Achampet|mahabubnagar": "Achampet, Nagarkurnool",
    "Yerraguntla|kadapa": "Yerraguntla, YSR Kadapa", "Yerraguntla|kurnool-nandyal": "Yerraguntla, Kurnool",
    "Maddur|mahabubnagar": "Maddur, Narayanpet", "Bengaluru": "Bengaluru", "Hyderabad": "Hyderabad",
    // Grist spellings OpenStreetMap does not know.
    "Kovelakuntla": "Koilkuntla", "Avuku": "Owk", "Lakkireddy Palli": "Lakkireddipalle", "Parigi": "Pargi",
    "Bijinapally": "Bijinapalle", "Konda Mallepally": "Kondamallepalle", "Chanduru": "Chandur, Nalgonda",
    "Bhupalpalle": "Bhupalpally", "Gillesugur": "Gillesugur, Raichur", "Kana Hosahalli": "Kanahosahalli",
    "Erravalli": "Erravalli, Siddipet", "Bhavswada": "Bhavsar, Nizamabad",
    // Same-named places elsewhere: pinned to the right district.
    "Cherukupalle": "Cherukupalle, Bapatla", "Peddapalle": "Peddapalli", "East Gangavaram": "East Gangavaram, Prakasam",
    "Ankur": "Ankur, Khammam", "Konda Mallepally|nalgonda": "Kondamallepally, Nalgonda",
};
const STATE_BOX = { // [minLat, maxLat, minLon, maxLon], with some margin
    [AP]: [12.5, 19.95, 76.6, 84.9], [TG]: [15.7, 19.95, 77.1, 81.4], [KA]: [11.4, 18.5, 73.9, 78.7],
};

// ---- Grist ----------------------------------------------------------------
async function grist(env, path) {
    const res = await fetch(`${env.GRIST_URL.replace(/\/+$/, "")}/api/docs/${env.GRIST_DOC_ID}${path}`, { headers: { Authorization: `Bearer ${env.GRIST_API_KEY}` } });
    if (!res.ok) throw new Error(`grist ${res.status} ${path}`);
    return (await res.json()).records;
}

// ---- geocoding ------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function nominatim(q) {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&countrycodes=in&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { "User-Agent": "SriRajaBags-website-areas/1.0 (https://www.srirajabags.in)" } });
    await sleep(1100);
    if (!res.ok) throw new Error(`nominatim ${res.status}`);
    return (await res.json()).map((r) => ({ lat: +r.lat, lon: +r.lon, label: r.display_name }));
}
const inBox = (p, state) => { const b = STATE_BOX[state]; return p.lat >= b[0] && p.lat <= b[1] && p.lon >= b[2] && p.lon <= b[3]; };

// ---- map ------------------------------------------------------------------
// Cropped to where the towns are, with the coast and neighbours for context.
const VIEW = { lon0: 74.0, lon1: 84.3, lat0: 19.95, lat1: 12.3, width: 1000 };
// State names sit in empty parts of each state, clear of the town dots.
const LABEL_AT = { "Telangana": [80.35, 18.75], "Andhra Pradesh": [82.65, 17.75], "Karnataka": [75.25, 14.25] };
const KX = Math.cos((15.75 * Math.PI) / 180);
const scale = VIEW.width / ((VIEW.lon1 - VIEW.lon0) * KX);
export const project = (lon, lat) => [+(((lon - VIEW.lon0) * KX * scale).toFixed(1)), +(((VIEW.lat0 - lat) * scale).toFixed(1))];
const HEIGHT = Math.round((VIEW.lat0 - VIEW.lat1) * scale);

function simplify(pts, tol) { // Douglas–Peucker on projected points
    if (pts.length < 3) return pts;
    const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
    const stack = [[0, pts.length - 1]];
    while (stack.length) {
        const [a, b] = stack.pop(); let max = 0, idx = -1;
        const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
        for (let i = a + 1; i < b; i++) {
            // A closed ring starts and ends on the same point: measure from it.
            const d = len ? Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / len : Math.hypot(pts[i][0] - ax, pts[i][1] - ay);
            if (d > max) { max = d; idx = i; }
        }
        if (max > tol) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
    }
    return pts.filter((_, i) => keep[i]);
}
function statePath(geom, tol) {
    const polys = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
    let d = "";
    for (const poly of polys) for (const ring of poly) {
        const pts = simplify(ring.map(([lon, lat]) => project(lon, lat)), tol);
        if (pts.length < 4) continue;
        // Skip islands and slivers too small to see.
        const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
        if (Math.max(...xs) - Math.min(...xs) < 3 && Math.max(...ys) - Math.min(...ys) < 3) continue;
        d += "M" + pts.map((p) => p.join(",")).join("L") + "Z";
    }
    return d;
}

// ---- main -----------------------------------------------------------------
const env = process.env;
if (!env.GRIST_URL || !env.GRIST_API_KEY || !env.GRIST_DOC_ID) { console.error("Set GRIST_URL, GRIST_API_KEY, GRIST_DOC_ID."); process.exit(1); }
const statesFile = process.argv[process.argv.indexOf("--states") + 1];
if (!process.argv.includes("--states") || !statesFile) { console.error("Pass --states <Natural Earth admin-1 GeoJSON>."); process.exit(1); }

const [orders, areas] = [await grist(env, "/tables/Orders/records"), await grist(env, "/tables/Areas/records")];
const areaById = new Map(areas.map((r) => [r.id, r.fields]));
const since = Date.now() / 1000 - 365 * 86400;
const regionOf = (a) => {
    const d = String(a.District ?? "").trim().toLowerCase(), s = String(a.State ?? "");
    return REGIONS.find((r) => r.anyDistrict ? s.includes(r.state) : r.districts.includes(d) && s.trim() === r.state) ?? null;
};

const byRegion = new Map(REGIONS.map((r) => [r.key, new Map()]));
const allCustomers = new Set(); let orderCount = 0; const unplaced = new Map();
for (const o of orders) {
    const f = o.fields;
    if (!f.Order_Form_Date || f.Order_Form_Date < since) continue;
    const a = areaById.get(f.City); if (!a) continue;
    if (DROP.has(a.City)) continue;
    const r = regionOf(a);
    if (!r) { unplaced.set(`${a.City} / ${a.District}`, (unplaced.get(`${a.City} / ${a.District}`) ?? 0) + 1); continue; }
    const town = RENAME[a.City] ?? a.City;
    const m = byRegion.get(r.key);
    if (!m.has(town)) m.set(town, { customers: new Set(), district: a.District });
    m.get(town).customers.add(f.Customer);
    allCustomers.add(f.Customer); orderCount++;
}

let cache = {};
try { cache = JSON.parse(await readFile(CACHE, "utf8")); } catch {}
const problems = [];
async function locate(town, region, district) {
    const key = `${town}|${region.key}`;
    if (cache[key]) return cache[key];
    const hint = GEO_HINT[key] ?? GEO_HINT[town];
    const queries = [hint && `${hint}, ${region.state}`, `${town}, ${district}, ${region.state}`, `${town}, ${region.state}`].filter(Boolean);
    for (const q of queries) {
        const hit = (await nominatim(q)).find((p) => inBox(p, region.state));
        if (hit) { cache[key] = { lat: +hit.lat.toFixed(4), lon: +hit.lon.toFixed(4), q }; await writeFile(CACHE, JSON.stringify(cache, null, 1) + "\n"); return cache[key]; }
    }
    problems.push(`${town} (${region.name}): no result inside ${region.state}`);
    return null;
}

const out = { asOf: new Date().toISOString().slice(0, 10), customers: allCustomers.size, orders: orderCount, regions: [] };
const factory = await locate("Dhone", REGIONS[0], "Nandyal");
out.factory = { name: "Dhone", ...factory, xy: project(factory.lon, factory.lat) };
let townCount = 0;
for (const r of REGIONS) {
    const towns = [];
    const regionCustomers = new Set();
    for (const [town, t] of byRegion.get(r.key)) {
        t.customers.forEach((c) => regionCustomers.add(c));
        const p = NO_DOT.has(`${town}|${r.key}`) ? null : await locate(town, r, t.district);
        towns.push({ name: town, customers: t.customers.size, ...(p ? { xy: project(p.lon, p.lat) } : {}) });
    }
    towns.sort((a, b) => b.customers - a.customers || a.name.localeCompare(b.name));
    townCount += towns.length;
    out.regions.push({ key: r.key, name: r.name, page: r.page, days: r.days, state: r.state, customers: regionCustomers.size, towns });
}
out.towns = townCount;

const states = JSON.parse(await readFile(statesFile, "utf8")).features.filter((f) => f.properties.adm0_a3 === "IND");
const FOCUS = [AP, TG, KA], CONTEXT = ["Tamil Nadu", "Maharashtra", "Goa", "Kerala", "Odisha", "Chhattisgarh", "Puducherry"];
out.map = {
    width: VIEW.width, height: HEIGHT,
    states: states.filter((f) => FOCUS.includes(f.properties.name) || CONTEXT.includes(f.properties.name)).map((f) => ({
        name: f.properties.name, focus: FOCUS.includes(f.properties.name),
        d: statePath(f.geometry, FOCUS.includes(f.properties.name) ? 0.6 : 1.5),
        label: FOCUS.includes(f.properties.name) ? project(...(LABEL_AT[f.properties.name] ?? [f.properties.longitude, f.properties.latitude])) : null,
    })),
};

await writeFile(OUT, JSON.stringify(out) + "\n");
console.log(`areas: ${out.customers} customers, ${out.orders} orders, ${out.towns} towns in ${out.regions.length} regions`);
for (const r of out.regions) console.log(`  ${r.name.padEnd(28)} ${String(r.customers).padStart(4)} customers ${String(r.towns.length).padStart(3)} towns ${r.towns.filter((t) => !t.xy).length ? "(" + r.towns.filter((t) => !t.xy).length + " unlocated)" : ""}`);
if (unplaced.size) console.log("not in any region:", [...unplaced].map(([k, v]) => `${k} x${v}`).join(" | "));
problems.forEach((p) => console.log("warning:", p));

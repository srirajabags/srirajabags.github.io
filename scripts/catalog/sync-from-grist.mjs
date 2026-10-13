// Pulls the catalog out of Grist and writes what the Hugo build reads:
//
//   site/assets/data/catalog.json      products, sizes, rates, photos, colours
//   site/assets/images/catalog/*       the photos, named by their content hash
//
//   GRIST_URL=... GRIST_API_KEY=... GRIST_DOC_ID=... node scripts/catalog/sync-from-grist.mjs
//   node scripts/catalog/sync-from-grist.mjs --fixture <file.json>   (offline, for testing)
//
// Runs in the deploy workflow before `hugo`, so the published page is plain
// static HTML with every product and price in it — nothing is fetched from
// Grist when a visitor opens the page.
//
// Photos are downloaded only when they are new. Each file is named after the
// hash Grist keeps for its content, so a photo already on disk is skipped, a
// replaced photo arrives under a new name, and one no longer used is deleted.
//
// The output has no timestamps and a fixed key order, so a sync that finds
// nothing changed leaves the working tree untouched and the workflow commits
// nothing.

import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "site");
const DATA_FILE = join(SITE, "assets", "data", "catalog.json");
const PHOTO_DIR = join(SITE, "assets", "images", "catalog");
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

// ---- sources ---------------------------------------------------------------

function gristSource({ GRIST_URL, GRIST_API_KEY, GRIST_DOC_ID }) {
    const base = `${GRIST_URL.replace(/\/$/, "")}/api/docs/${GRIST_DOC_ID}`;
    const get = async (path) => {
        const res = await fetch(base + path, { headers: { Authorization: `Bearer ${GRIST_API_KEY}` } });
        if (!res.ok) throw new Error(`GET ${path}: ${res.status} ${(await res.text()).slice(0, 300)}`);
        return res;
    };
    return {
        // manualSort is the order rows are dragged into in Grist.
        records: async (table) => (await (await get(`/tables/${table}/records?sort=manualSort`)).json()).records,
        // fileIdent is Grist's checksum-based name for the stored file. Only
        // the ids asked for: the doc holds thousands of other attachments.
        attachments: async (ids) => {
            if (!ids.length) return new Map();
            const filter = encodeURIComponent(JSON.stringify({ id: ids }));
            const { records } = await (await get(`/tables/_grist_Attachments/records?filter=${filter}`)).json();
            return new Map(records.map((r) => [r.id, r.fields]));
        },
        download: async (id) => Buffer.from(await (await get(`/attachments/${id}/download`)).arrayBuffer()),
    };
}

// A fixture is { tables: { Catalog_Products: [{id, fields}], ... },
//                attachments: { "<id>": { fileIdent, fileName, path } } }.
async function fixtureSource(file) {
    const fx = JSON.parse(await readFile(file, "utf8"));
    const att = new Map(Object.entries(fx.attachments ?? {}).map(([k, v]) => [Number(k), v]));
    return {
        records: async (table) => fx.tables[table] ?? [],
        attachments: async () => att,
        download: async (id) => readFile(join(dirname(file), att.get(id).path)),
    };
}

// ---- helpers ----------------------------------------------------------------

const text = (v) => (typeof v === "string" ? v.trim() : v == null ? "" : String(v));
const number = (v) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null);
// Grist list cells arrive as ["L", ...items]; an empty one as null.
const list = (v) => (Array.isArray(v) ? v.slice(v[0] === "L" ? 1 : 0) : []).map(text).filter(Boolean);
const refs = (v) => (Array.isArray(v) ? v.slice(v[0] === "L" ? 1 : 0) : []).filter((x) => typeof x === "number");

function photoName(meta, id) {
    const ext = (extname(text(meta.fileName)) || extname(text(meta.fileIdent))).toLowerCase();
    // fileIdent is "<sha>.<ext>". Without one (an old or unusual Grist), fall
    // back to the attachment id plus what would change if the file did.
    const key = text(meta.fileIdent).replace(/\.[^.]*$/, "") ||
        createHash("sha1").update(`${id}:${meta.fileSize}:${meta.timeUploaded}`).digest("hex");
    return { name: `${key.slice(0, 40)}${ext}`, ext };
}

// ---- build ------------------------------------------------------------------

export async function buildCatalog(source, { log = console.log } = {}) {
    const [types, colours, products, prices, photos] = await Promise.all([
        source.records("Catalog_Price_Types"), source.records("Catalog_Colours"),
        source.records("Catalog_Products"), source.records("Catalog_Prices"),
        source.records("Catalog_Photos"),
    ]);
    const attachments = await source.attachments([...new Set(photos.flatMap((ph) => refs(ph.fields.Photo)))]);
    const problems = [];

    const colourById = new Map(colours.map((c) => [c.id, text(c.fields.Colour)]));
    const out = {
        // Highest threshold first: the first type an order value reaches is its rate.
        priceTypes: types
            .map((t) => ({ type: text(t.fields.Type), label: text(t.fields.Label), minOrderValue: Number(t.fields.Min_Order_Value) || 0 }))
            .filter((t) => t.type)
            .sort((a, b) => a.type.localeCompare(b.type, "en", { numeric: true })),
        colours: colours.map((c) => ({ name: text(c.fields.Colour), hex: text(c.fields.Hex) })).filter((c) => c.name),
        products: [],
    };
    if (out.priceTypes.length !== 3) problems.push(`Catalog_Price_Types should have 3 rows, has ${out.priceTypes.length}`);

    const byId = new Map();
    const seen = new Set();
    for (const p of products) {
        const f = p.fields;
        const id = text(f.Product_ID);
        if (!f.Published) continue;
        if (!id || !text(f.Name)) { problems.push(`product row ${p.id} has no Product_ID or Name — skipped`); continue; }
        if (seen.has(id)) { problems.push(`Product_ID "${id}" is used twice — row ${p.id} skipped`); continue; }
        seen.add(id);
        const product = {
            id,
            name: text(f.Name),
            material: text(f.Material),
            bagType: text(f.Bag_Type),
            print: text(f.Print),
            colours: refs(f.Colours).map((r) => colourById.get(r)).filter(Boolean),
            shopTypes: list(f.Shop_Types),
            badges: list(f.Badges),
            unit: text(f.Price_Unit) === "Per piece" ? "pc" : "kg",
            minOrder: number(f.Min_Order),
            thickness: text(f.Thickness_Unit) === "Micron" ? "micron" : "GSM",
            description: text(f.Description),
            priceNotes: text(f.Price_Notes),
            variants: [],
            photos: [],
        };
        byId.set(p.id, product);
        out.products.push(product);
    }

    for (const r of prices) {
        const product = byId.get(r.fields.Product);
        if (!product) continue;
        const size = text(r.fields.Size);
        if (!size) { problems.push(`price row ${r.id} (${product.id}) has no Size — skipped`); continue; }
        const rates = [r.fields.Type_1, r.fields.Type_2, r.fields.Type_3].map(number);
        // Part-filled rows would publish a price for some order values and not
        // others. Treat them as not priced and say so.
        if (rates.some((x) => x === null) && rates.some((x) => x !== null)) {
            problems.push(`price row ${r.id} (${product.id} ${size}) has only some of Type 1/2/3 — shown as rate on request`);
            rates.fill(null);
        }
        product.variants.push({
            size,
            gsm: number(r.fields.GSM),
            patty: text(r.fields.Side_Patty),
            rates: rates[0] === null ? null : rates,
            pcsPerKg: number(r.fields.Pcs_Per_Kg),
        });
    }

    const wanted = new Map(); // file name -> attachment id
    for (const ph of photos) {
        const product = byId.get(ph.fields.Product);
        if (!product) continue;
        for (const attId of refs(ph.fields.Photo)) {
            const meta = attachments.get(attId);
            if (!meta) { problems.push(`photo row ${ph.id}: attachment ${attId} not found`); continue; }
            const { name, ext } = photoName(meta, attId);
            if (!IMAGE_EXT.has(ext)) { problems.push(`photo row ${ph.id}: ${meta.fileName} is not a jpg/png/webp — skipped`); continue; }
            wanted.set(name, attId);
            product.photos.push({ file: `catalog/${name}`, shopTypes: list(ph.fields.Shop_Types), alt: text(ph.fields.Alt_Text) });
        }
    }

    problems.forEach((p) => log(`warning: ${p}`));
    return { catalog: out, wanted };
}

async function syncPhotos(source, wanted, log) {
    await mkdir(PHOTO_DIR, { recursive: true });
    const have = new Set(await readdir(PHOTO_DIR));
    let added = 0, removed = 0;
    for (const [name, attId] of wanted) {
        if (have.has(name)) continue;
        await writeFile(join(PHOTO_DIR, name), await source.download(attId));
        added++;
    }
    for (const name of have) {
        if (!wanted.has(name) && IMAGE_EXT.has(extname(name).toLowerCase())) {
            await rm(join(PHOTO_DIR, name));
            removed++;
        }
    }
    log(`photos: ${wanted.size} in use, ${added} downloaded, ${removed} removed`);
}

// ---- main -------------------------------------------------------------------

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const fx = process.argv.indexOf("--fixture");
    const source = fx > 0 ? await fixtureSource(process.argv[fx + 1]) : (() => {
        const env = process.env;
        if (!env.GRIST_URL || !env.GRIST_API_KEY || !env.GRIST_DOC_ID) {
            console.error("Set GRIST_URL, GRIST_API_KEY and GRIST_DOC_ID, or pass --fixture <file>.");
            process.exit(1);
        }
        return gristSource(env);
    })();

    const { catalog, wanted } = await buildCatalog(source);
    // An empty result is far more likely a broken sheet than an empty range.
    // Refuse to publish it, so the site keeps the last good catalog.
    if (!catalog.products.length) {
        console.error("No published products found in Grist — leaving the current catalog in place.");
        process.exit(1);
    }
    await syncPhotos(source, wanted, console.log);
    await mkdir(dirname(DATA_FILE), { recursive: true });
    await writeFile(DATA_FILE, JSON.stringify(catalog, null, 1) + "\n");
    const priced = catalog.products.filter((p) => p.variants.some((v) => v.rates)).length;
    console.log(`catalog: ${catalog.products.length} products (${priced} priced), ` +
        `${catalog.products.reduce((n, p) => n + p.variants.length, 0)} size rows`);
}

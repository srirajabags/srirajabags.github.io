// Creates the Grist tables the website catalog is built from, if they are
// missing. Safe to run any number of times: a table or column that already
// exists is reported and left alone, so this never rewrites what the office
// has since changed.
//
//   GRIST_URL=... GRIST_API_KEY=... GRIST_DOC_ID=... node scripts/catalog/setup-grist-tables.mjs
//   (add --dry-run to only print what would be created)
//
// Every column is plain data. Nothing here is a formula, so editing one row can
// never silently change another, and what the sync reads is exactly what the
// office typed.

const { GRIST_URL, GRIST_API_KEY, GRIST_DOC_ID } = process.env;
const DRY_RUN = process.argv.includes("--dry-run");

if (!GRIST_URL || !GRIST_API_KEY || !GRIST_DOC_ID) {
    console.error("Set GRIST_URL, GRIST_API_KEY and GRIST_DOC_ID.");
    process.exit(1);
}

const INR = JSON.stringify({ numMode: "currency", currency: "INR", decimals: 0, maxDecimals: 2 });

// isFormula: false by default. Left unset, Grist's columns endpoint makes an
// *empty formula* column, which only becomes data once someone types into it.
const col = (id, type, extra = {}) => ({ id, fields: { label: id.replace(/_/g, " "), type, isFormula: false, ...extra } });
const choice = (id, choices, extra = {}) => col(id, "Choice", { widgetOptions: JSON.stringify({ choices }), ...extra });
const choices = (id, choices, extra = {}) => col(id, "ChoiceList", { widgetOptions: JSON.stringify({ choices }), ...extra });
// A reference shows the named column of the row it points at, not its row id.
const show = (column, table, colId) => ({ ...column, fields: { ...column.fields, _show: [table, colId] } });

const SHOP_TYPES = ["Bakery", "Family wear", "Fertilizers", "Footwear", "Function", "Hotel", "Jewellery", "Kids Wear",
    "Kirana Store", "Ladies Corner", "Medical Shops", "Mens Wear", "Mobile Shop", "Real Estate", "School", "Super Market",
    "Tailors", "Textiles", "Wine Shop", "Womens wear"];

// Order matters: a table must exist before another refers to it.
const TABLES = [
    {
        // The three rate columns in Catalog_Prices, and the order value each
        // applies from. The website labels its price table with Label and picks
        // the rate for an enquiry list by its total against Min_Order_Value.
        id: "Catalog_Price_Types",
        columns: [
            col("Type", "Text"),
            col("Label", "Text"),
            col("Min_Order_Value", "Numeric", { widgetOptions: INR }),
        ],
    },
    {
        id: "Catalog_Colours",
        columns: [
            col("Colour", "Text"),
            // Swatch colour as #rrggbb. Blank is fine: Multicolour and Mixed get
            // their swatch from the stylesheet instead.
            col("Hex", "Text"),
        ],
    },
    {
        // One row per product card. Row order (drag in Grist) is the order the
        // catalog shows them in.
        id: "Catalog_Products",
        columns: [
            // Stable id: it is the #p-<id> link from the homepage and the key a
            // buyer's saved enquiry list uses. Do not change it once published.
            col("Product_ID", "Text"),
            // Unticked rows are left off the website.
            col("Published", "Bool"),
            col("Name", "Text"),
            choice("Material", ["Non Woven Bag", "Plastic Cover", "Bio-degradable Cover"]),
            choice("Bag_Type", ["D-Cut", "Handle", "Stitching", "Digital", "Digital Laminated", "U-Cut", "Misprints"]),
            choice("Print", ["Printed", "Plain"]),
            show(col("Colours", "RefList:Catalog_Colours"), "Catalog_Colours", "Colour"),
            choices("Shop_Types", SHOP_TYPES),
            choices("Badges", ["Bestseller", "Budget Friendly", "Eco Friendly", "High Capacity", "New", "Premium"]),
            // What the rates in Catalog_Prices are per, and what Min_Order counts.
            choice("Price_Unit", ["Per kg", "Per piece"]),
            col("Min_Order", "Numeric"),
            // How the GSM column of Catalog_Prices is labelled: fabric GSM for
            // non woven, micron for plastic and bio-degradable covers.
            choice("Thickness_Unit", ["GSM", "Micron"]),
            col("Description", "Text"),
            // Shown under the price table: surcharges and exceptions.
            col("Price_Notes", "Text"),
        ],
    },
    {
        // One row per size (x GSM x side patty) a product is sold in. A row with
        // the rates blank is still listed, as "Rate on request". Sizes appear on
        // the website in row order.
        id: "Catalog_Prices",
        columns: [
            show(col("Product", "Ref:Catalog_Products"), "Catalog_Products", "Name"),
            // "12x16", or with a qualifier: "16x18 (Stick Bag)".
            col("Size", "Text"),
            col("GSM", "Int"),
            // Blank for bags without one. Free text, shown as written: 6″ (5″ printed).
            col("Side_Patty", "Text"),
            col("Type_1", "Numeric", { widgetOptions: INR }),
            col("Type_2", "Numeric", { widgetOptions: INR }),
            col("Type_3", "Numeric", { widgetOptions: INR }),
            col("Pcs_Per_Kg", "Int"),
        ],
    },
    {
        // One row per photo. The first photo of a product is the one its card
        // shows. Shop_Types marks a photo as shot for that trade, so a buyer
        // filtering by it sees that photo first; blank means a generic shot.
        id: "Catalog_Photos",
        columns: [
            show(col("Product", "Ref:Catalog_Products"), "Catalog_Products", "Name"),
            col("Photo", "Attachments"),
            choices("Shop_Types", SHOP_TYPES),
            col("Alt_Text", "Text"),
            // Ticked: kept here but not shown on the website.
            col("Hidden", "Bool"),
        ],
    },
];

const api = async (path, init = {}) => {
    const res = await fetch(`${GRIST_URL}/api/docs/${GRIST_DOC_ID}${path}`, {
        ...init,
        headers: { Authorization: `Bearer ${GRIST_API_KEY}`, "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path}: ${res.status} ${await res.text()}`);
    return res.json();
};
const columnsOf = async (table) => (await api(`/tables/${table}/columns`)).columns;
const strip = ({ _show, ...fields }) => fields;

const existingTables = new Set((await api("/tables")).tables.map((t) => t.id));
for (const table of TABLES) {
    if (!existingTables.has(table.id)) {
        if (DRY_RUN) {
            console.log(`would add table ${table.id}: ${table.columns.map((c) => c.id).join(", ")}`);
            continue;
        }
        // Plain columns create the table; references follow, once every table
        // they can point at exists.
        const plain = table.columns.filter((c) => !c.fields._show);
        await api("/tables", { method: "POST", body: JSON.stringify({ tables: [{ id: table.id, columns: plain.map((c) => ({ id: c.id, fields: strip(c.fields) })) }] }) });
        existingTables.add(table.id);
        console.log(`created  table ${table.id}`);
    } else {
        console.log(`exists   table ${table.id}`);
    }

    const have = new Set((await columnsOf(table.id)).map((c) => c.id));
    const missing = table.columns.filter((c) => !have.has(c.id));
    if (!missing.length) continue;
    if (DRY_RUN) {
        console.log(`would add to ${table.id}: ${missing.map((c) => c.id).join(", ")}`);
        continue;
    }
    await api(`/tables/${table.id}/columns`, { method: "POST", body: JSON.stringify({
        columns: missing.map((c) => ({ id: c.id, fields: strip(c.fields) })),
    }) });
    // What a reference shows is not settable through the columns endpoint.
    const refs = new Map((await columnsOf(table.id)).map((c) => [c.id, c.fields.colRef]));
    const actions = [];
    for (const c of missing.filter((m) => m.fields._show)) {
        const [target, targetCol] = c.fields._show;
        const targetRef = (await columnsOf(target)).find((x) => x.id === targetCol).fields.colRef;
        actions.push(["ModifyColumn", table.id, c.id, { visibleCol: targetRef }]);
        actions.push(["SetDisplayFormula", table.id, null, refs.get(c.id), `$${c.id}.${targetCol}`]);
    }
    if (actions.length) await api("/apply", { method: "POST", body: JSON.stringify(actions) });
    console.log(`added to ${table.id}: ${missing.map((c) => c.id).join(", ")}`);
}

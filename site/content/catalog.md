---
title: "Non Woven Bags & Plastic Covers"
# Shown in the breadcrumb and its schema, where the full title is too long to be
# useful. Falls back to `title` if removed.
breadcrumb: "Catalog"
description: "Every carry bag and cover we manufacture at Dhone — non woven D-cut, U-cut, handle and stitched bags, digital and BOPP laminated printing, plus HM, LD and bio-degradable plastic covers. Pick what you need and send the list on WhatsApp for a same-day rate."
layout: "catalog"

# Unlisted while the catalog is being checked. Nothing on the site links here
# — not the navbar, not the footer, not the homepage product grid — so the page
# is reachable only by typing the URL. noindex keeps it out of Google and, via
# layouts/_default/sitemap.xml, out of the sitemap as well; "follow" is implied
# by the shared head partial so any links out still count.
#
# TO PUBLISH: delete this noindex line, then add the /catalog/ links back to
# layouts/partials/navbar.html, layouts/partials/footer.html and the products
# section of layouts/index.html.
noindex: true

# Everything below is page copy. The PRODUCTS themselves live in
# assets/data/catalog.csv — open that in Google Sheets, fill it in, export as
# CSV and drop it back. Blank rate / min order / pcs-per-kg cells are expected
# and render as "Rate on request"; nothing breaks while they are empty.
#
# The title, description and the About paragraphs name the materials we make.
# They are written by hand, not derived from the sheet, so adding a new material
# column value will NOT update them — check them when the range changes.

lede: "Everything we manufacture at our Dhone unit — non woven carry bags in D-cut, U-cut, handle and stitched shapes, digital and BOPP laminated printing, and HM, LD and bio-degradable plastic covers. Add what you need to an enquiry list and send it to us in one WhatsApp message."

custom:
  title: "Need a size or print we don't list?"
  body: "We print 1–4 colour and full digital, and cut to any size, in non woven fabric or plastic. Send your artwork or a photo of your old bag on WhatsApp and we'll quote the same day."
  button: "Ask on WhatsApp"

stats:
  - value: "2011"
    label: "Manufacturing since"
  - value: "10,000+"
    label: "Shops supplied"
  - value: "3 states"
    label: "AP · Telangana · Karnataka"
  - value: "60+ GSM"
    label: "Govt. norm compliant"

aboutTitle: "About non woven bags and plastic covers"
about:
  - "Non woven bags are made from polypropylene fabric that is bonded rather than woven — light, tear resistant, washable and reusable, and a legal replacement for single use plastic carry bags. Rate depends on the fabric GSM, the bag size and the number of print colours."
  - "Alongside them we make HM and LD plastic covers and bio-degradable covers, in U-cut and D-cut shapes, for the counters where a cover still suits the goods better than a bag."
  - "All of it is supplied to clothing showrooms, sweet shops, jewellery stores, kirana and general stores, seed companies and pharmacies across the Rayalaseema and Telangana belt."
---

---
title: "Non Woven Bags & Plastic Covers"
# Shown in the breadcrumb and its schema, where the full title is too long to be
# useful. Falls back to `title` if removed.
breadcrumb: "Catalog"
# Keep this under ~155 characters. Google truncates around there, and the
# same-day-rate promise at the end is the part that earns the click — it has to
# survive the cut. The full material list lives on the products themselves.
description: "Non woven D-cut, U-cut, handle and stitched bags, plus HM, LD and bio-degradable covers, made at Dhone. Send your list on WhatsApp for a same-day rate."
layout: "catalog"

# Indexable. There is deliberately no `noindex` here: the sitemap template
# (layouts/_default/sitemap.xml) skips any page carrying it, so setting it would
# pull this page out of the sitemap as well.
#
# Filtered views like /catalog/?material=Plastic+Cover are produced client-side
# by history.replaceState, so no crawler is ever handed one as a link, and the
# canonical in the head partial points at the bare /catalog/ regardless. That is
# why robots.txt does not need to disallow the query strings.

# Everything below is page copy. The PRODUCTS themselves live in Grist, in the
# Catalog_Products / Catalog_Prices / Catalog_Photos tables (plus
# Catalog_Colours and Catalog_Price_Types). The deploy workflow pulls them into
# assets/data/catalog.json and assets/images/catalog/ before every build — on
# every push to main and whenever "Run workflow" is pressed in GitHub Actions.
# Never edit those files by hand; the next sync overwrites them. Blank rates are expected
# and render as "Rate on request"; nothing breaks while they are empty.
#
# PHOTOS are one row per photo in Catalog_Photos. A row's Shop_Types is what
# makes it a MEDICAL SHOP photo rather than just another photo: when a buyer
# filters by that trade, those photos move to the front of the product's
# carousel. Leave Shop_Types blank for a plain product shot — blank means
# "generic", and generic is the honest default.
#
# The title, description and the About paragraphs name the materials we make.
# They are written by hand, not derived from Grist, so adding a new material
# value will NOT update them — check them when the range changes.

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

---
title: "Home"
hero:
  # Strip of trust badges, shown on a white band below the headline.
  # Cropped from the original Mobirise hero graphic, which was mostly empty white.
  badges: "images/trust-badges.png"
  heading: "Non Woven Carry Bags and Plastic Covers: Manufacturers & Wholesale Suppliers"
  text: "A manufacturing and supply unit established in 2011. Sri Raja Bags supplies all types of shopping bags and carry bags across three South Indian states — Andhra Pradesh, Telangana and Karnataka — to more than 10,000 customers."
  # The first thing on the page is the enquiry button (goal sheet, workstream B):
  # until Oct 2026 the hero's only button scrolled to the product rail, and the
  # first WhatsApp button was in the contact section at the bottom.
  ctaQuote: "Get a quote on WhatsApp"
  quoteText: "Hello Sri Raja Bags, I need carry bags for my shop. Type: __, size: __ inch, printing: __, quantity: __."
  cta: "See catalog & prices"
  # One line under the buttons: what happens when they tap.
  promise: "Same-day quote on WhatsApp · Delivery across AP, Telangana and Karnataka"

products:
  heading: "Our Products"
  # This rail is drawn from the catalog in Grist (synced to
  # assets/data/catalog.json at build time), not from a list kept here.
  # There used to be a hand-written `items:` block and it had already drifted
  # from what we actually make ("W-Cut Plain bags" is not in the catalog).
  #
  # Rows carrying `featureBadge` lead the rail; the rest of the sheet follows in
  # its own order, up to `limit`. If no row carries the badge the rail is simply
  # the first `limit` rows, so the section can never come out empty.
  featureBadge: "Bestseller"
  limit: 12
  cta: "See the full catalog"

about:
  heading: "About Our Factory"
  text: "Sri Raja Bags manufactures every type of non-woven fabric carry bag and plastic cover at Dhone, in Nandyal district of Andhra Pradesh. We employ around 300 people directly, and provide household work to a further 600 women in the surrounding villages."
  # A still from our production video (Oct 2026): finished bags stacked by colour
  # on the cutting floor.
  image: "images/factory/bag-stacks.jpg"
  alt: "Finished non woven bags stacked by colour on the factory floor while workers cut and fold more"
  more:
    - src: "images/factory/main-hall.jpg"
      alt: "The main production hall with machines, stacks of finished bags and workers"
    - src: "images/factory/outdoor-finishing.jpg"
      alt: "Women sorting and bundling finished bags under the shed beside the factory"
  # Link text has to say where it goes when read on its own — a screen reader
  # lists links out of context, and "Learn more" was the one link Lighthouse
  # flagged as non-descriptive.
  cta: "About our factory"

# The machines on the factory floor, as stills from our production video
# (Oct 2026). Captions say what each machine does; no brand or model names.
machines:
  heading: "Machines Inside Our Factory"
  text: "Every bag is cut, sealed and printed on our own machines at Dhone, so we control the quality and the delivery date of your order."
  items:
    - src: "images/factory/bag-making-line.jpg"
      caption: "Automatic bag-making machine"
      alt: "Automatic non woven bag making machine with an operator stacking finished bags"
    - src: "images/factory/machine-automatic-2.jpg"
      caption: "Second automatic bag-making line"
      alt: "Large automatic bag making machine with fabric rollers and a printed web running through it"
    - src: "images/factory/machine-cutting-sealing.jpg"
      caption: "Fabric cutting and sealing line"
      alt: "Workers guiding orange non woven fabric through a cutting and sealing machine"
    - src: "images/factory/machine-feed-rollers.jpg"
      caption: "Fabric feed rollers on a bag machine"
      alt: "Blue non woven fabric running over the feed rollers of a bag making machine"
    - src: "images/factory/offset-press-room.jpg"
      caption: "Offset printing press"
      alt: "Operator at an offset printing press in the print room, with stacks of printed sheets"
    - src: "images/factory/offset-press-rollers.jpg"
      caption: "Inside the offset press: the ink rollers"
      alt: "Close view of the blue ink rollers inside an offset printing press"

gallery:
  heading: "Bags Gallery"
  # The photos are the catalog's own, synced from Grist (Catalog_Photos) — this
  # section keeps no list of its own, so it can never show a photo the catalog
  # has dropped. It takes up to `limit` of them, one product at a time (every
  # product's first photo, then every product's second, ...), so the strip mixes
  # bag types instead of running twenty plastic covers in a row. Hidden photos
  # never appear. Each one links to its product page under /products/.
  limit: 24
  cta: "Browse the full catalog"

reels:
  heading: "Latest offers & updates"
  profile: "https://www.instagram.com/srirajabags/"
  # The reels themselves come live from the Grist table Website_Reels (Link,
  # Title, Show, Until, Cover), through the website-proxy function on Railway
  # (params.reelsAPI). Changes show within about 5 minutes, no deploy needed.

contact:
  heading: "Contact us"
---

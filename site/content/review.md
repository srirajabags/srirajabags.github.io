---
title: "Leave us a review"
description: "Tell us how your order went. Tap a few options, copy, and paste into Google — takes about 20 seconds."
layout: "review"
noindex: true

intro: "Thanks for your order. A short review helps other shop owners find us — tap a few options below, then paste into Google."

# Step 1 — what they bought. Single select, optional.
products:
  - "D-cut plain bags"
  - "D-cut printed bags"
  - "W-cut bags"
  - "Loop handle bags"
  - "Side-patty stitched bags"
  - "Digital multicolor bags"
  - "BOPP Multicolor Bags"
  - "Printed bags with our shop design"

# Step 2 — what went well. Multi select.
# Deliberately no "was it good? yes/no" gate: Google prohibits filtering review
# requests by sentiment, and a page that only invites happy customers is exactly
# what gets a profile actioned.
aspects:
  - "the bag quality was good"
  - "the printing came out exactly like our design"
  - "delivery was on time"
  - "the price was reasonable"
  - "they replied quickly on WhatsApp"
  - "reordering the same design was easy"
  - "the bags are strong and hold weight well"
  - "the sizes were exactly as ordered"

# Sentence shapes. Picked at random so no two reviews read identically —
# a page that emits the same paragraph every time produces reviews Google
# filters as templated.
openers:
  - "Ordered {product} from Sri Raja Bags."
  - "We buy {product} from Sri Raja Bags for our shop."
  - "Got our {product} from Sri Raja Bags."
  - "Been ordering {product} from Sri Raja Bags."

openersNoProduct:
  - "Ordered bags from Sri Raja Bags."
  - "We buy our shop bags from Sri Raja Bags."
  - "Got our carry bags from Sri Raja Bags."

# Shown as the last step. A photo cannot be attached from here — Google's form
# takes it directly — so this is a prompt, not an upload.
photoPrompt: "If you have a photo of the bags, add it in the review — tap the camera icon in the Google review box. Photos get seen far more than text alone."
photoAlt: "Or send the photo to us on WhatsApp and we will add it to our gallery."

closers:
  - "Happy with the order."
  - "Would order again."
  - "Good to deal with."
  - "Recommended for shop owners."
  - "No complaints."
---

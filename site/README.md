# srirajabags.in

The whole site — landing page and blog — is a [Hugo](https://gohugo.io) project
in this `site/` directory, deployed to GitHub Pages by
`.github/workflows/pages.yml` on every push to `main`.

It was migrated off Mobirise in August 2026. The original Mobirise export
(`index.html`, `assets/`, `project.mobirise`) remains in git history if it is
ever needed.

## Layout

```
site/
  hugo.toml              site config + contact details in [params]
  content/
    _index.md            ALL landing page content (hero, products, about, gallery)
    blog/
      _index.md          blog index page
      *.md               blog posts
  layouts/
    index.html           landing page template
    blog/                blog list + single post templates
    partials/            navbar, footer, analytics, icons
  assets/
    css/main.css         the entire stylesheet
    images/              source images (Hugo resizes them at build time)
```

## Editing content

**Landing page** — everything is in `content/_index.md` front matter. To change
a product name, the hero text, or the gallery, edit that file; no templates
involved. To add a product, add an entry under `products.items` with a `name`,
an `image` under `images/`, and the `enquiry` text used in its WhatsApp link.

**Contact details** — phone, email, social links and the Google Maps embed all
live in `[params]` in `hugo.toml`, so they are set in one place and used by
every template.

**Blog posts** — add a Markdown file to `content/blog/`:

```markdown
---
title: "Choosing between D-cut and W-cut bags"
date: 2026-08-12T09:00:00+05:30
description: "One-line summary for the index page and search results."
tags: ["packaging"]
draft: false
---

Body text. Use `##` for section headings.
```

`draft: true` keeps a post out of the build.

## Images

Put originals in `site/assets/images/` at full resolution. Hugo resizes,
crops and converts them to WebP at build time — never hand-optimise them.
Generated files are cached in `site/resources/` (gitignored, and cached in CI).

## Local preview

```bash
cd site && hugo server
```

The first build takes ~50s while images are processed; later builds are instant.

## Notes

- `assets/css/main.css` is the entire stylesheet (~7 KB minified), replacing
  ~290 KB of Bootstrap and Mobirise CSS. The palette (navy `#05386b`, mint
  `#5cdb95`) and typeface (Inter) are carried over from the Mobirise theme, so
  the design is recognisably the same site.
- The site ships **no JavaScript** except Google Analytics. The mobile menu is a
  CSS-only toggle — the old Mobirise export shipped a hamburger button with no
  JS behind it, so it never actually opened.
- Tag archive pages are disabled (`disableKinds` in `hugo.toml`). To enable
  them, remove that line and add `layouts/_default/taxonomy.html` and
  `term.html`.

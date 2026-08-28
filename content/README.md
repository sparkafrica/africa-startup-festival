# ASF App FAQ — shared content

This folder is the **single source of truth** for App Guide / FAQ content used in the mobile app and on the festival website.

## Files

| File | Purpose |
|------|---------|
| `app-faq.json` | Canonical FAQ document — share this with the web team |

## JSON schema

```json
{
  "meta": {
    "title": "Page title",
    "subtitle": "FAQ subtitle",
    "version": "semver",
    "lastUpdated": "YYYY-MM-DD",
    "event": "Africa Startup Festival",
    "webUrl": "https://kenya.africastartupfestival.com/appfaq",
    "supportEmail": "info@africastartupfestival.com"
  },
  "browseTopics": [
    { "label": "tickets", "sectionId": 5 }
  ],
  "sections": [
    {
      "id": 1,
      "slug": "url-friendly-id",
      "category": "getting-started | tickets | networking | meetings | event | troubleshooting",
      "question": "FAQ question?",
      "answerSummary": "Short answer for search snippets.",
      "keywords": ["search", "terms"],
      "body": [
        { "type": "paragraph", "text": "..." },
        { "type": "bullets", "items": ["..."] },
        { "type": "numbered", "items": ["..."] },
        { "type": "warning", "items": ["..."] },
        { "type": "label", "text": "Required:" }
      ]
    }
  ]
}
```

## Website implementation notes

1. Render each `sections[]` entry as an accordion or anchor link (`#slug`).
2. Use `meta.title` / `meta.subtitle` for the page H1/H2.
3. `answerSummary` works well as meta description per section or for SEO snippets.
4. `browseTopics` can become filter chips at the top of the page.
5. Keep copy identical to the app — users expect parity between app and web.

## App integration

The app imports this file via `src/constants/faqData.ts`. After editing `app-faq.json`:

1. Reload the app (OTA or dev refresh) — no other files need manual sync.
2. Search keywords in `faqData.ts` (`KEYWORD_ALIASES`) can be extended for better in-app search; section `keywords` are the primary source.

## Current sections (v1.1.2)

27 sections (ids 1–27) covering login, tickets, networking, meetings, messaging, startups, schedule, feedback, and troubleshooting.

## Contact

Support: info@africastartupfestival.com

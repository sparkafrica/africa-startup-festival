# Partner Offers API – Frontend/Backend Handshake

## Endpoint

| Method | Path   | Auth        |
|--------|--------|-------------|
| GET    | `/offers/` | Optional `X-SPARK-KEY` header (same key as `/jobs/`) |

Base URL is the same as the rest of the app API (e.g. from env `BASE_URL`).

---

## Request

### Headers

- **X-SPARK-KEY** (optional): Same API key used for `GET /jobs/`. When present, the app sends it; backend may use it for rate limiting or access control.

### Query parameters

| Param         | Type   | Required | Description |
|---------------|--------|----------|-------------|
| `event_ids`   | string | No       | Comma-separated event IDs. App sends current event id (e.g. `10`). |
| `company_type`| string | No       | Filter by company type (e.g. `exhibitor`, `partner`). |
| `search`      | string | No       | Search in title, description, company name. |

**Example:** `GET /offers/?event_ids=10`

---

## Response - Wrapped (recommended, matches rest of API)

```json
{
  "status": "success",
  "message": "",
  "response_code": 200,
  "data": [
    {
      "id": "offer-uuid-1",
      "title": "20% off at Booth 42",
      "description": "Show this offer at our booth for 20% off selected items.",
      "link": "https://example.com/redeem/abc",
      "company_id": "company-123",
      "company_name": "Acme Corp",
      "company_type": "exhibitor",
      "offer_type": "discount",
      "image_url": "https://cdn.example.com/offer.jpg",
      "valid_until": "2026-03-01T23:59:59Z"
    }
  ]
}


## Item shape (each offer)

Frontend TypeScript type the app uses:

| Field          | Type   | Required | Description |
|----------------|--------|----------|-------------|
| `id`           | string | Yes      | Unique offer id. |
| `title`        | string | Yes      | Offer title (e.g. "20% off at Booth 42"). |
| `link`         | string | Yes      | Redemption or detail URL (opened when user taps the card). |
| `company_id`   | string | Yes      | Company/exhibitor/partner id. |
| `company_name` | string | Yes      | Display name of the company. |
| `description`  | string | No       | Short description (shown under title, 2 lines max). |
| `company_type` | string | No       | e.g. `exhibitor`, `partner`. |
| `offer_type`   | string | No       | e.g. `discount`, `promo`, `general`. Shown as a pill on the card. |
| `image_url`    | string | No       | Optional image URL (future use). |
| `valid_until`  | string | No       | ISO 8601 date string; optional expiry. |

Minimum viable item:

```json
{
  "id": "unique-id",
  "title": "Offer title",
  "link": "https://...",
  "company_id": "company-id",
  "company_name": "Company Name"
}
```

---

## Frontend behavior

- **Screen:** Menu → “Partner Offers” opens the Partner Offers screen.
- **List:** One card per offer: title, optional description (2 lines), company name, optional `offer_type` pill, tap opens `link` in browser.
- **Search:** Client-side filter on title, description, company name, offer_type (app still requests with optional `search` query for future server-side search).
- **Refresh:** Pull-to-refresh and retry on error.
- **Empty:** If `data` is `[]` or missing, app shows “No offers yet”.

---

## Summary for backend

1. **GET /offers/** with optional query: `event_ids`, `company_type`, `search`.
2. Optional header: **X-SPARK-KEY** (same as jobs).
3. Return **200** with either:
   - `{ "status": "success", "message": "...", "response_code": 200, "data": [ ... ] }`, or
   - a top-level array of offer objects, or
   - `{ "results": [ ... ] }`.
4. Each offer must have at least: **id**, **title**, **link**, **company_id**, **company_name**. All other fields are optional.

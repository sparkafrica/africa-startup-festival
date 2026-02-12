# Upgrade Ticket – API & flow

## Backend endpoints

### List ticket classes (Event Management)
- **GET /tickets/classes/?event_id={eventId}**  
  (or **GET /tickets/{event_id}/classes/** if your API uses path)
- Returns ticket classes for the event (id, name, user_type, etc.).
- App uses this to build upgrade options (Oasis, Delegate, Chairperson) with correct `new_ticket_class_id`.

### Get single ticket class
- **GET /tickets/classes/{id}/**
- Optional; app uses list endpoint for the upgrade flow.

### Upgrade ticket (purchase)
- **POST /purchase/upgrade-ticket/**
- **Body:** `event_id`, `ticket_id`, `new_ticket_class_id`, `payment_method`, `currency`
- **Payment method enum:** `KORAPAY`, `NGN FOR TESTING` (others can be added by project lead).
- **Response:** `payment_url`, `amount` – app shows amount and redirects user to `payment_url` to complete payment.

## App flow

1. User taps **Upgrade ticket** on My Ticket (only for attendee tiers: Expo, Oasis, Delegate; not Exhibitor/Partner/Chairperson).
2. Modal opens and fetches **GET /tickets/classes/?event_id=...**.
3. Modal filters classes to upgrade targets (Oasis, Delegate, Chairperson by name/user_type), sorts by tier order.
4. User selects target pass and **payment method** (Korapay or NGN for Testing).
5. User taps **Upgrade to [tier]** → **POST /purchase/upgrade-ticket/** with selected `new_ticket_class_id` and `payment_method`.
6. On success, backend returns `payment_url` and `amount`; app shows “Amount to pay: X. You will be redirected…” and offers **Open payment** to open the link.

## Adding more payment methods

Edit **UPGRADE_PAYMENT_METHODS** in `src/services/ticketService.ts`:

```ts
export const UPGRADE_PAYMENT_METHODS = [
  { value: "KORAPAY", label: "Korapay" },
  { value: "NGN FOR TESTING", label: "NGN (Testing)" },
  // { value: "NEW_METHOD", label: "New Method" },
] as const;
```

Use the exact `value` string the backend expects in the enum.

# In-app chat — what we need next (junior-friendly checklist)

This is a living list of **what the mobile app needs** from you / backend so we can go from **REST-only** to **production-ready** 1:1 chat (Pusher + polish).

---

## Already in place (REST)

- Open conversation, load recent messages, send message (`ChatContext` + `chatService`).
- Pull-to-refresh on the conversation screen re-fetches messages from the API.

---

## From backend dev (confirm in writing)

1. **Private channel names** (exact strings)  
   - Example pattern from the HTML tester: `private-conversation-{conversationId}`, `private-user-{userId}`.  
   - Confirm these match production and any edge cases (new conversation, blocked user, etc.).

2. **Pusher event names + JSON payload**  
   - e.g. `new-message`: field names for `id`, `content`, `timestamp`, `sender_email`, etc. (should align with your `ChatMessage` type or document differences).  
   - Any other events the app should handle (`new-conversation`, typing, read receipts, etc.).

3. **`POST /pusher/auth/`**  
   - Confirmed: `application/x-www-form-urlencoded` with `socket_id`, `channel_name`.  
   - Response: `{ auth: "..." }` (and `channel_data` if used).  
   - CORS: only relevant for **browser** tests (the HTML file), not for the native app.

4. **Pusher app key + cluster** (public)  
   - Same values for dev/staging/prod as appropriate.  
   - Mobile app will need them in config (e.g. `env` / EAS secrets) — not user tokens.

5. **Optional: pagination / “load older messages”**  
   - If you only return “recent N”, document how to fetch older pages so we can add “load more” later.

6. **Push notifications vs Pusher**  
   - If you want a **system notification** when the app is backgrounded, backend must trigger **FCM** (or equivalent); Pusher alone is usually **in-app live updates**.

---

## From you (mobile / product)

1. **Which environments** to point at (dev API vs prod) when testing Pusher.  
2. **Test accounts** (two users, connected, same event) for manual QA.  
3. **Whether** you want `mark_read` when opening a thread (unread badges later).  
4. **Analytics / error reporting** expectations for failed subscribe or send.

---

## Next coding step (after backend confirms channel + event shape)

1. Add Pusher client dependency and config (key, cluster, authorizer calling existing `pusherAuth()`).  
2. On `Conversation` screen focus: subscribe to `private-conversation-{id}`, bind `new-message`, merge into state with **dedupe by message id**.  
3. Unsubscribe on blur/unmount to avoid leaks.  
4. Keep pull-to-refresh as a fallback when websocket misses or user wants explicit reload.

---

## Related docs

- `docs/PUSHER_TEST_GUIDE.md` — what the standalone HTML tester is for and how it maps to the app.

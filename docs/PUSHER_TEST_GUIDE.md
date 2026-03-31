# Pusher test page (`pusher-test.html`) — what it is and how to use it

This guide explains the **standalone HTML tester** your backend team shared (e.g. `pusher-test.html` opened in a browser). It is **not** part of the React Native app; it mirrors what the app will do later with `pusher-js` / native Pusher.

## What the file does

1. **Loads Pusher JS** from the CDN (`pusher.min.js`).
2. **Lets you pick a “user”** (pre-seeded auth tokens in the page) so requests use  
   `Authorization: Token <token>` — same style as the mobile app (`api.ts` uses `Token ${token}`).
3. **Connects to Pusher** with:
   - **Pusher key** + **cluster** (public, safe to embed in clients).
   - **`authEndpoint`**: `{API_BASE_URL}/pusher/auth/` — matches your backend and `pusherAuth()` in `src/services/chatService.ts`.
4. **Subscribes to private channels** built as:
   - **User channel:** `private-user-{userId}`  
     Example id: backend user id string.
   - **Conversation channel:** `private-conversation-{conversationId}`  
     Example: numeric conversation id from the app / API.
5. **Listens for events** (as in the test page):
   - `new-message` — main one for chat; payload is logged and shown in the UI.
   - `new-conversation`, `user-ping`, plus `bind_global` for any other event names during debugging.

So the file is a **manual integration test**: verify tokens, `/pusher/auth/`, channel names, and event payloads before wiring the same into `ChatContext` / `ConversationScreen`.

## What you must configure in the HTML file

Edit the constants at the top of the `<script>` block (names may vary slightly):

- **`API_BASE_URL`** — Must reach your Django/API **from the browser**.
  - `http://localhost:8000` only works if the API runs on your machine **and** the browser can call it.
  - For a phone or another PC, use your LAN IP or dev tunnel URL.
- **`PUSHER_KEY`** / **`PUSHER_CLUSTER`** — From your Pusher dashboard (or backend docs).
- **User tokens** in the `<select>` — Must be valid API tokens for test users.

> **CORS:** Browsers enforce CORS on `authEndpoint`. If `/pusher/auth/` fails in the browser but works in the app, allow the origin you open the HTML from (or use a dev proxy). The **React Native app does not use CORS** for the same API.

## Suggested test flow (real-time chat)

1. Open `pusher-test.html` in Chrome (or any browser).
2. Choose **User A**, click **Connect** — confirm “Connected” in the log.
3. Subscribe to **`private-conversation-{id}`** using the **conversation id** from a real thread (same as in the app after `getOrCreateConversation` / API).
4. On another machine / incognito / second browser profile, repeat as **User B** on the **same** `private-conversation-{id}` (if your backend allows both participants on that channel).
5. Send a message via the **app** or **POST** `send_message` — you should see a **`new-message`** event in the log with the payload shape the app will parse.

## Mapping to the Spark app (next implementation step)

| Test page | Mobile app |
|-----------|------------|
| `authEndpoint` + `Token` header | `pusherAuth()` in `chatService.ts` + axios `Authorization` from `AsyncStorage` |
| `private-conversation-{id}` | Subscribe when opening `Conversation` with that `conversationId` |
| `new-message` | Append/update `messagesByConversationId` (dedupe by `message.id`) |
| `private-user-{userId}` | Optional: inbox badges / “new conversation” when not on thread screen |

**In-app push notifications** for new chat messages are separate from Pusher: they usually go through **FCM** + your existing `notificationService` / `expo-notifications`. Pusher is for **foreground / in-app** live updates; the backend can still trigger a push when a message is created.

## Security note

Do not commit real **user tokens** or production secrets into the repo. Keep `pusher-test.html` local or redact tokens before sharing.

## Related

- **`docs/CHAT_PRODUCTION_CHECKLIST.md`** — what to ask backend / what we implement next (Pusher in the app, pull-to-refresh already there as a fallback).

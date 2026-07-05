import aasa from "./well-known/apple-app-site-association.json";
import assetlinks from "./well-known/assetlinks.json";

const APP_STORE_URL =
  "https://apps.apple.com/ng/app/africa-technology-expo/id6757281613";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.sparkllc.mobile&pcampaignid=web_share";

const fallbackHTML = (title: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Africa Startup Festival</title>
  <style>
    body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center;
           justify-content: center; min-height: 100vh; margin: 0; background: #000; color: #fff; text-align: center; padding: 1rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p  { color: #aaa; margin-bottom: 2rem; }
    .buttons { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; }
    a  { padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .ios     { background: #fff; color: #000; }
    .android { background: #3ddc84; color: #000; }
  </style>
</head>
<body>
  <h1>Open in the App</h1>
  <p>You need the Africa Startup Festival app to view this.</p>
  <div class="buttons">
    <a class="ios"     href="${APP_STORE_URL}">Download on iOS</a>
    <a class="android" href="${PLAY_STORE_URL}">Get it on Android</a>
  </div>
</body>
</html>`;

const port = process.env.PORT ?? 3000;

Bun.serve({
  port,

  fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // ── Well-known files ──────────────────────────────────────────────
    if (path === "/.well-known/apple-app-site-association") {
      return new Response(JSON.stringify(aasa), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      });
    }

    if (path === "/.well-known/assetlinks.json") {
      return new Response(JSON.stringify(assetlinks), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      });
    }

    // home page
    if (path === "/") {
      return new Response(fallbackHTML("Home"), {
        headers: { "Content-Type": "text/html" },
        status: 200,
      });
    }

    // ── Deep link fallback pages ──────────────────────────────────────
    if (path === "/meetings") {
      return new Response(fallbackHTML("Meetings"), {
        headers: { "Content-Type": "text/html" },
        status: 200,
      });
    }

    if (path === "/meetings/inbound") {
      return new Response(fallbackHTML("Meetings"), {
        headers: { "Content-Type": "text/html" },
        status: 200,
      });
    }

    if (path === "/connections") {
      return new Response(fallbackHTML("Connections"), {
        headers: { "Content-Type": "text/html" },
        status: 200,
      });
    }

    if (path === "/profile") {
      return new Response(fallbackHTML("Profile"), {
        headers: { "Content-Type": "text/html" },
        status: 200,
      });
    }

    // ── Download redirect ─────────────────────────────────────────────
    if (path === "/download") {
      const ua = req.headers.get("user-agent") ?? "";
      const isIOS = /iphone|ipad|ipod/i.test(ua);
      const isAndroid = /android/i.test(ua);

      if (isIOS) {
        return Response.redirect(APP_STORE_URL, 302);
      } else if (isAndroid) {
        return Response.redirect(PLAY_STORE_URL, 302);
      } else {
        // Desktop / unknown: redirect to a web landing page
        return Response.redirect("/", 302);
      }
    }

    // ── 404 ───────────────────────────────────────────────────────────
    return new Response("Not found", { status: 404 });
  },
});

console.log(`Server running on http://localhost:${port}`);

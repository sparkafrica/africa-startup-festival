/// <reference path="./bun-globals.d.ts" />
import aasa from "./well-known/apple-app-site-association.json";
import assetlinks from "./well-known/assetlinks.json";

/** Update APP_STORE_URL when the ASF listing is live in App Store Connect. */
const APP_STORE_URL =
  process.env.ASF_APP_STORE_URL ??
  "https://apps.apple.com/app/africa-startup-festival/id0000000000";
const PLAY_STORE_URL =
  process.env.ASF_PLAY_STORE_URL ??
  "https://play.google.com/store/apps/details?id=com.sparkllc.asf";

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

const port = Number(process.env.PORT) || 3000;

function htmlFallback(title: string) {
  return new Response(fallbackHTML(title), {
    headers: { "Content-Type": "text/html" },
    status: 200,
  });
}

Bun.serve({
  port,

  fetch(req: Request) {
    const url = new URL(req.url);
    const path = url.pathname;

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

    if (path === "/") {
      return htmlFallback("Home");
    }

    if (
      path === "/meetings" ||
      path.startsWith("/meetings/") ||
      path === "/connections" ||
      path.startsWith("/connections/") ||
      path === "/attendees" ||
      path.startsWith("/attendees/") ||
      path === "/schedule" ||
      path.startsWith("/schedule/") ||
      path === "/exhibitors" ||
      path.startsWith("/exhibitors/") ||
      path === "/partners" ||
      path.startsWith("/partners/") ||
      path === "/profile" ||
      path.startsWith("/profile/")
    ) {
      const segment = path.split("/").filter(Boolean)[0] ?? "Link";
      const title = segment.charAt(0).toUpperCase() + segment.slice(1);
      return htmlFallback(title);
    }

    if (path === "/download") {
      const ua = req.headers.get("user-agent") ?? "";
      const isIOS = /iphone|ipad|ipod/i.test(ua);
      const isAndroid = /android/i.test(ua);

      if (isIOS) {
        return Response.redirect(APP_STORE_URL, 302);
      }
      if (isAndroid) {
        return Response.redirect(PLAY_STORE_URL, 302);
      }
      return Response.redirect("/", 302);
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(`ASF deeplink server on http://localhost:${port}`);

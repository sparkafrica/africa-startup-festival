/** Minimal globals for the ASF deeplink Bun server. */
declare const Bun: {
  serve(options: {
    port: number;
    fetch: (req: Request) => Response | Promise<Response>;
  }): { port: number };
};

declare const process: {
  env: Record<string, string | undefined>;
};

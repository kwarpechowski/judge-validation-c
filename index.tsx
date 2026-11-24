// Remote judge-validation app for paper C (R8-C3 manual validation).
// Artifacts (UI + sample) are fetched at startup from the public GitHub repo.
const RAW = "https://raw.githubusercontent.com/kwarpechowski/judge-validation-c/master/";
const [HTML, SAMPLE] = await Promise.all([
  fetch(RAW + "app.html").then(r => r.text()),
  fetch(RAW + "manual_sample_nq.json").then(r => r.text()),
]);

const server = Bun.serve({
  port: Number(Bun.env.PORT ?? 8080),
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/health") return new Response("ok");
    if (url.pathname === "/manual_sample_nq.json")
      return new Response(SAMPLE, { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
    return new Response(HTML, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
  },
});
console.log("judge-validation up on " + server.port);

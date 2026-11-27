// Remote judge-validation app for paper C (R8-C3 manual validation).
// Artifacts fetched from the public GitHub repo; annotations autosaved to /data.
const RAW = "https://raw.githubusercontent.com/kwarpechowski/judge-validation-c/master/";
const [HTML, SAMPLE, SAMPLE_HP] = await Promise.all([
  fetch(RAW + "app.html").then(r => r.text()),
  fetch(RAW + "manual_sample_nq.json").then(r => r.text()),
  fetch(RAW + "manual_sample_hotpotqa.json").then(r => r.text()),
]);



function savePath(url) {
  const ds = new URL(url).searchParams.get("sample") === "hotpotqa" ? "hotpotqa" : "nq";
  return "/data/annotations_" + ds + ".json";
}
async function readAnnotations(path) {
  try { return await Bun.file(path).text(); }
  catch { return "{}"; }
}

const server = Bun.serve({
  port: Number(Bun.env.PORT ?? 8080),
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/health") return new Response("ok");
    if (url.pathname === "/api/annotations" && req.method === "POST") {
      const SAVE_PATH = savePath(req.url);
      const body = await req.text();
      try {
        const parsed = JSON.parse(body);
        if (typeof parsed !== "object" || parsed === null || !Array.isArray(parsed.marks)) {
          return new Response("bad payload", { status: 400 });
        }
        parsed.received_at = new Date().toISOString();
        parsed.source = req.headers.get("x-forwarded-for") ?? "unknown";
        await Bun.write(SAVE_PATH, JSON.stringify(parsed, null, 1));
        return new Response(JSON.stringify({ ok: true, received_at: parsed.received_at }), {
          headers: { "content-type": "application/json" } });
      } catch (e) {
        return new Response("invalid json", { status: 400 });
      }
    }
    if (url.pathname === "/api/annotations" && req.method === "GET") {
      return new Response(await readAnnotations(savePath(req.url)), {
        headers: { "content-type": "application/json; charset=utf-8",
                   "cache-control": "no-store" } });
    }
    if (url.pathname === "/manual_sample_nq.json")
      return new Response(SAMPLE, { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
    if (url.pathname === "/manual_sample_hotpotqa.json")
      return new Response(SAMPLE_HP, { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
    return new Response(HTML, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
  },
});
console.log("judge-validation up on " + server.port);

/* Minimal Chrome DevTools Protocol client, shared by the audit scripts. */
export async function connect(port = 9333) {
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = targets.find((t) => t.type === "page");
  if (!page) throw new Error("no page target");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  };
  const send = (method, params = {}) =>
    new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });

  await send("Page.enable");
  await send("Runtime.enable");

  return {
    send,
    close: () => ws.close(),
    async viewport(width, height = 1000) {
      await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
    },
    /**
     * Put answers in localStorage BEFORE any page script runs.
     * Seeding after load is always too late: storage.js caches state in
     * memory on first read, so a later setItem is ignored and then
     * overwritten by the next save.
     */
    async seed(stateObject) {
      const source = `try { localStorage.setItem("ywb:v1", ${JSON.stringify(JSON.stringify(stateObject))}); } catch (e) {}`;
      const { result } = await send("Page.addScriptToEvaluateOnNewDocument", { source });
      return result?.identifier;
    },
    async unseed(identifier) {
      if (identifier) await send("Page.removeScriptToEvaluateOnNewDocument", { identifier });
    },
    async goto(url, settle = 700) {
      await send("Page.navigate", { url });
      await new Promise((r) => setTimeout(r, settle));
    },
    async evaluate(expression) {
      const out = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
      if (out.result?.exceptionDetails) throw new Error(out.result.exceptionDetails.text);
      return out.result?.result?.value;
    },
  };
}

/*
  In-memory rate limiting. Fine for a single container, which is what this is.
  Two independent buckets per request: the caller's IP, and the recipient
  address — so one IP can't blast many addresses, and one address can't be
  mail-bombed from many IPs.
*/

const buckets = new Map();

const hitsFor = (id, windowMs) => {
  const now = Date.now();
  return (buckets.get(id) || []).filter((t) => now - t < windowMs);
};

/** True if this key is already at its limit. Records nothing. */
export function atLimit(key, bucket, max, windowMs) {
  if (!key) return false;
  const id = `${bucket}:${key}`;
  const hits = hitsFor(id, windowMs);
  buckets.set(id, hits);
  return hits.length >= max;
}

/** Count one use against this key. */
export function record(key, bucket, windowMs) {
  if (!key) return;
  const id = `${bucket}:${key}`;
  const hits = hitsFor(id, windowMs);
  hits.push(Date.now());
  buckets.set(id, hits);
}

/** Check and record in one go — for guards where every request counts. */
export function limited(key, bucket, max, windowMs) {
  if (atLimit(key, bucket, max, windowMs)) return true;
  record(key, bucket, windowMs);
  return false;
}

/** Drop expired entries so the map can't grow without bound. */
export function sweep(maxAgeMs = 86_400_000) {
  const now = Date.now();
  for (const [id, hits] of buckets) {
    const live = hits.filter((t) => now - t < maxAgeMs);
    if (live.length) buckets.set(id, live);
    else buckets.delete(id);
  }
}

setInterval(() => sweep(), 3_600_000).unref?.();

/** The client IP, trusting the proxy header Coolify sets. */
export function clientIp(headers) {
  const forwarded = headers.get?.("x-forwarded-for") || headers["x-forwarded-for"] || "";
  return String(forwarded).split(",")[0].trim()
    || headers.get?.("x-real-ip")
    || "unknown";
}

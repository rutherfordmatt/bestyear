/*
  Ported from the Values Finder (/Users/mattrutherford/Dev/Values/server/ghost.js)
  so both sites handle Ghost identically. Unchanged except for this note.

  Gotcha worth keeping: use the NON-redirecting Ghost admin URL. A redirect
  strips the Authorization header and you get a 403.
*/
import { createHmac } from "node:crypto";

const b64url = (buf) => Buffer.from(buf).toString("base64url");

/** Short-lived JWT for the Ghost Admin API, from an "id:secret" Admin API key. */
function adminToken(key) {
  const [id, secret] = key.split(":");
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT", kid: id }));
  const payload = b64url(JSON.stringify({ iat: now, exp: now + 300, aud: "/admin/" }));
  const sig = createHmac("sha256", Buffer.from(secret, "hex")).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${sig}`;
}

async function adminApi(base, adminKey, path, { method = "GET", body } = {}) {
  const res = await fetch(`${base}/ghost/api/admin/${path}`, {
    method,
    headers: { Authorization: `Ghost ${adminToken(adminKey)}`, "Content-Type": "application/json", "Accept-Version": "v5.0" },
    redirect: "manual",
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Ghost admin ${method} ${path.split("?")[0]} ${res.status}: ${await res.text()}`);
  return res.json();
}

/**
 * Someone who is already a member ticked the box: add the label so they show up as using the tool,
 * and if they had unsubscribed from every newsletter, subscribe them to the default ones again (they just opted in).
 */
async function updateExistingMember({ base, adminKey, label, email }) {
  const filter = encodeURIComponent(`email:'${email.replace(/'/g, "\\'")}'`);
  const { members } = await adminApi(base, adminKey, `members/?filter=${filter}&include=labels,newsletters&limit=1`);
  const member = members?.[0];
  if (!member) return { method: "admin", existing: true };

  const update = {};
  const labels = (member.labels || []).map((l) => ({ name: l.name }));
  if (label && !labels.some((l) => l.name.toLowerCase() === label.toLowerCase())) update.labels = [...labels, { name: label }];

  let resubscribed = false;
  if (!(member.newsletters || []).length) {
    const { newsletters } = await adminApi(base, adminKey, "newsletters/?filter=status:active%2Bsubscribe_on_signup:true&limit=all");
    if (newsletters?.length) { update.newsletters = newsletters.map((n) => ({ id: n.id })); resubscribed = true; }
  }

  if (Object.keys(update).length) await adminApi(base, adminKey, `members/${member.id}/`, { method: "PUT", body: { members: [update] } });
  return { method: "admin", existing: !resubscribed, resubscribed };
}

/**
 * Add someone to the Ghost newsletter.
 * With an Admin API key (Ghost Pro Publisher plan and above), members are created directly and labelled.
 * Without one, falls back to Ghost's public sign-up flow, which sends its own confirmation email.
 */
export async function subscribeToGhost({ ghostUrl, adminKey, label, email, name }) {
  const base = ghostUrl.replace(/\/+$/, "");
  if (adminKey) {
    const res = await fetch(`${base}/ghost/api/admin/members/`, {
      method: "POST",
      headers: { Authorization: `Ghost ${adminToken(adminKey)}`, "Content-Type": "application/json", "Accept-Version": "v5.0" },
      redirect: "manual", // a redirect here means GHOST_URL isn't the admin domain
      body: JSON.stringify({ members: [{ email, name: name || undefined, labels: label ? [{ name: label }] : [] }] }),
    });
    if (res.status >= 300 && res.status < 400) throw new Error(`Ghost admin redirected to ${res.headers.get("location")}; set GHOST_URL to that domain`);
    if (res.ok) return { method: "admin" };
    const body = await res.text();
    if (res.status === 422 && /already exists/i.test(body)) return updateExistingMember({ base, adminKey, label, email });
    throw new Error(`Ghost admin ${res.status}: ${body}`);
  }

  // Public sign-up: Ghost emails a confirmation link, so this is double opt-in.
  const headers = { "Content-Type": "application/json", Origin: base, Referer: `${base}/` };
  let integrityToken;
  try {
    const t = await fetch(`${base}/members/api/integrity-token/`, { headers });
    if (t.ok) integrityToken = (await t.text()).trim();
  } catch {}
  const res = await fetch(`${base}/members/api/send-magic-link/`, {
    method: "POST", headers,
    body: JSON.stringify({ email, name: name || undefined, emailType: "signup", labels: label ? [label] : [], integrityToken }),
  });
  if (!res.ok) throw new Error(`Ghost signup ${res.status}: ${await res.text()}`);
  return { method: "magic-link" };
}

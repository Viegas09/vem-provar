import { supabaseAdmin } from "./_supabaseAdmin.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const origin = `${proto}://${req.headers.host}`;
  const dashboardUrl = `${origin}/parceiro/painel`;

  const { code, state } = req.query;

  if (!code || !state || !UUID_RE.test(state)) {
    res.writeHead(302, { Location: `${dashboardUrl}?mp=error` });
    return res.end();
  }

  try {
    const tokenRes = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.VITE_MP_CLIENT_ID,
        client_secret: process.env.MP_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: `${origin}/api/mp-oauth-callback`,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      res.writeHead(302, { Location: `${dashboardUrl}?mp=error` });
      return res.end();
    }

    const admin = supabaseAdmin();
    const { error: credError } = await admin.from("restaurant_mp_credentials").upsert({
      restaurant_id: state,
      mp_user_id: String(tokenData.user_id || ""),
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      connected_at: new Date().toISOString(),
    });
    if (credError) throw credError;

    const { error: restError } = await admin.from("restaurants").update({ mp_connected: true }).eq("id", state);
    if (restError) throw restError;

    res.writeHead(302, { Location: `${dashboardUrl}?mp=connected` });
    return res.end();
  } catch (err) {
    console.error("mp-oauth-callback error", err);
    res.writeHead(302, { Location: `${dashboardUrl}?mp=error` });
    return res.end();
  }
}

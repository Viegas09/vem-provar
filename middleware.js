// Intercepta só os robôs que geram preview de link (WhatsApp, Facebook, Twitter/X, etc.) na
// página de um restaurante, e devolve um HTML enxuto com as tags og:/twitter: certas pra aquele
// restaurante. Visitantes de verdade continuam caindo no SPA normal (index.html via rewrite).
export const config = {
  matcher: ["/restaurante/:slug"],
};

const BOT_UA = /facebookexternalhit|Facebot|WhatsApp|Twitterbot|Slackbot|TelegramBot|LinkedInBot|Discordbot|Pinterest|SkypeUriPreview|Googlebot|bingbot/i;

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export default async function middleware(request) {
  const ua = request.headers.get("user-agent") || "";
  if (!BOT_UA.test(ua)) return;

  const url = new URL(request.url);
  const slug = decodeURIComponent(url.pathname.replace(/^\/restaurante\//, ""));
  if (!slug) return;

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return;

  let restaurant = null;
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/restaurants?slug=eq.${encodeURIComponent(slug)}&suspended=eq.false&select=name,category,rating,delivery_time`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } }
    );
    if (res.ok) {
      const rows = await res.json();
      restaurant = rows[0] || null;
    }
  } catch {
    return;
  }
  if (!restaurant) return;

  const title = `${restaurant.name} · Vem Provar`;
  const description = [
    restaurant.category || "Delivery",
    "em Itapecerica da Serra",
    restaurant.rating ? `· ★ ${Number(restaurant.rating).toFixed(1)}` : null,
    restaurant.delivery_time ? `· ${restaurant.delivery_time} min` : null,
  ].filter(Boolean).join(" ") + " — peça pelo Vem Provar.";
  const pageUrl = url.toString();
  const image = `${url.origin}/icon-512.png`;

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:url" content="${escapeHtml(pageUrl)}" />
<meta property="og:site_name" content="Vem Provar" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(image)}" />
<meta http-equiv="refresh" content="0; url=${escapeHtml(pageUrl)}" />
</head>
<body></body>
</html>`;

  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}

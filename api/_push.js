import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_CONTACT_EMAIL || "contato@vemprovar.com.br"}`,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export async function notifyUser(admin, userId, { title, body, url }) {
  if (!userId) return;
  await admin.from("notifications").insert({ user_id: userId, title, body, url });
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

  const { data: subs } = await admin.from("push_subscriptions").select("*").eq("user_id", userId);
  const payload = JSON.stringify({ title, body, url });

  await Promise.all(
    (subs || []).map((s) =>
      webpush
        .sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
        .catch(async (err) => {
          if (err.statusCode === 404 || err.statusCode === 410) {
            await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
          }
        })
    )
  );
}

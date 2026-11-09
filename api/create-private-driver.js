import crypto from "node:crypto";
import { supabaseAdmin } from "./_supabaseAdmin.js";

const PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

function randomPassword(length = 10) {
  let out = "";
  for (let i = 0; i < length; i++) out += PASSWORD_CHARS[crypto.randomInt(PASSWORD_CHARS.length)];
  return out;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const { restaurantId, name, phone, vehicleType } = req.body || {};
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!restaurantId || !name || !token) {
    res.status(400).json({ error: "missing_params" });
    return;
  }

  try {
    const admin = supabaseAdmin();

    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData?.user) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    const { data: restaurant } = await admin.from("restaurants").select("id, owner_id").eq("id", restaurantId).maybeSingle();
    if (!restaurant || restaurant.owner_id !== userData.user.id) {
      res.status(403).json({ error: "forbidden" });
      return;
    }

    const email = `motoboy-${crypto.randomUUID().slice(0, 8)}@entregadores.vemprovar.com.br`;
    const password = randomPassword();

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    if (createError || !created?.user) {
      console.error("create-private-driver: createUser failed", createError);
      res.status(500).json({ error: "internal_error" });
      return;
    }

    const { error: driverError } = await admin.from("drivers").insert({
      user_id: created.user.id,
      restaurant_id: restaurantId,
      full_name: name,
      phone: phone || null,
      vehicle_type: vehicleType || "moto",
      available: true,
    });
    if (driverError) {
      // limpa o usuário criado se não deu pra criar a linha de driver, pra não deixar lixo órfão
      await admin.auth.admin.deleteUser(created.user.id).catch(() => {});
      throw driverError;
    }

    res.status(200).json({ email, password });
  } catch (err) {
    console.error("create-private-driver error", err);
    res.status(500).json({ error: "internal_error" });
  }
}

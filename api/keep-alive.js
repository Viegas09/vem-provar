import { supabaseAdmin } from "./_supabaseAdmin.js";

// chamado uma vez por dia pelo cron do Vercel (vercel.json) só pra gerar uma
// requisição real no Supabase — no plano grátis, o projeto pausa sozinho depois
// de ~7 dias sem nenhuma atividade, e isso evita que isso aconteça de novo
export default async function handler(req, res) {
  try {
    const admin = supabaseAdmin();
    await admin.from("restaurants").select("id").limit(1);
    res.status(200).json({ ok: true, pinged_at: new Date().toISOString() });
  } catch (err) {
    console.error("keep-alive error", err);
    res.status(200).json({ ok: false });
  }
}

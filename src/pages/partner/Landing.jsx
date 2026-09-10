import { Link } from "react-router-dom";
import {
  X, Store, Truck, ArrowRight, ClipboardList, Bell, Wallet, LayoutDashboard,
  MapPin, Tag, CheckCircle2, Sparkles,
} from "lucide-react";
import { C, FONT, RADIUS, SHADOW } from "../../theme";
import { PROMO_DAYS, COMMISSION_RATES } from "../../lib/commission";
import WORDMARK_ONORANGE from "../../assets/wordmark-onorange.png";
import WORDMARK_LIGHT from "../../assets/wordmark-light.png";

const STEPS = [
  {
    icon: ClipboardList,
    title: "Cadastre seu restaurante",
    desc: "Nome, endereço e o cardápio com fotos. Leva poucos minutos e já pode publicar.",
  },
  {
    icon: Bell,
    title: "Receba pedidos em tempo real",
    desc: "Chegam direto no seu painel, com alerta sonoro — sem precisar instalar nada.",
  },
  {
    icon: Truck,
    title: "Escolha como entregar",
    desc: "Você mesmo faz a entrega, ou deixa com os entregadores cadastrados na plataforma.",
  },
];

const BENEFITS = [
  { icon: Wallet, title: "Sem mensalidade", desc: "Você só paga comissão quando vende. Nunca uma taxa fixa por estar no app." },
  { icon: Sparkles, title: `Repasse em D+1`, desc: "Pix cai em 1 dia, cartão em 2. Sem taxa de antecipação pra receber mais rápido." },
  { icon: LayoutDashboard, title: "Painel completo", desc: "Pedidos, cardápio, cupons e faturamento — tudo num lugar só, no navegador." },
  { icon: MapPin, title: "Cliente acompanha ao vivo", desc: "Mapa em tempo real e notificação automática a cada etapa do pedido." },
  { icon: Tag, title: "Seus próprios cupons", desc: "Crie promoções quando quiser, sem depender de ninguém aprovar." },
];

const PLANS = [
  {
    key: "basico", icon: Store, title: "Básico", commission: COMMISSION_RATES.basico,
    desc: "A entrega é por sua conta — você mesmo ou um entregador seu.",
  },
  {
    key: "entrega", icon: Truck, title: "Entrega", commission: COMMISSION_RATES.entrega,
    desc: "O Vem Provar cuida da entrega, com entregadores cadastrados na plataforma.",
  },
];

function Section({ children, style }) {
  return <section className="vp-wrap" style={{ padding: "56px 24px", ...style }}>{children}</section>;
}

export default function PartnerLanding() {
  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
      <Link to="/" aria-label="Fechar" title="Voltar para a home"
        style={{ position: "fixed", top: 18, right: 18, zIndex: 40, width: 38, height: 38, borderRadius: RADIUS.pill,
                 background: "#fff", border: `1px solid ${C.line}`, display: "grid", placeItems: "center", boxShadow: SHADOW.xs }}>
        <X size={18} color={C.black} />
      </Link>

      {/* ── Hero ── */}
      <div style={{ background: `linear-gradient(160deg, ${C.orange}, ${C.orangeDark})` }}>
        <Section style={{ paddingTop: 40, paddingBottom: 48 }}>
          <img src={WORDMARK_ONORANGE} alt="Vem Provar" style={{ height: 34, width: "auto", marginBottom: 32 }} draggable={false} />

          <div className="vp-fade-in" style={{ maxWidth: 560 }}>
            <span style={{ display: "inline-block", background: "rgba(255,255,255,.16)", color: "#fff", fontSize: 12.5,
                 fontWeight: 700, padding: "6px 14px", borderRadius: RADIUS.pill, marginBottom: 18 }}>
              Pra restaurantes de Itapecerica da Serra
            </span>
            <h1 style={{ color: "#fff", fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 700, lineHeight: 1.12, margin: "0 0 14px", letterSpacing: -0.5 }}>
              Sua cozinha no maior portal de gastronomia da cidade
            </h1>
            <p style={{ color: "rgba(255,255,255,.9)", fontSize: 16, lineHeight: 1.55, margin: "0 0 28px", maxWidth: 460 }}>
              Cadastre seu cardápio, receba pedidos em tempo real e escolha como funciona a entrega.
              Sem mensalidade, sem letra miúda.
            </p>

            <div className="flex items-center gap-3" style={{ flexWrap: "wrap" }}>
              <Link to="/parceiro/criar-conta" className="flex items-center justify-center gap-2"
                style={{ background: "#fff", color: C.orangeDark, textDecoration: "none", fontWeight: 700, fontSize: 15.5,
                         padding: "15px 28px", borderRadius: RADIUS.md, boxShadow: SHADOW.sm }}>
                Cadastrar meu restaurante <ArrowRight size={18} />
              </Link>
              <Link to="/parceiro/entrar" style={{ color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: 14.5 }}>
                Já tenho conta · Entrar
              </Link>
            </div>
          </div>
        </Section>
      </div>

      {/* ── promo ── */}
      <Section style={{ paddingBottom: 8 }}>
        <div className="flex items-center gap-3" style={{ background: "rgba(46,158,91,.08)", color: C.ok,
             borderRadius: RADIUS.lg, padding: "16px 20px", flexWrap: "wrap" }}>
          <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 14.5, fontWeight: 700 }}>
            Primeiros {PROMO_DAYS} dias sem nenhuma comissão, em qualquer plano.
          </span>
        </div>
      </Section>

      {/* ── como funciona ── */}
      <Section>
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px" }}>Como funciona</h2>
        <p style={{ fontSize: 14.5, color: C.grayText, margin: "0 0 28px", maxWidth: 480 }}>
          Do cadastro ao primeiro pedido, sem enrolação.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.title}>
                <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: RADIUS.md, background: "rgba(238,108,26,.1)",
                       display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <Icon size={20} color={C.orange} />
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: C.gray }}>Passo {i + 1}</span>
                </div>
                <h3 style={{ fontSize: 16.5, fontWeight: 700, margin: "0 0 6px" }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: C.grayText, lineHeight: 1.55, margin: 0 }}>{s.desc}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── benefícios ── */}
      <Section style={{ background: C.surface }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 28px" }}>O que você ganha</h2>
        <div className="vp-card-grid">
          {BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <div key={b.title} style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: RADIUS.xl, padding: 20 }}>
                <div style={{ width: 38, height: 38, borderRadius: RADIUS.sm, background: "rgba(238,108,26,.1)",
                     display: "grid", placeItems: "center", marginBottom: 14 }}>
                  <Icon size={18} color={C.orange} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>{b.title}</h3>
                <p style={{ fontSize: 13.5, color: C.grayText, lineHeight: 1.55, margin: 0 }}>{b.desc}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── planos ── */}
      <Section>
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px" }}>Escolha como vender</h2>
        <p style={{ fontSize: 14.5, color: C.grayText, margin: "0 0 28px", maxWidth: 480 }}>
          Dá pra trocar de plano depois, direto no seu painel.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, maxWidth: 640 }}>
          {PLANS.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.key} style={{ border: `1.5px solid ${C.line}`, borderRadius: RADIUS.xl, padding: 22 }}>
                <Icon size={22} color={C.orange} style={{ marginBottom: 12 }} />
                <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{p.title}</h3>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.orange }}>{p.commission}% de comissão</span>
                </div>
                <p style={{ fontSize: 13.5, color: C.grayText, lineHeight: 1.5, margin: 0 }}>{p.desc}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── CTA final ── */}
      <Section style={{ background: C.black, textAlign: "center" }}>
        <img src={WORDMARK_LIGHT} alt="" style={{ height: 26, width: "auto", margin: "0 auto 20px" }} draggable={false} />
        <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 700, margin: "0 0 10px" }}>Pronto pra vender mais?</h2>
        <p style={{ color: C.gray, fontSize: 14.5, margin: "0 0 24px" }}>
          Cadastro leva poucos minutos. Sem cartão de crédito, sem compromisso.
        </p>
        <Link to="/parceiro/criar-conta" className="flex items-center justify-center gap-2"
          style={{ display: "inline-flex", background: C.orange, color: "#fff", textDecoration: "none", fontWeight: 700,
                   fontSize: 15.5, padding: "15px 28px", borderRadius: RADIUS.md }}>
          Cadastrar meu restaurante <ArrowRight size={18} />
        </Link>
      </Section>
    </div>
  );
}

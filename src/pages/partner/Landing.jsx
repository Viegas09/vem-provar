import { Link } from "react-router-dom";
import {
  X, Store, Truck, ArrowRight, ClipboardList, Bell, Wallet, LayoutDashboard,
  MapPin, Tag, CheckCircle2,
} from "lucide-react";
import { C, FONT, RADIUS, SHADOW } from "../../theme";
import { PROMO_DAYS, COMMISSION_RATES } from "../../lib/commission";
import PartnerHeroArt from "../../components/PartnerHeroArt";
import Footer from "../../components/Footer";
import { Reveal, CountUp } from "../../components/ScrollReveal";
import WORDMARK_ONORANGE from "../../assets/wordmark-onorange.png";
import WORDMARK_DARK from "../../assets/wordmark-dark.png";

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
  { icon: LayoutDashboard, title: "Painel completo", desc: "Pedidos, cardápio, cupons e faturamento — tudo num lugar só, no navegador." },
  { icon: MapPin, title: "Cliente acompanha ao vivo", desc: "Mapa em tempo real e notificação automática a cada etapa do pedido." },
  { icon: Tag, title: "Seus próprios cupons", desc: "Crie promoções quando quiser, sem depender de ninguém aprovar." },
];

const PLANS = [
  {
    key: "basico", icon: Store, title: "Básico", commission: COMMISSION_RATES.basico,
    desc: "A entrega é por sua conta — você mesmo ou um entregador seu.",
    features: ["Loja com cardápio e fotos no app", "Pedidos em tempo real no painel", "Cupons próprios, quando quiser", "Sem mensalidade"],
  },
  {
    key: "entrega", icon: Truck, title: "Entrega", commission: COMMISSION_RATES.entrega,
    desc: "O Vem Provar cuida da entrega, com entregadores cadastrados na plataforma.",
    features: ["Tudo do plano Básico", "Entrega com entregadores da plataforma", "Cliente acompanha no mapa ao vivo", "Estimativa de chegada pro cliente"],
  },
];

function Section({ children, style }) {
  return <section className="vp-wrap" style={{ padding: "64px 24px", ...style }}>{children}</section>;
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
        <Section style={{ paddingTop: 40, paddingBottom: 52 }}>
          <img src={WORDMARK_ONORANGE} alt="Vem Provar" style={{ height: 34, width: "auto", marginBottom: 36 }} draggable={false} />

          <div className="vp-hero">
            <div className="vp-fade-in">
              <span style={{ display: "inline-block", background: "rgba(255,255,255,.16)", color: "#fff", fontSize: 12.5,
                   fontWeight: 700, padding: "6px 14px", borderRadius: RADIUS.pill, marginBottom: 18 }}>
                Pra restaurantes de Itapecerica da Serra
              </span>
              <h1 style={{ color: "#fff", fontSize: "clamp(30px, 5vw, 44px)", fontWeight: 700, lineHeight: 1.1, margin: "0 0 16px", letterSpacing: -0.5 }}>
                Sua cozinha no maior portal de gastronomia da cidade
              </h1>
              <p style={{ color: "rgba(255,255,255,.9)", fontSize: 16.5, lineHeight: 1.55, margin: "0 0 30px", maxWidth: 440 }}>
                Cadastre seu cardápio, receba pedidos em tempo real e escolha como funciona a entrega.
                Sem mensalidade, sem letra miúda.
              </p>

              <div className="flex items-center gap-3" style={{ flexWrap: "wrap" }}>
                <Link to="/parceiro/criar-conta" className="flex items-center justify-center gap-2"
                  style={{ background: "#fff", color: C.orangeDark, textDecoration: "none", fontWeight: 700, fontSize: 15.5,
                           padding: "16px 30px", borderRadius: RADIUS.md, boxShadow: SHADOW.sm }}>
                  Cadastrar meu restaurante <ArrowRight size={18} />
                </Link>
                <Link to="/parceiro/entrar" style={{ color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: 14.5 }}>
                  Já tenho conta · Entrar
                </Link>
              </div>
            </div>

            <div className="vp-partner-hero-art">
              <PartnerHeroArt />
            </div>
          </div>
        </Section>
      </div>

      {/* ── estatística de destaque ── */}
      <Section style={{ paddingBottom: 24, textAlign: "center" }}>
        <Reveal style={{ maxWidth: 420, marginInline: "auto" }}>
          <div style={{ fontSize: "clamp(72px, 11vw, 108px)", fontWeight: 800, color: C.orange, lineHeight: .85,
               fontVariantNumeric: "tabular-nums", letterSpacing: -2 }}>
            <CountUp to={PROMO_DAYS} />
          </div>
          <div style={{ fontSize: 21, fontWeight: 700, lineHeight: 1.25, marginTop: 14 }}>dias sem nenhuma comissão</div>
          <p style={{ fontSize: 14, color: C.grayText, margin: "8px 0 0", lineHeight: 1.5 }}>
            Em qualquer plano, a partir do seu primeiro pedido publicado. Sem cartão de crédito, sem pegadinha.
          </p>
        </Reveal>
      </Section>

      {/* ── como funciona ── */}
      <Section style={{ paddingTop: 24 }}>
        <Reveal>
          <h2 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 8px" }}>Como funciona</h2>
          <p style={{ fontSize: 14.5, color: C.grayText, margin: "0 0 32px", maxWidth: 480 }}>
            Do cadastro ao primeiro pedido, sem enrolação.
          </p>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 28 }}>
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal key={s.title} delay={i * 100}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(238,108,26,.1)",
                     display: "grid", placeItems: "center", marginBottom: 16, position: "relative" }}>
                  <Icon size={30} color={C.orange} strokeWidth={1.6} />
                  <span style={{ position: "absolute", top: -4, right: -4, width: 26, height: 26, borderRadius: "50%",
                       background: C.black, color: "#fff", fontSize: 12.5, fontWeight: 700, display: "grid", placeItems: "center" }}>
                    {i + 1}
                  </span>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 6px" }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: C.grayText, lineHeight: 1.55, margin: 0 }}>{s.desc}</p>
              </Reveal>
            );
          })}
        </div>
      </Section>

      {/* ── benefícios ── */}
      <Section style={{ background: C.surface }}>
        <Reveal>
          <h2 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 32px" }}>O que você ganha</h2>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 28 }}>
          {BENEFITS.map((b, i) => {
            const Icon = b.icon;
            return (
              <Reveal key={b.title} delay={i * 90}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#fff", boxShadow: SHADOW.xs,
                     display: "grid", placeItems: "center", marginBottom: 16 }}>
                  <Icon size={26} color={C.orange} strokeWidth={1.6} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px" }}>{b.title}</h3>
                <p style={{ fontSize: 13.5, color: C.grayText, lineHeight: 1.55, margin: 0 }}>{b.desc}</p>
              </Reveal>
            );
          })}
        </div>
      </Section>

      {/* ── planos ── */}
      <div style={{ background: C.black }}>
        <Section style={{ textAlign: "center" }}>
          <Reveal style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 700, margin: "0 0 8px" }}>Conheça os planos</h2>
            <p style={{ fontSize: 14.5, color: C.gray, margin: "0 0 32px", maxWidth: 480 }}>
              Você escolhe qual usar no cadastro — e pode trocar depois, direto no painel.
            </p>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20,
               maxWidth: 680, marginInline: "auto", textAlign: "left" }}>
            {PLANS.map((p, i) => {
              const Icon = p.icon;
              return (
                <Reveal key={p.key} delay={i * 100} style={{ background: "#fff", borderRadius: RADIUS.xxl, padding: 28 }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: RADIUS.md, background: "rgba(238,108,26,.1)",
                         display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <Icon size={20} color={C.orange} />
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{p.title}</h3>
                  </div>
                  <div style={{ fontSize: 38, fontWeight: 800, color: C.orange, lineHeight: 1, letterSpacing: -1 }}>
                    {p.commission}<span style={{ fontSize: 20 }}>%</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: C.grayText, margin: "4px 0 18px" }}>de comissão por pedido</p>
                  <p style={{ fontSize: 13.5, color: C.grayText, lineHeight: 1.5, margin: "0 0 18px" }}>{p.desc}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: `1px solid ${C.line}`, paddingTop: 18 }}>
                    {p.features.map((f) => (
                      <div key={f} className="flex items-start gap-2">
                        <CheckCircle2 size={15} color={C.ok} style={{ flexShrink: 0, marginTop: 1.5 }} />
                        <span style={{ fontSize: 13.5, lineHeight: 1.4 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Section>
      </div>

      {/* ── CTA final ── */}
      <Section style={{ textAlign: "center" }}>
        <Reveal>
          <img src={WORDMARK_DARK} alt="" style={{ height: 26, width: "auto", margin: "0 auto 20px" }} draggable={false} />
          <h2 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 10px" }}>Pronto pra vender mais?</h2>
          <p style={{ color: C.grayText, fontSize: 14.5, margin: "0 0 24px" }}>
            Cadastro leva poucos minutos. Sem cartão de crédito, sem compromisso.
          </p>
          <Link to="/parceiro/criar-conta" className="flex items-center justify-center gap-2"
            style={{ display: "inline-flex", background: C.orange, color: "#fff", textDecoration: "none", fontWeight: 700,
                     fontSize: 15.5, padding: "16px 30px", borderRadius: RADIUS.md, boxShadow: SHADOW.sm }}>
            Cadastrar meu restaurante <ArrowRight size={18} />
          </Link>
        </Reveal>
      </Section>

      <Footer />
    </div>
  );
}

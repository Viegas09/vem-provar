import { Link } from "react-router-dom";
import {
  X, Bike, Car, ArrowRight, UserPlus, Bell, Navigation, Wallet, Clock3,
  MapPinned,
} from "lucide-react";
import { C, FONT, RADIUS, SHADOW } from "../../theme";
import DriverHeroArt from "../../components/DriverHeroArt";
import Footer from "../../components/Footer";
import { Reveal, CountUp } from "../../components/ScrollReveal";
import WORDMARK_ONORANGE from "../../assets/wordmark-onorange.png";
import WORDMARK_DARK from "../../assets/wordmark-dark.png";

const STEPS = [
  {
    icon: UserPlus,
    title: "Crie sua conta",
    desc: "E-mail, telefone e o veículo que você usa. Leva poucos minutos.",
  },
  {
    icon: Bell,
    title: "Fique disponível quando quiser",
    desc: "Liga e desliga a hora que quiser, sem turno fixo nem escala.",
  },
  {
    icon: Navigation,
    title: "Aceite as corridas mais perto de você",
    desc: "O app avisa quem está mais próximo primeiro — você só aceita ou recusa.",
  },
];

const BENEFITS = [
  { icon: Clock3, title: "Horário 100% livre", desc: "Você decide quando trabalhar. Sem escala, sem cobrança de expediente." },
  { icon: Wallet, title: "Recebe o valor cheio da corrida", desc: "Sem desconto de comissão em cima da taxa de entrega de cada pedido." },
  { icon: MapPinned, title: "Corridas mais perto primeiro", desc: "Dispatch por GPS ao vivo — não é fila, é quem está mais próximo do restaurante." },
  { icon: Navigation, title: "Navegação com 1 toque", desc: "Abre a rota pronta no Google Maps ou Waze, sem sair do app." },
];

const VEHICLES = [
  { key: "moto", icon: Bike, title: "Moto" },
  { key: "bike", icon: Bike, title: "Bicicleta" },
  { key: "carro", icon: Car, title: "Carro" },
];

function Section({ children, style }) {
  return <section className="vp-wrap" style={{ padding: "64px 24px", ...style }}>{children}</section>;
}

export default function DriverLanding() {
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
                Pra quem entrega em Itapecerica da Serra
              </span>
              <h1 style={{ color: "#fff", fontSize: "clamp(30px, 5vw, 44px)", fontWeight: 700, lineHeight: 1.1, margin: "0 0 16px", letterSpacing: -0.5 }}>
                Faça suas entregas no seu horário, no seu ritmo
              </h1>
              <p style={{ color: "rgba(255,255,255,.9)", fontSize: 16.5, lineHeight: 1.55, margin: "0 0 30px", maxWidth: 440 }}>
                Aceite corridas perto de você, navegue com um toque e receba o valor
                cheio de cada entrega. De moto, bike ou carro.
              </p>

              <div className="flex items-center gap-3" style={{ flexWrap: "wrap" }}>
                <Link to="/entregador/criar-conta" className="flex items-center justify-center gap-2"
                  style={{ background: "#fff", color: C.orangeDark, textDecoration: "none", fontWeight: 700, fontSize: 15.5,
                           padding: "16px 30px", borderRadius: RADIUS.md, boxShadow: SHADOW.sm }}>
                  Quero ser entregador <ArrowRight size={18} />
                </Link>
                <Link to="/entregador/entrar" style={{ color: "#fff", textDecoration: "none", fontWeight: 600, fontSize: 14.5 }}>
                  Já tenho conta · Entrar
                </Link>
              </div>
            </div>

            <div className="vp-partner-hero-art">
              <DriverHeroArt />
            </div>
          </div>
        </Section>
      </div>

      {/* ── estatística de destaque ── */}
      <Section style={{ paddingBottom: 24, textAlign: "center" }}>
        <Reveal style={{ maxWidth: 420, marginInline: "auto" }}>
          <div style={{ fontSize: "clamp(72px, 11vw, 108px)", fontWeight: 800, color: C.orange, lineHeight: .85,
               fontVariantNumeric: "tabular-nums", letterSpacing: -2 }}>
            <CountUp to={100} />%
          </div>
          <div style={{ fontSize: 21, fontWeight: 700, lineHeight: 1.25, marginTop: 14 }}>da taxa de entrega é sua</div>
          <p style={{ fontSize: 14, color: C.grayText, margin: "8px 0 0", lineHeight: 1.5 }}>
            Sem desconto de comissão em cima do valor de cada corrida. Sempre, não só nos primeiros dias.
          </p>
        </Reveal>
      </Section>

      {/* ── como funciona ── */}
      <Section style={{ paddingTop: 24 }}>
        <Reveal>
          <h2 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 8px" }}>Como funciona</h2>
          <p style={{ fontSize: 14.5, color: C.grayText, margin: "0 0 32px", maxWidth: 480 }}>
            Do cadastro até a primeira corrida aceita, sem enrolação.
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

      {/* ── veículos ── */}
      <div style={{ background: C.black }}>
        <Section style={{ textAlign: "center" }}>
          <Reveal style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h2 style={{ color: "#fff", fontSize: 26, fontWeight: 700, margin: "0 0 8px" }}>Entregue do seu jeito</h2>
            <p style={{ fontSize: 14.5, color: C.gray, margin: "0 0 32px", maxWidth: 480 }}>
              Você escolhe o veículo no cadastro — moto, bicicleta ou carro.
            </p>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 20,
               maxWidth: 460, marginInline: "auto" }}>
            {VEHICLES.map((v, i) => {
              const Icon = v.icon;
              return (
                <Reveal key={v.key} delay={i * 90} style={{ background: "#fff", borderRadius: RADIUS.xxl, padding: "28px 20px" }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(238,108,26,.1)",
                       display: "grid", placeItems: "center", margin: "0 auto 14px" }}>
                    <Icon size={24} color={C.orange} />
                  </div>
                  <h3 style={{ fontSize: 15.5, fontWeight: 700, margin: 0 }}>{v.title}</h3>
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
          <h2 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 10px" }}>Pronto pra começar a entregar?</h2>
          <p style={{ color: C.grayText, fontSize: 14.5, margin: "0 0 24px" }}>
            Cadastro leva poucos minutos. Sem taxa pra começar, sem compromisso.
          </p>
          <Link to="/entregador/criar-conta" className="flex items-center justify-center gap-2"
            style={{ display: "inline-flex", background: C.orange, color: "#fff", textDecoration: "none", fontWeight: 700,
                     fontSize: 15.5, padding: "16px 30px", borderRadius: RADIUS.md, boxShadow: SHADOW.sm }}>
            Quero ser entregador <ArrowRight size={18} />
          </Link>
        </Reveal>
      </Section>

      <Footer />
    </div>
  );
}

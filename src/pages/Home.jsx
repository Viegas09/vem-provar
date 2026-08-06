import { useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin, Star, Clock, Bike, Store, ArrowRight,
  Flame, Heart, ChevronRight, AtSign, Smartphone,
} from "lucide-react";
import { C, FONT, WARM } from "../theme";
import { CATS, HOOD, RESTAURANTS } from "../data/restaurants";
import Header from "../components/Header";
import WORDMARK_LIGHT from "../assets/wordmark-light.png";

function FoodPhoto({ v = 0, icon: Icon, radius = 16, style }) {
  return (
    <div style={{ position: "relative", background: WARM[v % WARM.length], borderRadius: radius, overflow: "hidden", ...style }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 80% at 25% 12%, rgba(255,255,255,.28), transparent 60%)" }} />
      {Icon && <Icon size={30} color="rgba(255,255,255,.5)" style={{ position: "absolute", right: 12, bottom: 12 }} />}
    </div>
  );
}

export default function Home() {
  const [addr, setAddr] = useState("");
  const [likes, setLikes] = useState({});

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: 800 }}>
      <Header />

      {/* ── Hero: pedir comida ── */}
      <section className="vp-wrap" style={{ padding: "56px 24px 40px" }}>
        <div className="vp-hero">
          <div>
            <div className="flex items-center gap-2" style={{ marginBottom: 18 }}>
              <span style={{ background: "rgba(238,108,26,.1)", color: C.orange, fontSize: 12.5, fontWeight: 600,
                             padding: "5px 12px", borderRadius: 999 }}>Itapecerica da Serra</span>
            </div>
            <h1 style={{ fontSize: 44, lineHeight: 1.08, fontWeight: 700, letterSpacing: -1, margin: 0 }}>
              O maior portal de gastronomia da sua cidade
            </h1>
            <p style={{ fontSize: 17, color: C.grayText, marginTop: 16, maxWidth: 440, lineHeight: 1.5 }}>
              Descubra. Prove. Compartilhe. Peça dos melhores restaurantes, cafés e pizzarias de Itapecerica — e receba em casa.
            </p>

            {/* entrada por endereço (a gramática do delivery) */}
            <div style={{ marginTop: 26, display: "flex", gap: 10, maxWidth: 480, flexWrap: "wrap" }}>
              <div className="flex items-center gap-2" style={{ flex: "1 1 260px", background: "#fff", border: `1.5px solid ${C.line}`,
                       borderRadius: 12, padding: "0 14px", minHeight: 54 }}>
                <MapPin size={20} color={C.orange} />
                <input value={addr} onChange={(e) => setAddr(e.target.value)}
                  placeholder="Digite seu endereço"
                  style={{ border: "none", outline: "none", flex: 1, fontFamily: FONT, fontSize: 15, background: "transparent", color: C.black }} />
              </div>
              <a href="#restaurantes" className="flex items-center justify-center gap-2"
                style={{ background: C.orange, color: "#fff", border: "none", cursor: "pointer", borderRadius: 12,
                         padding: "0 26px", minHeight: 54, fontFamily: FONT, fontSize: 15.5, fontWeight: 600, textDecoration: "none" }}>
                Ver restaurantes <ArrowRight size={18} />
              </a>
            </div>
            <div className="flex items-center gap-2" style={{ marginTop: 14, color: C.grayText, fontSize: 13 }}>
              <Bike size={15} color={C.ok} /> Entrega rápida na sua região · pague com Pix
            </div>
          </div>

          {/* colagem de fotos (produto: fotos reais dos pratos) */}
          <div className="vp-hero-art">
            <FoodPhoto v={0} icon={CATS[0].icon} style={{ gridRow: "span 2" }} />
            <FoodPhoto v={4} icon={CATS[1].icon} />
            <FoodPhoto v={2} icon={CATS[2].icon} />
          </div>
        </div>
      </section>

      {/* ── Categorias ── */}
      <section className="vp-wrap" style={{ padding: "12px 24px 8px" }}>
        <div className="vp-scroll" style={{ display: "flex", gap: 26, paddingBottom: 8 }}>
          {CATS.map((c) => {
            const Icon = c.icon;
            return (
              <button key={c.label} className="vp-tap"
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column",
                         alignItems: "center", gap: 8, flexShrink: 0 }}>
                <div style={{ width: 66, height: 66, borderRadius: 20, background: C.surface, display: "grid", placeItems: "center" }}>
                  <Icon size={27} color={C.black} />
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 500, color: C.grayText }}>{c.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Tá bombando na vizinhança (diferencial) ── */}
      <section className="vp-wrap" style={{ padding: "34px 24px 8px" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
          <div className="flex items-center gap-2">
            <Flame size={20} color={C.orange} fill={C.orange} />
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: -.4 }}>Tá bombando na vizinhança</h2>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: C.orange, animation: "vp-pulse 1.4s ease-in-out infinite" }} />
          </div>
          <a href="#restaurantes" className="flex items-center" style={{ color: C.orange, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
            Ver tudo <ChevronRight size={17} />
          </a>
        </div>
        <div className="vp-scroll" style={{ display: "flex", gap: 18 }}>
          {HOOD.map((h, i) => (
            <div key={i} className="vp-tap" style={{ width: 220, flexShrink: 0, cursor: "pointer",
                 background: "#fff", border: `1px solid ${C.line}`, borderRadius: 18, overflow: "hidden" }}>
              <div style={{ position: "relative" }}>
                <FoodPhoto v={h.v} icon={CATS[i].icon} radius={0} style={{ height: 130 }} />
                <button onClick={() => setLikes((l) => ({ ...l, [i]: !l[i] }))}
                  style={{ position: "absolute", top: 10, right: 10, width: 34, height: 34, borderRadius: 999,
                           background: "rgba(255,255,255,.94)", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }}>
                  <Heart size={17} color={likes[i] ? C.orange : C.grayText} fill={likes[i] ? C.orange : "none"} />
                </button>
              </div>
              <div style={{ padding: "12px 14px 14px" }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{h.dish}</div>
                <div style={{ fontSize: 12.5, color: C.grayText, marginTop: 1 }}>{h.rest}</div>
                <span style={{ display: "inline-block", marginTop: 10, fontSize: 11.5, fontWeight: 600, color: C.orange,
                               background: "rgba(238,108,26,.1)", padding: "4px 9px", borderRadius: 8 }}>{h.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Restaurantes ── */}
      <section id="restaurantes" className="vp-wrap" style={{ padding: "34px 24px 20px" }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 18px", letterSpacing: -.4 }}>Restaurantes perto de você</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {RESTAURANTS.map((r) => (
            <Link key={r.slug} to={`/restaurante/${r.slug}`} className="vp-tap flex" style={{ gap: 14, padding: 14, background: "#fff",
                 border: `1px solid ${C.line}`, borderRadius: 16, cursor: "pointer", textDecoration: "none", color: "inherit" }}>
              <FoodPhoto v={r.v} icon={r.icon} style={{ width: 88, height: 88, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{r.name}</div>
                <div style={{ fontSize: 13, color: C.grayText, marginTop: 2 }}>{r.cat}</div>
                <div className="flex items-center gap-3" style={{ marginTop: 12 }}>
                  <span className="flex items-center gap-1" style={{ fontSize: 13, fontWeight: 600 }}>
                    <Star size={14} fill={C.orange} color={C.orange} /> {r.rating.toLocaleString("pt-BR")}
                  </span>
                  <span className="flex items-center gap-1" style={{ fontSize: 13, color: C.grayText }}>
                    <Clock size={14} /> {r.time} min
                  </span>
                  <span className="flex items-center gap-1" style={{ fontSize: 13, fontWeight: r.free ? 600 : 500, color: r.free ? C.ok : C.grayText }}>
                    <Bike size={14} /> {r.fee}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Faixa de papéis (peça de marca, fundo preto) ── */}
      <section style={{ background: C.black, marginTop: 30 }}>
        <div className="vp-wrap" style={{ padding: "48px 24px" }}>
          <div className="vp-roles">
            <div id="restaurante" style={{ background: "rgba(255,255,255,.04)", borderRadius: 20, padding: "30px 28px" }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: C.orange, display: "grid", placeItems: "center", marginBottom: 16 }}>
                <Store size={24} color="#fff" />
              </div>
              <h3 style={{ color: C.white, fontSize: 21, fontWeight: 700, margin: 0 }}>Tem um restaurante?</h3>
              <p style={{ color: C.gray, fontSize: 14.5, marginTop: 8, lineHeight: 1.5 }}>
                Coloque sua cozinha no maior portal de Itapecerica e comece a receber pedidos hoje mesmo.
              </p>
              <a href="#" className="flex items-center gap-2" style={{ marginTop: 18, color: C.orange, textDecoration: "none", fontSize: 14.5, fontWeight: 600 }}>
                Cadastre seu restaurante <ArrowRight size={17} />
              </a>
            </div>
            <div id="entregador" style={{ background: "rgba(255,255,255,.04)", borderRadius: 20, padding: "30px 28px" }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: C.orange, display: "grid", placeItems: "center", marginBottom: 16 }}>
                <Bike size={24} color="#fff" />
              </div>
              <h3 style={{ color: C.white, fontSize: 21, fontWeight: 700, margin: 0 }}>Quer entregar com a gente?</h3>
              <p style={{ color: C.gray, fontSize: 14.5, marginTop: 8, lineHeight: 1.5 }}>
                Faça suas entregas na cidade, no seu horário, e receba por Pix a cada corrida.
              </p>
              <a href="#" className="flex items-center gap-2" style={{ marginTop: 18, color: C.orange, textDecoration: "none", fontSize: 14.5, fontWeight: 600 }}>
                Seja um entregador <ArrowRight size={17} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Rodapé ── */}
      <footer style={{ background: C.black, borderTop: `1px solid rgba(255,255,255,.08)` }}>
        <div className="vp-wrap" style={{ padding: "40px 24px 48px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 28 }}>
          <div style={{ maxWidth: 300 }}>
            <div style={{ marginBottom: 12 }}>
              <img src={WORDMARK_LIGHT} alt="Vem Provar" style={{ height: 38, width: "auto", display: "block" }} draggable={false} />
            </div>
            <p style={{ color: C.gray, fontSize: 13.5, lineHeight: 1.5, margin: 0 }}>
              O maior portal de gastronomia de Itapecerica da Serra. Descubra. Prove. Compartilhe.
            </p>
            <a href="#" className="flex items-center gap-2" style={{ marginTop: 16, color: C.orange, textDecoration: "none", fontSize: 13.5, fontWeight: 600 }}>
              <AtSign size={16} /> vemprovaritap
            </a>
          </div>
          <div className="flex" style={{ gap: 56, flexWrap: "wrap" }}>
            {[
              { h: "Pedir", items: ["Restaurantes", "Categorias", "Cupons"] },
              { h: "Parceiros", items: ["Cadastre seu restaurante", "Seja entregador"] },
              { h: "Ajuda", items: ["Central de ajuda", "Fale com a gente"] },
            ].map((col) => (
              <div key={col.h}>
                <div style={{ color: C.white, fontSize: 13, fontWeight: 700, marginBottom: 12, letterSpacing: .3 }}>{col.h}</div>
                {col.items.map((it) => (
                  <a key={it} href="#" style={{ display: "block", color: C.gray, textDecoration: "none", fontSize: 13.5, padding: "5px 0" }}>{it}</a>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="vp-wrap" style={{ padding: "16px 24px", borderTop: `1px solid rgba(255,255,255,.08)`, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <span style={{ color: "rgba(184,178,166,.7)", fontSize: 12.5 }}>© 2026 Vem Provar · Itapecerica da Serra</span>
          <span className="flex items-center gap-1" style={{ color: "rgba(184,178,166,.7)", fontSize: 12.5 }}>
            <Smartphone size={13} /> App em breve
          </span>
        </div>
      </footer>
    </div>
  );
}

import { HelpCircle, FileText, ShieldCheck } from "lucide-react";
import { C, FONT, RADIUS } from "../theme";
import Header from "../components/Header";

const FAQ = [
  {
    q: "Como acompanho meu pedido?",
    a: "Vá em Pedidos (no menu de baixo) e toque no pedido em andamento. A tela mostra o status atualizado em tempo real.",
  },
  {
    q: "Posso cancelar um pedido?",
    a: "Entre em contato direto com o restaurante pelo chat do pedido assim que possível — o cancelamento depende de o preparo ainda não ter começado.",
  },
  {
    q: "Quais formas de pagamento existem?",
    a: "Pix, cartão (na entrega ou retirada) e dinheiro, dependendo do restaurante escolhido.",
  },
  {
    q: "Como funciona a retirada no local?",
    a: "Ao fechar o pedido, escolha \"Retirar no local\" em vez de entrega — não tem taxa, e o endereço do restaurante aparece na tela.",
  },
];

export default function Help() {
  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
      <Header />
      <section className="vp-wrap" style={{ padding: "32px 24px 32px", maxWidth: 480 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 20px" }}>Central de ajuda</h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
          {FAQ.map((item) => (
            <div key={item.q} style={{ background: "#fff", border: `1.5px solid ${C.line}`, borderRadius: RADIUS.lg, padding: 16 }}>
              <div className="flex items-start gap-2" style={{ marginBottom: 6 }}>
                <HelpCircle size={16} color={C.orange} style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 14.5, fontWeight: 700 }}>{item.q}</span>
              </div>
              <p style={{ fontSize: 13.5, color: C.grayText, margin: 0, lineHeight: 1.5 }}>{item.a}</p>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.grayText, textTransform: "uppercase", letterSpacing: .3, marginBottom: 10 }}>
          Legal
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="flex items-center gap-3" style={{ background: C.surface, borderRadius: RADIUS.md, padding: 14 }}>
            <FileText size={17} color={C.grayText} />
            <span style={{ flex: 1, fontSize: 14, color: C.grayText }}>Termos de uso</span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: C.gray }}>Em breve</span>
          </div>
          <div className="flex items-center gap-3" style={{ background: C.surface, borderRadius: RADIUS.md, padding: 14 }}>
            <ShieldCheck size={17} color={C.grayText} />
            <span style={{ flex: 1, fontSize: 14, color: C.grayText }}>Política de privacidade</span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: C.gray }}>Em breve</span>
          </div>
        </div>
      </section>
    </div>
  );
}

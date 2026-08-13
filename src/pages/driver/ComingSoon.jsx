import { Link } from "react-router-dom";
import { Bike, ArrowLeft } from "lucide-react";
import { C, FONT } from "../../theme";
import Header from "../../components/Header";

export default function DriverComingSoon() {
  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
      <Header />
      <section className="vp-wrap" style={{ padding: "60px 24px 100px", maxWidth: 480, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: C.orange, display: "grid",
             placeItems: "center", margin: "0 auto 20px" }}>
          <Bike size={28} color="#fff" />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 10px" }}>Em breve</h1>
        <p style={{ fontSize: 14.5, color: C.grayText, lineHeight: 1.6, margin: "0 0 24px" }}>
          Estamos consolidando o Vem Provar em Itapecerica da Serra antes de abrir as entregas por aqui.
          Volte em breve para se cadastrar como entregador.
        </p>
        <Link to="/" className="flex items-center justify-center gap-2"
          style={{ color: C.orange, textDecoration: "none", fontSize: 14.5, fontWeight: 600 }}>
          <ArrowLeft size={17} /> Voltar para a home
        </Link>
      </section>
    </div>
  );
}

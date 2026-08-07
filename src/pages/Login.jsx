import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { C, FONT } from "../theme";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn({ email, password });
      navigate(location.state?.from || "/");
    } catch (err) {
      setError("E-mail ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
      <Header />
      <section className="vp-wrap" style={{ padding: "48px 24px 120px", maxWidth: 420 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 24px" }}>Entrar</h1>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="flex items-center gap-2" style={{ background: "#fff", border: `1.5px solid ${C.line}`,
               borderRadius: 12, padding: "0 14px", minHeight: 54 }}>
            <Mail size={18} color={C.orange} />
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu e-mail"
              style={{ border: "none", outline: "none", flex: 1, fontFamily: FONT, fontSize: 15, background: "transparent" }} />
          </div>
          <div className="flex items-center gap-2" style={{ background: "#fff", border: `1.5px solid ${C.line}`,
               borderRadius: 12, padding: "0 14px", minHeight: 54 }}>
            <Lock size={18} color={C.orange} />
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              style={{ border: "none", outline: "none", flex: 1, fontFamily: FONT, fontSize: 15, background: "transparent" }} />
          </div>

          {error && (
            <div style={{ background: "#FDECEC", color: "#B42318", borderRadius: 12, padding: 12, fontSize: 13.5 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ background: loading ? C.gray : C.orange, color: "#fff", border: "none",
                     cursor: loading ? "default" : "pointer", borderRadius: 12, padding: "15px 0",
                     fontFamily: FONT, fontSize: 15.5, fontWeight: 600, marginTop: 6 }}>
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p style={{ fontSize: 14, color: C.grayText, marginTop: 20, textAlign: "center" }}>
          Ainda não tem conta?{" "}
          <Link to="/criar-conta" style={{ color: C.orange, fontWeight: 600, textDecoration: "none" }}>Criar conta</Link>
        </p>
      </section>
    </div>
  );
}

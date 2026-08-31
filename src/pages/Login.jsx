import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { C, FONT, RADIUS } from "../theme";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import SocialButtons from "../components/SocialButtons";

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
    <AuthLayout title="Que bom te ver de novo!" subtitle="Entre pra acompanhar seus pedidos e continuar de onde parou.">
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 22px" }}>Entrar</h2>
      <SocialButtons />
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="flex items-center gap-2" style={{ background: "#fff", border: `1.5px solid ${C.line}`,
             borderRadius: RADIUS.md, padding: "0 14px", minHeight: 54 }}>
          <Mail size={18} color={C.orange} />
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Seu e-mail"
            style={{ border: "none", outline: "none", flex: 1, fontFamily: FONT, fontSize: 15, background: "transparent" }} />
        </div>
        <div className="flex items-center gap-2" style={{ background: "#fff", border: `1.5px solid ${C.line}`,
             borderRadius: RADIUS.md, padding: "0 14px", minHeight: 54 }}>
          <Lock size={18} color={C.orange} />
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha"
            style={{ border: "none", outline: "none", flex: 1, fontFamily: FONT, fontSize: 15, background: "transparent" }} />
        </div>

        {error && (
          <div style={{ background: "#FDECEC", color: "#B42318", borderRadius: RADIUS.md, padding: 12, fontSize: 13.5 }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading}
          style={{ background: loading ? C.gray : C.orange, color: "#fff", border: "none",
                   cursor: loading ? "default" : "pointer", borderRadius: RADIUS.md, padding: "15px 0",
                   fontFamily: FONT, fontSize: 15.5, fontWeight: 600, marginTop: 6 }}>
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <p style={{ fontSize: 14, color: C.grayText, marginTop: 20, textAlign: "center" }}>
        Ainda não tem conta?{" "}
        <Link to="/criar-conta" style={{ color: C.orange, fontWeight: 600, textDecoration: "none" }}>Criar conta</Link>
      </p>
    </AuthLayout>
  );
}

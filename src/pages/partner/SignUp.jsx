import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User } from "lucide-react";
import { C, FONT } from "../../theme";
import { useAuth } from "../../context/AuthContext";
import AuthLayout from "../../components/AuthLayout";

export default function PartnerSignUp() {
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signUp({ email, password, fullName });
      await signIn({ email, password });
      navigate("/parceiro/cadastro");
    } catch (err) {
      setError(err.message?.includes("already registered") ? "Esse e-mail já tem conta." : "Não foi possível criar a conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Coloque seu restaurante no Vem Provar" subtitle="Crie sua conta de parceiro pra cadastrar seu restaurante e começar a vender.">
      <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 22px" }}>Criar conta de parceiro</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="flex items-center gap-2" style={{ background: "#fff", border: `1.5px solid ${C.line}`,
             borderRadius: 12, padding: "0 14px", minHeight: 54 }}>
          <User size={18} color={C.orange} />
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)}
            placeholder="Seu nome"
            style={{ border: "none", outline: "none", flex: 1, fontFamily: FONT, fontSize: 15, background: "transparent" }} />
        </div>
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
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Crie uma senha (mín. 6 caracteres)"
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
          {loading ? "Criando conta…" : "Continuar"}
        </button>
      </form>
      <p style={{ fontSize: 14, color: C.grayText, marginTop: 20, textAlign: "center" }}>
        Já tem conta de parceiro?{" "}
        <Link to="/parceiro/entrar" style={{ color: C.orange, fontWeight: 600, textDecoration: "none" }}>Entrar</Link>
      </p>
    </AuthLayout>
  );
}

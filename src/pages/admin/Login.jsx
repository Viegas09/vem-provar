import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ShieldAlert } from "lucide-react";
import { C, FONT } from "../../theme";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { fetchProfile } from "../../data/queries";
import AuthLayout from "../../components/AuthLayout";

export default function AdminLogin() {
  const { signIn, signOut } = useAuth();
  const navigate = useNavigate();
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
      const { data } = await supabase.auth.getUser();
      const profile = data.user ? await fetchProfile(data.user.id) : null;
      if (profile?.role !== "admin") {
        await signOut();
        setError("Essa conta não tem acesso ao painel administrativo.");
        return;
      }
      navigate("/admin/painel");
    } catch (err) {
      setError("E-mail ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Painel administrativo" subtitle="Acesso restrito à equipe do Vem Provar.">
      <div className="flex items-center gap-2" style={{ marginBottom: 22 }}>
        <ShieldAlert size={20} color={C.orange} />
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Entrar como admin</h2>
      </div>
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
    </AuthLayout>
  );
}

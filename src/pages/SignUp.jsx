import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, MapPin } from "lucide-react";
import { C, FONT } from "../theme";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import LocateButton from "../components/LocateButton";
import Header from "../components/Header";

export default function SignUp() {
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleLocated({ latitude, longitude, address: found }) {
    setCoords({ latitude, longitude });
    if (found) setAddress(found);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signUp({ email, password, fullName });
      await signIn({ email, password });
      if (address || coords) {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          await supabase
            .from("profiles")
            .update({ address, latitude: coords?.latitude, longitude: coords?.longitude })
            .eq("id", data.user.id);
        }
      }
      navigate("/");
    } catch (err) {
      setError(err.message?.includes("already registered") ? "Esse e-mail já tem conta." : "Não foi possível criar a conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
      <Header />
      <section className="vp-wrap" style={{ padding: "48px 24px 120px", maxWidth: 420 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 24px" }}>Criar conta</h1>
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
          <div className="flex items-center gap-2" style={{ background: "#fff", border: `1.5px solid ${C.line}`,
               borderRadius: 12, padding: "0 14px", minHeight: 54 }}>
            <MapPin size={18} color={C.orange} />
            <input value={address} onChange={(e) => setAddress(e.target.value)}
              placeholder="Seu endereço (opcional)"
              style={{ border: "none", outline: "none", flex: 1, fontFamily: FONT, fontSize: 15, background: "transparent" }} />
          </div>
          <LocateButton onLocated={handleLocated} />

          {error && (
            <div style={{ background: "#FDECEC", color: "#B42318", borderRadius: 12, padding: 12, fontSize: 13.5 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ background: loading ? C.gray : C.orange, color: "#fff", border: "none",
                     cursor: loading ? "default" : "pointer", borderRadius: 12, padding: "15px 0",
                     fontFamily: FONT, fontSize: 15.5, fontWeight: 600, marginTop: 6 }}>
            {loading ? "Criando conta…" : "Criar conta"}
          </button>
        </form>
        <p style={{ fontSize: 14, color: C.grayText, marginTop: 20, textAlign: "center" }}>
          Já tem conta?{" "}
          <Link to="/entrar" style={{ color: C.orange, fontWeight: 600, textDecoration: "none" }}>Entrar</Link>
        </p>
      </section>
    </div>
  );
}

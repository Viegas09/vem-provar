import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search as SearchIcon, Store, X } from "lucide-react";
import { C, FONT, WARM } from "../theme";
import { ICONS, CATS } from "../data/icons";
import { useRestaurants } from "../hooks/useRestaurants";
import { SkeletonCard } from "../components/Skeleton";

function FoodPhoto({ v = 0, icon: Icon, style }) {
  return (
    <div style={{ position: "relative", background: WARM[v % WARM.length], borderRadius: 14, overflow: "hidden", ...style }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 80% at 25% 12%, rgba(255,255,255,.28), transparent 60%)" }} />
      {Icon && <Icon size={26} color="rgba(255,255,255,.5)" style={{ position: "absolute", right: 10, bottom: 10 }} />}
    </div>
  );
}

export default function Search() {
  const navigate = useNavigate();
  const { restaurants, loading } = useRestaurants();
  const [term, setTerm] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const catKey = searchParams.get("cat") || "";
  const inputRef = useRef(null);

  useEffect(() => {
    if (!catKey) inputRef.current?.focus();
  }, [catKey]);

  const query = term.trim().toLowerCase();
  const hasQuery = query.length > 0;
  const activeCat = CATS.find((c) => c.key === catKey);

  const results = hasQuery
    ? restaurants.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          (r.category || "").toLowerCase().includes(query) ||
          (r.menu_items || []).some((item) => item.name.toLowerCase().includes(query))
      )
    : activeCat
    ? restaurants.filter((r) => r.icon_key === activeCat.key)
    : [];

  const showingList = hasQuery || !!activeCat;

  function openCategory(key) {
    setTerm("");
    setSearchParams({ cat: key });
  }

  function clearCategory() {
    setSearchParams({});
  }

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: C.white, borderBottom: `1px solid ${C.line}`,
           padding: "14px 16px", paddingTop: "calc(14px + env(safe-area-inset-top))" }}>
        <div className="flex items-center gap-2" style={{ maxWidth: 640, margin: "0 auto" }}>
          <button onClick={() => navigate(-1)}
            style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.line}`, background: "#fff",
                     display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2" style={{ flex: 1, background: C.surface, borderRadius: 10, padding: "0 12px", height: 42 }}>
            <SearchIcon size={16} color={C.grayText} />
            <input ref={inputRef} value={term} onChange={(e) => { setTerm(e.target.value); if (catKey) setSearchParams({}); }}
              placeholder="Busque por restaurante ou prato"
              style={{ border: "none", outline: "none", flex: 1, background: "transparent", fontFamily: FONT, fontSize: 14.5 }} />
            {term && (
              <button onClick={() => setTerm("")} style={{ background: "none", border: "none", cursor: "pointer", color: C.grayText, display: "grid", placeItems: "center" }}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 16px 24px", maxWidth: 640, margin: "0 auto" }}>
        {!showingList ? (
          <>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 14px" }}>Restaurantes</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {CATS.map((c) => {
                const Icon = c.icon;
                return (
                  <button key={c.key} onClick={() => openCategory(c.key)} className="vp-tap"
                    style={{ position: "relative", height: 92, borderRadius: 16, border: "none", cursor: "pointer",
                             background: c.bg, overflow: "hidden", padding: "14px 16px", textAlign: "left" }}>
                    <span style={{ position: "relative", zIndex: 1, color: "#fff", fontSize: 16, fontWeight: 700 }}>{c.label}</span>
                    <Icon size={30} color="rgba(255,255,255,.9)" style={{ position: "absolute", right: 14, bottom: 12 }} />
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {activeCat && !hasQuery && (
              <button onClick={clearCategory} className="flex items-center gap-2"
                style={{ background: "none", border: "none", cursor: "pointer", color: C.black, padding: 0, marginBottom: 16 }}>
                <ArrowLeft size={16} />
                <span style={{ fontSize: 16, fontWeight: 700 }}>{activeCat.label}</span>
              </button>
            )}
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : results.length === 0 ? (
              <p style={{ color: C.grayText, fontSize: 14, textAlign: "center", padding: "40px 0" }}>
                {hasQuery ? `Nenhum resultado para "${term.trim()}".` : `Nenhum restaurante de ${activeCat?.label.toLowerCase()} por enquanto.`}
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {results.map((r) => (
                  <Link key={r.slug} to={`/restaurante/${r.slug}`} className="flex" style={{ gap: 12, padding: 12, background: "#fff",
                       border: `1px solid ${C.line}`, borderRadius: 14, textDecoration: "none", color: "inherit" }}>
                    <FoodPhoto v={r.color_variant} icon={ICONS[r.icon_key] || Store} style={{ width: 64, height: 64, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{r.name}</div>
                      <div style={{ fontSize: 12.5, color: C.grayText, marginTop: 2 }}>{r.category}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { MapPin, Plus, Pencil, Trash2, Star } from "lucide-react";
import { C, FONT } from "../theme";
import { useAuth } from "../context/AuthContext";
import { fetchAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } from "../data/queries";
import { formatAddress } from "../lib/geolocation";
import Header from "../components/Header";
import { SkeletonPage } from "../components/Skeleton";
import AddressModal, { LABEL_PRESETS, emptyAddressForm } from "../components/AddressModal";

function iconFor(label) {
  const preset = LABEL_PRESETS.find((p) => p.label === label);
  return preset ? preset.icon : MapPin;
}

export default function Addresses() {
  const { user, loading: authLoading } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  async function reload() {
    const data = await fetchAddresses(user.id);
    setAddresses(data);
    setLoading(false);
  }

  useEffect(() => {
    if (user) reload();
  }, [user]);

  if (authLoading) return <SkeletonPage />;
  if (!user) return <Navigate to="/entrar" replace />;

  async function handleSave(form) {
    const payload = {
      label: form.label,
      street: form.street.trim(),
      number: form.number.trim(),
      neighborhood: form.neighborhood.trim() || null,
      city: form.city.trim() || null,
      cep: form.cep.trim() || null,
      latitude: form.latitude,
      longitude: form.longitude,
    };
    if (modal?.id) {
      await updateAddress(modal.id, payload);
    } else {
      await createAddress({ ...payload, user_id: user.id, is_default: addresses.length === 0 });
    }
    setModal(null);
    await reload();
  }

  async function handleDelete(id) {
    if (!window.confirm("Apagar esse endereço?")) return;
    await deleteAddress(id);
    await reload();
  }

  async function handleSetDefault(id) {
    await setDefaultAddress(user.id, id);
    await reload();
  }

  return (
    <div style={{ fontFamily: FONT, background: C.white, color: C.black, minHeight: "100vh" }}>
      <Header />
      <section className="vp-wrap" style={{ padding: "32px 24px 32px", maxWidth: 480 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Meus endereços</h1>
          <button onClick={() => setModal(emptyAddressForm())} className="flex items-center gap-1"
            style={{ background: C.orange, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer",
                     padding: "9px 14px", fontFamily: FONT, fontSize: 13, fontWeight: 600 }}>
            <Plus size={15} /> Adicionar
          </button>
        </div>

        {loading ? (
          <SkeletonPage />
        ) : addresses.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <MapPin size={40} color={C.gray} style={{ margin: "0 auto 14px" }} />
            <p style={{ color: C.grayText, fontSize: 14.5, margin: 0 }}>Você ainda não salvou nenhum endereço.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {addresses.map((a) => {
              const Icon = iconFor(a.label);
              return (
                <div key={a.id} style={{ background: "#fff", border: `1.5px solid ${a.is_default ? C.orange : C.line}`,
                     borderRadius: 14, padding: 16 }}>
                  <div className="flex items-start justify-between" style={{ gap: 8 }}>
                    <div className="flex items-start gap-3" style={{ minWidth: 0 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: C.surface, flexShrink: 0,
                           display: "grid", placeItems: "center" }}>
                        <Icon size={17} color={C.orange} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 14.5, fontWeight: 700 }}>{a.label}</span>
                          {a.is_default && (
                            <span className="flex items-center gap-1" style={{ fontSize: 11, fontWeight: 700, color: C.orange,
                                 background: "rgba(238,108,26,.1)", padding: "2px 8px", borderRadius: 999 }}>
                              <Star size={10} fill={C.orange} /> Padrão
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 13.5, color: C.grayText, marginTop: 3, lineHeight: 1.4 }}>
                          {formatAddress(a)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1" style={{ flexShrink: 0 }}>
                      <button onClick={() => setModal(a)}
                        style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.line}`, background: "#fff",
                                 cursor: "pointer", display: "grid", placeItems: "center" }}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(a.id)}
                        style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.line}`, background: "#fff",
                                 cursor: "pointer", display: "grid", placeItems: "center" }}>
                        <Trash2 size={14} color="#B42318" />
                      </button>
                    </div>
                  </div>
                  {!a.is_default && (
                    <button onClick={() => handleSetDefault(a.id)}
                      style={{ marginTop: 10, background: "none", border: "none", cursor: "pointer", color: C.orange,
                               fontFamily: FONT, fontSize: 12.5, fontWeight: 600, padding: 0 }}>
                      Usar como padrão
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {modal && (
        <AddressModal initial={modal.id ? modal : null} onClose={() => setModal(null)} onSave={handleSave} />
      )}
    </div>
  );
}

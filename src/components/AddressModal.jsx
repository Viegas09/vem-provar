import { useEffect, useRef, useState } from "react";
import { Home as HomeIcon, Briefcase, MapPin, X, LocateFixed, Loader2, Check } from "lucide-react";
import { C, FONT } from "../theme";
import { getCurrentCoords, reverseGeocodeStructured, lookupCep } from "../lib/geolocation";

export const LABEL_PRESETS = [
  { label: "Casa", icon: HomeIcon },
  { label: "Trabalho", icon: Briefcase },
  { label: "Outro", icon: MapPin },
];

const fieldStyle = {
  border: `1.5px solid ${C.line}`, outline: "none", borderRadius: 12, padding: "0 14px",
  minHeight: 50, fontFamily: FONT, fontSize: 15, background: "#fff", width: "100%", boxSizing: "border-box",
};

export function emptyAddressForm() {
  return { label: "Casa", street: "", number: "", neighborhood: "", city: "", cep: "", latitude: null, longitude: null };
}

export default function AddressModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial || emptyAddressForm());
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepFound, setCepFound] = useState(false);
  const [cepError, setCepError] = useState(null);
  const cepTimer = useRef(null);
  const numberInputRef = useRef(null);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleCepChange(value) {
    set("cep", value);
    setCepFound(false);
    setCepError(null);
    clearTimeout(cepTimer.current);
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 8) return;
    cepTimer.current = setTimeout(async () => {
      setCepLoading(true);
      try {
        const found = await lookupCep(digits);
        if (found) {
          setForm((f) => ({ ...f, street: found.street || f.street, neighborhood: found.neighborhood || f.neighborhood, city: found.city || f.city }));
          setCepFound(true);
          numberInputRef.current?.focus();
        } else {
          setCepError("CEP não encontrado — preencha o endereço manualmente.");
        }
      } catch {
        setCepError("Não foi possível buscar o CEP agora.");
      } finally {
        setCepLoading(false);
      }
    }, 400);
  }

  useEffect(() => () => clearTimeout(cepTimer.current), []);

  async function handleLocate() {
    setLocating(true);
    setLocateError(null);
    try {
      const { latitude, longitude } = await getCurrentCoords();
      const found = await reverseGeocodeStructured(latitude, longitude);
      setForm((f) => ({ ...f, ...found, latitude, longitude }));
      if (found.cep) setCepFound(true);
    } catch (err) {
      setLocateError(err.message);
    } finally {
      setLocating(false);
    }
  }

  const [saveError, setSaveError] = useState(null);
  const canSave = form.street.trim() && form.number.trim();

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(form);
    } catch (err) {
      console.error("AddressModal: erro ao salvar endereço", err);
      setSaveError(err.message || "Não foi possível salvar o endereço. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(20,20,20,.5)",
               display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} className="vp-fade-in"
        style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480,
                 maxHeight: "92vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between" style={{ padding: "18px 20px 4px" }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>{initial ? "Editar endereço" : "Novo endereço"}</span>
          <button onClick={onClose} aria-label="Fechar" style={{ background: "none", border: "none", cursor: "pointer", color: C.grayText,
               display: "grid", placeItems: "center" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "12px 20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="flex items-center gap-2">
            {LABEL_PRESETS.map((p) => {
              const active = form.label === p.label;
              const Icon = p.icon;
              return (
                <button key={p.label} type="button" onClick={() => set("label", p.label)} className="flex items-center gap-1"
                  style={{ background: active ? "rgba(238,108,26,.08)" : "#fff",
                           border: `1.5px solid ${active ? C.orange : C.line}`, borderRadius: 999, padding: "7px 14px",
                           cursor: "pointer", fontFamily: FONT, fontSize: 13, fontWeight: 600, color: active ? C.orange : C.black }}>
                  <Icon size={14} /> {p.label}
                </button>
              );
            })}
          </div>

          <button type="button" onClick={handleLocate} disabled={locating} className="flex items-center gap-2"
            style={{ background: C.surface, border: "none", borderRadius: 12, padding: "12px 14px", cursor: locating ? "default" : "pointer",
                     fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: C.orange, justifyContent: "center" }}>
            {locating ? <Loader2 size={15} className="vp-spin" /> : <LocateFixed size={15} />}
            {locating ? "Localizando…" : "Preencher com minha localização"}
          </button>
          {locateError && <div style={{ color: "#B42318", fontSize: 12.5 }}>{locateError}</div>}
          <p style={{ fontSize: 12, color: C.grayText, margin: 0 }}>
            O GPS preenche os campos automaticamente, mas confira se o número e o CEP estão certos antes de salvar.
          </p>

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.grayText, marginBottom: 6 }}>CEP</div>
            <div style={{ position: "relative" }}>
              <input value={form.cep} onChange={(e) => handleCepChange(e.target.value)} placeholder="00000-000" inputMode="numeric"
                style={{ ...fieldStyle, paddingRight: 40 }} />
              <div style={{ position: "absolute", right: 12, top: 0, bottom: 0, display: "grid", placeItems: "center" }}>
                {cepLoading && <Loader2 size={16} className="vp-spin" color={C.grayText} />}
                {!cepLoading && cepFound && <Check size={16} color={C.ok} />}
              </div>
            </div>
            {cepLoading && <div style={{ fontSize: 12, color: C.grayText, marginTop: 4 }}>Buscando endereço…</div>}
            {cepError && <div style={{ fontSize: 12, color: "#B42318", marginTop: 4 }}>{cepError}</div>}
            {cepFound && !cepLoading && <div style={{ fontSize: 12, color: C.ok, marginTop: 4 }}>Endereço encontrado! Confira e complete o número.</div>}
          </div>

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.grayText, marginBottom: 6 }}>Rua / Avenida</div>
            <input value={form.street} onChange={(e) => set("street", e.target.value)} placeholder="Ex: Rua das Flores" style={fieldStyle} />
          </div>

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.grayText, marginBottom: 6 }}>Número</div>
            <input ref={numberInputRef} value={form.number} onChange={(e) => set("number", e.target.value)} placeholder="123" style={fieldStyle} />
          </div>

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.grayText, marginBottom: 6 }}>Bairro</div>
            <input value={form.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} placeholder="Ex: Centro" style={fieldStyle} />
          </div>

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.grayText, marginBottom: 6 }}>Cidade</div>
            <input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Itapecerica da Serra" style={fieldStyle} />
          </div>

          {saveError && (
            <div style={{ background: "#FDECEC", color: "#B42318", borderRadius: 10, padding: 12, fontSize: 13 }}>
              {saveError}
            </div>
          )}

          <button type="button" onClick={handleSave} disabled={!canSave || saving}
            style={{ marginTop: 6, width: "100%", background: !canSave || saving ? C.gray : C.orange, color: "#fff", border: "none",
                     cursor: !canSave || saving ? "default" : "pointer", borderRadius: 12, padding: "14px 0",
                     fontFamily: FONT, fontSize: 15, fontWeight: 600 }}>
            {saving ? "Salvando…" : "Salvar endereço"}
          </button>
        </div>
      </div>
    </div>
  );
}

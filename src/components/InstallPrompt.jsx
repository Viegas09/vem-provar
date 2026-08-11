import { useEffect, useRef, useState } from "react";
import { X, Download, Share } from "lucide-react";
import { C, FONT } from "../theme";

const DISMISS_KEY = "vp-install-dismissed";
const SHOW_DELAY_MS = 4000;
const FORM_TAGS = ["INPUT", "TEXTAREA", "SELECT"];

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === "1");
  const [ready, setReady] = useState(false);
  const [formActive, setFormActive] = useState(false);
  const blurTimer = useRef(null);

  useEffect(() => {
    if (isStandalone() || dismissed) return;

    function handleBeforeInstall(e) {
      e.preventDefault();
      setDeferredPrompt(e);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    if (isIOS()) setShowIOSHint(true);

    const showTimer = setTimeout(() => setReady(true), SHOW_DELAY_MS);

    function handleFocusIn(e) {
      if (FORM_TAGS.includes(e.target.tagName)) {
        clearTimeout(blurTimer.current);
        setFormActive(true);
      }
    }
    function handleFocusOut(e) {
      if (FORM_TAGS.includes(e.target.tagName)) {
        blurTimer.current = setTimeout(() => setFormActive(false), 400);
      }
    }
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
      clearTimeout(showTimer);
      clearTimeout(blurTimer.current);
    };
  }, [dismissed]);

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    handleDismiss();
  }

  if (dismissed || isStandalone() || !ready || formActive) return null;
  if (!deferredPrompt && !showIOSHint) return null;

  return (
    <div className="vp-fade-in vp-installprompt" style={{ position: "fixed", left: 12, right: 12, zIndex: 45,
         background: C.black, color: "#fff", borderRadius: 14, padding: "12px 14px", fontFamily: FONT,
         boxShadow: "0 10px 30px rgba(0,0,0,.25)", display: "flex", alignItems: "center", gap: 12, maxWidth: 420, margin: "0 auto" }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: C.orange, display: "grid", placeItems: "center", flexShrink: 0 }}>
        {deferredPrompt ? <Download size={18} color="#fff" /> : <Share size={18} color="#fff" />}
      </div>
      <div style={{ flex: 1, fontSize: 12.5, lineHeight: 1.4 }}>
        {deferredPrompt
          ? "Instale o Vem Provar no seu celular para um acesso mais rápido."
          : 'Toque em Compartilhar e depois em "Adicionar à Tela de Início" para instalar.'}
      </div>
      {deferredPrompt && (
        <button onClick={handleInstallClick}
          style={{ background: C.orange, color: "#fff", border: "none", cursor: "pointer", borderRadius: 8,
                   padding: "8px 12px", fontFamily: FONT, fontSize: 12.5, fontWeight: 700, flexShrink: 0 }}>
          Instalar
        </button>
      )}
      <button onClick={handleDismiss}
        style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,.7)", flexShrink: 0, padding: 0 }}>
        <X size={16} />
      </button>
    </div>
  );
}

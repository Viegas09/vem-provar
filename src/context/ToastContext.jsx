import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { FONT } from "../theme";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const showToast = useCallback((message, opts = {}) => {
    const id = ++idRef.current;
    const duration = opts.duration || 2200;
    setToasts((prev) => [...prev, { id, message, icon: opts.icon || CheckCircle2, leaving: false }]);
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 220);
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="vp-toast-stack">
        {toasts.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.id} className={`vp-toast${t.leaving ? " vp-toast-leaving" : ""}`} style={{ fontFamily: FONT }}>
              <Icon size={17} color="#6FC796" style={{ flexShrink: 0 }} />
              <span>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

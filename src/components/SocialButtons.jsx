import { C, FONT, RADIUS } from "../theme";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.94v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.94A9 9 0 0 0 0 9c0 1.45.35 2.83.94 4.03z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .94 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#1877F2" d="M18 9a9 9 0 1 0-10.4 8.89v-6.29H5.31V9h2.29V7.02c0-2.26 1.35-3.51 3.41-3.51.99 0 2.02.18 2.02.18v2.22h-1.14c-1.12 0-1.47.7-1.47 1.42V9h2.5l-.4 2.6h-2.1v6.29A9 9 0 0 0 18 9z" />
    </svg>
  );
}

function SocialButton({ icon, label }) {
  return (
    <button type="button" disabled title="Em breve"
      className="flex items-center justify-center gap-2"
      style={{ width: "100%", border: `1.5px solid ${C.line}`, background: "#fff", borderRadius: RADIUS.md,
               padding: "13px 0", fontFamily: FONT, fontSize: 14.5, fontWeight: 600, color: C.grayText,
               cursor: "not-allowed", position: "relative" }}>
      {icon}
      {label}
      <span style={{ position: "absolute", right: 10, fontSize: 10.5, fontWeight: 700, color: C.gray,
                     background: C.surface, padding: "2px 7px", borderRadius: RADIUS.pill }}>
        Em breve
      </span>
    </button>
  );
}

export default function SocialButtons() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 }}>
      <SocialButton icon={<GoogleIcon />} label="Google" />
      <SocialButton icon={<FacebookIcon />} label="Facebook" />
      <div className="flex items-center gap-3" style={{ margin: "6px 0" }}>
        <div style={{ flex: 1, height: 1, background: C.line }} />
        <span style={{ fontSize: 12.5, color: C.grayText }}>ou com e-mail</span>
        <div style={{ flex: 1, height: 1, background: C.line }} />
      </div>
    </div>
  );
}

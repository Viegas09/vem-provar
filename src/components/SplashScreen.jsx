import { useEffect, useState } from "react";
import { C, FONT } from "../theme";
import WORDMARK_DARK from "../assets/wordmark-dark.png";
import LOGO_MARK_HEART from "../assets/logo-mark-heart.png";

const SHOW_MS = 2400;
const FADE_MS = 350;

export default function SplashScreen({ onDone }) {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadingOut(true), SHOW_MS);
    const doneTimer = setTimeout(onDone, SHOW_MS + FADE_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: C.white, display: "flex",
         flexDirection: "column", alignItems: "center", justifyContent: "center",
         opacity: fadingOut ? 0 : 1, transition: `opacity ${FADE_MS}ms ease` }}>
      <img src={LOGO_MARK_HEART} alt="" width={110} height={110} className="vp-splash-mark"
        style={{ display: "block" }} draggable={false} />
      <img src={WORDMARK_DARK} alt="Vem Provar" className="vp-splash-wordmark"
        style={{ height: 46, width: "auto", display: "block", marginTop: 22 }} draggable={false} />
      <p className="vp-splash-tagline" style={{ fontFamily: FONT, fontSize: 14, color: C.grayText, marginTop: 10 }}>
        O maior portal de gastronomia da sua cidade
      </p>
    </div>
  );
}

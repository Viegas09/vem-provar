// ilustração própria pra hero da página do parceiro — sacola de entrega saindo
// com vapor de comida quente + um cartão de notificação de pedido flutuando
// (a mesma notificação que o cliente recebe de verdade no app) + selo de
// avaliação. Tudo desenhado em SVG, sem foto de pessoa nenhuma — de propósito,
// pra não parecer a página de parceiros do iFood (foto de cozinheira).
export default function PartnerHeroArt() {
  return (
    <svg viewBox="0 0 440 440" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "100%", display: "block" }} role="img" aria-label="Sacola de entrega com notificação de pedido confirmado">
      <defs>
        <linearGradient id="vp-hero-bag" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F2A24E" />
          <stop offset="1" stopColor="#C9540F" />
        </linearGradient>
        <linearGradient id="vp-hero-blob" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgba(255,255,255,.18)" />
          <stop offset="1" stopColor="rgba(255,255,255,.03)" />
        </linearGradient>
        <filter id="vp-hero-shadow" x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#5a2600" floodOpacity=".28" />
        </filter>
      </defs>

      <path d="M222 38C324 24 412 96 398 202C388 296 344 398 222 404C104 410 24 322 32 210C40 100 122 52 222 38Z"
        fill="url(#vp-hero-blob)" />

      <circle cx="58" cy="86" r="6" fill="rgba(255,255,255,.35)" />
      <circle cx="392" cy="306" r="8" fill="rgba(255,255,255,.22)" />
      <circle cx="378" cy="70" r="4.5" fill="rgba(255,255,255,.4)" />

      {/* vapor subindo da sacola */}
      <g stroke="rgba(255,255,255,.55)" strokeWidth="6" strokeLinecap="round" fill="none">
        <path d="M158 224 Q146 200 158 178 Q170 156 158 132" />
        <path d="M196 224 Q184 200 196 178 Q208 156 196 132" opacity=".8" />
        <path d="M234 224 Q222 200 234 178 Q246 156 234 132" opacity=".55" />
      </g>

      {/* sacola de entrega */}
      <path d="M104 232 L296 232 L274 396C273 409 262 418 249 418L151 418C138 418 127 409 126 396Z"
        fill="url(#vp-hero-bag)" filter="url(#vp-hero-shadow)" />
      <path d="M146 232 Q146 176 200 176 Q254 176 254 232" stroke="#93440F" strokeWidth="11" fill="none" strokeLinecap="round" />
      <rect x="104" y="232" width="192" height="30" rx="8" fill="#000" opacity=".08" />

      {/* selo "pedido confirmado" no canto da sacola */}
      <g transform="translate(268 372)" filter="url(#vp-hero-shadow)">
        <circle cx="0" cy="0" r="30" fill="#2E9E5B" stroke="#fff" strokeWidth="5" />
        <path d="M-11 0 L-2 9 L14 -10" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>

      {/* selo de avaliação */}
      <g transform="translate(78 330)" filter="url(#vp-hero-shadow)">
        <circle cx="0" cy="0" r="28" fill="#fff" />
        <path d="M0 -13 L4.6 -4.4 14 -3 7 3.6 8.6 13 0 8.4 -8.6 13 -7 3.6 -14 -3 -4.6 -4.4Z" fill="#EE6C1A" />
      </g>

      {/* cartão de notificação flutuando */}
      <g transform="rotate(-5 330 150)" filter="url(#vp-hero-shadow)">
        <rect x="252" y="92" width="156" height="112" rx="20" fill="#fff" />
        <circle cx="284" cy="128" r="17" fill="#EE6C1A" />
        <path d="M277 128 L282 133 L292 121" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <rect x="310" y="119" width="76" height="9" rx="4.5" fill="#141414" />
        <rect x="310" y="136" width="52" height="7" rx="3.5" fill="#141414" opacity=".38" />
        <rect x="272" y="166" width="112" height="7" rx="3.5" fill="#141414" opacity=".16" />
        <rect x="272" y="181" width="86" height="7" rx="3.5" fill="#141414" opacity=".16" />
      </g>
    </svg>
  );
}

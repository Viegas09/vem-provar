// ilustração própria pra hero da página do entregador — um "cartão de mapa"
// com a rota entre restaurante e cliente (mesma linguagem visual do mapa ao
// vivo de verdade em DeliveryMap.jsx: pin do restaurante, pin do cliente,
// marcador do entregador, linha tracejada) + um cartão de ganho por corrida
// flutuando + selo de avaliação. Sem pessoa nenhuma na cena, igual à hero do
// parceiro, pelo mesmo motivo: não repetir a foto que a página do iFood usa.
export default function DriverHeroArt() {
  return (
    <svg viewBox="0 0 440 440" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "100%", display: "block" }} role="img" aria-label="Mapa com a rota até o cliente e o ganho da corrida">
      <defs>
        <linearGradient id="vp-dhero-blob" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgba(255,255,255,.18)" />
          <stop offset="1" stopColor="rgba(255,255,255,.03)" />
        </linearGradient>
        <filter id="vp-dhero-shadow" x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#5a2600" floodOpacity=".28" />
        </filter>
      </defs>

      <path d="M222 38C324 24 412 96 398 202C388 296 344 398 222 404C104 410 24 322 32 210C40 100 122 52 222 38Z"
        fill="url(#vp-dhero-blob)" />

      <circle cx="58" cy="86" r="6" fill="rgba(255,255,255,.35)" />
      <circle cx="392" cy="316" r="8" fill="rgba(255,255,255,.22)" />
      <circle cx="368" cy="66" r="4.5" fill="rgba(255,255,255,.4)" />

      {/* cartão de mapa */}
      <rect x="70" y="120" width="270" height="230" rx="26" fill="#fff" filter="url(#vp-dhero-shadow)" />
      <rect x="70" y="120" width="270" height="230" rx="26" fill="#F1EEE8" opacity=".5" />
      {Array.from({ length: 6 }).map((_, row) =>
        Array.from({ length: 8 }).map((_, col) => (
          <circle key={`${row}-${col}`} cx={100 + col * 32} cy={150 + row * 32} r="1.6" fill="rgba(20,20,20,.12)" />
        ))
      )}

      {/* rota tracejada do restaurante até o cliente */}
      <path d="M126 168 C 150 230, 230 230, 284 300" stroke="#EE6C1A" strokeWidth="4" strokeDasharray="2 10" strokeLinecap="round" fill="none" />

      {/* pin do restaurante */}
      <circle cx="126" cy="168" r="17" fill="#141414" stroke="#fff" strokeWidth="4" />
      <path d="M119 163h14M119 168h14M119 173h10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />

      {/* marcador do entregador, no meio da rota */}
      <circle cx="205" cy="229" r="15" fill="#2E9E5B" stroke="#fff" strokeWidth="4" />
      <path d="M198 233 L205 222 L212 233Z" fill="#fff" />

      {/* pin do cliente */}
      <circle cx="284" cy="300" r="17" fill="#EE6C1A" stroke="#fff" strokeWidth="4" />
      <path d="M284 291 L292 303 L284 299 L276 303Z" fill="#fff" />

      {/* selo de avaliação */}
      <g transform="translate(70 372)" filter="url(#vp-dhero-shadow)">
        <circle cx="0" cy="0" r="28" fill="#fff" />
        <path d="M0 -13 L4.6 -4.4 14 -3 7 3.6 8.6 13 0 8.4 -8.6 13 -7 3.6 -14 -3 -4.6 -4.4Z" fill="#EE6C1A" />
      </g>

      {/* cartão de ganho por corrida, flutuando */}
      <g transform="rotate(-5 350 320)" filter="url(#vp-dhero-shadow)">
        <rect x="288" y="60" width="140" height="86" rx="18" fill="#fff" />
        <rect x="306" y="76" width="60" height="9" rx="4.5" fill="#141414" opacity=".35" />
        <text x="306" y="116" fontFamily="Poppins, sans-serif" fontWeight="800" fontSize="26" fill="#2E9E5B">R$ 8,00</text>
      </g>
    </svg>
  );
}

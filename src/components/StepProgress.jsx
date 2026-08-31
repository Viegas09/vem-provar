import { C, FONT, RADIUS } from "../theme";

export default function StepProgress({ steps, current }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div className="flex items-center" style={{ gap: 6, marginBottom: 10 }}>
        {steps.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 5, borderRadius: RADIUS.pill,
               background: i <= current ? C.orange : C.line, transition: "background .2s" }} />
        ))}
      </div>
      <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.grayText }}>
        Etapa {current + 1} de {steps.length} · {steps[current]}
      </div>
    </div>
  );
}

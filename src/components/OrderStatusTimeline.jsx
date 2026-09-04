import { Receipt, ChefHat, Bike, Home, Check } from "lucide-react";

const STEP_ICONS = [Receipt, ChefHat, Bike, Home];

export default function OrderStatusTimeline({ current, total = 4 }) {
  return (
    <div className="flex items-center">
      {Array.from({ length: total }).map((_, i) => {
        const Icon = STEP_ICONS[i] || Receipt;
        const last = i === total - 1;
        // a última etapa, quando alcançada, já terminou de vez — não faz sentido
        // continuar pulsando como se ainda estivesse esperando algo
        const done = i < current || (i === current && last);
        const active = i === current && !last;
        return (
          <div key={i} className="flex items-center" style={{ flex: last ? "0 0 auto" : 1 }}>
            <div className={`vp-timeline-node${done ? " vp-timeline-node--done" : ""}${active ? " vp-timeline-node--active" : ""}`}>
              {done ? <Check size={15} strokeWidth={3} className="vp-check-in" /> : <Icon size={15} strokeWidth={2.2} />}
            </div>
            {!last && (
              <div className="vp-timeline-line">
                <div className="vp-timeline-line-fill" style={{ width: i < current ? "100%" : "0%" }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

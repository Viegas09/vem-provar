import { C, RADIUS } from "../theme";

export function Skeleton({ width = "100%", height = 16, radius = 8, style }) {
  return <div className="vp-skel" style={{ width, height, borderRadius: radius, ...style }} />;
}

export function SkeletonPage() {
  return (
    <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <Skeleton width={44} height={44} radius={13} />
        <Skeleton width={150} height={11} />
        <Skeleton width={100} height={11} />
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="flex" style={{ gap: 14, padding: 14, background: "#fff", border: `1px solid ${C.line}`, borderRadius: RADIUS.xl }}>
      <Skeleton width={88} height={88} radius={16} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, justifyContent: "center", minWidth: 0 }}>
        <Skeleton width="55%" height={16} />
        <Skeleton width="35%" height={12} />
        <Skeleton width="70%" height={12} />
      </div>
    </div>
  );
}

export function SkeletonMenuItem() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 14, background: "#fff",
         border: `1px solid ${C.line}`, borderRadius: RADIUS.xl }}>
      <div className="flex items-start" style={{ gap: 14 }}>
        <Skeleton width={72} height={72} radius={12} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, paddingTop: 2 }}>
          <Skeleton height={15} width="65%" />
          <Skeleton height={12} width="90%" />
        </div>
      </div>
      <Skeleton height={13} width={64} />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div style={{ padding: "12px 16px", background: "#fff", border: `1px solid ${C.line}`, borderRadius: RADIUS.md }}>
      <div className="flex items-center justify-between">
        <Skeleton width="45%" height={14} />
        <Skeleton width={70} height={12} />
      </div>
      <div className="flex items-center justify-between" style={{ marginTop: 10 }}>
        <Skeleton width={60} height={13} />
        <Skeleton width={80} height={22} radius={999} />
      </div>
    </div>
  );
}

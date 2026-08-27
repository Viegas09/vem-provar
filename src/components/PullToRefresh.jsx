import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { C } from "../theme";

const THRESHOLD = 64;
const MAX_PULL = 90;

export default function PullToRefresh({ onRefresh, children }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const wrapRef = useRef(null);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let startY = null;
    let active = false;
    let pullNow = 0;
    let busy = false;

    function onStart(e) {
      if (busy || window.scrollY > 0) { startY = null; active = false; return; }
      startY = e.touches[0].clientY;
      active = true;
    }

    function onMove(e) {
      if (!active || startY == null) return;
      const delta = e.touches[0].clientY - startY;
      if (delta <= 0 || window.scrollY > 0) { active = false; pullNow = 0; setPull(0); return; }
      e.preventDefault();
      pullNow = Math.min(delta * 0.5, MAX_PULL);
      setPull(pullNow);
    }

    async function onEnd() {
      if (!active) return;
      active = false;
      startY = null;
      if (pullNow >= THRESHOLD) {
        busy = true;
        setRefreshing(true);
        setPull(THRESHOLD);
        try {
          await onRefreshRef.current?.();
        } finally {
          busy = false;
          setRefreshing(false);
          setPull(0);
          pullNow = 0;
        }
      } else {
        setPull(0);
        pullNow = 0;
      }
    }

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  return (
    <div ref={wrapRef}>
      <div className="vp-pull-indicator" style={{ height: refreshing ? 44 : pull }}>
        {(pull > 4 || refreshing) && <Loader2 size={18} color={C.orange} />}
      </div>
      {children}
    </div>
  );
}

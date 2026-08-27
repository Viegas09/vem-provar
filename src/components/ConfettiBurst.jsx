import { useEffect, useRef } from "react";

const COLORS = ["#EE6C1A", "#F2A24E", "#2E9E5B", "#F0743F", "#FFD37A"];

export default function ConfettiBurst({ duration = 1600 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const originX = window.innerWidth / 2;
    const originY = window.innerHeight * 0.28;
    const particles = Array.from({ length: 60 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 6;
      return {
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 5 + Math.random() * 5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        shape: Math.random() > 0.5 ? "rect" : "circle",
      };
    });

    const start = performance.now();
    let raf;

    function frame(now) {
      const elapsed = now - start;
      const t = elapsed / duration;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (t >= 1) return;

      particles.forEach((p) => {
        p.vy += 0.16;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - t * 1.15);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [duration]);

  return (
    <canvas ref={canvasRef}
      style={{ position: "fixed", inset: 0, zIndex: 45, pointerEvents: "none" }} />
  );
}

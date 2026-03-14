"use client";

import { useEffect, useRef, useCallback, useState } from "react";

/**
 * Interactive particle background for the landing page.
 * Renders floating architectural shapes (rectangles, lines, dots) that
 * react to mouse movement with a soft parallax/repulsion effect.
 * Adapts to light/dark theme automatically.
 */

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  type: "rect" | "line" | "dot" | "ring" | "cross";
  color: string;
  parallaxDepth: number; // 0-1, affects mouse interaction strength
};

function getThemeColors(isDark: boolean) {
  if (isDark) {
    return {
      primary: "rgba(19, 127, 236, 0.5)",
      primaryBright: "rgba(19, 127, 236, 0.7)",
      accent1: "rgba(99, 102, 241, 0.45)",
      accent2: "rgba(20, 184, 166, 0.45)",
      accent3: "rgba(244, 114, 182, 0.35)",
      gridLine: "rgba(148, 163, 184, 0.06)",
      glowColor: "rgba(19, 127, 236, 0.12)",
    };
  }
  return {
    primary: "rgba(19, 127, 236, 0.35)",
    primaryBright: "rgba(19, 127, 236, 0.5)",
    accent1: "rgba(99, 102, 241, 0.3)",
    accent2: "rgba(20, 184, 166, 0.3)",
    accent3: "rgba(244, 114, 182, 0.25)",
    gridLine: "rgba(148, 163, 184, 0.08)",
    glowColor: "rgba(19, 127, 236, 0.08)",
  };
}

export default function LandingBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animFrameRef = useRef<number>(0);
  const [isDark, setIsDark] = useState(false);

  // Detect theme
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const initParticles = useCallback((width: number, height: number) => {
    const colors = getThemeColors(isDark);
    const colorPool = [colors.primary, colors.primaryBright, colors.accent1, colors.accent2, colors.accent3];
    const types: Particle["type"][] = ["rect", "line", "dot", "ring", "cross"];
    const count = Math.min(60, Math.floor((width * height) / 15000));

    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: 8 + Math.random() * 28,
      opacity: 0.5 + Math.random() * 0.5,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.005,
      type: types[Math.floor(Math.random() * types.length)],
      color: colorPool[Math.floor(Math.random() * colorPool.length)],
      parallaxDepth: 0.2 + Math.random() * 0.8,
    }));
  }, [isDark]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      initParticles(rect.width, rect.height);
    };

    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const colors = getThemeColors(isDark);
      const mouse = mouseRef.current;

      ctx.clearRect(0, 0, w, h);

      // Subtle grid
      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Mouse glow
      if (mouse.x > 0 && mouse.y > 0) {
        const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 300);
        gradient.addColorStop(0, colors.glowColor);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      }

      // Draw & update particles
      for (const p of particlesRef.current) {
        // Mouse interaction — soft repulsion + parallax
        let offsetX = 0;
        let offsetY = 0;
        if (mouse.x > 0 && mouse.y > 0) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            const force = ((200 - dist) / 200) * 15 * p.parallaxDepth;
            offsetX = (dx / dist) * force;
            offsetY = (dy / dist) * force;
          }
        }

        // Update position
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Wrap around
        if (p.x < -30) p.x = w + 30;
        if (p.x > w + 30) p.x = -30;
        if (p.y < -30) p.y = h + 30;
        if (p.y > h + 30) p.y = -30;

        const drawX = p.x + offsetX;
        const drawY = p.y + offsetY;

        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;

        switch (p.type) {
          case "rect":
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
            break;

          case "line":
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-p.size / 2, 0);
            ctx.lineTo(p.size / 2, 0);
            ctx.stroke();
            break;

          case "dot":
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2);
            ctx.fill();
            break;

          case "ring":
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2.5, 0, Math.PI * 2);
            ctx.stroke();
            break;

          case "cross":
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2;
            const arm = p.size / 2.5;
            ctx.beginPath();
            ctx.moveTo(-arm, 0);
            ctx.lineTo(arm, 0);
            ctx.moveTo(0, -arm);
            ctx.lineTo(0, arm);
            ctx.stroke();
            break;
        }

        ctx.restore();
      }

      // Draw connections between nearby particles
      ctx.globalAlpha = 1;
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.strokeStyle = colors.primary;
            ctx.globalAlpha = ((150 - dist) / 150) * 0.3;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isDark, initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto"
      style={{ zIndex: 0 }}
    />
  );
}

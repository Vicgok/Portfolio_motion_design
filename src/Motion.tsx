import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
export function Journey({ reduced }: { reduced: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = ref.current!,
      ink = svg.querySelector<SVGPathElement>(".journey-ink")!,
      track = svg.querySelector("path")!,
      head = svg.querySelector<SVGCircleElement>(".journey-head")!,
      nodes = svg.querySelector("g")!;
    let length = 1;
    const draw = () => {
      if (reduced) return;
      const target = scrollY + innerHeight * 0.48;
      let lo = 0,
        hi = length;
      for (let i = 0; i < 13; i++) {
        const mid = (lo + hi) / 2;
        if (ink.getPointAtLength(mid).y < target) lo = mid;
        else hi = mid;
      }
      const point = ink.getPointAtLength((lo + hi) / 2);
      ink.style.strokeDashoffset = String(length - (lo + hi) / 2);
      head.setAttribute("cx", String(point.x));
      head.setAttribute("cy", String(point.y));
    };
    const measure = () => {
      const height =
          document.querySelector("main")!.getBoundingClientRect().bottom +
          scrollY,
        width = document.documentElement.clientWidth,
        x = width < 701 ? 13 : 35,
        wave = width < 701 ? 3 : 8;
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.style.height = `${height}px`;
      const sections = ["top", "experience", "work", "about", "contact"].map(
        (id, i) => {
          const r = document.getElementById(id)!.getBoundingClientRect();
          return {
            x: x + Math.sin(i * 1.8) * wave,
            y:
              r.top +
              scrollY +
              r.height *
                (id === "experience" ? 0.47 : id === "top" ? 0.42 : 0.31),
          };
        },
      );
      const points = [{ x, y: 0 }, ...sections, { x, y: height }];
      let d = `M${x} 0`;
      points.slice(1).forEach((b, i) => {
        const a = points[i],
          mid = (a.y + b.y) / 2;
        d += ` C${a.x + (i % 2 ? -wave : wave)} ${mid},${b.x + (i % 2 ? wave : -wave)} ${mid},${b.x} ${b.y}`;
      });
      track.setAttribute("d", d);
      ink.setAttribute("d", d);
      length = ink.getTotalLength();
      ink.style.strokeDasharray = String(length);
      nodes.replaceChildren(
        ...sections.map((p) => {
          const c = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle",
          );
          c.setAttribute("cx", String(p.x));
          c.setAttribute("cy", String(p.y));
          c.setAttribute("r", width < 701 ? "3.5" : "5");
          c.setAttribute("class", "journey-node");
          return c;
        }),
      );
      draw();
    };
    measure();
    const trigger = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: draw,
      onRefresh: measure,
    });
    const observer = new ResizeObserver(() => {
      measure();
      ScrollTrigger.refresh();
    });
    observer.observe(document.querySelector("main")!);
    return () => {
      observer.disconnect();
      trigger.kill();
    };
  }, [reduced]);
  return (
    <svg ref={ref} className="journey-svg" aria-hidden="true">
      <defs>
        <linearGradient id="journeyGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f55e59" />
          <stop offset=".48" stopColor="#ffcf35" />
          <stop offset="1" stopColor="#376df2" />
        </linearGradient>
      </defs>
      <path className="journey-track" />
      <path
        className="journey-ink"
        style={{ visibility: reduced ? "hidden" : "visible" }}
      />
      <g />
      <circle
        className="journey-head"
        r="5.5"
        fill="#f55e59"
        stroke="white"
        strokeWidth="2"
        style={{ visibility: reduced ? "hidden" : "visible" }}
      />
    </svg>
  );
}
export function PointerEffects({ disabled }: { disabled: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = gsap.matchMedia();
    media.add("(hover:hover) and (pointer:fine)", () => {
      if (disabled) return;
      const cursor = ref.current!,
        caption = cursor.querySelector("span")!,
        hero = document.getElementById("top")!;
      let magnetic: HTMLElement | null = null;
      const x = gsap.quickTo(cursor, "x", { duration: 0.25 }),
        y = gsap.quickTo(cursor, "y", { duration: 0.25 });
      const move = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        cursor.style.display = "grid";
        x(e.clientX);
        y(e.clientY);
        const target = e.target as Element;
        const card = target.closest(".project,.spatial-card"),
          button = target.closest("a,button");
        caption.textContent = card
          ? "VIEW"
          : button
            ? "GO"
            : target.closest(".hero")
              ? "MOVE"
              : "";
        cursor.classList.toggle("active", !!button);
        cursor.classList.toggle("is-label", !!caption.textContent);
        const link = target.closest<HTMLElement>(".hero-action a");
        if (magnetic && magnetic !== link)
          gsap.to(magnetic, { x: 0, y: 0, duration: 0.3 });
        magnetic = link;
        if (link) {
          const r = link.getBoundingClientRect();
          gsap.to(link, {
            x: ((e.clientX - r.left - r.width / 2) / r.width) * 12,
            y: ((e.clientY - r.top - r.height / 2) / r.height) * 9,
            duration: 0.3,
            overwrite: true,
          });
        }
        if (target.closest(".hero")) {
          const r = hero.getBoundingClientRect(),
            px = (e.clientX - r.left) / r.width,
            py = (e.clientY - r.top) / r.height;
          hero.style.setProperty("--light-x", `${px * 100}%`);
          hero.style.setProperty("--light-y", `${py * 100}%`);
          hero.style.setProperty("--depth-x", `${(px - 0.5) * 20}px`);
          hero.style.setProperty("--depth-y", `${(py - 0.5) * 16}px`);
          gsap.to(hero.querySelector(".hero-orbit-badge"), {
            x: (px - 0.5) * -28,
            y: (py - 0.5) * -20,
            rotation: 10 + (px - 0.5) * 12,
            duration: 0.4,
            overwrite: true,
          });
        }
      };
      const hide = () => {
        cursor.style.display = "none";
      };
      document.addEventListener("pointermove", move, { passive: true });
      document.documentElement.addEventListener("pointerleave", hide);
      return () => {
        document.removeEventListener("pointermove", move);
        document.documentElement.removeEventListener("pointerleave", hide);
        hide();
        gsap.killTweensOf(cursor);
        if (magnetic) gsap.set(magnetic, { x: 0, y: 0 });
        gsap.killTweensOf(".hero-orbit-badge,.hero-action a");
      };
    });
    return () => media.revert();
  }, [disabled]);
  return (
    <div id="cursor" ref={ref} aria-hidden="true">
      <div className="cursor-ring" />
      <div className="cursor-dot" />
      <span className="cursor-caption" />
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { projects } from "./projects";
import { Art } from "./Art";
export function Spatial({
  reduced,
  paused,
  open,
}: {
  reduced: boolean;
  paused: boolean;
  open: (i: number) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = ref.current!;
    const observer = new IntersectionObserver(([entry]) => {
      root.classList.toggle("is-visible", entry.isIntersecting);
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);
  const [viewport, setViewport] = useState(
    () => `${innerWidth}:${innerHeight}`,
  );
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const resize = () => {
      clearTimeout(timer);
      timer = setTimeout(
        () => setViewport(`${innerWidth}:${innerHeight}`),
        120,
      );
    };
    window.addEventListener("resize", resize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", resize);
    };
  }, []);
  useEffect(() => {
    const root = ref.current!;
    const cards = Array.from(
      root.querySelectorAll<HTMLButtonElement>(".spatial-card"),
    );
    const media = gsap.matchMedia();
    media.add(
      { mobile: "(max-width:700px)", desktop: "(min-width:701px)" },
      () => {
        const mobile = innerWidth < 701,
          columns = mobile ? 3 : 4,
          rows = Math.ceil(cards.length / columns),
          gx = mobile
            ? gsap.utils.clamp(14, 19, innerWidth * 0.045)
            : gsap.utils.clamp(27, 39, innerWidth * 0.026),
          gy = mobile
            ? gsap.utils.clamp(15, 20, innerWidth * 0.045)
            : gsap.utils.clamp(28, 41, innerHeight * 0.041),
          ratio = mobile ? 0.72 : 0.635,
          cw = Math.min(
            mobile
              ? Math.min(108, innerWidth * 0.245)
              : Math.min(205, Math.max(145, innerWidth * 0.155)),
            (innerHeight * 0.48 - (rows - 1) * gy) / (rows * ratio),
          ),
          ch = cw * ratio;
        const enable = (yes: boolean) =>
          cards.forEach((c) => {
            c.classList.toggle("is-interactive", yes);
            c.disabled = !yes;
          });
        const timeline = gsap.timeline({
          paused: reduced,
          scrollTrigger: reduced
            ? undefined
            : {
                trigger: root,
                start: "top top",
                end: "bottom bottom",
                scrub: 0.6,
                onUpdate: (self) => {
                  enable(self.progress > 0.67 && self.progress < 0.97);
                  root
                    .querySelector(".spatial-hint")
                    ?.classList.toggle(
                      "visible",
                      self.progress > 0.67 && self.progress < 0.97,
                    );
                },
              },
        });
        cards.forEach((card, i) => {
          const angle = (i / 12) * Math.PI * 2 + (i % 3) * 0.16;
          gsap.set(card, {
            width: cw,
            height: ch,
            xPercent: -50,
            yPercent: -50,
          });
          timeline.fromTo(
            card,
            {
              x: Math.cos(angle) * Math.min(innerWidth * 0.45, 570),
              y: Math.sin(angle) * innerHeight * 0.38,
              z: -500,
              rotationY: 60 * (i % 2 ? 1 : -1),
              rotation: (i % 2 ? 1 : -1) * (33 + i * 7),
              scale: 0.62,
              opacity: 0,
            },
            {
              x: ((i % columns) - (columns - 1) / 2) * (cw + gx),
              y:
                (Math.floor(i / columns) - (rows - 1) / 2) * (ch + gy) +
                (mobile ? -10 : -29),
              z: ((i % 4) - 1.5) * 9,
              rotationX: (Math.floor(i / columns) - (rows - 1) / 2) * -1.7,
              rotationY: ((i % 4) - 1.5) * -1.9,
              rotation: 0,
              scale: 1,
              opacity: 1,
              duration: 0.6,
              ease: "power1.inOut",
            },
            0.13 + i * 0.014,
          );
        });
        timeline
          .fromTo(
            root.querySelector(".space-vfx"),
            { opacity: 0.12 },
            { opacity: 0.82, duration: 0.83, ease: "none" },
            0.2,
          )
          .fromTo(
            root.querySelector(".portal"),
            { rotationX: 66, rotationZ: -35, scale: 0.65, opacity: 1 },
            {
              rotationX: 12,
              rotationZ: 195,
              scale: 2.85,
              opacity: 0,
              duration: 1,
            },
            0,
          )
          .fromTo(
            root.querySelector(".stage-title"),
            { opacity: 1, y: 0, scale: 1 },
            { opacity: 0.07, y: -100, scale: 1.26, duration: 0.34 },
            0.36,
          )
          .to(
            root.querySelector(".progress-track div"),
            { width: "100%", duration: 1, ease: "none" },
            0,
          );
        if (reduced) {
          timeline.progress(1);
          enable(true);
        } else enable(false);
        return () => timeline.kill();
      },
    );
    return () => media.revert();
  }, [reduced, viewport]);
  return (
    <section
      ref={ref}
      className="transition"
      id="experience"
      aria-label="Spatial portfolio transition"
    >
      <div
        className="sticky"
        id="sticky"
        onPointerMove={(e) => {
          if (paused || e.pointerType !== "mouse") return;
          const cloud =
            e.currentTarget.querySelector<HTMLElement>(".spatial-cloud")!;
          cloud.style.setProperty(
            "--orbit-y",
            `${(e.clientX / innerWidth - 0.5) * 18}deg`,
          );
          cloud.style.setProperty(
            "--orbit-x",
            `${(e.clientY / innerHeight - 0.5) * -12}deg`,
          );
        }}
        onPointerLeave={(e) => {
          const c =
            e.currentTarget.querySelector<HTMLElement>(".spatial-cloud")!;
          c.style.setProperty("--orbit-y", "0deg");
          c.style.setProperty("--orbit-x", "0deg");
        }}
      >
        <div className="space-vfx" aria-hidden="true">
          <div className="depth-floor" />
          <div className="space-aura" />
          <svg
            className="depth-trails"
            viewBox="0 0 1200 800"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="depthBeam">
                <stop stopColor="#598cf2" stopOpacity="0" />
                <stop offset=".5" stopColor="#91c5ff" stopOpacity=".65" />
                <stop offset="1" stopColor="#ffda80" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M-50 610 C240 430 440 670 1250 240" />
            <path d="M-50 350 C280 180 730 510 1250 100" />
            <path d="M-50 730 C380 560 700 770 1250 480" />
          </svg>
          <div className="depth-points">
            {Array.from({ length: 9 }, (_, i) => (
              <i key={i} />
            ))}
          </div>
        </div>
        <div className="portal" />
        <div className="micro stage-kicker">
          02 / The transformation · scroll-driven scene
        </div>
        <h2 className="stage-title display">
          EVERY
          <br />
          FRAME
          <br />
          <em>MOVES.</em>
        </h2>
        <div className="spatial-cloud">
          {projects.map((p, i) => (
            <button
              key={p.name}
              className="spatial-card"
              aria-label={`Explore ${p.name}, project ${i + 1} of 12`}
              onClick={() => open(i)}
              onPointerMove={(e) => {
                if (paused || e.pointerType !== "mouse") return;
                const r = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty(
                  "--tx",
                  `${((e.clientY - r.top) / r.height - 0.5) * -20}deg`,
                );
                e.currentTarget.style.setProperty(
                  "--ty",
                  `${((e.clientX - r.left) / r.width - 0.5) * 20}deg`,
                );
                e.currentTarget.style.setProperty(
                  "--mx",
                  `${((e.clientX - r.left) / r.width) * 100}%`,
                );
                e.currentTarget.style.setProperty(
                  "--my",
                  `${((e.clientY - r.top) / r.height) * 100}%`,
                );
              }}
              onPointerLeave={(e) => {
                e.currentTarget.style.setProperty("--tx", "0deg");
                e.currentTarget.style.setProperty("--ty", "0deg");
              }}
            >
              <span className="spatial-inner">
                <Art project={p} />
                <span className="card-meta">
                  {String(i + 1).padStart(2, "0")} / {p.name}
                </span>
                <span className="spatial-open">VIEW ↗</span>
              </span>
            </button>
          ))}
        </div>
        <div className="spatial-hint">
          <span className="hint-desktop">MOVE AROUND · SELECT A WORLD</span>
          <span className="hint-touch">TAP A WORLD TO EXPLORE</span>
        </div>
        <div className="stage-content">
          <strong>A GALLERY TAKES SHAPE</strong>
          <p>Every piece has its own color, rhythm, and personality.</p>
          <a className="pill" href="#work">
            Explore the archive ↗
          </a>
        </div>
        <div className="stage-progress">
          <div className="progress-track">
            <div />
          </div>
        </div>
      </div>
    </section>
  );
}

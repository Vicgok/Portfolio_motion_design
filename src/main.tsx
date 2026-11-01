import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { createRoot } from "react-dom/client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import heroMarkup from "./hero.html?raw";
import { projects } from "./projects";
import "./styles.css";
import "./v4.css";
import { Journey, PointerEffects } from "./Motion";
import { Spatial } from "./Spatial";
import { Art } from "./Art";
gsap.registerPlugin(ScrollTrigger);
function useReducedMotion() {
  const [reduced, set] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => set(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}
function Hero({ reduced, paused }: { reduced: boolean; paused: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const ready = useRef(performance.now() + 3500);
  useEffect(() => {
    const root = ref.current!;
    const hero = root.querySelector<HTMLElement>(".hero")!;
    const subject = root.querySelector<HTMLElement>(".hero-subject")!;
    const replay = root.querySelector<HTMLButtonElement>(".replay-sketch")!;
    hero.classList.toggle("pause-ambient", paused);
    const play = () => {
      if (reduced) return;
      ready.current = performance.now() + 3500;
      hero.classList.remove("play-intro");
      void hero.offsetWidth;
      hero.classList.add("play-intro");
    };
    const move = (e: PointerEvent) => {
      if (
        performance.now() < ready.current ||
        paused ||
        e.pointerType !== "mouse" ||
        innerWidth < 701
      )
        return;
      gsap.to(subject, {
        x: (e.clientX / innerWidth - 0.5) * 14,
        y: (e.clientY / innerHeight - 0.5) * 10,
        duration: 0.6,
        overwrite: "auto",
      });
    };
    replay.addEventListener("click", play);
    hero.addEventListener("pointermove", move);
    return () => {
      replay.removeEventListener("click", play);
      hero.removeEventListener("pointermove", move);
      gsap.killTweensOf(subject);
    };
  }, [reduced, paused]);
  return <div ref={ref} dangerouslySetInnerHTML={{ __html: heroMarkup }} />;
}
function Viewer({
  index,
  close,
  navigate,
  reduced,
}: {
  index: number;
  close: () => void;
  navigate: (direction: number) => void;
  reduced: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [playing, setPlaying] = useState(false);
  const [entered, setEntered] = useState(false);
  const p = projects[index];
  const origin = useRef<HTMLElement | null>(null);
  const closing = useRef(false);
  const requestClose = () => {
    if (closing.current) return;
    closing.current = true;
    const art = ref.current?.querySelector<HTMLElement>(".modal-art");
    const target = (
      origin.current?.querySelector(".project-art,.spatial-inner") ??
      origin.current
    )?.getBoundingClientRect();
    if (reduced || !art || !target?.width) {
      close();
      return;
    }
    const r = art.getBoundingClientRect();
    setPlaying(false);
    gsap.killTweensOf(art);
    gsap.to(art, {
      x: (Number(gsap.getProperty(art, "x")) || 0) + target.left - r.left,
      y: (Number(gsap.getProperty(art, "y")) || 0) + target.top - r.top,
      scaleX: target.width / r.width,
      scaleY: target.height / r.height,
      transformOrigin: "top left",
      opacity: 0.3,
      duration: 0.3,
      ease: "power2.in",
      onComplete: close,
    });
  };
  useLayoutEffect(() => {
    const dialog = ref.current!;
    const focused = document.activeElement as HTMLElement;
    origin.current = focused;
    const source = (
      focused?.querySelector(".project-art,.spatial-inner") ?? focused
    )?.getBoundingClientRect();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    const art = dialog.querySelector<HTMLElement>(".modal-art")!;
    const destination = art.getBoundingClientRect();
    const animation =
      !reduced && source?.width
        ? gsap.fromTo(
            art,
            {
              x: source.left - destination.left,
              y: source.top - destination.top,
              scaleX: source.width / destination.width,
              scaleY: source.height / destination.height,
              transformOrigin: "top left",
            },
            {
              x: 0,
              y: 0,
              scaleX: 1,
              scaleY: 1,
              duration: 0.55,
              ease: "power3.out",
              force3D: true,
              onComplete: () => setEntered(true),
            },
          )
        : null;
    if (!animation) setEntered(true);
    return () => {
      animation?.kill();
      gsap.killTweensOf(art);
      dialog.close();
      document.body.style.overflow = previousOverflow;
      focused?.focus();
    };
  }, []);
  useEffect(() => {
    setPlaying(entered && !reduced);
  }, [index, reduced, entered]);
  return (
    <dialog
      ref={ref}
      className="viewer"
      aria-labelledby="viewer-title"
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          navigate(1);
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          navigate(-1);
        }
      }}
    >
      <button
        autoFocus
        className="close"
        onClick={requestClose}
        aria-label="Close project"
      >
        Ã—
      </button>
      <div className="modal-counter" aria-live="polite">
        {index + 1} / {projects.length}
      </div>
      <div className="modal-panel">
        <div className="modal-art">
          <Art project={p} playing={playing} />
        </div>
        <div className="modal-details">
          <div className="micro">SELECTED MOTION WORK</div>
          <h2 className="display" id="viewer-title">
            {p.name}
          </h2>
          <div className="placeholder">{p.label}</div>
          <p>
            {p.description ||
              "Selected animation study. Project context and credits will be added here."}
          </p>
          <div className="modal-buttons">
            <button onClick={() => navigate(-1)} aria-label="Previous project">
              â† Previous
            </button>
            <button onClick={() => setPlaying(!playing)} aria-pressed={playing}>
              {playing ? "Pause" : "Play"}
            </button>
            <button onClick={() => navigate(1)} aria-label="Next project">
              Next â†’
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
function Gallery({
  reduced,
  selected,
  setSelected,
}: {
  reduced: boolean;
  selected: number | null;
  setSelected: (value: number | null) => void;
}) {
  const [filter, setFilter] = useState("all");
  const [active, setActive] = useState<string | null>(null);

  const shown = projects.filter((p) => filter === "all" || p.type === filter);
  const change = (fn: () => void) => fn();
  return (
    <>
      <section className="grid-section" id="work">
        <div className="eyebrow">03 / The archive Â· visual experiments</div>
        <div className="gallery-top">
          <div>
            <h2 className="section-heading display">
              TWELVE
              <br />
              WORLDS.
            </h2>
            <p className="section-intro">
              Motion design, visual storytelling, and experiments in rhythm.
              Hover or focus to preview. Select a project to explore and control
              playback.
            </p>
          </div>
          <div className="gallery-counter" role="status">
            <small>PROJECT ARCHIVE</small>
            {shown.length} / 12
          </div>
        </div>
        <div className="filters" role="group" aria-label="Filter projects">
          {[
            ["all", "All 12"],
            ["motion", "Motion"],
            ["brand", "Brand"],
            ["experimental", "Experimental"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={`filter ${filter === id ? "active" : ""}`}
              aria-pressed={filter === id}
              onClick={() => {
                setFilter(id);
                setActive(null);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="gallery-grid">
          {shown.map((p) => (
            <button
              key={p.name}
              className="project"
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse") setActive(p.name);
              }}
              onPointerLeave={(e) => {
                if (!e.currentTarget.matches(":focus")) setActive(null);
              }}
              onPointerMove={(e) => {
                if (reduced || e.pointerType !== "mouse") return;
                const rect = e.currentTarget
                  .querySelector(".project-art")!
                  .getBoundingClientRect();
                e.currentTarget.style.setProperty(
                  "--mx",
                  `${((e.clientX - rect.left) / rect.width) * 100}%`,
                );
                e.currentTarget.style.setProperty(
                  "--my",
                  `${((e.clientY - rect.top) / rect.height) * 100}%`,
                );
              }}
              onFocus={() => setActive(p.name)}
              onBlur={(e) => {
                if (!e.currentTarget.matches(":hover")) setActive(null);
              }}
              onClick={() =>
                change(() => {
                  setActive(null);
                  setSelected(projects.indexOf(p));
                })
              }
              aria-label={`Open ${p.name}`}
            >
              <div className="project-art">
                <Art
                  project={p}
                  playing={!reduced && selected === null && active === p.name}
                />
              </div>
              <div className="project-info">
                <div>
                  <strong>{p.name}</strong>
                  <small>{p.label}</small>
                </div>
                <span className="project-index">
                  {String(projects.indexOf(p) + 1).padStart(2, "0")} / 12
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>
      {selected !== null && (
        <Viewer
          index={selected}
          reduced={reduced}
          close={() => change(() => setSelected(null))}
          navigate={(direction) =>
            setSelected(
              (selected + direction + projects.length) % projects.length,
            )
          }
        />
      )}
    </>
  );
}
function OrbitIcon({
  label,
  position,
  children,
}: {
  label: string;
  position: string;
  children: ReactNode;
}) {
  return (
    <span className={`orbit-node ${position}`}>
      <span className="orbit-upright">
        <span className="orbit-float">
          <span
            className="orbit-icon"
            tabIndex={0}
            role="img"
            aria-label={label}
          >
            {children}
          </span>
        </span>
      </span>
    </span>
  );
}
function CreativeOrbit() {
  return (
    <div className="creative-orbit" aria-label="Creative disciplines">
      <svg className="orbit-curves" viewBox="0 0 100 100" aria-hidden="true">
        <ellipse cx="50" cy="50" rx="43" ry="27" />
        <ellipse cx="50" cy="50" rx="35" ry="21" />
        <circle cx="11" cy="50" r="1.5" />
        <circle cx="88" cy="50" r="1.25" />
      </svg>
      <span className="orbit-track">
        <OrbitIcon label="Pen-nib illustration" position="orbit-node-one">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m15.6 3.2 5.2 5.2-9.2 10.1-6.1 2.2 2.2-6.1Z" />
            <path d="m14.1 4.7 5.2 5.2M7.7 14.6l1.7 1.7" />
          </svg>
        </OrbitIcon>
        <OrbitIcon label="Layered composition" position="orbit-node-two">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m12 3.5 8.5 4.7L12 12.9 3.5 8.2Z" />
            <path d="m5.5 12 6.5 3.6 6.5-3.6M5.5 15.8l6.5 3.7 6.5-3.7" />
          </svg>
        </OrbitIcon>
        <OrbitIcon
          label="Motion timeline animation"
          position="orbit-node-three"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7.5h16M4 16.5h16M8 5v14" />
            <path d="m13 9 4 3-4 3Z" />
            <circle cx="18" cy="7.5" r="1.5" />
          </svg>
        </OrbitIcon>
      </span>
    </div>
  );
}
function App() {
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const quiet = reduced || paused;
  useEffect(() => {
    document.body.classList.toggle("pause-ambient", quiet);
    return () => document.body.classList.remove("pause-ambient");
  }, [quiet]);
  const [menu, setMenu] = useState(false);
  return (
    <>
      <Journey reduced={reduced} />
      <PointerEffects disabled={quiet || selected !== null} />
      <a className="skip-link" href="#work">
        Skip to projects
      </a>
      <header className="topbar">
        <a className="logo" href="#top">
          MOTION<i>.</i>
        </a>
        <nav
          className={`nav ${menu ? "open" : ""}`}
          id="nav"
          aria-label="Main navigation"
        >
          {["work", "about", "contact"].map((id) => (
            <a key={id} href={`#${id}`} onClick={() => setMenu(false)}>
              {id}
            </a>
          ))}
          <a className="pill" href="#work" onClick={() => setMenu(false)}>
            Explore projects â†—
          </a>
        </nav>
        <button
          className="nav-toggle"
          aria-label="Toggle navigation"
          aria-controls="nav"
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          â˜°
        </button>
      </header>
      <main>
        <div className="hero-shell">
          <Hero reduced={reduced} paused={quiet} />
          <button
            className="hero-motion-toggle"
            aria-pressed={!quiet}
            disabled={reduced}
            onClick={() => setPaused(!paused)}
            aria-label={
              quiet
                ? "Resume interactive ambient motion"
                : "Pause interactive ambient motion"
            }
          >
            <span className="live-dot" />
            {quiet ? "Motion paused" : "Motion on"}
          </button>
        </div>
        <Spatial reduced={reduced} paused={quiet} open={setSelected} />
        <Gallery
          reduced={quiet}
          selected={selected}
          setSelected={setSelected}
        />
        <div className="break" aria-hidden="true">
          <div className="marquee">
            {[0, 1].map((i) => (
              <span key={i}>DONâ€™T THINK STATIC â˜… MAKE IT MOVE â˜…</span>
            ))}
          </div>
        </div>
        <section className="about" id="about">
          <div>
            <div className="eyebrow">04 / The mind behind the motion</div>
            <h2 className="about-head display">
              MORE
              <br />
              THAN
              <br />
              <em>PIXELS.</em>
            </h2>
            <div className="about-photo-wrap">
              <CreativeOrbit />
              <svg
                className="about-photo"
                viewBox="0 0 367 737"
                role="img"
                aria-label="Arun, motion designer"
                width="367"
                height="737"
              >
                <image
                  href="/portrait.png"
                  x="-87.625"
                  y="6.489583333333334"
                  width="546.2666666666667"
                  height="725.5104166666666"
                />
              </svg>
            </div>
          </div>
          <div className="about-copy">
            <h3 className="display">
              MAKE
              <br />
              PEOPLE
              <br />
              FEEL.
            </h3>
            <p>
              Iâ€™m Arun, a graphic and motion designer exploring animation,
              visual storytelling, and ideas in movement.
            </p>
            <a
              className="pill"
              href="/resume.pdf"
              target="_blank"
              rel="noreferrer"
            >
              View rÃ©sumÃ© â†—
            </a>
          </div>
        </section>
        <section className="contact" id="contact">
          <div className="eyebrow">
            05 / End of the scroll, start of something
          </div>
          <h2 className="display">
            LETâ€™S
            <br />
            CREATE<span style={{ color: "var(--coral)" }}>.</span>
          </h2>
          <p>For collaboration and contact details, see my rÃ©sumÃ©.</p>
          <a
            className="pill"
            href="/resume.pdf"
            target="_blank"
            rel="noreferrer"
          >
            Contact details â†—
          </a>
          <footer className="footer">
            <span>Â© 2026 Arun Â· Motion design</span>
            <a href="#top">Back to top â†‘</a>
          </footer>
        </section>
      </main>
    </>
  );
}
createRoot(document.getElementById("root")!).render(<App />);

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Project } from "./projects";
export function Art({
  project: p,
  playing = false,
}: {
  project: Project;
  playing?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const art = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!playing || !art.current) return;
    let intersecting = false;
    const sync = () => setVisible(intersecting && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting;
      sync();
    });
    observer.observe(art.current);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [playing]);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    if (playing && visible) {
      void element.play().catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        console.warn("Project preview could not play:", error);
      });
    } else {
      element.pause();
    }
    return () => element.pause();
  }, [playing, visible, p.video]);
  return (
    <div
      ref={art}
      className={`art ${playing ? "playing" : ""}`}
      style={
        {
          "--a": p.a,
          "--b": p.b,
          "--c": p.c,
          "--glow": p.glow,
        } as CSSProperties
      }
    >
      {p.poster ? (
        <>
          <img src={p.poster} alt="" loading="lazy" width="800" height="600" />
          {playing && p.video ? (
            <video
              ref={video}
              src={p.video}
              poster={p.poster}
              muted
              loop
              playsInline
              preload="none"
            />
          ) : playing && visible && p.gif ? (
            <img src={p.gif} alt="" />
          ) : null}
        </>
      ) : (
        <>
          <div className="ring" />
          <div className="ring" />
          <div className="art-object" />
          <div className="art-copy">{p.copy}</div>
        </>
      )}
    </div>
  );
}

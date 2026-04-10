import React, { useState, useRef, useEffect } from "react";

const CAT = {
  event: { label: "Event", accent: "#FFB347" },
  nature: { label: "Nature", accent: "#6EE77A" },
  emotion: { label: "Emotion", accent: "#FF6FA1" },
};

const HIGHLIGHTS = [
  { id: "e1", category: "event", start: 5, end: 9 },
  { id: "e2", category: "event", start: 33, end: 37 },
  { id: "n1", category: "nature", start: 13, end: 17 },
  { id: "n2", category: "nature", start: 44, end: 48 },
  { id: "m1", category: "emotion", start: 21, end: 26 },
  { id: "m2", category: "emotion", start: 50, end: 54 },
];

function fmt(sec = 0) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `${m}:${ss}`;
}

const PhoneCard = ({ category, videoSrc }) => {
  const videoRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const catHL = HIGHLIGHTS.filter((h) => h.category === category);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const hasAutoplayed = useRef(false);
  const trackRef = useRef(null);
  const draggingRef = useRef(false);
  const wasPlayingRef = useRef(false);

  const seekTo = (seconds) => {
    if (videoRef.current) {
      try {
        videoRef.current.currentTime = seconds;
        const p = videoRef.current.play();
        if (p && p.catch) p.catch(() => {});
        setIsPlaying(true);
      } catch (e) {
        // ignore
      }
    }
  };

  const togglePlay = async () => {
    if (!videoRef.current) return;
    try {
      if (videoRef.current.paused) {
        await videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    } catch (e) {
      setError("Playback blocked or unsupported codec");
    }
  };

  const updateFromClientX = (clientX) => {
    const track = trackRef.current;
    if (!track || !duration) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = ratio * Math.max(1, duration);
    if (videoRef.current) videoRef.current.currentTime = newTime;
    setTime(newTime);
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!draggingRef.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      updateFromClientX(clientX);
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      if (wasPlayingRef.current && videoRef.current)
        videoRef.current.play().catch(() => {});
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [duration]);

  const onTrackPointerDown = (e) => {
    e.preventDefault();
    draggingRef.current = true;
    wasPlayingRef.current = !!videoRef.current && !videoRef.current.paused;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    updateFromClientX(clientX);
  };

  useEffect(() => {
    const hl = catHL.find((h) => time >= h.start && time <= h.end);
    setActiveId(hl ? hl.id : null);
  }, [time, catHL]);

  // Reset autoplay flag when source changes
  useEffect(() => {
    hasAutoplayed.current = false;
    setIsPlaying(false);
    setError(null);
  }, [videoSrc]);

  // Autoplay at the first highlight once metadata is ready
  useEffect(() => {
    if (hasAutoplayed.current || duration <= 0 || !catHL.length || !videoRef.current) return;
    hasAutoplayed.current = true;
    videoRef.current.currentTime = catHL[0].start;
    videoRef.current.play().catch(() => {});
    setIsPlaying(true);
  }, [duration]);

  return (
    <div className="phone-card">
      <div
        className={"device-frame" + (activeId ? " active" : "")}
        style={{ ["--accent"]: CAT[category].accent }}
      >
        <div className="inner-screen">
          <div className="inner-glow" />

          {/* Top bar */}
          <div className="top-bar">
            <div className="top-left">
              <div className="top-btn" onClick={() => window.history.back()}>
                ◀
              </div>
              <div style={{ width: 8 }} />
              <div style={{ fontWeight: 700, fontSize: 12 }}>
                {new Date().toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}{" "}
                • Singapore
              </div>
            </div>
            <div className="top-btn">⋯</div>
          </div>

          {/* Video or placeholder */}
          {videoSrc ? (
            <>
              <video
                ref={videoRef}
                src={videoSrc}
                className="video-el"
                onLoadedMetadata={(e) => setDuration(e.target.duration)}
                onTimeUpdate={(e) => setTime(e.target.currentTime)}
                onError={() => setError("Video failed to load/play")}
                playsInline
                muted
              />
              <div className="tap-overlay" onClick={togglePlay} />
              {!isPlaying && (
                <div className="center-play" onClick={togglePlay}>
                  <div className="play-icon">▶</div>
                </div>
              )}
            </>
          ) : (
            <div className="upload-placeholder">No video selected</div>
          )}

          {error && <div className="video-error">{error}</div>}

          {/* Highlight badge — flies from centre to top */}
          <div
            className={"center-badge" + (activeId ? " active" : "")}
            role="status"
            aria-hidden={!activeId}
          >
            <span className="badge-dot" />
            <span className="badge-text">{CAT[category].label} Highlight</span>
          </div>

          {/* Bottom bar — timeline above icons */}
          <div className="bottom-bar">
            {/* Timeline */}
            <div className="timeline-wrap">
              <div
                className="track"
                ref={trackRef}
                onMouseDown={onTrackPointerDown}
                onTouchStart={onTrackPointerDown}
              >
                <div className="track-bg" />

                {/* Filled progress */}
                <div
                  className="progress-fill"
                  style={{
                    width: `${(duration
                      ? (time / Math.max(1, duration)) * 100
                      : 0
                    ).toFixed(2)}%`,
                  }}
                />

                {/* Highlight segments */}
                {catHL.map((h) => {
                  const l = duration
                    ? (h.start / duration) * 100
                    : (h.start / 60) * 100;
                  const w = duration
                    ? ((h.end - h.start) / duration) * 100
                    : ((h.end - h.start) / 60) * 100;
                  return (
                    <div
                      key={h.id}
                      className="seg"
                      onClick={() => seekTo(h.start)}
                      style={{
                        left: `${l}%`,
                        width: `${w}%`,
                        background: CAT[h.category].accent,
                      }}
                    />
                  );
                })}

                {/* Playhead */}
                <div
                  className="playhead"
                  style={{
                    left: `${(time / Math.max(1, duration)) * 100}%`,
                  }}
                  onMouseDown={onTrackPointerDown}
                  onTouchStart={onTrackPointerDown}
                  onPointerDown={onTrackPointerDown}
                />
              </div>

              {/* Time labels */}
              <div className="time-row">
                <span>{fmt(time)}</span>
                <span>{fmt(duration)}</span>
              </div>
            </div>

            {/* Action icons */}
            <div className="control-bar">
              <div className="action-btn" title="Like">
                ♡
              </div>
              <div className="action-btn" title="Edit">
                ✎
              </div>
              <div className="action-btn" title="Share">
                ⤴
              </div>
              <div className="action-btn" title="Delete">
                🗑
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [videoSrc, setVideoSrc] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    fetch("/birthday_surprise.mp4", { method: "HEAD" })
      .then((res) => {
        if (res.ok) {
          setVideoSrc("/birthday_surprise.mp4");
          setFileName("birthday_surprise.mp4");
        }
      })
      .catch(() => {});
  }, []);

  const loadFile = (f) => {
    if (!f || !f.type.startsWith("video/")) return;
    setVideoSrc(URL.createObjectURL(f));
    setFileName(f.name);
  };

  const handleFile = (e) => loadFile(e.target.files?.[0]);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    loadFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="app-root">
      <header className="header">
        <h1>Video Moments — Web</h1>
        {videoSrc && (
          <div className="upload-wrap">
            <input id="file" type="file" accept="video/*" onChange={handleFile} />
            <label htmlFor="file" className="upload-btn">
              <span className="upload-btn-icon">⬆</span>
              {fileName}
            </label>
          </div>
        )}
      </header>

      {!videoSrc ? (
        <div
          className={"drop-zone" + (dragging ? " drop-zone--active" : "")}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <input id="file" type="file" accept="video/*" onChange={handleFile} />
          <div className="drop-zone__icon">🎬</div>
          <p className="drop-zone__title">Drop your video here</p>
          <p className="drop-zone__sub">or</p>
          <label htmlFor="file" className="upload-btn">
            <span className="upload-btn-icon">⬆</span>
            Browse file
          </label>
          <p className="drop-zone__hint">Supports MP4, MOV, WebM · portrait &amp; landscape</p>
        </div>
      ) : (
        <main className="grid">
          {Object.keys(CAT).map((k) => (
            <PhoneCard key={k} category={k} videoSrc={videoSrc} />
          ))}
        </main>
      )}
    </div>
  );
}

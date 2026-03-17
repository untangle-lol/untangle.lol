"use client";
import { useState, useRef, useEffect } from "react";

// CSS for the bug dance — injected once via <style>
const DANCE_CSS = `
@keyframes bugDance {
  0%   { transform: rotate(0deg)   scale(1);    }
  8%   { transform: rotate(-20deg) scale(1.15); }
  18%  { transform: rotate(22deg)  scale(1.25); }
  28%  { transform: rotate(-16deg) scale(1.18); }
  38%  { transform: rotate(18deg)  scale(1.22); }
  48%  { transform: rotate(-10deg) scale(1.14); }
  58%  { transform: rotate(12deg)  scale(1.18); }
  70%  { transform: rotate(-6deg)  scale(1.1);  }
  82%  { transform: rotate(5deg)   scale(1.05); }
  100% { transform: rotate(0deg)   scale(1);    }
}
.bug-dancing {
  animation: bugDance 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}
`;

// Anonymised device snapshot — no user identity, no IP
function collectDeviceInfo() {
  try {
    const ua = navigator.userAgent;
    const browser =
      /Edg\//.test(ua)                       ? "Edge"    :
      /OPR\/|Opera/.test(ua)                 ? "Opera"   :
      /Chrome\//.test(ua)                    ? "Chrome"  :
      /Firefox\//.test(ua)                   ? "Firefox" :
      /Safari\//.test(ua) && !/Chrome/.test(ua) ? "Safari" :
      "Other";
    const os =
      /Windows NT 10/.test(ua) ? "Windows 10/11"  :
      /Windows NT 6/.test(ua)  ? "Windows (older)" :
      /Mac OS X/.test(ua)      ? "macOS"           :
      /Android/.test(ua)       ? "Android"         :
      /iPhone|iPad/.test(ua)   ? "iOS"             :
      /Linux/.test(ua)         ? "Linux"           :
      "Unknown OS";
    return {
      browser, os,
      screen:   `${screen.width}×${screen.height}`,
      viewport: `${window.innerWidth}×${window.innerHeight}`,
      dpr:      window.devicePixelRatio,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  } catch { return {}; }
}

export default function FeedbackWidget({ c, rt, t }) {
  const [open,    setOpen]    = useState(false);
  const [text,    setText]    = useState("");
  // idle | capturing | sending | sent | error
  const [status,  setStatus]  = useState("idle");
  const [dancing, setDancing] = useState(false);
  const taRef   = useRef(null);
  const bugRef  = useRef(null);

  // ── Focus textarea when panel opens ──────────────────────────────────────
  useEffect(() => {
    if (open && taRef.current) taRef.current.focus();
  }, [open]);

  // ── Bug dances once per minute ────────────────────────────────────────────
  useEffect(() => {
    // Small random offset so it doesn't fire immediately on load
    const delay = 5000 + Math.random() * 5000;
    const initial = setTimeout(() => {
      triggerDance();
      const interval = setInterval(triggerDance, 60_000);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(initial);
  }, []);

  function triggerDance() {
    if (!bugRef.current) return;
    // Toggle class off then on to restart animation even if already applied
    bugRef.current.classList.remove("bug-dancing");
    // Force reflow
    void bugRef.current.offsetWidth;
    bugRef.current.classList.add("bug-dancing");
    setTimeout(() => bugRef.current?.classList.remove("bug-dancing"), 950);
  }

  function toggle() {
    setOpen(o => !o);
    if (open) { setText(""); setStatus("idle"); }
  }

  async function submit() {
    if (!text.trim() || status === "sending" || status === "capturing") return;
    setStatus("capturing");

    // Grab screenshot (best-effort — failures are silently ignored)
    let screenshot = null;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(document.documentElement, {
        scale:           0.5,
        useCORS:         true,
        allowTaint:      true,
        logging:         false,
        removeContainer: true,
      });
      screenshot = canvas.toDataURL("image/jpeg", 0.65);
    } catch { /* screenshot optional */ }

    setStatus("sending");

    try {
      const res = await fetch("/api/feedback", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedback:   text.trim(),
          page:       window.location.href,
          deviceInfo: collectDeviceInfo(),
          screenshot,
        }),
      });
      if (res.ok) {
        setStatus("sent");
        setTimeout(() => { setOpen(false); setStatus("idle"); setText(""); }, 1800);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  // ── i18n with safe fallbacks ──────────────────────────────────────────────
  const tr = {
    title:  t?.fbTitle   ?? "Feedback",
    ph:     t?.fbPh      ?? "Something broken or a suggestion? Tell us…",
    send:   t?.fbSend    ?? "Send",
    cancel: t?.fbCancel  ?? "Cancel",
    sent:   t?.fbSent    ?? "Received, thanks!",
    err:    t?.fbErr     ?? "Failed — try again",
    hint:   t?.fbHint    ?? "⌘↵ to send",
  };

  const busy     = status === "capturing" || status === "sending";
  const panelBg  = rt === "dark" ? "rgba(15,23,42,0.97)" : "rgba(255,255,255,0.98)";
  const btnLabel =
    busy              ? "…"       :
    status === "sent" ? "✓ " + tr.sent.split(",")[0] :
    tr.send;

  return (
    <>
      <style>{DANCE_CSS}</style>

      <div style={{ position: "fixed", bottom: 88, right: 14, zIndex: 150 }}>

        {/* ── Floating bug button ───────────────────────────────────────── */}
        <button
          ref={bugRef}
          onClick={toggle}
          title={tr.title}
          aria-label={tr.title}
          style={{
            width:          34,
            height:         34,
            borderRadius:   "50%",
            background:     open ? c.ab : c.cb,
            border:         `1px solid ${open ? c.abr : c.ibr}`,
            cursor:         "pointer",
            fontSize:       15,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            backdropFilter: "blur(8px)",
            boxShadow:      "0 2px 10px rgba(0,0,0,0.18)",
            opacity:        open ? 1 : 0.55,
            transition:     "opacity 0.2s ease, background 0.2s ease",
            // No CSS transform here — the .bug-dancing class handles it
          }}
          onMouseEnter={e => { if (!open) e.currentTarget.style.opacity = "1"; }}
          onMouseLeave={e => { if (!open) e.currentTarget.style.opacity = "0.55"; }}
        >
          🐛
        </button>

        {/* ── Expanded feedback panel ───────────────────────────────────── */}
        {open && (
          <div
            style={{
              position:       "absolute",
              bottom:         42,
              right:          0,
              width:          272,
              background:     panelBg,
              border:         `1px solid ${c.cb}`,
              borderRadius:   13,
              padding:        "12px 13px 11px",
              backdropFilter: "blur(14px)",
              boxShadow:      "0 8px 32px rgba(0,0,0,0.22)",
              animation:      "fadeIn 0.18s ease",
              fontFamily:     "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
            }}
          >
            {/* Header */}
            <div style={{
              fontSize:      11,
              fontWeight:    600,
              color:         c.tm,
              marginBottom:  7,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}>
              {tr.title}
            </div>

            {/* Textarea */}
            <textarea
              ref={taRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
                if (e.key === "Escape") toggle();
              }}
              placeholder={tr.ph}
              rows={4}
              disabled={busy || status === "sent"}
              style={{
                width:       "100%",
                background:  c.ib,
                border:      `1px solid ${c.ibr}`,
                borderRadius: 8,
                color:       c.tx,
                padding:     "7px 9px",
                fontSize:    13,
                lineHeight:  1.5,
                resize:      "none",
                fontFamily:  "inherit",
                outline:     "none",
                boxSizing:   "border-box",
                opacity:     busy ? 0.6 : 1,
              }}
            />

            {/* Footer row */}
            <div style={{
              display:        "flex",
              justifyContent: "space-between",
              alignItems:     "center",
              marginTop:      8,
              gap:            7,
            }}>
              {/* Status hint */}
              <span style={{ fontSize: 10, color: c.tf, flexShrink: 0 }}>
                {status === "error"
                  ? <span style={{ color: c.et }}>{tr.err}</span>
                  : status === "sent"
                  ? <span style={{ color: c.gr }}>{tr.sent}</span>
                  : tr.hint}
              </span>

              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={toggle}
                  disabled={busy}
                  style={{
                    background:   "none",
                    border:       `1px solid ${c.cb}`,
                    borderRadius: 7,
                    color:        c.tm,
                    fontSize:     12,
                    padding:      "4px 11px",
                    cursor:       "pointer",
                    fontFamily:   "inherit",
                  }}
                >
                  {tr.cancel}
                </button>

                <button
                  onClick={submit}
                  disabled={busy || !text.trim() || status === "sent"}
                  style={{
                    background:   c.ag,
                    border:       "none",
                    borderRadius: 7,
                    color:        c.bt,
                    fontSize:     12,
                    fontWeight:   700,
                    padding:      "4px 13px",
                    cursor:       busy ? "wait" : "pointer",
                    fontFamily:   "inherit",
                    opacity:      !text.trim() || busy ? 0.5 : 1,
                    transition:   "opacity 0.15s",
                    minWidth:     64,
                    textAlign:    "center",
                    whiteSpace:   "nowrap",
                  }}
                >
                  {btnLabel}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

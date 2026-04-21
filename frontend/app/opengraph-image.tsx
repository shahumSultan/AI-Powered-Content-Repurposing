import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ContentFlow — Turn Any Content Into a Full Content Pack";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0A0908",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Orange radial glow — top left */}
        <div
          style={{
            position: "absolute",
            top: -140,
            left: -60,
            width: 580,
            height: 580,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(249,115,22,0.14) 0%, transparent 68%)",
            display: "flex",
          }}
        />

        {/* Amber glow — bottom right */}
        <div
          style={{
            position: "absolute",
            bottom: -100,
            right: -60,
            width: 420,
            height: 420,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(251,191,36,0.1) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: "linear-gradient(to right, #f97316, #fbbf24, rgba(251,191,36,0.1))",
            display: "flex",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "64px 100px",
            flex: 1,
          }}
        >
          {/* Logo row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              marginBottom: 52,
            }}
          >
            {/* Lightning bolt icon */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "linear-gradient(135deg, #f97316, #fbbf24)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="30" height="30" viewBox="0 0 20 20" fill="white">
                <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
              </svg>
            </div>
            <span
              style={{
                fontSize: 30,
                fontWeight: 700,
                color: "rgba(255,255,255,0.88)",
                letterSpacing: "-0.5px",
                display: "flex",
              }}
            >
              ContentFlow
            </span>
          </div>

          {/* Headline */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 70,
              fontWeight: 800,
              lineHeight: 1.06,
              letterSpacing: "-2.5px",
              marginBottom: 28,
            }}
          >
            <span style={{ display: "flex", color: "#ffffff" }}>
              Turn Any Content
            </span>
            <span style={{ display: "flex", color: "#ffffff" }}>
              Into a{" "}
              <span style={{ color: "#f97316", marginLeft: 18, display: "flex" }}>
                Full Content Pack
              </span>
            </span>
          </div>

          {/* Subline */}
          <div
            style={{
              fontSize: 24,
              color: "rgba(255,255,255,0.38)",
              fontWeight: 400,
              lineHeight: 1.45,
              maxWidth: 780,
              display: "flex",
            }}
          >
            Paste a YouTube video or blog URL → hooks, LinkedIn posts, Instagram
            captions, and Shorts ideas in seconds.
          </div>
        </div>

        {/* Right — output format pills */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 12,
            padding: "64px 80px 64px 0",
            width: 260,
          }}
        >
          {[
            { label: "LinkedIn Post", color: "#0ea5e9" },
            { label: "Twitter Hook", color: "#f97316" },
            { label: "IG Caption", color: "#a855f7" },
            { label: "Shorts Idea", color: "#fbbf24" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 40,
                padding: "13px 20px",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: item.color,
                  display: "flex",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 16,
                  color: "rgba(255,255,255,0.6)",
                  display: "flex",
                }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}

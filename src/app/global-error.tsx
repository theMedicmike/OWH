"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "24px", background: "#f4f6f9", color: "#15212e" }}>
        <h1 style={{ fontSize: "18px", fontWeight: 700 }}>Something went wrong</h1>
        <p style={{ marginTop: "8px", maxWidth: "360px", color: "#5c6b7a", fontSize: "14px", lineHeight: 1.6 }}>
          Sorry — something broke. Your record is safe. Please reload the page.
        </p>
        <button
          onClick={() => reset()}
          style={{ marginTop: "16px", background: "#16314f", color: "#fff", border: 0, borderRadius: "8px", padding: "8px 16px", fontWeight: 600, cursor: "pointer" }}
        >
          Reload
        </button>
        <p style={{ marginTop: "24px", fontSize: "12px", color: "#8a97a5" }}>
          Veterans Crisis Line: dial 988, then press 1.
        </p>
      </body>
    </html>
  );
}

"use client";

export default function SalonError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    console.error("[SalonError]", error);

    return (
        <div style={{ padding: 40, textAlign: "center" }}>
            <h2>페이지 로딩 오류</h2>
            <p style={{ color: "#888" }}>{error.message}</p>
            <pre style={{ fontSize: 12, color: "#aaa", maxWidth: 600, margin: "0 auto", overflow: "auto" }}>
                {error.stack}
            </pre>
            <button onClick={reset} style={{ marginTop: 20, padding: "8px 16px" }}>
                다시 시도
            </button>
        </div>
    );
}

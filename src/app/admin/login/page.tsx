/**
 * 개발자 대시보드 로그인 페이지
 * /admin/login 경로
 * ID / PW 방식 (환경변수 비교)
 */

"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function DevLoginPage() {
    const [id, setId] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            const res = await fetch("/api/dev/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, password }),
            });
            const data = await res.json();

            if (!data.success) {
                setError(data.error || "로그인 실패");
                return;
            }

            // 토큰 저장
            localStorage.setItem("dev-admin-token", data.token);
            window.location.href = "/admin/dashboard";
        } catch (err) {
            console.error("[DevLogin] Error:", err);
            setError("서버 연결 실패. 잠시 후 다시 시도해주세요.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`${styles.container} adminLayout`}>
            <div className={styles.card}>
                <div className={styles.decoCircle1} />
                <div className={styles.decoCircle2} />

                <div className={styles.logo}>⚙️</div>
                <h1 className={styles.title}>Developer Console</h1>
                <p className={styles.subtitle}>AI Hair Studio 관리자</p>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleLogin}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>관리자 ID</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={id}
                            onChange={(e) => setId(e.target.value)}
                            placeholder="관리자 ID 입력"
                            required
                            autoComplete="username"
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>비밀번호</label>
                        <input
                            type="password"
                            className={styles.input}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="비밀번호 입력"
                            required
                            minLength={6}
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={isLoading}
                    >
                        {isLoading && <span className={styles.spinner} />}
                        로그인
                    </button>
                </form>

                <div className={styles.footer}>
                    © 2026 AI Hair Studio — Developer Console
                </div>
            </div>
        </div>
    );
}

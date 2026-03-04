/**
 * 관리자 로그인 페이지
 * /admin/login 경로
 * Supabase Auth 기반 인증
 * 회원가입은 슈퍼어드민 API(/api/admin/create-salon)로만 가능
 */

"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // 로그인 처리
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();

            if (!data.success) {
                setError(data.error || "로그인 실패");
                return;
            }

            // accessToken 저장
            if (data.accessToken) {
                localStorage.setItem("oc-access-token", data.accessToken);
            }

            // 살롱 목록에서 첫 번째 살롱으로 이동
            if (data.salons && data.salons.length > 0) {
                const firstSalon = data.salons[0];
                sessionStorage.setItem(`admin-auth-${firstSalon.id}`, "true");
                localStorage.setItem("oc-salon-id", firstSalon.id);
                localStorage.setItem("oc-authenticated", "true");
                window.location.href = `/admin/${encodeURIComponent(firstSalon.id)}`;
            } else {
                setError("등록된 미용실이 없습니다. 관리자에게 문의해주세요.");
            }
        } catch (err) {
            console.error("[Login] Error:", err);
            setError("서버 연결 실패. 잠시 후 다시 시도해주세요.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                {/* 데코 서클 */}
                <div className={styles.decoCircle1} />
                <div className={styles.decoCircle2} />

                {/* 로고 */}
                <div className={styles.logo}>✂️</div>
                <h1 className={styles.title}>AI Hair Studio</h1>
                <p className={styles.subtitle}>미용실 관리자 포털</p>

                {/* 에러 메시지 */}
                {error && <div className={styles.error}>{error}</div>}

                {/* 로그인 폼 */}
                <form onSubmit={handleLogin}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>이메일</label>
                        <input
                            type="email"
                            className={styles.input}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="salon@example.com"
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>비밀번호</label>
                        <input
                            type="password"
                            className={styles.input}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="6자 이상"
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

                <p className={styles.helpText}>
                    계정이 없으신가요? 관리자에게 문의해주세요.
                </p>

                <div className={styles.footer}>
                    © 2026 AI Hair Studio
                </div>
            </div>
        </div>
    );
}

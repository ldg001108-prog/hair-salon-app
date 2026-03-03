/**
 * 관리자 로그인/회원가입 페이지
 * /admin/login 경로
 * Supabase Auth 기반 인증
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

type AuthMode = "login" | "signup";

export default function AdminLoginPage() {
    const router = useRouter();
    const [mode, setMode] = useState<AuthMode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [salonName, setSalonName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // 로그인 처리
    const handleLogin = async () => {
        setIsLoading(true);
        setError("");
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            console.log("[Login] API response:", JSON.stringify(data));

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
                console.log("[Login] Navigating to salon:", firstSalon.id);
                // 세션 인증 표시 (기존 호환용)
                sessionStorage.setItem(`admin-auth-${firstSalon.id}`, "true");
                // localStorage에도 인증 정보 저장 (확실한 인증 전달)
                localStorage.setItem("oc-salon-id", firstSalon.id);
                localStorage.setItem("oc-authenticated", "true");
                // window.location으로 확실한 페이지 이동
                window.location.href = `/admin/${encodeURIComponent(firstSalon.id)}`;
            } else {
                setError("등록된 미용실이 없습니다. 회원가입을 먼저 해주세요.");
            }
        } catch (err) {
            console.error("[Login] Error:", err);
            setError("서버 연결 실패. 잠시 후 다시 시도해주세요.");
        } finally {
            setIsLoading(false);
        }
    };

    // 회원가입 처리
    const handleSignup = async () => {
        setIsLoading(true);
        setError("");
        setSuccess("");
        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, salonName }),
            });
            const data = await res.json();

            if (!data.success) {
                setError(data.error || "회원가입 실패");
                return;
            }

            setSuccess(`"${salonName}" 미용실이 생성되었습니다! 로그인해주세요.`);
            setMode("login");
            setSalonName("");
            setPassword("");
        } catch {
            setError("서버 연결 실패. 잠시 후 다시 시도해주세요.");
        } finally {
            setIsLoading(false);
        }
    };

    // 폼 제출
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === "login") {
            handleLogin();
        } else {
            handleSignup();
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                {/* 로고 */}
                <div className={styles.logo}>✂️</div>
                <h1 className={styles.title}>AI Hair Studio</h1>
                <p className={styles.subtitle}>미용실 관리자 포털</p>

                {/* 탭 */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${mode === "login" ? styles.tabActive : ""}`}
                        onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
                    >
                        로그인
                    </button>
                    <button
                        className={`${styles.tab} ${mode === "signup" ? styles.tabActive : ""}`}
                        onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}
                    >
                        회원가입
                    </button>
                </div>

                {/* 메시지 */}
                {error && <div className={styles.error}>{error}</div>}
                {success && <div className={styles.success}>{success}</div>}

                {/* 폼 */}
                <form onSubmit={handleSubmit}>
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
                            autoComplete={mode === "login" ? "current-password" : "new-password"}
                        />
                    </div>

                    {mode === "signup" && (
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>미용실 이름</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={salonName}
                                onChange={(e) => setSalonName(e.target.value)}
                                placeholder="예: 헤어팩토리 강남점"
                                required
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={isLoading}
                    >
                        {isLoading && <span className={styles.spinner} />}
                        {mode === "login" ? "로그인" : "회원가입 & 미용실 생성"}
                    </button>
                </form>

                <div className={styles.footer}>
                    © 2026 O2LAB · AI Hair Studio
                </div>
            </div>
        </div>
    );
}

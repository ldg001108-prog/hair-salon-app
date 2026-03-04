/**
 * 슈퍼어드민 — 미용실 계정 등록 페이지
 * /admin/register 경로
 * 관리자 키 인증 후 미용실 계정(이메일/비밀번호)을 생성
 * 생성 완료 시 로그인 정보 + 고객 URL 표시
 */

"use client";

import { useState, useCallback } from "react";
import styles from "./page.module.css";

// 인기 테마 컬러 프리셋
const THEME_PRESETS = [
    { name: "퍼플", hex: "#7c50d0" },
    { name: "블루", hex: "#2965FB" },
    { name: "핑크", hex: "#c96b9e" },
    { name: "골드", hex: "#c4952a" },
    { name: "민트", hex: "#2aa198" },
    { name: "레드", hex: "#d04050" },
];

interface CreatedSalon {
    salonId: string;
    loginUrl: string;
    customerUrl: string;
    email: string;
    initialPassword: string;
}

export default function AdminRegisterPage() {
    const [adminKey, setAdminKey] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [salonName, setSalonName] = useState("");
    const [themeColor, setThemeColor] = useState("#7c50d0");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [createdSalon, setCreatedSalon] = useState<CreatedSalon | null>(null);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/admin/create-salon", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    adminKey,
                    email,
                    password,
                    salonName,
                    themeColor,
                }),
            });
            const data = await res.json();

            if (!data.success) {
                setError(data.error || "생성 실패");
                return;
            }

            setCreatedSalon({
                salonId: data.salonId,
                loginUrl: data.credentials.loginUrl,
                customerUrl: data.credentials.customerUrl,
                email: data.credentials.email,
                initialPassword: data.credentials.initialPassword,
            });
        } catch (err) {
            console.error("[Register] Error:", err);
            setError("서버 연결 실패. 잠시 후 다시 시도해주세요.");
        } finally {
            setIsLoading(false);
        }
    }, [adminKey, email, password, salonName, themeColor]);

    const handleCopy = useCallback((text: string) => {
        navigator.clipboard.writeText(text).catch(() => { });
    }, []);

    const handleReset = useCallback(() => {
        setCreatedSalon(null);
        setEmail("");
        setPassword("");
        setSalonName("");
        setThemeColor("#7c50d0");
    }, []);

    // 생성 완료 화면
    if (createdSalon) {
        const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
        const customerFullUrl = `${baseUrl}${createdSalon.customerUrl}`;
        const loginFullUrl = `${baseUrl}${createdSalon.loginUrl}`;

        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.successIcon}>🎉</div>
                    <h1 className={styles.title}>미용실 등록 완료!</h1>
                    <p className={styles.subtitle}>&ldquo;{salonName}&rdquo; 계정이 생성되었습니다</p>

                    <div className={styles.resultSection}>
                        <h3 className={styles.resultLabel}>🔑 로그인 정보</h3>
                        <div className={styles.resultRow}>
                            <span className={styles.resultKey}>이메일</span>
                            <span className={styles.resultValue}>{createdSalon.email}</span>
                            <button className={styles.copyBtn} onClick={() => handleCopy(createdSalon.email)}>복사</button>
                        </div>
                        <div className={styles.resultRow}>
                            <span className={styles.resultKey}>비밀번호</span>
                            <span className={styles.resultValue}>{createdSalon.initialPassword}</span>
                            <button className={styles.copyBtn} onClick={() => handleCopy(createdSalon.initialPassword)}>복사</button>
                        </div>
                    </div>

                    <div className={styles.resultSection}>
                        <h3 className={styles.resultLabel}>🔗 URL</h3>
                        <div className={styles.resultRow}>
                            <span className={styles.resultKey}>관리자</span>
                            <span className={styles.resultValue} style={{ fontSize: 11 }}>{loginFullUrl}</span>
                            <button className={styles.copyBtn} onClick={() => handleCopy(loginFullUrl)}>복사</button>
                        </div>
                        <div className={styles.resultRow}>
                            <span className={styles.resultKey}>고객</span>
                            <span className={styles.resultValue} style={{ fontSize: 11 }}>{customerFullUrl}</span>
                            <button className={styles.copyBtn} onClick={() => handleCopy(customerFullUrl)}>복사</button>
                        </div>
                    </div>

                    <div className={styles.resultWarning}>
                        ⚠️ 이 정보를 미용실 사장님에게 안전하게 전달해주세요.<br />
                        비밀번호는 이 페이지를 벗어나면 다시 확인할 수 없습니다.
                    </div>

                    <button className={styles.submitBtn} onClick={handleReset}>
                        새 미용실 등록
                    </button>
                </div>
            </div>
        );
    }

    // 등록 폼
    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.logo}>🏪</div>
                <h1 className={styles.title}>미용실 등록</h1>
                <p className={styles.subtitle}>슈퍼어드민 전용 — 새 미용실 계정 생성</p>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>관리자 키</label>
                        <input
                            type="password"
                            className={styles.input}
                            value={adminKey}
                            onChange={(e) => setAdminKey(e.target.value)}
                            placeholder="슈퍼어드민 비밀번호"
                            required
                        />
                    </div>

                    <hr className={styles.divider} />

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>미용실 이름</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={salonName}
                            onChange={(e) => setSalonName(e.target.value)}
                            placeholder="예: ES 헤어살롱"
                            required
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>사장님 이메일 (로그인 ID)</label>
                        <input
                            type="email"
                            className={styles.input}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="salon@example.com"
                            required
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>초기 비밀번호</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="6자 이상"
                            required
                            minLength={6}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>테마 컬러</label>
                        <div className={styles.themeRow}>
                            {THEME_PRESETS.map((preset) => (
                                <button
                                    key={preset.hex}
                                    type="button"
                                    className={`${styles.themeSwatch} ${themeColor === preset.hex ? styles.themeSwatchActive : ""}`}
                                    style={{ background: preset.hex }}
                                    onClick={() => setThemeColor(preset.hex)}
                                    title={preset.name}
                                />
                            ))}
                            <input
                                type="color"
                                className={styles.themeCustom}
                                value={themeColor}
                                onChange={(e) => setThemeColor(e.target.value)}
                                title="커스텀 컬러"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={isLoading}
                    >
                        {isLoading && <span className={styles.spinner} />}
                        미용실 등록
                    </button>
                </form>

                <div className={styles.footer}>
                    © 2026 AI Hair Studio
                </div>
            </div>
        </div>
    );
}

/**
 * PC 관리자 대시보드 — 넓은 화면용
 * /admin/[salonId] 경로로 접근
 * 세션 인증 (비밀번호 입력 후 sessionStorage 저장)
 */

"use client";

import { useState, useEffect, useCallback, use } from "react";
import styles from "./page.module.css";
import { useAppStore, type HistoryItem } from "@/store/useAppStore";

export default function AdminDashboard({
    params,
}: {
    params: Promise<{ salonId: string }>;
}) {
    const { salonId } = use(params);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [authError, setAuthError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [qrUrl, setQrUrl] = useState("");

    // 스토어에서 데이터 가져오기
    const apiStats = useAppStore((s) => s.apiStats);
    const errorLogs = useAppStore((s) => s.errorLogs);
    const history = useAppStore((s) => s.history);
    const resetApiStats = useAppStore((s) => s.resetApiStats);
    const clearErrorLogs = useAppStore((s) => s.clearErrorLogs);
    const clearHistory = useAppStore((s) => s.clearHistory);

    // 세션 인증 체크
    useEffect(() => {
        const auth = sessionStorage.getItem(`admin-auth-${salonId}`);
        if (auth === "true") {
            setIsAuthenticated(true);
        }
    }, [salonId]);

    // QR 코드 URL 설정
    useEffect(() => {
        if (isAuthenticated) {
            setQrUrl(`/api/qrcode?salonId=${salonId}`);
        }
    }, [isAuthenticated, salonId]);

    const handleLogin = useCallback(async () => {
        setIsLoading(true);
        setAuthError("");

        try {
            const res = await fetch("/api/admin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });
            const data = await res.json();

            if (data.success) {
                sessionStorage.setItem(`admin-auth-${salonId}`, "true");
                setIsAuthenticated(true);
            } else {
                setAuthError(data.error || "인증에 실패했습니다.");
            }
        } catch {
            setAuthError("서버 연결에 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, [password, salonId]);

    // 미인증 → 로그인 화면
    if (!isAuthenticated) {
        return (
            <div className={styles.loginPage}>
                <div className={styles.loginCard}>
                    <h1 className={styles.loginTitle}>🔐 관리자 로그인</h1>
                    <p className={styles.loginSubtitle}>AI Hair Studio — {salonId}</p>
                    <div className={styles.loginForm}>
                        <input
                            type="password"
                            placeholder="관리자 비밀번호"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                            className={styles.loginInput}
                            autoFocus
                        />
                        <button
                            onClick={handleLogin}
                            disabled={isLoading || !password}
                            className={styles.loginBtn}
                        >
                            {isLoading ? "확인 중..." : "로그인"}
                        </button>
                    </div>
                    {authError && <p className={styles.loginError}>{authError}</p>}
                </div>
            </div>
        );
    }

    // 통계 카드 데이터
    const successRate = apiStats.totalCalls > 0
        ? Math.round((apiStats.successCount / apiStats.totalCalls) * 100)
        : 0;

    return (
        <div className={styles.dashboard}>
            {/* 헤더 */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.headerTitle}>📊 AI Hair Studio</h1>
                    <span className={styles.headerSalonId}>Salon: {salonId}</span>
                </div>
                <div className={styles.headerRight}>
                    <a
                        href={`/salon/${salonId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.headerLink}
                    >
                        🔗 고객 페이지 열기
                    </a>
                    <button
                        className={styles.logoutBtn}
                        onClick={() => {
                            sessionStorage.removeItem(`admin-auth-${salonId}`);
                            setIsAuthenticated(false);
                        }}
                    >
                        로그아웃
                    </button>
                </div>
            </header>

            {/* 대시보드 그리드 */}
            <div className={styles.grid}>
                {/* 통계 카드 */}
                <section className={styles.card}>
                    <h2 className={styles.cardTitle}>📈 API 통계</h2>
                    <div className={styles.statsGrid}>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{apiStats.todayCalls}</span>
                            <span className={styles.statLabel}>오늘 합성</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{apiStats.totalCalls}</span>
                            <span className={styles.statLabel}>전체 합성</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={`${styles.statValue} ${styles.statSuccess}`}>{successRate}%</span>
                            <span className={styles.statLabel}>성공률</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{apiStats.failCount}</span>
                            <span className={styles.statLabel}>실패 횟수</span>
                        </div>
                    </div>
                    <button className={styles.resetBtn} onClick={() => { resetApiStats(); }}>
                        🔄 통계 초기화
                    </button>
                </section>

                {/* QR 코드 */}
                <section className={styles.card}>
                    <h2 className={styles.cardTitle}>📱 QR 코드</h2>
                    <div className={styles.qrSection}>
                        {qrUrl && (
                            <img
                                src={qrUrl}
                                alt={`QR Code for ${salonId}`}
                                className={styles.qrImage}
                            />
                        )}
                        <p className={styles.qrUrl}>
                            {typeof window !== "undefined"
                                ? `${window.location.origin}/salon/${salonId}`
                                : `/salon/${salonId}`}
                        </p>
                        <a
                            href={qrUrl}
                            download={`qr-${salonId}.png`}
                            className={styles.downloadBtn}
                        >
                            ⬇️ QR 다운로드
                        </a>
                    </div>
                </section>

                {/* 합성 히스토리 */}
                <section className={`${styles.card} ${styles.wideCard}`}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>📋 합성 히스토리</h2>
                        <button className={styles.clearBtn} onClick={clearHistory}>
                            🗑️ 전체 삭제
                        </button>
                    </div>
                    <div className={styles.tableWrap}>
                        {history.length > 0 ? (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>시간</th>
                                        <th>스타일</th>
                                        <th>컬러</th>
                                        <th>상태</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((item: HistoryItem) => (
                                        <tr key={item.id}>
                                            <td>{new Date(item.timestamp).toLocaleString("ko-KR")}</td>
                                            <td>{item.styleName}</td>
                                            <td>
                                                {item.colorHex ? (
                                                    <span className={styles.colorDot} style={{ backgroundColor: item.colorHex }} />
                                                ) : "—"}
                                            </td>
                                            <td>
                                                <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                                                    완료
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className={styles.emptyText}>아직 합성 기록이 없습니다.</p>
                        )}
                    </div>
                </section>

                {/* 에러 로그 */}
                <section className={`${styles.card} ${styles.wideCard}`}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>⚠️ 에러 로그</h2>
                        <button className={styles.clearBtn} onClick={clearErrorLogs}>
                            🗑️ 전체 삭제
                        </button>
                    </div>
                    <div className={styles.tableWrap}>
                        {errorLogs.length > 0 ? (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>시간</th>
                                        <th>에러 메시지</th>
                                        <th>컨텍스트</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {errorLogs.map((log) => (
                                        <tr key={log.id}>
                                            <td>{new Date(log.timestamp).toLocaleString("ko-KR")}</td>
                                            <td className={styles.errorMsg}>{log.message}</td>
                                            <td>{log.context || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className={styles.emptyText}>에러 로그가 없습니다. 👍</p>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

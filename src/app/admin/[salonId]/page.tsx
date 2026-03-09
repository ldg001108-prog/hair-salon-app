/**
 * PC 관리자 대시보드 — 넓은 화면용
 * /admin/[salonId] 경로로 접근
 * 세션 인증 (비밀번호 입력 후 sessionStorage 저장)
 * 탭: 통계/QR | 예약 관리 | 브랜딩 설정 | 구독 플랜
 */

"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { useAppStore, type HistoryItem } from "@/store/useAppStore";

// 예약 타입
interface Reservation {
    id: string;
    customer_name: string;
    customer_phone: string;
    style_name?: string;
    color_hex?: string;
    reservation_date: string;
    reservation_time: string;
    status: "pending" | "confirmed" | "cancelled" | "completed";
    memo?: string;
    created_at: string;
}

// 구독 플랜 정의
const PLANS = [
    {
        id: "free",
        name: "Free",
        price: "₩0",
        period: "/월",
        features: ["일 10회 합성", "기본 스타일 10개", "QR 코드"],
        color: "#8a7a9a",
    },
    {
        id: "basic",
        name: "Basic",
        price: "₩29,900",
        period: "/월",
        features: ["일 50회 합성", "전체 스타일", "QR 코드", "예약 관리", "브랜딩 커스텀"],
        color: "#8050b0",
        popular: true,
    },
    {
        id: "premium",
        name: "Premium",
        price: "₩59,900",
        period: "/월",
        features: ["무제한 합성", "전체 스타일", "QR 코드", "예약 관리", "브랜딩 커스텀", "우선 지원", "분석 리포트"],
        color: "#c080e0",
    },
];

export default function AdminDashboard({
    params,
}: {
    params: Promise<{ salonId: string }>;
}) {
    const { salonId } = use(params);
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authChecking, setAuthChecking] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [qrUrl, setQrUrl] = useState("");

    // 탭 상태
    const [activeTab, setActiveTab] = useState<"overview" | "reservations" | "branding" | "plans">("overview");

    // 예약 관련
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [reservationFilter, setReservationFilter] = useState<string>("all");
    const [reservationsLoading, setReservationsLoading] = useState(false);

    // 브랜딩 설정
    const [brandName, setBrandName] = useState("");
    const [brandThemeColor, setBrandThemeColor] = useState("#2563EB");
    const [brandLogoUrl, setBrandLogoUrl] = useState("");
    const [brandSaving, setBrandSaving] = useState(false);
    const [brandSaved, setBrandSaved] = useState(false);

    // 구독 플랜
    const [currentPlan, setCurrentPlan] = useState("free");

    // 서버 API 통계 (Supabase 기반 — 새로고침해도 유지)
    const [serverStats, setServerStats] = useState({ todayCalls: 0, totalCalls: 0, successCount: 0, failCount: 0, successRate: 0 });

    // 스토어에서 데이터 가져오기 (히스토리/에러 로그는 로컬 유지)
    const errorLogs = useAppStore((s) => s.errorLogs);
    const history = useAppStore((s) => s.history);
    const clearErrorLogs = useAppStore((s) => s.clearErrorLogs);
    const clearHistory = useAppStore((s) => s.clearHistory);

    // 세션 인증 체크 (localStorage 우선)
    useEffect(() => {
        const checkAuth = async () => {
            // 1. sessionStorage 체크 (기존 호환)
            const auth = sessionStorage.getItem(`admin-auth-${salonId}`);
            if (auth === "true") {
                setIsAuthenticated(true);
                setAuthChecking(false);
                return;
            }

            // 2. localStorage 인증 플래그 체크 (로그인 페이지에서 설정)
            const isAuth = localStorage.getItem("oc-authenticated");
            const accessToken = localStorage.getItem("oc-access-token");
            if (isAuth === "true" && accessToken) {
                // 로그인 된 상태 → 바로 인증 통과
                sessionStorage.setItem(`admin-auth-${salonId}`, "true");
                setIsAuthenticated(true);
                setAuthChecking(false);
                return;
            }

            // 3. 인증 정보 없음 → 로그인 페이지
            router.push("/admin/login");
        };
        checkAuth();
    }, [salonId, router]);

    // QR 코드 URL 설정 + 5분마다 자동 갱신
    const [qrRefreshKey, setQrRefreshKey] = useState(0);
    const [qrCountdown, setQrCountdown] = useState(300); // 5분 = 300초

    useEffect(() => {
        if (!isAuthenticated) return;
        setQrUrl(`/api/qrcode?salonId=${salonId}&t=${Date.now()}`);
        setQrCountdown(300);

        // 5분마다 QR 갱신
        const refreshInterval = setInterval(() => {
            setQrRefreshKey((k) => k + 1);
            setQrUrl(`/api/qrcode?salonId=${salonId}&t=${Date.now()}`);
            setQrCountdown(300);
        }, 5 * 60 * 1000);

        // 1초마다 카운트다운
        const countdownInterval = setInterval(() => {
            setQrCountdown((c) => (c > 0 ? c - 1 : 0));
        }, 1000);

        return () => {
            clearInterval(refreshInterval);
            clearInterval(countdownInterval);
        };
    }, [isAuthenticated, salonId, qrRefreshKey]);

    // 인증 후 브랜딩 정보 로드
    useEffect(() => {
        if (!isAuthenticated) return;

        fetch(`/api/salon/${salonId}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.success && data.salon) {
                    setBrandName(data.salon.name || "");
                    setBrandThemeColor(data.salon.themeColor || "#2563EB");
                    setBrandLogoUrl(data.salon.logoUrl || "");
                }
            })
            .catch(() => { });

        fetch(`/api/subscriptions?salonId=${salonId}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.subscription?.plan) {
                    setCurrentPlan(data.subscription.plan);
                }
            })
            .catch(() => { });
    }, [isAuthenticated, salonId]);

    // 서버 API 통계 로드
    useEffect(() => {
        if (!isAuthenticated) return;
        const loadStats = async () => {
            try {
                const res = await fetch(`/api/dev/stats?period=day`);
                const data = await res.json();
                if (data.success) {
                    const mySalon = data.perSalon?.[salonId];
                    setServerStats({
                        todayCalls: mySalon?.total ?? 0,
                        totalCalls: mySalon?.total ?? 0,
                        successCount: mySalon?.success ?? 0,
                        failCount: mySalon?.fail ?? 0,
                        successRate: mySalon
                            ? (mySalon.total > 0 ? Math.round((mySalon.success / mySalon.total) * 100) : 0)
                            : 0,
                    });
                }
            } catch {
                // 서버 통계 로드 실패 시 0으로 유지
            }
        };
        loadStats();
    }, [isAuthenticated, salonId]);

    // 예약 목록 로드
    const loadReservations = useCallback(async () => {
        setReservationsLoading(true);
        try {
            const url = `/api/admin/reservations?salonId=${salonId}${reservationFilter !== "all" ? `&status=${reservationFilter}` : ""}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setReservations(data.reservations || []);
            }
        } catch {
            // 에러 시 빈 배열 유지
        } finally {
            setReservationsLoading(false);
        }
    }, [salonId, reservationFilter]);

    useEffect(() => {
        if (isAuthenticated && activeTab === "reservations") {
            loadReservations();
        }
    }, [isAuthenticated, activeTab, loadReservations]);

    const handleLogout = useCallback(() => {
        sessionStorage.removeItem(`admin-auth-${salonId}`);
        router.push("/admin/login");
    }, [salonId, router]);

    // 예약 상태 변경
    const handleReservationStatus = useCallback(async (reservationId: string, status: string) => {
        try {
            const res = await fetch("/api/admin/reservations", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reservationId, status }),
            });
            const data = await res.json();
            if (data.success) {
                loadReservations();
            }
        } catch {
            // 에러 무시
        }
    }, [loadReservations]);

    // 브랜딩 저장
    const handleSaveBranding = useCallback(async () => {
        setBrandSaving(true);
        setBrandSaved(false);
        try {
            const res = await fetch("/api/admin", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    salonId,
                    name: brandName,
                    themeColor: brandThemeColor,
                    logoUrl: brandLogoUrl,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setBrandSaved(true);
                setTimeout(() => setBrandSaved(false), 3000);
            }
        } catch {
            // 에러 처리
        } finally {
            setBrandSaving(false);
        }
    }, [salonId, brandName, brandThemeColor, brandLogoUrl]);

    // URL 복사 (토큰 포함)
    const handleCopyUrl = useCallback(async () => {
        try {
            // QR API에서 토큰 포함 URL 생성
            const res = await fetch(`/api/salon/generate-url?salonId=${encodeURIComponent(salonId)}`);
            const data = await res.json();
            if (data.url) {
                await navigator.clipboard.writeText(data.url);
                alert("토큰 포함 URL이 복사되었습니다! (60분 유효)");
            } else {
                // fallback: 토큰 없이 복사
                const fallback = `${window.location.origin}/salon/${salonId}`;
                await navigator.clipboard.writeText(fallback);
                alert("URL 복사됨 (토큰 없이 복사 — QR 스캔 필요)");
            }
        } catch {
            const fallback = `${window.location.origin}/salon/${salonId}`;
            navigator.clipboard.writeText(fallback).then(() => alert("URL 복사됨"));
        }
    }, [salonId]);

    // 인증 체크 중 로딩
    if (authChecking || !isAuthenticated) {
        return (
            <div className={styles.loginPage}>
                <div className={styles.loginCard}>
                    <h1 className={styles.loginTitle}>🔐 인증 확인 중...</h1>
                    <p className={styles.loginSubtitle}>AI Hair Studio</p>
                </div>
            </div>
        );
    }

    // 통계 카드 데이터 (서버 기반)
    const successRate = serverStats.successRate;

    const statusLabel: Record<string, string> = {
        pending: "대기",
        confirmed: "확인",
        cancelled: "취소",
        completed: "완료",
    };

    const statusBadge: Record<string, string> = {
        pending: styles.badgePending,
        confirmed: styles.badgeSuccess,
        cancelled: styles.badgeFail,
        completed: styles.badgeCompleted,
    };

    return (
        <div className={styles.dashboard}>
            {/* 헤더 */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.headerTitle}>📊 AI Hair Studio</h1>
                    <span className={styles.headerSalonId}>Salon: {salonId}</span>
                </div>
                <div className={styles.headerRight}>
                    <button className={styles.headerLink} onClick={handleCopyUrl}>
                        📋 고객 URL 복사
                    </button>
                    <a href={`/salon/${salonId}`} target="_blank" rel="noopener noreferrer" className={styles.headerLink}>
                        🔗 고객 페이지 열기
                    </a>
                    <button className={styles.logoutBtn} onClick={handleLogout}>
                        로그아웃
                    </button>
                </div>
            </header>

            {/* 탭 네비게이션 */}
            <div className={styles.tabNav}>
                {([
                    { id: "overview", label: "📈 통계 / QR" },
                    { id: "reservations", label: "📅 예약 관리" },
                    { id: "branding", label: "🎨 브랜딩" },
                    { id: "plans", label: "💳 구독 플랜" },
                ] as const).map((tab) => (
                    <button key={tab.id} className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ""}`} onClick={() => setActiveTab(tab.id)}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ===================== 통계/QR 탭 ===================== */}
            {activeTab === "overview" && (
                <div className={styles.grid}>
                    <section className={styles.card}>
                        <h2 className={styles.cardTitle}>📈 API 통계</h2>
                        <div className={styles.statsGrid}>
                            <div className={styles.statItem}><span className={styles.statValue}>{serverStats.todayCalls}</span><span className={styles.statLabel}>오늘 합성</span></div>
                            <div className={styles.statItem}><span className={styles.statValue}>{serverStats.totalCalls}</span><span className={styles.statLabel}>전체 합성</span></div>
                            <div className={styles.statItem}><span className={`${styles.statValue} ${styles.statSuccess}`}>{successRate}%</span><span className={styles.statLabel}>성공률</span></div>
                            <div className={styles.statItem}><span className={styles.statValue}>{serverStats.failCount}</span><span className={styles.statLabel}>실패 횟수</span></div>
                        </div>
                    </section>

                    <section className={styles.card}>
                        <h2 className={styles.cardTitle}>📱 QR 코드</h2>
                        <div className={styles.qrSection}>
                            {qrUrl && <img src={qrUrl} alt={`QR Code for ${salonId}`} className={styles.qrImage} />}
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '8px 0 4px' }}>
                                ⏱ 다음 갱신까지: <strong style={{ color: qrCountdown <= 60 ? '#e74c3c' : 'inherit' }}>
                                    {Math.floor(qrCountdown / 60)}:{String(qrCountdown % 60).padStart(2, '0')}
                                </strong>
                            </p>
                            <button
                                className={styles.downloadBtn}
                                onClick={() => {
                                    setQrRefreshKey((k) => k + 1);
                                    setQrUrl(`/api/qrcode?salonId=${salonId}&t=${Date.now()}`);
                                    setQrCountdown(300);
                                }}
                                style={{ marginBottom: '8px' }}
                            >
                                🔄 QR 즉시 갱신
                            </button>
                            <p style={{ fontSize: '11px', color: '#999', margin: '4px 0 12px' }}>
                                QR 코드는 5분마다 자동 갱신됩니다. 스캔 후 10분간 사용 가능합니다.
                            </p>
                            <p className={styles.qrUrl}>{typeof window !== "undefined" ? `${window.location.origin}/salon/${salonId}` : `/salon/${salonId}`}</p>
                        </div>
                    </section>

                    <section className={`${styles.card} ${styles.wideCard}`}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>📋 합성 히스토리</h2>
                            <button className={styles.clearBtn} onClick={clearHistory}>🗑️ 전체 삭제</button>
                        </div>
                        <div className={styles.tableWrap}>
                            {history.length > 0 ? (
                                <table className={styles.table}>
                                    <thead><tr><th>시간</th><th>스타일</th><th>컬러</th><th>상태</th></tr></thead>
                                    <tbody>
                                        {history.map((item: HistoryItem) => (
                                            <tr key={item.id}>
                                                <td>{new Date(item.timestamp).toLocaleString("ko-KR")}</td>
                                                <td>{item.styleName}</td>
                                                <td>{item.colorHex ? <span className={styles.colorDot} style={{ backgroundColor: item.colorHex }} /> : "—"}</td>
                                                <td><span className={`${styles.badge} ${styles.badgeSuccess}`}>완료</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (<p className={styles.emptyText}>아직 합성 기록이 없습니다.</p>)}
                        </div>
                    </section>

                    <section className={`${styles.card} ${styles.wideCard}`}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>⚠️ 에러 로그</h2>
                            <button className={styles.clearBtn} onClick={clearErrorLogs}>🗑️ 전체 삭제</button>
                        </div>
                        <div className={styles.tableWrap}>
                            {errorLogs.length > 0 ? (
                                <table className={styles.table}>
                                    <thead><tr><th>시간</th><th>에러 메시지</th><th>컨텍스트</th></tr></thead>
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
                            ) : (<p className={styles.emptyText}>에러 로그가 없습니다. 👍</p>)}
                        </div>
                    </section>
                </div>
            )}

            {/* ===================== 예약 관리 탭 ===================== */}
            {activeTab === "reservations" && (
                <div className={styles.grid}>
                    <section className={`${styles.card} ${styles.wideCard}`}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>📅 예약 목록</h2>
                            <div className={styles.filterGroup}>
                                {["all", "pending", "confirmed", "completed", "cancelled"].map((f) => (
                                    <button key={f} className={`${styles.filterBtn} ${reservationFilter === f ? styles.filterBtnActive : ""}`} onClick={() => setReservationFilter(f)}>
                                        {f === "all" ? "전체" : statusLabel[f]}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className={styles.tableWrap}>
                            {reservationsLoading ? (
                                <p className={styles.emptyText}>로딩 중...</p>
                            ) : reservations.length > 0 ? (
                                <table className={styles.table}>
                                    <thead><tr><th>예약일</th><th>시간</th><th>고객명</th><th>연락처</th><th>스타일</th><th>컬러</th><th>상태</th><th>액션</th></tr></thead>
                                    <tbody>
                                        {reservations.map((r) => (
                                            <tr key={r.id}>
                                                <td>{r.reservation_date}</td>
                                                <td>{r.reservation_time}</td>
                                                <td>{r.customer_name}</td>
                                                <td>{r.customer_phone}</td>
                                                <td>{r.style_name || "—"}</td>
                                                <td>{r.color_hex ? <span className={styles.colorDot} style={{ backgroundColor: r.color_hex }} /> : "—"}</td>
                                                <td><span className={`${styles.badge} ${statusBadge[r.status] || ""}`}>{statusLabel[r.status] || r.status}</span></td>
                                                <td>
                                                    <div className={styles.actionGroup}>
                                                        {r.status === "pending" && (
                                                            <>
                                                                <button className={`${styles.miniBtn} ${styles.miniBtnConfirm}`} onClick={() => handleReservationStatus(r.id, "confirmed")}>확인</button>
                                                                <button className={`${styles.miniBtn} ${styles.miniBtnCancel}`} onClick={() => handleReservationStatus(r.id, "cancelled")}>취소</button>
                                                            </>
                                                        )}
                                                        {r.status === "confirmed" && (
                                                            <button className={`${styles.miniBtn} ${styles.miniBtnComplete}`} onClick={() => handleReservationStatus(r.id, "completed")}>완료</button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className={styles.emptyText}>
                                    {reservationFilter === "all" ? "아직 예약이 없습니다." : `${statusLabel[reservationFilter]} 상태의 예약이 없습니다.`}
                                </p>
                            )}
                        </div>
                    </section>
                </div>
            )}

            {/* ===================== 브랜딩 설정 탭 ===================== */}
            {activeTab === "branding" && (
                <div className={styles.grid}>
                    <section className={`${styles.card} ${styles.midCard}`}>
                        <h2 className={styles.cardTitle}>🎨 미용실 브랜딩 설정</h2>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>미용실 이름</label>
                            <input type="text" className={styles.formInput} value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="미용실 이름" />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>테마 컬러</label>
                            <div className={styles.colorInputRow}>
                                <input type="color" className={styles.colorInput} value={brandThemeColor} onChange={(e) => setBrandThemeColor(e.target.value)} />
                                <input type="text" className={styles.formInput} value={brandThemeColor} onChange={(e) => setBrandThemeColor(e.target.value)} placeholder="#2563EB" style={{ flex: 1 }} />
                            </div>
                            <div className={styles.colorPreviewBox} style={{ background: brandThemeColor }}>미리보기</div>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.formLabel}>로고 URL (선택)</label>
                            <input type="text" className={styles.formInput} value={brandLogoUrl} onChange={(e) => setBrandLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" />
                        </div>
                        <button className={styles.saveBtn} onClick={handleSaveBranding} disabled={brandSaving}>
                            {brandSaving ? "저장 중..." : brandSaved ? "✅ 저장됨" : "💾 브랜딩 저장"}
                        </button>
                    </section>
                </div>
            )}

            {/* ===================== 구독 플랜 탭 ===================== */}
            {activeTab === "plans" && (
                <div className={styles.grid}>
                    <section className={`${styles.card} ${styles.wideCard}`}>
                        <h2 className={styles.cardTitle}>💳 구독 플랜</h2>
                        <p className={styles.planSubtitle}>현재 플랜: <strong>{PLANS.find((p) => p.id === currentPlan)?.name || "Free"}</strong></p>
                        <div className={styles.planGrid}>
                            {PLANS.map((plan) => (
                                <div key={plan.id} className={`${styles.planCard} ${currentPlan === plan.id ? styles.planCardActive : ""} ${plan.popular ? styles.planCardPopular : ""}`} style={{ borderColor: currentPlan === plan.id ? plan.color : undefined }}>
                                    {plan.popular && <div className={styles.planPopular} style={{ background: plan.color }}>인기</div>}
                                    <h3 className={styles.planName} style={{ color: plan.color }}>{plan.name}</h3>
                                    <div className={styles.planPrice}>
                                        <span className={styles.planAmount}>{plan.price}</span>
                                        <span className={styles.planPeriod}>{plan.period}</span>
                                    </div>
                                    <ul className={styles.planFeatures}>
                                        {plan.features.map((f, i) => (<li key={i}>✓ {f}</li>))}
                                    </ul>
                                    <button
                                        className={`${styles.planBtn} ${currentPlan === plan.id ? styles.planBtnCurrent : ""}`}
                                        disabled={currentPlan === plan.id}
                                        style={{ background: currentPlan === plan.id ? "#e0d4ec" : plan.color, color: currentPlan === plan.id ? "#8a7a9a" : "#fff" }}
                                        onClick={() => { alert("결제 시스템은 사업자등록 + PG사 연동 후 이용 가능합니다."); }}
                                    >
                                        {currentPlan === plan.id ? "현재 플랜" : "선택하기"}
                                    </button>
                                </div>
                            ))}
                        </div>
                        <p className={styles.planNote}>※ 결제 기능은 사업자등록 + PG사 연동 후 활성화됩니다.</p>
                    </section>
                </div>
            )}
        </div>
    );
}

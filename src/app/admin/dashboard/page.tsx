/**
 * 개발자 대시보드 — /admin/dashboard
 * 탭: 전체 요약 | 살롱 관리 | QR 코드 | API 통계
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { THEME_PRESETS, DEFAULT_THEME_ID } from "@/lib/themePresets";
import styles from "./page.module.css";

interface Salon {
    id: string;
    name: string;
    owner_id: string;
    ownerEmail: string;
    plan: string;
    daily_limit: number;
    today_used: number;
    is_active: boolean;
    created_at: string;
    theme_color?: string;

}

interface StatsData {
    totalCalls: number;
    successCount: number;
    failCount: number;
    successRate: number;
    perSalon: Record<string, { total: number; success: number; fail: number }>;
    needsSetup?: boolean;
    message?: string;
}

export default function DevDashboard() {
    const router = useRouter();
    const [isAuth, setIsAuth] = useState(false);
    const [checking, setChecking] = useState(true);
    const [activeTab, setActiveTab] = useState<"overview" | "salons" | "qr" | "stats">("overview");

    // 살롱 데이터
    const [salons, setSalons] = useState<Salon[]>([]);
    const [salonsLoading, setSalonsLoading] = useState(false);

    // 통계 데이터
    const [stats, setStats] = useState<StatsData | null>(null);
    const [statsPeriod, setStatsPeriod] = useState<"day" | "week" | "month">("day");
    const [statsLoading, setStatsLoading] = useState(false);

    // QR 코드는 갱신하지 않음 (영구 고정)

    // 새 살롱 등록 모달
    const [showModal, setShowModal] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newSalonName, setNewSalonName] = useState("");
    const [newTheme, setNewTheme] = useState(DEFAULT_THEME_ID);
    const [creating, setCreating] = useState(false);
    const [createMsg, setCreateMsg] = useState("");

    // 인증 체크
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem("dev-admin-token");
            if (!token) {
                router.push("/admin/login");
                return;
            }

            try {
                const res = await fetch("/api/dev/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });
                const data = await res.json();
                if (!data.valid) {
                    localStorage.removeItem("dev-admin-token");
                    router.push("/admin/login");
                    return;
                }
                setIsAuth(true);
            } catch {
                router.push("/admin/login");
            } finally {
                setChecking(false);
            }
        };
        checkAuth();
    }, [router]);

    // 살롱 목록 로드
    const loadSalons = useCallback(async () => {
        setSalonsLoading(true);
        try {
            const res = await fetch("/api/dev/salons");
            const data = await res.json();
            if (data.success) setSalons(data.salons || []);
        } catch {
            // 에러 무시
        } finally {
            setSalonsLoading(false);
        }
    }, []);

    // 통계 로드
    const loadStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const res = await fetch(`/api/dev/stats?period=${statsPeriod}`);
            const data = await res.json();
            if (data.success) setStats(data);
        } catch {
            // 에러 무시
        } finally {
            setStatsLoading(false);
        }
    }, [statsPeriod]);

    // 탭 변경 시 데이터 로드
    useEffect(() => {
        if (!isAuth) return;
        if (activeTab === "overview" || activeTab === "salons" || activeTab === "qr") {
            loadSalons();
        }
        if (activeTab === "overview" || activeTab === "stats") {
            loadStats();
        }
    }, [isAuth, activeTab, loadSalons, loadStats]);

    // 새 살롱 생성
    const handleCreateSalon = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setCreateMsg("");
        try {
            const res = await fetch("/api/dev/salons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: newEmail,
                    password: newPassword,
                    salonName: newSalonName,
                    themeColor: newTheme,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setCreateMsg(`✅ ${data.message} (ID: ${data.salonId})`);
                setNewEmail("");
                setNewPassword("");
                setNewSalonName("");
                setNewTheme(DEFAULT_THEME_ID);
                loadSalons();
                setTimeout(() => setShowModal(false), 2000);
            } else {
                setCreateMsg(`❌ ${data.error}`);
            }
        } catch {
            setCreateMsg("❌ 서버 연결 실패");
        } finally {
            setCreating(false);
        }
    };

    // 살롱 삭제
    const handleDeleteSalon = async (salonId: string, salonName: string) => {
        if (!confirm(`"${salonName}" 미용실을 삭제하시겠습니까?\n\n⚠️ 관련 데이터가 모두 삭제됩니다.`)) return;
        try {
            const res = await fetch("/api/dev/salons", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ salonId }),
            });
            const data = await res.json();
            if (data.success) {
                alert("✅ 삭제되었습니다.");
                loadSalons();
            } else {
                alert(`❌ 삭제 실패: ${data.error}`);
            }
        } catch {
            alert("❌ 서버 연결 실패");
        }
    };

    // 살롱 미리보기 (토큰 포함 URL로 새 탭 열기)
    const openSalonPreview = async (salonId: string) => {
        try {
            const res = await fetch(`/api/salon/generate-url?salonId=${encodeURIComponent(salonId)}`);
            const data = await res.json();
            if (data.url) {
                window.open(data.url, "_blank", "noopener,noreferrer");
                return;
            }
        } catch {
            // fallback below
        }
        // fallback: 토큰 없이 열기
        window.open(`/salon/${salonId}`, "_blank", "noopener,noreferrer");
    };

    // 로그아웃
    const handleLogout = () => {
        localStorage.removeItem("dev-admin-token");
        router.push("/admin/login");
    };

    if (checking || !isAuth) {
        return (
            <div className={styles.loading}>
                <div className={styles.loadingSpinner} />
                <p>인증 확인 중...</p>
            </div>
        );
    }

    const periodLabel: Record<string, string> = { day: "오늘", week: "이번 주", month: "이번 달" };

    return (
        <div className={`${styles.dashboard} adminLayout`}>
            {/* 헤더 */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <span className={styles.headerIcon}>⚙️</span>
                    <div>
                        <h1 className={styles.headerTitle}>Developer Console</h1>
                        <span className={styles.headerSub}>AI Hair Studio</span>
                    </div>
                </div>
                <button className={styles.logoutBtn} onClick={handleLogout}>로그아웃</button>
            </header>

            {/* 탭 네비게이션 */}
            <nav className={styles.tabNav}>
                {([
                    { id: "overview", label: "📊 전체 요약", icon: "📊" },
                    { id: "salons", label: "🏪 살롱 관리", icon: "🏪" },
                    { id: "qr", label: "📱 QR 코드", icon: "📱" },
                    { id: "stats", label: "📈 API 통계", icon: "📈" },
                ] as const).map((tab) => (
                    <button
                        key={tab.id}
                        className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabActive : ""}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            {/* ===================== 전체 요약 탭 ===================== */}
            {activeTab === "overview" && (
                <div className={styles.content}>
                    <div className={styles.statCards}>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>🏪</div>
                            <div className={styles.statValue}>{salons.length}</div>
                            <div className={styles.statLabel}>등록된 살롱</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>📞</div>
                            <div className={styles.statValue}>{stats?.totalCalls ?? "—"}</div>
                            <div className={styles.statLabel}>오늘 API 호출</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>✅</div>
                            <div className={`${styles.statValue} ${styles.success}`}>{stats?.successRate ?? "—"}%</div>
                            <div className={styles.statLabel}>성공률</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>❌</div>
                            <div className={`${styles.statValue} ${styles.fail}`}>{stats?.failCount ?? 0}</div>
                            <div className={styles.statLabel}>실패 횟수</div>
                        </div>
                    </div>

                    {stats?.needsSetup && (
                        <div className={styles.notice}>
                            ⚠️ {stats.message}
                        </div>
                    )}

                    {/* 살롱 퀵 리스트 */}
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>등록된 살롱 목록</h2>
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr><th>미용실 이름</th><th>이메일</th><th>플랜</th><th>서비스 URL</th><th>가입일</th></tr>
                                </thead>
                                <tbody>
                                    {salons.length > 0 ? salons.map((s) => (
                                        <tr key={s.id}>
                                            <td className={styles.bold}>{s.name || s.id}</td>
                                            <td>{s.ownerEmail}</td>
                                            <td><span className={styles.badge}>{s.plan || "free"}</span></td>
                                            <td>
                                                <button type="button" onClick={() => openSalonPreview(s.id)} className={styles.link} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}>
                                                    /salon/{s.id}
                                                </button>
                                            </td>
                                            <td>{new Date(s.created_at).toLocaleDateString("ko-KR")}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={5} className={styles.empty}>등록된 살롱이 없습니다</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ===================== 살롱 관리 탭 ===================== */}
            {activeTab === "salons" && (
                <div className={styles.content}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>살롱 관리</h2>
                        <button className={styles.primaryBtn} onClick={() => setShowModal(true)}>
                            ➕ 새 미용실 등록
                        </button>
                    </div>

                    {salonsLoading ? (
                        <div className={styles.loadingInline}><div className={styles.loadingSpinner} /> 로딩 중...</div>
                    ) : (
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>미용실 이름</th>
                                        <th>아이디 (사장님 계정)</th>
                                        <th>플랜</th>
                                        <th>오늘 사용</th>
                                        <th>상태</th>
                                        <th>서비스 URL</th>
                                        <th>가입일</th>
                                        <th>관리</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salons.map((s) => (
                                        <tr key={s.id}>
                                            <td className={styles.bold}>
                                                {(() => { const t = THEME_PRESETS.find(t => t.id === s.theme_color); return t ? <span className={styles.colorDot} style={{ background: `linear-gradient(135deg, ${t.gradientStart}, ${t.gradientEnd})` }} /> : null; })()}
                                                {s.name || s.id}
                                            </td>
                                            <td>{s.ownerEmail}</td>
                                            <td><span className={styles.badge}>{s.plan || "free"}</span></td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <div style={{ width: 40, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                                                        <div style={{ width: `${Math.min(100, (s.today_used / s.daily_limit) * 100)}%`, height: '100%', background: s.today_used >= s.daily_limit ? '#ef4444' : s.today_used >= s.daily_limit * 0.8 ? '#f59e0b' : '#22c55e', borderRadius: 3, transition: 'width 0.3s' }} />
                                                    </div>
                                                    <span style={{ fontSize: 12, color: s.today_used >= s.daily_limit ? '#ef4444' : undefined }}>{s.today_used}/{s.daily_limit}</span>
                                                </div>
                                            </td>
                                            <td><span className={`${styles.statusDot} ${s.is_active ? styles.active : styles.inactive}`} />{s.is_active ? "활성" : "비활성"}</td>
                                            <td>
                                                <button type="button" onClick={() => openSalonPreview(s.id)} className={styles.link} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}>
                                                    /salon/{s.id}
                                                </button>
                                            </td>
                                            <td>{new Date(s.created_at).toLocaleDateString("ko-KR")}</td>
                                            <td><button className={styles.dangerBtnSm} onClick={() => handleDeleteSalon(s.id, s.name || s.id)}>🗑️</button></td>
                                        </tr>
                                    ))}
                                    {salons.length === 0 && (
                                        <tr><td colSpan={8} className={styles.empty}>등록된 살롱이 없습니다. &quot;새 미용실 등록&quot; 버튼을 눌러주세요.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* 새 살롱 등록 모달 */}
                    {showModal && (
                        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                                <h3 className={styles.modalTitle}>🏪 새 미용실 등록</h3>
                                <form onSubmit={handleCreateSalon}>
                                    <div className={styles.formGroup}>
                                        <label>사장님 아이디</label>
                                        <input type="text" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="로그인에 사용할 아이디" required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>비밀번호 (6자 이상)</label>
                                        <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="초기 비밀번호" required minLength={6} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>미용실 이름</label>
                                        <input type="text" value={newSalonName} onChange={(e) => setNewSalonName(e.target.value)} placeholder="예: 뷰티스타 미용실" required />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>테마 색상 선택</label>
                                        <div className={styles.themeGrid}>
                                            {THEME_PRESETS.map((t) => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    className={`${styles.themeOption} ${newTheme === t.id ? styles.themeSelected : ""}`}
                                                    onClick={() => setNewTheme(t.id)}
                                                    title={t.name}
                                                >
                                                    <div
                                                        className={styles.themePreview}
                                                        style={{ background: `linear-gradient(135deg, ${t.gradientStart}, ${t.gradientEnd})` }}
                                                    />
                                                    <span className={styles.themeName}>{t.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {createMsg && <p className={styles.createMsg}>{createMsg}</p>}
                                    <div className={styles.modalActions}>
                                        <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>취소</button>
                                        <button type="submit" className={styles.primaryBtn} disabled={creating}>
                                            {creating ? "생성 중..." : "계정 발급"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ===================== QR 코드 탭 ===================== */}
            {activeTab === "qr" && (
                <div className={styles.content}>
                    <h2 className={styles.sectionTitle}>살롱별 QR 코드</h2>
                    {salonsLoading ? (
                        <div className={styles.loadingInline}><div className={styles.loadingSpinner} /> 로딩 중...</div>
                    ) : salons.length === 0 ? (
                        <p className={styles.empty}>등록된 살롱이 없습니다.</p>
                    ) : (
                        <>
                            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                                <p style={{ fontSize: '13px', color: '#888', margin: '0 0 6px' }}>
                                    🔒 이 QR 코드는 갱신되지 않는 고정 QR입니다
                                </p>
                                <p style={{ fontSize: '11px', color: '#aaa' }}>스캔 후 10분간 사용 가능</p>
                            </div>
                            <div className={styles.qrGrid}>
                                {salons.map((s) => (
                                    <div key={s.id} className={styles.qrCard}>
                                        <h3 className={styles.qrName}>{s.name || s.id}</h3>
                                        <p className={styles.qrEmail}>{s.ownerEmail}</p>
                                        <div className={styles.qrImageWrap}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={`/api/qrcode?salonId=${s.id}&type=owner`}
                                                alt={`QR - ${s.name}`}
                                                className={styles.qrImage}
                                            />
                                        </div>
                                        <p className={styles.qrUrl}>/salon/{s.id}</p>
                                        <div className={styles.qrActions}>
                                            <button
                                                className={styles.copyBtn}
                                                onClick={async () => {
                                                    try {
                                                        const res = await fetch(`/api/salon/generate-url?salonId=${encodeURIComponent(s.id)}&type=owner`);
                                                        const data = await res.json();
                                                        if (data.url) {
                                                            await navigator.clipboard.writeText(data.url);
                                                            alert("원장님 전용 영구 URL 복사됨!");
                                                        } else {
                                                            const url = `${window.location.origin}/salon/${s.id}`;
                                                            await navigator.clipboard.writeText(url);
                                                            alert("URL 복사됨 (토큰 없음)");
                                                        }
                                                    } catch {
                                                        const url = `${window.location.origin}/salon/${s.id}`;
                                                        navigator.clipboard.writeText(url).then(() => alert("URL 복사됨"));
                                                    }
                                                }}
                                            >📋 URL 복사</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ===================== API 통계 탭 ===================== */}
            {activeTab === "stats" && (
                <div className={styles.content}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>API 호출 통계</h2>
                        <div className={styles.periodFilter}>
                            {(["day", "week", "month"] as const).map((p) => (
                                <button
                                    key={p}
                                    className={`${styles.periodBtn} ${statsPeriod === p ? styles.periodActive : ""}`}
                                    onClick={() => setStatsPeriod(p)}
                                >
                                    {periodLabel[p]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {stats?.needsSetup && (
                        <div className={styles.notice}>
                            ⚠️ {stats.message}
                        </div>
                    )}

                    {statsLoading ? (
                        <div className={styles.loadingInline}><div className={styles.loadingSpinner} /> 로딩 중...</div>
                    ) : stats ? (
                        <>
                            {/* 전체 통계 카드 */}
                            <div className={styles.statCards}>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>📞</div>
                                    <div className={styles.statValue}>{stats.totalCalls}</div>
                                    <div className={styles.statLabel}>{periodLabel[statsPeriod]} 총 호출</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>✅</div>
                                    <div className={`${styles.statValue} ${styles.success}`}>{stats.successCount}</div>
                                    <div className={styles.statLabel}>성공</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>❌</div>
                                    <div className={`${styles.statValue} ${styles.fail}`}>{stats.failCount}</div>
                                    <div className={styles.statLabel}>실패</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>📊</div>
                                    <div className={styles.statValue}>{stats.successRate}%</div>
                                    <div className={styles.statLabel}>성공률</div>
                                </div>
                            </div>

                            {/* 살롱별 통계 테이블 */}
                            <div className={styles.section}>
                                <h3 className={styles.sectionSubTitle}>살롱별 상세</h3>
                                <div className={styles.tableWrap}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr><th>살롱 ID</th><th>미용실 이름</th><th>호출 수</th><th>성공</th><th>실패</th><th>성공률</th></tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(stats.perSalon).length > 0 ? (
                                                Object.entries(stats.perSalon).map(([sid, s]) => {
                                                    const salon = salons.find(ss => ss.id === sid);
                                                    const rate = s.total > 0 ? Math.round((s.success / s.total) * 100) : 0;
                                                    return (
                                                        <tr key={sid}>
                                                            <td className={styles.mono}>{sid}</td>
                                                            <td>{salon?.name || "—"}</td>
                                                            <td className={styles.bold}>{s.total}</td>
                                                            <td className={styles.success}>{s.success}</td>
                                                            <td className={styles.fail}>{s.fail}</td>
                                                            <td>
                                                                <div className={styles.rateBar}>
                                                                    <div className={styles.rateBarFill} style={{ width: `${rate}%` }} />
                                                                    <span>{rate}%</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr><td colSpan={6} className={styles.empty}>{periodLabel[statsPeriod]} 기간 내 API 호출 기록이 없습니다.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <p className={styles.empty}>통계 데이터를 불러올 수 없습니다.</p>
                    )}
                </div>
            )}
        </div>
    );
}

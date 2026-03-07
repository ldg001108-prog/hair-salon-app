"use client";

import { useState, useEffect } from "react";
import styles from "./AdminPanel.module.css";
import { useAppStore } from "@/store/useAppStore";

interface AdminPanelProps {
    onClose: () => void;
    salonId?: string;
}

type Tab = "stats" | "history" | "errors" | "settings";

interface UsageInfo {
    dailyLimit: number;
    todayUsed: number;
    remaining: number;
}

export default function AdminPanel({ onClose, salonId }: AdminPanelProps) {
    const [activeTab, setActiveTab] = useState<Tab>("stats");
    const [usage, setUsage] = useState<UsageInfo | null>(null);
    const {
        apiStats,
        errorLogs,
        history,
        resetApiStats,
        clearErrorLogs,
        clearHistory,
    } = useAppStore();

    // 서버에서 사용량 조회
    useEffect(() => {
        if (salonId) {
            fetch(`/api/usage?salonId=${encodeURIComponent(salonId)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.dailyLimit !== undefined) {
                        setUsage({
                            dailyLimit: data.dailyLimit,
                            todayUsed: data.todayUsed,
                            remaining: data.remaining,
                        });
                    }
                })
                .catch(() => {/* 조용히 실패 */ });
        }
    }, [salonId]);

    const tabs: { id: Tab; label: string; icon: string }[] = [
        { id: "stats", label: "통계", icon: "📊" },
        { id: "history", label: "히스토리", icon: "📋" },
        { id: "errors", label: "에러", icon: "🐛" },
        { id: "settings", label: "설정", icon: "⚙️" },
    ];

    const successRate =
        apiStats.totalCalls > 0
            ? Math.round((apiStats.successCount / apiStats.totalCalls) * 100)
            : 0;

    const formatTime = (ts: number) => {
        const d = new Date(ts);
        return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    };

    // 남은 한도 비율 계산
    const usagePercent = usage
        ? Math.round((usage.todayUsed / usage.dailyLimit) * 100)
        : 0;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
                {/* 헤더 */}
                <div className={styles.header}>
                    <h2 className={styles.title}>🔧 관리자 모드</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        ✕
                    </button>
                </div>

                {/* 탭 */}
                <nav className={styles.tabs}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>

                {/* 탭 내용 */}
                <div className={styles.content}>
                    {/* 📊 통계 탭 */}
                    {activeTab === "stats" && (
                        <div className={styles.statsGrid}>
                            {/* 일일 한도 카드 (서버 데이터) */}
                            {usage && (
                                <div className={`${styles.statCard} ${styles.statCardWide}`} style={{
                                    background: usage.remaining <= 2
                                        ? "linear-gradient(135deg, #ff6b6b22, #ee5a2422)"
                                        : "linear-gradient(135deg, #4ade8022, #22c55e22)",
                                    border: usage.remaining <= 2
                                        ? "1px solid #ff6b6b44"
                                        : "1px solid #4ade8044",
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                        <div className={styles.statLabel} style={{ fontSize: 13, fontWeight: 600 }}>
                                            📦 오늘 합성 한도
                                        </div>
                                        <div style={{
                                            fontSize: 18, fontWeight: 800,
                                            color: usage.remaining <= 2 ? "#ff4444" : "#22c55e",
                                        }}>
                                            {usage.remaining}회 남음
                                        </div>
                                    </div>
                                    <div className={styles.progressBar}>
                                        <div
                                            className={styles.progressFill}
                                            style={{
                                                width: `${usagePercent}%`,
                                                background: usage.remaining <= 2
                                                    ? "linear-gradient(90deg, #ff6b6b, #ee5a24)"
                                                    : undefined,
                                            }}
                                        />
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: "#888" }}>
                                        <span>사용: {usage.todayUsed}회</span>
                                        <span>한도: {usage.dailyLimit}회/일</span>
                                    </div>
                                </div>
                            )}


                            <div className={styles.statCard}>
                                <div className={styles.statValue}>{usage ? usage.todayUsed : "–"}</div>
                                <div className={styles.statLabel}>오늘 합성</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statValue}>{usage ? `${usage.dailyLimit}` : "–"}</div>
                                <div className={styles.statLabel}>일일 한도</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statValue} style={{ color: "#4ade80" }}>
                                    {apiStats.successCount}
                                </div>
                                <div className={styles.statLabel}>성공 (세션)</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statValue} style={{ color: "#f87171" }}>
                                    {apiStats.failCount}
                                </div>
                                <div className={styles.statLabel}>실패 (세션)</div>
                            </div>
                            <div className={`${styles.statCard} ${styles.statCardWide}`}>
                                <div className={styles.progressBar}>
                                    <div
                                        className={styles.progressFill}
                                        style={{ width: `${successRate}%` }}
                                    />
                                </div>
                                <div className={styles.statLabel}>
                                    성공률 {successRate}%
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 📋 히스토리 탭 */}
                    {activeTab === "history" && (
                        <div className={styles.logList}>
                            {history.length === 0 ? (
                                <div className={styles.empty}>합성 기록이 없습니다</div>
                            ) : (
                                history.map((item) => (
                                    <div key={item.id} className={styles.logItem}>
                                        <div className={styles.logMain}>
                                            <span className={styles.logIcon}>✂️</span>
                                            <span>{item.styleName}</span>
                                            {item.colorHex && (
                                                <span
                                                    className={styles.colorDot}
                                                    style={{ background: item.colorHex }}
                                                />
                                            )}
                                        </div>
                                        <div className={styles.logTime}>
                                            {formatTime(item.timestamp)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* 🐛 에러 탭 */}
                    {activeTab === "errors" && (
                        <div className={styles.logList}>
                            {errorLogs.length === 0 ? (
                                <div className={styles.empty}>에러 없음 🎉</div>
                            ) : (
                                errorLogs.map((log) => (
                                    <div key={log.id} className={styles.logItem}>
                                        <div className={styles.logMain}>
                                            <span className={styles.logIcon}>❌</span>
                                            <span className={styles.errorMsg}>{log.message}</span>
                                        </div>
                                        {log.context && (
                                            <div className={styles.errorContext}>{log.context}</div>
                                        )}
                                        <div className={styles.logTime}>
                                            {formatTime(log.timestamp)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* ⚙️ 설정 탭 */}
                    {activeTab === "settings" && (
                        <div className={styles.settingsList}>
                            <button
                                className={styles.settingBtn}
                                onClick={() => {
                                    resetApiStats();
                                    alert("API 통계가 초기화되었습니다.");
                                }}
                            >
                                📊 API 통계 초기화
                            </button>
                            <button
                                className={styles.settingBtn}
                                onClick={() => {
                                    clearErrorLogs();
                                    alert("에러 로그가 삭제되었습니다.");
                                }}
                            >
                                🐛 에러 로그 삭제
                            </button>
                            <button
                                className={styles.settingBtn}
                                onClick={() => {
                                    clearHistory();
                                    alert("합성 히스토리가 삭제되었습니다.");
                                }}
                            >
                                📋 합성 히스토리 삭제
                            </button>
                            <button
                                className={`${styles.settingBtn} ${styles.dangerBtn}`}
                                onClick={() => {
                                    if (confirm("모든 로컬 데이터를 삭제하시겠습니까?")) {
                                        localStorage.clear();
                                        alert("초기화 완료. 새로고침합니다.");
                                        window.location.reload();
                                    }
                                }}
                            >
                                🗑️ 전체 캐시 초기화
                            </button>
                            <div className={styles.version}>
                                v1.0.0 • dev branch
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";
import styles from "./AdminPanel.module.css";
import { useAppStore } from "@/store/useAppStore";

interface AdminPanelProps {
    onClose: () => void;
}

type Tab = "stats" | "history" | "errors" | "settings";

export default function AdminPanel({ onClose }: AdminPanelProps) {
    const [activeTab, setActiveTab] = useState<Tab>("stats");
    const {
        apiStats,
        errorLogs,
        history,
        resetApiStats,
        clearErrorLogs,
        clearHistory,
    } = useAppStore();

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

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
                {/* 헤더 */}
                <div className={styles.header}>
                    <h2 className={styles.title}>🔧 개발자 모드</h2>
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
                            <div className={styles.statCard}>
                                <div className={styles.statValue}>{apiStats.todayCalls}</div>
                                <div className={styles.statLabel}>오늘 합성</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statValue}>{apiStats.totalCalls}</div>
                                <div className={styles.statLabel}>총 합성</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statValue} style={{ color: "#4ade80" }}>
                                    {apiStats.successCount}
                                </div>
                                <div className={styles.statLabel}>성공</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statValue} style={{ color: "#f87171" }}>
                                    {apiStats.failCount}
                                </div>
                                <div className={styles.statLabel}>실패</div>
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

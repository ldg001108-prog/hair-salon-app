"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./LoadingOverlay.module.css";

// 합성 진행 단계
const STAGES = [
    { id: 1, label: "분석", message: "사진을 분석하고 있어요", icon: "🔍" },
    { id: 2, label: "변환", message: "헤어스타일을 적용하고 있어요", icon: "✂️" },
    { id: 3, label: "보정", message: "자연스럽게 보정하고 있어요", icon: "✨" },
    { id: 4, label: "완성", message: "거의 다 됐어요!", icon: "🎨" },
];

// 랜덤 팁 메시지
const TIPS = [
    "💡 정면 사진일수록 더 자연스러운 결과물이 나와요",
    "💡 밝은 조명에서 찍은 사진이 합성 품질이 더 좋아요",
    "💡 헤어 컬러를 선택하면 염색 효과도 함께 볼 수 있어요",
    "💡 여러 스타일을 비교해보면 더 잘 어울리는 스타일을 찾을 수 있어요",
    "💡 결과가 마음에 들면 저장하고 미용사에게 보여주세요!",
];

interface LoadingOverlayProps {
    isVisible: boolean;
}

export default function LoadingOverlay({ isVisible }: LoadingOverlayProps) {
    const [currentStage, setCurrentStage] = useState(0);
    const [progress, setProgress] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);
    const startTimeRef = useRef(Date.now());
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // 진행 단계 시뮬레이션
    useEffect(() => {
        if (!isVisible) {
            setCurrentStage(0);
            setProgress(0);
            setElapsed(0);
            return;
        }

        startTimeRef.current = Date.now();

        // 프로그레스 바 자연스럽게 증가
        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 92) return prev; // 92%에서 멈춤 (완료 시 100%)
                // 처음엔 빠르고, 갈수록 느리게
                const increment = prev < 30 ? 2 : prev < 60 ? 1.2 : prev < 80 ? 0.6 : 0.3;
                return Math.min(prev + increment, 92);
            });
        }, 300);

        // 단계 전환 (점진적)
        const stageTimers = [
            setTimeout(() => setCurrentStage(1), 2000),   // 2초 후 → 변환
            setTimeout(() => setCurrentStage(2), 6000),   // 6초 후 → 보정
            setTimeout(() => setCurrentStage(3), 12000),  // 12초 후 → 완성
        ];

        // 경과 시간 카운터
        intervalRef.current = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);

        return () => {
            clearInterval(progressInterval);
            stageTimers.forEach(clearTimeout);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isVisible]);

    if (!isVisible) return null;

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return m > 0 ? `${m}분 ${s}초` : `${s}초`;
    };

    const stage = STAGES[currentStage];

    return (
        <div className={styles.overlay}>
            <div className={styles.content}>
                {/* AI 아이콘 */}
                <div className={styles.iconWrap}>
                    <div className={styles.iconRingOuter} />
                    <div className={styles.iconRing} />
                    <span className={styles.iconInner}>{stage.icon}</span>
                </div>

                {/* 현재 단계 메시지 */}
                <div className={styles.stageInfo}>
                    <span key={currentStage} className={styles.stageLabel}>
                        {stage.message}
                    </span>
                    <span className={styles.stageSubtext}>
                        AI가 최상의 결과물을 만들고 있습니다
                    </span>
                </div>

                {/* 프로그레스 바 */}
                <div className={styles.progressWrap}>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className={styles.progressMeta}>
                        <span>{Math.round(progress)}%</span>
                        <span className={styles.elapsed}>
                            {elapsed > 0 && `${formatTime(elapsed)} 경과`}
                        </span>
                    </div>
                </div>

                {/* 단계 인디케이터 */}
                <div className={styles.steps}>
                    {STAGES.map((s, idx) => (
                        <div
                            key={s.id}
                            className={`${styles.step} ${idx === currentStage
                                    ? styles.stepActive
                                    : idx < currentStage
                                        ? styles.stepDone
                                        : ""
                                }`}
                        >
                            <div className={styles.stepDot}>
                                {idx < currentStage ? (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                ) : (
                                    s.id
                                )}
                            </div>
                            <span className={styles.stepLabel}>{s.label}</span>
                        </div>
                    ))}
                </div>

                {/* 팁 카드 */}
                <div className={styles.tipCard}>
                    <span className={styles.tipIcon}>💡</span>
                    <span className={styles.tipText}>{tip.replace("💡 ", "")}</span>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./Splash.module.css";

interface SplashProps {
    salonName: string;
    logoUrl?: string;
    themeColor?: string;
    onComplete: () => void;
}

export default function Splash({
    onComplete,
}: SplashProps) {
    const [fadeOut, setFadeOut] = useState(false);
    const onCompleteRef = useRef(onComplete);
    const transitionedRef = useRef(false);
    onCompleteRef.current = onComplete;

    const triggerTransition = () => {
        if (transitionedRef.current) return;
        transitionedRef.current = true;
        setFadeOut(true);
        setTimeout(() => onCompleteRef.current(), 600);
    };

    useEffect(() => {
        const autoTimer = setTimeout(() => triggerTransition(), 3000);
        return () => clearTimeout(autoTimer);
    }, []);

    return (
        <div
            className={`${styles.splash} ${fadeOut ? styles.fadeOut : ""}`}
            onClick={triggerTransition}
            onTouchEnd={triggerTransition}
        >
            {/* 배경 파티클 */}
            <div className={styles.particles}>
                {Array.from({ length: 6 }, (_, i) => (
                    <span key={i} className={styles.particle} style={{ animationDelay: `${i * 0.4}s` }} />
                ))}
            </div>

            {/* 히어로 이미지 */}
            <div className={styles.heroWrap}>
                <div className={styles.heroGlow} />
                <img
                    src="/splash-model.jpg"
                    alt="AI Hair Studio"
                    className={styles.heroImage}
                />
            </div>

            {/* 텍스트 */}
            <div className={styles.textGroup}>
                <h1 className={styles.title}>AI Hair Studio</h1>
                <p className={styles.subtitle}>당신만의 스타일을 찾아보세요</p>
            </div>

            {/* 시작 인디케이터 */}
            <div className={styles.tapHint}>
                <span className={styles.tapDot} />
                <span className={styles.tapText}>Tap to start</span>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useState, useRef } from "react";
import styles from "./Splash.module.css";

interface SplashProps {
    salonName: string;
    logoUrl?: string;
    themeColor?: string;
    onComplete: () => void;
}

export default function Splash({
    salonName,
    logoUrl,
    themeColor = "#2563EB",
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
        setTimeout(() => onCompleteRef.current(), 500);
    };

    useEffect(() => {
        const autoTimer = setTimeout(() => triggerTransition(), 3000);
        return () => clearTimeout(autoTimer);
    }, []);

    const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        triggerTransition();
    };

    return (
        <div
            className={`${styles.splash} ${fadeOut ? styles.fadeOut : ""}`}
            onClick={handleTap}
            onTouchEnd={handleTap}
            role="button"
            tabIndex={0}
        >
            {/* 배경 파티클 */}
            <div className={styles.particles}>
                <div className={styles.particle} />
                <div className={styles.particle} />
                <div className={styles.particle} />
                <div className={styles.particle} />
                <div className={styles.particle} />
            </div>

            {/* 메인 콘텐츠 */}
            <div className={styles.content}>
                {/* 히어로 이미지 */}
                <div className={styles.heroImageWrap}>
                    <div className={styles.heroGlow} />
                    <img
                        src="/images/splash_model.png"
                        alt="AI Hair Styling"
                        className={styles.heroImage}
                    />
                    <div className={styles.heroOverlay} />
                </div>

                {/* 텍스트 */}
                <div className={styles.textWrap}>
                    <h1 className={styles.brandTitle}>AI Hair Studio</h1>
                    <p className={styles.tagline}>
                        당신만의 스타일을 찾아보세요
                    </p>
                </div>
            </div>

            {/* 하단 */}
            <div className={styles.bottomArea}>
                <div className={styles.startBtn}>
                    <span className={styles.startText}>탭하여 시작하기</span>
                    <div className={styles.startPulse} />
                </div>
            </div>
        </div>
    );
}

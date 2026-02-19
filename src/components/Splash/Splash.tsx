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
        setTimeout(() => onCompleteRef.current(), 400);
    };

    useEffect(() => {
        // 2.5초 후 페이드아웃 → 자동 전환
        const autoTimer = setTimeout(() => triggerTransition(), 2500);
        return () => clearTimeout(autoTimer);
    }, []); // 빈 배열 — 최초 1회만 실행

    // 탭/클릭 시 즉시 전환 (카카오톡 인앱 브라우저 호환)
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
            <div className={styles.logoWrap}>
                <h1 className={styles.brandLogo}>YUKINIAN</h1>
                <p className={styles.tagline}>AI Hair Styling</p>
            </div>
            <p className={styles.tapHint}>Tap to continue</p>
        </div>
    );
}

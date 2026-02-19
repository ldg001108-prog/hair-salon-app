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
    onCompleteRef.current = onComplete;

    useEffect(() => {
        // 2.5초 후 페이드아웃 시작
        const fadeTimer = setTimeout(() => setFadeOut(true), 2500);
        // 3.1초 후 메인 화면으로 전환
        const completeTimer = setTimeout(() => {
            onCompleteRef.current();
        }, 3100);
        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(completeTimer);
        };
    }, []); // 빈 배열 — 최초 1회만 실행

    // 탭하면 바로 넘어가기
    const handleTap = () => {
        if (!fadeOut) {
            setFadeOut(true);
            setTimeout(() => onCompleteRef.current(), 400);
        }
    };

    return (
        <div
            className={`${styles.splash} ${fadeOut ? styles.fadeOut : ""}`}
            onClick={handleTap}
        >
            <div className={styles.logoWrap}>
                <h1 className={styles.brandLogo}>YUKINIAN</h1>
                <p className={styles.tagline}>AI Hair Styling</p>
            </div>
            <p className={styles.tapHint}>Tap to continue</p>
        </div>
    );
}

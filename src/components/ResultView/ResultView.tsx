"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import styles from "./ResultView.module.css";
import type { Hairstyle } from "@/data/demo";
import { useAppStore } from "@/store/useAppStore";

interface ResultViewProps {
    resultImage: string;
    userPhoto: string;
    selectedStyle: Hairstyle | null;
    selectedColor: string | null;
    colorIntensity: number;
    onBack: () => void;
    onRetry: () => void;
}

export default function ResultView({
    resultImage,
    userPhoto,
    selectedStyle,
    selectedColor,
    colorIntensity,
    onBack,
    onRetry,
}: ResultViewProps) {
    const [showCompare, setShowCompare] = useState(false);
    const [sliderPos, setSliderPos] = useState(50);
    const [isSaved, setIsSaved] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [canShare, setCanShare] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);

    useEffect(() => {
        setCanShare(typeof navigator !== 'undefined' && !!navigator.share);
    }, []);
    const theme = useAppStore((s) => s.theme);

    const displayImage = resultImage;

    // 슬라이더 로직
    const updateSlider = useCallback((clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setSliderPos(percent);
    }, []);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        isDraggingRef.current = true;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        updateSlider(e.clientX);
    }, [updateSlider]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDraggingRef.current) return;
        updateSlider(e.clientX);
    }, [updateSlider]);

    const handlePointerUp = useCallback(() => {
        isDraggingRef.current = false;
    }, []);

    // 이미지 저장
    const handleSave = useCallback(async () => {
        try {
            const response = await fetch(displayImage);
            const blob = await response.blob();

            if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
                try {
                    const handle = await (window as unknown as { showSaveFilePicker: (opts: Record<string, unknown>) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
                        suggestedName: `hair-studio-${Date.now()}.png`,
                        types: [{ description: 'PNG Image', accept: { 'image/png': ['.png'] } }],
                    });
                    const writable = await handle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                    setIsSaved(true);
                    showToastMsg();
                    return;
                } catch {
                    // 사용자가 취소하면 fallback
                }
            }

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `hair-studio-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setIsSaved(true);
            showToastMsg();
        } catch (err) {
            console.error('Save failed:', err);
        }
    }, [displayImage]);

    // 공유
    const handleShare = useCallback(async () => {
        if (navigator.share) {
            try {
                const response = await fetch(displayImage);
                const blob = await response.blob();
                const file = new File([blob], 'hair-studio-result.png', { type: 'image/png' });
                await navigator.share({ title: 'AI Hair Studio 결과', files: [file] });
            } catch {
                // 공유 취소
            }
        }
    }, [displayImage]);

    const showToastMsg = () => {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
    };

    return (
        <div className={styles.result}>
            {/* 헤더 */}
            <header className={styles.header}>
                <button className={styles.backBtn} onClick={onBack}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
                <h2 className={styles.headerTitle}>Result</h2>
                <div style={{ width: 36 }} />
            </header>

            {/* 결과 이미지 */}
            <section className={styles.imageSection}>
                {showCompare ? (
                    <div
                        className={styles.compareContainer}
                        ref={containerRef}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                    >
                        {/* After (결과) — 풀 이미지 */}
                        <img
                            src={displayImage}
                            alt="합성 결과"
                            className={styles.compareImg}
                            draggable={false}
                        />
                        {/* Before (원본) — clip */}
                        <div
                            className={styles.beforeOverlay}
                            style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                        >
                            <img
                                src={userPhoto}
                                alt="원본"
                                className={styles.compareImg}
                                draggable={false}
                            />
                        </div>
                        {/* 슬라이더 라인 */}
                        <div className={styles.sliderLine} style={{ left: `${sliderPos}%` }}>
                            <div className={styles.sliderHandle}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <polyline points="9 18 15 12 9 6" />
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            </div>
                        </div>
                        {/* 라벨 */}
                        <span className={`${styles.compareLabel} ${styles.labelBefore}`}>Before</span>
                        <span className={`${styles.compareLabel} ${styles.labelAfter}`}>After</span>
                    </div>
                ) : (
                    <div className={styles.resultImgWrap}>
                        <img
                            src={displayImage}
                            alt="합성 결과"
                            className={styles.resultImg}
                        />
                    </div>
                )}
            </section>

            {/* 스타일 정보 카드 */}
            {selectedStyle && (
                <div className={styles.infoCard}>
                    <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>✂️ Style</span>
                        <span className={styles.infoValue}>{selectedStyle.name}</span>
                    </div>
                    {selectedColor && (
                        <div className={styles.infoRow}>
                            <span className={styles.infoLabel}>🎨 Color</span>
                            <div className={styles.infoColorWrap}>
                                <div
                                    className={styles.infoColorDot}
                                    style={{ background: selectedColor }}
                                />
                                <span className={styles.infoValue}>
                                    {selectedColor}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 비교 토글 */}
            <button
                className={`${styles.compareToggle} ${showCompare ? styles.compareToggleActive : ""}`}
                onClick={() => setShowCompare(!showCompare)}
            >
                {showCompare ? "🖼 결과만 보기" : "↔ Before / After"}
            </button>

            {/* 하단 액션 */}
            <div className={styles.actions}>
                <button className={styles.actionBtn} onClick={handleSave}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>{isSaved ? '저장됨 ✓' : '저장'}</span>
                </button>

                {canShare && (
                    <button className={styles.actionBtn} onClick={handleShare}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="18" cy="5" r="3" />
                            <circle cx="6" cy="12" r="3" />
                            <circle cx="18" cy="19" r="3" />
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                        </svg>
                        <span>공유</span>
                    </button>
                )}

                <button className={`${styles.actionBtn} ${styles.retryBtn}`} onClick={onRetry}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                        <polyline points="21 3 21 9 15 9" />
                    </svg>
                    <span>다시 시도</span>
                </button>
            </div>

            {/* 토스트 */}
            {showToast && (
                <div className={styles.toast}>이미지가 저장되었습니다</div>
            )}
        </div>
    );
}

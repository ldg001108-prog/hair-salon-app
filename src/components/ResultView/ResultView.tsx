"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import styles from "./ResultView.module.css";
import type { Hairstyle } from "@/data/demo";

interface ResultViewProps {
    userPhoto: string;
    resultImage: string | null;
    selectedStyle: Hairstyle | undefined;
    selectedColorLabel: string | null;
    onTryAnother: () => void;
    onReset: () => void;
    onSave: () => void;
}

export default function ResultView({
    userPhoto,
    resultImage,
    selectedStyle,
    selectedColorLabel,
    onTryAnother,
    onReset,
    onSave,
}: ResultViewProps) {
    const displayImage = resultImage || userPhoto;

    // Before/After 슬라이더 상태
    const [sliderPos, setSliderPos] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const [showBefore, setShowBefore] = useState(false); // 토글 모드
    const containerRef = useRef<HTMLDivElement>(null);

    // 공유 토스트 상태
    const [toast, setToast] = useState<string | null>(null);

    // 토스트 자동 숨김
    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 2500);
            return () => clearTimeout(t);
        }
    }, [toast]);

    // ── Before/After 슬라이더 핸들러 ──
    const updateSlider = useCallback((clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setSliderPos(percent);
    }, []);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        setIsDragging(true);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        updateSlider(e.clientX);
    }, [updateSlider]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging) return;
        updateSlider(e.clientX);
    }, [isDragging, updateSlider]);

    const handlePointerUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // ── 이미지 다운로드 ──
    const handleDownload = useCallback(() => {
        if (!displayImage) return;
        const link = document.createElement("a");
        link.href = displayImage;
        link.download = `yukinian-hair-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setToast("✅ 이미지 저장 완료!");
    }, [displayImage]);

    // ── 공유 (Web Share API → 카카오톡 등 가능) ──
    const handleShare = useCallback(async () => {
        if (!displayImage) return;

        // data URL → blob 변환
        try {
            const res = await fetch(displayImage);
            const blob = await res.blob();
            const file = new File([blob], "yukinian-hairstyle.png", { type: "image/png" });

            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    title: "YUKINIAN AI Hair Styling",
                    text: selectedStyle
                        ? `${selectedStyle.name} 스타일로 변신! ✨`
                        : "AI 헤어스타일 변신! ✨",
                    files: [file],
                });
                setToast("✅ 공유 완료!");
            } else {
                // Web Share 미지원 → 클립보드에 URL 복사
                await navigator.clipboard.writeText(window.location.href);
                setToast("📋 링크가 복사되었습니다!");
            }
        } catch (err: unknown) {
            if (err instanceof Error && err.name !== "AbortError") {
                // 공유 취소가 아닌 실제 에러
                setToast("📋 링크가 복사되었습니다!");
                try {
                    await navigator.clipboard.writeText(window.location.href);
                } catch {
                    // 무시
                }
            }
        }
    }, [displayImage, selectedStyle]);

    // ── Before/After가 가능한지 (합성 결과가 있을 때만) ──
    const hasResult = !!resultImage;

    return (
        <div className={styles.result}>
            {/* 헤더 */}
            <header className={styles.header}>
                <button className={styles.backBtn} onClick={onTryAnother}>
                    ← 다시
                </button>
                <h2 className={styles.title}>합성 결과</h2>
                <div style={{ width: 60 }} />
            </header>

            {/* Before/After 비교 섹션 */}
            <section className={styles.imageSection}>
                {hasResult ? (
                    <>
                        {/* 모드 토글 */}
                        <div className={styles.modeToggle}>
                            <button
                                className={`${styles.modeBtn} ${!showBefore ? styles.modeBtnActive : ""}`}
                                onClick={() => setShowBefore(false)}
                            >
                                슬라이더 비교
                            </button>
                            <button
                                className={`${styles.modeBtn} ${showBefore ? styles.modeBtnActive : ""}`}
                                onClick={() => setShowBefore(true)}
                            >
                                원본 보기
                            </button>
                        </div>

                        {/* 슬라이더 비교 모드 */}
                        {!showBefore ? (
                            <div
                                className={styles.compareContainer}
                                ref={containerRef}
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onPointerCancel={handlePointerUp}
                            >
                                {/* After (결과) - 풀 이미지 */}
                                <img
                                    src={displayImage}
                                    alt="합성 결과"
                                    className={styles.compareImg}
                                    draggable={false}
                                />

                                {/* Before (원본) - clip으로 잘림 */}
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
                                <div
                                    className={styles.sliderLine}
                                    style={{ left: `${sliderPos}%` }}
                                >
                                    <div className={styles.sliderHandle}>
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <path d="M7 4L3 10L7 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M13 4L17 10L13 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>

                                {/* 라벨 */}
                                <div className={styles.labelBefore}>BEFORE</div>
                                <div className={styles.labelAfter}>AFTER</div>
                            </div>
                        ) : (
                            /* 원본 보기 모드 */
                            <div className={styles.imageContainer}>
                                <img
                                    src={userPhoto}
                                    alt="원본 사진"
                                    className={styles.resultImg}
                                />
                            </div>
                        )}
                    </>
                ) : (
                    /* 합성 결과 없을 때 */
                    <div className={styles.imageContainer}>
                        <img
                            src={displayImage}
                            alt="합성 결과"
                            className={styles.resultImg}
                        />
                        <div className={styles.demoOverlay}>
                            <span>✨ AI 합성 미리보기</span>
                            <span className={styles.demoSub}>
                                (실제 AI 연동 시 여기에 합성 결과가 표시됩니다)
                            </span>
                        </div>
                    </div>
                )}
            </section>

            {/* 스타일 스토리 카드 */}
            {selectedStyle && (
                <section className={styles.storyCard}>
                    <div className={styles.storyHeader}>
                        <span className={styles.storyEmoji}>📖</span>
                        <h3 className={styles.storyTitle}>{selectedStyle.name}</h3>
                    </div>
                    {selectedColorLabel && (
                        <p className={styles.colorInfo}>
                            🎨 선택 컬러: <strong>{selectedColorLabel}</strong>
                        </p>
                    )}
                    <p className={styles.storyText}>{selectedStyle.story}</p>
                </section>
            )}

            {/* 액션 버튼 */}
            <div className={styles.actions}>
                {/* 저장 + 공유 가로 배치 */}
                <div className={styles.actionRow}>
                    <button className={styles.saveBtn} onClick={handleDownload}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                            <polyline points="7,10 12,15 17,10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        저장하기
                    </button>
                    <button className={styles.shareBtn} onClick={handleShare}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="18" cy="5" r="3" />
                            <circle cx="6" cy="12" r="3" />
                            <circle cx="18" cy="19" r="3" />
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                        </svg>
                        공유하기
                    </button>
                </div>

                <button
                    className={styles.tryAnotherBtn}
                    onClick={onTryAnother}
                >
                    💇 다른 스타일 해보기
                </button>
                <button className={styles.resetBtn} onClick={onReset}>
                    🔄 처음부터 다시하기
                </button>
            </div>

            {/* 토스트 메시지 */}
            {toast && (
                <div className={styles.toast}>
                    {toast}
                </div>
            )}
        </div>
    );
}

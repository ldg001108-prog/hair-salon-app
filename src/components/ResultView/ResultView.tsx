"use client";

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
    // 데모: resultImage가 없으면 원본 사진에 오버레이
    const displayImage = resultImage || userPhoto;

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

            {/* 결과 이미지 */}
            <section className={styles.imageSection}>
                <div className={styles.imageContainer}>
                    <img
                        src={displayImage}
                        alt="합성 결과"
                        className={styles.resultImg}
                    />
                    {!resultImage && (
                        <div className={styles.demoOverlay}>
                            <span>✨ AI 합성 미리보기</span>
                            <span className={styles.demoSub}>
                                (실제 AI 연동 시 여기에 합성 결과가 표시됩니다)
                            </span>
                        </div>
                    )}
                </div>

                {/* 비교 라벨 */}
                <div className={styles.compareLabels}>
                    <span>원본</span>
                    <span>→</span>
                    <span>합성</span>
                </div>
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
                <button
                    className="btn btn-primary btn-full btn-lg"
                    onClick={onSave}
                >
                    💾 저장하기
                </button>
                <button
                    className="btn btn-secondary btn-full"
                    onClick={onTryAnother}
                >
                    💇 다른 스타일 해보기
                </button>
                <button
                    className={styles.resetBtn}
                    onClick={onReset}
                >
                    🔄 처음부터 다시하기
                </button>
            </div>
        </div>
    );
}

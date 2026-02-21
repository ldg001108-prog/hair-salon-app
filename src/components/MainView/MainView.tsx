"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import styles from "./MainView.module.css";
import type { Hairstyle } from "@/data/demo";
import { CATEGORIES, GENDERS } from "@/data/demo";
import ColorWheel from "@/components/ColorWheel/ColorWheel";
import { useAppStore } from "@/store/useAppStore";

// hex 색상을 intensity에 따라 조정하는 유틸
function adjustColorIntensity(hex: string, intensity: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const factor = intensity / 100;
    const nr = Math.round(255 + (r - 255) * factor);
    const ng = Math.round(255 + (g - 255) * factor);
    const nb = Math.round(255 + (b - 255) * factor);
    return `rgb(${nr}, ${ng}, ${nb})`;
}

interface MainViewProps {
    salonName: string;
    hairstyles: Hairstyle[];
    userPhoto: string | null;
    selectedStyleId: string | null;
    selectedColor: string | null;
    onPhotoSelect: (dataUrl: string) => void;
    onPhotoChange: () => void;
    onStyleSelect: (id: string) => void;
    onColorSelect: (hex: string | null) => void;
    onSynthesize: () => void;
    isLoading: boolean;
}

export default function MainView({
    hairstyles,
    userPhoto,
    selectedStyleId,
    selectedColor,
    onPhotoSelect,
    onPhotoChange,
    onStyleSelect,
    onColorSelect,
    onSynthesize,
    isLoading,
}: MainViewProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeGender, setActiveGender] = useState<"female" | "male">("female");
    const [activeCategory, setActiveCategory] = useState("best");

    const theme = useAppStore((s) => s.theme);
    const toggleTheme = useAppStore((s) => s.toggleTheme);

    // 테마 초기화 (hydration 시 DOM 동기화)
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    // 사진 업로드
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const result = ev.target?.result as string;
            onPhotoSelect(result);
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    // Ctrl+V 클립보드 이미지
    const handlePaste = useCallback((e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
                e.preventDefault();
                const file = items[i].getAsFile();
                if (!file) continue;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const result = ev.target?.result as string;
                    onPhotoSelect(result);
                };
                reader.readAsDataURL(file);
                break;
            }
        }
    }, [onPhotoSelect]);

    useEffect(() => {
        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, [handlePaste]);

    // 필터링
    const genderFiltered = hairstyles.filter((h) => h.gender === activeGender);
    const filteredStyles =
        activeCategory === "best"
            ? genderFiltered.filter((h) => h.isBest)
            : genderFiltered.filter((h) => h.category === activeCategory);

    const selectedStyle = hairstyles.find((h) => h.id === selectedStyleId);
    const previewImage = userPhoto;
    const canSynthesize = userPhoto && selectedStyleId;

    return (
        <div className={styles.main}>
            {/* ── 헤더 ── */}
            <header className={styles.header}>
                <h1 className={styles.logo}>AI Hair Studio</h1>
                <button
                    className={styles.themeToggle}
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                >
                    {theme === "light" ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                        </svg>
                    ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="5" />
                            <line x1="12" y1="1" x2="12" y2="3" />
                            <line x1="12" y1="21" x2="12" y2="23" />
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                            <line x1="1" y1="12" x2="3" y2="12" />
                            <line x1="21" y1="12" x2="23" y2="12" />
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                        </svg>
                    )}
                </button>
            </header>

            {/* ── 성별 토글 (동일 크기) ── */}
            <nav className={styles.genderPill}>
                {GENDERS.map((g) => (
                    <button
                        key={g.id}
                        className={`${styles.genderBtn} ${activeGender === g.id ? styles.genderActive : ""}`}
                        onClick={() => {
                            setActiveGender(g.id as "female" | "male");
                            setActiveCategory("best");
                        }}
                    >
                        {g.label}
                    </button>
                ))}
            </nav>

            {/* ── 구분선 ── */}
            <hr className={styles.divider} />

            {/* ── 사진 업로드 + 컬러 팔레트 (2컬럼) ── */}
            <section className={styles.uploadColorRow}>
                {/* 왼쪽: 사진 업로드 */}
                <div className={styles.uploadCol}>
                    <div className={styles.previewCard}>
                        {previewImage ? (
                            <div className={styles.previewInner}>
                                <img
                                    src={previewImage}
                                    alt="Preview"
                                    className={styles.previewImg}
                                />
                                <button
                                    className={styles.changePhotoBtn}
                                    onClick={() => onPhotoChange()}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                                        <polyline points="21 3 21 9 15 9" />
                                    </svg>
                                </button>
                                {selectedStyle && (
                                    <div className={styles.styleOverlay}>
                                        <span>✨ {selectedStyle.name}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div
                                className={styles.uploadArea}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className={styles.uploadIcon}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                                        <circle cx="12" cy="13" r="4" />
                                    </svg>
                                </div>
                                <span className={styles.uploadText}>사진 업로드</span>
                                <span className={styles.uploadHint}>터치하여 선택<br />Ctrl+V 붙여넣기</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 오른쪽: 컬러 휠 */}
                <div className={styles.colorCol}>
                    <span className={styles.colorColTitle}>헤어 컬러</span>
                    <ColorWheel
                        selectedColor={selectedColor}
                        onColorSelect={onColorSelect}
                        size={150}
                    />
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />
            </section>

            <p className={styles.privacyNote}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 4, verticalAlign: 'middle' }}>
                    <path d="M12 1C8.676 1 6 3.676 6 7v2H4v14h16V9h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4z" />
                </svg>
                사진은 저장되지 않으며 일회성으로 사용 후 삭제됩니다
            </p>

            {/* ── 구분선 ── */}
            <hr className={styles.divider} />

            {/* ── 카테고리 탭 ── */}
            <nav className={styles.categoryTabs}>
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        className={`${styles.catTab} ${activeCategory === cat.id ? styles.catTabActive : ""}`}
                        onClick={() => setActiveCategory(cat.id)}
                    >
                        {cat.label}
                    </button>
                ))}
            </nav>

            {/* ── 스타일 갤러리 (확대) ── */}
            <section className={styles.styleGallery}>
                {filteredStyles.length > 0 ? (
                    <div className={styles.styleGrid}>
                        {filteredStyles.map((style) => (
                            <button
                                key={style.id}
                                className={`${styles.styleCard} ${selectedStyleId === style.id ? styles.styleCardSelected : ""}`}
                                onClick={() => onStyleSelect(style.id)}
                            >
                                <div className={styles.styleImgWrap}>
                                    {style.imageUrl ? (
                                        <img
                                            src={style.imageUrl}
                                            alt={style.name}
                                            className={styles.styleImg}
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className={styles.stylePlaceholder}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M20 7h-4l-2-3H10L8 7H4a2 2 0 00-2 2v11a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
                                                <circle cx="12" cy="14" r="3" />
                                            </svg>
                                        </div>
                                    )}
                                    {style.isBest && (
                                        <span className={styles.bestBadge}>
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                            </svg>
                                        </span>
                                    )}
                                    {selectedStyleId === style.id && (
                                        <div className={styles.checkBadge}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <span className={styles.styleName}>{style.name}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <p>이 카테고리에 스타일이 없습니다</p>
                    </div>
                )}
            </section>

            {/* ── 합성 버튼 ── */}
            {canSynthesize && (
                <div className={styles.ctaWrap}>
                    <button
                        className={styles.ctaBtn}
                        onClick={onSynthesize}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className={styles.spinner} /> 합성 중...
                            </>
                        ) : (
                            <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                </svg>
                                스타일 합성하기
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}

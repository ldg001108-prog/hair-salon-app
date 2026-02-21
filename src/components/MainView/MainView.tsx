"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import styles from "./MainView.module.css";
import type { Hairstyle } from "@/data/demo";
import { CATEGORIES, GENDERS, HAIR_COLORS } from "@/data/demo";
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
    selectedColorId: string | null;
    onPhotoSelect: (dataUrl: string) => void;
    onPhotoChange: () => void;
    onStyleSelect: (id: string) => void;
    onColorSelect: (id: string | null) => void;
    onSynthesize: () => void;
    isLoading: boolean;
}

export default function MainView({
    hairstyles,
    userPhoto,
    selectedStyleId,
    selectedColorId,
    onPhotoSelect,
    onPhotoChange,
    onStyleSelect,
    onColorSelect,
    onSynthesize,
    isLoading,
}: MainViewProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const stripRef = useRef<HTMLDivElement>(null);
    const [activeGender, setActiveGender] = useState<"female" | "male">("female");
    const [activeCategory, setActiveCategory] = useState("best");

    const colorIntensity = useAppStore((s) => s.colorIntensity ?? 70);
    const setColorIntensity = useAppStore((s) => s.setColorIntensity);
    const theme = useAppStore((s) => s.theme);
    const toggleTheme = useAppStore((s) => s.toggleTheme);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);

    // 테마 초기화 (hydration 시 DOM 동기화)
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    // 드래그 스크롤 상태
    const dragState = useRef({ isDragging: false, startX: 0, scrollLeft: 0, moved: false });

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        const strip = stripRef.current;
        if (!strip) return;
        dragState.current = { isDragging: true, startX: e.pageX - strip.offsetLeft, scrollLeft: strip.scrollLeft, moved: false };
        strip.style.cursor = 'grabbing';
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!dragState.current.isDragging) return;
        e.preventDefault();
        const strip = stripRef.current;
        if (!strip) return;
        const x = e.pageX - strip.offsetLeft;
        const walk = (x - dragState.current.startX) * 1.5;
        if (Math.abs(walk) > 5) dragState.current.moved = true;
        strip.scrollLeft = dragState.current.scrollLeft - walk;
    }, []);

    const handleMouseUp = useCallback(() => {
        dragState.current.isDragging = false;
        const strip = stripRef.current;
        if (strip) strip.style.cursor = 'grab';
    }, []);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        const strip = stripRef.current;
        if (!strip) return;
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.preventDefault();
            strip.scrollLeft += e.deltaY;
        }
    }, []);

    const handleScroll = useCallback(() => {
        const strip = stripRef.current;
        if (!strip || strip.scrollWidth <= strip.clientWidth) return;
        const maxScroll = strip.scrollWidth - strip.clientWidth;
        const progress = strip.scrollLeft / maxScroll;
        const pages = Math.ceil(strip.children.length / 4);
        const page = Math.min(Math.round(progress * (pages - 1)), pages - 1);
        setCurrentPage(page);
    }, []);

    useEffect(() => {
        if (stripRef.current) stripRef.current.scrollLeft = 0;
        setCurrentPage(0);
    }, [activeGender, activeCategory]);

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
    const totalPages = Math.ceil(filteredStyles.length / 4);

    const selectedColor = selectedColorId ? HAIR_COLORS.find((c) => c.id === selectedColorId) : null;
    const previewColor = useMemo(() => {
        if (!selectedColor) return null;
        return adjustColorIntensity(selectedColor.hex, colorIntensity);
    }, [selectedColor, colorIntensity]);

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

            {/* ── 성별 토글 (필 형태) ── */}
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

            {/* ── 프리뷰 카드 ── */}
            <section className={styles.previewSection}>
                <div className={styles.previewCard}>
                    {previewImage ? (
                        <div className={styles.previewInner}>
                            <img
                                src={previewImage}
                                alt="Preview"
                                className={styles.previewImg}
                            />
                            {/* 사진 변경 버튼 */}
                            <button
                                className={styles.changePhotoBtn}
                                onClick={() => onPhotoChange()}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                                    <polyline points="21 3 21 9 15 9" />
                                </svg>
                            </button>
                            {/* 선택된 스타일 오버레이 */}
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
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                                    <circle cx="12" cy="13" r="4" />
                                </svg>
                            </div>
                            <span className={styles.uploadText}>사진 업로드</span>
                            <span className={styles.uploadHint}>터치하여 선택 또는 Ctrl+V 붙여넣기</span>
                        </div>
                    )}
                </div>
                <p className={styles.privacyNote}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 4, verticalAlign: 'middle' }}>
                        <path d="M12 1C8.676 1 6 3.676 6 7v2H4v14h16V9h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4z" />
                    </svg>
                    사진은 저장되지 않으며 일회성으로 사용 후 삭제됩니다
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />
            </section>

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

            {/* ── 컬러 선택 ── */}
            <section className={styles.colorSection}>
                <div className={styles.colorHeader}>
                    <h3 className={styles.sectionLabel}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: 'middle' }}>
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="12" r="6" />
                            <circle cx="12" cy="12" r="2" />
                        </svg>
                        Hair Color
                    </h3>
                    <div className={styles.colorHeaderActions}>
                        {previewColor && (
                            <div className={styles.colorPreview}>
                                <div
                                    className={styles.colorPreviewDot}
                                    style={{ background: previewColor }}
                                />
                                <span className={styles.colorPreviewName}>{selectedColor?.label}</span>
                            </div>
                        )}
                        <button
                            className={`${styles.adjustBtn} ${showColorPicker ? styles.adjustBtnActive : ''}`}
                            onClick={() => setShowColorPicker(!showColorPicker)}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="4" y1="21" x2="4" y2="14" />
                                <line x1="4" y1="10" x2="4" y2="3" />
                                <line x1="12" y1="21" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12" y2="3" />
                                <line x1="20" y1="21" x2="20" y2="16" />
                                <line x1="20" y1="12" x2="20" y2="3" />
                                <line x1="1" y1="14" x2="7" y2="14" />
                                <line x1="9" y1="8" x2="15" y2="8" />
                                <line x1="17" y1="16" x2="23" y2="16" />
                            </svg>
                            <span>Adjust</span>
                        </button>
                    </div>
                </div>

                <div className={styles.colorPalette}>
                    <button
                        className={`${styles.colorChip} ${!selectedColorId ? styles.colorChipActive : ""}`}
                        onClick={() => onColorSelect(null)}
                    >
                        <div className={styles.colorSwatch} style={{ background: 'var(--bg-tertiary)' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </div>
                        <span className={styles.colorLabel}>Original</span>
                    </button>
                    {HAIR_COLORS.map((color) => (
                        <button
                            key={color.id}
                            className={`${styles.colorChip} ${selectedColorId === color.id ? styles.colorChipActive : ""}`}
                            onClick={() => onColorSelect(color.id)}
                        >
                            <div
                                className={styles.colorSwatch}
                                style={{
                                    background: selectedColorId === color.id
                                        ? `radial-gradient(circle at 30% 30%, ${adjustColorIntensity(color.hex, Math.max(colorIntensity - 20, 10))}, ${color.hex})`
                                        : `radial-gradient(circle at 30% 30%, ${adjustColorIntensity(color.hex, 50)}, ${color.hex})`,
                                }}
                            />
                            <span className={styles.colorLabel}>{color.label}</span>
                        </button>
                    ))}
                </div>

                {/* 인텐시티 슬라이더 */}
                {showColorPicker && (
                    <div className={styles.intensityPanel}>
                        <div className={styles.intensityHeader}>
                            <span className={styles.intensityLabel}>Color Intensity</span>
                            <span className={styles.intensityValue}>{colorIntensity}%</span>
                        </div>
                        {selectedColor && (
                            <div className={styles.gradientPreview}>
                                <div
                                    className={styles.gradientBar}
                                    style={{ background: `linear-gradient(90deg, ${adjustColorIntensity(selectedColor.hex, 10)}, ${selectedColor.hex})` }}
                                />
                                <div
                                    className={styles.gradientMarker}
                                    style={{ left: `${(colorIntensity - 10) / 90 * 100}%` }}
                                />
                            </div>
                        )}
                        <input
                            type="range"
                            min="10"
                            max="100"
                            value={colorIntensity}
                            onChange={(e) => setColorIntensity(Number(e.target.value))}
                            className={styles.slider}
                            style={selectedColor ? {
                                background: `linear-gradient(90deg, ${adjustColorIntensity(selectedColor.hex, 10)} 0%, ${selectedColor.hex} 100%)`
                            } : {}}
                        />
                        <div className={styles.sliderMarks}>
                            <span>Subtle</span>
                            <span>Natural</span>
                            <span>Vivid</span>
                        </div>
                    </div>
                )}
            </section>

            {/* ── 스타일 썸네일 ── */}
            <section className={styles.styleGallery}>
                {filteredStyles.length > 0 ? (
                    <>
                        <div
                            className={styles.styleStrip}
                            ref={stripRef}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onWheel={handleWheel}
                            onScroll={handleScroll}
                        >
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
                        {totalPages > 1 && (
                            <div className={styles.pageIndicator}>
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <div
                                        key={i}
                                        className={`${styles.dot} ${i === currentPage ? styles.dotActive : ""}`}
                                    />
                                ))}
                            </div>
                        )}
                    </>
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

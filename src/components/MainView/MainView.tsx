"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import styles from "./MainView.module.css";
import type { Hairstyle } from "@/data/demo";
import { CATEGORIES, GENDERS, HAIR_COLORS } from "@/data/demo";



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
    salonName,
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

    const [colorIntensity, setColorIntensity] = useState(70);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);

    // 드래그 스크롤 상태
    const dragState = useRef({ isDragging: false, startX: 0, scrollLeft: 0, moved: false });

    // 마우스 드래그 스크롤
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

    // 마우스 휠 → 수평 스크롤
    const handleWheel = useCallback((e: React.WheelEvent) => {
        const strip = stripRef.current;
        if (!strip) return;
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.preventDefault();
            strip.scrollLeft += e.deltaY;
        }
    }, []);

    // 스크롤 위치 → 페이지 인디케이터 동기화
    const handleScroll = useCallback(() => {
        const strip = stripRef.current;
        if (!strip || strip.scrollWidth <= strip.clientWidth) return;
        const maxScroll = strip.scrollWidth - strip.clientWidth;
        const progress = strip.scrollLeft / maxScroll;
        const pages = Math.ceil(strip.children.length / 4);
        const page = Math.min(Math.round(progress * (pages - 1)), pages - 1);
        setCurrentPage(page);
    }, []);

    // 카테고리/성별 변경 시 스크롤 초기화
    useEffect(() => {
        if (stripRef.current) stripRef.current.scrollLeft = 0;
        setCurrentPage(0);
    }, [activeGender, activeCategory]);



    // 사진 업로드 핸들러
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

    // Ctrl+V 클립보드 이미지 붙여넣기 핸들러
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

    // 클립보드 이벤트 등록
    useEffect(() => {
        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, [handlePaste]);

    // 성별 → 카테고리별 2단계 필터링
    const genderFiltered = hairstyles.filter((h) => h.gender === activeGender);
    const filteredStyles =
        activeCategory === "best"
            ? genderFiltered.filter((h) => h.isBest)
            : genderFiltered.filter((h) => h.category === activeCategory);

    // 선택된 스타일 정보
    const selectedStyle = hairstyles.find((h) => h.id === selectedStyleId);

    // 프리뷰 이미지 — 항상 사용자 사진만 표시 (스타일 사진으로 교체하지 않음)
    const previewImage = userPhoto;

    const canSynthesize = userPhoto && selectedStyleId;

    // 페이지 인디케이터 계산
    const totalPages = Math.ceil(filteredStyles.length / 4);

    return (
        <div className={styles.main}>
            {/* 헤더 — YUKINIAN 로고 */}
            <header className={styles.header}>
                <h1 className={styles.salonName}>YUKINIAN</h1>
            </header>

            {/* 성별 선택 — 로고 바로 아래 */}
            <nav className={styles.genderTabs}>
                {GENDERS.map((g) => (
                    <button
                        key={g.id}
                        className={`${styles.genderTab} ${activeGender === g.id ? styles.genderTabActive : ""}`}
                        onClick={() => {
                            setActiveGender(g.id as "female" | "male");
                            setActiveCategory("best");
                        }}
                    >
                        {g.label}
                    </button>
                ))}
            </nav>

            {/* 메인 프리뷰 카드 */}
            <section className={styles.previewSection}>
                <div className={styles.previewCard}>
                    <div className={styles.previewCardInner}>
                        {previewImage ? (
                            <>
                                <img
                                    src={previewImage}
                                    alt="Preview"
                                    className={styles.previewImg}
                                />



                                {/* 사진 변경 버튼 (우상단) */}
                                <button
                                    className={styles.compareToggle}
                                    onClick={() => onPhotoChange()}
                                    title="Change photo"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                                        <polyline points="21 3 21 9 15 9" />
                                    </svg>
                                </button>

                                {/* 선택된 스타일 이름 오버레이 (하단) */}
                                {selectedStyle && (
                                    <div className={styles.compareBar}>
                                        <span className={styles.selectedStyleLabel}>
                                            ✨ {selectedStyle.name}
                                        </span>
                                    </div>
                                )}


                            </>
                        ) : (
                            <div
                                className={styles.uploadArea}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className={styles.uploadIconWrap}>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                                        <circle cx="12" cy="13" r="4" />
                                    </svg>
                                </div>
                                <span className={styles.uploadText}>Upload Your Photo</span>
                                <span className={styles.uploadSubtext}>
                                    Tap to select or Ctrl+V to paste
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                <p className={styles.privacyNotice}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 4, verticalAlign: 'middle' }}>
                        <path d="M12 1C8.676 1 6 3.676 6 7v2H4v14h16V9h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4z" />
                    </svg>
                    Photos are not stored and deleted after one-time use
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />
            </section>

            {/* 카테고리 탭 */}
            <nav className={styles.categoryTabs}>
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.id}
                        className={`${styles.tab} ${activeCategory === cat.id ? styles.tabActive : ""}`}
                        onClick={() => setActiveCategory(cat.id)}
                    >
                        {cat.label}
                    </button>
                ))}
            </nav>

            {/* 컬러 선택 */}
            <section className={styles.colorSection}>
                <div className={styles.colorHeader}>
                    <h3 className={styles.sectionTitle}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: 'middle' }}>
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="12" r="6" />
                            <circle cx="12" cy="12" r="2" />
                        </svg>
                        Hair Color
                    </h3>
                    <button
                        className={`${styles.intensityToggle} ${showColorPicker ? styles.intensityToggleActive : ''}`}
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
                        Adjust
                    </button>
                </div>
                <div className={styles.colorPalette}>
                    <button
                        className={`${styles.colorChip} ${!selectedColorId ? styles.colorSelected : ""}`}
                        onClick={() => onColorSelect(null)}
                        title="Original"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                    {HAIR_COLORS.map((color) => (
                        <button
                            key={color.id}
                            className={`${styles.colorChip} ${selectedColorId === color.id ? styles.colorSelected : ""}`}
                            style={{ backgroundColor: color.hex }}
                            onClick={() => onColorSelect(color.id)}
                            title={color.label}
                        />
                    ))}
                </div>

                {/* 컬러 감도 슬라이더 */}
                {showColorPicker && (
                    <div className={styles.intensitySlider}>
                        <div className={styles.sliderHeader}>
                            <span className={styles.sliderLabel}>Intensity</span>
                            <span className={styles.sliderValue}>{colorIntensity}%</span>
                        </div>
                        <input
                            type="range"
                            min="10"
                            max="100"
                            value={colorIntensity}
                            onChange={(e) => setColorIntensity(Number(e.target.value))}
                            className={styles.slider}
                        />
                        <div className={styles.sliderMarks}>
                            <span>Subtle</span>
                            <span>Vivid</span>
                        </div>
                    </div>
                )}
            </section>

            {/* 스타일 썸네일 스트립 (수평 스크롤) */}
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
                                    className={`${styles.styleThumb} ${selectedStyleId === style.id ? styles.styleSelected : ""}`}
                                    onClick={() => onStyleSelect(style.id)}
                                >
                                    <div className={styles.thumbImageWrap}>
                                        {style.imageUrl ? (
                                            <img
                                                src={style.imageUrl}
                                                alt={style.name}
                                                className={styles.thumbImg}
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className={styles.thumbPlaceholder}>
                                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
                                            <div className={styles.checkMark}>
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <span className={styles.thumbName}>{style.name}</span>
                                </button>
                            ))}
                        </div>

                        {/* 페이지 인디케이터 */}
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
                        <p>No styles available in this category</p>
                    </div>
                )}
            </section>

            {/* 합성 버튼 */}
            {canSynthesize && (
                <div className={styles.synthesizeWrap}>
                    <button
                        className={styles.synthesizeBtn}
                        onClick={onSynthesize}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className={styles.spinner} /> Processing...
                            </>
                        ) : (
                            <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: 'middle' }}>
                                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                                </svg>
                                Synthesize
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}

"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import styles from "./MainView.module.css";
import type { Hairstyle } from "@/data/demo";
import { CATEGORIES, GENDERS } from "@/data/demo";
import ColorPalette from "@/components/ColorPalette/ColorPalette";
import AdminPanel from "@/components/AdminPanel/AdminPanel";
import ReservationModal from "@/components/ReservationModal/ReservationModal";
import { useAppStore } from "@/store/useAppStore";
import {
    extractHairMask,
    applyHairColor,
    imageUrlToImageData,
    imageDataToDataUrl,
    type HairMaskResult,
} from "@/services/hairColorService";

// 합성 진행 단계
const SYNTHESIS_STAGES = [
    { id: 1, label: "분석", message: "사진을 분석하고 있어요", icon: "🔍" },
    { id: 2, label: "변환", message: "헤어스타일을 적용 중", icon: "✂️" },
    { id: 3, label: "보정", message: "자연스럽게 보정 중", icon: "✨" },
    { id: 4, label: "완성", message: "거의 다 됐어요!", icon: "🎨" },
];

interface MainViewProps {
    salonId: string;
    salonName: string;
    hairstyles: Hairstyle[];
    userPhoto: string | null;
    selectedStyleId: string | null;
    selectedColor: string | null;
    resultImage: string | null;
    onPhotoSelect: (dataUrl: string) => void;
    onPhotoChange: () => void;
    onStyleSelect: (id: string) => void;
    onColorSelect: (hex: string | null) => void;
    onSynthesize: () => void;
    onResynthesize: (colorHex: string) => void;
    onClearResult: () => void;
    isLoading: boolean;
}

export default function MainView({
    salonId,
    salonName,
    hairstyles,
    userPhoto,
    selectedStyleId,
    selectedColor,
    resultImage,
    onPhotoSelect,
    onPhotoChange,
    onStyleSelect,
    onColorSelect,
    onSynthesize,
    onResynthesize,
    onClearResult,
    isLoading,
}: MainViewProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const styleGridRef = useRef<HTMLDivElement>(null);
    const [activeGender, setActiveGender] = useState<"female" | "male">("female");
    const [activeCategory, setActiveCategory] = useState("best");

    // 합성 진행 단계 시뮬레이션
    const [synthStage, setSynthStage] = useState(0);
    const [synthProgress, setSynthProgress] = useState(0);

    // 블러 reveal 상태
    const [showReveal, setShowReveal] = useState(false);

    // Before/After 비교 모드
    const [showCompare, setShowCompare] = useState(false);
    const [sliderPos, setSliderPos] = useState(50);
    const compareRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);

    // 머리색 변경 (HSL 실시간 프리뷰 + AI 재합성)
    const [postColorHex, setPostColorHex] = useState<string | null>(null);
    const [showColorAdjust, setShowColorAdjust] = useState(false);
    const [hairMask, setHairMask] = useState<HairMaskResult | null>(null);
    const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);
    const [colorPreviewUrl, setColorPreviewUrl] = useState<string | null>(null);
    const [isMaskLoading, setIsMaskLoading] = useState(false);
    const [maskLoadMsg, setMaskLoadMsg] = useState("");

    // 저장/공유 상태
    const [isSaved, setIsSaved] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastText, setToastText] = useState("");
    const [canShare, setCanShare] = useState(false);

    // 예약 모달 상태
    const [showReservation, setShowReservation] = useState(false);



    // 관리자 모드 (로고 5탭)
    const [showAdmin, setShowAdmin] = useState(false);
    const logoTapRef = useRef<{ count: number; timer: ReturnType<typeof setTimeout> | null }>({
        count: 0,
        timer: null,
    });

    const handleLogoTap = useCallback(() => {
        const tap = logoTapRef.current;
        tap.count++;
        if (tap.timer) clearTimeout(tap.timer);
        if (tap.count >= 5) {
            tap.count = 0;
            const pw = prompt("관리자 비밀번호를 입력하세요:");
            if (pw !== null && pw !== "") {
                // 서버 API로 비밀번호 검증 (살롱별 비밀번호 + 슈퍼관리자 비밀번호 둘 다 지원)
                fetch("/api/admin", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ password: pw, salonId }),
                })
                    .then((res) => res.json())
                    .then((data) => {
                        if (data.success) {
                            setShowAdmin(true);
                        } else {
                            alert(data.error || "비밀번호가 틀렸습니다.");
                        }
                    })
                    .catch(() => {
                        alert("서버 연결에 실패했습니다.");
                    });
            }
        } else {
            tap.timer = setTimeout(() => { tap.count = 0; }, 3000);
        }
    }, [salonId]);


    // 공유 가능 여부 확인
    useEffect(() => {
        setCanShare(typeof navigator !== 'undefined' && !!navigator.share);
    }, []);

    // 합성 로딩 시뮬레이션
    useEffect(() => {
        if (!isLoading) {
            setSynthStage(0);
            setSynthProgress(0);
            return;
        }

        // 프로그레스 증가
        const progressInterval = setInterval(() => {
            setSynthProgress((prev) => {
                if (prev >= 92) return prev;
                const increment = prev < 30 ? 2 : prev < 60 ? 1.2 : prev < 80 ? 0.6 : 0.3;
                return Math.min(prev + increment, 92);
            });
        }, 300);

        // 단계 전환
        const stageTimers = [
            setTimeout(() => setSynthStage(1), 2000),
            setTimeout(() => setSynthStage(2), 6000),
            setTimeout(() => setSynthStage(3), 12000),
        ];

        return () => {
            clearInterval(progressInterval);
            stageTimers.forEach(clearTimeout);
        };
    }, [isLoading]);


    // 합성 결과 나오면 → 백그라운드에서 마스크 사전 추출
    useEffect(() => {
        if (!resultImage || hairMask) return;
        let cancelled = false;
        (async () => {
            try {
                const mask = await extractHairMask(resultImage);
                if (cancelled) return;
                setHairMask(mask);
                const imgData = await imageUrlToImageData(resultImage, mask.width, mask.height);
                if (cancelled) return;
                setOriginalImageData(imgData);
            } catch (err) {
                console.warn("[HairColor] 마스크 사전 추출 실패:", err);
            }
        })();
        return () => { cancelled = true; };
    }, [resultImage]); // eslint-disable-line react-hooks/exhaustive-deps

    // 결과 이미지 등장 시 블러 reveal 트리거
    useEffect(() => {
        if (resultImage) {
            setShowReveal(true);
            setIsSaved(false);
            setShowCompare(false);
            setShowColorAdjust(false);
            setPostColorHex(null);
            setColorPreviewUrl(null);
            setHairMask(null);
            setOriginalImageData(null);
            const timer = setTimeout(() => setShowReveal(false), 1500);
            return () => clearTimeout(timer);
        }
    }, [resultImage]);

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

    // Before/After 슬라이더
    const updateSlider = useCallback((clientX: number) => {
        if (!compareRef.current) return;
        const rect = compareRef.current.getBoundingClientRect();
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
        if (!resultImage) return;
        try {
            const response = await fetch(resultImage);
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
                    showToastMsg("이미지가 저장되었습니다");
                    return;
                } catch {
                    // 사용자 취소 → fallback
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
            showToastMsg("이미지가 저장되었습니다");
        } catch (err) {
            console.error('Save failed:', err);
        }
    }, [resultImage]);

    // 공유
    const handleShare = useCallback(async () => {
        if (!resultImage || !navigator.share) return;
        try {
            const response = await fetch(resultImage);
            const blob = await response.blob();
            const file = new File([blob], 'hair-studio-result.png', { type: 'image/png' });
            await navigator.share({ title: 'AI Hair Studio 결과', files: [file] });
        } catch {
            // 공유 취소
        }
    }, [resultImage]);

    // 토스트
    const showToastMsg = (msg: string) => {
        setToastText(msg);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
    };

    // 다시 시도
    const handleRetry = useCallback(() => {
        onClearResult();
    }, [onClearResult]);

    // 새 사진으로
    const handleNewPhoto = useCallback(() => {
        onClearResult();
        onPhotoChange();
    }, [onClearResult, onPhotoChange]);

    // 컬러 버튼 클릭: 패널 토글 + 마스크 추출
    const handleOpenColorAdjust = useCallback(async () => {
        if (showColorAdjust) {
            setShowColorAdjust(false);
            setColorPreviewUrl(null);
            setPostColorHex(null);
            return;
        }
        setShowColorAdjust(true);

        // 이미 마스크 있으면 재사용
        if (hairMask && originalImageData) return;

        if (!resultImage) return;
        setIsMaskLoading(true);
        try {
            const mask = await extractHairMask(resultImage, setMaskLoadMsg);
            setHairMask(mask);
            const imgData = await imageUrlToImageData(resultImage, mask.width, mask.height);
            setOriginalImageData(imgData);
        } catch (err) {
            console.error("Hair mask extraction failed:", err);
            setMaskLoadMsg("머리카락 감지 실패. 다시 시도해주세요.");
        } finally {
            setIsMaskLoading(false);
        }
    }, [showColorAdjust, hairMask, originalImageData, resultImage]);

    // 색상 선택 시 HSL 실시간 프리뷰 (Lightness 보존)
    const handlePostColorSelect = useCallback((hex: string | null) => {
        setPostColorHex(hex);
        if (!hex || !hairMask || !originalImageData) {
            setColorPreviewUrl(null);
            return;
        }
        // ★ HSL L보존 방식으로 실시간 프리뷰
        const modified = applyHairColor(originalImageData, hairMask, hex, 95);
        const dataUrl = imageDataToDataUrl(modified);
        setColorPreviewUrl(dataUrl);
    }, [hairMask, originalImageData]);

    // AI 재합성 (최종 고품질)
    const handleResynthesize = useCallback(() => {
        if (!postColorHex) return;
        onResynthesize(postColorHex);
        setShowColorAdjust(false);
        setColorPreviewUrl(null);
    }, [postColorHex, onResynthesize]);

    // 필터링
    const genderFiltered = hairstyles.filter((h) => h.gender === activeGender);
    const filteredStyles =
        activeCategory === "best"
            ? genderFiltered.filter((h) => h.isBest)
            : genderFiltered.filter((h) => h.category === activeCategory);

    const selectedStyle = hairstyles.find((h) => h.id === selectedStyleId);
    const previewImage = userPhoto;
    const canSynthesize = userPhoto && selectedStyleId;



    // 현재 합성 단계 정보
    const currentStage = SYNTHESIS_STAGES[synthStage] || SYNTHESIS_STAGES[0];

    return (
        <div className={styles.main}>
            {/* ── 헤더 ── */}
            <header className={styles.header}>
                <h1 className={styles.logo} onClick={handleLogoTap} style={{ cursor: 'default', userSelect: 'none' }}>{salonName || "AI Hair Studio"}</h1>
            </header>

            {/* ── 섹션 1: 성별 선택 ── */}
            <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <span className={styles.sectionIcon}>👤</span>
                    <span className={styles.sectionTitle}>성별 선택</span>
                </div>
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
            </div>

            {/* ── 섹션 2: 사진 / 합성 결과 영역 ── */}
            <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <span className={styles.sectionIcon}>{resultImage ? "✨" : "📷"}</span>
                    <span className={styles.sectionTitle}>
                        {resultImage ? "합성 결과" : "사진 업로드"}
                    </span>
                    {resultImage && (
                        <div className={styles.resultBadge}>AI Generated</div>
                    )}
                </div>
                <div className={styles.previewCard}>
                    {/* === 합성 결과 표시 === */}
                    {resultImage && !isLoading && (
                        <>
                            {showCompare ? (
                                /* Before/After 비교 모드 */
                                <div
                                    className={styles.compareContainer}
                                    ref={compareRef}
                                    onPointerDown={handlePointerDown}
                                    onPointerMove={handlePointerMove}
                                    onPointerUp={handlePointerUp}
                                    onPointerCancel={handlePointerUp}
                                >
                                    <img
                                        src={resultImage}
                                        alt="합성 결과"
                                        className={styles.compareImg}
                                        draggable={false}
                                    />
                                    <div
                                        className={styles.beforeOverlay}
                                        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                                    >
                                        <img
                                            src={userPhoto || ""}
                                            alt="원본"
                                            className={styles.compareImg}
                                            draggable={false}
                                        />
                                    </div>
                                    <div className={styles.sliderLine} style={{ left: `${sliderPos}%` }}>
                                        <div className={styles.sliderHandle}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                                <polyline points="9 18 15 12 9 6" />
                                                <polyline points="15 18 9 12 15 6" />
                                            </svg>
                                        </div>
                                    </div>
                                    <span className={`${styles.compareLabel} ${styles.labelBefore}`}>Before</span>
                                    <span className={`${styles.compareLabel} ${styles.labelAfter}`}>After</span>
                                </div>
                            ) : (
                                /* 결과 이미지 표시 */
                                <div className={styles.previewInner}>
                                    <img
                                        src={colorPreviewUrl || resultImage}
                                        alt="합성 결과"
                                        className={`${styles.previewImg} ${showReveal ? styles.resultReveal : ""}`}
                                    />
                                </div>
                            )}
                        </>
                    )}

                    {/* === 로딩 중 (합성 단계 표시) === */}
                    {isLoading && previewImage && (
                        <div className={styles.previewInner}>
                            <img
                                src={previewImage}
                                alt="Processing"
                                className={`${styles.previewImg} ${styles.synthProcessing}`}
                            />
                            <div className={styles.synthOverlay}>
                                <div className={styles.synthIcon}>{currentStage.icon}</div>
                                <span className={styles.synthMessage}>{currentStage.message}</span>
                                <div className={styles.synthSteps}>
                                    {SYNTHESIS_STAGES.map((s, idx) => (
                                        <div
                                            key={s.id}
                                            className={`${styles.synthStep} ${idx === synthStage ? styles.synthStepActive
                                                : idx < synthStage ? styles.synthStepDone : ""
                                                }`}
                                        >
                                            <div className={styles.synthStepDot}>
                                                {idx < synthStage ? (
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                ) : (
                                                    s.id
                                                )}
                                            </div>
                                            <span className={styles.synthStepLabel}>{s.label}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className={styles.synthProgressBar}>
                                    <div
                                        className={styles.synthProgressFill}
                                        style={{ width: `${synthProgress}%` }}
                                    />
                                </div>
                                <span className={styles.synthPercent}>{Math.round(synthProgress)}%</span>
                            </div>
                        </div>
                    )}

                    {/* === 사진 미리보기 (합성 전) === */}
                    {previewImage && !resultImage && !isLoading && (
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
                    )}

                    {/* === 사진 없음 (업로드 영역) === */}
                    {!previewImage && !isLoading && (
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
                            <span className={styles.uploadText}>사진 선택</span>
                            <span className={styles.uploadHint}>터치하여 선택<br />Ctrl+V 붙여넣기</span>
                        </div>
                    )}
                </div>

                {/* 결과 인라인 액션 버튼들 */}
                {resultImage && !isLoading && (
                    <div className={styles.resultActions}>
                        <button
                            className={`${styles.resultActionBtn} ${showCompare ? styles.resultActionActive : ""}`}
                            onClick={() => setShowCompare(!showCompare)}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="2" x2="12" y2="22" />
                                <polyline points="8 6 4 12 8 18" />
                                <polyline points="16 6 20 12 16 18" />
                            </svg>
                            <span>{showCompare ? "결과만" : "비교"}</span>
                        </button>
                        <button className={styles.resultActionBtn} onClick={handleSave}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            <span>{isSaved ? "저장됨 ✓" : "저장"}</span>
                        </button>
                        {canShare && (
                            <button className={styles.resultActionBtn} onClick={handleShare}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="18" cy="5" r="3" />
                                    <circle cx="6" cy="12" r="3" />
                                    <circle cx="18" cy="19" r="3" />
                                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                </svg>
                                <span>공유</span>
                            </button>
                        )}
                        <button
                            className={`${styles.resultActionBtn} ${showColorAdjust ? styles.resultActionActive : ""}`}
                            onClick={handleOpenColorAdjust}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 2a7 7 0 017 7c0 5-7 13-7 13" />
                            </svg>
                            <span>컬러</span>
                        </button>
                        <button
                            className={`${styles.resultActionBtn} ${styles.reserveActionBtn}`}
                            onClick={() => setShowReservation(true)}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <span>예약</span>
                        </button>
                        <button className={`${styles.resultActionBtn} ${styles.retryActionBtn}`} onClick={handleRetry}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12a9 9 0 11-6.219-8.56" />
                                <polyline points="21 3 21 9 15 9" />
                            </svg>
                            <span>다시</span>
                        </button>
                    </div>
                )}

                {/* HSL 실시간 프리뷰 + AI 재합성 패널 */}
                {showColorAdjust && resultImage && !isLoading && (
                    <div className={styles.colorAdjustPanel}>
                        {isMaskLoading ? (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <div className={styles.spinner} style={{ margin: '0 auto 8px' }} />
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{maskLoadMsg}</span>
                            </div>
                        ) : (
                            <>
                                <ColorPalette
                                    selectedColor={postColorHex}
                                    onColorSelect={handlePostColorSelect}
                                />
                                {postColorHex && (
                                    <div className={styles.colorAdjustActions}>
                                        <button
                                            className={styles.colorResetBtn}
                                            onClick={() => {
                                                setPostColorHex(null);
                                                setColorPreviewUrl(null);
                                            }}
                                        >
                                            초기화
                                        </button>
                                        <button
                                            className={styles.colorApplyBtn}
                                            onClick={handleResynthesize}
                                        >
                                            ✨ AI로 자연스럽게 적용
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {!resultImage && (
                    <p className={styles.privacyNote}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 4, verticalAlign: 'middle' }}>
                            <path d="M12 1C8.676 1 6 3.676 6 7v2H4v14h16V9h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4z" />
                        </svg>
                        사진은 저장되지 않으며 일회성으로 사용됩니다
                    </p>
                )}
            </div>

            {/* 파일 선택용 */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />

            {/* ── 섹션 2.5: 헤어 컬러 (합성 전 선택) ── */}
            {!resultImage && (
                <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionIcon}>🎨</span>
                        <span className={styles.sectionTitle}>헤어 컬러</span>
                    </div>
                    <ColorPalette
                        selectedColor={selectedColor}
                        onColorSelect={onColorSelect}
                    />
                </div>
            )}

            {/* ── 섹션 3: 헤어 스타일 ── */}
            <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                    <span className={styles.sectionIcon}>✂️</span>
                    <span className={styles.sectionTitle}>헤어 스타일</span>
                </div>

                {/* 카테고리 탭 */}
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

                {/* 스타일 갤러리 */}
                <section className={styles.styleGallery}>
                    {filteredStyles.length > 0 ? (
                        <div
                            className={styles.styleGrid}
                            ref={styleGridRef}
                            onWheel={(e) => {
                                if (!styleGridRef.current) return;
                                if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                                    e.preventDefault();
                                    styleGridRef.current.scrollLeft += e.deltaY;
                                }
                            }}
                        >
                            {filteredStyles.map((style) => (
                                <button
                                    key={style.id}
                                    className={`${styles.styleCard} ${selectedStyleId === style.id ? styles.styleCardSelected : ""}`}
                                    onClick={() => onStyleSelect(style.id)}
                                >
                                    <div className={styles.styleImgWrap}>
                                        {style.imageUrl ? (
                                            <Image
                                                src={style.imageUrl}
                                                alt={style.name}
                                                fill
                                                sizes="(max-width: 768px) 30vw, 160px"
                                                className={styles.styleImg}
                                                style={{ objectFit: "cover" }}
                                                loading="lazy"
                                                quality={90}
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
            </div>

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
                        ) : resultImage ? (
                            <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                                    <polyline points="21 3 21 9 15 9" />
                                </svg>
                                다른 스타일로 합성
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

            {/* 토스트 */}
            {showToast && (
                <div className={styles.toast}>{toastText}</div>
            )}

            {/* 관리자 패널 */}
            {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} salonId={salonId} />}

            {/* 예약 모달 */}
            {showReservation && (
                <ReservationModal
                    salonId={salonId}
                    styleName={selectedStyle?.name}
                    colorHex={selectedColor}
                    resultImageUrl={resultImage}
                    onClose={() => setShowReservation(false)}
                />
            )}
            {/* 개인정보처리방침 / 이용약관 */}
            <div style={{
                textAlign: 'center',
                padding: '16px 0 24px',
                fontSize: 12,
                color: 'var(--text-tertiary, #999)',
                borderTop: '1px solid var(--border-color, #eee)',
                marginTop: 24,
            }}>
                <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', marginRight: 16 }}>개인정보처리방침</a>
                <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>이용약관</a>
                <p style={{ marginTop: 8, opacity: 0.7 }}>© 2026 AI Hair Studio</p>
            </div>
        </div>
    );
}

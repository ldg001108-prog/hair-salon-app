"use client";

import { useCallback, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { DEMO_SALON, DEMO_HAIRSTYLES, type Salon, type Hairstyle } from "@/data/demo";
import { preloadModel } from "@/services/hairColorService";
import Splash from "@/components/Splash/Splash";
import MainView from "@/components/MainView/MainView";

export default function SalonPage() {
    const params = useParams();
    const salonId = (params?.salonId as string) || "demo";

    // Zustand 스토어
    const {
        step,
        setStep,
        userPhoto,
        setUserPhoto,
        selectedStyleId,
        setSelectedStyleId,
        selectedColor,
        setSelectedColor,
        resultImage,
        setResultImage,
        isLoading,
        setIsLoading,
        addHistory,
        incrementApiCall,
        addErrorLog,
    } = useAppStore();

    // 살롱 데이터 (동적 로드)
    const [salon, setSalon] = useState<Salon>(DEMO_SALON);
    const [hairstyles, setHairstyles] = useState<Hairstyle[]>(DEMO_HAIRSTYLES);
    const [dataLoaded, setDataLoaded] = useState(false);

    // 살롱 데이터 로드
    useEffect(() => {
        async function loadSalonData() {
            try {
                // API에서 살롱 정보 + 스타일 로드
                const [salonRes, stylesRes] = await Promise.all([
                    fetch(`/api/salon/${salonId}`).then(r => r.json()).catch(() => null),
                    fetch(`/api/admin/styles?salonId=${salonId}`).then(r => r.json()).catch(() => null),
                ]);

                // 살롱 정보가 있으면 적용
                if (salonRes?.success && salonRes.salon) {
                    setSalon(salonRes.salon);
                    // 동적 테마 컬러 CSS 변수 설정
                    const tc = salonRes.salon.themeColor || "#2563EB";
                    document.documentElement.style.setProperty("--salon-theme", tc);
                    document.documentElement.style.setProperty("--salon-theme-light", tc + "22");
                    document.documentElement.style.setProperty("--salon-theme-hover", tc + "dd");
                }

                // 스타일 데이터가 있으면 적용
                if (stylesRes?.success && stylesRes.hairstyles?.length > 0) {
                    setHairstyles(stylesRes.hairstyles);
                }
            } catch {
                // 로드 실패 시 데모 데이터 유지
                console.log("[SalonPage] 데모 데이터 사용");
            } finally {
                setDataLoaded(true);
            }
        }

        loadSalonData();
    }, [salonId]);

    // 토스트 에러 메시지
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // 토스트 자동 숨김
    useEffect(() => {
        if (!toastMessage) return;
        const timer = setTimeout(() => setToastMessage(null), 4000);
        return () => clearTimeout(timer);
    }, [toastMessage]);

    // 스플래시 완료 → 메인
    const handleSplashComplete = useCallback(() => {
        setStep("main");
    }, [setStep]);

    // 이미지 리사이징 (최대 2048px, 품질 0.92 — 2K 대응)
    const resizeImage = useCallback((dataUrl: string, maxSize: number = 2048): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const { width, height } = img;
                if (width <= maxSize && height <= maxSize) {
                    resolve(dataUrl);
                    return;
                }
                const ratio = Math.min(maxSize / width, maxSize / height);
                const newW = Math.round(width * ratio);
                const newH = Math.round(height * ratio);

                const canvas = document.createElement("canvas");
                canvas.width = newW;
                canvas.height = newH;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(img, 0, 0, newW, newH);
                    resolve(canvas.toDataURL("image/jpeg", 0.92));
                } else {
                    resolve(dataUrl);
                }
            };
            img.onerror = () => resolve(dataUrl);
            img.src = dataUrl;
        });
    }, []);

    // 사진 선택 (리사이징 적용)
    const handlePhotoSelect = useCallback(
        async (dataUrl: string) => {
            const resized = await resizeImage(dataUrl);
            setUserPhoto(resized);
            setResultImage(null);
        },
        [setUserPhoto, setResultImage, resizeImage]
    );

    // 사진 변경
    const handlePhotoChange = useCallback(() => {
        setUserPhoto(null);
        setSelectedStyleId(null);
        setSelectedColor(null);
        setResultImage(null);
    }, [setUserPhoto, setSelectedStyleId, setSelectedColor, setResultImage]);

    // 합성 실행 — Gemini AI API
    const handleSynthesize = useCallback(async () => {
        if (!userPhoto || !selectedStyleId) return;

        setIsLoading(true);

        try {
            const style = hairstyles.find((h) => h.id === selectedStyleId);
            const colorHex = selectedColor || undefined;

            if (!style) {
                setToastMessage("헤어스타일을 선택해주세요.");
                setIsLoading(false);
                return;
            }

            // hex → HSL 변환
            let colorSaturation: number | undefined;
            let colorLightness: number | undefined;
            if (colorHex) {
                const r = parseInt(colorHex.slice(1, 3), 16) / 255;
                const g = parseInt(colorHex.slice(3, 5), 16) / 255;
                const b = parseInt(colorHex.slice(5, 7), 16) / 255;
                const max = Math.max(r, g, b), min = Math.min(r, g, b);
                const l = (max + min) / 2;
                let s = 0;
                if (max !== min) {
                    s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
                }
                colorSaturation = Math.round(s * 100);
                colorLightness = Math.round(l * 100);
            }

            const response = await fetch("/api/transform", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    photo: userPhoto,
                    styleName: style.name,
                    styleDescription: style.story,
                    category: style.category,
                    salonId,
                    colorName: colorHex ? `Custom (${colorHex})` : undefined,
                    colorHex: colorHex,
                    colorIntensity: 85,
                    colorSaturation,
                    colorLightness,
                }),
            });

            const data = await response.json();

            if (data.success && data.resultImage) {
                setResultImage(data.resultImage);
                incrementApiCall(true);
                preloadModel();
                addHistory({
                    resultImage: data.resultImage,
                    styleName: style.name,
                    colorHex: colorHex || null,
                });
            } else {
                incrementApiCall(false);
                addErrorLog(data.error || "합성 실패", "handleSynthesize");
                setToastMessage(data.error || "합성에 실패했습니다. 다시 시도해주세요.");
            }
        } catch (error) {
            console.error("[Synthesize] Error:", error);
            incrementApiCall(false);
            addErrorLog(String(error), "handleSynthesize/network");
            setToastMessage("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
        } finally {
            setIsLoading(false);
        }
    }, [setIsLoading, setResultImage, userPhoto, selectedStyleId, selectedColor, hairstyles, addHistory, incrementApiCall, addErrorLog, salonId]);

    // 재합성 (후처리 컬러 변경)
    const handleResynthesize = useCallback(async (newColorHex: string) => {
        if (!userPhoto || !selectedStyleId) return;

        setSelectedColor(newColorHex);
        setIsLoading(true);

        try {
            const style = hairstyles.find((h) => h.id === selectedStyleId);
            if (!style) {
                setIsLoading(false);
                return;
            }

            const r = parseInt(newColorHex.slice(1, 3), 16) / 255;
            const g = parseInt(newColorHex.slice(3, 5), 16) / 255;
            const b = parseInt(newColorHex.slice(5, 7), 16) / 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            const l = (max + min) / 2;
            let s = 0;
            if (max !== min) {
                s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
            }

            const response = await fetch("/api/transform", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    photo: userPhoto,
                    styleName: style.name,
                    styleDescription: style.story,
                    category: style.category,
                    salonId,
                    colorName: `Custom (${newColorHex})`,
                    colorHex: newColorHex,
                    colorIntensity: 85,
                    colorSaturation: Math.round(s * 100),
                    colorLightness: Math.round(l * 100),
                }),
            });

            const data = await response.json();

            if (data.success && data.resultImage) {
                setResultImage(data.resultImage);
                incrementApiCall(true);
                addHistory({
                    resultImage: data.resultImage,
                    styleName: style.name,
                    colorHex: newColorHex,
                });
            } else {
                incrementApiCall(false);
                addErrorLog(data.error || "재합성 실패", "handleResynthesize");
                setToastMessage(data.error || "재합성에 실패했습니다.");
            }
        } catch (error) {
            console.error("[Resynthesize] Error:", error);
            incrementApiCall(false);
            addErrorLog(String(error), "handleResynthesize/network");
            setToastMessage("네트워크 오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, [userPhoto, selectedStyleId, hairstyles, setSelectedColor, setIsLoading, setResultImage, addHistory, incrementApiCall, addErrorLog, salonId]);

    // 결과 초기화 (다시 시도)
    const handleClearResult = useCallback(() => {
        setResultImage(null);
    }, [setResultImage]);

    return (
        <>
            {/* 스플래시 */}
            {step === "splash" && (
                <Splash
                    salonName={salon.name}
                    logoUrl={salon.logoUrl || undefined}
                    themeColor={salon.themeColor}
                    onComplete={handleSplashComplete}
                />
            )}

            {/* 메인 (합성 결과도 여기서 인라인 표시) */}
            {step === "main" && (
                <MainView
                    salonId={salonId}
                    salonName={salon.name}
                    hairstyles={hairstyles}
                    userPhoto={userPhoto}
                    selectedStyleId={selectedStyleId}
                    selectedColor={selectedColor}
                    resultImage={resultImage}
                    onPhotoSelect={handlePhotoSelect}
                    onPhotoChange={handlePhotoChange}
                    onStyleSelect={setSelectedStyleId}
                    onColorSelect={setSelectedColor}
                    onSynthesize={handleSynthesize}
                    onResynthesize={handleResynthesize}
                    onClearResult={handleClearResult}
                    isLoading={isLoading}
                />
            )}

            {/* 토스트 에러 메시지 */}
            {toastMessage && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: 100,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 10000,
                        background: 'var(--text-primary)',
                        color: 'var(--bg-primary)',
                        padding: '12px 20px',
                        borderRadius: 12,
                        fontSize: 14,
                        fontWeight: 600,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                        maxWidth: '80%',
                        textAlign: 'center',
                        animation: 'fadeIn 0.3s ease-out',
                    }}
                    onClick={() => setToastMessage(null)}
                >
                    ⚠️ {toastMessage}
                </div>
            )}
        </>
    );
}

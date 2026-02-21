"use client";

import { useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { DEMO_SALON, DEMO_HAIRSTYLES, HAIR_COLORS } from "@/data/demo";
import Splash from "@/components/Splash/Splash";
import MainView from "@/components/MainView/MainView";
import ResultView from "@/components/ResultView/ResultView";

export default function SalonPage() {
    // Zustand 스토어
    const {
        step,
        setStep,
        userPhoto,
        setUserPhoto,
        selectedStyleId,
        setSelectedStyleId,
        selectedColorId,
        setSelectedColorId,
        resultImage,
        setResultImage,
        isLoading,
        setIsLoading,
        reset,
    } = useAppStore();

    // 데모 데이터
    const salon = DEMO_SALON;
    const hairstyles = DEMO_HAIRSTYLES;

    // 스플래시 완료 → 메인
    const handleSplashComplete = useCallback(() => {
        setStep("main");
    }, [setStep]);

    // 이미지 리사이징 (최대 1280px, 품질 0.85)
    const resizeImage = useCallback((dataUrl: string, maxSize: number = 1280): Promise<string> => {
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
                    resolve(canvas.toDataURL("image/jpeg", 0.85));
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
        },
        [setUserPhoto, resizeImage]
    );

    // 사진 변경
    const handlePhotoChange = useCallback(() => {
        setUserPhoto(null);
        setSelectedStyleId(null);
        setSelectedColorId(null);
    }, [setUserPhoto, setSelectedStyleId, setSelectedColorId]);

    // 합성 실행 — Gemini AI API
    const handleSynthesize = useCallback(async () => {
        if (!userPhoto || !selectedStyleId) return;

        setIsLoading(true);

        try {
            const style = hairstyles.find((h) => h.id === selectedStyleId);
            const color = selectedColorId
                ? HAIR_COLORS.find((c) => c.id === selectedColorId)
                : null;
            const colorIntensity = useAppStore.getState().colorIntensity ?? 70;

            if (!style) {
                alert("헤어스타일을 선택해주세요.");
                setIsLoading(false);
                return;
            }

            const response = await fetch("/api/transform", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    photo: userPhoto,
                    styleName: style.name,
                    styleDescription: style.story,
                    colorName: color?.label || undefined,
                    colorHex: color?.hex || undefined,
                    colorIntensity: colorIntensity,
                }),
            });

            const data = await response.json();

            if (data.success && data.resultImage) {
                setResultImage(data.resultImage);
                setStep("result");
            } else {
                alert(data.error || "합성에 실패했습니다. 다시 시도해주세요.");
            }
        } catch (error) {
            console.error("[Synthesize] Error:", error);
            alert("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
        } finally {
            setIsLoading(false);
        }
    }, [setIsLoading, setResultImage, setStep, userPhoto, selectedStyleId, selectedColorId, hairstyles]);

    // 다시 시도
    const handleRetry = useCallback(() => {
        setSelectedStyleId(null);
        setSelectedColorId(null);
        setResultImage(null);
        setStep("main");
    }, [setSelectedStyleId, setSelectedColorId, setResultImage, setStep]);

    // 뒤로 가기
    const handleBack = useCallback(() => {
        setResultImage(null);
        setStep("main");
    }, [setResultImage, setStep]);

    // 선택된 스타일/색상 정보
    const selectedStyle = hairstyles.find((h) => h.id === selectedStyleId) || null;
    const colorIntensity = useAppStore.getState().colorIntensity ?? 70;

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

            {/* 메인 */}
            {step === "main" && (
                <MainView
                    salonName={salon.name}
                    hairstyles={hairstyles}
                    userPhoto={userPhoto}
                    selectedStyleId={selectedStyleId}
                    selectedColorId={selectedColorId}
                    onPhotoSelect={handlePhotoSelect}
                    onPhotoChange={handlePhotoChange}
                    onStyleSelect={setSelectedStyleId}
                    onColorSelect={setSelectedColorId}
                    onSynthesize={handleSynthesize}
                    isLoading={isLoading}
                />
            )}

            {/* 결과 */}
            {step === "result" && userPhoto && resultImage && (
                <ResultView
                    resultImage={resultImage}
                    userPhoto={userPhoto}
                    selectedStyle={selectedStyle}
                    selectedColorId={selectedColorId}
                    colorIntensity={colorIntensity}
                    onBack={handleBack}
                    onRetry={handleRetry}
                />
            )}
        </>
    );
}

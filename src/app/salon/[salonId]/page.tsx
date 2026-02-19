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

    // 데모 데이터 (추후 salonId로 서버에서 가져옴)
    const salon = DEMO_SALON;
    const hairstyles = DEMO_HAIRSTYLES;

    // 스플래시 완료 → 메인 화면
    const handleSplashComplete = useCallback(() => {
        setStep("main");
    }, [setStep]);

    // 이미지 리사이징 유틸 (최대 1024px, 품질 0.85)
    const resizeImage = useCallback((dataUrl: string, maxSize: number = 1280): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const { width, height } = img;
                // 이미 충분히 작으면 그대로 반환
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

    // 사진 변경 (기존 사진 제거 → 다시 선택)
    const handlePhotoChange = useCallback(() => {
        setUserPhoto(null);
        setSelectedStyleId(null);
        setSelectedColorId(null);
    }, [setUserPhoto, setSelectedStyleId, setSelectedColorId]);

    // 합성 실행 — Gemini AI API 호출
    const handleSynthesize = useCallback(async () => {
        if (!userPhoto || !selectedStyleId) return;

        setIsLoading(true);

        try {
            // 선택된 스타일/색상 정보 가져오기
            const style = hairstyles.find((h) => h.id === selectedStyleId);
            const color = selectedColorId
                ? HAIR_COLORS.find((c) => c.id === selectedColorId)
                : null;

            // 앱 스토어에서 색상 강도 가져오기
            const colorIntensity = useAppStore.getState().colorIntensity ?? 70;

            if (!style) {
                alert("헤어스타일을 선택해주세요.");
                setIsLoading(false);
                return;
            }

            // API 호출
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

    // 다른 스타일 시도
    const handleTryAnother = useCallback(() => {
        setSelectedStyleId(null);
        setSelectedColorId(null);
        setResultImage(null);
        setStep("main");
    }, [setSelectedStyleId, setSelectedColorId, setResultImage, setStep]);

    // 저장
    const handleSave = useCallback(() => {
        const image = resultImage || userPhoto;
        if (!image) return;

        // 이미지 다운로드
        const link = document.createElement("a");
        link.href = image;
        link.download = `hairstyle-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [resultImage, userPhoto]);

    // 완전 리셋
    const handleReset = useCallback(() => {
        reset();
    }, [reset]);

    // 선택된 스타일 정보
    const selectedStyle = hairstyles.find((h) => h.id === selectedStyleId);
    const selectedColor = selectedColorId
        ? HAIR_COLORS.find((c) => c.id === selectedColorId)
        : null;

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
            {step === "result" && userPhoto && (
                <ResultView
                    userPhoto={userPhoto}
                    resultImage={resultImage}
                    selectedStyle={selectedStyle}
                    selectedColorLabel={selectedColor?.label || null}
                    onTryAnother={handleTryAnother}
                    onReset={handleReset}
                    onSave={handleSave}
                />
            )}
        </>
    );
}

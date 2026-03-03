"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { useSalonData } from "@/hooks/useSalonData";
import { useTransform } from "@/hooks/useTransform";
import { useToast } from "@/hooks/useToast";
import Splash from "@/components/Splash/Splash";
import MainView from "@/components/MainView/MainView";

export default function SalonPage() {
    const params = useParams();
    const salonId = (params?.salonId as string) || "demo";

    // 살롱 데이터 로딩
    const { salon, hairstyles } = useSalonData(salonId);

    // 토스트 메시지
    const { message: toastMessage, showToast, hideToast } = useToast();

    // AI 합성 로직
    const {
        userPhoto, selectedStyleId, selectedColor,
        resultImage, isLoading,
        handlePhotoSelect, handlePhotoChange,
        handleClearResult, handleSynthesize, handleResynthesize,
        setSelectedStyleId, setSelectedColor,
    } = useTransform({ salonId, hairstyles, onError: showToast });

    // 스플래시 전환
    const { step, setStep } = useAppStore();
    const handleSplashComplete = useCallback(() => setStep("main"), [setStep]);

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
                    onClick={hideToast}
                >
                    ⚠️ {toastMessage}
                </div>
            )}
        </>
    );
}

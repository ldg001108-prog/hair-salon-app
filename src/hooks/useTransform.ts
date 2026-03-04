/**
 * useTransform 훅
 * AI 헤어스타일 합성 관련 비즈니스 로직
 */

import { useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { requestTransform } from "@/services/api";
import { preloadModel } from "@/services/hairColorService";
import type { Hairstyle } from "@/types";

/**
 * hex 컬러를 HSL saturation/lightness로 변환
 */
function hexToSL(hex: string): { saturation: number; lightness: number } {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let s = 0;
    if (max !== min) {
        s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
    }
    return {
        saturation: Math.round(s * 100),
        lightness: Math.round(l * 100),
    };
}

/**
 * 이미지를 최대 크기로 리사이즈
 */
export function resizeImage(dataUrl: string, maxSize: number = 2048): Promise<string> {
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
}

interface UseTransformOptions {
    salonId: string;
    hairstyles: Hairstyle[];
    onError: (message: string) => void;
}

export function useTransform({ salonId, hairstyles, onError }: UseTransformOptions) {
    const {
        userPhoto, setUserPhoto,
        selectedStyleId, setSelectedStyleId,
        selectedColor, setSelectedColor,
        resultImage, setResultImage,
        isLoading, setIsLoading,
        addHistory, incrementApiCall, addErrorLog,
    } = useAppStore();

    // 사진 선택 (리사이징 적용)
    const handlePhotoSelect = useCallback(async (dataUrl: string) => {
        const resized = await resizeImage(dataUrl);
        setUserPhoto(resized);
        setResultImage(null);
    }, [setUserPhoto, setResultImage]);

    // 사진 변경 (초기화)
    const handlePhotoChange = useCallback(() => {
        setUserPhoto(null);
        setSelectedStyleId(null);
        setSelectedColor(null);
        setResultImage(null);
    }, [setUserPhoto, setSelectedStyleId, setSelectedColor, setResultImage]);

    // 결과 초기화
    const handleClearResult = useCallback(() => {
        setResultImage(null);
    }, [setResultImage]);

    // 합성 요청 공통 로직
    const doTransform = useCallback(async (colorHex?: string) => {
        if (!userPhoto || !selectedStyleId) return;

        const style = hairstyles.find((h) => h.id === selectedStyleId);
        if (!style) {
            onError("헤어스타일을 선택해주세요.");
            return;
        }

        setIsLoading(true);

        try {
            const color = colorHex || selectedColor || undefined;
            const colorData = color ? hexToSL(color) : {};

            const data = await requestTransform({
                photo: userPhoto,
                styleName: style.name,
                styleDescription: style.story,
                styleImageUrl: style.imageUrl || undefined,
                category: style.category,
                salonId,
                colorName: color ? `Custom (${color})` : undefined,
                colorHex: color,
                colorIntensity: 85,
                ...colorData,
            });

            if (data.success && data.resultImage) {
                setResultImage(data.resultImage);
                incrementApiCall(true);
                preloadModel();
                addHistory({
                    resultImage: data.resultImage,
                    styleName: style.name,
                    colorHex: color || null,
                });
            } else {
                incrementApiCall(false);
                addErrorLog(data.error || "합성 실패", "doTransform");
                onError(data.error || "합성에 실패했습니다. 다시 시도해주세요.");
            }
        } catch (error) {
            console.error("[Transform] Error:", error);
            incrementApiCall(false);
            addErrorLog(String(error), "doTransform/network");
            onError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
        } finally {
            setIsLoading(false);
        }
    }, [userPhoto, selectedStyleId, selectedColor, hairstyles, salonId, setIsLoading, setResultImage, addHistory, incrementApiCall, addErrorLog, onError]);

    // 합성 실행
    const handleSynthesize = useCallback(() => doTransform(), [doTransform]);

    // 재합성 (컬러 변경)
    const handleResynthesize = useCallback(async (newColorHex: string) => {
        setSelectedColor(newColorHex);
        await doTransform(newColorHex);
    }, [setSelectedColor, doTransform]);

    return {
        userPhoto,
        selectedStyleId,
        selectedColor,
        resultImage,
        isLoading,
        handlePhotoSelect,
        handlePhotoChange,
        handleClearResult,
        handleSynthesize,
        handleResynthesize,
        setSelectedStyleId,
        setSelectedColor,
    };
}

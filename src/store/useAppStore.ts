import { create } from "zustand";

interface AppState {
    // 현재 단계
    step: "splash" | "main" | "result";
    setStep: (step: AppState["step"]) => void;

    // 사용자 사진
    userPhoto: string | null;
    setUserPhoto: (url: string | null) => void;

    // 선택된 스타일
    selectedStyleId: string | null;
    setSelectedStyleId: (id: string | null) => void;

    // 선택된 컬러
    selectedColorId: string | null;
    setSelectedColorId: (id: string | null) => void;

    // 색상 강도 (0~100)
    colorIntensity: number;
    setColorIntensity: (intensity: number) => void;

    // 합성 결과
    resultImage: string | null;
    setResultImage: (url: string | null) => void;

    // 로딩
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;

    // 리셋
    reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    step: "splash",
    setStep: (step) => set({ step }),

    userPhoto: null,
    setUserPhoto: (url) => set({ userPhoto: url }),

    selectedStyleId: null,
    setSelectedStyleId: (id) => set({ selectedStyleId: id }),

    selectedColorId: null,
    setSelectedColorId: (id) => set({ selectedColorId: id }),

    colorIntensity: 70,
    setColorIntensity: (intensity) => set({ colorIntensity: intensity }),

    resultImage: null,
    setResultImage: (url) => set({ resultImage: url }),

    isLoading: false,
    setIsLoading: (loading) => set({ isLoading: loading }),

    reset: () =>
        set({
            step: "main",
            userPhoto: null,
            selectedStyleId: null,
            selectedColorId: null,
            colorIntensity: 70,
            resultImage: null,
            isLoading: false,
        }),
}));

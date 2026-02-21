import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark";

interface AppState {
    // 현재 단계
    step: "splash" | "main" | "result";
    setStep: (step: AppState["step"]) => void;

    // 테마
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;

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

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            step: "splash",
            setStep: (step) => set({ step }),

            theme: "light",
            setTheme: (theme) => {
                set({ theme });
                // DOM에 data-theme 속성 설정
                if (typeof document !== "undefined") {
                    document.documentElement.setAttribute("data-theme", theme);
                }
            },
            toggleTheme: () => {
                const newTheme = get().theme === "light" ? "dark" : "light";
                get().setTheme(newTheme);
            },

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
        }),
        {
            name: "hair-studio-storage",
            // 테마만 persist (사진/스타일은 세션 한정)
            partialize: (state) => ({ theme: state.theme }),
        }
    )
);

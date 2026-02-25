import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark";

// 합성 히스토리 항목
export interface HistoryItem {
    id: string;
    resultImage: string;
    styleName: string;
    colorHex: string | null;
    timestamp: number;
}

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

    // 선택된 컬러 (hex 값)
    selectedColor: string | null;
    setSelectedColor: (hex: string | null) => void;

    // 색상 강도 (0~100)
    colorIntensity: number;
    setColorIntensity: (intensity: number) => void;

    // 합성 결과
    resultImage: string | null;
    setResultImage: (url: string | null) => void;

    // 로딩
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;

    // 합성 히스토리
    history: HistoryItem[];
    addHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
    clearHistory: () => void;

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

            selectedColor: null,
            setSelectedColor: (hex) => set({ selectedColor: hex }),

            colorIntensity: 70,
            setColorIntensity: (intensity) => set({ colorIntensity: intensity }),

            resultImage: null,
            setResultImage: (url) => set({ resultImage: url }),

            isLoading: false,
            setIsLoading: (loading) => set({ isLoading: loading }),

            history: [],
            addHistory: (item) =>
                set((state) => ({
                    history: [
                        {
                            ...item,
                            id: `h-${Date.now()}`,
                            timestamp: Date.now(),
                        },
                        ...state.history,
                    ].slice(0, 10), // 최대 10개 유지
                })),
            clearHistory: () => set({ history: [] }),

            reset: () =>
                set({
                    step: "main",
                    userPhoto: null,
                    selectedStyleId: null,
                    selectedColor: null,
                    colorIntensity: 70,
                    resultImage: null,
                    isLoading: false,
                    // history는 보존 (여러 스타일 비교 가능)
                }),
        }),
        {
            name: "hair-studio-storage",
            // 테마만 persist (사진/스타일은 세션 한정)
            partialize: (state) => ({ theme: state.theme }),
        }
    )
);

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

// API 통계
export interface ApiStats {
    totalCalls: number;
    successCount: number;
    failCount: number;
    todayCalls: number;
    todayDate: string; // YYYY-MM-DD
}

// 에러 로그
export interface ErrorLog {
    id: string;
    message: string;
    timestamp: number;
    context?: string;
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

    // API 통계
    apiStats: ApiStats;
    incrementApiCall: (success: boolean) => void;
    resetApiStats: () => void;

    // 에러 로그
    errorLogs: ErrorLog[];
    addErrorLog: (message: string, context?: string) => void;
    clearErrorLogs: () => void;

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

            // API 통계
            apiStats: {
                totalCalls: 0,
                successCount: 0,
                failCount: 0,
                todayCalls: 0,
                todayDate: new Date().toISOString().slice(0, 10),
            },
            incrementApiCall: (success) =>
                set((state) => {
                    const today = new Date().toISOString().slice(0, 10);
                    const isNewDay = state.apiStats.todayDate !== today;
                    return {
                        apiStats: {
                            totalCalls: state.apiStats.totalCalls + 1,
                            successCount: state.apiStats.successCount + (success ? 1 : 0),
                            failCount: state.apiStats.failCount + (success ? 0 : 1),
                            todayCalls: isNewDay ? 1 : state.apiStats.todayCalls + 1,
                            todayDate: today,
                        },
                    };
                }),
            resetApiStats: () =>
                set({
                    apiStats: {
                        totalCalls: 0,
                        successCount: 0,
                        failCount: 0,
                        todayCalls: 0,
                        todayDate: new Date().toISOString().slice(0, 10),
                    },
                }),

            // 에러 로그
            errorLogs: [],
            addErrorLog: (message, context) =>
                set((state) => ({
                    errorLogs: [
                        {
                            id: `e-${Date.now()}`,
                            message,
                            timestamp: Date.now(),
                            context,
                        },
                        ...state.errorLogs,
                    ].slice(0, 20),
                })),
            clearErrorLogs: () => set({ errorLogs: [] }),

            reset: () =>
                set({
                    step: "main",
                    userPhoto: null,
                    selectedStyleId: null,
                    selectedColor: null,
                    colorIntensity: 70,
                    resultImage: null,
                    isLoading: false,
                }),
        }),
        {
            name: "hair-studio-storage",
            partialize: (state) => ({
                theme: state.theme,
                apiStats: state.apiStats,
                errorLogs: state.errorLogs,
            }),
        }
    )
);

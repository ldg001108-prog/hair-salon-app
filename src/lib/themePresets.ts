/**
 * 미용실 고유 색상 테마 프리셋 (10종)
 * 각 테마는 CSS 변수 형태로 정의되어
 * 살롱 페이지에서 :root에 주입됩니다.
 */

export interface ThemePreset {
    id: string;
    name: string;
    nameEn: string;
    /** 그라데이션 시작 색 (미리보기용) */
    gradientStart: string;
    /** 그라데이션 끝 색 (미리보기용) */
    gradientEnd: string;
    /** 액센트 색상 */
    accent: string;
    /** CSS 변수 세트 */
    cssVars: Record<string, string>;
}

export const THEME_PRESETS: ThemePreset[] = [
    // 1. 핑크 ~ 라벤더 (기본)
    {
        id: "pink-lavender",
        name: "핑크 라벤더",
        nameEn: "Pink Lavender",
        gradientStart: "#f3b5e2",
        gradientEnd: "#cccafb",
        accent: "#c06c8e",
        cssVars: {
            "--bg-primary": "#f0dce8",
            "--bg-secondary": "#eed4e0",
            "--bg-tertiary": "#e6c8d8",
            "--bg-gradient": "linear-gradient(to top, #f3b5e2 0%, #f6c4e4 12%, #f9d6e8 25%, #fce8ef 38%, #fdf2f4 48%, #f5eef6 58%, #e8e0f4 70%, #ddd6f2 82%, #cccafb 100%)",
            "--accent": "#c06c8e",
            "--accent-light": "#d48fa8",
            "--accent-gradient": "linear-gradient(135deg, #d48fa8 0%, #c06c8e 50%, #a85578 100%)",
            "--accent-dim": "rgba(192, 108, 142, 0.12)",
            "--accent-bg": "rgba(192, 108, 142, 0.06)",
            "--text-primary": "#3d1f35",
            "--text-secondary": "#6b3a5c",
            "--text-tertiary": "#997089",
            "--text-muted": "#b999ab",
        },
    },
    // 2. 로즈 ~ 코랄
    {
        id: "rose-coral",
        name: "로즈 코랄",
        nameEn: "Rose Coral",
        gradientStart: "#f5a0b0",
        gradientEnd: "#fcc8a0",
        accent: "#e0606a",
        cssVars: {
            "--bg-primary": "#fce0e4",
            "--bg-secondary": "#f5d0d5",
            "--bg-tertiary": "#edc0c8",
            "--bg-gradient": "linear-gradient(to top, #f5a0b0 0%, #f7b0bc 12%, #f9c0c8 25%, #fbd0d4 38%, #fde4e4 48%, #fde8de 58%, #fcd8c4 70%, #fcd0b0 82%, #fcc8a0 100%)",
            "--accent": "#e0606a",
            "--accent-light": "#f08088",
            "--accent-gradient": "linear-gradient(135deg, #f08088 0%, #e0606a 50%, #c84050 100%)",
            "--accent-dim": "rgba(224, 96, 106, 0.12)",
            "--accent-bg": "rgba(224, 96, 106, 0.06)",
            "--text-primary": "#3d1820",
            "--text-secondary": "#6b3040",
            "--text-tertiary": "#995868",
            "--text-muted": "#b98898",
        },
    },
    // 3. 피치 ~ 골든
    {
        id: "peach-golden",
        name: "피치 골든",
        nameEn: "Peach Golden",
        gradientStart: "#f7c4a0",
        gradientEnd: "#f5e0a0",
        accent: "#d48040",
        cssVars: {
            "--bg-primary": "#fce8d8",
            "--bg-secondary": "#f5dcc8",
            "--bg-tertiary": "#edd0b8",
            "--bg-gradient": "linear-gradient(to top, #f7c4a0 0%, #f7ccac 12%, #f8d4b8 25%, #f9dcc4 38%, #fae8d8 48%, #f9ead0 58%, #f8e8c0 70%, #f7e4b0 82%, #f5e0a0 100%)",
            "--accent": "#d48040",
            "--accent-light": "#e0a060",
            "--accent-gradient": "linear-gradient(135deg, #e0a060 0%, #d48040 50%, #b86830 100%)",
            "--accent-dim": "rgba(212, 128, 64, 0.12)",
            "--accent-bg": "rgba(212, 128, 64, 0.06)",
            "--text-primary": "#3d2810",
            "--text-secondary": "#6b4820",
            "--text-tertiary": "#997040",
            "--text-muted": "#b99868",
        },
    },
    // 4. 민트 ~ 에메랄드
    {
        id: "mint-emerald",
        name: "민트 에메랄드",
        nameEn: "Mint Emerald",
        gradientStart: "#a0e8d0",
        gradientEnd: "#90d0b8",
        accent: "#30a080",
        cssVars: {
            "--bg-primary": "#d8f4ec",
            "--bg-secondary": "#c8ecdf",
            "--bg-tertiary": "#b8e4d4",
            "--bg-gradient": "linear-gradient(to top, #a0e8d0 0%, #a8ead5 12%, #b0ecda 25%, #c0f0e2 38%, #d4f5ec 48%, #daf5ee 58%, #d0f0e6 70%, #c0e8dc 82%, #90d0b8 100%)",
            "--accent": "#30a080",
            "--accent-light": "#50c0a0",
            "--accent-gradient": "linear-gradient(135deg, #50c0a0 0%, #30a080 50%, #208868 100%)",
            "--accent-dim": "rgba(48, 160, 128, 0.12)",
            "--accent-bg": "rgba(48, 160, 128, 0.06)",
            "--text-primary": "#10382c",
            "--text-secondary": "#205848",
            "--text-tertiary": "#408068",
            "--text-muted": "#70a898",
        },
    },
    // 5. 스카이 ~ 블루
    {
        id: "sky-blue",
        name: "스카이 블루",
        nameEn: "Sky Blue",
        gradientStart: "#a0d4f8",
        gradientEnd: "#b0c0f8",
        accent: "#3080d0",
        cssVars: {
            "--bg-primary": "#dceef8",
            "--bg-secondary": "#cce4f4",
            "--bg-tertiary": "#bcd8f0",
            "--bg-gradient": "linear-gradient(to top, #a0d4f8 0%, #a8d8f8 12%, #b4def8 25%, #c4e4f8 38%, #d8eff8 48%, #e0f0fc 58%, #d4e8fc 70%, #c4d8f8 82%, #b0c0f8 100%)",
            "--accent": "#3080d0",
            "--accent-light": "#50a0e8",
            "--accent-gradient": "linear-gradient(135deg, #50a0e8 0%, #3080d0 50%, #2068b0 100%)",
            "--accent-dim": "rgba(48, 128, 208, 0.12)",
            "--accent-bg": "rgba(48, 128, 208, 0.06)",
            "--text-primary": "#102840",
            "--text-secondary": "#204868",
            "--text-tertiary": "#407098",
            "--text-muted": "#7098b8",
        },
    },
    // 6. 라벤더 ~ 바이올렛
    {
        id: "lavender-violet",
        name: "라벤더 바이올렛",
        nameEn: "Lavender Violet",
        gradientStart: "#c8b8f8",
        gradientEnd: "#e0b0f0",
        accent: "#7c50dc",
        cssVars: {
            "--bg-primary": "#ece4fa",
            "--bg-secondary": "#e0d8f6",
            "--bg-tertiary": "#d4caf2",
            "--bg-gradient": "linear-gradient(to top, #c8b8f8 0%, #cec0f8 12%, #d4c8f8 25%, #dad0f8 38%, #e8e0fa 48%, #eee0f8 58%, #e8d4f4 70%, #e4c8f2 82%, #e0b0f0 100%)",
            "--accent": "#7c50dc",
            "--accent-light": "#9c78ec",
            "--accent-gradient": "linear-gradient(135deg, #9c78ec 0%, #7c50dc 50%, #6040c0 100%)",
            "--accent-dim": "rgba(124, 80, 220, 0.12)",
            "--accent-bg": "rgba(124, 80, 220, 0.06)",
            "--text-primary": "#201838",
            "--text-secondary": "#403060",
            "--text-tertiary": "#685090",
            "--text-muted": "#9880b8",
        },
    },
    // 7. 골드 ~ 앰버
    {
        id: "gold-amber",
        name: "골드 앰버",
        nameEn: "Gold Amber",
        gradientStart: "#f0d898",
        gradientEnd: "#f0c078",
        accent: "#c89030",
        cssVars: {
            "--bg-primary": "#f8ecd4",
            "--bg-secondary": "#f4e0c4",
            "--bg-tertiary": "#eed4b4",
            "--bg-gradient": "linear-gradient(to top, #f0d898 0%, #f2dca0 12%, #f4e0a8 25%, #f6e4b8 38%, #f8ecd0 48%, #f8ecc8 58%, #f6e0b0 70%, #f4d898 82%, #f0c078 100%)",
            "--accent": "#c89030",
            "--accent-light": "#d8a850",
            "--accent-gradient": "linear-gradient(135deg, #d8a850 0%, #c89030 50%, #a87820 100%)",
            "--accent-dim": "rgba(200, 144, 48, 0.12)",
            "--accent-bg": "rgba(200, 144, 48, 0.06)",
            "--text-primary": "#382810",
            "--text-secondary": "#604818",
            "--text-tertiary": "#887030",
            "--text-muted": "#b09860",
        },
    },
    // 8. 세이지 ~ 올리브
    {
        id: "sage-olive",
        name: "세이지 올리브",
        nameEn: "Sage Olive",
        gradientStart: "#c0d8b8",
        gradientEnd: "#a8c8a0",
        accent: "#608850",
        cssVars: {
            "--bg-primary": "#e4f0dc",
            "--bg-secondary": "#d8e8d0",
            "--bg-tertiary": "#cce0c4",
            "--bg-gradient": "linear-gradient(to top, #c0d8b8 0%, #c4dcbe 12%, #cce0c4 25%, #d4e8d0 38%, #e0f0dc 48%, #e4f0e0 58%, #dcecd4 70%, #d0e0c8 82%, #a8c8a0 100%)",
            "--accent": "#608850",
            "--accent-light": "#80a870",
            "--accent-gradient": "linear-gradient(135deg, #80a870 0%, #608850 50%, #487040 100%)",
            "--accent-dim": "rgba(96, 136, 80, 0.12)",
            "--accent-bg": "rgba(96, 136, 80, 0.06)",
            "--text-primary": "#1c2c18",
            "--text-secondary": "#344c28",
            "--text-tertiary": "#587448",
            "--text-muted": "#88a078",
        },
    },
    // 9. 베리 ~ 플럼
    {
        id: "berry-plum",
        name: "베리 플럼",
        nameEn: "Berry Plum",
        gradientStart: "#d8a0c8",
        gradientEnd: "#c098d0",
        accent: "#9050a0",
        cssVars: {
            "--bg-primary": "#f0dcec",
            "--bg-secondary": "#e8d0e4",
            "--bg-tertiary": "#e0c4dc",
            "--bg-gradient": "linear-gradient(to top, #d8a0c8 0%, #dca8cc 12%, #e0b4d2 25%, #e4c0d8 38%, #ecd4e4 48%, #ecd4e8 58%, #e4c8e0 70%, #dcc0d8 82%, #c098d0 100%)",
            "--accent": "#9050a0",
            "--accent-light": "#b070b8",
            "--accent-gradient": "linear-gradient(135deg, #b070b8 0%, #9050a0 50%, #784088 100%)",
            "--accent-dim": "rgba(144, 80, 160, 0.12)",
            "--accent-bg": "rgba(144, 80, 160, 0.06)",
            "--text-primary": "#2c1030",
            "--text-secondary": "#502050",
            "--text-tertiary": "#784070",
            "--text-muted": "#a870a0",
        },
    },
    // 10. 모카 ~ 쇼콜라
    {
        id: "mocha-chocolat",
        name: "모카 쇼콜라",
        nameEn: "Mocha Chocolat",
        gradientStart: "#d8c0b0",
        gradientEnd: "#c8a898",
        accent: "#8c5c40",
        cssVars: {
            "--bg-primary": "#f0e4dc",
            "--bg-secondary": "#e8dcd0",
            "--bg-tertiary": "#e0d0c4",
            "--bg-gradient": "linear-gradient(to top, #d8c0b0 0%, #dcc4b8 12%, #e0ccbe 25%, #e4d4c8 38%, #ece0d8 48%, #ece0d4 58%, #e4d4c8 70%, #dcc8b8 82%, #c8a898 100%)",
            "--accent": "#8c5c40",
            "--accent-light": "#a87c60",
            "--accent-gradient": "linear-gradient(135deg, #a87c60 0%, #8c5c40 50%, #744830 100%)",
            "--accent-dim": "rgba(140, 92, 64, 0.12)",
            "--accent-bg": "rgba(140, 92, 64, 0.06)",
            "--text-primary": "#2c1c10",
            "--text-secondary": "#4c3420",
            "--text-tertiary": "#785840",
            "--text-muted": "#a88868",
        },
    },
];

/** ID로 테마 프리셋 찾기 */
export function getThemeById(id: string): ThemePreset | undefined {
    return THEME_PRESETS.find((t) => t.id === id);
}

/** 기본 테마 */
export const DEFAULT_THEME_ID = "pink-lavender";

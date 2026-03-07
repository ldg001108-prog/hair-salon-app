/**
 * 살롱 레이아웃 — 테마 CSS 변수를 인라인 스타일로 즉시 주입 (FOUC 완전 방지)
 * 
 * 핵심 원리: SSR HTML에 CSS 변수가 이미 포함되어 있으므로,
 * 브라우저가 첫 페인트할 때부터 올바른 색상이 적용됨.
 * CSS 변수는 자식 요소로 상속되므로, 래핑 div의 스타일이
 * globals.css의 :root 기본값보다 우선함.
 */

import { getSalon } from "@/lib/getSalonData";
import { getThemeById, DEFAULT_THEME_ID } from "@/lib/themePresets";

export default async function SalonLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ salonId: string }>;
}) {
    const { salonId } = await params;
    const salon = await getSalon(salonId);

    // 테마 CSS 변수 생성
    const themeId = salon?.themeColor || DEFAULT_THEME_ID;
    const theme = getThemeById(themeId);

    // 인라인 스타일용 CSS 변수 수집
    const inlineStyle: Record<string, string> = {};

    if (theme) {
        // 프리셋 CSS 변수를 모두 인라인 스타일에 포함
        for (const [key, value] of Object.entries(theme.cssVars)) {
            inlineStyle[key] = value;
        }
        inlineStyle["--salon-theme"] = theme.accent;
        inlineStyle["--salon-theme-light"] = theme.accent + "22";
        inlineStyle["--salon-theme-hover"] = theme.accent + "dd";
    }

    return (
        <div style={inlineStyle as React.CSSProperties}>
            {children}
        </div>
    );
}

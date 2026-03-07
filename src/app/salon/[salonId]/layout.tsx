/**
 * 살롱 레이아웃 — 서버사이드에서 테마 CSS 즉시 주입 (FOUC 완전 방지)
 * blocking <script>로 document.documentElement.style에 직접 설정
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

    // 서버사이드에서 CSS 변수 수집
    const cssVars: Record<string, string> = {};

    if (theme) {
        Object.assign(cssVars, theme.cssVars);
        cssVars["--salon-theme"] = theme.accent;
        cssVars["--salon-theme-light"] = theme.accent + "22";
        cssVars["--salon-theme-hover"] = theme.accent + "dd";
    }

    // blocking script로 CSS 변수 즉시 주입 (FOUC 완전 방지)
    // JSON으로 변수 전달 → document.documentElement.style에 직접 설정
    const varsJson = JSON.stringify(cssVars);
    const themeScript = `(function(){var v=${varsJson};var s=document.documentElement.style;for(var k in v){s.setProperty(k,v[k])}})();`;

    return (
        <>
            <script dangerouslySetInnerHTML={{ __html: themeScript }} />
            {children}
        </>
    );
}

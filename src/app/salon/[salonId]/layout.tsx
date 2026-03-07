/**
 * 살롱 레이아웃 — 서버사이드에서 테마 CSS 주입 (FOUC 방지)
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

    // 서버사이드에서 CSS 변수를 inline style로 주입
    const cssVars: Record<string, string> = {};

    if (theme) {
        Object.assign(cssVars, theme.cssVars);
        cssVars["--salon-theme"] = theme.accent;
        cssVars["--salon-theme-light"] = theme.accent + "22";
        cssVars["--salon-theme-hover"] = theme.accent + "dd";
    }

    // CSS 변수를 style 태그로 주입
    const cssString = Object.entries(cssVars)
        .map(([key, value]) => `${key}: ${value};`)
        .join("\n    ");

    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `:root:root {\n    ${cssString}\n}`
            }} />
            {children}
        </>
    );
}

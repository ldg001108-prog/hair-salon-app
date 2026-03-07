/**
 * 살롱 레이아웃 — :root CSS 변수를 <style> 태그로 즉시 덮어씀 (FOUC 완전 방지)
 * 
 * 핵심: <style> 태그를 head에 삽입하여 globals.css의 :root 기본값을
 * 살롱 테마 값으로 완전히 덮어씀. SSR HTML에 포함되므로 첫 페인트부터 적용.
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

    // CSS 변수를 :root 스타일로 생성
    let cssVarsString = "";

    if (theme) {
        const allVars: Record<string, string> = {
            ...theme.cssVars,
            "--salon-theme": theme.accent,
            "--salon-theme-light": theme.accent + "22",
            "--salon-theme-hover": theme.accent + "dd",
        };

        const declarations = Object.entries(allVars)
            .map(([key, value]) => `${key}: ${value} !important`)
            .join(";\n    ");

        cssVarsString = `:root {\n    ${declarations};\n}`;
    }

    return (
        <>
            {/* SSR HTML에 포함되어 첫 페인트부터 올바른 테마 적용 */}
            <style dangerouslySetInnerHTML={{ __html: cssVarsString }} />
            {children}
        </>
    );
}

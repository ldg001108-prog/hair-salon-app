// 테마 초기화 스크립트 — 항상 light 모드 적용
export function ThemeInitScript() {
    const script = `
    (function() {
        document.documentElement.setAttribute('data-theme', 'light');
    })();
    `;

    return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

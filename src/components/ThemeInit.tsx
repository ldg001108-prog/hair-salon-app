// 테마 초기화 스크립트 — FOUC (Flash of Unstyled Content) 방지
// localStorage에서 테마를 읽어 data-theme 속성을 즉시 설정

export function ThemeInitScript() {
    const script = `
    (function() {
        try {
            var stored = localStorage.getItem('hair-studio-storage');
            if (stored) {
                var parsed = JSON.parse(JSON.parse(stored).state || '{}');
                var theme = parsed.theme || 'light';
                document.documentElement.setAttribute('data-theme', theme);
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
            }
        } catch(e) {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    })();
    `;

    return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

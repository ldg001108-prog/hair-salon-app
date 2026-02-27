import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeInitScript } from "@/components/ThemeInit";

export const metadata: Metadata = {
    title: "AI Hair Studio — 헤어스타일 가상 체험",
    description: "AI로 나에게 어울리는 헤어스타일을 미리 체험해보세요",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "AI Hair Studio",
    },
    formatDetection: {
        telephone: false,
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
    themeColor: "#f5f0fa",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko" suppressHydrationWarning>
            <body suppressHydrationWarning>
                <ThemeInitScript />
                {children}
            </body>
        </html>
    );
}

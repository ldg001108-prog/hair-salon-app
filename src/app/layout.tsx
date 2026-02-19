import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "HairApp - 헤어스타일 가상 체험",
    description: "AI로 나에게 어울리는 헤어스타일을 미리 체험해보세요",
    appleWebApp: {
        capable: true,
        statusBarStyle: "black-translucent",
        title: "HairApp",
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
    themeColor: "#2d1650",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko">
            <body>{children}</body>
        </html>
    );
}

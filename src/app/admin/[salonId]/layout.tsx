/**
 * 관리자 대시보드 레이아웃
 * body의 max-width 제한을 해제하여 넓은 화면에서 사용 가능
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "AI Hair Studio — 관리자 대시보드",
    description: "미용실 관리자용 통계 및 관리 대시보드",
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div
            style={{
                maxWidth: "100vw",
                width: "100vw",
                margin: 0,
                padding: 0,
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                overflow: "auto",
                zIndex: 50,
                background: "#f7f3fa",
            }}
        >
            {children}
        </div>
    );
}

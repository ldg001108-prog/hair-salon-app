"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import styles from "./ColorWheel.module.css";

interface ColorWheelProps {
    selectedColor: string | null; // hex
    onColorSelect: (hex: string | null) => void;
    size?: number;
}

// Canvas에 컬러 휠 그리기
function drawColorWheel(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    outerR: number,
    innerR: number
) {
    const steps = 360;
    for (let i = 0; i < steps; i++) {
        const startAngle = (i * Math.PI * 2) / steps - Math.PI / 2;
        const endAngle = ((i + 1.5) * Math.PI * 2) / steps - Math.PI / 2;
        const hue = i;

        // 바깥→안쪽으로 채도 링 3개 + 명도 링 1개
        const rings = [
            { rOuter: outerR, rInner: outerR * 0.82, s: 35, l: 75 },      // 연한
            { rOuter: outerR * 0.82, rInner: outerR * 0.62, s: 60, l: 55 }, // 중간
            { rOuter: outerR * 0.62, rInner: outerR * 0.42, s: 85, l: 42 }, // 진한
            { rOuter: outerR * 0.42, rInner: innerR, s: 70, l: 25 },         // 어두운
        ];

        for (const ring of rings) {
            ctx.beginPath();
            ctx.arc(cx, cy, ring.rOuter, startAngle, endAngle);
            ctx.arc(cx, cy, ring.rInner, endAngle, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = `hsl(${hue}, ${ring.s}%, ${ring.l}%)`;
            ctx.fill();
        }
    }

    // 중앙 원 (배경색)
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fillStyle = "var(--bg-secondary, #f0f4f8)";
    ctx.fill();
}

// 좌표에서 색상 추출
function getColorAt(canvas: HTMLCanvasElement, x: number, y: number): string | null {
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    // 투명하거나 중앙 영역이면 null
    if (pixel[3] < 10) return null;
    return `#${pixel[0].toString(16).padStart(2, "0")}${pixel[1].toString(16).padStart(2, "0")}${pixel[2].toString(16).padStart(2, "0")}`;
}

export default function ColorWheel({ selectedColor, onColorSelect, size = 160 }: ColorWheelProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // 캔버스 그리기
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.scale(dpr, dpr);

        const cx = size / 2;
        const cy = size / 2;
        const outerR = size / 2 - 2;
        const innerR = size * 0.14;

        drawColorWheel(ctx, cx, cy, outerR, innerR);
    }, [size]);

    // 터치/클릭으로 색상 선택
    const pickColor = useCallback((clientX: number, clientY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const x = Math.round((clientX - rect.left) * dpr);
        const y = Math.round((clientY - rect.top) * dpr);
        const color = getColorAt(canvas, x, y);
        if (color) {
            onColorSelect(color);
        }
    }, [onColorSelect]);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        setIsDragging(true);
        pickColor(e.clientX, e.clientY);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, [pickColor]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging) return;
        pickColor(e.clientX, e.clientY);
    }, [isDragging, pickColor]);

    const handlePointerUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    return (
        <div className={styles.wheelContainer}>
            <div className={styles.wheelWrap}>
                <canvas
                    ref={canvasRef}
                    className={styles.canvas}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                />
                {/* 중앙: 선택된 색상 미리보기 */}
                <div
                    className={styles.centerPreview}
                    style={{
                        background: selectedColor || "var(--bg-tertiary)",
                        width: size * 0.24,
                        height: size * 0.24,
                    }}
                >
                    {!selectedColor && (
                        <span className={styles.centerText}>색상</span>
                    )}
                </div>
            </div>
            {/* 리셋 버튼 */}
            <button
                className={styles.resetBtn}
                onClick={() => onColorSelect(null)}
                title="색상 초기화"
            >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <span>초기화</span>
            </button>
        </div>
    );
}

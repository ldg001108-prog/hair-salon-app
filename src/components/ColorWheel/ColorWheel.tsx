"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import styles from "./ColorWheel.module.css";

interface ColorWheelProps {
    selectedColor: string | null; // hex
    onColorSelect: (hex: string | null) => void;
    size?: number;
}

// HSL → RGB → hex 변환
function hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

// hex → HSL hue 추출 (슬라이더 연동용)
function hexToHue(hex: string): number {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    if (d === 0) return 0;
    let h = 0;
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
    return h;
}

// Canvas에 풀스펙트럼 컬러 휠 그리기
function drawColorWheel(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    outerR: number,
    innerR: number,
    saturation: number,
    lightness: number
) {
    ctx.clearRect(0, 0, cx * 2, cy * 2);

    const steps = 360;
    for (let i = 0; i < steps; i++) {
        const startAngle = (i * Math.PI * 2) / steps - Math.PI / 2;
        const endAngle = ((i + 1.5) * Math.PI * 2) / steps - Math.PI / 2;
        const hue = i;

        ctx.beginPath();
        ctx.arc(cx, cy, outerR, startAngle, endAngle);
        ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        ctx.fill();
    }

    // 중앙 원 (배경색)
    ctx.beginPath();
    ctx.arc(cx, cy, innerR - 1, 0, Math.PI * 2);
    ctx.fillStyle = "#f0f4f8";
    ctx.fill();
}

// 좌표에서 hue 각도 계산 (Canvas 중심 기준)
function getHueFromPosition(
    canvas: HTMLCanvasElement,
    clientX: number,
    clientY: number,
    innerR: number,
    outerR: number
): number | null {
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const x = clientX - rect.left - cx;
    const y = clientY - rect.top - cy;
    const dist = Math.sqrt(x * x + y * y);

    // 클릭이 휠 링 범위 안에 있는지 확인
    if (dist < innerR || dist > outerR) return null;

    // 각도 계산 (12시 방향 = 0°, 시계 방향)
    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    return Math.round(angle) % 360;
}

export default function ColorWheel({ selectedColor, onColorSelect, size = 150 }: ColorWheelProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [saturation, setSaturation] = useState(80);
    const [lightness, setLightness] = useState(45);
    // 현재 선택된 hue 각도 (슬라이더 변경 시 이 hue 기반으로 색상 재계산)
    const [selectedHue, setSelectedHue] = useState<number | null>(null);

    const innerR = size * 0.28;
    const outerR = size / 2 - 2;

    // 캔버스 그리기 (saturation/lightness 변경 시 리드로)
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

        drawColorWheel(ctx, cx, cy, outerR, innerR, saturation, lightness);
    }, [size, saturation, lightness, outerR, innerR]);

    // 터치/클릭으로 색상 선택 (hue 기반)
    const pickColor = useCallback((clientX: number, clientY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const hue = getHueFromPosition(canvas, clientX, clientY, innerR, outerR);
        if (hue !== null) {
            setSelectedHue(hue);
            const hex = hslToHex(hue, saturation, lightness);
            onColorSelect(hex);
        }
    }, [innerR, outerR, saturation, lightness, onColorSelect]);

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

    // ★ 채도 변경 시 선택 색상 실시간 업데이트
    const handleSaturationChange = useCallback((val: number) => {
        setSaturation(val);
        if (selectedHue !== null) {
            const hex = hslToHex(selectedHue, val, lightness);
            onColorSelect(hex);
        }
    }, [selectedHue, lightness, onColorSelect]);

    // ★ 명도 변경 시 선택 색상 실시간 업데이트
    const handleLightnessChange = useCallback((val: number) => {
        setLightness(val);
        if (selectedHue !== null) {
            const hex = hslToHex(selectedHue, saturation, val);
            onColorSelect(hex);
        }
    }, [selectedHue, saturation, onColorSelect]);

    return (
        <div className={styles.wheelContainer}>
            {/* 컬러 휠 */}
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
                        width: size * 0.48,
                        height: size * 0.48,
                    }}
                >
                    {!selectedColor && (
                        <span className={styles.centerText}>색상</span>
                    )}
                    {selectedColor && (
                        <span className={styles.centerHex}>{selectedColor}</span>
                    )}
                </div>
            </div>

            {/* 채도 슬라이더 */}
            <div className={styles.sliderRow}>
                <label className={styles.sliderLabel}>채도</label>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={saturation}
                    onChange={(e) => handleSaturationChange(Number(e.target.value))}
                    className={styles.slider}
                    style={{
                        background: `linear-gradient(90deg, hsl(${selectedHue ?? 0},0%,${lightness}%), hsl(${selectedHue ?? 0},100%,${lightness}%))`
                    }}
                />
                <span className={styles.sliderValue}>{saturation}%</span>
            </div>

            {/* 명도 슬라이더 */}
            <div className={styles.sliderRow}>
                <label className={styles.sliderLabel}>명도</label>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={lightness}
                    onChange={(e) => handleLightnessChange(Number(e.target.value))}
                    className={styles.slider}
                    style={{
                        background: `linear-gradient(90deg, #000, hsl(${selectedHue ?? 0},${saturation}%,50%), #fff)`
                    }}
                />
                <span className={styles.sliderValue}>{lightness}%</span>
            </div>

            {/* 리셋 버튼 */}
            <button
                className={styles.resetBtn}
                onClick={() => {
                    onColorSelect(null);
                    setSelectedHue(null);
                    setSaturation(80);
                    setLightness(45);
                }}
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

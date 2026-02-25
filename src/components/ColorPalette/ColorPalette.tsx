"use client";

import { useState, useCallback } from "react";
import styles from "./ColorPalette.module.css";

interface ColorPaletteProps {
    selectedColor: string | null;
    onColorSelect: (hex: string | null) => void;
}

// 대중적 헤어 컬러 8색 (가장 인기 있는 색상만 선별)
const HAIR_COLORS = [
    { name: "자연 블랙", hex: "#1a1a1a" },
    { name: "다크 브라운", hex: "#3d2314" },
    { name: "초코 브라운", hex: "#5c3317" },
    { name: "애쉬 브라운", hex: "#6b5b4f" },
    { name: "밀크 브라운", hex: "#a67b5b" },
    { name: "애쉬 그레이", hex: "#8a8a8a" },
    { name: "버건디", hex: "#6b1c23" },
    { name: "허니 블론드", hex: "#d4a96a" },
];

// hex → HSL 변환
function hexToHSL(hex: string): { h: number; s: number; l: number } {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// HSL → hex 변환
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

// 강도에 따라 색상 조절
function adjustColorIntensity(baseHex: string, intensity: number): string {
    const hsl = hexToHSL(baseHex);
    const satAdjust = hsl.s * (0.3 + (intensity / 100) * 0.7);
    const lightAdjust = intensity <= 50
        ? hsl.l + (100 - hsl.l) * ((50 - intensity) / 50) * 0.4
        : hsl.l - hsl.l * ((intensity - 50) / 50) * 0.3;
    return hslToHex(hsl.h, Math.round(satAdjust), Math.round(lightAdjust));
}

export default function ColorPalette({ selectedColor, onColorSelect }: ColorPaletteProps) {
    const [selectedBase, setSelectedBase] = useState<string | null>(null);
    const [intensity, setIntensity] = useState(50);

    const handleColorClick = useCallback((hex: string) => {
        if (selectedBase === hex) {
            setSelectedBase(null);
            onColorSelect(null);
            return;
        }
        setSelectedBase(hex);
        const adjusted = adjustColorIntensity(hex, intensity);
        onColorSelect(adjusted);
    }, [selectedBase, intensity, onColorSelect]);

    const handleIntensityChange = useCallback((val: number) => {
        setIntensity(val);
        if (selectedBase) {
            const adjusted = adjustColorIntensity(selectedBase, val);
            onColorSelect(adjusted);
        }
    }, [selectedBase, onColorSelect]);

    const handleReset = useCallback(() => {
        setSelectedBase(null);
        setIntensity(50);
        onColorSelect(null);
    }, [onColorSelect]);

    const selectedColorInfo = HAIR_COLORS.find(c => c.hex === selectedBase);

    return (
        <div className={styles.container}>
            {/* 색상 8개 가로 한 줄 + 선택 정보 */}
            <div className={styles.colorRow}>
                <div className={styles.paletteGrid}>
                    {HAIR_COLORS.map((color) => (
                        <button
                            key={color.hex}
                            className={`${styles.swatch} ${selectedBase === color.hex ? styles.swatchSelected : ""}`}
                            onClick={() => handleColorClick(color.hex)}
                            title={color.name}
                            aria-label={color.name}
                        >
                            <span
                                className={styles.swatchColor}
                                style={{ background: color.hex }}
                            />
                            {selectedBase === color.hex && (
                                <svg className={styles.checkIcon} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
                {selectedColorInfo && (
                    <span className={styles.selectedLabel}>{selectedColorInfo.name}</span>
                )}
            </div>

            {/* 강도 슬라이더 */}
            <div className={styles.sliderRow}>
                <div className={styles.sliderTrackWrap}>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={intensity}
                        onChange={(e) => handleIntensityChange(Number(e.target.value))}
                        className={styles.slider}
                        style={{
                            background: selectedBase
                                ? `linear-gradient(90deg, ${adjustColorIntensity(selectedBase, 0)}, ${selectedBase}, ${adjustColorIntensity(selectedBase, 100)})`
                                : 'linear-gradient(90deg, #e8e0d8, #8a7a6c, #3a2a1c)'
                        }}
                    />
                </div>
                <div className={styles.sliderMeta}>
                    <span className={styles.sliderLabel}>연하게</span>
                    <span className={styles.sliderValue}>{intensity}%</span>
                    <span className={styles.sliderLabel}>진하게</span>
                </div>
            </div>

            {/* 초기화 */}
            {selectedBase && (
                <button className={styles.resetBtn} onClick={handleReset}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    <span>초기화</span>
                </button>
            )}
        </div>
    );
}

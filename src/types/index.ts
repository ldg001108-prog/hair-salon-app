/**
 * 공통 타입 정의
 * 프로젝트 전체에서 사용되는 핵심 타입들
 */

// === 살롱 관련 ===
export interface Salon {
    id: string;
    name: string;
    logoUrl?: string;
    themeColor: string;
    reservationUrl?: string;
    sessionTimeoutMin: number;
    dailyLimit: number;
}

// === 헤어스타일 관련 ===
export type Gender = "female" | "male";

export interface Hairstyle {
    id: string;
    salonId: string;
    name: string;
    gender: Gender;
    category: string;
    imageUrl: string;
    story: string;
    isBest: boolean;
}

// === 예약 관련 ===
export interface Reservation {
    id: string;
    salonId: string;
    customerName: string;
    customerPhone: string;
    date: string;
    time: string;
    styleName?: string;
    colorName?: string;
    memo?: string;
    status: "pending" | "confirmed" | "completed" | "cancelled";
    createdAt: string;
}

// === API 응답 타입 ===
export interface ApiResponse<T = unknown> {
    success: boolean;
    error?: string;
    data?: T;
}

export interface TransformRequest {
    photo: string;
    styleName: string;
    styleDescription: string;
    category: string;
    salonId: string;
    colorName?: string;
    colorHex?: string;
    colorIntensity?: number;
    colorSaturation?: number;
    colorLightness?: number;
}

export interface TransformResponse {
    success: boolean;
    resultImage?: string;
    error?: string;
}

export interface ReservationFormData {
    customerName: string;
    customerPhone: string;
    date: string;
    time: string;
    styleName?: string;
    colorName?: string;
    memo?: string;
}

/**
 * API 서비스 레이어
 * 모든 백엔드 API 호출을 한곳에서 관리
 */

import type { TransformRequest, TransformResponse, ReservationFormData } from "@/types";

// === AI 합성 ===
export async function requestTransform(data: TransformRequest): Promise<TransformResponse> {
    const response = await fetch("/api/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return response.json();
}

// === 예약 ===
export async function createReservation(salonId: string, data: ReservationFormData) {
    const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salonId, ...data }),
    });
    return response.json();
}

// === 살롱 데이터 ===
export async function fetchSalonData(salonId: string) {
    const response = await fetch(`/api/salon/${salonId}`);
    return response.json();
}

export async function fetchSalonStyles(salonId: string) {
    const response = await fetch(`/api/admin/styles?salonId=${salonId}`);
    return response.json();
}

// === 인증 ===
export async function loginAdmin(email: string, password: string) {
    const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    return response.json();
}

export async function signupAdmin(email: string, password: string, salonName: string) {
    const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, salonName }),
    });
    return response.json();
}

// === 관리자 ===
export async function fetchAdminStats(salonId: string) {
    const response = await fetch(`/api/admin/stats?salonId=${salonId}`);
    return response.json();
}

export async function fetchAdminReservations(salonId: string) {
    const response = await fetch(`/api/admin/reservations?salonId=${salonId}`);
    return response.json();
}

export async function updateReservationStatus(reservationId: string, status: string) {
    const response = await fetch("/api/admin/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId, status }),
    });
    return response.json();
}

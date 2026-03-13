"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { useSalonData } from "@/hooks/useSalonData";
import { useTransform } from "@/hooks/useTransform";
import { useToast } from "@/hooks/useToast";
import Splash from "@/components/Splash/Splash";
import MainView from "@/components/MainView/MainView";

/** 세션 상태 */
type SessionStatus = "checking" | "valid" | "expired" | "invalid";

export default function SalonPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const rawSalonId = (params?.salonId as string) || "demo";
    const salonId = decodeURIComponent(rawSalonId);

    // 세션 토큰 검증 상태
    const [sessionStatus, setSessionStatus] = useState<SessionStatus>("checking");
    const [sessionError, setSessionError] = useState<string>("");
    const [expiresAt, setExpiresAt] = useState<number | null>(null);
    const [remainingMin, setRemainingMin] = useState<number | null>(null);

    // 살롱 데이터 로딩
    const { salon, hairstyles } = useSalonData(salonId);

    // 토스트 메시지
    const { message: toastMessage, showToast, hideToast } = useToast();

    // AI 합성 로직
    const {
        userPhoto, selectedStyleId, selectedColor,
        resultImage, isLoading,
        handlePhotoSelect, handlePhotoChange,
        handleClearResult, handleSynthesize, handleResynthesize,
        setSelectedStyleId, setSelectedColor,
    } = useTransform({ salonId, hairstyles, onError: showToast });

    // 스플래시 전환
    const { step, setStep } = useAppStore();
    const handleSplashComplete = useCallback(() => setStep("main"), [setStep]);

    // === 세션 토큰 검증 ===
    useEffect(() => {
        async function verifyToken() {
            // 개발 모드에서는 토큰 없이도 허용
            const isDev = process.env.NODE_ENV === "development";

            // URL 쿼리에서 토큰 추출
            const urlToken = searchParams.get("token");

            // sessionStorage에 저장된 토큰 체크
            const storedToken = sessionStorage.getItem(`salon-token-${salonId}`);
            const token = urlToken || storedToken;

            if (!token) {
                if (isDev) {
                    // 개발 모드: 토큰 없이 허용
                    console.log("[Session] 🔧 개발 모드 — 토큰 없이 허용");
                    setSessionStatus("valid");
                    return;
                }
                setSessionStatus("invalid");
                setSessionError("QR코드를 스캔하여 접속해주세요.");
                return;
            }

            try {
                const res = await fetch("/api/salon/verify-token", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });

                const data = await res.json();

                if (data.valid) {
                    // 토큰 유효 → sessionStorage에 저장
                    sessionStorage.setItem(`salon-token-${salonId}`, token);
                    setSessionStatus("valid");
                    setExpiresAt(data.expiresAt);
                    setRemainingMin(data.remainingMin);
                } else {
                    // 토큰 무효/만료
                    sessionStorage.removeItem(`salon-token-${salonId}`);
                    if (isDev) {
                        console.warn("[Session] 🔧 개발 모드 — 만료 토큰이지만 허용");
                        setSessionStatus("valid");
                        return;
                    }
                    setSessionStatus("expired");
                    setSessionError(data.error || "세션이 만료되었습니다.");
                }
            } catch (err) {
                console.error("[Session] 토큰 검증 실패:", err);
                const isDev = process.env.NODE_ENV === "development";
                if (isDev) {
                    setSessionStatus("valid");
                    return;
                }
                setSessionStatus("invalid");
                setSessionError("세션 확인에 실패했습니다. 다시 시도해주세요.");
            }
        }

        verifyToken();
    }, [salonId, searchParams]);

    // URL에서 token 파라미터 제거 (새로고침 우회 방지)
    const removeTokenFromUrl = useCallback(() => {
        if (typeof window === "undefined") return;
        const url = new URL(window.location.href);
        if (url.searchParams.has("token")) {
            url.searchParams.delete("token");
            window.history.replaceState({}, "", url.toString());
        }
    }, []);

    // === 세션 만료 타이머 ===
    useEffect(() => {
        if (sessionStatus !== "valid" || !expiresAt) return;

        const remaining = expiresAt - Date.now();
        if (remaining <= 0) {
            setSessionStatus("expired");
            setSessionError("세션이 만료되었습니다. QR코드를 다시 스캔해주세요.");
            removeTokenFromUrl();
            return;
        }

        // 남은 시간 업데이트 (1분마다)
        const interval = setInterval(() => {
            const left = expiresAt - Date.now();
            if (left <= 0) {
                setSessionStatus("expired");
                setSessionError("세션이 만료되었습니다. QR코드를 다시 스캔해주세요.");
                sessionStorage.removeItem(`salon-token-${salonId}`);
                removeTokenFromUrl();
                clearInterval(interval);
            } else {
                setRemainingMin(Math.ceil(left / 60000));
            }
        }, 60000);

        // 만료 시 자동 전환
        const timeout = setTimeout(() => {
            setSessionStatus("expired");
            setSessionError("세션이 만료되었습니다. QR코드를 다시 스캔해주세요.");
            sessionStorage.removeItem(`salon-token-${salonId}`);
            removeTokenFromUrl();
        }, remaining);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [sessionStatus, expiresAt, salonId, removeTokenFromUrl]);

    // === 로딩/검증 중 화면 ===
    if (sessionStatus === "checking") {
        return (
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                height: "100dvh", background: "var(--bg-primary, #faf8f5)",
                color: "var(--text-secondary, #666)", fontSize: 16,
            }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                    세션 확인 중...
                </div>
            </div>
        );
    }

    // === 세션 무효/만료 화면 ===
    if (sessionStatus === "expired" || sessionStatus === "invalid") {
        return (
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                height: "100dvh", background: "var(--bg-primary, #faf8f5)",
                padding: 24,
            }}>
                <div style={{
                    textAlign: "center", maxWidth: 360,
                    background: "white", borderRadius: 20, padding: "40px 28px",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>
                        {sessionStatus === "expired" ? "⏰" : "🔒"}
                    </div>
                    <h2 style={{
                        fontSize: 20, fontWeight: 700, marginBottom: 12,
                        color: "var(--text-primary, #1a1a2e)",
                    }}>
                        {sessionStatus === "expired" ? "세션 만료" : "접근 불가"}
                    </h2>
                    <p style={{
                        fontSize: 14, color: "var(--text-secondary, #666)",
                        lineHeight: 1.6, marginBottom: 24,
                    }}>
                        {sessionError}
                    </p>
                    <div style={{
                        padding: "12px 20px", background: "var(--bg-secondary, #f0ece5)",
                        borderRadius: 12, fontSize: 13,
                        color: "var(--text-secondary, #888)",
                    }}>
                        💡 미용실 내 QR코드를 스캔하면<br />서비스를 이용하실 수 있습니다.
                    </div>
                </div>
            </div>
        );
    }

    // === 정상 세션 — 기존 UI ===
    return (
        <>
            {/* 스플래시 */}
            {step === "splash" && (
                <Splash
                    salonName={salon.name}
                    logoUrl={salon.logoUrl || undefined}
                    themeColor={salon.themeColor}
                    onComplete={handleSplashComplete}
                />
            )}

            {/* 메인 (합성 결과도 여기서 인라인 표시) */}
            {step === "main" && (
                <MainView
                    salonId={salonId}
                    salonName={salon.name}
                    hairstyles={hairstyles}
                    userPhoto={userPhoto}
                    selectedStyleId={selectedStyleId}
                    selectedColor={selectedColor}
                    resultImage={resultImage}
                    onPhotoSelect={handlePhotoSelect}
                    onPhotoChange={handlePhotoChange}
                    onStyleSelect={setSelectedStyleId}
                    onColorSelect={setSelectedColor}
                    onSynthesize={handleSynthesize}
                    onResynthesize={handleResynthesize}
                    onClearResult={handleClearResult}
                    isLoading={isLoading}
                />
            )}

            {/* 남은 시간 표시 (10분 이하일 때) */}
            {remainingMin !== null && remainingMin <= 10 && (
                <div style={{
                    position: "fixed", top: "calc(env(safe-area-inset-top) + 16px)", left: "var(--sp-5, 20px)", zIndex: 9999,
                    background: remainingMin <= 3 ? "#ff4444" : "#ff8800",
                    color: "white", padding: "6px 14px", borderRadius: 20,
                    fontSize: 12, fontWeight: 600,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    animation: remainingMin <= 3 ? "pulse 1s infinite" : "none",
                }}>
                    ⏱ {remainingMin}분 남음
                </div>
            )}

            {/* 토스트 에러 메시지 */}
            {toastMessage && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: 100,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 10000,
                        background: 'var(--text-primary)',
                        color: 'var(--bg-primary)',
                        padding: '12px 20px',
                        borderRadius: 12,
                        fontSize: 14,
                        fontWeight: 600,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                        maxWidth: '80%',
                        textAlign: 'center',
                        animation: 'fadeIn 0.3s ease-out',
                    }}
                    onClick={hideToast}
                >
                    ⚠️ {toastMessage}
                </div>
            )}
        </>
    );
}

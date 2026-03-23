/**
 * 세션 토큰 생성/검증 유틸리티
 * - QR 코드에 포함되는 HMAC-SHA256 서명 토큰
 * - 미용실 밖에서는 접근 불가하도록 만료시간 포함
 * - 토큰 포맷: base64url(payload).signature
 */

import crypto from "crypto";

// === 타입 정의 ===
interface TokenPayload {
    /** 살롱 ID */
    sid: string;
    /** 발급 시간 (Unix timestamp, seconds) */
    iat: number;
    /** 만료 시간 (Unix timestamp, seconds) */
    exp: number;
    /** 고유 nonce (중복 방지) */
    nce: string;
    /** 원장님 영구 토큰 여부 */
    own?: boolean;
}

export interface TokenVerifyResult {
    valid: boolean;
    salonId?: string;
    expiresAt?: number;
    remainingMin?: number;
    isOwner?: boolean;
    error?: string;
}

// HMAC 키 가져오기
function getSecret(): string {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
        // 시크릿 미설정 시 경고 + fallback
        console.warn("[SessionToken] ⚠️ SESSION_SECRET 환경변수가 설정되지 않았습니다. 기본값 사용 중 (보안 취약)");
        return "hair-salon-default-secret-change-me";
    }
    return secret;
}

// base64url 인코딩 (URL-safe)
function toBase64Url(str: string): string {
    return Buffer.from(str, "utf-8")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

// base64url 디코딩
function fromBase64Url(b64: string): string {
    let str = b64.replace(/-/g, "+").replace(/_/g, "/");
    while (str.length % 4 !== 0) str += "=";
    return Buffer.from(str, "base64").toString("utf-8");
}

// HMAC-SHA256 서명 생성
function sign(payload: string): string {
    return crypto
        .createHmac("sha256", getSecret())
        .update(payload)
        .digest("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

/**
 * 세션 토큰 생성
 * @param salonId 살롱 ID
 * @param timeoutMin 만료 시간 (분), 기본 30분
 * @param isOwner 원장님 영구 토큰 여부
 * @returns 서명된 토큰 문자열
 */
export function generateSessionToken(salonId: string, timeoutMin: number = 30, isOwner: boolean = false): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: TokenPayload = {
        sid: salonId,
        iat: now,
        exp: now + timeoutMin * 60,
        nce: crypto.randomBytes(8).toString("hex"),
    };
    if (isOwner) {
        payload.own = true;
    }

    const payloadStr = toBase64Url(JSON.stringify(payload));
    const signature = sign(payloadStr);

    return `${payloadStr}.${signature}`;
}

/**
 * 세션 토큰 검증
 * @param token 토큰 문자열
 * @returns 검증 결과
 */
export function verifySessionToken(token: string): TokenVerifyResult {
    try {
        // 토큰 분리
        const parts = token.split(".");
        if (parts.length !== 2) {
            return { valid: false, error: "잘못된 토큰 형식입니다." };
        }

        const [payloadStr, signature] = parts;

        // 서명 검증
        const expectedSig = sign(payloadStr);
        if (signature !== expectedSig) {
            return { valid: false, error: "토큰 서명이 유효하지 않습니다." };
        }

        // 페이로드 파싱
        const payload: TokenPayload = JSON.parse(fromBase64Url(payloadStr));

        // 만료 체크 (원장님 토큰은 만료 없음)
        const now = Math.floor(Date.now() / 1000);
        if (!payload.own && now > payload.exp) {
            return {
                valid: false,
                salonId: payload.sid,
                error: "세션이 만료되었습니다. QR코드를 다시 스캔해주세요.",
            };
        }

        const remainingMin = payload.own ? 999999 : Math.ceil((payload.exp - now) / 60);

        return {
            valid: true,
            salonId: payload.sid,
            expiresAt: payload.own ? Date.now() + 10 * 365 * 24 * 3600 * 1000 : payload.exp * 1000,
            remainingMin,
            isOwner: !!payload.own,
        };
    } catch {
        return { valid: false, error: "토큰을 처리할 수 없습니다." };
    }
}

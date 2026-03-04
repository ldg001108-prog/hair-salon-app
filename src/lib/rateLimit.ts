/**
 * API Rate Limiter (인메모리 + Supabase 연동)
 * - IP + salonId 기반으로 분당/일일 합성 횟수 제한
 * - Supabase 연결 시: 살롱별 dailyLimit 적용
 * - 서버 재시작 시 인메모리 초기화됨 (분당 제한만 인메모리)
 */

import { getTodayUsage } from "./getSalonData";
import { getSalon } from "./getSalonData";

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

// 분당 제한 (인메모리)
const minuteMap = new Map<string, RateLimitEntry>();

// 설정값
const MINUTE_LIMIT = 5; // 분당 최대 5회 합성

// 오래된 엔트리 정리
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60 * 60 * 1000;

function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;

    for (const [key, entry] of minuteMap) {
        if (now > entry.resetAt) minuteMap.delete(key);
    }
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    retryAfterSec: number;
    limitType?: "minute" | "daily";
    dailyUsed?: number;
    dailyLimit?: number;
}

/**
 * 살롱별 Rate Limit 체크
 * - salonId가 있으면 살롱의 dailyLimit 기반으로 체크
 * - 없으면 기본 IP 기반 체크
 */
export async function checkSalonRateLimit(ip: string, salonId?: string): Promise<RateLimitResult> {
    cleanup();
    const now = Date.now();

    // 1) 분당 제한 체크 (인메모리)
    const minuteKey = `min:${ip}:${salonId || "default"}`;
    const minuteEntry = minuteMap.get(minuteKey);

    if (minuteEntry) {
        if (now > minuteEntry.resetAt) {
            minuteMap.set(minuteKey, { count: 1, resetAt: now + 60_000 });
        } else if (minuteEntry.count >= MINUTE_LIMIT) {
            return {
                allowed: false,
                remaining: 0,
                resetAt: minuteEntry.resetAt,
                retryAfterSec: Math.ceil((minuteEntry.resetAt - now) / 1000),
                limitType: "minute",
            };
        } else {
            minuteEntry.count++;
        }
    } else {
        minuteMap.set(minuteKey, { count: 1, resetAt: now + 60_000 });
    }

    // 2) 일일 제한 체크 (Supabase 기반)
    if (salonId) {
        const salon = await getSalon(salonId);
        const dailyLimit = salon?.dailyLimit || 50;
        const todayUsage = await getTodayUsage(salonId);

        if (todayUsage >= dailyLimit) {
            // 분당 카운트 되돌리기
            const me = minuteMap.get(minuteKey);
            if (me) me.count = Math.max(0, me.count - 1);

            const tomorrow = new Date();
            tomorrow.setHours(24, 0, 0, 0);

            return {
                allowed: false,
                remaining: 0,
                resetAt: tomorrow.getTime(),
                retryAfterSec: Math.ceil((tomorrow.getTime() - now) / 1000),
                limitType: "daily",
                dailyUsed: todayUsage,
                dailyLimit,
            };
        }

        const currentMinute = minuteMap.get(minuteKey);
        return {
            allowed: true,
            remaining: Math.min(
                MINUTE_LIMIT - (currentMinute?.count || 0),
                dailyLimit - todayUsage
            ),
            resetAt: currentMinute?.resetAt || now + 60_000,
            retryAfterSec: 0,
            dailyUsed: todayUsage,
            dailyLimit,
        };
    }

    // salonId 없으면 기본 한도
    const currentMinute = minuteMap.get(minuteKey);
    return {
        allowed: true,
        remaining: MINUTE_LIMIT - (currentMinute?.count || 0),
        resetAt: currentMinute?.resetAt || now + 60_000,
        retryAfterSec: 0,
    };
}


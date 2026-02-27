/**
 * API Rate Limiter (인메모리 방식)
 * - IP + salonId 기반으로 분당/일일 합성 횟수 제한
 * - 서버 재시작 시 초기화됨 (프로덕션에서는 Redis 추천)
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

// 분당 제한
const minuteMap = new Map<string, RateLimitEntry>();
// 일일 제한
const dailyMap = new Map<string, RateLimitEntry>();

// 설정값
const MINUTE_LIMIT = 5;   // 분당 최대 5회 합성
const DAILY_LIMIT = 50;   // 일일 최대 50회 합성

// 오래된 엔트리 정리 (메모리 누수 방지)
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1시간

function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;

    for (const [key, entry] of minuteMap) {
        if (now > entry.resetAt) minuteMap.delete(key);
    }
    for (const [key, entry] of dailyMap) {
        if (now > entry.resetAt) dailyMap.delete(key);
    }
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    retryAfterSec: number;
    limitType?: "minute" | "daily";
}

/**
 * IP 기반 Rate Limit 체크
 */
export function checkRateLimit(ip: string): RateLimitResult {
    cleanup();
    const now = Date.now();

    // 1) 분당 제한 체크
    const minuteKey = `min:${ip}`;
    const minuteEntry = minuteMap.get(minuteKey);

    if (minuteEntry) {
        if (now > minuteEntry.resetAt) {
            // 리셋 시간 경과 → 새로운 윈도우
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

    // 2) 일일 제한 체크
    const dailyKey = `day:${ip}`;
    const dailyEntry = dailyMap.get(dailyKey);

    // 자정까지 남은 시간
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0);
    const dailyResetAt = tomorrow.getTime();

    if (dailyEntry) {
        if (now > dailyEntry.resetAt) {
            dailyMap.set(dailyKey, { count: 1, resetAt: dailyResetAt });
        } else if (dailyEntry.count >= DAILY_LIMIT) {
            // 분당 카운트 되돌리기
            const me = minuteMap.get(minuteKey);
            if (me) me.count = Math.max(0, me.count - 1);

            return {
                allowed: false,
                remaining: 0,
                resetAt: dailyEntry.resetAt,
                retryAfterSec: Math.ceil((dailyEntry.resetAt - now) / 1000),
                limitType: "daily",
            };
        } else {
            dailyEntry.count++;
        }
    } else {
        dailyMap.set(dailyKey, { count: 1, resetAt: dailyResetAt });
    }

    const currentMinute = minuteMap.get(minuteKey);
    const currentDaily = dailyMap.get(dailyKey);

    return {
        allowed: true,
        remaining: Math.min(
            MINUTE_LIMIT - (currentMinute?.count || 0),
            DAILY_LIMIT - (currentDaily?.count || 0)
        ),
        resetAt: currentMinute?.resetAt || now + 60_000,
        retryAfterSec: 0,
    };
}

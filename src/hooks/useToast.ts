/**
 * useToast 훅
 * 토스트 메시지 표시/자동 숨김
 */

import { useState, useEffect, useCallback } from "react";

export function useToast(duration: number = 4000) {
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(() => setMessage(null), duration);
        return () => clearTimeout(timer);
    }, [message, duration]);

    const showToast = useCallback((msg: string) => setMessage(msg), []);
    const hideToast = useCallback(() => setMessage(null), []);

    return { message, showToast, hideToast };
}

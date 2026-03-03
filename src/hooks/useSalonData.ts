/**
 * useSalonData 훅
 * 살롱 데이터 로딩 및 테마 설정
 */

import { useState, useEffect } from "react";
import { DEMO_SALON, DEMO_HAIRSTYLES } from "@/data/demo";
import { fetchSalonData, fetchSalonStyles } from "@/services/api";
import type { Salon, Hairstyle } from "@/types";

export function useSalonData(salonId: string) {
    const [salon, setSalon] = useState<Salon>(DEMO_SALON as Salon);
    const [hairstyles, setHairstyles] = useState<Hairstyle[]>(DEMO_HAIRSTYLES as Hairstyle[]);
    const [dataLoaded, setDataLoaded] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const [salonRes, stylesRes] = await Promise.all([
                    fetchSalonData(salonId).catch(() => null),
                    fetchSalonStyles(salonId).catch(() => null),
                ]);

                // 살롱 정보 적용
                if (salonRes?.success && salonRes.salon) {
                    setSalon(salonRes.salon);
                    // 동적 테마 컬러 CSS 변수 설정
                    const tc = salonRes.salon.themeColor || "#2563EB";
                    document.documentElement.style.setProperty("--salon-theme", tc);
                    document.documentElement.style.setProperty("--salon-theme-light", tc + "22");
                    document.documentElement.style.setProperty("--salon-theme-hover", tc + "dd");
                }

                // 스타일 데이터 적용
                if (stylesRes?.success && stylesRes.hairstyles?.length > 0) {
                    setHairstyles(stylesRes.hairstyles);
                }
            } catch {
                console.log("[useSalonData] 데모 데이터 사용");
            } finally {
                setDataLoaded(true);
            }
        }

        loadData();
    }, [salonId]);

    return { salon, hairstyles, dataLoaded };
}

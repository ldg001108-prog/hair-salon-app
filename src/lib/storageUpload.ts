/**
 * Supabase Storage 이미지 업로드 유틸리티
 * 합성 결과 이미지를 Supabase Storage에 저장하고 공개 URL을 반환합니다.
 */

import { getSupabase } from "./supabase";

const BUCKET_NAME = "synthesis-results";

/**
 * Base64 이미지를 Supabase Storage에 업로드
 * @param base64Data - data:image/png;base64,... 형식 또는 순수 base64
 * @param salonId - 살롱 ID (폴더 경로에 사용)
 * @returns 공개 URL 또는 null
 */
export async function uploadSynthesisImage(
    base64Data: string,
    salonId: string
): Promise<{ url: string; path: string } | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
        // base64 데이터 정제
        const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Clean, "base64");

        // 파일명 생성: salonId/timestamp_random.png
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const filePath = `${salonId}/${timestamp}_${random}.png`;

        // 업로드
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, buffer, {
                contentType: "image/png",
                cacheControl: "31536000", // 1년 캐시
                upsert: false,
            });

        if (uploadError) {
            console.error("[Storage] 업로드 실패:", uploadError.message);
            return null;
        }

        // 공개 URL 가져오기
        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);

        const publicUrl = urlData.publicUrl;

        // 메타데이터 저장 (salon_images 테이블)
        await supabase.from("salon_images").insert({
            salon_id: salonId,
            storage_path: filePath,
            public_url: publicUrl,
            file_size: buffer.length,
        }).then(() => { });

        console.log(`[Storage] ✅ 업로드 성공: ${filePath} (${(buffer.length / 1024).toFixed(1)}KB)`);
        return { url: publicUrl, path: filePath };
    } catch (error) {
        console.error("[Storage] 예외:", error);
        return null;
    }
}

"use client";

import { useState, useCallback } from "react";
import styles from "./ReservationModal.module.css";

interface ReservationModalProps {
    salonId: string;
    styleName?: string;
    colorHex?: string | null;
    resultImageUrl?: string | null;
    onClose: () => void;
}

export default function ReservationModal({
    salonId,
    styleName,
    colorHex,
    resultImageUrl,
    onClose,
}: ReservationModalProps) {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [memo, setMemo] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    // 오늘 날짜 (최소 날짜)
    const today = new Date().toISOString().slice(0, 10);

    // 예약 가능 시간 목록
    const timeSlots = [
        "10:00", "10:30", "11:00", "11:30",
        "12:00", "12:30", "13:00", "13:30",
        "14:00", "14:30", "15:00", "15:30",
        "16:00", "16:30", "17:00", "17:30",
        "18:00", "18:30", "19:00", "19:30",
    ];

    const handleSubmit = useCallback(async () => {
        if (!name || !phone || !date || !time) {
            setError("이름, 연락처, 날짜, 시간을 모두 입력해주세요.");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const res = await fetch("/api/reservations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    salonId,
                    customerName: name,
                    customerPhone: phone,
                    styleName,
                    colorHex: colorHex || undefined,
                    resultImageUrl: resultImageUrl || undefined,
                    reservationDate: date,
                    reservationTime: time,
                    memo: memo || undefined,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setSuccess(true);
            } else {
                setError(data.error || "예약에 실패했습니다.");
            }
        } catch {
            setError("네트워크 오류가 발생했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    }, [salonId, name, phone, date, time, memo, styleName, colorHex, resultImageUrl]);

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* 헤더 */}
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        {success ? "✅ 예약 완료" : "📅 이 스타일로 예약"}
                    </h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {success ? (
                    /* 성공 화면 */
                    <div className={styles.successContent}>
                        <div className={styles.successIcon}>🎉</div>
                        <p className={styles.successMsg}>
                            예약이 접수되었습니다!
                        </p>
                        <p className={styles.successSub}>
                            미용실에서 확인 후 연락드릴게요.
                        </p>
                        {styleName && (
                            <div className={styles.reservationInfo}>
                                <span>✂️ {styleName}</span>
                                {colorHex && (
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                        🎨 <span className={styles.colorDot} style={{ background: colorHex }} />
                                    </span>
                                )}
                                <span>📅 {date} {time}</span>
                            </div>
                        )}
                        <button className={styles.doneBtn} onClick={onClose}>
                            확인
                        </button>
                    </div>
                ) : (
                    /* 입력 폼 */
                    <div className={styles.form}>
                        {/* 선택한 스타일 표시 */}
                        {styleName && (
                            <div className={styles.stylePreview}>
                                <span className={styles.styleLabel}>선택한 스타일</span>
                                <span className={styles.styleName}>✂️ {styleName}</span>
                                {colorHex && (
                                    <span className={styles.colorPreview}>
                                        <span className={styles.colorDot} style={{ background: colorHex }} />
                                        {colorHex}
                                    </span>
                                )}
                            </div>
                        )}

                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>이름 *</label>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="홍길동"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>연락처 *</label>
                            <input
                                type="tel"
                                className={styles.input}
                                placeholder="010-1234-5678"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>

                        <div className={styles.row}>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>날짜 *</label>
                                <input
                                    type="date"
                                    className={styles.input}
                                    min={today}
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>시간 *</label>
                                <select
                                    className={styles.input}
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                >
                                    <option value="">선택</option>
                                    {timeSlots.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>메모 (선택)</label>
                            <textarea
                                className={styles.textarea}
                                placeholder="요청사항이 있으시면 적어주세요"
                                value={memo}
                                onChange={(e) => setMemo(e.target.value)}
                                rows={2}
                            />
                        </div>

                        {error && <p className={styles.error}>{error}</p>}

                        <button
                            className={styles.submitBtn}
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "예약 중..." : "📅 예약하기"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

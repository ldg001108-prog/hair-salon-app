"use client";

import styles from "./page.module.css";

export default function PrivacyPage() {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <h1>개인정보 처리방침</h1>
                <p className={styles.date}>시행일: 2026년 3월 1일</p>

                <section>
                    <h2>1. 개인정보의 수집 및 이용 목적</h2>
                    <p>본 서비스는 다음의 목적을 위하여 개인정보를 수집·이용합니다.</p>
                    <ul>
                        <li><strong>AI 헤어스타일 가상 체험</strong>: 업로드된 얼굴 사진을 기반으로 헤어스타일 변환 결과를 제공하기 위해</li>
                        <li><strong>예약 서비스</strong>: 미용실 방문 예약 접수 및 확인 연락을 위해</li>
                        <li><strong>서비스 개선</strong>: 이용 통계 분석 및 서비스 품질 향상을 위해</li>
                    </ul>
                </section>

                <section>
                    <h2>2. 수집하는 개인정보 항목</h2>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>수집 항목</th>
                                <th>수집 시점</th>
                                <th>이용 목적</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>얼굴 사진</td>
                                <td>AI 합성 시</td>
                                <td>헤어스타일 변환</td>
                            </tr>
                            <tr>
                                <td>이름</td>
                                <td>예약 시</td>
                                <td>예약 확인</td>
                            </tr>
                            <tr>
                                <td>전화번호</td>
                                <td>예약 시</td>
                                <td>예약 연락</td>
                            </tr>
                            <tr>
                                <td>IP 주소</td>
                                <td>서비스 이용 시 (자동)</td>
                                <td>서비스 안정성 및 보안</td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                <section>
                    <h2>3. 개인정보의 보유 및 이용 기간</h2>
                    <ul>
                        <li><strong>얼굴 사진</strong>: AI 합성 처리 후 즉시 삭제 (서버에 영구 저장하지 않음)</li>
                        <li><strong>예약 정보</strong>: 예약 완료 후 6개월간 보관 후 파기</li>
                        <li><strong>이용 로그</strong>: 서비스 이용일로부터 1년간 보관 후 파기</li>
                    </ul>
                </section>

                <section>
                    <h2>4. 개인정보의 제3자 제공</h2>
                    <p>본 서비스는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.</p>
                    <ul>
                        <li>이용자가 사전에 동의한 경우</li>
                        <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차에 따라 요청이 있는 경우</li>
                    </ul>
                </section>

                <section>
                    <h2>5. 개인정보의 처리 위탁</h2>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>위탁 업체</th>
                                <th>위탁 업무</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Google (Gemini API)</td>
                                <td>AI 이미지 생성 처리</td>
                            </tr>
                            <tr>
                                <td>Supabase</td>
                                <td>데이터베이스 및 파일 저장</td>
                            </tr>
                            <tr>
                                <td>Vercel</td>
                                <td>웹 호스팅 및 서버 운영</td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                <section>
                    <h2>6. 이용자의 권리</h2>
                    <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
                    <ul>
                        <li>개인정보 열람 요구</li>
                        <li>오류 등이 있을 경우 정정 요구</li>
                        <li>삭제 요구</li>
                        <li>처리 정지 요구</li>
                    </ul>
                    <p>위 권리 행사는 아래 연락처로 문의해 주시기 바랍니다.</p>
                </section>

                <section>
                    <h2>7. 개인정보 보호책임자</h2>
                    <ul>
                        <li><strong>담당자</strong>: (주)오투랩</li>
                        <li><strong>이메일</strong>: o2lab@naver.com</li>
                        <li><strong>전화</strong>: 051-710-4221</li>
                    </ul>
                </section>

                <section>
                    <h2>8. 개인정보의 안전성 확보 조치</h2>
                    <ul>
                        <li>데이터 전송 시 SSL/TLS 암호화 적용</li>
                        <li>접근 권한의 제한 및 관리</li>
                        <li>개인정보 처리 시스템에 대한 접근 통제</li>
                    </ul>
                </section>

                <div className={styles.footer}>
                    <p>본 방침은 2026년 3월 1일부터 시행됩니다.</p>
                    <a href="/" className={styles.backLink}>← 메인으로 돌아가기</a>
                </div>
            </div>
        </div>
    );
}

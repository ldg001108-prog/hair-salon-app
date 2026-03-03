"use client";

import styles from "./page.module.css";

export default function TermsPage() {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <h1>서비스 이용약관</h1>
                <p className={styles.date}>시행일: 2026년 3월 1일</p>

                <section>
                    <h2>제1조 (목적)</h2>
                    <p>본 약관은 (주)오투랩(이하 &quot;회사&quot;)이 제공하는 AI Hair Studio 서비스(이하 &quot;서비스&quot;)의 이용 조건 및 절차, 회사와 이용자 간의 권리·의무를 규정함을 목적으로 합니다.</p>
                </section>

                <section>
                    <h2>제2조 (서비스의 내용)</h2>
                    <p>회사가 제공하는 서비스는 다음과 같습니다.</p>
                    <ul>
                        <li>AI 기반 헤어스타일 가상 체험 서비스</li>
                        <li>미용실 방문 예약 서비스</li>
                        <li>미용실 관리자 대시보드 서비스</li>
                    </ul>
                </section>

                <section>
                    <h2>제3조 (이용자의 의무)</h2>
                    <ul>
                        <li>이용자는 본인의 사진만 업로드해야 하며, 타인의 사진을 무단으로 사용해서는 안 됩니다.</li>
                        <li>서비스를 비정상적인 방법으로 이용하거나 시스템에 부하를 가하는 행위를 해서는 안 됩니다.</li>
                        <li>예약 시 정확한 연락처를 기입해야 하며, 허위 예약을 해서는 안 됩니다.</li>
                        <li>서비스를 이용하여 생성된 결과물을 타인의 명예를 훼손하거나 불법적인 목적으로 사용해서는 안 됩니다.</li>
                    </ul>
                </section>

                <section>
                    <h2>제4조 (AI 합성 결과물에 대한 면책)</h2>
                    <ul>
                        <li>AI가 생성한 헤어스타일 변환 결과는 <strong>시뮬레이션 이미지</strong>이며, 실제 시술 결과와 차이가 있을 수 있습니다.</li>
                        <li>합성 결과물은 참고용이며, 회사는 실제 시술 결과에 대해 책임을 지지 않습니다.</li>
                        <li>합성 결과물의 품질은 업로드된 사진의 해상도, 각도, 조명 조건 등에 따라 달라질 수 있습니다.</li>
                    </ul>
                </section>

                <section>
                    <h2>제5조 (예약 및 취소)</h2>
                    <ul>
                        <li>예약은 미용실의 운영 시간 내에서 가능합니다.</li>
                        <li>예약 변경 또는 취소는 미용실에 직접 연락하여 처리합니다.</li>
                        <li>무단 불참(No-show) 시 미용실의 정책에 따라 불이익이 있을 수 있습니다.</li>
                    </ul>
                </section>

                <section>
                    <h2>제6조 (서비스 중단)</h2>
                    <p>회사는 다음의 경우 서비스 제공을 일시적으로 중단할 수 있습니다.</p>
                    <ul>
                        <li>시스템 정기 점검 및 업데이트</li>
                        <li>천재지변, 국가비상사태 등 불가항력적 사유</li>
                        <li>서비스 설비의 장애 또는 이용 폭주</li>
                    </ul>
                </section>

                <section>
                    <h2>제7조 (지적재산권)</h2>
                    <ul>
                        <li>서비스의 디자인, 기술, 소프트웨어에 대한 권리는 회사에 있습니다.</li>
                        <li>이용자가 업로드한 사진의 권리는 이용자에게 있으며, 회사는 서비스 제공 목적 외에 사용하지 않습니다.</li>
                        <li>AI가 생성한 합성 결과물은 이용자가 개인적으로 자유롭게 사용할 수 있습니다.</li>
                    </ul>
                </section>

                <section>
                    <h2>제8조 (손해배상)</h2>
                    <p>회사는 무료로 제공되는 서비스의 이용과 관련하여 이용자에게 발생한 손해에 대해 책임을 지지 않습니다. 다만, 회사의 고의 또는 중과실로 인한 손해는 예외로 합니다.</p>
                </section>

                <section>
                    <h2>제9조 (분쟁 해결)</h2>
                    <p>본 약관과 관련한 분쟁은 대한민국 법률에 따르며, 관할 법원은 회사 소재지 관할 법원으로 합니다.</p>
                </section>

                <section>
                    <h2>제10조 (연락처)</h2>
                    <ul>
                        <li><strong>회사명</strong>: (주)오투랩</li>
                        <li><strong>주소</strong>: 부산광역시 부산진구 엄광로176(동의대학교) 산학협력관 301호</li>
                        <li><strong>이메일</strong>: o2lab@naver.com</li>
                        <li><strong>전화</strong>: 051-710-4221</li>
                    </ul>
                </section>

                <div className={styles.footer}>
                    <p>본 약관은 2026년 3월 1일부터 시행됩니다.</p>
                    <a href="/" className={styles.backLink}>← 메인으로 돌아가기</a>
                </div>
            </div>
        </div>
    );
}

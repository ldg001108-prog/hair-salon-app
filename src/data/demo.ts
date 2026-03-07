// 미용실 데모 데이터 (추후 Supabase에서 가져올 예정)
export interface Salon {
    id: string;
    name: string;
    logoUrl?: string;
    themeColor: string;
    reservationUrl?: string;
    sessionTimeoutMin: number;
    dailyLimit: number;
}

export interface Hairstyle {
    id: string;
    salonId: string;
    name: string;
    gender: "female" | "male"; // 성별
    category: string;
    imageUrl: string;
    story: string;
    isBest: boolean;
}

// 성별 탭
export const GENDERS = [
    { id: "female", label: "WOMAN" },
    { id: "male", label: "MAN" },
] as const;

// 카테고리 목록
export const CATEGORIES = [
    { id: "best", label: "Best" },
    { id: "short", label: "Short" },
    { id: "medium", label: "Medium" },
    { id: "long", label: "Long" },
];

// 헤어 컬러 프리셋 (프리미엄 살롱 컬러)
export const HAIR_COLORS = [
    { id: "natural-black", label: "내추럴 블랙", hex: "#1B1B1B" },
    { id: "dark-brown", label: "다크 브라운", hex: "#3B2314" },
    { id: "choco-brown", label: "초코 브라운", hex: "#5C3A1E" },
    { id: "ash-brown", label: "애쉬 브라운", hex: "#7B6B5D" },
    { id: "burgundy", label: "버건디", hex: "#722F37" },
    { id: "wine-red", label: "와인 레드", hex: "#8B2252" },
    { id: "rose-gold", label: "로즈 골드", hex: "#B76E79" },
    { id: "honey-blonde", label: "허니 블론드", hex: "#C4956A" },
    { id: "ash-grey", label: "애쉬 그레이", hex: "#8E8E8E" },
    { id: "platinum", label: "플래티넘", hex: "#D4CDC6" },
    { id: "olive-brown", label: "올리브 브라운", hex: "#6B6340" },
];

// 데모 미용실
export const DEMO_SALON: Salon = {
    id: "demo",
    name: "스타일랩 헤어",
    logoUrl: "",
    themeColor: "#2563EB",
    sessionTimeoutMin: 30,
    dailyLimit: 10,
};

// ============================================
// 여성 헤어스타일 (2025 트렌드 기반)
// ============================================
const FEMALE_STYLES: Hairstyle[] = [
    // ── Best ──
    {
        id: "f1",
        salonId: "demo",
        name: "클래식 레이어드컷",
        gender: "female",
        category: "best",
        imageUrl: "/styles/f_best_1.png",
        story: "어깨에 닿는 미디엄 길이에 커튼뱅을 더한 레이어드컷. 자연스러운 볼륨감으로 얼굴형에 관계없이 어울리는 만능 스타일입니다.",
        isBest: true,
    },
    {
        id: "f2",
        salonId: "demo",
        name: "시크 보브컷",
        gender: "female",
        category: "best",
        imageUrl: "/styles/f_best_2.png",
        story: "턱선 아래로 깔끔하게 자른 원렝스 보브. 센터 파팅으로 세련되고 당당한 이미지를 연출합니다.",
        isBest: true,
    },
    {
        id: "f3",
        salonId: "demo",
        name: "내추럴 웨이브 펌",
        gender: "female",
        category: "best",
        imageUrl: "/styles/f_best_3.png",
        story: "S자 물결이 자연스럽게 흐르는 미디엄 롱 웨이브. 모발이 얇은 분들에게도 풍성한 볼륨감을 줍니다.",
        isBest: true,
    },
    {
        id: "f4",
        salonId: "demo",
        name: "허쉬컷",
        gender: "female",
        category: "best",
        imageUrl: "/styles/f_best_4.png",
        story: "겹겹이 쌓인 레이어와 시스루 뱅이 특징인 트렌드 스타일. 가벼운 질감과 자연스러운 움직임이 매력입니다.",
        isBest: true,
    },
    {
        id: "f5",
        salonId: "demo",
        name: "글로시 생머리",
        gender: "female",
        category: "best",
        imageUrl: "/styles/f_best_5.png",
        story: "윤기 있고 건강한 롱 스트레이트 헤어. 사이드 파팅으로 깔끔하면서도 청순한 이미지를 연출합니다.",
        isBest: true,
    },

    // ── Short ──
    {
        id: "f6",
        salonId: "demo",
        name: "픽시컷",
        gender: "female",
        category: "short",
        imageUrl: "/styles/f_short_1.png",
        story: "귀를 드러내는 초단발 스타일. 텍스처를 살린 탑과 테이퍼드 사이드로 세련되고 당당한 인상을 줍니다.",
        isBest: false,
    },
    {
        id: "f7",
        salonId: "demo",
        name: "태슬컷",
        gender: "female",
        category: "short",
        imageUrl: "/styles/f_short_2.png",
        story: "층이 잘게 들어간 단발. 끝이 자연스럽게 가늘어지는 페더드 라인이 부드러운 분위기를 연출합니다.",
        isBest: false,
    },
    {
        id: "f8",
        salonId: "demo",
        name: "슬릭 블런트 보브",
        gender: "female",
        category: "short",
        imageUrl: "/styles/f_short_3.png",
        story: "턱선 단발을 층 없이 한 줄로 깔끔하게 자른 원렝스. 반짝이는 글로시한 질감이 도시적인 느낌을 줍니다.",
        isBest: false,
    },
    {
        id: "f9",
        salonId: "demo",
        name: "C컬 보브",
        gender: "female",
        category: "short",
        imageUrl: "/styles/f_short_4.png",
        story: "머리 끝을 안쪽으로 살짝 말아주는 C컬 단발. 얼굴을 감싸는 라인이 부드럽고 여성스러운 느낌을 줍니다.",
        isBest: false,
    },
    {
        id: "f10",
        salonId: "demo",
        name: "빅시컷",
        gender: "female",
        category: "short",
        imageUrl: "/styles/f_short_5.png",
        story: "픽시와 보브의 중간 형태. 정수리 볼륨을 살리고 목덜미는 슬림하게 정리한 개성 있는 스타일입니다.",
        isBest: false,
    },

    // ── Medium ──
    {
        id: "f11",
        salonId: "demo",
        name: "롭 (Long Bob)",
        gender: "female",
        category: "medium",
        imageUrl: "/styles/f_medium_1.png",
        story: "쇄골에 닿는 긴 단발. 끝에 살짝 아웃컬을 넣어 가벼운 움직임을 주며, 사이드 파팅으로 세련된 느낌.",
        isBest: false,
    },
    {
        id: "f12",
        salonId: "demo",
        name: "울프컷",
        gender: "female",
        category: "medium",
        imageUrl: "/styles/f_medium_2.png",
        story: "어깨 닿는 길이에 강한 레이어와 샤기 텍스처. 커튼뱅과 함께 트렌디하면서도 자유로운 분위기.",
        isBest: false,
    },
    {
        id: "f13",
        salonId: "demo",
        name: "미디엄 샤기컷",
        gender: "female",
        category: "medium",
        imageUrl: "/styles/f_medium_3.png",
        story: "어깨 길이에 잘게 들어간 층과 시스루 뱅의 조합. 모던하고 개성 있는 K-스타일의 대표 커트.",
        isBest: false,
    },
    {
        id: "f14",
        salonId: "demo",
        name: "라이트 레이어드",
        gender: "female",
        category: "medium",
        imageUrl: "/styles/f_medium_4.png",
        story: "과하지 않은 얼굴 주변 층으로 볼륨을 잡은 미디엄 헤어. 사이드 파팅으로 자연스럽게 얼굴선을 보정합니다.",
        isBest: false,
    },
    {
        id: "f15",
        salonId: "demo",
        name: "웨이비 롭 펌",
        gender: "female",
        category: "medium",
        imageUrl: "/styles/f_medium_5.png",
        story: "쇄골 길이에 루즈한 S컬 바디웨이브. 사이드 파팅과 볼륨감으로 화사하고 여성스러운 느낌.",
        isBest: false,
    },

    // ── Long ──
    {
        id: "f16",
        salonId: "demo",
        name: "히메컷",
        gender: "female",
        category: "long",
        imageUrl: "/styles/f_long_1.png",
        story: "블런트 뱅과 턱선 페이스프레이밍 레이어가 특징. 동양적이면서 세련된 분위기의 롱 스트레이트.",
        isBest: false,
    },
    {
        id: "f17",
        salonId: "demo",
        name: "커튼뱅 롱웨이브",
        gender: "female",
        category: "long",
        imageUrl: "/styles/f_long_2.png",
        story: "가르마 양쪽으로 흐르는 커튼뱅과 큰 물결 웨이브. 얼굴형을 보정하며 화려한 볼륨감을 줍니다.",
        isBest: false,
    },
    {
        id: "f18",
        salonId: "demo",
        name: "히피 펌",
        gender: "female",
        category: "long",
        imageUrl: "/styles/f_long_3.png",
        story: "잔잔한 S컬이 중간부터 끝까지 연속되는 롱 펌. 풍성한 볼륨으로 자유로운 분위기를 연출합니다.",
        isBest: false,
    },
    {
        id: "f19",
        salonId: "demo",
        name: "하이 레이어드",
        gender: "female",
        category: "long",
        imageUrl: "/styles/f_long_4.png",
        story: "턱선부터 시작하는 그라데이션 레이어. 페이스프레이밍과 볼륨감으로 얼굴을 작아 보이게 합니다.",
        isBest: false,
    },
    {
        id: "f20",
        salonId: "demo",
        name: "클라우드 펌",
        gender: "female",
        category: "long",
        imageUrl: "/styles/f_long_5.png",
        story: "구름처럼 부드럽고 탄력 있는 바운시 컬의 롱 펌. 센터 파팅으로 로맨틱한 분위기를 극대화합니다.",
        isBest: false,
    },
];

// ============================================
// 남성 헤어스타일 (2025 트렌드 기반)
// ============================================
const MALE_STYLES: Hairstyle[] = [
    // ── Best ──
    {
        id: "m1",
        salonId: "demo",
        name: "투블럭컷",
        gender: "male",
        category: "best",
        imageUrl: "/styles/m_best_1.png",
        story: "옆과 뒤를 짧게 밀고 윗머리에 볼륨을 준 클래식 K-스타일. 깔끔하고 단정한 인상으로 직장인부터 학생까지 인기!",
        isBest: true,
    },
    {
        id: "m2",
        salonId: "demo",
        name: "가일컷 (콤마헤어)",
        gender: "male",
        category: "best",
        imageUrl: "/styles/m_best_2.png",
        story: "콤마 모양으로 한쪽으로 넘기는 소프트한 앞머리. 부드럽고 자연스러운 인상을 원하는 남성에게 추천!",
        isBest: true,
    },
    {
        id: "m3",
        salonId: "demo",
        name: "댄디컷",
        gender: "male",
        category: "best",
        imageUrl: "/styles/m_best_3.png",
        story: "이마를 드러내 시원한 인상을 주는 클래식 정통 남성 스타일. 정장과 최고의 궁합입니다.",
        isBest: true,
    },
    {
        id: "m4",
        salonId: "demo",
        name: "내추럴 샤기컷",
        gender: "male",
        category: "best",
        imageUrl: "/styles/m_best_4.png",
        story: "얇은 층을 여러 겹 쌓아 가볍고 자연스러운 무드를 낸 미디엄 헤어. 꾸민 듯 안 꾸민 듯한 캐주얼 느낌이 특징.",
        isBest: true,
    },
    {
        id: "m5",
        salonId: "demo",
        name: "쉐도우 펌",
        gender: "male",
        category: "best",
        imageUrl: "/styles/m_best_5.png",
        story: "자연스러운 S컬을 넣어 볼륨감을 주는 남성 펌. 스타일링 없이도 멋스럽게 떨어지는 것이 매력!",
        isBest: true,
    },

    // ── Short ──
    {
        id: "m6",
        salonId: "demo",
        name: "텍스처드 크롭",
        gender: "male",
        category: "short",
        imageUrl: "/styles/m_short_1.png",
        story: "짧고 거친 질감을 살린 탑과 페이드 사이드. 살짝 내린 앞머리가 이마를 부분적으로 가려 활기찬 느낌.",
        isBest: false,
    },
    {
        id: "m7",
        salonId: "demo",
        name: "버즈컷",
        gender: "male",
        category: "short",
        imageUrl: "/styles/m_short_2.png",
        story: "6mm로 전체를 짧게 밀어 두상이 드러나는 극초단발. 미니멀하고 강렬한 인상을 줍니다.",
        isBest: false,
    },
    {
        id: "m8",
        salonId: "demo",
        name: "드롭 페이드",
        gender: "male",
        category: "short",
        imageUrl: "/styles/m_short_3.png",
        story: "귀 뒤쪽으로 갈수록 짧아지는 그라데이션 페이드와 볼륨 있는 탑의 대비가 모던한 느낌을 줍니다.",
        isBest: false,
    },
    {
        id: "m9",
        salonId: "demo",
        name: "시저컷",
        gender: "male",
        category: "short",
        imageUrl: "/styles/m_short_4.png",
        story: "짧고 균일한 길이의 탑과 직선 마이크로 프린지. 깔끔한 사이드 페이드로 정돈된 인상.",
        isBest: false,
    },
    {
        id: "m10",
        salonId: "demo",
        name: "아이비리그컷",
        gender: "male",
        category: "short",
        imageUrl: "/styles/m_short_5.png",
        story: "클래식한 프레피 스타일. 한쪽으로 빗어 넘긴 짧은 탑과 깔끔한 사이드로 지적인 느낌을 줍니다.",
        isBest: false,
    },

    // ── Medium ──
    {
        id: "m11",
        salonId: "demo",
        name: "리젠트컷",
        gender: "male",
        category: "medium",
        imageUrl: "/styles/m_medium_1.png",
        story: "앞머리를 뒤로 넘겨 볼륨을 준 클래식 스타일. 남성적이면서도 세련된 분위기를 연출합니다.",
        isBest: false,
    },
    {
        id: "m12",
        salonId: "demo",
        name: "울프컷",
        gender: "male",
        category: "medium",
        imageUrl: "/styles/m_medium_2.png",
        story: "레이어와 샤기 텍스처가 특징인 미디엄 헤어. 뒷머리에 약간의 멀릿 느낌을 더한 K-pop 스타일.",
        isBest: false,
    },
    {
        id: "m13",
        salonId: "demo",
        name: "커튼뱅 스타일",
        gender: "male",
        category: "medium",
        imageUrl: "/styles/m_medium_3.png",
        story: "가르마 양쪽으로 자연스럽게 흐르는 앞머리가 부드러운 인상을 줍니다. 눈썹 아래까지 내려오는 길이.",
        isBest: false,
    },
    {
        id: "m14",
        salonId: "demo",
        name: "소프트 멀릿",
        gender: "male",
        category: "medium",
        imageUrl: "/styles/m_medium_4.png",
        story: "짧은 옆면과 길고 부드러운 뒷머리로 대담하고 트렌디한 룩. 강약 대비가 뚜렷한 스타일.",
        isBest: false,
    },
    {
        id: "m15",
        salonId: "demo",
        name: "포마드 슬릭백",
        gender: "male",
        category: "medium",
        imageUrl: "/styles/m_medium_5.png",
        story: "올백으로 넘겨 깔끔하고 강렬한 인상을 주는 클래식 스타일. 광택 있는 피니시가 포인트.",
        isBest: false,
    },

    // ── Long ──
    {
        id: "m16",
        salonId: "demo",
        name: "맨번 (Man Bun)",
        gender: "male",
        category: "long",
        imageUrl: "/styles/m_long_1.png",
        story: "뒤에서 하나로 묶어 올린 남성 롱헤어 스타일. 깔끔하면서도 자유분방한 매력을 동시에 연출합니다.",
        isBest: false,
    },
    {
        id: "m17",
        salonId: "demo",
        name: "장발 레이어드",
        gender: "male",
        category: "long",
        imageUrl: "/styles/m_long_2.png",
        story: "어깨까지 내려오는 긴 머리에 자연스러운 층. 센터 파팅으로 차분하고 지적인 인상을 줍니다.",
        isBest: false,
    },
    {
        id: "m18",
        salonId: "demo",
        name: "플로우컷",
        gender: "male",
        category: "long",
        imageUrl: "/styles/m_long_3.png",
        story: "광대뼈를 스치는 플로위 뱅과 정의된 레이어. 긴 네이프와 함께 자연스러운 흐름이 특징.",
        isBest: false,
    },
    {
        id: "m19",
        salonId: "demo",
        name: "롱 웨이비",
        gender: "male",
        category: "long",
        imageUrl: "/styles/m_long_4.png",
        story: "어깨 길이의 자연스러운 루즈 웨이브. 센터 파팅과 볼륨감으로 스타일리시한 느낌을 줍니다.",
        isBest: false,
    },
    {
        id: "m20",
        salonId: "demo",
        name: "사무라이 하프업",
        gender: "male",
        category: "long",
        imageUrl: "/styles/m_long_5.png",
        story: "윗머리 절반만 묶고 아래는 풀어 내린 하프업. 강인하면서도 스타일리시한 느낌을 동시에 연출합니다.",
        isBest: false,
    },
];

// 전체 스타일 합치기
export const DEMO_HAIRSTYLES: Hairstyle[] = [...FEMALE_STYLES, ...MALE_STYLES];

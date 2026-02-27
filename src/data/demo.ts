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
    { id: "perm", label: "Perm" },
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
    dailyLimit: 50,
};

// ============================================
// 여성 헤어스타일 (AI 생성 이미지)
// ============================================
const FEMALE_STYLES: Hairstyle[] = [
    {
        id: "f1",
        salonId: "demo",
        name: "클래식 레이어드컷",
        gender: "female",
        category: "medium",
        imageUrl: "/styles/f1.webp",
        story: "레이어드컷은 얼굴형에 관계없이 자연스러운 볼륨감을 주어 누구나 잘 어울리는 만능 스타일입니다. 특히 둥근 얼굴형에 갸름해 보이는 효과가 있어요!",
        isBest: true,
    },
    {
        id: "f2",
        salonId: "demo",
        name: "시크 단발 보브컷",
        gender: "female",
        category: "short",
        imageUrl: "/styles/f2.webp",
        story: "턱선을 따라 깔끔하게 자른 보브컷은 세련되고 당당한 이미지를 줍니다. 직모에게도 곱슬에게도 활용도 높은 스타일!",
        isBest: true,
    },
    {
        id: "f3",
        salonId: "demo",
        name: "내추럴 웨이브 펌",
        gender: "female",
        category: "perm",
        imageUrl: "/styles/f3.webp",
        story: "S자 물결이 자연스러운 볼륨을 만들어주어 모발이 얇은 분들에게도 풍성한 느낌을 줍니다. 관리도 쉬워서 인기 만점!",
        isBest: true,
    },
    {
        id: "f4",
        salonId: "demo",
        name: "허쉬컷",
        gender: "female",
        category: "medium",
        imageUrl: "/styles/f4.webp",
        story: "허쉬컷은 울프컷에서 진화한 트렌드 스타일이에요. 앞머리에서 뒤로 갈수록 자연스럽게 층을 넣어 가벼운 느낌을 줍니다.",
        isBest: false,
    },
    {
        id: "f5",
        salonId: "demo",
        name: "픽시컷",
        gender: "female",
        category: "short",
        imageUrl: "/styles/f5.webp",
        story: "오드리 헵번이 선보인 이후 전 세계적으로 사랑받는 스타일. 세련되고 당당한 이미지를 원하는 분에게 추천합니다.",
        isBest: false,
    },
    {
        id: "f6",
        salonId: "demo",
        name: "C컬 펌",
        gender: "female",
        category: "perm",
        imageUrl: "/styles/f6.webp",
        story: "머리 끝을 안쪽으로 살짝 말아주는 스타일. 얼굴을 감싸는 라인이 부드럽고 여성스러운 느낌을 줍니다.",
        isBest: false,
    },
    {
        id: "f7",
        salonId: "demo",
        name: "롱 히메컷",
        gender: "female",
        category: "long",
        imageUrl: "/styles/f7.webp",
        story: "일본 헤이안 시대 공주에게서 유래한 스타일. 동양적인 분위기를 살리면서도 세련된 느낌을 원하면 딱!",
        isBest: false,
    },
    {
        id: "f8",
        salonId: "demo",
        name: "태슬컷",
        gender: "female",
        category: "short",
        imageUrl: "/styles/f8.webp",
        story: "층이 잘게 들어간 단발컷. 자연스럽게 끝이 가늘어지는 테이퍼드 라인이 세련된 분위기를 연출합니다.",
        isBest: false,
    },
    {
        id: "f9",
        salonId: "demo",
        name: "소프트 히피펌",
        gender: "female",
        category: "long",
        imageUrl: "/styles/f9.webp",
        story: "잔잔한 S컬 물결 웨이브가 특징인 롱헤어 펌. 과하지 않은 자연스러운 볼륨감으로 얼굴이 작아 보이며, 부드럽고 여성스러운 분위기를 연출합니다. 머리 중간부터 끝까지 물결 웨이브가 흐릅니다.",
        isBest: true,
    },
    {
        id: "f10",
        salonId: "demo",
        name: "빅시컷",
        gender: "female",
        category: "short",
        imageUrl: "/styles/f10.webp",
        story: "픽시컷과 보브컷의 중간 형태. 정수리에 풍성한 볼륨을 주고 목덜미는 슬림하게 정리합니다. 귀가 살짝 보이는 길이로 얼굴을 환하게 드러내며, 개성 있고 시크한 느낌을 줍니다.",
        isBest: false,
    },
    {
        id: "f11",
        salonId: "demo",
        name: "슬릭 단발",
        gender: "female",
        category: "short",
        imageUrl: "/styles/f11.webp",
        story: "턱선에 맞춘 매끄러운 원랭스 스트레이트 보브. 층 없이 깔끔하게 한 줄로 자른 단발로, 도시적이고 세련된 인상을 줍니다. 머릿결이 반짝이는 글로시한 질감이 포인트입니다.",
        isBest: false,
    },
    {
        id: "f12",
        salonId: "demo",
        name: "글로시 생머리",
        gender: "female",
        category: "long",
        imageUrl: "/styles/f12.webp",
        story: "윤기 있고 결감이 살아있는 롱 스트레이트 헤어. 끝에 살짝 J컬을 넣어 자연스러움을 더합니다. 가슴 아래까지 내려오는 긴 생머리로, 건강하고 청순한 이미지를 연출합니다.",
        isBest: false,
    },
    {
        id: "f13",
        salonId: "demo",
        name: "라이트 레이어드",
        gender: "female",
        category: "medium",
        imageUrl: "/styles/f13.webp",
        story: "과하지 않게 얼굴 주변에 가벼운 층을 넣은 미디엄 헤어. 얼굴선을 자연스럽게 보정하면서 옆 라인에 볼륨을 줍니다. 가르마 부분의 뿌리 볼륨이 포인트입니다.",
        isBest: false,
    },
    {
        id: "f14",
        salonId: "demo",
        name: "시스루 뱅 + 중단발",
        gender: "female",
        category: "medium",
        imageUrl: "/styles/f14.webp",
        story: "얇고 투명한 시스루 앞머리와 어깨선 단발의 조합. 이마가 살짝 비치는 가벼운 앞머리가 얼굴을 부드럽게 감싸며, 어깨에 닿는 길이로 깔끔하면서도 여성스럽습니다.",
        isBest: false,
    },
    {
        id: "f15",
        salonId: "demo",
        name: "커튼뱅 롱웨이브",
        gender: "female",
        category: "long",
        imageUrl: "/styles/f15.webp",
        story: "가르마 양쪽으로 자연스럽게 갈라지는 커튼뱅과 큰 웨이브의 롱헤어. 얼굴 양쪽을 부드럽게 감싸는 앞머리가 얼굴형을 보정하며, 볼륨 있는 웨이브가 화려한 느낌을 줍니다.",
        isBest: false,
    },
];

// ============================================
// 남성 헤어스타일 (AI 생성 이미지)
// ============================================
const MALE_STYLES: Hairstyle[] = [
    {
        id: "m1",
        salonId: "demo",
        name: "투블럭컷",
        gender: "male",
        category: "short",
        imageUrl: "/styles/m1.webp",
        story: "옆과 뒤를 짧게 밀고 윗머리에 볼륨을 주는 스타일. 깔끔하고 단정한 인상으로 직장인부터 학생까지 인기!",
        isBest: true,
    },
    {
        id: "m2",
        salonId: "demo",
        name: "댄디컷",
        gender: "male",
        category: "short",
        imageUrl: "/styles/m2.webp",
        story: "클래식한 남성미를 살려주는 정통 댄디컷. 이마를 드러내 시원한 인상을 주며, 정장과 최고의 궁합!",
        isBest: true,
    },
    {
        id: "m3",
        salonId: "demo",
        name: "리젠트컷",
        gender: "male",
        category: "medium",
        imageUrl: "/styles/m3.webp",
        story: "앞머리를 뒤로 넘기는 클래식 스타일. 남성적이면서도 세련된 분위기를 연출할 수 있어요.",
        isBest: true,
    },
    {
        id: "m4",
        salonId: "demo",
        name: "가일컷",
        gender: "male",
        category: "short",
        imageUrl: "/styles/m4.webp",
        story: "가르마를 타서 자연스럽게 넘기는 콤마 헤어. 부드러운 인상을 원하는 남성에게 추천하는 데일리 헤어!",
        isBest: false,
    },
    {
        id: "m5",
        salonId: "demo",
        name: "크롭컷",
        gender: "male",
        category: "short",
        imageUrl: "/styles/m5.webp",
        story: "앞머리를 짧게 내리는 텍스처 크롭 스타일. 이마가 넓은 분에게 특히 잘 어울리며, 관리가 쉬운 것이 장점!",
        isBest: false,
    },
    {
        id: "m6",
        salonId: "demo",
        name: "포마드 슬릭백",
        gender: "male",
        category: "medium",
        imageUrl: "/styles/m6.webp",
        story: "1950년대 클래식에서 현대적으로 재해석된 스타일. 올백으로 넘겨 깔끔하고 강렬한 인상을 줍니다.",
        isBest: false,
    },
    {
        id: "m7",
        salonId: "demo",
        name: "쉐도우 펌",
        gender: "male",
        category: "perm",
        imageUrl: "/styles/m7.webp",
        story: "자연스러운 S컬을 넣어 볼륨감을 주는 남성 펌. 스타일링 없이도 멋스럽게 떨어지는 것이 매력!",
        isBest: false,
    },
    {
        id: "m8",
        salonId: "demo",
        name: "애즈 펌",
        gender: "male",
        category: "perm",
        imageUrl: "/styles/m8.webp",
        story: "자연스러운 컬을 넣어 볼륨감을 주는 트렌드 펌. 편하게 관리하면서도 세련된 분위기를 연출할 수 있어요.",
        isBest: false,
    },
    {
        id: "m9",
        salonId: "demo",
        name: "내추럴 샤기컷",
        gender: "male",
        category: "medium",
        imageUrl: "/styles/m9.webp",
        story: "얇은 층을 여러 겹 쌓아 올려 가볍고 자연스러운 무드를 낸 미디엄 헤어. 귀를 살짝 덮는 길이에 앞머리가 이마를 가볍게 스치며, 꾸민 듯 안 꾸민 듯한 캐주얼 느낌이 특징입니다.",
        isBest: true,
    },
    {
        id: "m10",
        salonId: "demo",
        name: "텍스처드 크롭",
        gender: "male",
        category: "short",
        imageUrl: "/styles/m10.webp",
        story: "옆과 뒤는 짧게 페이드하고, 윗부분은 약간의 길이감과 거친 질감을 살린 숏컷. 앞머리를 살짝 내려 이마를 부분적으로 가리며, 질감 있는 스타일링이 특징입니다.",
        isBest: false,
    },
    {
        id: "m11",
        salonId: "demo",
        name: "소프트 멀릿",
        gender: "male",
        category: "medium",
        imageUrl: "/styles/m11.webp",
        story: "짧은 옆면과 길고 부드러운 뒷머리로 대담하고 트렌디한 룩. 뒷머리가 목 뒤로 자연스럽게 흘러내리며, 옆은 짧게 정리하여 강약 대비가 뚜렷합니다. K-pop 아이돌 사이에서 인기!",
        isBest: false,
    },
    {
        id: "m12",
        salonId: "demo",
        name: "울프컷",
        gender: "male",
        category: "medium",
        imageUrl: "/styles/m12.webp",
        story: "소프트한 레이어와 깃털 같은 결이 특징. 정수리에 볼륨을 주고 옆은 가볍게, 뒷머리에 약간의 멀릿 느낌을 더한 K-스타일. 자연스러운 흐름이 포인트입니다.",
        isBest: false,
    },
    {
        id: "m13",
        salonId: "demo",
        name: "버즈컷",
        gender: "male",
        category: "short",
        imageUrl: "/styles/m13.webp",
        story: "3~6mm로 전체를 짧게 밀어 두상이 드러나는 극초단발. 강렬하고 미니멀한 인상을 주며, 관리가 전혀 필요 없는 것이 장점. 두상이 예쁜 분에게 추천합니다.",
        isBest: false,
    },
    {
        id: "m14",
        salonId: "demo",
        name: "드롭 페이드",
        gender: "male",
        category: "short",
        imageUrl: "/styles/m14.webp",
        story: "귀 뒤쪽으로 갈수록 점점 짧아지는 그라데이션 페이드와 탑의 볼륨 대비가 특징. 옆면은 스킨까지 밀어 깔끔하고, 윗머리는 풍성하게 살려 모던한 느낌을 준다.",
        isBest: false,
    },
    {
        id: "m15",
        salonId: "demo",
        name: "커튼 뱅 스타일",
        gender: "male",
        category: "medium",
        imageUrl: "/styles/m15.webp",
        story: "가르마 양쪽으로 자연스럽게 흐르는 앞머리가 특징인 미디엄 헤어. 눈썹 아래까지 내려오는 앞머리가 이마를 가리면서도 부드러운 인상을 줍니다. 내추럴 포마드로 텍스처 연출.",
        isBest: false,
    },
    {
        id: "m16",
        salonId: "demo",
        name: "맨번 (Man Bun)",
        gender: "male",
        category: "long",
        imageUrl: "/styles/m16.webp",
        story: "뒤에서 하나로 묶어 올린 남성 롱헤어 스타일. 깔끔하면서도 자유분방한 매력을 동시에 연출합니다. 언더컷과 함께 연출하면 더욱 세련된 느낌!",
        isBest: true,
    },
    {
        id: "m17",
        salonId: "demo",
        name: "장발 레이어드",
        gender: "male",
        category: "long",
        imageUrl: "/styles/m17.webp",
        story: "어깨 아래까지 내려오는 긴 머리에 자연스러운 층을 넣은 스타일. 홍콩 느와르 같은 무드로 중성적이면서 섹시한 느낌을 줍니다. 결이 살아있는 텍스처가 포인트.",
        isBest: false,
    },
    {
        id: "m18",
        salonId: "demo",
        name: "원랭스 롱헤어",
        gender: "male",
        category: "long",
        imageUrl: "/styles/m18.webp",
        story: "층 없이 한 길이로 쭉 기른 남성 장발. 깔끔하게 센터 가르마를 타거나 자연스럽게 흘려내려 차분하고 지적인 인상을 줍니다. 가장 클래식한 남성 장발 스타일.",
        isBest: false,
    },
    {
        id: "m19",
        salonId: "demo",
        name: "사무라이 하프업",
        gender: "male",
        category: "long",
        imageUrl: "/styles/m19.webp",
        story: "윗머리 절반만 묶고 아래는 풀어 내린 하프업 스타일. 일본 무사에서 영감받은 대담한 스타일로, 강인하면서도 스타일리시한 느낌을 동시에 연출합니다.",
        isBest: false,
    },
];

// 전체 스타일 합치기
export const DEMO_HAIRSTYLES: Hairstyle[] = [...FEMALE_STYLES, ...MALE_STYLES];

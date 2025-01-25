import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const providerData = [
    { name: 'local' },
    { name: 'google' },
    { name: 'kakao' },
    { name: 'naver' },
  ];
  await prisma.provider.createMany({
    data: providerData,
  });

  const alcoholCategoryData = [
    { name: '소주' },
    { name: '맥주' },
    { name: '와인' },
    { name: '위스키' },
    { name: '기타' },
  ];
  await prisma.alcoholCategory.createMany({
    data: alcoholCategoryData,
  });

  const moodCategoryData = [
    { name: '편안한' },
    { name: '활기찬' },
    { name: '개인적인' },
    { name: '공식적인' },
    { name: '다정한' },
    { name: '음악이 있는' },
  ];
  await prisma.moodCategory.createMany({
    data: moodCategoryData,
  });

  const alcoholData = [
    // 소주
    ...[
      '참이슬',
      '한라산',
      '서울 3배',
      '처음처럼',
      '맑은샘',
      '진로',
      '백세주',
      '대선',
      '좋은데이',
      '시원한 청하',
      '화이트 클라우드',
      '명인 소주',
      '반야소주',
      '무학소주',
      '부산소주',
      '청정소주',
      '궁중소주',
      '백화수복',
      '영주 소주',
      '신라소주',
    ].map((name) => ({
      alcoholCategoryId: 1,
      name,
    })),

    // 맥주
    ...[
      '하이네켄',
      '카스',
      '기네스',
      '칼스버그',
      '버드와이저',
      '아사히',
      '프루츠 맥주',
      '호가든',
      '밀러',
      '엠버 비어',
      '블랑 비어',
      '에드가',
      '레페',
      '피츠',
      '크로넨버그',
      '파울라너',
      '산미구엘',
      '파이넨',
      '블루문',
      '테넬리',
    ].map((name) => ({
      alcoholCategoryId: 2,
      name,
    })),

    // 와인
    ...[
      '샤토 마고',
      '롱샤도',
      '빈티지 포트',
      '까사 이노',
      '루이 마세',
      '샤토 리오',
      '샤토 레오비유',
      '카르멘',
      '라미',
      '크로상',
      '샤토 다벨',
      '포도왕',
      '보르도',
      '프리미엄 와인',
      '벨리사',
      '레드스톤',
      '포도베리',
      '로쟈',
      '화이트 포트',
      '수퍼노바',
    ].map((name) => ({
      alcoholCategoryId: 3,
      name,
    })),

    // 위스키
    ...[
      '잭 다니엘',
      '맥켈란',
      '발베니',
      '글렌피딕',
      '아벨라',
      '볼렌데',
      '존nie 워커',
      '헬리오시스',
      '딘스티',
      '로얄살루트',
      '그레이트 아브',
      '더블랙',
      '아벨크로울',
      '파피반',
      '스카이월드',
      '버번',
      '클라우디',
      '캐빈 레이디',
      '얼그레이',
      '토크 록',
    ].map((name) => ({
      alcoholCategoryId: 4,
      name,
    })),

    // 기타
    ...[
      '복분자주',
      '매실주',
      '모히토',
      '상그리아',
      '막걸리',
      '소맥',
      '오메가',
      '포도주',
      '청주',
      '동동주',
      '미주',
      '모스카토',
      '진저비어',
      '카시스',
      '어거스트',
      '라벨블랑',
      '청하',
      '레드벨',
      '돌체 비앙코',
      '복주',
    ].map((name) => ({
      alcoholCategoryId: 5,
      name,
    })),
  ];
  await prisma.alcohol.createMany({
    data: alcoholData,
  });
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

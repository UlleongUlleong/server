# 🍺 술렁술렁

**혼자서 술을 즐기는 사람들**을 위한 실시간 소통 플랫폼입니다.  
안전하고 즐거운 음주 문화를 만들어가세요!

## 🎯 프로젝트 개요
- 개발 기간: 2025.01.06 ~ 2025.02.06
- 개발 인원: 프론트 엔드 3명, 백엔드 2명

## 💻 기술 스택

- **프레임워크**: NestJS
- **언어**: TypeScript
- **데이터베이스**: 
  - MySQL + Prisma ORM
  - Redis
- **인증/인가**: JWT + Passport
- **배포**: GitHub Actions + AWS EC2

## 📂 폴더 구조

```bash
src/
├── modules/        # 주요 도메인 모듈
├── common/         # 공통 유틸 및 인터셉터
├── main.ts         # 애플리케이션 진입점
└── app.module.ts   # 루트 모듈
```

## 🛠 설치 및 실행

### 로컬 개발 환경 설정

```bash
# 1. 저장소 복제
$ cd your-directory
$ git clone https://github.com/UlleongUlleong/server.git .

# 2. 패키지 설치
$ npm install

# 3. 환경 변수 설정 (.env 파일 생성)
$ cp .env.example .env

# 3. 데이터베이스 마이그레이션 적용
$ npx prisma migrate dev

# 4. 서버 실행
$ npm run start:dev
```

## 🔥 주요 기능

### 사용자 관리
- 회원가입
- 로그인
- 프로필 조회 및 수정
- 프로필 이미지 저장

### 술 관리
- 술 조회
- 술 리뷰

### 채팅
- 웹소켓 기반 실시간 채팅
- WebRTC 세션 및 토큰 생성

---

## 🧪 배포

### 1️⃣ 배포 방법

```bash
$ git push origin main # CI/CD 자동 배포 트리거
```

## 📚 API 문서

- **REST API:** [Postman Collection](https://documenter.getpostman.com/view/34914899/2sAYJ9AdiL)  
- **WebSocket Event:** [Notion](https://www.notion.so/dd2996b66d7748548db6332fa04ff7ad?pvs=4)

## 🛠 Architecture

![Image](https://github.com/user-attachments/assets/2c399ec4-f1ca-4cd2-8de3-1273ffa3dcfc)


## 💾 데이터베이스 스키마
- **ERD:** [ERD Cloud](https://www.erdcloud.com/d/REgwL6a88noB3Wpoc)

## 📞 문의

이름|이메일|
|---|---|
|차수빈|subin000602@gmail.com|
|신찬휘|schxo99@gmail.com|
# VS찰칵 – AI를 활용한 실시간 미션 촬영 배틀

Gemma3 모델과 Firebase를 활용한 실시간 웹게임  
주어진 주제를 가장 먼저 사진으로 찍어 AI의 판별을 통과하면 우승하는  
AI 기반 실시간 사진 챌린지 게임입니다.

## 서비스 흐름 요약

1. 로비 접속 및 방 생성/입장  
   사용자는 공개된 방에 참여하거나 새 방을 생성할 수 있습니다.  
   방 설정 시, 최대 인원 및 주제 설정 방식(랜덤/투표)을 선택할 수 있습니다.

2. 주제 선정 및 준비  
   투표 모드에서는 참가자들이 카테고리를 선택해 주제를 결정합니다.  
   모든 참가자가 준비 완료되면 게임이 시작됩니다.

3. 사진 미션 수행  
   정해진 주제(예: 포도, 운동화 등)를 실시간으로 촬영해 업로드합니다.  
   가장 먼저 AI에게 '정답' 판정을 받은 사용자가 즉시 우승합니다.

4. AI 판별 및 결과 공개  
   Gemma3 (Ollama 기반 로컬 LLM)을 활용하여  
   이미지의 주제 일치 여부를 자동 분석하고  
   각 참가자의 결과와 AI 설명을 테이블로 시각화합니다.

## 실행 방법

1. Python 패키지 설치

   ```
   pip install flask firebase-admin
   ```

2. Firebase Admin SDK 키 등록  
   firebaseKey.json 추가 필요

3. Ollama 설치 및 Gemma3 모델 구동

   ```
   ollama run gemma:3b
   ```

4. 앱 실행

   ```
   python app.py
   ```

## 시스템 아키텍처

사용자 브라우저  
→ Flask 서버 (사진 업로드 및 static 자원 제공)  
→ Ollama (Gemma3 모델을 통한 이미지 판별)  
→ Firebase Realtime Database (방 상태, 투표, 제출 결과 등 실시간 저장)

## 기술 스택

- Frontend: HTML5, CSS3, JavaScript, Bootstrap 5
- Backend: Python Flask
- AI 판별: Ollama + Google Gemma3 (LLM with image input)
- 실시간 데이터베이스: Firebase Realtime Database
- 협업/문서화: Notion, GitHub

## 주요 기능

- 실시간 다중 참가자 경쟁
- 직접 사진 촬영 및 업로드
- AI 모델로 자동 판별 (정답/오답)
- 투표 or 랜덤 주제 설정 기능
- 우승자 자동 판별 및 결과 테이블 제공
- Firebase 기반 실시간 동기화

## 팀원 및 역할 분담

- 이재형 (팀장): 기획 총괄, 서버 및 AI 연동, 발표 자료 제작
- 박재현: 프론트엔드 UI 개발, Bootstrap 기반 템플릿 구성
- 강민성: Firebase 로비/방 구조 설계, 참가자 흐름 구현
- 심형섭: Gemma3 기반 판별 로직 구현 및 AI 연결
- 최수민: 발표 자료 작성, 회의 정리, markdown 문서화
- 조한나: MissionData 설계, 시각자료 보조

## 협업 방식

본래 GitHub를 통한 브랜치 협업을 계획했으나,  
팀원 다수가 GitHub 기반 협업 경험이 부족하여 실제 개발은  
파일 단위 공유 중심으로 진행하고, GitHub는 제출용 리포지토리로 사용했습니다.

개발 중간중간 텍스트 문서로 간단히 회의 내용을 기록했고,  
최종 완성 후 생성형 AI(ChatGPT 등)의 도움을 받아  
정리된 문서를 Notion을 통해 팀 내에 공유했습니다.

## 참조 및 링크

- Ollama: https://ollama.com
- Gemma3: https://ai.google.dev/gemma
- Firebase RTDB: https://firebase.google.com/products/realtime-database

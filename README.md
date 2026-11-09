# JMclean 5차 — 카카오톡 연결 + 이메일 견적문의

## 업로드
GitHub `jmclean-homepage` 저장소 최상위에 `index.html`을 교체하고 `api/inquiry.js`를 **api 폴더 안에** 추가하세요. GitHub 웹 업로드에서 폴더를 드래그하면 구조가 유지됩니다. Vercel 자동 배포 후 카카오톡 버튼은 즉시 사용 가능합니다.

## 이메일 자동 접수 설정 (필수)
1. Resend (https://resend.com) 가입 및 소유 도메인 인증.
2. Vercel 프로젝트 → Settings → Environment Variables에 다음 값 추가:
   - `RESEND_API_KEY`: Resend에서 발급한 비밀 API 키
   - `RESEND_FROM_EMAIL`: 인증된 도메인의 발신 이메일 주소 (예: notice@jmclean.kr)
   - `NOTIFY_EMAIL`: wn0504@nate.com
3. Vercel → Deployments에서 최신 배포 Redeploy.
4. 실제 테스트 문의를 보내고 메일 수신함 및 스팸함을 확인하세요.

**중요**: 발신 도메인 인증 전에는 실제 고객 문의 이메일이 발송되지 않습니다. API 키를 GitHub나 채팅에 공유하지 마세요. Resend 무료 플랜에는 발송량 제한이 있습니다.

## 현재 상태
- 카카오톡 채팅: https://pf.kakao.com/_DtcxeX/chat 연결 완료 (채널 공개/채팅 활성화 필요)
- 이메일 문의: 서버 코드 준비 완료, Resend 인증키·발신 주소 설정 후 작동
- SMS 발송: 없음 (이번 요청대로 이메일+카카오톡)
- 문의 DB 저장/관리자 페이지: 아직 없음

## 운영 전 확인
- 실제 개인정보 수집 항목, 이용 목적, 보유 기간 및 개인정보처리방침을 회사 운영 정책에 맞게 확정하세요.
- 공개 서비스에서는 봇 차단(CAPTCHA), IP별 요청 제한, 메일 발송 실패 모니터링 등을 추가하세요.
- `index.html`의 이미지들은 임시 외부 이미지이며 추후 교체 가능합니다.

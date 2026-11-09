# JMclean 홈페이지 2차 — 문자 + 이메일 알림

## GitHub 업로드
압축 해제 후 `index.html`, `api/contact.js`, `vercel.json` 파일을 저장소 루트에 업로드하세요. `api/contact.js`는 반드시 api 폴더 안에 있어야 합니다. README는 선택입니다.

## Vercel 환경변수 (Project → Settings → Environment Variables)
- `RESEND_API_KEY`: Resend에서 발급받은 API 키
- `RESEND_FROM_EMAIL`: Resend에서 인증한 도메인의 발신 주소 (예: notice@본인도메인)
- `NOTIFY_EMAIL`: wn0504@nate.com
- `SOLAPI_API_KEY`: 솔라피 API Key
- `SOLAPI_API_SECRET`: 솔라피 API Secret
- `SOLAPI_SENDER`: 솔라피에 등록·인증한 발신번호 (숫자만)
- `NOTIFY_PHONE`: 01056566963

환경변수 저장 후 Vercel에서 Redeploy 하세요. API 키를 GitHub 코드나 공개 채팅에 절대 붙여넣지 마세요.

## 주의사항
- 발송 서비스 설정 전에는 문의가 전송되지 않고 안내 문구가 나타납니다.
- Resend는 본인 소유 도메인 인증이 필요할 수 있습니다. Solapi는 발신번호 등록과 충전이 필요합니다.
- 문의 내용은 서버 DB에 저장하지 않습니다. 이메일과 문자 발송에 모두 성공한 경우에만 접수 완료로 표시합니다.
- 실서비스 공개 전 스팸 방지(CAPTCHA/서버 측 요청 제한), 개인정보처리방침, 발송 실패 재시도/기록 기능을 보강하세요.
- SMS는 요약만 전송하고 전체 문의내용은 이메일로 전송합니다.
- Vercel 프로젝트가 기존 저장소와 연결되어 있어야 자동 배포됩니다.

## 3차 변경사항
견적문의에 객실 수(필수), 호텔 주소(필수)를 추가했습니다. 이메일 본문에는 전체 주소, 문자에는 주소 앞 45자가 포함됩니다.


## 3차 변경사항
- 견적문의에 호텔 주소(필수)를 추가했습니다.
- 문자와 이메일 본문에 호텔 주소가 포함됩니다.
- GitHub 저장소 루트에 index.html, vercel.json, api/contact.js를 동일 경로로 업로드하세요.
- 문자/이메일 발송은 Vercel 환경변수 및 발송 서비스 인증이 끝난 뒤 작동합니다.

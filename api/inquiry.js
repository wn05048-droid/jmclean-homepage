// Vercel Node.js Serverless Function. RESEND_API_KEY and RESEND_FROM_EMAIL are server-side secrets.
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({error:'POST 요청만 가능합니다.'}); }
  const data = req.body || {};
  if (data.website) return res.status(200).json({ok:true}); // honeypot
  const limits = {company:100,contact:60,phone:30,rooms:10,address:250,message:3000};
  const clean = {};
  for (const [key, max] of Object.entries(limits)) {
    if (typeof data[key] !== 'string' || data[key].length > max) return res.status(400).json({error:'입력 내용을 확인해 주세요.'});
    clean[key] = data[key].trim();
  }
  if (!clean.company || !clean.contact || !clean.phone || !clean.address || !clean.message || data.privacy !== 'on') return res.status(400).json({error:'필수 항목과 개인정보 동의를 확인해 주세요.'});
  if (!/^[0-9+()\-\s]{8,30}$/.test(clean.phone)) return res.status(400).json({error:'연락처 형식을 확인해 주세요.'});
  if (clean.rooms && !/^\d{1,10}$/.test(clean.rooms)) return res.status(400).json({error:'객실 수는 숫자로 입력해 주세요.'});
  const key = process.env.RESEND_API_KEY, from = process.env.RESEND_FROM_EMAIL, to = process.env.NOTIFY_EMAIL || 'wn0504@nate.com';
  if (!key || !from) return res.status(503).json({error:'이메일 접수 서비스 설정 중입니다. 전화 또는 카카오톡으로 문의해 주세요.'});
  const labels = {company:'업체명',contact:'담당자',phone:'연락처',rooms:'객실 수',address:'호텔 주소',message:'문의내용'};
  const html = '<h2>JMclean 신규 견적문의</h2><table cellpadding="8" border="1" style="border-collapse:collapse">' + Object.entries(labels).map(([k,label]) => `<tr><th>${label}</th><td style="white-space:pre-wrap">${escapeHtml(clean[k] || '-')}</td></tr>`).join('') + '</table>';
  try {
    const response = await fetch('https://api.resend.com/emails', {method:'POST', headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'}, body:JSON.stringify({from,to:[to],subject:`[JMclean 견적문의] ${clean.company.replace(/[\r\n]/g,' ')}`,html})});
    if (!response.ok) { console.error('Resend delivery rejected', response.status); return res.status(502).json({error:'이메일 발송에 실패했습니다. 전화 또는 카카오톡으로 문의해 주세요.'}); }
    return res.status(200).json({ok:true});
  } catch (error) { console.error('Email transport failed', error?.message); return res.status(502).json({error:'이메일 접수에 실패했습니다. 전화 또는 카카오톡으로 문의해 주세요.'}); }
};

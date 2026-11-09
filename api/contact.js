const crypto = require('node:crypto');

const clean = (v, max=500) => String(v ?? '').trim().slice(0,max);
const emailAddress = process.env.NOTIFY_EMAIL || 'wn0504@nate.com';
const phoneNumber = (process.env.NOTIFY_PHONE || '01056566963').replace(/\D/g,'');
const senderNumber = (process.env.SOLAPI_SENDER || '').replace(/\D/g,'');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {res.setHeader('Allow','POST');return res.status(405).json({error:'POST만 허용합니다.'});}
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL || !process.env.SOLAPI_API_KEY || !process.env.SOLAPI_API_SECRET || !senderNumber) {
    return res.status(503).json({error:'알림 서비스가 아직 연결되지 않았습니다. 전화로 문의해 주세요.'});
  }
  try {
    if (Number(req.headers['content-length'] || 0) > 12000) return res.status(413).json({error:'문의 내용이 너무 깁니다.'});
    const body = req.body || {};
    if (body.website) return res.status(200).json({ok:true}); // honeypot
    if (body.privacy !== true) return res.status(400).json({error:'개인정보 수집·이용에 동의해 주세요.'});
    const hotel=clean(body.hotel,100),person=clean(body.person,80),phone=clean(body.phone,40),rooms=clean(body.rooms,40),address=clean(body.address,250),message=clean(body.message,2000);
    if (!hotel || !person || !/^0\d{8,10}$/.test(phone.replace(/\D/g,'')) || !/^\d{1,6}$/.test(rooms) || Number(rooms)<1 || !address || !address || !message) return res.status(400).json({error:'업체명, 담당자, 연락처, 객실 수, 주소, 문의내용을 확인해 주세요.'});
    const lines=[`업체명: ${hotel}`,`담당자: ${person}`,`연락처: ${phone}`,`객실 수: ${rooms}`,`주소: ${address}`,`문의내용: ${message}`];
    const content=lines.join('\n');
    const date=new Date().toISOString(),salt=crypto.randomBytes(16).toString('hex');
    const signature=crypto.createHmac('sha256',process.env.SOLAPI_API_SECRET).update(date+salt).digest('hex');
    const auth=`HMAC-SHA256 apiKey=${process.env.SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`;
    const smsText=`[JMclean 견적문의]\n${hotel} / ${person}\n${phone}\n객실 ${rooms}\n주소 ${address.slice(0,45)}\n상세내용은 이메일 확인`;
    const [mail,sms]=await Promise.allSettled([
      fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:process.env.RESEND_FROM_EMAIL,to:[emailAddress],subject:`[JMclean] 새 견적문의 - ${hotel}`,text:content})}).then(async r=>{if(!r.ok)throw new Error('Email provider: '+r.status+' '+(await r.text()).slice(0,250));return r.json()}),
      fetch('https://api.solapi.com/messages/v4/send-many',{method:'POST',headers:{Authorization:auth,'Content-Type':'application/json'},body:JSON.stringify({messages:[{to:phoneNumber,from:senderNumber,text:smsText}]})}).then(async r=>{if(!r.ok)throw new Error('SMS provider: '+r.status+' '+(await r.text()).slice(0,250));const data=await r.json();if(data.failedMessageList?.length)throw new Error('SMS failed');return data})
    ]);
    if(mail.status==='rejected'||sms.status==='rejected') {
      console.error('JMclean notification result',{email:mail.status==='fulfilled'?'sent':String(mail.reason),sms:sms.status==='fulfilled'?'sent':String(sms.reason)});
      return res.status(502).json({error:'알림 전송을 완료하지 못했습니다. 전화로 문의해 주세요.'});
    }
    return res.status(200).json({ok:true});
  } catch(e) {console.error('Contact error',e);return res.status(500).json({error:'일시적인 오류가 발생했습니다.'});}
};

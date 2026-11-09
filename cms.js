(()=>{'use strict';
const cfg=window.JMCMS_CONFIG||{};if(!cfg.url||!cfg.publishableKey||!window.supabase)return;
const db=window.supabase.createClient(cfg.url,cfg.publishableKey);
const page=location.pathname.split('/').pop()||'index.html';
const selector='main h1, main h2, main h3, main p, main li, main .eyebrow, section h1, section h2, section h3, section p, section .eyebrow, footer p, .hero h1, .hero p, .card h3, .card p';
const targets=[...new Set([...document.querySelectorAll(selector)])].filter(x=>!x.closest('form,nav,header,script')&&!x.querySelector('img, input, button, a, textarea'));
const images=[...document.querySelectorAll('img')];
const elements=[...targets,...images];elements.forEach((el,i)=>el.dataset.cmsKey=page+':'+i);
const cssKeys=['--navy','--gold','--bg','--ink'];
function apply(data){Object.entries(data||{}).forEach(([key,v])=>{if(key==='theme'&&v){Object.entries(v).forEach(([k,c])=>{if(/^--[a-z-]+$/.test(k)&&/^#[0-9a-fA-F]{6}$/.test(c))document.documentElement.style.setProperty(k,c)});return;}const el=elements.find(x=>x.dataset.cmsKey===key);if(!el)return;if(v.type==='image'&&el.tagName==='IMG'&&/^https:\/\//.test(v.value))el.src=v.value;if(v.type==='text'&&el.tagName!=='IMG')el.textContent=v.value;});}
let data={};async function load(){const {data:row,error}=await db.from('site_content').select('content').eq('id',1).maybeSingle();if(!error&&row){data=row.content||{};apply(data)}}load();
const params=new URLSearchParams(location.search);if(params.get('edit')!=='1')return;
async function editor(){const {data:{user}}=await db.auth.getUser();if(!user)return;const {data:admin}=await db.from('site_admins').select('user_id').eq('user_id',user.id).maybeSingle();if(!admin)return;
const bar=document.createElement('div');bar.id='cms-bar';bar.innerHTML='<strong>JMclean 편집 모드</strong> <button id="cms-save">변경사항 게시</button> <button id="cms-theme">배경색 변경</button> <button id="cms-logout">로그아웃</button> <span id="cms-status">글씨 또는 사진을 클릭하세요</span>';document.body.prepend(bar);
const style=document.createElement('style');style.textContent='#cms-bar{position:sticky;top:0;z-index:99999;background:#13243a;color:white;padding:12px;display:flex;flex-wrap:wrap;align-items:center;gap:10px;font:15px sans-serif}#cms-bar button{background:#d8b16a;border:0;border-radius:4px;padding:9px 12px;cursor:pointer} [data-cms-key]:hover{outline:2px dashed #cba456;cursor:pointer}';document.head.append(style);
const status=document.getElementById('cms-status');
elements.forEach(el=>el.addEventListener('click',async e=>{e.preventDefault();e.stopPropagation();const key=el.dataset.cmsKey;if(el.tagName==='IMG'){const input=document.createElement('input');input.type='file';input.accept='image/png,image/jpeg,image/webp';input.onchange=async()=>{const file=input.files?.[0];if(!file)return;if(file.size>8*1024*1024){alert('8MB 이하 사진만 가능합니다.');return;}status.textContent='사진 업로드 중…';const path='photos/'+crypto.randomUUID()+'.'+(file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg');const {error}=await db.storage.from('site-images').upload(path,file,{upsert:false,contentType:file.type});if(error){status.textContent=error.message;return;}const {data:res}=db.storage.from('site-images').getPublicUrl(path);data[key]={type:'image',value:res.publicUrl};el.src=res.publicUrl;status.textContent='사진 변경됨. 게시 버튼을 누르세요.';};input.click();return;}
const value=prompt('수정할 글씨를 입력하세요',el.textContent.trim());if(value===null)return;data[key]={type:'text',value:value.slice(0,3000)};el.textContent=value;status.textContent='글씨 변경됨. 게시 버튼을 누르세요.';},true));
document.getElementById('cms-theme').onclick=()=>{const color=prompt('배경색을 #FFFFFF 형식으로 입력하세요','#FFFFFF');if(!color)return;if(!/^#[0-9a-fA-F]{6}$/.test(color)){alert('예: #FFFFFF');return;}data.theme={...(data.theme||{}),'--bg':color};document.documentElement.style.setProperty('--bg',color);status.textContent='색상 변경됨. 게시 버튼을 누르세요.';};
document.getElementById('cms-save').onclick=async()=>{status.textContent='게시 중…';const {error}=await db.from('site_content').upsert({id:1,content:data,updated_at:new Date().toISOString()},{onConflict:'id'});status.textContent=error?'게시 실패: '+error.message:'게시 완료! 방문객에게 반영됩니다.';};
document.getElementById('cms-logout').onclick=async()=>{await db.auth.signOut();location.href='index.html';};}
editor();
})();
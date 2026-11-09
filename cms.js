(()=>{'use strict';
const cfg=window.JMCMS_CONFIG||{};if(!cfg.url||!cfg.publishableKey||!window.supabase)return;
const db=window.supabase.createClient(cfg.url,cfg.publishableKey);
const page=location.pathname.split('/').pop()||'index.html';
const editing=new URLSearchParams(location.search).get('edit')==='1';
const allowedColors=['#ffffff','#f4f6f9','#0d223a','#142b46','#c5a56a','#111111','#333333','#f2e7d5','#e8f0f8','#000000'];
const textSelector='h1,h2,h3,h4,h5,h6,p,li,.eyebrow,.lead,blockquote,figcaption,nav a,footer a,header a:not(.brand-logo),a.btn,button:not([type="submit"]),label,td,th,small,strong';
const textEls=[...document.querySelectorAll(textSelector)].filter(el=>!el.closest('script,style,form,#cms-toolbar')&&!el.querySelector('h1,h2,h3,h4,h5,h6,p,li,blockquote,figcaption,nav a,td,th')&&el.textContent.trim()&&!(el.closest('.brand-logo')));
const imageEls=[...document.querySelectorAll('img')];
const bgEls=[...document.querySelectorAll('body,header,footer,main,section,.hero,.page-hero,.section,.card,.wrap,.two,.hero-inner,.contact-card')];
const elements=[...new Set([...textEls,...imageEls,...bgEls])];
elements.forEach((el,i)=>{el.dataset.cmsKey=page+':'+i;el.dataset.cmsKind=imageEls.includes(el)?'image':textEls.includes(el)?'text':'area';});
let content={},active=null,dirty=false;
const safeColor=c=>/^#[0-9a-fA-F]{6}$/.test(c||'');
const safeUrl=u=>{try{const x=new URL(u);return x.protocol==='https:'&&(x.hostname.endsWith('.supabase.co')||x.hostname==='images.unsplash.com'||x.hostname==='unsplash.com')}catch{return false}};
const sanitize=html=>{const template=document.createElement('template');template.innerHTML=html;const allowed=new Set(['B','STRONG','I','EM','U','S','BR','SPAN','DIV','P','FONT','SUB','SUP']);const walk=node=>{for(const child of [...node.childNodes]){if(child.nodeType===8){child.remove();continue}if(child.nodeType!==1)continue;if(!allowed.has(child.tagName)){child.replaceWith(document.createTextNode(child.textContent||''));continue}const s=child.style;const styles={color:s.color,backgroundColor:s.backgroundColor,fontSize:s.fontSize,fontFamily:s.fontFamily,fontWeight:s.fontWeight,fontStyle:s.fontStyle,textDecoration:s.textDecoration,textAlign:s.textAlign};for(const a of [...child.attributes])child.removeAttribute(a.name);for(const [k,v] of Object.entries(styles)){if(!v)continue;if(k==='fontFamily'&&!/^(Arial|Georgia|Verdana|Tahoma|Times New Roman|Noto Sans KR|Nanum Gothic|Nanum Myeongjo|Nanum Pen Script|Black Han Sans|Do Hyeon|Jua|Gowun Dodum|Gowun Batang|IBM Plex Sans KR|Song Myung|Gugi|Gamja Flower|Hi Melody|Poor Story|serif|sans-serif)$/i.test(v.replace(/["']/g,'')))continue;if(k==='fontSize'&&!/^\d{1,3}px$/.test(v))continue;if(['color','backgroundColor'].includes(k)&&!/^(#[0-9a-f]{3,8}|rgb\([\d\s,.%]+\))$/i.test(v))continue;if(['fontWeight','fontStyle','textDecoration','textAlign'].includes(k)&&!/^[-a-z\s0-9]+$/i.test(v))continue;child.style[k]=v}walk(child)}};walk(template.content);return template.innerHTML};
// V6: Per-page photo copies are persisted in site_content and recreated for visitors.
const extraKey=page+':addedImages';
function renderExtraImages(){
  const records=Array.isArray(content[extraKey])?content[extraKey]:[];
  for(const rec of records){
    if(!rec||typeof rec.id!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(rec.id)||!safeUrl(rec.src))continue;
    const key=page+':extra:'+rec.id;
    if(elements.some(x=>x.dataset.cmsKey===key))continue;
    const anchor=elements.find(x=>x.dataset.cmsKey===rec.anchor);
    if(!anchor)continue;
    const img=document.createElement('img');img.src=rec.src;img.alt=String(rec.alt||'추가 사진').slice(0,120);
    img.dataset.cmsKey=key;img.dataset.cmsKind='image';img.className='cms-extra-photo';
    img.style.cssText='display:block;max-width:100%;width:320px;height:auto;object-fit:contain;position:relative;z-index:1;margin:14px auto;';
    if(anchor.parentNode)anchor.insertAdjacentElement('afterend',img);
    elements.push(img);imageEls.push(img);
  }
}
function apply(){for(const [key,v] of Object.entries(content)){const el=elements.find(x=>x.dataset.cmsKey===key);if(!el||!v)continue;if(v.type==='text'&&el.dataset.cmsKind==='text'){if(typeof v.html==='string')el.innerHTML=sanitize(v.html);else if(typeof v.value==='string')el.textContent=v.value;}if(v.type==='image'&&el.tagName==='IMG'&&safeUrl(v.value))el.src=v.value;if(v.type==='style'||v.type==='text'||v.type==='image'){const allowed=['color','backgroundColor','fontFamily','fontSize','fontWeight','textAlign','letterSpacing','lineHeight','padding','marginTop','marginBottom','transform','objectFit','objectPosition','backgroundSize','backgroundPosition','width','height','maxWidth'];for(const p of allowed){const val=v[p];if(typeof val!=='string'||val.length>100||/[;{}<>]/.test(val))continue;el.style[p]=val}if(v.backgroundImage&&safeUrl(v.backgroundImage)){el.style.backgroundImage=`url("${v.backgroundImage}")`;el.classList.add('cms-photo-background')};if(v.backgroundImage&&!v.backgroundSize)el.style.backgroundSize='cover';if(v.backgroundImage&&!v.backgroundPosition)el.style.backgroundPosition='center';}}
}
async function load(){const {data,error}=await db.from('site_content').select('content').eq('id',1).maybeSingle();if(!error&&data){content=data.content||{};renderExtraImages();apply()}}
load();if(!editing)return;
async function init(){const {data:{user}}=await db.auth.getUser();if(!user){location.href='admin.html';return}const {data:admin}=await db.from('site_admins').select('user_id').eq('user_id',user.id).maybeSingle();if(!admin){location.href='admin.html';return}
const style=document.createElement('style');style.textContent=`#cms-toolbar{position:sticky;top:0;z-index:2147483646;background:#11243c;color:#fff;padding:10px 14px;display:flex;gap:7px;flex-wrap:wrap;align-items:center;font:13px Arial,sans-serif;box-shadow:0 3px 12px #0004}#cms-toolbar button,#cms-toolbar select,#cms-toolbar input{font:13px Arial,sans-serif;padding:7px;border:1px solid #bcc5d2;border-radius:5px;background:#fff;color:#14263c;max-width:160px}#cms-toolbar input[type=color]{padding:1px;width:38px;height:33px}#cms-toolbar button{cursor:pointer}#cms-toolbar .primary{background:#d4b06b;color:#111;font-weight:bold}#cms-toolbar .status{font-size:12px;flex-basis:100%}.cms-extra-photo{max-width:100%;height:auto;object-fit:contain;position:relative;z-index:1}body.cms-edit [data-cms-key]:hover{outline:2px dashed #d4b06b!important;outline-offset:2px;cursor:pointer}body.cms-edit .cms-selected{outline:3px solid #e0a82d!important;outline-offset:2px}body.cms-edit [contenteditable=true]{cursor:text!important;min-width:15px;min-height:1em}#cms-toolbar .separator{border-left:1px solid #75869a;height:28px;margin:0 4px}`;document.head.append(style);document.body.classList.add('cms-edit');
const bar=document.createElement('div');bar.id='cms-toolbar';bar.innerHTML=`<strong>JMclean 편집 V6</strong><button id="cms-back" type="button">← 관리자 첫 화면</button><button id="cms-drag-shortcut" type="button">마우스 끌어 이동: 끔</button><select id="cms-page"><option value="">페이지 이동</option>${[['index.html','메인'],['about.html','회사소개'],['services.html','사업안내'],['equipment.html','보유설비'],['process.html','세탁공정'],['gallery.html','갤러리'],['inquiry.html','견적문의'],['location.html','오시는 길'],['privacy.html','개인정보 안내']].map(([f,n])=>`<option value="${f}" ${f===page?'selected':''}>${n}</option>`).join('')}</select><button id="cms-save" class="primary">변경사항 게시</button><button id="cms-preview">미리보기</button><button id="cms-undo">선택 해제</button><span class="separator"></span><select id="cms-font"><option value="">글씨체</option><option value="Arial">Arial</option><option value="Georgia">Georgia</option><option value="Noto Sans KR">Noto Sans KR</option><option value="Nanum Gothic">나눔고딕</option><option value="Verdana">Verdana</option><option value="Tahoma">Tahoma</option><option value="Times New Roman">Times New Roman</option><option value="Nanum Myeongjo">나눔명조</option><option value="Nanum Pen Script">나눔손글씨 펜</option><option value="Black Han Sans">검은고딕</option><option value="Do Hyeon">도현</option><option value="Jua">주아</option><option value="Gowun Dodum">고운돋움</option><option value="Gowun Batang">고운바탕</option><option value="IBM Plex Sans KR">IBM 플렉스</option><option value="Song Myung">송명</option><option value="Gugi">구기</option><option value="Gamja Flower">감자꽃</option><option value="Hi Melody">하이멜로디</option><option value="Poor Story">푸어스토리</option></select><select id="cms-size"><option value="">글씨 크기</option>${[12,14,16,18,20,24,28,32,36,42,48,56,64,72,84].map(n=>`<option value="${n}px">${n}px</option>`).join('')}</select><button id="cms-bold"><b>굵게</b></button><button id="cms-align">가운데 정렬</button><button id="cms-break">줄바꿈</button><label>글씨색 <input id="cms-color" type="color" value="#111111"></label><label>배경색 <input id="cms-bgcolor" type="color" value="#ffffff"></label><button id="cms-photo">사진/배경사진 변경</button><button id="cms-copy-photo" type="button">선택 사진 복사</button><button id="cms-add-photo" type="button">새 사진 추가</button><button id="cms-delete-photo" type="button">추가 사진 삭제</button><button id="cms-photo-size" type="button">사진 크기 조절</button><button id="cms-spacing">간격 조절</button><span class="separator"></span><button id="cms-drag" aria-pressed="false">마우스 끌어 이동: 끔</button><strong>위치 이동</strong><button id="cms-up">↑ 위</button><button id="cms-down">↓ 아래</button><button id="cms-left">← 왼쪽</button><button id="cms-right">→ 오른쪽</button><select id="cms-step"><option value="1">1px씩</option><option value="5">5px씩</option><option value="10" selected>10px씩</option><option value="25">25px씩</option></select><button id="cms-reset-position">위치 초기화</button><select id="cms-fit"><option value="">사진 표시 방식</option><option value="cover">영역 채우기</option><option value="contain">사진 전체 보기</option></select><button id="cms-photo-position">사진 중심 위치</button><button id="cms-logout">로그아웃</button><span id="cms-status" class="status">수정할 글씨, 사진, 배경 영역을 클릭하세요. 글씨는 클릭 후 바로 입력할 수 있습니다.</span>`;document.body.prepend(bar);
const $=id=>document.getElementById(id),status=t=>$('cms-status').textContent=t;
$('cms-back').onclick=()=>{if(dirty&&!confirm('저장하지 않은 수정사항이 있습니다. 돌아갈까요?'))return;location.href='admin.html'};
$('cms-drag-shortcut').onclick=()=>$('cms-drag').click();
$('cms-page').onchange=e=>{if(!e.target.value)return;if(dirty&&!confirm('저장하지 않은 수정사항이 있습니다. 페이지를 이동할까요?')){e.target.value=page;return}location.href=e.target.value+'?edit=1'};
const mark=()=>{dirty=true;status('변경됨 · 변경사항 게시 버튼을 눌러주세요')};
function storeText(el){content[el.dataset.cmsKey]={...(content[el.dataset.cmsKey]||{}),type:'text',html:sanitize(el.innerHTML)};mark()}
function setStyle(el,prop,val){const key=el.dataset.cmsKey;content[key]={...(content[key]||{}),type:el.dataset.cmsKind==='text'?'text':el.dataset.cmsKind==='image'?'image':'style',[prop]:val};el.style[prop]=val;mark()}
function select(el){if(active&&active!==el){active.classList.remove('cms-selected');if(active.isContentEditable){active.contentEditable='false';storeText(active)}}active=el;el.classList.add('cms-selected');if(el.dataset.cmsKind==='text'&&!dragMode){el.contentEditable='true';el.focus();status('글씨를 직접 입력하세요. Enter로 줄바꿈, Shift+Enter로 한 줄 내려쓰기 가능합니다.')}else status('사진 또는 배경을 선택했습니다. 색상·사진 변경 버튼을 이용하세요.')}
let dragMode=false;
$('cms-drag').onclick=()=>{dragMode=!dragMode;$('cms-drag').textContent='마우스 끌어 이동: '+(dragMode?'켬':'끔');$('cms-drag-shortcut').textContent=$('cms-drag').textContent;$('cms-drag').setAttribute('aria-pressed',String(dragMode));document.body.classList.toggle('cms-drag-mode',dragMode);if(active?.isContentEditable)active.contentEditable='false';status(dragMode?'이동할 요소를 누른 상태로 마우스를 끌어주세요. 게시해야 저장됩니다.':'끌어 이동 종료. 글씨를 클릭해 편집할 수 있습니다.')};
let dragging=null;
document.addEventListener('pointerdown',e=>{if(!dragMode||e.button!==0||e.target.closest('#cms-toolbar'))return;const el=e.target.closest('[data-cms-key]');if(!el||!elements.includes(el))return;e.preventDefault();e.stopPropagation();select(el);el.contentEditable='false';const old=content[el.dataset.cmsKey]||{};dragging={el,startX:e.clientX,startY:e.clientY,x:Number(old.moveX)||0,y:Number(old.moveY)||0,id:e.pointerId};el.setPointerCapture(e.pointerId)},true);
document.addEventListener('pointermove',e=>{if(!dragging||e.pointerId!==dragging.id)return;const {el,startX,startY,x,y}=dragging;const nx=Math.round(Math.max(-1000,Math.min(1000,x+e.clientX-startX))),ny=Math.round(Math.max(-1000,Math.min(1000,y+e.clientY-startY)));el.style.transform=`translate(${nx}px, ${ny}px)`;dragging.nx=nx;dragging.ny=ny},true);
document.addEventListener('pointerup',e=>{if(!dragging||e.pointerId!==dragging.id)return;const {el,nx,ny,x,y}=dragging;dragging=null;const key=el.dataset.cmsKey;content[key]={...(content[key]||{}),type:el.dataset.cmsKind==='text'?'text':el.dataset.cmsKind==='image'?'image':'style',moveX:nx??x,moveY:ny??y,transform:`translate(${nx??x}px, ${ny??y}px)`};mark();status('위치 변경됨. 변경사항 게시를 눌러 저장하세요.')},true);
const textSet=new Set(textEls),imageSet=new Set(imageEls);
document.addEventListener('click',e=>{if(e.target.closest('#cms-toolbar'))return;let el=e.target.closest('[data-cms-key]');if(!el)return;if(!elements.includes(el))return;if(el.dataset.cmsKind==='area'){const inner=e.target.closest('[data-cms-kind="text"],[data-cms-kind="image"]');if(inner)el=inner}if(!elements.includes(el))return;e.preventDefault();e.stopPropagation();select(el)},true);
for(const el of textEls){el.addEventListener('input',()=>storeText(el));el.addEventListener('blur',()=>{if(el===active)storeText(el)})}
$('cms-font').onchange=e=>{if(active)setStyle(active,'fontFamily',e.target.value)};
$('cms-size').onchange=e=>{if(active)setStyle(active,'fontSize',e.target.value)};
$('cms-color').oninput=e=>{if(active)setStyle(active,'color',e.target.value)};
$('cms-bgcolor').oninput=e=>{if(active)setStyle(active,'backgroundColor',e.target.value)};
$('cms-bold').onclick=()=>{if(active)setStyle(active,'fontWeight',active.style.fontWeight==='bold'?'normal':'bold')};
$('cms-align').onclick=()=>{if(active)setStyle(active,'textAlign',active.style.textAlign==='center'?'left':'center')};
$('cms-break').onclick=()=>{if(!active||active.dataset.cmsKind!=='text')return;active.focus();document.execCommand('insertHTML',false,'<br>');storeText(active)};
function moveSelected(dx,dy){if(!active){alert('먼저 이동할 글씨나 사진을 클릭하세요.');return}const key=active.dataset.cmsKey,old=content[key]||{};const x=Math.max(-1000,Math.min(1000,(Number(old.moveX)||0)+dx)),y=Math.max(-1000,Math.min(1000,(Number(old.moveY)||0)+dy));content[key]={...old,type:active.dataset.cmsKind==='text'?'text':active.dataset.cmsKind==='image'?'image':'style',moveX:x,moveY:y,transform:`translate(${x}px, ${y}px)`};active.style.transform=`translate(${x}px, ${y}px)`;mark();status(`위치 이동: 가로 ${x}px / 세로 ${y}px · 게시 버튼을 누르세요`)}
for(const [id,dx,dy] of [['cms-up',0,-1],['cms-down',0,1],['cms-left',-1,0],['cms-right',1,0]])$(id).onclick=()=>{const step=Number($('cms-step').value)||10;moveSelected(dx*step,dy*step)};
$('cms-reset-position').onclick=()=>{if(!active)return;const key=active.dataset.cmsKey,old=content[key]||{};content[key]={...old,moveX:0,moveY:0,transform:'translate(0px, 0px)'};active.style.transform='translate(0px, 0px)';mark()};
$('cms-fit').onchange=e=>{if(!active||!e.target.value)return;const v=e.target.value;if(active.tagName==='IMG')setStyle(active,'objectFit',v);else setStyle(active,'backgroundSize',v)};
$('cms-photo-position').onclick=()=>{if(!active)return;const x=prompt('사진 가로 중심 위치 (0~100, 기본 50)', '50');if(x===null)return;const y=prompt('사진 세로 중심 위치 (0~100, 기본 50)', '50');if(y===null)return;const a=Number(x),b=Number(y);if(!Number.isFinite(a)||!Number.isFinite(b)||a<0||a>100||b<0||b>100){alert('0부터 100 사이의 숫자를 입력하세요.');return}setStyle(active,active.tagName==='IMG'?'objectPosition':'backgroundPosition',`${a}% ${b}%`)};
$('cms-spacing').onclick=()=>{if(!active)return;const n=prompt('글자 간격(px)을 입력하세요. 예: 2 또는 0', '0');if(n===null)return;if(!/^-?\d{1,2}(\.\d)?$/.test(n)){alert('숫자만 입력하세요.');return}setStyle(active,'letterSpacing',n+'px');const line=prompt('줄 간격을 입력하세요. 예: 1.6','1.6');if(line!==null&&/^\d(\.\d{1,2})?$/.test(line))setStyle(active,'lineHeight',line)};
async function upload(file){if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type)){alert('JPG, PNG, WEBP 사진만 가능합니다.');return}if(file.size>8*1024*1024){alert('8MB 이하 사진만 가능합니다.');return}status('사진 업로드 중...');const path='photos/'+crypto.randomUUID()+'.'+(file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg');const {error}=await db.storage.from('site-images').upload(path,file,{contentType:file.type});if(error){status('사진 업로드 실패: '+error.message);return}const {data:r}=db.storage.from('site-images').getPublicUrl(path);if(!active)return;const key=active.dataset.cmsKey;if(active.tagName==='IMG'){content[key]={...(content[key]||{}),type:'image',value:r.publicUrl};active.src=r.publicUrl}else{content[key]={...(content[key]||{}),type:'style',backgroundImage:r.publicUrl};active.style.backgroundImage=`url("${r.publicUrl}")`;active.classList.add('cms-photo-background');active.style.backgroundSize='cover';active.style.backgroundPosition='center'}mark()}
$('cms-photo').onclick=()=>{if(!active){alert('먼저 사진이나 배경 영역을 클릭하세요.');return}const inp=document.createElement('input');inp.type='file';inp.accept='image/png,image/jpeg,image/webp';inp.onchange=()=>upload(inp.files?.[0]);inp.click()};
function insertPhoto(anchor,src,alt){
  if(!anchor||!anchor.dataset.cmsKey){alert('먼저 사진 또는 사진을 넣을 영역을 선택하세요.');return}
  if(!safeUrl(src)){alert('이 사진 주소는 복사할 수 없습니다. 새 사진 추가 기능으로 업로드해 주세요.');return}
  const id=crypto.randomUUID(),rec={id,anchor:anchor.dataset.cmsKey,src,alt:alt||'추가 사진'};
  const list=Array.isArray(content[extraKey])?content[extraKey]:[];
  content[extraKey]=[...list,rec];renderExtraImages();
  const el=elements.find(x=>x.dataset.cmsKey===page+':extra:'+id);
  if(el){select(el);el.scrollIntoView({block:'center',behavior:'smooth'})}
  mark();status('사진이 추가됐습니다. 위치/크기를 조절한 후 변경사항 게시를 누르세요.');
}
$('cms-copy-photo').onclick=()=>{
  if(!active){alert('복사할 사진을 먼저 클릭하세요.');return}
  if(active.tagName!=='IMG'){alert('사진을 클릭한 후 복사하세요. 배경사진은 새 사진 추가로 업로드할 수 있습니다.');return}
  const src=active.currentSrc||active.src;
  insertPhoto(active,src,active.alt);
};
$('cms-add-photo').onclick=()=>{
  if(!active){alert('사진을 추가할 위치의 사진이나 영역을 먼저 클릭하세요.');return}
  const anchor=active;
  const input=document.createElement('input');input.type='file';input.accept='image/png,image/jpeg,image/webp';
  input.onchange=async()=>{
    const file=input.files?.[0];if(!file)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>8*1024*1024){alert('8MB 이하의 JPG, PNG, WEBP 사진만 가능합니다.');return}
    status('새 사진 업로드 중...');
    const path='photos/'+crypto.randomUUID()+'.'+(file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg');
    const {error}=await db.storage.from('site-images').upload(path,file,{contentType:file.type});
    if(error){status('업로드 실패: '+error.message);return}
    const {data}=db.storage.from('site-images').getPublicUrl(path);
    insertPhoto(anchor,data.publicUrl,file.name);
  };input.click();
};
$('cms-delete-photo').onclick=()=>{
  if(!active||!active.classList.contains('cms-extra-photo')){alert('이 버튼은 복사하거나 새로 추가한 사진에만 사용할 수 있습니다.');return}
  if(!confirm('선택한 추가 사진을 삭제할까요? 게시 후 실제 홈페이지에도 적용됩니다.'))return;
  const id=active.dataset.cmsKey.split(':extra:')[1];
  content[extraKey]=(content[extraKey]||[]).filter(x=>x.id!==id);
  delete content[active.dataset.cmsKey];
  const idx=elements.indexOf(active);if(idx>=0)elements.splice(idx,1);
  const ix=imageEls.indexOf(active);if(ix>=0)imageEls.splice(ix,1);
  active.remove();active=null;mark();status('추가 사진 삭제됨. 변경사항 게시를 눌러 저장하세요.');
};
$('cms-photo-size').onclick=()=>{
  if(!active||active.tagName!=='IMG'){alert('크기를 변경할 사진을 클릭하세요.');return}
  const n=prompt('사진 너비(px)를 입력하세요. 예: 400 (최대 1600)','400');if(n===null)return;
  const width=Number(n);if(!Number.isInteger(width)||width<50||width>1600){alert('50~1600 사이 숫자를 입력하세요.');return}
  setStyle(active,'width',width+'px');setStyle(active,'height','auto');setStyle(active,'maxWidth','100%');
};
$('cms-save').onclick=async()=>{if(active?.isContentEditable)storeText(active);status('게시 중...');const {error}=await db.from('site_content').upsert({id:1,content,updated_at:new Date().toISOString()},{onConflict:'id'});if(error){status('게시 실패: '+error.message);return}dirty=false;status('게시 완료! 일반 홈페이지에 반영됐습니다.')};
$('cms-preview').onclick=()=>window.open(page,'_blank');
$('cms-undo').onclick=()=>{if(active){active.contentEditable='false';active.classList.remove('cms-selected');active=null}status('선택 해제됨')};
$('cms-logout').onclick=async()=>{if(dirty&&!confirm('게시하지 않은 변경사항이 있습니다. 로그아웃할까요?'))return;await db.auth.signOut();location.href='admin.html'};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});
}
init();
})();

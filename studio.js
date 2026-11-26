if(typeof window.claude==="undefined"){window.claude={use:()=>Promise.resolve(null)};window.__STANDALONE=true}
{

const STAGES=[
 {t:"সিরিজ লোড",g:"Series bible পড়ে ৫ লাইনের সারাংশ।",p:"Read the series bible below. Summarise in exactly 5 lines: where the story is, open threads, characters in play, style rules, voiceover language. Do not invent anything that is not in the bible; if information is missing, say what is missing."},
 {t:"আইডিয়া",g:"গল্প এগিয়ে নেওয়ার ৩টা এপিসোড আইডিয়া।",p:"Offer 3 original episode ideas that continue the story, each with a one-line hook and the emotional beat. Recommend one and say why."},
 {t:"স্ক্রিপ্ট",g:"পূর্ণ স্ক্রিপ্ট, প্রথম ৫ সেকেন্ডে hook।",p:"Write the full episode script for the approved idea: a hook in the first 5 seconds, scene-by-scene narration, emotion notes, expected length. Then score the hook out of 10 and rewrite weak lines. Write the narration in the series' voiceover language."},
 {t:"ভয়েসওভার",g:"MP3 প্রস্তুতি ও সময় ভাগ।",p:"Prepare the voiceover: give a clean narration-only script ready to record or send to ElevenLabs (with pause marks and emotion cues), suggest a voice character, and a rough timing table (line, start, end) for subtitles."},
 {t:"Storyboard",g:"দৃশ্য ভাগ ও Figma storyboard পরিকল্পনা।",p:"Turn the script and timing into a shot list. For each scene: number, duration, background, character pose/expression, camera move, effects (rain, light, particles), music and SFX cue. Then list every PNG asset needed. Finally, give a Figma frame plan: one 16:9 frame per scene with its caption."},
 {t:"Preview",g:"Preview-এর পরিকল্পনা ও চেকলিস্ট।",p:"Plan a short preview cut: which key scenes, in which order, about how long. Give a checklist: style consistency with earlier episodes, subtitle sync, music about half the voice level, no copied reference material."},
 {t:"চূড়ান্ত রেন্ডার",g:"MP4 ও SRT রেন্ডারের নির্দেশনা।",p:"Write the final render brief: resolution (1920x1080 unless Shorts 9:16), scene order with durations, transitions, subtitle style, audio mix levels, and a final QA checklist before delivery."},
 {t:"YouTube প্যাকেজ",g:"Title, thumbnail, বর্ণনা, tags।",p:"Create YouTube packaging: 3 title options with a short critique each, 3 thumbnail concepts (text, focal point, colours matching the series, 1280x720), a description with chapters, 15 tags, a pinned comment, and a posting-time suggestion."},
 {t:"আপলোডের পর",g:"কমেন্টের উত্তর ও retention বিশ্লেষণ (ঐচ্ছিক)।",p:"Using any analytics or comments the user pasted below, draft replies to comments, read the retention, and suggest what the next episode should change. If nothing was pasted, say what data you need."}
];
const RULES="You are the Anime Universe production assistant for the original anime series 'Anime Chronicles'. Fixed rules: never change the established anime style, character designs, colour palette, sound identity or visual theme; reference videos only inspire, never copy; original story, characters and music choices only, no copyrighted characters or lyrics; never invent facts about the series beyond the bible and approved work. Explain in Bangla (technical terms may stay in English); scripts and narration use the series' voiceover language.";

const $=s=>document.querySelector(s);
const VCSS=`.voice{border:1px solid var(--line);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:12px;background:var(--bg)}
.voice h3{font-size:20px}
.vgrid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto;gap:8px;align-items:end}
.vlist{display:flex;flex-direction:column;gap:6px;max-height:320px;overflow:auto}
.vitem{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:var(--card)}
.vitem.sel{border-color:var(--red)}
.vitem small{display:block;color:var(--mute);font-size:13px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.vitem input{width:20px;height:20px}
a.lnk{color:var(--red);font-weight:600;white-space:nowrap}
.res{border-left:3px solid var(--ok);padding:8px 12px;background:var(--card);border-radius:0 8px 8px 0}
.scn{border:1px solid var(--line);border-radius:12px;padding:12px;background:var(--card);display:flex;flex-direction:column;gap:8px}.scn label{font-weight:600;font-size:14px}.scn-h{display:flex;align-items:center;gap:8px}.scn-h .sdel{margin-left:auto;min-height:36px}.sgrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.cols{display:flex;gap:6px}.cols input{height:44px;padding:2px}.acv{width:100%;max-width:720px;border-radius:12px;background:#000;display:block}.acv.tall{max-width:300px}@media(max-width:600px){.vgrid{grid-template-columns:minmax(0,1fr)}.sgrid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}}
`;
if(!document.getElementById('vcss')){const st_=document.createElement('style');st_.id='vcss';st_.textContent=VCSS;document.head.appendChild(st_)}
const CSS=$('#css').textContent;
let S; try{S=JSON.parse($('#state').textContent)}catch(e){S={bible:"",active:0,episodes:[]}}
if(!S.episodes.length)S.episodes.push({id:'ep002',title:'EP002',cur:0,stages:{}});
let sample=null, art=null, busy=false, ctrl=null;
claude.use("sample").then(x=>{sample=x;render()});
claude.use("artifact").then(x=>{art=x});
let mcp=null;claude.use("mcp").then(x=>{mcp=x;render()});
const CX="Composio";
let V={cvoices:[],voices:[],busy:false,msg:"",confirm:false,cost:""};

const ep=()=>S.episodes[S.active]||S.episodes[0];
const st=(e,i)=>e.stages[i]||(e.stages[i]={note:"",out:"",status:"todo"});
const EL="ElevenLabs";
async function el(tool,input){const r=await mcp.callTool(EL,tool,input);return r&&r.payload!==undefined?r.payload:r}
function walk(o,f,k){if(o&&typeof o==='object'){for(const [kk,v] of Object.entries(o)){f(kk,v);walk(v,f,kk)}}}
function pick(o,keys){let out=[];walk(o,(k,v)=>{if(keys.includes(k)){if(Array.isArray(v))out.push(...v);else out.push(v)}});return out}
const isUrl=v=>typeof v==='string'&&/^https:\/\//.test(v);
async function cx(slug,args){const r=await mcp.callTool(CX,'COMPOSIO_MULTI_EXECUTE_TOOL',{tools:[{tool_slug:slug,arguments:args}],sync_response_to_workbench:false,thought:'Anime Studio voice'});
  const p=r&&r.payload!==undefined?r.payload:r;const res=pick(p,['results'])[0]||{};const resp=res.response||res;
  if(resp&&resp.successful===false)throw {message:resp.error||'Cartesia error'};if(p&&p.successful===false)throw {message:p.error||'Composio error'};return resp.data!==undefined?resp.data:resp}
const EMO=['neutral','calm','sad','melancholic','mysterious','determined','hopeful','scared','anxious','angry','excited','nostalgic','wistful','contemplative','serene','surprised'].filter(x=>x!=='hopeful');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

let saveT=null;
function save(msg){
  try{localStorage.setItem('au-studio',JSON.stringify(S))}catch(e){}
  clearTimeout(saveT);
  saveT=setTimeout(async()=>{
    if(!art){setStatus(msg||'এই ব্রাউজারে সেভ হয়েছে');return}
    try{await art.publish(PAGE())}catch(e){setStatus(e&&e.code==='conflict'?'অন্য জায়গায় বদল হয়েছে, পেজ নতুন করে লোড হচ্ছে':'শুধু এই ব্রাউজারে সেভ হয়েছে')}
  },600);
}
const HEAD=`
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Anime Universe Studio</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@500;700;900&family=Noto+Sans+Bengali:wght@400;600;700&display=swap" rel="stylesheet">
`;
const BODY=`
<header class="hero"><div class="in">
  <div>
    <h1>Anime Universe Studio</h1>
    <p>Anime Chronicles-এর প্রতিটা এপিসোড ৯টা ধাপে বানান। প্রতিটা ধাপে Claude কাজ করবে, আপনি অনুমোদন দিলে পরের ধাপ খুলবে।</p>
    <div class="eprow">
      <select id="epSel" aria-label="এপিসোড বেছে নিন"></select>
      <button id="newEp" type="button">+ নতুন এপিসোড</button>
    </div>
  </div>
  <div class="slate" aria-hidden="true"><svg id="slate" viewBox="0 0 600 260" preserveAspectRatio="xMidYMid slice"></svg></div>
</div></header>

<main class="wrap">
  <nav class="rail" id="rail" aria-label="ধাপসমূহ"></nav>
  <div style="display:flex;flex-direction:column;gap:16px">
    <details class="bible" id="bibleBox">
      <summary>Series bible ও চরিত্র (একবার লিখে রাখুন, প্রতিটা ধাপে Claude পড়বে)</summary>
      <textarea id="bible" style="min-height:180px" placeholder="গল্প এখন কোথায়, চরিত্রদের বর্ণনা, anime style-এর নিয়ম, রং, ভয়েসওভারের ভাষা, আগের এপিসোডগুলোর সারাংশ…"></textarea>
      <div class="acts" style="margin-top:10px"><button id="saveBible" type="button">Bible সেভ করুন</button></div>
    </details>
    <section class="panel" id="panel" aria-live="polite"></section>
  </div>
</main>

`;
function PAGE(){
  const json=JSON.stringify(S).replace(/</g,'\\u003c');
  return '<!DOCTYPE html>\n<html lang="bn">\n<head>'+HEAD+'<style id="css">'+CSS+'<\/style>\n</head>\n<body>'+BODY+'<script type="application/json" id="state">'+json+'<\/script>\n<script src="studio.js"><\/script>\n</body>\n</html>\n';
}
function setStatus(t){const el=$('#status');if(el)el.textContent=t}

function slate(){
  const e=ep(),done=STAGES.filter((_,i)=>st(e,i).status==='approved').length;
  const b=[[0,170,60,90],[50,140,45,120],[90,185,50,75],[135,120,40,140],[170,160,60,100],[225,135,35,125],[255,175,55,85],[305,110,45,150],[345,150,50,110],[390,170,40,90],[425,125,55,135],[475,160,45,100],[515,140,50,120],[560,175,45,85]];
  $('#slate').innerHTML=`<rect width="600" height="260" fill="#151a24"/>
   <circle class="moon" cx="470" cy="70" r="42" fill="#f2ede3"/><circle cx="470" cy="70" r="70" fill="#f2ede3" opacity=".06"/>
   ${b.map(([x,y,w,h])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#0b0e14"/>`).join('')}
   ${b.map(([x,y,w])=>`<rect x="${x+10}" y="${y+16}" width="6" height="6" fill="#e9c46a" opacity=".55"/><rect x="${x+w-18}" y="${y+34}" width="6" height="6" fill="#e9c46a" opacity=".35"/>`).join('')}
   <g transform="translate(36,30)"><rect width="250" height="104" rx="8" fill="#f2ede3"/>
   <rect width="250" height="26" rx="8" fill="#e23b3b"/><rect y="18" width="250" height="8" fill="#e23b3b"/>
   <text x="14" y="18" font-size="13" font-weight="700" fill="#fff" font-family="Zen Kaku Gothic New">ANIME CHRONICLES · S01</text>
   <text x="14" y="62" font-size="30" font-weight="900" fill="#0f1218" font-family="Zen Kaku Gothic New">${esc(e.title)}</text>
   <text x="14" y="88" font-size="14" fill="#5e6270" font-family="Noto Sans Bengali">${done}/9 ধাপ অনুমোদিত</text></g>`;
}

function voiceUI(e){
  const v=e.voice||{},prov=v.prov||'el';
  const tabs=`<div class="acts" role="tablist" aria-label="ভয়েস সার্ভিস"><button type="button" id="pv-el" class="${prov==='el'?'pri':''}" aria-selected="${prov==='el'}">ElevenLabs</button><button type="button" id="pv-cx" class="${prov==='cx'?'pri':''}" aria-selected="${prov==='cx'}">Cartesia</button></div>`;
  return tabs+(prov==='cx'?cxUI(e):elUI(e));
}
function cxUI(e){
  const v=e.voice||{},c=v.cx||{};
  if(!mcp)return '<div class="voice"><h3>Cartesia ভয়েস</h3><div class="note">Cartesia (Composio) সংযোগ এই ভিউতে পাওয়া যাচ্ছে না। claude.ai-তে পেজটা খুলুন।</div></div>';
  const list=V.cvoices.map(x=>`<label class="vitem${x.id===c.voice_id?' sel':''}"><input type="radio" name="csel" value="${esc(x.id)}"${x.id===c.voice_id?' checked':''}><span><b>${esc(x.name)}</b><small>${esc((x.gender||'')+' · '+(x.description||''))}</small></span>${isUrl(x.preview_file_url)?`<a class="lnk" href="${esc(x.preview_file_url)}" target="_blank" rel="noopener">নমুনা ▶</a>`:''}</label>`).join('');
  const txt=c.text!==undefined?c.text:(v.text!==undefined?v.text:(st(e,3).out||st(e,2).out||''));
  return `<div class="voice"><h3>Cartesia দিয়ে ভয়েস বানান</h3>
   <div class="vgrid"><div><label for="clang">ভাষা</label><select id="clang">${[['hi','হিন্দি'],['en','ইংরেজি'],['ja','জাপানি'],['bn','বাংলা']].map(([k,n])=>`<option value="${k}"${(c.lang||'hi')===k?' selected':''}>${n}</option>`).join('')}</select></div>
   <div><label for="cq">কেমন কণ্ঠ (ঐচ্ছিক)</label><input id="cq" placeholder="যেমন: narrator, gentle" value="${esc(c.q||'')}"></div>
   <button id="cfind" type="button"${V.busy?' disabled':''}>ভয়েস খুঁজুন</button></div>
   ${list?`<div class="vlist" role="radiogroup" aria-label="Cartesia ভয়েস">${list}</div>`:''}
   ${c.voice_name?`<div>বাছাই করা: <b>${esc(c.voice_name)}</b></div>`:''}
   <div class="vgrid"><div><label for="cemo">আবেগ</label><select id="cemo">${EMO.map(x=>`<option value="${x}"${(c.emo||'neutral')===x?' selected':''}>${x}</option>`).join('')}</select></div>
   <div><label for="cspeed">গতি (0.6–1.5)</label><input id="cspeed" type="number" min="0.6" max="1.5" step="0.05" value="${esc(c.speed||1)}"></div><span></span></div>
   <div><label for="ctext">যে লেখাটা পড়া হবে</label><textarea id="ctext" style="min-height:180px">${esc(txt)}</textarea>
   <small style="color:var(--mute)">শুধু পড়ার লেখা রাখুন। খরচ লেখার দৈর্ঘ্য অনুযায়ী হবে (এখন ${txt.length} অক্ষর)।</small></div>
   <div class="acts">${V.confirm?`<button class="pri" id="cgo" type="button"${V.busy?' disabled':''}>হ্যাঁ, ক্রেডিট খরচ করে বানাও</button><button id="vno" type="button">বাতিল</button>`:`<button class="pri" id="cmake" type="button"${V.busy||!c.voice_id?' disabled':''}>ভয়েস বানাও</button>`}</div>
   ${V.confirm?'<div class="note">এতে আপনার Cartesia ক্রেডিট খরচ হবে। একবার চাপলে একবারই বানাবে।</div>':''}
   <div class="status" id="vstatus"></div>
   ${V.cxLocal?audioBox(V.cxLocal,'cartesia'):''}
   ${!(mcp&&mcp.api)&&c.audio?`<div class="res"><b>শেষ ভয়েস</b> (${esc(c.voice_name||'')}, ${esc(c.emo||'neutral')})<br><a class="lnk" href="${esc(c.audio)}" target="_blank" rel="noopener">শুনুন / ডাউনলোড ▶</a><br><small style="color:var(--mute)">লিংক কিছু সময় পর মেয়াদ শেষ হতে পারে, MP3 নামিয়ে রাখুন।</small></div>`:''}
  </div>`;
}
function cread(e){const v=e.voice||(e.voice={});const c=v.cx||(v.cx={});const g=id=>{const n=$(id);return n?n.value:undefined};
  if(g('#clang')!==undefined)c.lang=g('#clang');if(g('#cq')!==undefined)c.q=g('#cq');if(g('#cemo')!==undefined)c.emo=g('#cemo');
  if(g('#cspeed')!==undefined){const n=parseFloat(g('#cspeed'));c.speed=isFinite(n)?Math.min(1.5,Math.max(0.6,n)):1}
  if(g('#ctext')!==undefined)c.text=g('#ctext');return c}
async function cfind(){if(mcp&&mcp.api)return apiCfind();const e=ep(),c=cread(e);V.busy=true;render();vset('Cartesia ভয়েস খোঁজা হচ্ছে…');
  try{const a={language:c.lang||'hi',limit:15,include_preview_url:true};if(c.q)a.search_query=c.q;
    const d=await cx('CARTESIA_LIST_VOICES',a);V.cvoices=(d&&d.items)||pick(d,['items'])||[];
    V.msg=V.cvoices.length?'একটা ভয়েস বাছুন।':'এই ভাষায় কোনো ভয়েস পাওয়া যায়নি, অন্য ভাষা বা শব্দ দিয়ে খুঁজুন।'}
  catch(err){V.msg='খোঁজা যায়নি: '+(err&&(err.message||err.code)||'')}
  V.busy=false;render();vset(V.msg)}
async function cmake(){if(mcp&&mcp.api)return apiCmake();const e=ep(),c=cread(e);if(!c.text||!c.text.trim()){V.confirm=false;render();return vset('আগে লেখাটা দিন।')}
  V.busy=true;V.confirm=false;render();vset('Cartesia ভয়েস বানাচ্ছে… (লম্বা লেখায় একটু সময় লাগে)');
  try{const a={transcript:c.text,voice_id:c.voice_id,language:c.lang||'hi',output_container:'mp3',model_id:'sonic-3.6'};
    if(c.emo&&c.emo!=='neutral')a.emotion=c.emo;if(c.speed&&c.speed!==1)a.speed=c.speed;
    const d=await cx('CARTESIA_SYNTHESIZE_SPEECH',a);
    const url=pick(d,['s3url','s3_url','download_url','url','file_url','audio_url']).find(isUrl);
    c.audio=url||'';c.at=Date.now();V.msg=url?'ভয়েস তৈরি হয়েছে! নিচের লিংক থেকে শুনুন ও নামান।':'তৈরি হয়েছে বলে মনে হচ্ছে, কিন্তু অডিও লিংক পাওয়া যায়নি। Claude চ্যাটে বললে ফাইলটা বের করে দেব।'}
  catch(err){V.msg='ভয়েস বানানো যায়নি: '+(err&&(err.message||err.code)||'')}
  V.busy=false;render();vset(V.msg);save()}
function elUI(e){
  const v=e.voice||{};
  if(!mcp)return '<div class="voice"><h3>ElevenLabs ভয়েস</h3><div class="note">ElevenLabs সংযোগ এই ভিউতে পাওয়া যাচ্ছে না। claude.ai-তে পেজটা খুলুন এবং ElevenLabs connector যুক্ত আছে কিনা দেখুন।</div></div>';
  const list=V.voices.map(x=>`<label class="vitem${x.voice_id===v.voice_id?' sel':''}"><input type="radio" name="vsel" value="${esc(x.voice_id)}"${x.voice_id===v.voice_id?' checked':''}><span><b>${esc(x.name)}</b><small>${esc(x.description||'')}</small></span>${isUrl(x.preview_url)?`<a class="lnk" href="${esc(x.preview_url)}" target="_blank" rel="noopener">নমুনা ▶</a>`:''}</label>`).join('');
  return `<div class="voice"><h3>ElevenLabs দিয়ে ভয়েস বানান</h3>
   <div class="vgrid"><div><label for="vlang">ভাষা</label><select id="vlang">${[['hi','হিন্দি'],['bn','বাংলা'],['en','ইংরেজি'],['ja','জাপানি']].map(([c,n])=>`<option value="${c}"${(v.lang||'hi')===c?' selected':''}>${n}</option>`).join('')}</select></div>
   <div><label for="vq">কেমন কণ্ঠ (ঐচ্ছিক)</label><input id="vq" placeholder="যেমন: deep emotional storyteller" value="${esc(v.q||'')}"></div>
   <button id="vfind" type="button"${V.busy?' disabled':''}>ভয়েস খুঁজুন</button></div>
   ${list?`<div class="vlist" role="radiogroup" aria-label="ভয়েস">${list}</div>`:''}
   ${v.voice_name?`<div>বাছাই করা: <b>${esc(v.voice_name)}</b></div>`:''}
   <div><label for="vmodel">মডেল</label><select id="vmodel">${[['eleven_v4','v4 (আবেগের ট্যাগ যেমন [whispering] চলে)'],['eleven_multilingual_v2','Multilingual v2'],['eleven_v3','v3']].map(([c,n])=>`<option value="${c}"${(v.model||'eleven_v4')===c?' selected':''}>${n}</option>`).join('')}</select></div>
   <div><label for="vtext">যে লেখাটা পড়া হবে</label><textarea id="vtext" style="min-height:180px">${esc(v.text!==undefined?v.text:(st(e,3).out||st(e,2).out||''))}</textarea>
   <small style="color:var(--mute)">শুধু পড়ার লেখা রাখুন, নির্দেশনা বা টেবিল মুছে দিন।</small></div>
   <div class="acts"><button id="vcost" type="button"${V.busy||!v.voice_id?' disabled':''}>খরচ দেখুন</button>
   ${V.confirm?`<button class="pri" id="vgo" type="button"${V.busy?' disabled':''}>হ্যাঁ, ক্রেডিট খরচ করে বানাও</button><button id="vno" type="button">বাতিল</button>`:`<button class="pri" id="vmake" type="button"${V.busy||!v.voice_id?' disabled':''}>ভয়েস বানাও</button>`}</div>
   ${V.confirm?'<div class="note">এতে আপনার ElevenLabs ক্রেডিট খরচ হবে। একবার চাপলে একবারই বানাবে।</div>':''}
   <div class="status" id="vstatus"></div>
   ${V.elLocal?audioBox(V.elLocal,'elevenlabs'):''}
   ${!(mcp&&mcp.api)&&(v.audio||v.flow_url)?`<div class="res"><b>শেষ ভয়েস</b> (${esc(v.voice_name||'')})<br>${isUrl(v.audio)?`<a class="lnk" href="${esc(v.audio)}" target="_blank" rel="noopener">শুনুন / ডাউনলোড ▶</a> `:''}${isUrl(v.flow_url)?` · <a class="lnk" href="${esc(v.flow_url)}" target="_blank" rel="noopener">ElevenLabs-এ খুলুন</a>`:''}<br><small style="color:var(--mute)">লিংক কিছু সময় পর মেয়াদ শেষ হতে পারে, MP3 নামিয়ে রাখুন।</small></div>`:''}
  </div>`;
}
function vset(t){V.msg=t;const el2=$('#vstatus');if(el2)el2.textContent=t}
function vread(e){const v=e.voice||(e.voice={});const g=id=>{const n=$(id);return n?n.value:undefined};
  if(g('#vlang')!==undefined)v.lang=g('#vlang');if(g('#vq')!==undefined)v.q=g('#vq');if(g('#vmodel')!==undefined)v.model=g('#vmodel');if(g('#vtext')!==undefined)v.text=g('#vtext');return v}
async function vfind(){if(mcp&&mcp.api)return apiVfind();const e=ep(),v=vread(e);V.busy=true;render();vset('ভয়েস খোঁজা হচ্ছে…');
  try{const inp={languages:[v.lang||'hi'],page_size:12};if(v.q)inp.search=v.q;else inp.use_cases=['narrative_story'];
    const p=await el('creative_list_voices',inp);V.voices=(p&&p.voices)||[];V.msg=V.voices.length?'একটা ভয়েস বাছুন, "নমুনা" চেপে শুনতে পারেন।':'কোনো ভয়েস পাওয়া যায়নি, অন্য শব্দে খুঁজুন।'}
  catch(err){V.msg='খোঁজা যায়নি: '+(err&&(err.message||err.code)||'')}
  V.busy=false;render();vset(V.msg)}
function vinput(v){return{prompt:v.text,model_id:v.model||'eleven_v4',voice_id:v.voice_id,generations_count:1}}
async function vcost(){if(mcp&&mcp.api)return apiVcost();const e=ep(),v=vread(e);if(!v.text||!v.text.trim())return vset('আগে লেখাটা দিন।');V.busy=true;render();vset('খরচ হিসাব হচ্ছে…');
  try{const p=await el('creative_generate_speech',{...vinput(v),estimate_only:true});let c=[];walk(p,(k,x)=>{if(/credit|cost/i.test(k)&&(typeof x==='number'||typeof x==='string'))c.push(k+': '+x)});V.msg=c.length?'আনুমানিক খরচ — '+c.join(', '):'খরচের হিসাব পাওয়া গেছে, কিন্তু সংখ্যা বোঝা গেল না।'}
  catch(err){V.msg='খরচ দেখা যায়নি: '+(err&&(err.message||err.code)||'')}
  V.busy=false;render();vset(V.msg)}
async function vmake(){if(mcp&&mcp.api)return apiVmake();const e=ep(),v=vread(e);if(!v.text||!v.text.trim()){V.confirm=false;render();return vset('আগে লেখাটা দিন।')}
  V.busy=true;V.confirm=false;render();vset('ভয়েস বানানো শুরু হচ্ছে…');
  try{const p=await el('creative_generate_speech',vinput(v));
    const flow=p&&p.flow_id,sess=pick(p,['session_ids','session_id']).filter(x=>typeof x==='string');
    v.flow_url=pick(p,['url','flow_url']).find(isUrl)||v.flow_url;v.audio='';v.at=Date.now();save();
    if(!flow||!sess.length){V.msg='শুরু হয়েছে। ফল দেখতে "ElevenLabs-এ খুলুন" চাপুন।'}
    else{let done=false,fail=false,stat=null;
      for(let k=0;k<40&&!done;k++){vset('ভয়েস তৈরি হচ্ছে… ('+(k*5)+' সেকেন্ড)');await sleep(5000);
        stat=await el('creative_get_flow_run_status',{flow_id:flow,session_ids:sess});
        done=!!(pick(stat,['all_completed'])[0]);fail=!!(pick(stat,['has_failures'])[0]);if(fail)break}
      if(fail)V.msg='ElevenLabs-এ তৈরি ব্যর্থ হয়েছে। "ElevenLabs-এ খুলুন" দিয়ে কারণ দেখুন।';
      else if(!done)V.msg='এখনো শেষ হয়নি। একটু পরে "ElevenLabs-এ খুলুন" দিয়ে দেখুন।';
      else{let ids=pick(stat,['generation_id','generation_ids']).filter(x=>typeof x==='string');
        if(!ids.length){walk(stat,(k,x)=>{if(k==='generations'&&Array.isArray(x))x.forEach(g=>g&&g.id&&ids.push(g.id))})}
        let url=pick(stat,['full_res_url','audio_url']).find(isUrl);
        if(!url&&ids.length){const g=await el('creative_get_generations',{flow_id:flow,generation_ids:ids.slice(0,1)});url=pick(g,['full_res_url','audio_url','url']).find(isUrl)}
        v.audio=url||'';V.msg=url?'ভয়েস তৈরি হয়েছে! নিচের লিংক থেকে শুনুন ও নামান।':'তৈরি হয়েছে, কিন্তু অডিও লিংক পাওয়া যায়নি। "ElevenLabs-এ খুলুন" দিয়ে নামান।'}}
  }catch(err){V.msg='ভয়েস বানানো যায়নি: '+(err&&(err.message||err.code)||'')+'। আবার চাপার আগে ElevenLabs-এ দেখে নিন, যাতে দুবার খরচ না হয়।'}
  V.busy=false;render();vset(V.msg);save()}

function render(){
  const e=ep();
  $('#epSel').innerHTML=S.episodes.map((x,i)=>`<option value="${i}"${i===S.active?' selected':''}>${esc(x.title)}</option>`).join('');
  $('#bible').value=S.bible||'';
  if(!S.bible)$('#bibleBox').open=true;
  $('#rail').innerHTML=STAGES.map((s,i)=>{
    const x=st(e,i),locked=i>0&&st(e,i-1).status!=='approved';
    const tag=x.status==='approved'?'<span class="tag done">অনুমোদিত</span>':x.status==='review'?'<span class="tag rev">দেখুন</span>':locked?'<span class="tag">বন্ধ</span>':'<span class="tag">বাকি</span>';
    return `<button type="button" class="step${i===e.cur?' on':''}${x.status==='approved'?' done':''}" data-i="${i}"><span class="n">${i}</span><span><b>${esc(s.t)}</b><small>${esc(s.g)}</small></span>${tag}</button>`}).join('');
  const i=e.cur,s=STAGES[i],x=st(e,i),locked=i>0&&st(e,i-1).status!=='approved';
  $('#panel').innerHTML=`<h2>ধাপ ${i}: ${esc(s.t)}</h2><div class="goal"></div>
   ${locked?'<div class="note">আগের ধাপ অনুমোদন না হওয়া পর্যন্ত এই ধাপ বন্ধ থাকবে।</div>':''}
   <div><label for="note">আপনার নির্দেশনা বা তথ্য (ঐচ্ছিক)</label><textarea id="note" placeholder="যেমন: দুঃখের মেজাজ চাই, ৩ মিনিটের মধ্যে, বৃষ্টির দৃশ্য রাখুন…"></textarea></div>
   <div class="acts"><button class="pri" id="run" type="button"${locked||busy||!sample?' disabled':''}>${x.out?'আবার বানাও':'Claude দিয়ে বানাও'}</button>
   ${busy?'<button id="stop" type="button">থামাও</button>':''}</div>
   ${sample?'':'<div class="note">Claude-এর সাথে সংযোগ এই ভিউতে পাওয়া যাচ্ছে না। claude.ai-তে পেজটা খুলুন।</div>'}
   <div><label for="out">ফলাফল (আপনি নিজেও সম্পাদনা করতে পারেন)</label><textarea id="out" class="out" placeholder="এখানে Claude-এর কাজ আসবে…"></textarea></div>
   <div class="acts"><button class="okb" id="ok" type="button"${!x.out||busy?' disabled':''}>${x.status==='approved'?'✓ অনুমোদিত':'অনুমোদন দিন → পরের ধাপ'}</button>
   <button id="copy" type="button"${!x.out?' disabled':''}>কপি করুন</button></div>
   <div class="status" id="status"></div>
   ${i===3?voiceUI(e):''}
   ${i===5||i===6?animUI(e):''}
   ${i===4?'<div class="note">Figma ডিজাইন এই পেজ থেকে হয় না। এই ধাপের ফলাফল কপি করে Claude চ্যাটে দিন। Storyboard অনুমোদনের পর ধাপ ৫-এ এখানেই MP4 বানাতে পারবেন।</div>':''}`;
  $('#panel .goal').textContent=s.g;if(i===3&&V.msg)vset(V.msg);if((i===5||i===6)&&A.msg)aset(A.msg); $('#note').value=x.note; $('#out').value=x.out;
  slate();
}

async function run(){
  const e=ep(),i=e.cur,x=st(e,i);
  x.note=$('#note').value;
  const prev=STAGES.slice(0,i).map((s,k)=>st(e,k).status==='approved'?`### Approved stage ${k} (${s.t})\n${st(e,k).out}`:'').filter(Boolean).join('\n\n');
  const input=`${RULES}\n\n## Series bible\n${S.bible||'(empty — tell the user to fill the bible)'}\n\n## Episode\n${e.title}\n\n${prev}\n\n## Current stage ${i}: ${STAGES[i].t}\n${STAGES[i].p}\n\n## User's notes for this stage\n${x.note||'(none)'}\n\nReply with the stage result only, clearly formatted in plain text.`;
  busy=true;ctrl=new AbortController();render();setStatus('Claude কাজ করছে…');
  try{
    const r=await sample(input,{modelTier:'complex',signal:ctrl.signal,cache:false,onText:({text})=>{const o=$('#out');if(o)o.value=text}});
    x.out=r.text;x.status='review';setStatus(r.truncated?'ফলাফল লম্বা হওয়ায় কেটে গেছে, "আবার বানাও" দিন বা নির্দেশনা ছোট করুন।':'শেষ। দেখে অনুমোদন দিন বা বদল চেয়ে আবার বানান।');
  }catch(err){
    if(err&&err.code==='not_granted'){sample=null}
    x.out=(err&&err.text)||x.out;
    setStatus(err&&err.code==='rate_limited'?'একটু পরে আবার চেষ্টা করুন।':'কাজ শেষ হয়নি'+(err&&err.message?': '+err.message:''));
  }
  busy=false;ctrl=null;const m=$('#status').textContent;render();setStatus(m);save();
}

document.addEventListener('click',ev=>{
  const b=ev.target.closest('button');if(!b)return;
  const e=ep();
  if(b.dataset.i!==undefined){e.cur=+b.dataset.i;render();return}
  if(b.id==='run')return run();
  if(b.id==='stop'){ctrl&&ctrl.abort();return}
  if(b.id==='ok'){const x=st(e,e.cur);x.out=$('#out').value;x.note=$('#note').value;x.status='approved';if(e.cur<8)e.cur++;render();save();setStatus('অনুমোদিত, সেভ হচ্ছে');return}
  if(b.id==='copy'){navigator.clipboard.writeText($('#out').value).then(()=>setStatus('কপি হয়েছে'),()=>setStatus('কপি করা গেল না, নিজে সিলেক্ট করে কপি করুন'));return}
  if(b.id==='saveBible'){S.bible=$('#bible').value;save();render();setStatus('Bible সেভ হয়েছে');return}
  if(b.id==='pv-el'||b.id==='pv-cx'){const v=e.voice||(e.voice={});v.prov=b.id==='pv-cx'?'cx':'el';V.confirm=false;V.msg='';render();save();return}
  if(b.id==='cfind')return cfind();
  if(b.id==='cmake'){cread(e);V.confirm=true;render();return}
  if(b.id==='cgo')return cmake();
  if(b.id==='vfind')return vfind();
  if(b.id==='vcost')return vcost();
  if(b.id==='vmake'){vread(e);V.confirm=true;render();return}
  if(b.id==='vno'){V.confirm=false;render();return}
  if(b.id==='vgo')return vmake();
  if(b.id==='newEp'){const n=S.episodes.length+2;S.episodes.push({id:'ep'+Date.now(),title:'EP'+String(n).padStart(3,'0'),cur:0,stages:{}});S.active=S.episodes.length-1;render();save();return}
});
document.addEventListener('change',ev=>{if(ev.target.name==='csel'){const e=ep(),c=cread(e);c.voice_id=ev.target.value;const x=V.cvoices.find(y=>y.id===c.voice_id);c.voice_name=x?x.name:'';render();save();return}if(ev.target.name==='vsel'){const e=ep(),v=vread(e);v.voice_id=ev.target.value;const x=V.voices.find(y=>y.voice_id===v.voice_id);v.voice_name=x?x.name:'';render();save();return}if(ev.target.id==='epSel'){S.active=+ev.target.value;render()}});
document.addEventListener('input',ev=>{const e=ep(),x=st(e,e.cur);
  if(ev.target.id==='out'){x.out=ev.target.value;if(x.status==='approved')x.status='review'}
  if(ev.target.id==='note')x.note=ev.target.value});
document.addEventListener('focusout',ev=>{if(ev.target.id==='out'||ev.target.id==='note')save();if(['vtext','vq','vlang','vmodel'].includes(ev.target.id)){vread(ep());save()}if(['ctext','cq','clang','cemo','cspeed'].includes(ev.target.id)){cread(ep());save()}});
try{if(!S.bible&&S.episodes.length===1&&!Object.keys(S.episodes[0].stages).length){const l=JSON.parse(localStorage.getItem('au-studio')||'null');if(l&&l.episodes)S=l}}catch(e){}


/* ---------- Vercel API mode (own server keys) ---------- */
function apiH(){return {'Content-Type':'application/json','x-studio-key':window.__STUDIO_KEY||''}}
async function apiJ(path,body){const r=await fetch(path,{method:body?'POST':'GET',headers:apiH(),body:body?JSON.stringify(body):undefined});
  if(!r.ok){let m='';try{m=(await r.json()).error}catch(_){m=r.statusText}throw {message:m||('HTTP '+r.status)}}return r}
function audioBox(a,who){return `<div class="res"><b>শেষ ভয়েস</b> (${esc(a.name||'')})<br><audio controls src="${a.url}" style="width:100%;margin:6px 0"></audio><a class="lnk" href="${a.url}" download="${esc(ep().title)}-${who}.mp3">MP3 ডাউনলোড ⬇</a><br><small style="color:var(--mute)">পেজ বন্ধ করলে এই অডিও থাকবে না, এখনই নামিয়ে রাখুন।</small></div>`}
async function apiVfind(){const e=ep(),v=vread(e);V.busy=true;render();vset('ভয়েস খোঁজা হচ্ছে…');
  try{const r=await apiJ('/api/el?action=voices&lang='+encodeURIComponent(v.lang||'hi')+'&q='+encodeURIComponent(v.q||''));const d=await r.json();V.voices=d.voices||[];
    V.msg=V.voices.length?'একটা ভয়েস বাছুন, "নমুনা" চেপে শুনতে পারেন।':'কোনো ভয়েস পাওয়া যায়নি, অন্য শব্দে খুঁজুন।'}
  catch(err){V.msg='খোঁজা যায়নি: '+(err.message||'')}V.busy=false;render();vset(V.msg)}
async function apiVcost(){const v=vread(ep());const n=(v.text||'').length;vset(`লেখায় ${n} অক্ষর। ElevenLabs সাধারণত প্রতি অক্ষরে প্রায় ১ ক্রেডিট নেয় (মডেল অনুযায়ী কম-বেশি)।`)}
async function apiVmake(){const e=ep(),v=vread(e);if(!v.text||!v.text.trim()){V.confirm=false;render();return vset('আগে লেখাটা দিন।')}
  V.busy=true;V.confirm=false;render();vset('ElevenLabs ভয়েস বানাচ্ছে…');
  try{const x=V.voices.find(y=>y.voice_id===v.voice_id)||{};const r=await apiJ('/api/el?action=tts',{text:v.text,voice_id:v.voice_id,model_id:v.model||'eleven_multilingual_v2',owner:x.public_owner_id||''});
    const b=await r.blob();if(V.elLocal)URL.revokeObjectURL(V.elLocal.url);V.elLocal={url:URL.createObjectURL(b),name:v.voice_name||''};V.msg='ভয়েস তৈরি হয়েছে! নিচে শুনুন ও ডাউনলোড করুন।'}
  catch(err){V.msg='ভয়েস বানানো যায়নি: '+(err.message||'')}V.busy=false;render();vset(V.msg)}
async function apiCfind(){const e=ep(),c=cread(e);V.busy=true;render();vset('Cartesia ভয়েস খোঁজা হচ্ছে…');
  try{const r=await apiJ('/api/cx?action=voices&lang='+encodeURIComponent(c.lang||'hi')+'&q='+encodeURIComponent(c.q||''));const d=await r.json();V.cvoices=d.voices||[];
    V.msg=V.cvoices.length?'একটা ভয়েস বাছুন।':'এই ভাষায় কোনো ভয়েস পাওয়া যায়নি।'}
  catch(err){V.msg='খোঁজা যায়নি: '+(err.message||'')}V.busy=false;render();vset(V.msg)}
async function apiCmake(){const e=ep(),c=cread(e);if(!c.text||!c.text.trim()){V.confirm=false;render();return vset('আগে লেখাটা দিন।')}
  V.busy=true;V.confirm=false;render();vset('Cartesia ভয়েস বানাচ্ছে…');
  try{const r=await apiJ('/api/cx?action=tts',{text:c.text,voice_id:c.voice_id,lang:c.lang||'hi',emotion:c.emo||'neutral',speed:c.speed||1});
    const b=await r.blob();if(V.cxLocal)URL.revokeObjectURL(V.cxLocal.url);V.cxLocal={url:URL.createObjectURL(b),name:(c.voice_name||'')+', '+(c.emo||'neutral')};V.msg='ভয়েস তৈরি হয়েছে! নিচে শুনুন ও ডাউনলোড করুন।'}
  catch(err){V.msg='ভয়েস বানানো যায়নি: '+(err.message||'')}V.busy=false;render();vset(V.msg)}
/* ---------- Storyboard -> MP4 (animatic) ---------- */
let dl=null;claude.use("downloads").then(x=>{dl=x;if(ep().cur===5||ep().cur===6)render()});
const A={files:{},audio:null,busy:false,msg:'',url:'',stop:false};
const CAMS=[['zoom-in','ধীরে জুম ইন'],['zoom-out','জুম আউট'],['pan-left','বাঁয়ে সরা'],['pan-right','ডানে সরা'],['static','স্থির']];
const FX=[['none','কিছু না'],['rain','বৃষ্টি'],['particles','ভাসমান আলো'],['light','আলোর রেখা'],['snow','তুষার']];
function aset(t){A.msg=t;const n=$('#astatus');if(n)n.textContent=t}
function animUI(e){
  const a=e.anim||{scenes:[],ratio:'16:9'};const sc=a.scenes||[];
  const total=sc.reduce((t,x)=>t+(+x.dur||0),0);
  const rows=sc.map((x,k)=>`<div class="scn" data-k="${k}">
    <div class="scn-h"><b>দৃশ্য ${k+1}</b><span class="tag">${(+x.dur||0).toFixed(1)}s</span><button type="button" class="sdel" data-k="${k}" aria-label="দৃশ্য ${k+1} মুছুন">✕</button></div>
    <div class="sgrid">
     <label>সময় (সেকেন্ড)<input type="number" min="0.5" step="0.5" class="sf" data-f="dur" data-k="${k}" value="${esc(x.dur||3)}"></label>
     <label>ক্যামেরা<select class="sf" data-f="camera" data-k="${k}">${CAMS.map(([c,n])=>`<option value="${c}"${x.camera===c?' selected':''}>${n}</option>`).join('')}</select></label>
     <label>ইফেক্ট<select class="sf" data-f="effect" data-k="${k}">${FX.map(([c,n])=>`<option value="${c}"${x.effect===c?' selected':''}>${n}</option>`).join('')}</select></label>
     <label>রং<span class="cols"><input type="color" class="sf" data-f="c1" data-k="${k}" value="${esc(x.c1||'#1b2233')}"><input type="color" class="sf" data-f="c2" data-k="${k}" value="${esc(x.c2||'#4a3b5c')}"></span></label>
    </div>
    <label>সাবটাইটেল<textarea class="sf" data-f="caption" data-k="${k}" style="min-height:60px">${esc(x.caption||'')}</textarea></label>
    <label class="img">ছবি (PNG/JPG, ঐচ্ছিক) ${A.files[k]?'✓ '+esc(A.files[k].name):''}<input type="file" accept="image/*" class="simg" data-k="${k}"></label>
    ${x.title?`<small style="color:var(--mute)">${esc(x.title)}</small>`:''}
  </div>`).join('');
  return `<div class="voice anim"><h3>Storyboard থেকে MP4</h3>
   <div class="note">এটা storyboard-এর <b>animatic</b>: আপনার ছবি, ক্যামেরা মুভ, ইফেক্ট, সাবটাইটেল আর ভয়েস মিলিয়ে একটা ভিডিও। পূর্ণ anime অ্যানিমেশন নয়।</div>
   <div class="acts"><button class="pri" id="ascenes" type="button"${A.busy||!sample?' disabled':''}>${sc.length?'Claude দিয়ে দৃশ্য আবার বানাও':'Storyboard থেকে দৃশ্য বানাও'}</button>
   <button id="aadd" type="button">+ দৃশ্য যোগ</button></div>
   ${rows||'<div class="status">এখনো কোনো দৃশ্য নেই। ধাপ ৪-এর storyboard থেকে Claude দৃশ্যের তালিকা বানাবে।</div>'}
   ${sc.length?`<div class="vgrid"><div><label for="aratio">মাপ</label><select id="aratio"><option value="16:9"${a.ratio!=='9:16'?' selected':''}>16:9 (YouTube)</option><option value="9:16"${a.ratio==='9:16'?' selected':''}>9:16 (Shorts)</option></select></div>
    <div><label for="aaudio">ভয়েস/মিউজিক (MP3, ঐচ্ছিক) ${A.audio?'✓ '+esc(A.audio.name):''}</label><input id="aaudio" type="file" accept="audio/*"></div>
    <button id="afit" type="button"${!A.audio?' disabled':''}>অডিওর মাপে সময় মেলাও</button></div>
    <div>মোট দৈর্ঘ্য: <b>${total.toFixed(1)} সেকেন্ড</b>। ভিডিও বানাতে প্রায় এতটা সময়ই লাগবে, পেজ খোলা রাখুন।</div>
    <div class="acts"><button class="pri" id="arender" type="button"${A.busy?' disabled':''}>🎬 MP4 বানাও</button>${A.busy?'<button id="astop" type="button">থামাও</button>':''}</div>`:''}
   <div class="status" id="astatus"></div>
   <canvas id="acanvas" style="${A.busy?'':'display:none'}" class="acv${a.ratio==='9:16'?' tall':''}" width="${a.ratio==='9:16'?720:1280}" height="${a.ratio==='9:16'?1280:720}"></canvas>
   ${A.url?`<video class="acv${a.ratio==='9:16'?' tall':''}" controls src="${A.url}"></video>
    <div class="acts">${dl?'<button class="okb" id="asave" type="button">ভিডিও ডাউনলোড</button>':(window.__STANDALONE?`<a class="lnk" href="${A.url}" download="${esc(ep().title)}-storyboard.${A.ext}">ভিডিও ডাউনলোড ⬇</a>`:'<div class="note">এখানে ডাউনলোড চালু নেই। ভিডিওর ⋮ মেনু থেকে সেভ করার চেষ্টা করুন।</div>')}</div>`:''}
  </div>`;
}
function aread(e){const a=e.anim||(e.anim={scenes:[],ratio:'16:9'});
  document.querySelectorAll('.sf').forEach(n=>{const k=+n.dataset.k,f=n.dataset.f;if(!a.scenes[k])return;a.scenes[k][f]=f==='dur'?Math.max(.5,parseFloat(n.value)||3):n.value});
  const r=$('#aratio');if(r)a.ratio=r.value;return a}
async function ascenes(){const e=ep(),a=aread(e);const sb=st(e,4).out,scr=st(e,2).out;
  if(!sb&&!scr)return aset('আগে ধাপ ৪ (Storyboard) বা ধাপ ২ (স্ক্রিপ্ট) সম্পূর্ণ করুন।');
  A.busy=true;render();aset('Claude দৃশ্যের তালিকা বানাচ্ছে…');
  const prompt=`Convert this anime episode storyboard into a JSON array of scenes for an animatic video. Return ONLY JSON: an array of objects with keys: "title" (short Bangla scene label), "dur" (seconds, number), "caption" (the subtitle/narration line for that scene, in the episode's narration language, may be empty), "camera" (one of zoom-in, zoom-out, pan-left, pan-right, static), "effect" (one of none, rain, particles, light, snow), "c1" and "c2" (two hex colours for a mood gradient fitting the scene and the series palette). Use the storyboard's durations when given. 4 to 20 scenes.\\n\\n## Series bible\\n${S.bible||'(empty)'}\\n\\n## Storyboard\\n${sb||'(none)'}\\n\\n## Script\\n${sb?'(use storyboard)':scr}`;
  try{let v;try{v=await sample.json(prompt,{modelTier:'default',cache:false})}catch(err){if(err&&err.code)throw err;const r=await sample(prompt,{modelTier:'default',cache:false});v=JSON.parse((r.text.match(/\[[\s\S]*\]/)||['[]'])[0])}
    const arr=Array.isArray(v)?v:(v&&v.scenes)||[];
    a.scenes=arr.slice(0,30).map(x=>({title:String(x.title||''),dur:Math.max(.5,+x.dur||3),caption:String(x.caption||''),camera:CAMS.some(c=>c[0]===x.camera)?x.camera:'zoom-in',effect:FX.some(f=>f[0]===x.effect)?x.effect:'none',c1:/^#[0-9a-f]{6}$/i.test(x.c1)?x.c1:'#1b2233',c2:/^#[0-9a-f]{6}$/i.test(x.c2)?x.c2:'#4a3b5c'}));
    A.files={};A.msg=a.scenes.length?a.scenes.length+'টা দৃশ্য তৈরি। প্রতিটায় ছবি দিন, দরকার হলে সময় বা সাবটাইটেল ঠিক করুন।':'দৃশ্য বানানো গেল না, আবার চেষ্টা করুন।'}
  catch(err){A.msg='দৃশ্য বানানো যায়নি: '+(err&&(err.message||err.code)||'')}
  A.busy=false;render();aset(A.msg);save()}
function loadImg(f){return new Promise((res,rej)=>{const u=URL.createObjectURL(f),im=new Image();im.onload=()=>res(im);im.onerror=rej;im.src=u})}
function drawScene(g,W,H,x,img,p,t){
  // p: progress 0..1 within scene, t: global seconds
  const z={'zoom-in':[1,1.15,0,0],'zoom-out':[1.15,1,0,0],'pan-left':[1.15,1.15,.06,-.06],'pan-right':[1.15,1.15,-.06,.06],'static':[1.02,1.02,0,0]}[x.camera]||[1,1.1,0,0];
  const s=z[0]+(z[1]-z[0])*p,dx=(z[2]+(z[3]-z[2])*p)*W;
  g.save();
  if(img){const r=Math.max(W/img.width,H/img.height)*s,w=img.width*r,h=img.height*r;g.drawImage(img,(W-w)/2+dx,(H-h)/2,w,h)}
  else{const gr=g.createLinearGradient(0,0,W*.3,H);gr.addColorStop(0,x.c1||'#1b2233');gr.addColorStop(1,x.c2||'#4a3b5c');g.fillStyle=gr;g.fillRect(0,0,W,H);
    g.globalAlpha=.9;g.fillStyle='#f2ede3';g.beginPath();g.arc(W*.75+dx*.5,H*.25,Math.min(W,H)*.08*s,0,7);g.fill();g.globalAlpha=1;
    g.fillStyle='rgba(8,10,16,.85)';for(let i=0;i<14;i++){const bw=W/14,bh=H*(.18+((i*37)%23)/60);g.fillRect(i*bw+dx*.3,H-bh,bw*.9,bh)}}
  // effects
  if(x.effect==='rain'){g.strokeStyle='rgba(200,220,255,.35)';g.lineWidth=1.5;g.beginPath();for(let i=0;i<120;i++){const px=(i*97.3+t*60)%W,py=(i*53.1+t*900)%H;g.moveTo(px,py);g.lineTo(px-6,py+22)}g.stroke()}
  if(x.effect==='snow'){g.fillStyle='rgba(255,255,255,.8)';for(let i=0;i<90;i++){const px=(i*97.3+Math.sin(t+i)*20)%W,py=(i*53.1+t*60)%H;g.beginPath();g.arc(px,py,2+(i%3),0,7);g.fill()}}
  if(x.effect==='particles'){for(let i=0;i<50;i++){const px=(i*131.7)%W,py=H-((i*71.3+t*40)%H);g.fillStyle=`rgba(255,225,150,${.25+.25*Math.sin(t*2+i)})`;g.beginPath();g.arc(px,py,2.5,0,7);g.fill()}}
  if(x.effect==='light'){const gr=g.createLinearGradient(0,0,W,H);gr.addColorStop(0,'rgba(255,240,200,.28)');gr.addColorStop(.5,'rgba(255,240,200,0)');g.fillStyle=gr;g.fillRect(0,0,W,H)}
  // vignette
  const vg=g.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.75);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.45)');g.fillStyle=vg;g.fillRect(0,0,W,H);
  g.restore();
}
function drawCaption(g,W,H,txt,alpha){if(!txt)return;g.save();g.globalAlpha=alpha;const fs=Math.round(Math.min(W,H)*.045);g.font=`600 ${fs}px "Noto Sans Bengali","Noto Sans Devanagari","Zen Kaku Gothic New",sans-serif`;g.textAlign='center';
  const maxW=W*.84,words=txt.split(/\s+/),lines=[];let cur='';for(const w of words){const t2=cur?cur+' '+w:w;if(g.measureText(t2).width>maxW&&cur){lines.push(cur);cur=w}else cur=t2}if(cur)lines.push(cur);
  const L=lines.slice(-3),lh=fs*1.35,bh=L.length*lh+fs*.6,y0=H-bh-H*.06;g.fillStyle='rgba(10,12,18,.62)';const bw=Math.min(maxW+fs,Math.max(...L.map(l=>g.measureText(l).width))+fs*1.2);
  g.beginPath();g.roundRect?g.roundRect((W-bw)/2,y0,bw,bh,fs*.4):g.rect((W-bw)/2,y0,bw,bh);g.fill();g.fillStyle='#fff';L.forEach((l,i)=>g.fillText(l,W/2,y0+fs*.3+lh*(i+.78)));g.restore()}
async function arender(){const e=ep(),a=aread(e);const sc=a.scenes;if(!sc.length)return;
  if(typeof MediaRecorder==='undefined')return aset('এই ব্রাউজারে ভিডিও রেকর্ড করা যায় না। কম্পিউটারে Chrome দিয়ে চেষ্টা করুন।');
  A.busy=true;A.stop=false;if(A.url){URL.revokeObjectURL(A.url);A.url=''}render();aset('ছবি লোড হচ্ছে…');
  const cv=$('#acanvas'),g=cv.getContext('2d'),W=cv.width,H=cv.height;
  try{
    const imgs=[];for(let k=0;k<sc.length;k++)imgs[k]=A.files[k]?await loadImg(A.files[k]).catch(()=>null):null;
    try{await document.fonts.ready}catch(_){}
    const stream=cv.captureStream(30);let actx=null,au=null;
    if(A.audio){actx=new AudioContext();au=new Audio(URL.createObjectURL(A.audio));const src=actx.createMediaElementSource(au),dst=actx.createMediaStreamDestination();src.connect(dst);dst.stream.getAudioTracks().forEach(tr=>stream.addTrack(tr))}
    const types=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm'];const mime=types.find(t=>MediaRecorder.isTypeSupported(t))||'';
    const rec=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:6e6}:undefined);const chunks=[];rec.ondataavailable=ev=>{if(ev.data&&ev.data.size)chunks.push(ev.data)};
    const done=new Promise(r=>rec.onstop=r);
    const starts=[];let acc=0;sc.forEach(x=>{starts.push(acc);acc+=+x.dur});const total=acc,FADE=.5;
    rec.start(500);if(au){try{await actx.resume();await au.play()}catch(_){aset('অডিও চালানো গেল না, ভিডিও অডিও ছাড়াই হবে।')}}
    const t0=performance.now();
    await new Promise(res=>{const tick=()=>{const t=(performance.now()-t0)/1000;if(t>=total||A.stop){res();return}
      let k=starts.findIndex((s0,j)=>t>=s0&&t<s0+(+sc[j].dur));if(k<0)k=sc.length-1;const x=sc[k],p=(t-starts[k])/(+x.dur);
      drawScene(g,W,H,x,imgs[k],p,t);
      const into=t-starts[k];if(k>0&&into<FADE){g.save();g.globalAlpha=1-into/FADE;drawScene(g,W,H,sc[k-1],imgs[k-1],1,t);g.restore()}
      const ca=Math.min(1,into/.3,(+x.dur-into)/.3);drawCaption(g,W,H,x.caption,Math.max(0,ca));
      if(k===sc.length-1&&+x.dur-into<FADE){g.fillStyle=`rgba(0,0,0,${1-(+x.dur-into)/FADE})`;g.fillRect(0,0,W,H)}
      aset(`রেকর্ড হচ্ছে… ${Math.floor(t)} / ${Math.ceil(total)} সেকেন্ড (পেজ খোলা রাখুন)`);
      setTimeout(tick,1000/30)};tick()});
    rec.stop();if(au)au.pause();await done;if(actx)actx.close();
    const type=(mime||'video/webm').split(';')[0];A.blob=new Blob(chunks,{type});A.ext=type.includes('mp4')?'mp4':'webm';A.url=URL.createObjectURL(A.blob);
    A.msg=A.stop?'থামানো হয়েছে। যতটুকু রেকর্ড হয়েছে তা দেখুন।':(A.ext==='mp4'?'ভিডিও তৈরি! নিচে দেখে ডাউনলোড করুন।':'ভিডিও তৈরি! এই ব্রাউজার MP4 সমর্থন করে না, তাই WebM হয়েছে। YouTube WebM নেয়; MP4 লাগলে কম্পিউটারের নতুন Chrome বা Safari ব্যবহার করুন।')}
  catch(err){A.msg='ভিডিও বানানো যায়নি: '+(err&&(err.message||err.name)||'')}
  A.busy=false;render();aset(A.msg)}
async function asave(){if(!dl||!A.blob)return;try{await dl.save({filename:`${ep().title}-storyboard.${A.ext}`,data:A.blob});aset('ডাউনলোড শুরু হয়েছে।')}catch(err){aset('ডাউনলোড হয়নি'+(err&&err.code?': '+err.code:''))}}
document.addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;const e=ep();
  if(b.id==='ascenes'){aread(e);ascenes()}
  else if(b.id==='aadd'){const a=aread(e);a.scenes.push({title:'',dur:3,caption:'',camera:'zoom-in',effect:'none',c1:'#1b2233',c2:'#4a3b5c'});render();save()}
  else if(b.classList.contains('sdel')){const a=aread(e),k=+b.dataset.k;a.scenes.splice(k,1);const nf={};Object.keys(A.files).forEach(j=>{j=+j;if(j<k)nf[j]=A.files[j];else if(j>k)nf[j-1]=A.files[j]});A.files=nf;render();save()}
  else if(b.id==='afit'&&A.audio){const a=aread(e),au=new Audio(URL.createObjectURL(A.audio));au.onloadedmetadata=()=>{const tot=a.scenes.reduce((t,x)=>t+(+x.dur),0)||1,f=au.duration/tot;a.scenes.forEach(x=>x.dur=Math.round(x.dur*f*10)/10);render();save();aset('সব দৃশ্যের সময় অডিওর দৈর্ঘ্য ('+au.duration.toFixed(1)+'s) অনুযায়ী মেলানো হয়েছে।')}}
  else if(b.id==='arender')arender();
  else if(b.id==='astop')A.stop=true;
  else if(b.id==='asave')asave();
});
document.addEventListener('change',ev=>{const n=ev.target;
  if(n.classList&&n.classList.contains('simg')&&n.files[0]){aread(ep());A.files[+n.dataset.k]=n.files[0];render()}
  else if(n.id==='aaudio'&&n.files[0]){aread(ep());A.audio=n.files[0];render()}
  else if(n.id==='aratio'){aread(ep());render();save()}
  else if(n.classList&&n.classList.contains('sf')){aread(ep());save()}});

render();

}

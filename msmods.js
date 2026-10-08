/* MasterSketch mods core: data-only mods (brushes, palettes, 3D models), mod codes, brush engine and previews.
   Mods never contain code – every value is checked and clamped here – so a mod can add things but can't change or break the app.
   Shared by the app and the website. Exposes window.MSM. */
(function(){'use strict';
const REPO='pnpran10-dot/mastersketch2',SITE='https://pnpran10-dot.github.io/mastersketch2/',TAU=Math.PI*2;
const num=(v,d,a,b)=>{v=+v;return isFinite(v)?Math.min(b,Math.max(a,v)):d};
const hex=c=>typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c)?c.toLowerCase():null;
const str=(s,n)=>String(s==null?'':s).replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,n);

/* ---------- brushes ---------- */
const TIPS=[['round','fa-circle','Round'],['soft','fa-cloud','Soft'],['square','fa-square','Square'],['star','fa-star','Star'],['heart','fa-heart','Heart'],['leaf','fa-leaf','Leaf'],['drop','fa-droplet','Drop'],['line','fa-grip-lines-vertical','Line'],['ring','fa-circle-notch','Ring'],['spark','fa-wand-magic-sparkles','Sparkle'],['custom','fa-pen-nib','Draw your own']];
const ICONS=['fa-paintbrush','fa-brush','fa-pen','fa-pen-fancy','fa-star','fa-heart','fa-leaf','fa-seedling','fa-feather','fa-bolt','fa-fire','fa-snowflake','fa-cloud','fa-droplet','fa-wand-magic-sparkles','fa-spray-can','fa-palette','fa-moon','fa-sun','fa-gem','fa-ghost','fa-candy-cane','fa-shapes','fa-splotch'];
const COLM=[['color','Brush color'],['two','Mix both colors'],['rainbow','Rainbow'],['random','Random colors']];
const BLEND=[['normal','Normal'],['add','Glowing (add)']];
const BDEF={n:'My brush',ic:'fa-paintbrush',tip:'round',hard:70,size:1,sp:.15,sc:0,cnt:1,sj:0,rj:0,dir:0,op:1,oj:0,hj:0,lj:0,cm:'color',glow:0,bl:'normal'};
function cleanBrush(b){b=b&&typeof b==='object'?b:{};
 const o={n:str(b.n,40)||'Brush',ic:ICONS.includes(b.ic)?b.ic:'fa-paintbrush',tip:TIPS.some(x=>x[0]===b.tip)?b.tip:'round',hard:num(b.hard,70,0,100),size:num(b.size,1,.2,4),sp:num(b.sp,.15,.02,3),sc:num(b.sc,0,0,4),
  cnt:Math.round(num(b.cnt,1,1,10)),sj:num(b.sj,0,0,1),rj:num(b.rj,0,0,1),dir:b.dir?1:0,op:num(b.op,1,.03,1),oj:num(b.oj,0,0,1),hj:num(b.hj,0,0,180),lj:num(b.lj,0,0,1),cm:COLM.some(x=>x[0]===b.cm)?b.cm:'color',glow:num(b.glow,0,0,3),bl:b.bl==='add'?'add':'normal'};
 if(o.tip==='custom'){if(typeof b.tx==='string'&&/^[A-Za-z0-9_-]{600,700}$/.test(b.tx))o.tx=b.tx;else o.tip='round'}
 return o}
/* custom tips: 32×32 pixels, 16 levels of opacity, packed two pixels per byte */
const b64u=u8=>{let s='';for(let i=0;i<u8.length;i+=32768)s+=String.fromCharCode.apply(null,u8.subarray(i,i+32768));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
const ub64=s=>{s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u};
function tipFromCanvas(cv){const t=document.createElement('canvas');t.width=t.height=32;const x=t.getContext('2d',{willReadFrequently:true});x.drawImage(cv,0,0,32,32);const d=x.getImageData(0,0,32,32).data,u=new Uint8Array(512);
 let any=0;for(let i=0;i<1024;i++){const a=Math.round(d[i*4+3]/17);if(a)any++;u[i>>1]|=(i&1)?a:a<<4}return any?b64u(u):null}
function tipToCanvas(tx,N){const u=ub64(tx),c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d'),im=x.createImageData(32,32);
 for(let i=0;i<1024;i++){const a=((i&1)?u[i>>1]&15:u[i>>1]>>4)*17;im.data[i*4]=im.data[i*4+1]=im.data[i*4+2]=255;im.data[i*4+3]=a}x.putImageData(im,0,0);
 const o=document.createElement('canvas');o.width=o.height=N;const ox=o.getContext('2d');ox.imageSmoothingEnabled=true;ox.drawImage(c,0,0,N,N);return o}
const TIPC=new Map();
function tipCanvas(b){const k=b.tip+'|'+b.hard+'|'+(b.tx||'');if(TIPC.has(k))return TIPC.get(k);const N=64,c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d'),r=N/2;
 if(b.tip==='round'||b.tip==='soft'){const h=(b.tip==='soft'?b.hard*.35:b.hard)/100*.96,g=x.createRadialGradient(r,r,0,r,r,r);g.addColorStop(0,'#fff');g.addColorStop(h,'#fff');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,N,N)}
 else if(b.tip==='custom'&&b.tx){try{x.drawImage(tipToCanvas(b.tx,N),0,0)}catch(e){x.fillStyle='#fff';x.beginPath();x.arc(r,r,r*.8,0,TAU);x.fill()}}
 else{const bl=(1-b.hard/100)*5;if(bl>.3&&'filter' in x)x.filter=`blur(${bl}px)`;x.fillStyle=x.strokeStyle='#fff';x.translate(r,r);x.beginPath();const s=r-6-bl;
  switch(b.tip){
   case'square':x.rect(-s,-s,s*2,s*2);break;
   case'star':for(let i=0;i<10;i++){const rr=i%2?s*.42:s,a=-Math.PI/2+i*Math.PI/5;i?x.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):x.moveTo(Math.cos(a)*rr,Math.sin(a)*rr)}x.closePath();break;
   case'heart':x.moveTo(0,s*.9);x.bezierCurveTo(-s*1.5,-s*.1,-s*.6,-s*1.1,0,-s*.4);x.bezierCurveTo(s*.6,-s*1.1,s*1.5,-s*.1,0,s*.9);break;
   case'leaf':x.moveTo(0,-s);x.quadraticCurveTo(s*.85,0,0,s);x.quadraticCurveTo(-s*.85,0,0,-s);break;
   case'drop':x.moveTo(0,-s);x.bezierCurveTo(s*.2,-s*.4,s*.75,0,s*.75,s*.3);x.arc(0,s*.3,s*.75,0,Math.PI);x.bezierCurveTo(-s*.75,0,-s*.2,-s*.4,0,-s);break;
   case'line':x.rect(-s*.13,-s,s*.26,s*2);break;
   case'ring':x.lineWidth=s*.22;x.arc(0,0,s*.85,0,TAU);x.stroke();x.beginPath();break;
   case'spark':for(let i=0;i<8;i++){const rr=i%2?s*.14:s,a=-Math.PI/2+i*Math.PI/4;i?x.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):x.moveTo(Math.cos(a)*rr,Math.sin(a)*rr)}x.closePath();break}
  x.fill()}
 if(TIPC.size>60)TIPC.clear();TIPC.set(k,c);return c}
/* colors */
const rgb=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const toHex=(r,g,b)=>'#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
function hsl2hex(h,s,l){h=((h%360)+360)%360/360;const f=n=>{const k=(n+h*12)%12,a=s*Math.min(l,1-l);return l-a*Math.max(-1,Math.min(k-3,9-k,1))};return toHex(f(0)*255,f(8)*255,f(4)*255)}
function hex2hsl(h){let[r,g,b]=rgb(h).map(v=>v/255);const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;let H=0,S=0;if(mx!==mn){const d=mx-mn;S=l>.5?d/(2-mx-mn):d/(mx+mn);H=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;H*=60}return[H,S,l]}
const mix=(a,b,t)=>{const A=rgb(a),B=rgb(b);return toHex(A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t,A[2]+(B[2]-A[2])*t)};
const q8=h=>{const[r,g,b]=rgb(h);return toHex(r&~7,g&~7,b&~7)};
const TINT=new Map();
function tinted(tip,col){if(!tip.__id)tip.__id=Math.random().toString(36).slice(2);const k=tip.__id+col;let c=TINT.get(k);if(c)return c;c=document.createElement('canvas');c.width=tip.width;c.height=tip.height;const x=c.getContext('2d');x.drawImage(tip,0,0);x.globalCompositeOperation='source-in';x.fillStyle=col;x.fillRect(0,0,c.width,c.height);if(TINT.size>160)TINT.clear();TINT.set(k,c);return c}
/* one "dab" of a brush: st is the stroke state (st.hd = distance drawn so far) */
function dab(c,b,x,y,ang,w,st,col1,col2,pa){const tip=tipCanvas(b);for(let i=0;i<b.cnt;i++){const sz=w*b.size*(1-b.sj*Math.random());if(sz<.4)continue;
  const r=b.sc*w*Math.sqrt(Math.random()),g=Math.random()*TAU,px=x+(r?Math.cos(g)*r:0),py=y+(r?Math.sin(g)*r:0);
  let col=b.cm==='rainbow'?hsl2hex((st.hd||0)*.7,.92,.58):b.cm==='two'?mix(col1,col2||col1,Math.random()):b.cm==='random'?hsl2hex(Math.random()*360,.85,.6):col1;
  if(b.hj||b.lj){const[H,S,L]=hex2hsl(col);col=hsl2hex(H+(Math.random()-.5)*2*b.hj,S,Math.max(0,Math.min(1,L+(Math.random()-.5)*b.lj)))}
  col=q8(col);const rot=(b.dir?ang:0)+(b.rj?(Math.random()-.5)*TAU*b.rj:0);
  c.save();c.globalAlpha=Math.max(0,Math.min(1,pa*b.op*(1-b.oj*Math.random())));if(b.bl==='add')c.globalCompositeOperation='lighter';if(b.glow){c.shadowColor=col;c.shadowBlur=w*b.glow*.6}
  c.translate(px,py);if(rot)c.rotate(rot);c.drawImage(tinted(tip,col),-sz/2,-sz/2,sz,sz);c.restore()}}
const spacing=(b,w)=>Math.max(1,w*b.size*b.sp);
const reach=(b,w)=>w*(b.size*(1+b.sc*2)+b.glow)*1.1+8;
/* draw a whole stroke through points (used for previews and the website's try-it canvas) */
function strokeAlong(c,b,pts,w,col1,col2,st){st=st||{};for(let i=1;i<pts.length;i++){const a=pts[i-1],z=pts[i],d=Math.hypot(z.x-a.x,z.y-a.y),ang=Math.atan2(z.y-a.y,z.x-a.x),sp=spacing(b,w);
  if(st.acc==null){dab(c,b,a.x,a.y,ang,w,st,col1,col2,1);st.acc=0}let k=sp-st.acc;while(k<=d){const t=d?k/d:0;st.hd=(st.hd||0)+sp;dab(c,b,a.x+(z.x-a.x)*t,a.y+(z.y-a.y)*t,ang,w,st,col1,col2,1);k+=sp}st.acc=d-(k-sp)}return st}
function preview(cv,b,col1,col2,w){const c=cv.getContext('2d'),W=cv.width,H=cv.height;c.clearRect(0,0,W,H);w=w||Math.min(H*.32,26);const m=Math.min(W*.25,w*b.size*(1+b.sc)+6),pts=[];for(let i=0;i<=48;i++)pts.push({x:m+(W-m*2)*i/48,y:H/2+Math.sin(i/48*TAU)*H*.22});strokeAlong(c,b,pts,w,col1||'#7c8cff',col2||'#ff8fd6')}

/* ---------- whole mods ---------- */
function cleanPalette(p){return{n:str(p&&p.n,30)||'Palette',c:(Array.isArray(p&&p.c)?p.c:[]).map(hex).filter(Boolean).slice(0,24)}}
function cleanMod(m){if(!m||typeof m!=='object')throw Error('bad');
 const o={v:1,n:str(m.n,60)||'Mod',by:str(m.by,40),d:str(m.d,300),brushes:(Array.isArray(m.brushes)?m.brushes:[]).slice(0,12).map(cleanBrush),palettes:(Array.isArray(m.palettes)?m.palettes:[]).slice(0,6).map(cleanPalette).filter(p=>p.c.length),models:[]};
 if(Array.isArray(m.models))o.models=m.models.filter(s=>s&&typeof s==='object'&&Array.isArray(s.parts)).slice(0,8).map(s=>JSON.parse(JSON.stringify(s)));
 if(!o.brushes.length&&!o.palettes.length&&!o.models.length)throw Error('empty');return o}
const parts=m=>[[m.brushes.length,'brush','brushes'],[m.palettes.length,'palette','palettes'],[m.models.length,'3D model','3D models']].filter(x=>x[0]);
async function encode(mod){const j=new TextEncoder().encode(JSON.stringify(cleanMod(mod)));if(window.CompressionStream){try{const buf=await new Response(new Blob([j]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer();return'MSMOD1:'+b64u(new Uint8Array(buf))}catch(e){}}return'MSMOD0:'+b64u(j)}
async function decode(code){const m=String(code||'').replace(/\s+/g,'').match(/MSMOD([01]):([A-Za-z0-9_\-]{4,400000})/);if(!m)throw Error('nocode');let u=ub64(m[2]);
 if(m[1]==='1'){if(!window.DecompressionStream)throw Error('unsupported');u=new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer())}
 if(u.length>400000)throw Error('big');return cleanMod(JSON.parse(new TextDecoder().decode(u)))}
const findCode=s=>{const m=String(s||'').replace(/\s+/g,'').match(/MSMOD[01]:[A-Za-z0-9_\-]+/);return m?m[0]:null};
/* community mods: GitHub issues titled "[Mod] name" with a ```msmod code block */
async function community(force){const key='msm_comm_v1';try{const c=JSON.parse(localStorage.getItem(key)||'null');if(!force&&c&&Date.now()-c.at<6e5)return c.items}catch(e){}
 const r=await fetch('https://api.github.com/repos/'+REPO+'/issues?state=open&per_page=100&sort=created&direction=desc',{headers:{Accept:'application/vnd.github+json'}});if(!r.ok)throw Error('http '+r.status);
 const items=(await r.json()).filter(i=>!i.pull_request&&/^\s*\[mod\]/i.test(i.title||'')).map(i=>{const body=String(i.body||''),code=findCode(body);if(!code)return null;
  const by=(body.match(/\*\*By:\*\*\s*([^\n]{1,40})/)||[])[1],desc=(body.split(/```/)[0].replace(/\*\*(Mod|By):\*\*[^\n]*\n?/g,'').trim()).slice(0,300);
  return{id:'mod-gh'+i.number,n:str(String(i.title).replace(/^\s*\[mod\]\s*/i,''),60)||'Mod',a:str(by,40)||i.user&&i.user.login||'?',date:(i.created_at||'').slice(0,10),url:i.html_url,code,d:desc,kind:'comm'}}).filter(Boolean);
 try{localStorage.setItem(key,JSON.stringify({at:Date.now(),items}))}catch(e){}return items}
function publishUrl(name,author,desc,code){const title='[Mod] '+String(name||'Mod').slice(0,60),body=`**Mod:** ${String(name||'Mod').slice(0,60)}\n**By:** ${String(author||'anonymous').slice(0,40)}\n\n${String(desc||'').slice(0,500)}\n\n\`\`\`msmod\n${code}\n\`\`\`\n\n_Made with MasterSketch Studio · see every mod at ${SITE}mods.html_`;
 return'https://github.com/'+REPO+'/issues/new?title='+encodeURIComponent(title)+'&body='+encodeURIComponent(body)}

/* ---------- featured mods ---------- */
const FEATURED=[
 {id:'mod-nature',n:'Nature Pack',a:'MasterSketch',d:'Leaves, grass and flowers that scatter as you draw.',mod:{n:'Nature Pack',by:'MasterSketch',brushes:[
  {n:'Leaf scatter',ic:'fa-leaf',tip:'leaf',hard:90,size:1.2,sp:.55,sc:1.1,cnt:2,sj:.5,rj:1,hj:22,lj:.25,cm:'two'},
  {n:'Grass',ic:'fa-seedling',tip:'line',hard:85,size:1.6,sp:.12,sc:.35,cnt:3,sj:.55,rj:.06,hj:14,lj:.3,cm:'color'},
  {n:'Flower dots',ic:'fa-sun',tip:'spark',hard:80,size:1,sp:.9,sc:1.6,cnt:2,sj:.6,rj:1,cm:'random'}],
  palettes:[{n:'Forest',c:['#1b4332','#2d6a4f','#40916c','#52b788','#74c69d','#95d5b2','#d8f3dc','#7f5539','#b08968','#ddb892','#ffd166','#ef476f']}]}},
 {id:'mod-sparkle',n:'Sparkle Party',a:'MasterSketch',d:'Glowing sparkles, bubbles and confetti.',mod:{n:'Sparkle Party',by:'MasterSketch',brushes:[
  {n:'Sparkles',ic:'fa-wand-magic-sparkles',tip:'spark',hard:95,size:1.1,sp:.7,sc:1.6,cnt:2,sj:.7,rj:.3,glow:1.2,cm:'random',bl:'add'},
  {n:'Bubbles',ic:'fa-circle-notch',tip:'ring',hard:90,size:1.2,sp:.8,sc:1.3,cnt:1,sj:.75,op:.8,oj:.4,cm:'color'},
  {n:'Confetti',ic:'fa-shapes',tip:'square',hard:100,size:.5,sp:.5,sc:2.2,cnt:3,sj:.5,rj:1,cm:'random'}],
  palettes:[{n:'Neon',c:['#ff007f','#ff4ecd','#b14aed','#7c4dff','#2979ff','#00e5ff','#1de9b6','#76ff03','#ffea00','#ff9100','#ffffff','#0b0b1a']}]}},
 {id:'mod-ink',n:'Ink & Paper',a:'MasterSketch',d:'Dry brush, charcoal and ink splats for a hand-made look.',mod:{n:'Ink & Paper',by:'MasterSketch',brushes:[
  {n:'Dry brush',ic:'fa-brush',tip:'round',hard:100,size:.28,sp:.25,sc:.5,cnt:7,sj:.4,op:.85,oj:.5,cm:'color'},
  {n:'Charcoal',ic:'fa-splotch',tip:'square',hard:20,size:.9,sp:.12,sc:.18,cnt:3,sj:.4,rj:1,op:.22,oj:.7,lj:.15,cm:'color'},
  {n:'Ink splat',ic:'fa-droplet',tip:'drop',hard:95,size:.8,sp:1.4,sc:1.8,cnt:2,sj:.85,rj:1,cm:'color'}],
  palettes:[{n:'Sepia',c:['#2b1d14','#4a3426','#6f4e37','#8b6b4a','#a98467','#c8a97e','#e6ccb2','#f4ebdc','#1d3557','#9b2226']}]}},
 {id:'mod-weather',n:'Weather Kit',a:'MasterSketch',d:'Snow, rain and fluffy clouds.',mod:{n:'Weather Kit',by:'MasterSketch',brushes:[
  {n:'Snow',ic:'fa-snowflake',tip:'soft',hard:60,size:.45,sp:.6,sc:3,cnt:2,sj:.8,op:.9,oj:.5,cm:'color'},
  {n:'Rain',ic:'fa-droplet',tip:'line',hard:70,size:.9,sp:.7,sc:2.4,cnt:2,sj:.5,op:.55,oj:.4,cm:'color'},
  {n:'Clouds',ic:'fa-cloud',tip:'soft',hard:40,size:2.6,sp:.22,sc:.5,cnt:2,sj:.5,op:.12,cm:'color'}],
  palettes:[{n:'Sky',c:['#0d1b2a','#1b263b','#415a77','#778da9','#e0e1dd','#ffffff','#a2d2ff','#bde0fe','#ffafcc','#ffd6a5']}]}},
 {id:'mod-candy',n:'Candy Land',a:'MasterSketch',d:'Sprinkles, hearts, a rainbow ribbon and a spinning lollipop.',mod:{n:'Candy Land',by:'MasterSketch',brushes:[
  {n:'Sprinkles',ic:'fa-candy-cane',tip:'line',hard:100,size:.7,sp:.6,sc:1.5,cnt:3,sj:.3,rj:1,cm:'random'},
  {n:'Hearts',ic:'fa-heart',tip:'heart',hard:90,size:1,sp:1,sc:1.2,cnt:1,sj:.6,rj:.25,cm:'two'},
  {n:'Ribbon',ic:'fa-paintbrush',tip:'round',hard:100,size:1,sp:.05,cm:'rainbow'}],
  palettes:[{n:'Candy',c:['#ff8fab','#ffb3c6','#ffc8dd','#cdb4db','#a2d2ff','#bde0fe','#caffbf','#fdffb6','#ffd6a5','#ffadad']}],
  models:[{v:1,n:'Lollipop',parts:[{s:'cylinder',p:[0,.7,0],k:[.08,1.2,.08],m:[['#ffffff',.5,0,1,0]]},{s:'group',p:[0,1.55,0],parts:[{s:'torus',p:[0,0,0],k:[.9,.9,1.6],m:[['#ff4d8d',.3,0,1,0]]},{s:'torus',p:[0,0,0],k:[.55,.55,1.8],m:[['#ffd166',.3,0,1,0]]},{s:'sphere',p:[0,0,0],k:[.35,.35,.22],m:[['#7cdcf5',.3,0,1,0]]}],mo:{t:'spin',ax:'z',sp:1,am:1}}],mo:{t:'float',ax:'y',sp:.8,am:.6}}]}},
 {id:'mod-space',n:'Space Kit',a:'MasterSketch',d:'Stars, nebula clouds, a galaxy palette and a little UFO.',mod:{n:'Space Kit',by:'MasterSketch',brushes:[
  {n:'Star field',ic:'fa-star',tip:'star',hard:95,size:.6,sp:.9,sc:3,cnt:2,sj:.8,rj:1,glow:1,cm:'color',bl:'add'},
  {n:'Nebula',ic:'fa-cloud',tip:'soft',hard:30,size:3,sp:.18,sc:.7,cnt:2,sj:.5,op:.08,hj:60,cm:'two',bl:'add'},
  {n:'Comet',ic:'fa-moon',tip:'round',hard:40,size:1.2,sp:.08,glow:2,op:.6,cm:'color',bl:'add'}],
  palettes:[{n:'Galaxy',c:['#03045e','#10002b','#240046','#3c096c','#5a189a','#7b2cbf','#9d4edd','#c77dff','#e0aaff','#48cae4','#ffffff','#ffd60a']}],
  models:[{v:1,n:'Mini UFO',parts:[{s:'sphere',p:[0,1,0],k:[1.6,.35,1.6],m:[['#b0bec5',.25,.9,1,0]]},{s:'dome',p:[0,1.1,0],k:.75,m:[['#80deea',.05,0,.55,8]]},{s:'group',p:[0,.98,0],parts:[0,1,2,3,4,5].map(i=>({s:'sphere',p:[Math.cos(i*Math.PI/3)*.9,0,Math.sin(i*Math.PI/3)*.9],k:.12,m:[[i%2?'#ffeb3b':'#ff4081',.3,0,1,2]]})),mo:{t:'spin',ax:'y',sp:1.5,am:1}}],mo:{t:'float',ax:'y',sp:.8,am:1}}]}}];
FEATURED.forEach(f=>{f.mod=cleanMod(f.mod);f.kind='featured'});

window.MSM={REPO,SITE,TIPS,ICONS,COLM,BLEND,BDEF,FEATURED,cleanBrush,cleanMod,cleanPalette,parts,tipCanvas,tipFromCanvas,tipToCanvas,dab,spacing,reach,strokeAlong,preview,encode,decode,findCode,community,publishUrl,hsl2hex,mix};
})();

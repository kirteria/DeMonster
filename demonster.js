/*!
 * DeMonster: drawing code
 */
'use strict';
const N=100, SUPPLY=10000, PER_PAGE=12;
const off=document.createElement('canvas'); off.width=off.height=N;
let o=off.getContext('2d',{willReadFrequently:true});
const oL=o,K=4,HW=N*K;
const hi=document.createElement('canvas'); hi.width=hi.height=HW;
const oh=hi.getContext('2d',{willReadFrequently:true});
const lowID=oL.createImageData(N,N);
function downsample(){
  const src=oh.getImageData(0,0,HW,HW).data,dst=lowID.data,h=K>>1;
  for(let y=0;y<N;y++){let si=((y*K+h)*HW+h)*4,di=y*N*4;
    for(let x=0;x<N;x++){dst[di]=src[si];dst[di+1]=src[si+1];dst[di+2]=src[si+2];dst[di+3]=255;di+=4;si+=K*4;}}
  oL.putImageData(lowID,0,0);
  o=oL;
}
const wc=document.createElement('canvas'); wc.width=wc.height=N;
const wx=wc.getContext('2d');
const rc=document.createElement('canvas'); rc.width=rc.height=N;
const rcx=rc.getContext('2d');
const cc=document.createElement('canvas'); cc.width=cc.height=1;
const ccx=cc.getContext('2d',{willReadFrequently:true});
const rgbCache={};
function rgbOf(col){
  if(rgbCache[col])return rgbCache[col];
  ccx.clearRect(0,0,1,1);ccx.fillStyle=col;ccx.fillRect(0,0,1,1);
  const d=ccx.getImageData(0,0,1,1).data;
  return (rgbCache[col]=[d[0],d[1],d[2]]);
}

/* ---------- utils ---------- */
let FLASH=1;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function hash(n){const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s);}
function easeIO(q){return q<.5?2*q*q:1-Math.pow(-2*q+2,2)/2;}
function hsl(h,s,l){return 'hsl('+(((h%360)+360)%360).toFixed(0)+','+s.toFixed(0)+'%,'+l.toFixed(1)+'%)';}
function rng(seed){
  let s=(seed*2654435761+12345)>>>0;
  const f=()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296};
  for(let i=0;i<6;i++)f();
  return f;
}

/* ---------- palettes ---------- */
const CURATED=[
 ['Midnight',  '#0b1024','#1a2545','#05050a','#ffffff','#b00000','#ffd800','#7a3fd0'],
 ['Mono pink', '#000000','#6b6b6b','#000000','#ffffff','#ff2d2d','#ff7ac8','#19d3ee'],
 ['Toxic',     '#03130a','#0a3d1c','#020a05','#b6ff3c','#39ff14','#f0ff00','#ff2d95'],
 ['Blood',     '#1a0000','#450000','#0a0000','#ff6a6a','#ff0000','#ffb000','#ffffff'],
 ['Vapor',     '#1b0038','#5c1a8f','#0a0014','#ff71ce','#01cdfe','#fffb96','#b967ff'],
 ['Ice',       '#04121f','#0e3a5c','#020a12','#bff3ff','#7df9ff','#ffffff','#3a7bd5'],
 ['Gold',      '#1a1200','#4a3400','#0a0700','#ffd76a','#ff9d00','#fff3b0','#c43d00'],
 ['Candy',     '#ffe4f1','#ffb3d9','#22001a','#ffffff','#ff1493','#00e5ff','#ffe600'],
 ['Ember',     '#0f0500','#3d1500','#050200','#ff7a1a','#ff3d00','#ffe066','#ffffff'],
 ['Handheld',  '#0f380f','#306230','#071807','#9bbc0f','#8bac0f','#e0f8d0','#306230']
].map(a=>({name:a[0],bg1:a[1],bg2:a[2],body:a[3],line:a[4],eye:a[5],acc:a[6],acc2:a[7],tooth:'#f6f6f6',ghost:false}));
const SCHEMES=['Complement','Triad','Analog','Split','Tetrad'];
function makePalette(r){
  if(r()<.25)return CURATED[Math.floor(r()*CURATED.length)];
  const h=r()*360,sc=Math.floor(r()*5);
  const h2=h+[180,120,30,150,90][sc],h3=h+[30,240,-30,210,270][sc];
  const mode=r();let bg1,bg2;
  if(mode<.62){bg1=hsl(h,55,7+r()*8);bg2=hsl(h+20,60,18+r()*14);}
  else if(mode<.8){bg1=hsl(h,70,80+r()*10);bg2=hsl(h+25,75,66+r()*10);}
  else{bg1=hsl(h,75,32+r()*12);bg2=hsl(h+30,80,20+r()*10);}
  const ghost=r()<.13;
  return {name:SCHEMES[sc]+' '+Math.round(h)+'\u00b0',bg1,bg2,
    body:ghost?hsl(h3,25,92):hsl(h,45,3+r()*6),
    line:ghost?hsl(h,40,10):(r()<.5?'#ffffff':hsl(h3,95,78)),
    eye:ghost?hsl(h2,95,45):hsl(h2,100,50+r()*8),
    acc:hsl(h3,100,62),acc2:hsl(h2+40,90,58),tooth:'#f6f6f6',ghost};
}

/* ---------- trait tables ---------- */
const BGS=['Scanlines','Night sky','City','Rain','Neon grid','Void squares','Blood sun','Warp stars','Dot rain','Checker scroll','Sunburst','Ripples','Tunnel','Sine waves','Bubbles','Fire','Snow','Graveyard','Lightning','Eye wall','Cracked glass','Aurora','Mountains','Halftone pulse','Glitch bars','Argyle','Planets','Forest','Blink grid','Strobe bars','TV static','Matrix code','Hacker terminal','Binary rain','Circuit board','Radar sweep','Equalizer','Oscilloscope','Fast twinkle','Hex grid','Spiral','Kaleido fan','Confetti','Fireflies','Blood drips','Lava blobs','Data streams','Glitch tiles','Searchlights','Ocean waves','Barcode scan'];
const HORNS=['Crescent','Cone','Trident','Ear','Blocky','Droop','Bull','Zigzag','Antler','Antenna','Flame','Saw crown'];
const HLAYOUTS=[
 {n:'Single',p:[{x:50,y:43,rot:0,sc:1,c:1}]},
 {n:'Pair',p:[{x:70,y:48,rot:.3,sc:1}]},
 {n:'Triple',p:[{x:70,y:48,rot:.3,sc:.9},{x:50,y:43,rot:0,sc:1,c:1}]},
 {n:'Quad',p:[{x:73,y:53,rot:.65,sc:.85},{x:60,y:44,rot:.2,sc:.85}]},
 {n:'Crown of five',p:[{x:72,y:51,rot:.6,sc:.7},{x:62,y:44,rot:.3,sc:.85},{x:50,y:43,rot:0,sc:1,c:1}]},
 {n:'Side wings',p:[{x:76,y:58,rot:.85,sc:1.05}]},
 {n:'Big center',p:[{x:68,y:48,rot:.35,sc:.65},{x:50,y:43,rot:0,sc:1.1,c:1}]},
 {n:'Double crown',p:[{x:57,y:42,rot:.12,sc:.95}]}
];
const LAYOUTS=[
 {n:'Big cyclops',dy:0,p:[[0,0,23]]},
 {n:'Small cyclops',dy:0,p:[[0,0,12]]},
 {n:'Twin',dy:0,p:[[-16,0,11],[16,0,11]]},
 {n:'Twin big',dy:0,p:[[-19,0,15],[19,0,15]]},
 {n:'Triple',dy:0,p:[[-17,3,9],[17,3,9],[0,-11,8]]},
 {n:'Quad',dy:0,p:[[-15,-6,8],[15,-6,8],[-15,7,8],[15,7,8]]},
 {n:'Cluster',dy:0,p:[[0,0,13],[-24,-8,5],[24,-8,5],[-22,9,4],[22,9,4]]},
 {n:'Stack',dy:-2,p:[[0,-11,8],[0,0,8],[0,11,8]]},
 {n:'Spider six',dy:0,p:[[-10,3,8.5],[10,3,8.5],[-19,-1,5.5],[19,-1,5.5],[-13,-9,4],[13,-9,4]]},
 {n:'Eight eyes',dy:2,p:[[-21,-6,4],[-7,-6,4],[7,-6,4],[21,-6,4],[-21,6,4],[-7,6,4],[7,6,4],[21,6,4]]}
];
const SHAPES=['Almond','Round','Slit','Square','Diamond','Angry','Star','Happy arc','LED matrix','X eye'];
const PUPILS=['Scene','Slit','Dot','Ring','Cross','Spiral','Blank light'];
const MSH=[
 {n:'Big grin',k:'c',L:9,w:32,g:13,p:.55,sk:0,min:.5},
 {n:'Wide smile',k:'c',L:6,w:34,g:8,p:.8,sk:0,min:.35},
 {n:'Joker crescent',k:'c',L:13,w:33,g:5,p:1.4,sk:0,min:.6},
 {n:'Smirk',k:'c',L:5,w:27,g:8,p:.8,sk:5,min:.35},
 {n:'Laugh open',k:'c',L:3,w:25,g:21,p:.45,sk:0,min:.3},
 {n:'Frown',k:'c',L:-7,w:22,g:9,p:.9,sk:0,min:.3},
 {n:'Zigzag',k:'z'},{n:'Round O',k:'O'},{n:'Stitched',k:'s'},{n:'Equalizer',k:'b'}
];
const TEETH=['Bare','Blocks','Sharp','Fangs','Saw','Tongue'];
const STYLES=['Pixel','CRT','Block glitch','ASCII','Halftone','Thermal','Handheld 4-tone','Duotone','Blueprint edges','Neon outline','Comic ink','Mosaic tiles','LED wall','Chromatic split','Engraving'];
const BODYN=['Still','Sway','Nod','Jelly','Heartbeat','Stretch','Shiver','Lean wave','Swell','Top wobble'];
const EYEN=['Blink','Blink storm','Slow blink','Wide stare','Squint','Look around','Circle look','Hypnotic','Twitch','Glow pulse','Eye flash','Cross-eyed','Rage'];
const MOUTHN=['Hum','Fast laugh','Devil laugh','Chew','Silent scream','Snap','Random talk','Yawn','Tremble','Whisper'];
const FXN=['None','Glitch bursts','Rage flash','Cold sweat','Wobble','Flicker','Horn flap','Shake'];
const ANIMS=[];for(let e=0;e<EYEN.length;e++)for(let b=0;b<BODYN.length;b++)ANIMS.push(EYEN[e]+' \u00b7 '+BODYN[b]);
const RAMPS=['.:-=+*#%@','.oO0@','.,:;ilI!','/\\|-+#','01'];

function mouthName(idx){
  const sh=MSH[Math.floor(idx/6)],te=idx%6;
  return sh.k==='c'?sh.n+' \u00b7 '+TEETH[te]:sh.n+' \u00b7 tone '+(te+1);
}

function makeMonster(id){
  const r=rng(id+1),pick=n=>Math.floor(r()*n);
  const smile=r()<.45;
  const m={id,pal:makePalette(r),bg:pick(BGS.length),horn:pick(HORNS.length),
    eyeL:pick(LAYOUTS.length),eyeS:pick(SHAPES.length),pupil:pick(PUPILS.length),glow:r()<.35,
    mouth:smile?[0,1,2,4][pick(4)]*6+pick(6):pick(MSH.length*6),
    style:pick(STYLES.length),anim:pick(120),ramp:RAMPS[pick(RAMPS.length)],
    wide:.9+r()*.2,faceY:pick(5)-2,drop:r()<.4,off:r()*20,stars:[],bldg:[],rp:[]};
  for(let i=0;i<26;i++)m.stars.push({x:Math.floor(r()*N),y:Math.floor(r()*70),p:r()*6});
  for(let x=0,i=0;x<N;i++){const w=8+pick(10);m.bldg.push({x,w,h:20+pick(38)});x+=w+(r()<.3?2:0);}
  for(let i=0;i<64;i++)m.rp.push([r(),r(),r(),r()]);
  m.mouthAnim=pick(MOUTHN.length);m.fx=pick(FXN.length);m.hornL=pick(HLAYOUTS.length);
  if(r()<.1)m.anim=120+pick(10);
  return m;
}

/* ---------- animation state (body stays anchored at the bottom) ---------- */
function stateAt(m,t,ov){
  const T=t+m.off,ai=(ov!==undefined&&ov>=0)?ov:m.anim,b=ai%10,e=Math.floor(ai/10),mv=m.mouthAnim,fx=m.fx;
  const per=2.4+(m.off%1.5),ph=T%per,k=ph/.22;
  const c=T%6,a=clamp(Math.min((c-.2)/.5,(5.4-c)/.5,1),0,1);
  const burst=(Math.sin(T*13.7)*Math.sin(T*5.3)>.9)?.5:0;
  const st={T,a,dx:0,dy:0,sx:1,sy:1+.012*Math.sin(T*2),rot:0,skew:0,
    eo:k<1?1-Math.sin(k*Math.PI):1,mo:.25,px:Math.sin(T*.9)*3,py:0,
    fear:0,cross:0,glitch:.05+burst,warp:0,warpF:.2,warpS:3,tint:0,alpha:1,pv:100,pupil:-1,glow:0,hr:0};
  switch(b){
  case 1: st.skew=.07*Math.sin(T*1.6);break;
  case 2: st.rot=.05*Math.sin(T*2);break;
  case 3:{const q=T%1.8,w=Math.exp(-q*2.4)*Math.sin(q*20);st.sx=1+.1*w;st.sy=1-.1*w;st.skew=.03*w;break;}
  case 4:{const q=T%1,bb=Math.pow(Math.max(0,Math.sin(q*Math.PI*2)),6);st.sx=1+.05*bb;st.sy=1+.05*bb;break;}
  case 5: st.sy=1+.05*Math.sin(T*1.8);st.sx=1-.025*Math.sin(T*1.8);break;
  case 6: st.skew=.012*Math.sin(T*70)+.008*Math.sin(T*93);break;
  case 7: st.skew=.06*Math.sin(T*1.1);st.rot=.03*Math.sin(T*2.2);break;
  case 8: st.sx=1+.04*(.5+.5*Math.sin(T*1.2));st.sy=st.sx;break;
  case 9: st.warp=2.2;st.warpF=.09;st.warpS=2.5;break;
  }
  switch(e){
  case 1: if(a>.3){st.eo=Math.sin(T*16)>.1?1:.07;st.px=Math.sin(T*23)*4;}break;
  case 2:{const q=T%4;if(q<1.2)st.eo=.5+.5*Math.cos(q/1.2*Math.PI*2);else st.eo=1;break;}
  case 3: st.eo=1;st.fear=.25;break;
  case 4: st.eo=.45;break;
  case 5: st.px=Math.tanh(Math.sin(T*1.5)*6)*5;break;
  case 6: st.px=Math.cos(T*3)*5;st.py=Math.sin(T*3)*3;break;
  case 7: st.pupil=5;st.glow=1;st.px=Math.cos(T*4)*3;st.py=Math.sin(T*4)*2;break;
  case 8:{const h=Math.floor(T*9);st.px=(hash(h)-.5)*10;st.py=(hash(h+3)-.5)*5;break;}
  case 9: st.glow=.4+.6*(.5+.5*Math.sin(T*3));break;
  case 10:{const h=Math.floor(T*8);if(hash(h)>.6){st.glow=1;st.eo=hash(h+2)>.5?1:.15;}break;}
  case 11: st.cross=4+1.5*Math.sin(T*2);break;
  case 12:{
    st.tint=.28*a*(.6+.4*Math.sin(T*18));st.glow=Math.max(st.glow,a);
    st.eo=.55+.2*Math.sin(T*9);st.skew+=.02*Math.sin(T*55)*a;
    const pu=.05*a*Math.sin(T*20);st.sx*=1+pu;st.sy*=1+pu;st.glitch+=.3*a;break;}
  }
  switch(mv){
  case 0: st.mo=.25+.25*a*(.5+.5*Math.sin(T*8));break;
  case 1: st.mo=.25+.75*a*(.5+.5*Math.sin(T*22));break;
  case 2: st.mo=.35+.65*a*(.5+.5*Math.sin(T*7));break;
  case 3: st.mo=.4+.35*Math.sin(T*6);break;
  case 4: st.mo=.25+.75*a;break;
  case 5: st.mo=(a>.2&&Math.sin(T*5)>0)?1:.15;break;
  case 6: st.mo=a>.2?.15+.85*hash(Math.floor(T*8)):.25;break;
  case 7:{const q=(T%5)/5;st.mo=.25+.75*Math.pow(Math.sin(q*Math.PI),2);break;}
  case 8: st.mo=.3+.08*Math.sin(T*70);break;
  case 9: st.mo=.15+.1*Math.sin(T*10);break;
  }
  if(e===12)st.mo=Math.max(st.mo,a);
  switch(fx){
  case 1:{const h=Math.floor(T*10);if(hash(h)>.6)st.glitch=1;if(hash(h+7)>.8){st.warp=Math.max(st.warp,2);st.warpF=.6;}break;}
  case 2: st.tint=.25*a*(.6+.4*Math.sin(T*18));st.glow=Math.max(st.glow,a);break;
  case 3: st.fear=Math.max(st.fear,.35*a);break;
  case 4: st.warp=Math.max(st.warp,1.6);st.warpF=.12;break;
  case 5: if(a>.1&&hash(Math.floor(T*14))>.6)st.alpha=.5;break;
  case 6: st.hr=.2*Math.sin(T*4);break;
  case 7: st.skew+=.02*Math.sin(T*80);break;
  }
  st.eo=Math.max(.07,st.eo);
  return st;
}

/* ---------- drawing helpers ---------- */
function circ(x,y,r,col){o.fillStyle=col;o.beginPath();o.arc(x,y,Math.max(.1,r),0,7);o.fill();}
function grad(a,b,h){const g=o.createLinearGradient(0,0,0,h||N);g.addColorStop(0,a);g.addColorStop(1,b);o.fillStyle=g;}
function almond(cx,cy,w,H,col){
  o.fillStyle=col;o.beginPath();o.moveTo(cx-w/2,cy);
  o.quadraticCurveTo(cx,cy-H*2,cx+w/2,cy);
  o.quadraticCurveTo(cx,cy+H*2,cx-w/2,cy);o.fill();
}
function tri(x1,y1,x2,y2,x3,y3){o.beginPath();o.moveTo(x1,y1);o.lineTo(x2,y2);o.lineTo(x3,y3);o.closePath();o.fill();}

/* ---------- backgrounds (28) ---------- */
function drawBG(m,S){
  const p=m.pal,T=S.T,rp=m.rp;
  o.globalAlpha=1;o.globalCompositeOperation='source-over';
  o.fillStyle=p.bg1;o.fillRect(0,0,N,N);
  const scan=()=>{const s=Math.floor(T*3);for(let y=0;y<N;y++){o.fillStyle=((y+s)%2)?p.bg2:p.bg1;o.fillRect(0,y,N,1);}};
  const rain=al=>{o.globalAlpha=al;o.fillStyle=p.acc2;for(let i=0;i<22;i++){const q=rp[i],y=((T*(.8+q[1]*1.6)*40+q[2]*140)%(N+20))-10;o.fillRect(Math.floor(q[0]*N),y,1,3+Math.floor(q[3]*5));}o.globalAlpha=1;};
  switch(m.bg){
  case 0: scan();break;
  case 1:
    grad(p.bg1,p.bg2);o.fillRect(0,0,N,N);
    for(const s of m.stars){if(Math.sin(T*3+s.p)>-.3){o.fillStyle=p.line;o.fillRect(s.x,s.y,1,1);if(Math.sin(T*2+s.p)>.93){o.fillRect(s.x-1,s.y,3,1);o.fillRect(s.x,s.y-1,1,3);}}}
    circ(80,20,8,p.acc);circ(84,17,7,p.bg1);
    break;
  case 2:
    grad(p.bg1,p.bg2);o.fillRect(0,0,N,N);
    m.bldg.forEach((b,i)=>{
      o.fillStyle='rgba(0,0,0,.6)';o.fillRect(b.x,N-b.h,b.w,b.h);
      for(let wy=N-b.h+3;wy<N-2;wy+=4)for(let wx=b.x+2;wx<b.x+b.w-2;wx+=3){
        if(((wx*7+wy*13+i*5+Math.floor(T*1.4))%5)===0){o.fillStyle=p.acc;o.fillRect(wx,wy,1,2);}
      }
    });
    break;
  case 3: scan();rain(1);break;
  case 4:
    grad(p.bg1,p.bg2,62);o.fillRect(0,0,N,62);
    circ(50,50,22,p.acc);
    o.fillStyle=p.bg1;for(let i=0;i<6;i++){o.fillRect(20,38+i*4+i*.6,60,1+i*.5);}
    o.fillStyle=p.bg1;o.fillRect(0,62,N,38);
    o.strokeStyle=p.acc2;o.lineWidth=1;o.globalAlpha=.7;
    for(let k=0;k<8;k++){const y=62+Math.pow(((k+T*.6)%8)/8,2)*38;o.beginPath();o.moveTo(0,y);o.lineTo(N,y);o.stroke();}
    for(let i=-9;i<=9;i++){o.beginPath();o.moveTo(50+i*3,62);o.lineTo(50+i*16,N);o.stroke();}
    o.globalAlpha=1;break;
  case 5:
    grad(p.bg1,p.bg2);o.fillRect(0,0,N,N);
    o.globalAlpha=.35;o.fillStyle=p.line;
    for(let i=0;i<14;i++){const q=rp[i],s=2+Math.floor(q[2]*6),y=(((q[1]*N-T*(2+q[3]*8))%N)+N)%N;o.fillRect(q[0]*N,y,s,s);}
    o.globalAlpha=1;break;
  case 6:
    scan();circ(50,46,36,p.acc);
    o.fillStyle=p.bg1;for(let i=0;i<9;i++){o.fillRect(10,44+i*5+((T*4)%5),80,1+i*.35);}
    break;
  case 7:
    grad(p.bg1,p.bg2);o.fillRect(0,0,N,N);o.fillStyle=p.line;
    for(let i=0;i<48;i++){const q=rp[i],d=((T*(.25+q[1]*.5)+q[2])%1),r=d*d*75+2,ang=q[0]*6.283;
      o.globalAlpha=Math.min(1,d*2);o.fillRect(50+Math.cos(ang)*r,50+Math.sin(ang)*r,d>.6?2:1,d>.6?2:1);}
    o.globalAlpha=1;break;
  case 8:
    for(let i=0;i<20;i++){const q=rp[i],x=i*5+1;
      for(let j=0;j<8;j++){const y=((T*(20+30*q[1])+q[0]*100-j*4)%120)-10;
        o.globalAlpha=1-j/8;o.fillStyle=j===0?p.line:p.acc2;o.fillRect(x,y,2,2);}}
    o.globalAlpha=1;break;
  case 9:{
    const sz=10,sh=(T*8)%(sz*2);
    for(let gy=-2;gy<12;gy++)for(let gx=-2;gx<12;gx++){
      o.fillStyle=((gx+gy)%2===0)?p.bg2:p.bg1;o.fillRect(gx*sz+sh,gy*sz+sh,sz,sz);}
    break;}
  case 10:
    for(let i=0;i<18;i++){const a0=T*.3+i*Math.PI*2/18,a1=a0+Math.PI*2/18;
      o.fillStyle=(i%2)?p.bg2:p.bg1;o.beginPath();o.moveTo(50,50);
      o.lineTo(50+Math.cos(a0)*100,50+Math.sin(a0)*100);o.lineTo(50+Math.cos(a1)*100,50+Math.sin(a1)*100);o.fill();}
    break;
  case 11:
    o.lineWidth=2;
    for(let k=0;k<6;k++){const r=(T*10+k*14)%84;o.globalAlpha=1-r/84;o.strokeStyle=k%2?p.acc:p.acc2;o.beginPath();o.arc(50,50,r,0,7);o.stroke();}
    o.globalAlpha=1;break;
  case 12:
    o.lineWidth=2;
    for(let k=0;k<8;k++){const s=(T*.5+k/8)%1,size=s*s*140+4;o.globalAlpha=Math.min(1,s*3);o.strokeStyle=k%2?p.acc:p.acc2;o.strokeRect(50-size/2,50-size/2,size,size);}
    o.globalAlpha=1;break;
  case 13:
    for(let y=0;y<N;y+=6)for(let x=0;x<N;x+=2){o.fillStyle=((y/6)%2)?p.bg2:p.acc2;o.globalAlpha=.6;o.fillRect(x,y+Math.sin(x*.1+T*2+y*.2)*3,2,3);}
    o.globalAlpha=1;break;
  case 14:
    grad(p.bg1,p.bg2);o.fillRect(0,0,N,N);o.strokeStyle=p.line;o.lineWidth=1;o.globalAlpha=.55;
    for(let i=0;i<16;i++){const q=rp[i],r=2+q[0]*5,x=q[1]*N+Math.sin(T+i)*3,y=(((q[2]*130-T*(6+q[3]*10))%130)+130)%130-15;o.beginPath();o.arc(x,y,r,0,7);o.stroke();}
    o.globalAlpha=1;break;
  case 15:
    grad(p.bg1,p.bg2);o.fillRect(0,0,N,N);o.globalAlpha=.85;
    for(let i=0;i<26;i++){const x=i*4,h=(14+rp[i][0]*26)*(.65+.35*Math.sin(T*9+i*1.3));
      o.fillStyle=i%2?p.acc:p.acc2;tri(x-4,N,x+Math.sin(T*6+i)*2,N-h,x+4,N);}
    o.globalAlpha=1;break;
  case 16:
    grad(p.bg1,p.bg2);o.fillRect(0,0,N,N);o.fillStyle=p.line;
    for(let i=0;i<40;i++){const q=rp[i%64],x=q[0]*N+Math.sin(T+i)*3,y=(q[1]*110+T*(6+q[2]*10))%110-5,s=q[3]>.7?2:1;o.fillRect(x,y,s,s);}
    break;
  case 17:
    grad(p.bg1,p.bg2);o.fillRect(0,0,N,N);circ(74,22,9,p.line);
    for(let i=0;i<6;i++){const x=6+i*16,h=16+rp[i][0]*10;o.fillStyle='rgba(0,0,0,.65)';o.fillRect(x,N-h,10,h);
      o.beginPath();o.arc(x+5,N-h,5,Math.PI,0);o.fill();
      if(rp[i][1]>.5){o.fillRect(x+4,N-h-12,2,10);o.fillRect(x+1,N-h-9,8,2);}}
    o.globalAlpha=.18;o.fillStyle=p.line;for(let k=0;k<3;k++)o.fillRect(((T*4*(k+1))%140)-40,72+k*8,50,6);
    o.globalAlpha=1;break;
  case 18:{
    grad(p.bg1,p.bg2);o.fillRect(0,0,N,N);rain(.3);
    const b=Math.floor(T*3),f=T*3-b,on=hash(b)>.6&&f<.3;
    if(on){o.globalAlpha=.35*(1-f/.3);o.fillStyle=p.line;o.fillRect(0,0,N,N);o.globalAlpha=1;
      o.strokeStyle=p.line;o.lineWidth=1.5;o.beginPath();let x=20+hash(b+3)*60,y=0;o.moveTo(x,y);
      while(y<70){y+=6+hash(b+y)*6;x+=(hash(b+y*3)-.5)*16;o.lineTo(x,y);}o.stroke();}
    break;}
  case 19:
    o.globalAlpha=.65;
    for(let gy=0;gy<10;gy++)for(let gx=0;gx<11;gx++){const x=gx*9+(gy%2?4:0),y=gy*10+4,ph=hash(gx*13+gy*7),open=Math.sin(T*.9+ph*40)>-.85?1:.1;almond(x,y,7,2.2*open+.3,p.eye);}
    o.globalAlpha=1;break;
  case 20:
    grad(p.bg1,p.bg2);o.fillRect(0,0,N,N);o.strokeStyle=p.line;o.lineWidth=1;o.globalAlpha=.4;
    for(let i=0;i<10;i++){const q=rp[i],a=q[0]*6.283,L=45+q[1]*40;let x=50,y=46;o.beginPath();o.moveTo(x,y);
      for(let s=1;s<=5;s++){const aa=a+(rp[(i+s)%64][2]-.5)*.7;x+=Math.cos(aa)*L/5;y+=Math.sin(aa)*L/5;o.lineTo(x,y);}o.stroke();}
    o.globalAlpha=.15+.1*Math.sin(T*3);o.beginPath();o.arc(50,46,(T*20)%60,0,7);o.stroke();o.globalAlpha=1;break;
  case 21:
    grad(p.bg1,p.bg2);o.fillRect(0,0,N,N);
    for(let k=0;k<3;k++){o.fillStyle=k%2?p.acc:p.acc2;o.globalAlpha=.3;for(let x=0;x<N;x+=2){o.fillRect(x,18+k*12+Math.sin(x*.06+T*.8+k*2)*8,2,16);}}
    o.globalAlpha=1;o.fillStyle=p.line;for(let i=0;i<12;i++){const s=m.stars[i];o.fillRect(s.x,s.y*.6,1,1);}
    break;
  case 22:
    grad(p.bg1,p.bg2,70);o.fillRect(0,0,N,N);circ(70,40,14,p.acc);
    for(let layer=0;layer<2;layer++){o.fillStyle=layer?'rgba(0,0,0,.75)':'rgba(0,0,0,.45)';o.beginPath();o.moveTo(0,N);
      for(let x=0;x<=N;x+=2){o.lineTo(x,(layer?72:62)+Math.sin(x*.09+layer*2+1)*8+Math.sin(x*.23+layer)*4);}o.lineTo(N,N);o.fill();}
    break;
  case 23:
    grad(p.bg1,p.bg2);o.fillRect(0,0,N,N);o.fillStyle=p.acc;o.globalAlpha=.35;
    for(let gy=0;gy<11;gy++)for(let gx=0;gx<11;gx++){const x=gx*10+5,y=gy*10+5,d=Math.hypot(x-50,y-50);
      o.beginPath();o.arc(x,y,.8+2.4*(.5+.5*Math.sin(d*.15-T*3)),0,7);o.fill();}
    o.globalAlpha=1;break;
  case 24:
    for(let i=0;i<14;i++){const q=rp[i];o.globalAlpha=.55;o.fillStyle=[p.acc,p.acc2,p.bg2][i%3];
      o.fillRect(Math.sin(T*(2+q[2]*5)+i)*25,q[0]*100,N,2+q[1]*9);}
    o.globalAlpha=1;break;
  case 25:{
    const sz=16;grad(p.bg1,p.bg2);o.fillRect(0,0,N,N);
    for(let gy=0;gy<14;gy++)for(let gx=-1;gx<8;gx++){
      const cx=gx*sz+((gy%2)?sz/2:0)-(T*4)%sz,cy=gy*sz/2,r=sz/2-1;
      o.globalAlpha=(gx+gy)%3?.35:.18;o.fillStyle=(gx+gy)%3?p.bg2:p.acc2;
      o.beginPath();o.moveTo(cx,cy-r);o.lineTo(cx+r,cy);o.lineTo(cx,cy+r);o.lineTo(cx-r,cy);o.fill();}
    o.globalAlpha=1;break;}
  case 26:
    grad(p.bg1,p.bg2);o.fillRect(0,0,N,N);o.fillStyle=p.line;
    for(const s of m.stars){if(Math.sin(T*2+s.p)>-.5)o.fillRect(s.x,s.y,1,1);}
    circ(24,72,20,p.acc2);o.globalAlpha=.35;circ(19,67,15,p.line);o.globalAlpha=.8;
    o.strokeStyle=p.line;o.lineWidth=2;o.beginPath();o.ellipse(24,72,32,7,-.3,0,7);o.stroke();o.globalAlpha=1;
    circ(78,28,5,p.line);break;
  case 27:
    grad(p.bg1,p.bg2);o.fillRect(0,0,N,N);circ(78,20,8,p.line);
    for(let i=0;i<9;i++){const x=i*13-2+(rp[i][0]-.5)*4,h=26+rp[i][1]*24;o.fillStyle='rgba(0,0,0,.7)';
      for(let t=0;t<3;t++){const by=N-t*h*.3,ty=by-h*.5,hw=10-t*2;tri(x-hw,by,x,ty,x+hw,by);}}
    o.globalAlpha=.15;o.fillStyle=p.line;o.fillRect(((T*3)%140)-40,74,60,6);o.fillRect(100-((T*2)%140)+20,84,50,6);o.globalAlpha=1;
    break;
  default: drawBG2(m,S);
  }
  o.globalAlpha=1;
}

/* ---------- extra backgrounds (23 more) ---------- */
function glyph(x,y,bits,col){o.fillStyle=col;for(let i=0;i<15;i++)if((bits>>i)&1)o.fillRect(x+(i%3),y+((i/3)|0),1,1);}
const B0=[1,1,1,1,0,1,1,0,1,1,0,1,1,1,1].reduce((a,v,i)=>a|(v<<i),0);
const B1=[0,1,0,1,1,0,0,1,0,0,1,0,1,1,1].reduce((a,v,i)=>a|(v<<i),0);
function drawBG2(m,S){
  const p=m.pal,T=S.T,rp=m.rp,fl=FLASH,k=m.bg-28;
  o.globalAlpha=1;
  const dark=al=>{o.fillStyle='#000';o.globalAlpha=al;o.fillRect(0,0,N,N);o.globalAlpha=1;};
  switch(k){
  case 0:{
    grad(p.bg1,p.bg2);o.fillRect(0,0,N,N);
    const f=Math.floor(T*14*fl);
    for(let gy=0;gy<10;gy++)for(let gx=0;gx<10;gx++){if(hash(gx*7+gy*13+f*3.1)>.72){o.globalAlpha=.55;o.fillStyle=(gx+gy)%2?p.acc:p.acc2;o.fillRect(gx*10,gy*10,10,10);}}
    o.globalAlpha=1;break;}
  case 1:{
    const f=Math.floor(T*12*fl);
    for(let i=0;i<10;i++){o.fillStyle=(((f+i)%2)===0)?p.bg2:p.bg1;o.fillRect(i*10,0,10,N);}
    o.globalAlpha=.4;o.fillStyle=p.acc;for(let i=0;i<10;i++){if(((f+i)%2)===1)o.fillRect(i*10+3,0,4,N);}
    o.globalAlpha=1;break;}
  case 2:
    grad(p.bg1,p.bg2);o.fillRect(0,0,N,N);o.fillStyle=p.line;o.globalAlpha=.25;
    for(let i=0;i<420;i++)o.fillRect(Math.random()*N,Math.random()*N,2,1);
    o.globalAlpha=1;break;
  case 3:
    dark(.6);
    for(let i=0;i<20;i++){const q=rp[i],sp=14+q[1]*22,head=Math.floor(((T*sp+q[0]*140)%140)/5)-3;
      for(let j=0;j<8;j++){const row=head-j;if(row<0||row>19)continue;
        const bits=Math.floor(hash(i*31+row*17+Math.floor(T*(j?2:6)*fl))*32768);
        o.globalAlpha=j===0?1:Math.max(.12,1-j/8);glyph(i*5+1,row*5,bits,j===0?p.line:p.acc2);}}
    o.globalAlpha=1;break;
  case 4:{
    dark(.55);const sc=(T*8)%5,base=Math.floor(T*8/5);
    for(let r=-1;r<21;r++){const row=r+base,y=r*5-sc;let x=3+Math.floor(hash(row*3)*3)*3;const n=2+Math.floor(hash(row)*5);
      for(let w=0;w<n;w++){const wl=3+Math.floor(hash(row*7+w)*12);o.globalAlpha=.75;o.fillStyle=hash(row*11+w)>.85?p.acc:p.acc2;o.fillRect(x,y,wl,2);x+=wl+2;if(x>N)break;}}
    o.globalAlpha=1;if(Math.floor(T*4*fl)%2===0){o.fillStyle=p.line;o.fillRect(3,93,4,4);}
    break;}
  case 5:
    dark(.65);
    for(let i=0;i<20;i++){const q=rp[i],sp=10+q[1]*20,head=Math.floor(((T*sp+q[0]*140)%140)/5)-3;
      for(let j=0;j<8;j++){const row=head-j;if(row<0||row>19)continue;
        const one=hash(i*13+row*7+Math.floor(T*2*fl))>.5;
        o.globalAlpha=j===0?1:Math.max(.12,1-j/8);glyph(i*5+1,row*5,one?B1:B0,j===0?p.line:p.acc);}}
    o.globalAlpha=1;break;
  case 6:{
    dark(.45);o.lineWidth=1;
    for(let i=0;i<14;i++){const q=rp[i];let x=Math.floor(q[0]*20)*5+.5,y=Math.floor(q[1]*20)*5+.5;const pts=[[x,y]];let tot=0;
      for(let s=0;s<4;s++){const r2=rp[(i+s+3)%64],l=(3+Math.floor(r2[2]*8))*5*(r2[3]>.5?1:-1);
        if(s%2===0)x+=l;else y+=l;tot+=Math.abs(l);pts.push([x,y]);}
      o.globalAlpha=.5;o.strokeStyle=p.acc2;o.beginPath();pts.forEach((pt,j)=>j?o.lineTo(pt[0],pt[1]):o.moveTo(pt[0],pt[1]));o.stroke();
      o.globalAlpha=1;o.fillStyle=p.acc2;o.fillRect(pts[4][0]-1.5,pts[4][1]-1.5,3,3);
      let d=((T*.25+q[2])%1)*tot;
      for(let s=0;s<4;s++){const a=pts[s],b=pts[s+1],len=Math.abs(b[0]-a[0])+Math.abs(b[1]-a[1]);
        if(d<=len){const u=d/len;o.fillStyle=p.line;o.fillRect(a[0]+(b[0]-a[0])*u-1,a[1]+(b[1]-a[1])*u-1,3,3);break;}d-=len;}}
    break;}
  case 7:{
    dark(.5);o.globalAlpha=.5;o.strokeStyle=p.acc2;o.lineWidth=1;
    [15,30,45].forEach(r=>{o.beginPath();o.arc(50,50,r,0,7);o.stroke();});
    o.beginPath();o.moveTo(0,50);o.lineTo(N,50);o.moveTo(50,0);o.lineTo(50,N);o.stroke();
    const ang=T*1.5;o.lineWidth=2;o.strokeStyle=p.acc;
    for(let q=0;q<14;q++){o.globalAlpha=.4*(1-q/14);const a=ang-q*.06;o.beginPath();o.moveTo(50,50);o.lineTo(50+Math.cos(a)*70,50+Math.sin(a)*70);o.stroke();}
    for(let i=0;i<6;i++){const q=rp[i],ba=q[0]*6.283,br=8+q[1]*38,d=(((ang-ba)%6.283)+6.283)%6.283,al=Math.max(0,1-d/2.5);
      if(al>.02){o.globalAlpha=al;o.fillStyle=p.line;o.fillRect(50+Math.cos(ba)*br-1,50+Math.sin(ba)*br-1,3,3);}}
    o.globalAlpha=1;break;}
  case 8:
    grad(p.bg1,p.bg2);o.fillRect(0,0,N,N);
    for(let i=0;i<20;i++){const h=8+44*Math.abs(Math.sin(T*(2+rp[i][0]*3)+i*.7)),x=i*5;
      o.globalAlpha=.7;o.fillStyle=p.acc;o.fillRect(x+1,N-h,3,h);o.fillStyle=p.acc2;o.fillRect(x+1,N-h,3,2);}
    o.globalAlpha=1;break;
  case 9:{
    dark(.55);o.strokeStyle=p.acc2;o.lineWidth=1;o.globalAlpha=.18;
    for(let g=0;g<=N;g+=10){o.beginPath();o.moveTo(g,0);o.lineTo(g,N);o.moveTo(0,g);o.lineTo(N,g);o.stroke();}
    o.strokeStyle=p.acc;o.lineWidth=1.5;
    for(let pass=0;pass<2;pass++){o.globalAlpha=pass?1:.3;o.lineWidth=pass?1.2:3.5;o.beginPath();
      for(let x=0;x<=N;x+=2){const y=50+Math.sin(x*.15+T*6)*12*Math.sin(T*1.3)+(hash(x*3+Math.floor(T*20))-.5)*4;x?o.lineTo(x,y):o.moveTo(x,y);}o.stroke();}
    o.globalAlpha=1;break;}
  case 10:{
    grad(p.bg1,p.bg2);o.fillRect(0,0,N,N);o.fillStyle=p.line;
    for(let i=0;i<70;i++){const q=rp[i%64];
      if(hash(i*3+Math.floor(T*10*fl+q[2]*7))>.5)o.fillRect((q[0]*N+i*13.7)%N,(q[1]*N+i*7.3)%N,1+(i%5===0?1:0),1+(i%5===0?1:0));}
    break;}
  case 11:{
    grad(p.bg1,p.bg2);o.fillRect(0,0,N,N);
    const R=8,hw=R*Math.sqrt(3);o.lineWidth=1;o.strokeStyle=p.acc;
    for(let row=-1;row<15;row++)for(let col=-1;col<9;col++){
      const cx=col*hw+(row%2?hw/2:0),cy=row*R*1.5,d=Math.hypot(cx-50,cy-50);
      o.globalAlpha=.12+.5*Math.max(0,Math.sin(d*.12-T*3));o.beginPath();
      for(let s=0;s<6;s++){const ag=Math.PI/3*s+Math.PI/6,X=cx+Math.cos(ag)*R,Y=cy+Math.sin(ag)*R;s?o.lineTo(X,Y):o.moveTo(X,Y);}
      o.closePath();o.stroke();}
    o.globalAlpha=1;break;}
  case 12:
    o.lineWidth=5;o.lineCap='round';
    for(let arm=0;arm<2;arm++){o.strokeStyle=arm?p.acc:p.bg2;o.globalAlpha=arm?.35:1;o.beginPath();
      for(let a=0;a<42;a+=.3){const r=a*2.2,ag=a+T*1.2+arm*Math.PI,X=50+Math.cos(ag)*r,Y=50+Math.sin(ag)*r;a?o.lineTo(X,Y):o.moveTo(X,Y);}o.stroke();}
    o.globalAlpha=1;break;
  case 13:
    grad(p.bg1,p.bg2);o.fillRect(0,0,N,N);
    for(let i=0;i<12;i++){const ang=T*.4*(i%2?1:-1)+i*.52;o.globalAlpha=.25;o.fillStyle=[p.acc,p.acc2,p.bg2][i%3];
      o.beginPath();o.moveTo(50,50);o.lineTo(50+Math.cos(ang)*80,50+Math.sin(ang)*80);o.lineTo(50+Math.cos(ang+.26)*80,50+Math.sin(ang+.26)*80);o.fill();}
    o.globalAlpha=1;break;
  case 14:
    grad(p.bg1,p.bg2);o.fillRect(0,0,N,N);
    for(let i=0;i<40;i++){const q=rp[i%64];o.fillStyle=[p.acc,p.acc2,p.line,p.bg2][i%4];
      o.fillRect(q[0]*N+Math.sin(T*2+i)*4,((q[1]*120+T*(20+q[2]*30))%120)-10,1+Math.abs(Math.sin(T*8+i))*2,2);}
    break;
  case 15:
    grad(p.bg1,p.bg2);o.fillRect(0,0,N,N);
    for(let i=0;i<24;i++){const q=rp[i],x=q[0]*N+Math.sin(T*.7+i)*8,y=q[1]*N+Math.cos(T*.9+i*2)*8,a=.3+.7*(.5+.5*Math.sin(T*(2+q[2]*3)+i));
      o.globalAlpha=.12*a;circ(x,y,4,p.acc);o.globalAlpha=a;circ(x,y,1,p.line);}
    o.globalAlpha=1;break;
  case 16:
    grad(p.bg1,p.bg2);o.fillRect(0,0,N,N);o.fillStyle=p.acc;o.globalAlpha=.9;o.fillRect(0,0,N,3);
    for(let i=0;i<12;i++){const q=rp[i],x=Math.floor(q[0]*N),len=(T*(6+q[1]*8)+q[2]*80)%90;o.fillRect(x,0,3,len);circ(x+1.5,len,2.5,p.acc);}
    o.globalAlpha=1;break;
  case 17:
    grad(p.bg1,p.bg2);o.fillRect(0,0,N,N);
    for(let i=0;i<6;i++){const q=rp[i];o.globalAlpha=.35;circ(50+Math.sin(T*.5+i*2)*30,50+Math.sin(T*.3*(1+q[0])+i)*40,10+q[1]*10,i%2?p.acc:p.acc2);}
    o.globalAlpha=1;break;
  case 18:
    dark(.4);
    for(let i=0;i<14;i++){const q=rp[i],sp=(10+q[1]*40)*(i%2?1:-1),x0=((((T*sp+q[0]*100)%140)+140)%140)-20;
      o.globalAlpha=.6;o.fillStyle=i%3?p.acc2:p.acc;o.fillRect(x0,i*7+3,8+q[2]*14,1);o.fillRect(x0+35,i*7+3,5,1);o.fillRect(x0-30,i*7+3,10,1);}
    o.globalAlpha=1;break;
  case 19:{
    grad(p.bg1,p.bg2);o.fillRect(0,0,N,N);const f=Math.floor(T*10*fl);
    for(let i=0;i<14;i++){const h=hash(f*7+i);o.globalAlpha=.5;o.fillStyle=[p.acc,p.acc2,p.line,p.bg2][i%4];
      o.fillRect(hash(f+i*3)*N,hash(f*2+i*5)*N,8+h*30,2+hash(i+f)*8);}
    o.globalAlpha=1;break;}
  case 20:
    grad(p.bg1,p.bg2);o.fillRect(0,0,N,N);
    m.bldg.forEach(b=>{o.fillStyle='rgba(0,0,0,.6)';o.fillRect(b.x,N-b.h*.7,b.w,b.h*.7);});
    o.fillStyle=p.line;o.globalAlpha=.2;
    [18,50,82].forEach((x0,i)=>{const ang=-Math.PI/2+Math.sin(T*.8+i*2)*.6;o.beginPath();o.moveTo(x0,N);
      o.lineTo(x0+Math.cos(ang-.09)*130,N+Math.sin(ang-.09)*130);o.lineTo(x0+Math.cos(ang+.09)*130,N+Math.sin(ang+.09)*130);o.fill();});
    o.globalAlpha=1;break;
  case 21:
    grad(p.bg1,p.bg2,70);o.fillRect(0,0,N,N);circ(75,22,9,p.line);
    for(let l=0;l<4;l++){o.fillStyle=l%2?p.bg1:p.bg2;o.globalAlpha=.85;o.beginPath();o.moveTo(0,N);
      for(let x=0;x<=N;x+=2)o.lineTo(x,60+l*9+Math.sin(x*.08+T*(1+l*.4)+l)*3);o.lineTo(N,N);o.fill();}
    o.globalAlpha=1;break;
  case 22:{
    o.fillStyle=p.bg1;o.fillRect(0,0,N,N);o.fillStyle=p.line;o.globalAlpha=.25;const off2=Math.floor(T*15);
    for(let x=0;x<N;x++){if(hash(Math.floor((x+off2)/2)*3.3)>.5)o.fillRect(x,0,1,N);}
    o.globalAlpha=.8;o.fillStyle=p.acc;o.fillRect((T*30)%N,0,2,N);o.globalAlpha=1;break;}
  }
  o.globalAlpha=1;
}

/* ---------- body ---------- */
function poly(pts){pts.forEach((q,i)=>i?o.lineTo(q[0],q[1]):o.moveTo(q[0],q[1]));}
function hornShape(k){
  o.beginPath();
  switch(k){
  case 0:o.moveTo(8,0);o.bezierCurveTo(16,-10,12,-24,2,-34);o.bezierCurveTo(6,-22,0,-12,-8,-6);break;
  case 1:poly([[9,0],[6,-34],[-9,0]]);break;
  case 2:poly([[-9,0],[-9,-16],[-12,-30],[-5,-20],[0,-36],[5,-20],[12,-30],[9,-16],[9,0]]);break;
  case 3:poly([[-10,0],[0,-30],[10,0]]);break;
  case 4:poly([[-8,0],[-8,-12],[-2,-12],[-2,-22],[4,-22],[4,-34],[10,-34],[10,0]]);break;
  case 5:o.moveTo(-8,0);o.bezierCurveTo(-8,-14,4,-24,18,-20);o.bezierCurveTo(10,-20,8,-10,8,0);break;
  case 6:o.moveTo(-6,0);o.bezierCurveTo(-6,-12,4,-22,20,-30);o.bezierCurveTo(6,-20,2,-10,6,0);break;
  case 7:poly([[-8,0],[-2,-12],[-9,-14],[2,-26],[-4,-28],[6,-40],[4,-24],[10,-22],[3,-10],[9,0]]);break;
  case 8:poly([[-5,0],[-4,-22],[-12,-28],[-10,-32],[-3,-27],[-2,-38],[2,-38],[3,-27],[10,-32],[12,-28],[4,-22],[5,0]]);break;
  case 9:poly([[-2,0],[-2,-27],[-5,-29],[-5,-34],[-2,-37],[2,-37],[5,-34],[5,-29],[2,-27],[2,0]]);break;
  case 10:o.moveTo(-8,0);o.bezierCurveTo(-12,-12,-4,-16,-6,-26);o.bezierCurveTo(-2,-22,0,-30,-1,-38);o.bezierCurveTo(4,-28,10,-22,6,-14);o.bezierCurveTo(12,-10,10,-4,8,0);break;
  default:poly([[-8,0],[-7,-14],[-11,-18],[-6,-22],[-10,-28],[-4,-30],[0,-38],[4,-30],[10,-28],[6,-22],[11,-18],[7,-14],[8,0]]);
  }
  o.closePath();
}
function bodyPath(){
  o.beginPath();o.moveTo(12,N+6);o.lineTo(17,66);o.quadraticCurveTo(21,50,32,45);
  o.quadraticCurveTo(50,38,68,45);o.quadraticCurveTo(79,50,83,66);o.lineTo(88,N+6);o.closePath();
}
function drawSilhouette(m,S){
  const p=m.pal,hr=S?S.hr:0,L=HLAYOUTS[m.hornL];
  const place=(pl,flip,mode)=>{
    o.save();if(flip){o.translate(100,0);o.scale(-1,1);}
    o.translate(pl.x,pl.y);o.rotate(pl.rot+(pl.c?hr*.3:hr));o.scale(pl.sc,pl.sc);o.lineWidth=4/pl.sc;
    hornShape(m.horn);mode();o.restore();
  };
  const all=mode=>{bodyPath();mode();for(const pl of L.p){place(pl,false,mode);if(!pl.c)place(pl,true,mode);}};
  o.lineJoin='round';o.lineCap='round';
  o.strokeStyle=p.line;o.lineWidth=4;all(()=>o.stroke());
  o.fillStyle=p.body;all(()=>o.fill());
}
function applyT(g){
  o.translate(50+g.dx,g.pv+g.dy);o.rotate(g.rot);o.transform(1,0,g.skew,1,0,0);o.scale(g.sx,g.sy);o.translate(-50,-g.pv);
}

/* ---------- eyes (100 designs x 7 pupils) ---------- */
function drawPupil(m,S,x,y,s,hh,pupil,cs){
  const p=m.pal,f=S.fear,eo=S.eo;
  if(hh<1.8||pupil===6)return;
  const px=x+(S.px-cs*S.cross)*(s/14),py=y+S.py*(s/14),ps=Math.max(1,Math.min(s*.35,hh*.8)*(1-.4*f));
  if(pupil===0){
    if(s>=12&&hh>3.5&&eo>.6&&f<.5){
      o.fillStyle='#04040a';o.beginPath();o.ellipse(px,y,Math.max(1,11*(1-.35*f)*(s/23+.4)),Math.max(.8,hh*.82),0,0,7);o.fill();
      circ(px-5,y-2,2.4,p.line);circ(px+5,y-1.5,2.8,p.acc);
      o.fillStyle=p.acc2;o.fillRect(px-3,y+1,6,Math.max(1,hh*.55));o.fillRect(px-4,y,1,2);o.fillRect(px+3,y,1,2);
      return;
    }
    circ(px,py,ps,'#000');circ(px-ps*.3,py-ps*.3,Math.max(.5,ps*.25),p.line);return;
  }
  o.fillStyle='#000';o.strokeStyle='#000';
  if(pupil===1){o.beginPath();o.ellipse(px,y,Math.max(.7,ps*.28),Math.max(.8,hh*.9),0,0,7);o.fill();}
  else if(pupil===2){circ(px,py,ps,'#000');circ(px-ps*.3,py-ps*.3,Math.max(.5,ps*.25),p.line);}
  else if(pupil===3){o.lineWidth=1.2;o.beginPath();o.arc(px,py,ps,0,7);o.stroke();circ(px,py,Math.max(.5,ps*.3),'#000');}
  else if(pupil===4){o.fillRect(px-ps,py-.6,ps*2,1.3);o.fillRect(px-.6,py-ps,1.3,ps*2);}
  else if(pupil===5){o.lineWidth=1;o.beginPath();for(let i=0;i<40;i++){const r=i*.05*ps*1.6,a=i*.55+S.T*6;const X=px+Math.cos(a)*r,Y=py+Math.sin(a)*r*.8;i?o.lineTo(X,Y):o.moveTo(X,Y);}o.stroke();}
}
function eyeOne(m,S,x,y,s,shape,pupil,side,cs){
  const p=m.pal,f=S.fear,eo=S.eo;
  const hh=Math.max(.6,s*.45*(1+.3*f)*eo);
  switch(shape){
  case 0:almond(x,y,s*2,hh,p.eye);break;
  case 1:o.fillStyle=p.eye;o.beginPath();o.ellipse(x,y,s*.8,Math.max(.6,s*.8*(1+.15*f)*eo),0,0,7);o.fill();break;
  case 2:almond(x,y,s*2,hh*.55,p.eye);break;
  case 3:o.fillStyle=p.eye;o.fillRect(x-s*.8,y-hh*1.3,s*1.6,hh*2.6);break;
  case 4:o.fillStyle=p.eye;o.beginPath();o.moveTo(x-s,y);o.lineTo(x,y-hh*1.6);o.lineTo(x+s,y);o.lineTo(x,y+hh*1.6);o.closePath();o.fill();break;
  case 5:
    almond(x,y,s*2,hh,p.eye);o.fillStyle=p.body;o.beginPath();
    if(side<0){o.moveTo(x-s-1,y-hh*.9);o.lineTo(x+s+1,y+hh*.2);o.lineTo(x+s+1,y-hh*2-2);o.lineTo(x-s-1,y-hh*2-2);}
    else{o.moveTo(x+s+1,y-hh*.9);o.lineTo(x-s-1,y+hh*.2);o.lineTo(x-s-1,y-hh*2-2);o.lineTo(x+s+1,y-hh*2-2);}
    o.closePath();o.fill();break;
  case 6:{
    o.fillStyle=p.eye;o.beginPath();
    for(let i=0;i<16;i++){const r=(i%2?.38:1)*s*.9,a=i*Math.PI/8-Math.PI/2;
      const X=x+Math.cos(a)*r,Y=y+Math.sin(a)*r*Math.max(.15,eo)*(1+.2*f);i?o.lineTo(X,Y):o.moveTo(X,Y);}
    o.closePath();o.fill();break;}
  case 7:
    o.strokeStyle=p.eye;o.lineWidth=Math.max(1.5,s*.28);o.lineCap='round';
    o.beginPath();o.arc(x,y+s*.35,s*.75,Math.PI*1.12,Math.PI*1.88);o.stroke();return;
  case 8:{
    const rows=1+Math.round(3*eo);o.fillStyle=p.eye;
    for(let xx=x-s*.9;xx<=x+s*.9;xx+=2)for(let j=0;j<rows;j++){
      const jit=f>.4?Math.round((Math.random()-.5)*3):0;o.fillRect(xx,y-rows+j*2+jit,1,1);}
    return;}
  case 9:{
    const z=Math.max(1,s*.45*(eo>.3?1:.25)*(1+.4*f));
    o.strokeStyle=p.eye;o.lineWidth=Math.max(1.5,s*.2);o.lineCap='round';
    o.beginPath();o.moveTo(x-z,y-z);o.lineTo(x+z,y+z);o.moveTo(x+z,y-z);o.lineTo(x-z,y+z);o.stroke();return;}
  }
  if(shape<=5)drawPupil(m,S,x,y,s,hh,pupil,cs);
}
function drawEyes(m,S,ey){
  const L=LAYOUTS[m.eyeL],pupil=S.pupil>=0?S.pupil:m.pupil,cx=50,y0=ey+L.dy;
  if(m.glow||S.glow>0){
    const pulse=1+.1*Math.sin(S.T*3),k=Math.max(m.glow?.9:0,S.glow);
    for(const q of L.p){for(let j=3;j>=1;j--){o.globalAlpha=.09*k;circ(cx+q[0],y0+q[1],q[2]*(1+j*.32)*pulse,m.pal.eye);}}
    o.globalAlpha=1;
  }
  for(const q of L.p)eyeOne(m,S,cx+q[0],y0+q[1],q[2],m.eyeS,pupil,q[0]<-1?-1:1,q[0]<-1?-1:(q[0]>1?1:0));
}

/* ---------- mouths (60) ---------- */
function drawMouth(m,S,my){
  const p=m.pal,mo=clamp(S.mo,0,1),T=S.T,cx=50;
  const sh=MSH[Math.floor(m.mouth/6)],te=m.mouth%6;
  const tc=[p.eye,p.acc,p.acc2,p.line,p.eye,p.acc][te];
  if(sh.k==='O'){
    const ry=3+9*mo,rx=4+5*mo;
    o.fillStyle=tc;o.beginPath();o.ellipse(cx,my,rx+1.5,ry+1.5,0,0,7);o.fill();
    o.fillStyle='#000';o.beginPath();o.ellipse(cx,my,rx,ry,0,0,7);o.fill();return;
  }
  if(sh.k==='s'){
    const gap=1+mo*7,ya=my-gap/2,yb=my+gap/2;
    if(gap>3){o.fillStyle=tc;o.fillRect(28,ya,44,gap);}
    o.fillStyle=p.line;o.fillRect(28,ya,44,1);o.fillRect(28,yb,44,1);
    for(let x=30;x<70;x+=5)o.fillRect(x,ya-2,1,gap+5);return;
  }
  if(sh.k==='b'){
    o.fillStyle=tc;
    for(let i=0;i<13;i++){const h=2+(.3+mo)*11*Math.abs(Math.sin(T*8+i*1.7+m.off));o.fillRect(25+i*4,my-h/2,3,h);}
    return;
  }
  if(sh.k==='z'){
    o.strokeStyle=tc;o.lineWidth=2;o.lineJoin='miter';o.beginPath();
    for(let i=0;i<=14;i++){const x=cx-28+i*4,y=my+(i%2?-1:1)*(1.5+5*mo);i?o.lineTo(x,y):o.moveTo(x,y);}
    o.stroke();return;
  }
  const W=sh.w,L=sh.L,g=sh.g*(sh.min+(1-sh.min)*mo),n=30;
  const yuAt=u=>my-L*u*u+sh.sk*u,gapAt=u=>g*Math.pow(Math.max(0,1-u*u),sh.p);
  o.fillStyle=p.eye;o.beginPath();
  for(let i=0;i<n;i++){const u=-1+2*i/(n-1);i?o.lineTo(cx+u*W,yuAt(u)):o.moveTo(cx+u*W,yuAt(u));}
  for(let i=n-1;i>=0;i--){const u=-1+2*i/(n-1);o.lineTo(cx+u*W,yuAt(u)+gapAt(u));}
  o.closePath();o.fill();
  o.fillStyle=p.tooth;
  if(te===1){
    const nt=9;
    for(let j=0;j<nt;j++){const u=-.86+1.72*j/(nt-1),x=cx+u*W,wd=W*1.72/nt-.5,gp=gapAt(u),tl=Math.min(4.5,gp/2);
      if(tl<.8)continue;o.fillRect(x-wd/2,yuAt(u),wd,tl);o.fillRect(x-wd/2,yuAt(u)+gp-tl,wd,tl);}
  }else if(te===2){
    const nt=10;
    for(let j=0;j<nt;j++){const u=-.86+1.72*j/(nt-1),x=cx+u*W,wd=W*1.72/nt,gp=gapAt(u),tl=Math.min(5,gp/2);
      if(tl<.8)continue;const yt=yuAt(u);tri(x-wd/2,yt,x+wd/2,yt,x,yt+tl*1.2);const yb=yt+gp;tri(x-wd/2,yb,x+wd/2,yb,x,yb-tl*.9);}
  }else if(te===3){
    for(const u of[-.45,.45]){const x=cx+u*W,gp=gapAt(u),yt=yuAt(u),tl=Math.min(gp*.9,9);
      if(tl<.8)continue;tri(x-2.4,yt,x+2.4,yt,x,yt+tl);tri(x-1.8,yt+gp,x+1.8,yt+gp,x,yt+gp-Math.min(gp*.4,3));}
  }else if(te===4){
    const nt=14;
    for(let j=0;j<nt;j++){const u=-.9+1.8*j/(nt-1),x=cx+u*W,wd=W*1.8/nt*1.05,gp=gapAt(u),tl=Math.min(3.5,gp/2);
      if(tl<.8)continue;const yt=yuAt(u);tri(x-wd/2,yt,x+wd/2,yt,x,yt+tl);const yb=yt+gp,xo=x+wd/2;tri(xo-wd/2,yb,xo+wd/2,yb,xo,yb-tl);}
  }else if(te===5){
    const gp=gapAt(0);if(gp>2){o.fillStyle=p.acc;o.beginPath();o.ellipse(cx+sh.sk*.4,yuAt(0)+gp*.72,W*.3,gp*.3,0,0,7);o.fill();}
  }
  o.strokeStyle=p.line;o.lineWidth=1;o.lineJoin='round';
  o.beginPath();for(let i=0;i<n;i++){const u=-1+2*i/(n-1);i?o.lineTo(cx+u*W,yuAt(u)):o.moveTo(cx+u*W,yuAt(u));}o.stroke();
  o.beginPath();for(let i=0;i<n;i++){const u=-1+2*i/(n-1);const y=yuAt(u)+gapAt(u);i?o.lineTo(cx+u*W,y):o.moveTo(cx+u*W,y);}o.stroke();
}

function drawDrop(m,S){
  if(!(m.drop||S.fear>.1))return;
  const p=m.pal,y=60+(S.fear>.1?(S.T*22)%22:0);
  o.beginPath();o.moveTo(80,y-5);o.quadraticCurveTo(85,y+1,80,y+3);o.quadraticCurveTo(75,y+1,80,y-5);
  if(S.fear>.1){o.fillStyle=p.acc2;o.fill();}
  o.strokeStyle=p.line;o.lineWidth=1;o.globalAlpha=.8;o.stroke();o.globalAlpha=1;
}

function drawMonster(m,S){
  o=oh;o.setTransform(K,0,0,K,0,0);o.globalAlpha=1;o.globalCompositeOperation='source-over';
  drawBG(m,S);
  o.save();o.globalAlpha=S.alpha;
  applyT(S);
  drawSilhouette(m,S);
  o.save();o.translate(50,0);o.scale(m.wide,1);o.translate(-50,0);
  drawEyes(m,S,56+m.faceY);
  drawMouth(m,S,85);
  o.restore();
  drawDrop(m,S);
  o.restore();
  o.globalAlpha=1;
  downsample();
  if(S.tint>0){o.globalAlpha=S.tint;o.fillStyle='#ff0000';o.fillRect(0,0,N,N);o.globalAlpha=1;}
  if(S.warp>0){
    wx.clearRect(0,0,N,N);wx.drawImage(off,0,0);
    for(let y=0;y<N;y++)o.drawImage(wc,0,y,N,1,Math.round(Math.sin(y*S.warpF+S.T*S.warpS)*S.warp*(1-y/N)),y,N,1);
  }
}

/* ---------- render styles (15) ---------- */
const tmps={};
function tmpFor(S){if(!tmps[S]){const c=document.createElement('canvas');c.width=c.height=S;tmps[S]=c;}return tmps[S];}
const gs=document.createElement('canvas');gs.width=gs.height=28;const gsx=gs.getContext('2d');
const gs2=document.createElement('canvas');gs2.width=gs2.height=56;const gs2x=gs2.getContext('2d');
function edgeMask(d,thr){const M=new Uint8Array(N*N);for(let y=0;y<N-1;y++)for(let x=0;x<N-1;x++){const i=(y*N+x)*4,j=i+4,k=i+N*4;const e=(Math.abs(d[i]-d[j])+Math.abs(d[i+1]-d[j+1])+Math.abs(d[i+2]-d[j+2])+Math.abs(d[i]-d[k])+Math.abs(d[i+1]-d[k+1])+Math.abs(d[i+2]-d[k+2]))/765;if(e>thr)M[y*N+x]=1;}return M;}
function lumAt(d,i){return (.299*d[i]+.587*d[i+1]+.114*d[i+2])/255;}
function recolor(fn){
  const id=o.getImageData(0,0,N,N),d=id.data;
  for(let i=0;i<d.length;i+=4){const c=fn(lumAt(d,i),d[i],d[i+1],d[i+2]);d[i]=c[0];d[i+1]=c[1];d[i+2]=c[2];d[i+3]=255;}
  rcx.putImageData(id,0,0);return rc;
}
const HEAT=[[0,[8,0,32]],[.25,[80,0,130]],[.5,[220,40,50]],[.75,[255,190,0]],[1,[255,255,225]]];
function heat(l){
  for(let i=1;i<HEAT.length;i++){if(l<=HEAT[i][0]){const a=HEAT[i-1],b=HEAT[i],k=(l-a[0])/(b[0]-a[0]);
    return [a[1][0]+(b[1][0]-a[1][0])*k,a[1][1]+(b[1][1]-a[1][1])*k,a[1][2]+(b[1][2]-a[1][2])*k];}}
  return HEAT[4][1];
}
const GB=[[15,56,15],[48,98,48],[139,172,15],[224,248,208]];

const STYLE_FN=[
/*0 pixel*/(c,S)=>{c.drawImage(off,0,0,S,S);},
/*1 crt*/(c,S,cv,m,st,t)=>{
  c.drawImage(off,0,0,S,S);
  c.fillStyle='rgba(0,0,0,.28)';for(let y=0;y<S;y+=4)c.fillRect(0,y,S,2);
  const v=c.createRadialGradient(S/2,S/2,S*.35,S/2,S/2,S*.75);
  v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.6)');
  c.fillStyle=v;c.fillRect(0,0,S,S);
  c.fillStyle='rgba(255,255,255,'+(.02+.02*Math.sin(t*40))+')';c.fillRect(0,0,S,S);
},
/*2 block glitch*/(c,S,cv,m,st)=>{
  c.drawImage(off,0,0,S,S);
  const tc=tmpFor(S),tx=tc.getContext('2d');tx.clearRect(0,0,S,S);tx.drawImage(cv,0,0);
  const g=st.glitch,n=Math.floor(3+g*12);
  for(let i=0;i<n;i++){const y=Math.random()*S,h=4+Math.random()*S*.09,dx=(Math.random()-.5)*S*.22*g;c.drawImage(tc,0,y,S,h,dx,y,S,h);}
  c.globalCompositeOperation='difference';
  const p=m.pal,cols=[p.acc,p.acc2,p.eye],nb=Math.floor(g*10);
  for(let i=0;i<nb;i++){c.fillStyle=cols[i%3];c.fillRect(Math.random()*S,Math.random()*S,10+Math.random()*S*.12,3+Math.random()*S*.03);}
  c.globalCompositeOperation='source-over';c.globalAlpha=.5;c.drawImage(tc,-4,0);c.globalAlpha=1;
},
/*3 ascii*/(c,S,cv,m)=>{
  const d=o.getImageData(0,0,N,N).data,cols=S>=500?48:40,cell=S/cols,ramp=m.ramp;
  c.fillStyle='#000';c.fillRect(0,0,S,S);
  c.font='bold '+(cell*1.1)+'px monospace';c.textAlign='center';c.textBaseline='middle';
  for(let gy=0;gy<cols;gy++)for(let gx=0;gx<cols;gx++){
    const sx=Math.floor((gx+.5)*N/cols),sy=Math.floor((gy+.5)*N/cols),i=(sy*N+sx)*4,lum=lumAt(d,i);
    if(lum<.05)continue;
    c.fillStyle='rgb('+d[i]+','+d[i+1]+','+d[i+2]+')';
    c.fillText(ramp[Math.min(ramp.length-1,Math.floor(lum*ramp.length))],(gx+.5)*cell,(gy+.55)*cell);
  }
},
/*4 halftone*/(c,S)=>{
  const d=o.getImageData(0,0,N,N).data,cols=44,cell=S/cols;
  c.fillStyle='#000';c.fillRect(0,0,S,S);
  for(let gy=0;gy<cols;gy++)for(let gx=0;gx<cols;gx++){
    const sx=Math.floor((gx+.5)*N/cols),sy=Math.floor((gy+.5)*N/cols),i=(sy*N+sx)*4,lum=lumAt(d,i);
    if(lum<.04)continue;
    c.fillStyle='rgb('+d[i]+','+d[i+1]+','+d[i+2]+')';
    c.beginPath();c.arc((gx+.5)*cell,(gy+.5)*cell,cell*.5*Math.min(1,.2+lum*1.1),0,7);c.fill();
  }
},
/*5 thermal*/(c,S)=>{c.drawImage(recolor((l)=>heat(l)),0,0,S,S);},
/*6 handheld*/(c,S)=>{c.drawImage(recolor((l)=>GB[l<.08?0:l<.3?1:l<.6?2:3]),0,0,S,S);},
/*7 duotone*/(c,S,cv,m)=>{
  const a=rgbOf(m.pal.body),b=rgbOf(m.pal.acc);
  c.drawImage(recolor((l)=>{const k=Math.pow(l,.8);return [a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k];}),0,0,S,S);
},
/*8 blueprint*/(c,S)=>{
  const d=o.getImageData(0,0,N,N).data,L=new Float32Array(N*N);
  for(let i=0;i<N*N;i++)L[i]=lumAt(d,i*4);
  c.fillStyle='#0b2f7a';c.fillRect(0,0,S,S);
  c.strokeStyle='rgba(191,224,255,.12)';c.lineWidth=1;
  for(let g=0;g<=S;g+=S/12.5){c.beginPath();c.moveTo(g,0);c.lineTo(g,S);c.stroke();c.beginPath();c.moveTo(0,g);c.lineTo(S,g);c.stroke();}
  const k=S/N;c.fillStyle='#d6ebff';
  for(let y=0;y<N-1;y++)for(let x=0;x<N-1;x++){
    const e=Math.abs(L[y*N+x]-L[y*N+x+1])+Math.abs(L[y*N+x]-L[(y+1)*N+x]);
    if(e>.12)c.fillRect(x*k,y*k,k,k);
  }
},
/*9 neon outline*/(c,S)=>{
  const d=o.getImageData(0,0,N,N).data,M=edgeMask(d,.22),id=rcx.createImageData(N,N),q=id.data;
  for(let y=0;y<N-1;y++)for(let x=0;x<N-1;x++){
    const p0=y*N+x;if(!M[p0])continue;
    const i=p0*4,j=i+4,k=i+N*4;
    const r=Math.max(d[i],d[j],d[k]),g=Math.max(d[i+1],d[j+1],d[k+1]),b=Math.max(d[i+2],d[j+2],d[k+2]);
    const f=255/Math.max(r,g,b,1);
    q[i]=Math.min(255,r*f);q[i+1]=Math.min(255,g*f);q[i+2]=Math.min(255,b*f);q[i+3]=255;
  }
  rcx.putImageData(id,0,0);
  c.fillStyle='#05030a';c.fillRect(0,0,S,S);
  c.drawImage(rc,0,0,S,S);
  gsx.clearRect(0,0,28,28);gsx.imageSmoothingEnabled=true;gsx.drawImage(rc,0,0,28,28);
  gs2x.clearRect(0,0,56,56);gs2x.imageSmoothingEnabled=true;gs2x.drawImage(rc,0,0,56,56);
  c.imageSmoothingEnabled=true;c.globalCompositeOperation='lighter';
  c.drawImage(gs2,0,0,S,S);c.drawImage(gs,0,0,S,S);c.drawImage(gs,0,0,S,S);c.drawImage(gs,0,0,S,S);
  c.imageSmoothingEnabled=false;c.globalCompositeOperation='source-over';
},
/*10 comic ink*/(c,S)=>{
  const d=o.getImageData(0,0,N,N).data,M=edgeMask(d,.28);
  c.drawImage(recolor((l,r,g,b)=>[Math.round(r/85)*85,Math.round(g/85)*85,Math.round(b/85)*85]),0,0,S,S);
  const k=S/N;c.fillStyle='#000';c.globalAlpha=.9;
  for(let i=0;i<N*N;i++)if(M[i])c.fillRect((i%N)*k,((i/N)|0)*k,k,k);
  c.globalAlpha=1;
},
/*11 mosaic*/(c,S)=>{
  const d=o.getImageData(0,0,N,N).data,cols=32,cell=S/cols;
  c.fillStyle='#050505';c.fillRect(0,0,S,S);
  for(let gy=0;gy<cols;gy++)for(let gx=0;gx<cols;gx++){
    const sx=Math.floor((gx+.5)*N/cols),sy=Math.floor((gy+.5)*N/cols),i=(sy*N+sx)*4;
    const x=gx*cell+1,y=gy*cell+1;
    c.fillStyle='rgb('+d[i]+','+d[i+1]+','+d[i+2]+')';c.fillRect(x,y,cell-2,cell-2);
    c.fillStyle='rgba(255,255,255,.2)';c.fillRect(x,y,cell-2,2);c.fillRect(x,y,2,cell-2);
    c.fillStyle='rgba(0,0,0,.25)';c.fillRect(x,y+cell-4,cell-2,2);
  }
},
/*12 led wall*/(c,S)=>{
  const d=o.getImageData(0,0,N,N).data,cols=50,cell=S/cols;
  c.fillStyle='#050507';c.fillRect(0,0,S,S);
  for(let gy=0;gy<cols;gy++)for(let gx=0;gx<cols;gx++){
    const sx=Math.floor((gx+.5)*N/cols),sy=Math.floor((gy+.5)*N/cols),i=(sy*N+sx)*4,lum=lumAt(d,i);
    c.fillStyle=lum<.06?'#101016':'rgb('+d[i]+','+d[i+1]+','+d[i+2]+')';
    c.beginPath();c.arc((gx+.5)*cell,(gy+.5)*cell,cell*.4,0,7);c.fill();
  }
},
/*13 chromatic*/(c,S,cv,m,st)=>{
  const tc=tmpFor(S),tx=tc.getContext('2d'),sh=S*.012*(1+st.glitch*3);
  c.fillStyle='#000';c.fillRect(0,0,S,S);
  [['#ff0000',-sh],['#00ff00',0],['#0000ff',sh]].forEach(a=>{
    tx.globalCompositeOperation='source-over';tx.imageSmoothingEnabled=false;tx.clearRect(0,0,S,S);tx.drawImage(off,0,0,S,S);
    tx.globalCompositeOperation='multiply';tx.fillStyle=a[0];tx.fillRect(0,0,S,S);
    c.globalCompositeOperation='lighter';c.drawImage(tc,a[1],0);
  });
  c.globalCompositeOperation='source-over';
},
/*14 engraving*/(c,S)=>{
  const d=o.getImageData(0,0,N,N).data,cols=46,cell=S/cols;
  c.fillStyle='#efe6d2';c.fillRect(0,0,S,S);
  c.lineWidth=Math.max(1,cell*.24);c.lineCap='butt';
  for(let gy=0;gy<cols;gy++)for(let gx=0;gx<cols;gx++){
    const sx=Math.floor((gx+.5)*N/cols),sy=Math.floor((gy+.5)*N/cols),i=(sy*N+sx)*4,lum=lumAt(d,i);
    const n=Math.round((1-lum)*4);if(n<=0)continue;
    const sat=Math.max(d[i],d[i+1],d[i+2])-Math.min(d[i],d[i+1],d[i+2]);
    c.strokeStyle=sat>110?'rgb('+d[i]+','+d[i+1]+','+d[i+2]+')':'#1a1420';
    const x0=gx*cell,y0=gy*cell;
    for(let k=0;k<n;k++){const tt=(k+.5)/n*cell;c.beginPath();c.moveTo(x0,y0+tt);c.lineTo(x0+cell,y0+tt-cell*.35);c.stroke();}
  }
}
];

function render(m,t,cv,styleIdx,animIdx){
  const S=cv.width,c=cv.getContext('2d'),st=stateAt(m,t,animIdx);
  drawMonster(m,st);
  const style=(styleIdx!==undefined&&styleIdx>=0)?styleIdx:m.style;
  c.globalCompositeOperation='source-over';c.globalAlpha=1;c.imageSmoothingEnabled=false;
  STYLE_FN[style](c,S,cv,m,st,t);
  c.globalAlpha=1;c.globalCompositeOperation='source-over';
}

/* ---------- GIF encoder (pure JS) ---------- */
function gifPalette(hist){
  const cols=[];
  for(let k=0;k<32768;k++)if(hist[k])cols.push([k,hist[k]]);
  const ch=(c,a)=>a===0?(c[0]>>10)&31:a===1?(c[0]>>5)&31:c[0]&31;
  let boxes=[cols];
  while(boxes.length<256){
    let bi=-1,best=-1,bax=0;
    for(let i=0;i<boxes.length;i++){
      const b=boxes[i];if(b.length<2)continue;
      let pop=0;const mn=[31,31,31],mx=[0,0,0];
      for(const c of b){pop+=c[1];for(let a=0;a<3;a++){const v=ch(c,a);if(v<mn[a])mn[a]=v;if(v>mx[a])mx[a]=v;}}
      const r=[mx[0]-mn[0],mx[1]-mn[1],mx[2]-mn[2]];
      const ax=r[0]>=r[1]&&r[0]>=r[2]?0:(r[1]>=r[2]?1:2);
      const score=pop*(r[ax]+1);
      if(score>best){best=score;bi=i;bax=ax;}
    }
    if(bi<0)break;
    const b=boxes[bi];
    b.sort((x,y)=>ch(x,bax)-ch(y,bax));
    let pop=0;for(const c of b)pop+=c[1];
    let acc=0,cut=1;
    for(let i=0;i<b.length-1;i++){acc+=b[i][1];if(acc>=pop/2){cut=i+1;break;}cut=i+1;}
    boxes.splice(bi,1,b.slice(0,cut),b.slice(cut));
  }
  const pal=new Uint8Array(768);
  boxes.forEach((b,i)=>{
    let r=0,g=0,bl=0,pop=0;
    for(const c of b){r+=ch(c,0)*c[1];g+=ch(c,1)*c[1];bl+=ch(c,2)*c[1];pop+=c[1];}
    pal[i*3]=Math.min(255,Math.round(r/pop*8+4));pal[i*3+1]=Math.min(255,Math.round(g/pop*8+4));pal[i*3+2]=Math.min(255,Math.round(bl/pop*8+4));
  });
  return {pal,size:boxes.length};
}
function gifLut(hist,pal,size){
  const lut=new Uint8Array(32768);
  for(let k=0;k<32768;k++){
    if(!hist[k])continue;
    const r=((k>>10)&31)*8+4,g=((k>>5)&31)*8+4,b=(k&31)*8+4;
    let bd=1e9,bi=0;
    for(let i=0;i<size;i++){const dr=pal[i*3]-r,dg=pal[i*3+1]-g,db=pal[i*3+2]-b,d=dr*dr*2+dg*dg*4+db*db*3;if(d<bd){bd=d;bi=i;}}
    lut[k]=bi;
  }
  return lut;
}
const _gt=new Int32Array(4096*256),_gs=new Int32Array(4096*256);let _gg=0;
function gifLzw(idx){
  const out=[];let cur=0,cb=0;
  const put=(code,size)=>{cur|=code<<cb;cb+=size;while(cb>=8){out.push(cur&255);cur>>>=8;cb-=8;}};
  const clear=256,eoi=257;let size=9,next=258;_gg++;
  put(clear,size);
  let prefix=idx[0];
  for(let i=1;i<idx.length;i++){
    const k=idx[i],h=(prefix<<8)|k;
    if(_gs[h]===_gg){prefix=_gt[h];continue;}
    put(prefix,size);
    if(next<4096){_gt[h]=next;_gs[h]=_gg;next++;if(next>(1<<size))size++;}
    else{put(clear,size);_gg++;next=258;size=9;}
    prefix=k;
  }
  put(prefix,size);
  next++;if(next>(1<<size)&&size<12)size++;
  put(eoi,size);
  if(cb>0)out.push(cur&255);
  return out;
}
function gifAssemble(frames,pal,S,delay){
  const parts=[];
  const head=[71,73,70,56,57,97,S&255,S>>8,S&255,S>>8,0xF7,0,0];
  parts.push(new Uint8Array(head),pal);
  parts.push(new Uint8Array([0x21,0xFF,11,78,69,84,83,67,65,80,69,50,46,48,3,1,0,0,0]));
  for(const idx of frames){
    parts.push(new Uint8Array([0x21,0xF9,4,0,delay&255,delay>>8,0,0]));
    parts.push(new Uint8Array([0x2C,0,0,0,0,S&255,S>>8,S&255,S>>8,0,8]));
    const data=gifLzw(idx),blocks=[];
    for(let i=0;i<data.length;i+=255){const n=Math.min(255,data.length-i);blocks.push(n);for(let j=0;j<n;j++)blocks.push(data[i+j]);}
    blocks.push(0);
    parts.push(new Uint8Array(blocks));
  }
  parts.push(new Uint8Array([0x3B]));
  return new Blob(parts,{type:'image/gif'});
}

async function makeGif(m,styleIdx,animIdx,onProgress){
  onProgress=onProgress||function(){};
  const S=400,FR=40,STEP=.08;
  const cv=document.createElement('canvas');cv.width=cv.height=S;
  const cx=cv.getContext('2d',{willReadFrequently:true});
  const hist=new Uint32Array(32768),keysList=[];
  for(let f=0;f<FR;f++){
    render(m,f*STEP,cv,styleIdx,animIdx);
    const d=cx.getImageData(0,0,S,S).data,keys=new Uint16Array(S*S);
    for(let i=0,j=0;j<S*S;i+=4,j++){const k=((d[i]>>3)<<10)|((d[i+1]>>3)<<5)|(d[i+2]>>3);keys[j]=k;hist[k]++;}
    keysList.push(keys);onProgress(f/FR*.6);
    await new Promise(r=>setTimeout(r,0));
  }
  const pl=gifPalette(hist),lut=gifLut(hist,pl.pal,pl.size),frames=[];
  for(let f=0;f<FR;f++){
    const k=keysList[f],a=new Uint8Array(S*S);
    for(let i=0;i<a.length;i++)a[i]=lut[k[i]];
    frames.push(a);keysList[f]=null;onProgress(.6+f/FR*.35);
    if(f%4===3)await new Promise(r=>setTimeout(r,0));
  }
  onProgress(.97);
  await new Promise(r=>setTimeout(r,0));
  return gifAssemble(frames,pl.pal,S,8);
}

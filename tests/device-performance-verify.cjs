const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const document={hidden:false,documentElement:{dataset:{}},body:{classList:{toggle(){}}},addEventListener(){}};
const scene={};
const env={document,navigator:{},innerWidth:960,innerHeight:540,matchMedia:()=>({matches:false}),addEventListener(){}};
const ctx={window:env,document,AdaptiveUI:{playScene:scene,menuOpen:false},Chronicle:{panel:null}};
vm.createContext(ctx);
for(const name of ['device-profile','frame-pacing','performance-manager'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/core/'+name+'.js'),'utf8'),ctx);
const {DeviceProfile:device,FramePacing:pacing,GamePerformance:perf}=vm.runInContext('({DeviceProfile,FramePacing,GamePerformance})',ctx);
function profile(ua,touch,width,height,coarse=true,screenWidth=width,screenHeight=height){
 return device.read({navigator:{userAgent:ua,maxTouchPoints:touch},innerWidth:width,innerHeight:height,screen:{width:screenWidth,height:screenHeight},matchMedia:q=>({matches:q.includes('coarse')&&coarse})});
}
for(const [ua,touch,w,h,type] of [['iPhone Mobile',5,390,844,'phone'],['Android Mobile',5,412,915,'phone'],['iPad',5,1024,1366,'tablet'],['Macintosh',5,1024,1366,'tablet'],['Windows',10,360,800,'desktop']]){
 const p=profile(ua,touch,w,h);assert.equal(p.type,type);assert.equal(p.portraitBlocked,type!=='desktop');
}
assert.equal(profile('Windows',0,360,800,false).portraitBlocked,false,'narrow desktop is not a phone');
assert.equal(profile('iPhone Mobile',5,844,390,true,390,844).type,'phone','rotation does not change device class');
assert.equal(profile('iPhone Mobile',5,844,390,true,390,844).portraitBlocked,false);
assert.equal(profile('Unknown',0,960,540,false).memory,null,'missing hints are unknown, not zero');
assert.equal(profile('Unknown',0,960,540,false).modest,false);
function makeLoop(step,target=60){
 const frames=[];return {frames,step,fpsLimit:target,_limitRate:1000/target,now:0,lastTime:0,time:0,delta:0,frame:0,framesThisSecond:0,nextFpsUpdate:Infinity,
  callback(t,d){frames.push([t,d]);},updateFPS(){}};
}
// Deterministic reproduction of the shipped engine's discarded-remainder bug.
const old=makeLoop(function(time){this.delta+=time-this.lastTime;if(this.delta>=this._limitRate){this.callback(time,this.delta);this.delta=0;}this.lastTime=time;});
const fixed=makeLoop(pacing.step);
let time=0;for(let i=0;i<600;i++){time+=i%2?16.8:16.4;old.step(time);fixed.step(time);}
assert.equal(old.frames.length,300);assert.ok(fixed.frames.length>=597,'frame remainder prevents artificial 30 FPS');
for(const hz of [59.94,60,90,120,144])for(const target of [30,60]){
 const loop=makeLoop(pacing.step,target);
 for(let i=1;i<=Math.round(hz*10);i++)loop.step(i*1000/hz);
 assert.ok(Math.abs(loop.frames.length-target*10)<=1,`${hz} Hz / ${target} FPS pacing: ${loop.frames.length}`);
 const elapsed=loop.frames.reduce((sum,f)=>sum+f[1],0);
 assert.ok(Math.abs(elapsed-loop.lastTime)<1000/target+1,'physics receives elapsed time, not fixed speed per frame');
 loop.step(loop.lastTime+5000);assert.ok(loop.frames.at(-1)[1]<=100,'long stalls cannot teleport the player');
}
perf.game={loop:{fpsLimit:60,_limitRate:1000/60}};
let clock=0;
function frames(ms,dt){for(let t=0;t<ms;t+=dt){clock+=dt;perf.sample(clock);}}
perf.setMode('auto');frames(12000,1000/60);assert.equal(perf.level,0);
frames(10000,1000/40);assert.equal(perf.level,1,'first sustained drop only reduces decoration');assert.equal(perf.targetFps,60);
frames(10000,1000/40);assert.equal(perf.level,2);assert.equal(perf.targetFps,30);
frames(30000,1000/30);assert.equal(perf.level,2,'capped FPS must not cause quality oscillation');
perf.setMode('auto');ctx.AdaptiveUI.menuOpen=true;frames(20000,100);assert.equal(perf.level,0,'menus excluded');ctx.AdaptiveUI.menuOpen=false;
document.hidden=true;frames(20000,100);assert.equal(perf.level,0,'background excluded');document.hidden=false;
device.current.portraitBlocked=true;frames(20000,100);assert.equal(perf.level,0,'orientation gate excluded');device.current.portraitBlocked=false;
ctx.Chronicle.panel={hidden:false};frames(20000,100);assert.equal(perf.level,0,'activity reader excluded');ctx.Chronicle.panel=null;
for(let i=0;i<10;i++){frames(500,16.67);clock+=5000;perf.sample(clock);}assert.equal(perf.level,0,'resume/loading stalls are not persistent slow frames');
perf.setMode('full');frames(20000,50);assert.equal(perf.targetFps,60,'manual selection is respected');
perf.setMode('eco');assert.equal(perf.targetFps,30);perf.setMode('auto');assert.equal(perf.targetFps,60,'recheck resets fallback');
ctx.GameplayScene=class {};
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/world/ambient.js'),'utf8'),ctx);
const ambient=vm.runInContext('new Ambient({})',ctx);
ambient.leaves=Array.from({length:8},()=>({ph:0,sp:8,sway:10,h:540,w:960,s:{x:10,y:10,visible:true,setVisible(v){this.visible=v;},setRotation(){}}}));
perf.setMode('eco');ambient.update(100,16.67);assert.equal(ambient.leaves.filter(l=>l.s.visible).length,4,'only half the decorative particles render in eco');
perf.setMode('full');ambient.update(120,16.67);assert.equal(ambient.leaves.filter(l=>l.s.visible).length,8,'manual full mode restores all decorative particles');
console.log('PASS: phone/tablet/desktop detection, unknown hints, 59.94–144 Hz pacing, staged auto quality, hidden/menu exclusions and manual override');

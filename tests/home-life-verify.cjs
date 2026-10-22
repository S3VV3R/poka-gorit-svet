const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=require('./support/load-game.cjs').html();
const context=vm.createContext({console,setTimeout,clearTimeout,Math,Date,JSON,Promise,Set,Map,
  window:{addEventListener(){}},document:{},navigator:{},Phaser:{Scene:class{},AUTO:0,BlendModes:{ADD:1,MULTIPLY:2}},
  localStorage:{getItem(){return null},setItem(){},removeItem(){}}});
vm.runInContext(html.slice(html.indexOf('const CFG ='),html.lastIndexOf('</script>')),context);
const {HomeLife:home,Audio:audio,Chronicle:chronicle}=vm.runInContext('({HomeLife,Audio,Chronicle})',context);
const routes=[],stops=[],params=[];
const parameter=()=>({setValueAtTime(v){params.push(v)},linearRampToValueAtTime(v){params.push(v)},exponentialRampToValueAtTime(v){params.push(v)}});
const node=()=>({gain:parameter(),frequency:parameter(),connect(to){routes.push(to)},disconnect(){},start(){},stop(time){stops.push(time);this.onended?.()}});
const ctx={state:'running',currentTime:10,sampleRate:8000,
 createGain:node,createOscillator:node,createBufferSource:node,createBiquadFilter:node,
 createBuffer:(channels,length)=>({getChannelData:()=>new Float32Array(length)})};
audio.ctx=ctx;audio.sfxGain={name:'user-volume'};
home.sound('cup');assert.equal(stops.length,0,'audio waits for the user gesture unlock');
audio.ready=true;
for(const kind of ['wood','tile','rug','switch','cup','kettle','water','cloth','window','rain'])home.sound(kind);
assert.equal(stops.length,10);assert.ok(stops.every(t=>t>10&&t<12));
assert.equal(routes.filter(x=>x===audio.sfxGain).length,10,'every home sound respects the game SFX volume');
assert.ok(params.every(Number.isFinite),'audio ramps contain only finite values');
ctx.state='suspended';home.sound('kettle');assert.equal(stops.length,10,'suspended audio does not accumulate sounds');
const kinds=[],original=home.sound;home.sound=kind=>kinds.push(kind);
const sc={_homeLife:{furniture:{sofa:{x:50,y:50},counter:{x:200,y:50}}}};
home.footstep(sc,50,50);home.footstep(sc,200,50);home.footstep(sc,100,180);
assert.deepEqual(kinds,['rug','tile','wood']);home.sound=original;
const state=home.state();assert.ok(state.migrated);assert.equal(state.cups,0);
chronicle.state().era=8;state.teaCount=5;
assert.ok(home.history().includes('Взрослые дочери'));assert.ok(home.history().includes('5 раз'));
assert.equal(home.path({worldW:100,worldH:100,_colRects:[[50,50,10,100]]},{x:24,y:50},{x:80,y:50}),null,'unreachable routes are rejected, never teleported');
console.log('PASS: sound lifecycle, user volume, distinct floor sounds, old-save defaults, aging memories and blocked-route safety');

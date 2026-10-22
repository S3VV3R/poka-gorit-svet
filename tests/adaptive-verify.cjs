const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
class Node {
  constructor(tag){this.tagName=tag;this.children=[];this.hidden=false;this.textContent='';this.style={};this.dataset={};this.events={};this.disabled=false;}
  append(...nodes){this.children.push(...nodes);} prepend(...nodes){this.children.unshift(...nodes);}
  replaceChildren(...nodes){this.children=nodes;} setAttribute(){} focus(){}
  addEventListener(name,fn){(this.events[name]??=[]).push(fn);}
  fire(name,event={}){let prevented=false;const e={preventDefault(){prevented=true;},stopPropagation(){},target:this,...event};for(const fn of this.events[name]||[])fn(e);return prevented;}
  setPointerCapture(id){this.capture=id;}
  getBoundingClientRect(){return {left:0,top:0,width:112,height:112};}
  querySelector(){return this.children.find(x=>x.tagName==='button')||null;}
  closest(){return ['button','input','select'].includes(this.tagName)?this:null;}
}
const storage=new Map(),TouchInput={dx:0,dy:0};
const document={createElement:tag=>new Node(tag),addEventListener(){},body:{classList:{toggle(){}}}};
document.documentElement={dataset:{}};
const context={document,TouchInput,SaveSystem:{recovered:false},Audio:{unlock(){}},navigator:{hardwareConcurrency:8},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},console};
context.window=context;
vm.createContext(context);
for(const name of ['device-profile','performance-manager'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/core/'+name+'.js'),'utf8'),context);
for(const name of ['layout','controls','content','menus'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/ui/adaptive-'+name+'.js'),'utf8'),context);
const ui=vm.runInContext('AdaptiveUI',context);ui.root=new Node('div');ui.game={loop:{fpsLimit:60,_limitRate:1000/60}};
vm.runInContext('GamePerformance.game=AdaptiveUI.game',context);
ui.ui={_touchInteract:false,_touchInteractHeld:false,_touchPause:false};
ui.createControls();
ui.joystick.fire('pointerdown',{pointerId:1,clientX:88,clientY:56});
assert.equal(TouchInput.dx,1);assert.equal(TouchInput.dy,0);
ui.action.fire('pointerdown',{pointerId:2});
assert.equal(ui.ui._touchInteract,true);assert.equal(ui.ui._touchInteractHeld,true);assert.equal(TouchInput.dx,1,'second finger does not stop movement');
ui.action.fire('pointerup',{pointerId:2});
assert.equal(ui.ui._touchInteractHeld,false);assert.equal(TouchInput.dx,1);
ui.joystick.fire('pointercancel',{pointerId:1});assert.equal(TouchInput.dx,0);
ui.joystick.fire('pointerdown',{pointerId:3,clientX:88,clientY:88});
assert.ok(Math.abs(Math.hypot(TouchInput.dx,TouchInput.dy)-1)<.0001,'diagonal motion is normalized');
ui.action.fire('pointerdown',{pointerId:4});ui.releaseControls();
assert.equal(TouchInput.dx,0);assert.equal(TouchInput.dy,0);assert.equal(ui.ui._touchInteractHeld,false);assert.equal(ui.ui._touchInteract,false);
ui.joystick.fire('pointermove',{pointerId:3,clientX:100,clientY:100});assert.equal(TouchInput.dx,0,'old pointer cannot restart movement after blur/resize');
ui.setQuality('eco');assert.equal(ui.game.loop.fpsLimit,30);assert.equal(ui.game.loop._limitRate,1000/30);
ui.setQuality('full');assert.equal(ui.game.loop.fpsLimit,60);assert.equal(ui.game.loop._limitRate,1000/60);
context.navigator.hardwareConcurrency=2;ui.setQuality('auto');assert.equal(ui.game.loop.fpsLimit,60,'hardware hints must not force 30 FPS');
assert.equal(vm.runInContext('GamePerformance.reducedEffects',context),true);
ui.createContent();assert.equal(ui.next.fire('keydown',{repeat:true}),true,'held Enter cannot repeatedly activate the next button');
ui.createMenus();let selected='';
const scene={scene:{key:'MainMenu'},input:{enabled:true},children:{list:[{type:'Text',input:{},text:'Новая игра',emit(){selected='new';}}]}};
ui.syncMenus([scene]);assert.equal(scene.input.enabled,false,'the underlying canvas menu cannot receive the same click');
const card=ui.menu.children[0],buttons=card.children.find(n=>n.className==='ad-menu-buttons');
buttons.children[0].fire('click');assert.equal(selected,'new');
console.log('PASS: independent touch pointers, diagonal speed, cancel/blur safety, 30/60 FPS configuration, repeat-key guard and exclusive menu input');

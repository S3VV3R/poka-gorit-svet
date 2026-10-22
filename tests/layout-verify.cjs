const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=require('./support/load-game.cjs').html();
function node(x=0,y=0){
  const item={x,y,body:{setSize(){return this},setOffset(){return this}},visible:true};
  return new Proxy(item,{get(t,k){if(k in t)return t[k];return (...args)=>{if(k==='setPosition'){t.x=args[0];t.y=args[1]}return item.proxy}},set(t,k,v){t[k]=v;return true}});
}
function drawable(x,y){const n=node(x,y);n.proxy=n;return n;}
class Actor{constructor(sc,x,y){this.sprite=drawable(x,y)} setSkin(){} }
class GameplayScene{
  constructor(key){this.scene={key};}
  commonCreate(){
    this.rects=[];this.items=[];this.cats=[];this.flags={};this._ph=0;
    this.physics={world:{setBounds:(x,y,w,h)=>{this.bounds={x,y,w,h}}}};
    this.add=new Proxy({}, {get:()=> (x,y)=>drawable(x,y)});
    this.cameras={main:drawable()};this.ui=drawable();this.tweens={add(){}};
    this.time={delayedCall(){}};this.input={keyboard:{on(){},once(){}}};
    this.interactions={add:(x,y,r,label)=>{const p={x,y,r,label};this.items.push(p);return p}};
    this.done=new Set();
  }
  addCollider(x,y,w,h){this.rects.push({x,y,w,h});return drawable(x,y)}
  collidersReadyFor(){} lockInput(){} unlockInput(){} safeRun(){} ambientInit(){return drawable()}
}
const context=vm.createContext({GameplayScene,Player:Actor,NPC:Actor,Cat:Actor,
 GameState:{flags:{},ageStage:'young',life:{},settings:{}},CFG:{ZOOM:2.5},SaveSystem:{save(){}},
 Audio:drawable(),Phaser:{BlendModes:{MULTIPLY:1,ADD:2}},LifeSystem:{install(){}},
 skinFor:()=> 'nastya',makeGrid:()=>Array.from({length:30},()=>Array(60).fill(0)),fillRect(){},buildTilemap(){},addTint(){},addRain(){},
 PUT:(sc,k,x,y,col)=>{if(col)sc.addCollider(...col);return drawable(x,y)}});
for(const [name,end] of [['Apartment','class ProposalScene extends'],['Proposal','class WeddingScene extends'],['YoungFamily','const ERA_BY_SCENE ='],['House','class BabyScene extends']]){
 const sourceStart=html.indexOf('class '+name+'Scene extends'),stop=html.indexOf(end,sourceStart+1);
 assert.ok(sourceStart>0&&stop>sourceStart);vm.runInContext(html.slice(sourceStart,stop)+'\nglobalThis.Target='+name+'Scene;',context);
 const sc=new context.Target();name==='House'?sc.houseCreate({era:'kids'}):sc.create();
 const pop=name==='House'?'popHouse':name==='YoungFamily'?'popYoung':'pop'+name;
 const popStart=html.indexOf('function '+pop+'('),popEnd=html.indexOf('\n}',popStart)+2;
 vm.runInContext(html.slice(popStart,popEnd)+'\nglobalThis.populate='+pop+';',context);
 context.populate(sc,'e6');
 const b=sc.bounds,step=2;
 const free=(x,y)=>x>=b.x+4&&x<=b.x+b.w-4&&y>=b.y+4&&y<=b.y+b.h-4&&
   !sc.rects.some(r=>Math.abs(x-r.x)<r.w/2+4&&Math.abs(y-r.y)<r.h/2+3);
 const start={x:Math.round(sc.player.sprite.x/step)*step,y:Math.round(sc.player.sprite.y/step)*step};
 assert.ok(free(start.x,start.y),name+' player spawn must be outside walls and furniture');
 const queue=[start],seen=new Set([start.x+','+start.y]);
 for(let i=0;i<queue.length;i++)for(const [dx,dy]of [[step,0],[-step,0],[0,step],[0,-step]]){
   const x=queue[i].x+dx,y=queue[i].y+dy,key=x+','+y;
   if(!seen.has(key)&&free(x,y)){seen.add(key);queue.push({x,y})}
 }
 for(const p of sc.items)assert.ok(queue.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<=p.r),name+' unreachable interaction: '+p.label);
 const thirds=[.22,.51,.82];for(const k of thirds)assert.ok(queue.some(p=>Math.abs(p.x-sc.worldW*k)<10),name+' room is reachable');
 console.log(name+': '+sc.worldW+'×'+sc.worldH+', safe spawn, connected rooms, '+sc.items.length+' reachable interactions');
}

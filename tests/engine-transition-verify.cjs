// Run the shipped Phaser engine in Node's headless mode, with synthetic saves.
// No browser, user tab, or user storage is accessed by this diagnostic.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createCanvas,Image}=require('@napi-rs/canvas');
const html=require('./support/load-game.cjs').html();
const render=process.argv.includes('--render');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
class Element{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.style={};this.children=[];this.clientWidth=960;this.clientHeight=540;this.width=960;this.height=540;this.dataset={};this.attributes={};}
 appendChild(x){x.parentNode=this;this.children.push(x);return x} append(...xs){xs.forEach(x=>this.appendChild(x))}
 removeChild(x){this.children=this.children.filter(c=>c!==x);x.parentNode=null} remove(){this.parentNode?.removeChild(this)}
 addEventListener(){} removeEventListener(){} setAttribute(k,v){this.attributes[k]=v} getAttribute(k){return this.attributes[k]}
 getBoundingClientRect(){return{x:0,y:0,left:0,top:0,right:960,bottom:540,width:960,height:540}}
 contains(){return true} focus(){} querySelector(){return new Element()} querySelectorAll(){return[]} replaceChildren(...xs){this.children=xs}
 getContext(){return null}
}
const root=new Element(),listeners={},storage=new Map();
const doc={readyState:'complete',documentElement:new Element('html'),body:new Element('body'),head:new Element('head'),
 createElement(tag){if(tag==='canvas'){const c=createCanvas(1,1);c.style={};c.addEventListener=()=>{};c.removeEventListener=()=>{};c.getBoundingClientRect=()=>root.getBoundingClientRect();c.getAttribute=()=>null;c.setAttribute=()=>{};return c}return new Element(tag)},
 createElementNS(ns,tag){return this.createElement(tag)},getElementById:()=>root,addEventListener(){},removeEventListener(){},querySelectorAll:()=>[],createTextNode:t=>({textContent:t})};
const ctx={console,setTimeout,clearTimeout,setInterval,clearInterval,performance,Image,HTMLImageElement:Image,HTMLCanvasElement:createCanvas(1,1).constructor,CanvasRenderingContext2D:createCanvas(1,1).getContext('2d').constructor,
 HTMLElement:Element,Element,HTMLVideoElement:Element,document:doc,navigator:{userAgent:'Node Phaser headless test',maxTouchPoints:0},screen:{width:960,height:540},
 devicePixelRatio:1,innerWidth:960,innerHeight:540,outerWidth:960,outerHeight:540,location:{hash:'',href:'https://headless.invalid/'},
 addEventListener:(k,fn)=>{(listeners[k]??=[]).push(fn)},removeEventListener(){},focus(){},getComputedStyle:()=>({position:'static'}),
 requestAnimationFrame:fn=>setTimeout(()=>fn(performance.now()),16),cancelAnimationFrame:clearTimeout,
 localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}};
ctx.window=ctx;ctx.self=ctx;ctx.top=ctx;ctx.parent=ctx;doc.defaultView=ctx;
vm.createContext(ctx);
const errorReport=e=>console.error(e.stack.split('\n').filter(l=>l.length<300).slice(-10).join('\n'));
process.on('uncaughtException',e=>{errorReport(e);process.exit(1)});
process.on('unhandledRejection',e=>{errorReport(e);process.exit(1)});
(async()=>{
 for(const [i,s] of scripts.entries())vm.runInContext(s,ctx,{filename:'game-script-'+i});
 vm.runInContext(`gameConfig.type=${render?'Phaser.CANVAS':'Phaser.HEADLESS'};gameConfig.audio={noAudio:true};gameConfig.banner=false;gameConfig.fps={forceSetTimeOut:true};
   GameState=DEFAULT_STATE();GameState.flags.chapter1Complete=true;SaveSystem.save();
   globalThis.testAPI={Chronicle,UIScene,MainMenuScene,ApartmentScene,ProposalScene,GameState,SaveSystem,HomeLife,FramePacing,AdaptiveUI,DEFAULT_STATE};
   globalThis.testGame=new Phaser.Game(gameConfig);window.__phaserGame=testGame;`,ctx);
 const game=ctx.testGame;
 assert.equal(game.loop.stepLimitFPS,ctx.testAPI.FramePacing.step,'the shipped engine uses the corrected frame pacing');
 for(let n=0;n<250&&!game.scene.isActive('MainMenu');n++)await new Promise(r=>setTimeout(r,20));
 assert.ok(game.scene.isActive('MainMenu'),'engine boots the shipped game');
 game.loop.stop();if(!render)game.renderer={gl:null,type:ctx.Phaser.CANVAS,destroy(){}};let clock=performance.now(),wallClock=Date.now();
 ctx.Date=class extends Date{static now(){return wallClock}};ctx.performance={now:()=>clock};
 async function frames(n,dt=1000/60){for(let i=0;i<n;i++){clock+=dt;wallClock+=dt;(render?game.step:game.headlessStep).call(game,clock,dt);await Promise.resolve();}}
 const physicsProbe=game.scene.getScene('MainMenu').physics.add.sprite(100,100,'nastya');
 physicsProbe.setVelocityX(60);await frames(1);
 const start60=physicsProbe.x;await frames(60);const distance60=physicsProbe.x-start60;
 const start30=physicsProbe.x;await frames(30,1000/30);const distance30=physicsProbe.x-start30;
 assert.ok(Math.abs(distance60-distance30)<1.1,'30 FPS does not slow down physics');
 assert.ok(Math.abs(distance60-60)<1.1,'physics speed stays measured in pixels per second');physicsProbe.destroy();
 console.log('PASS: equal movement distance at 30 and 60 FPS');
 if(process.argv.includes('--home-shot')){
   assert.ok(render,'home snapshot needs --render');game.scene.stop('MainMenu');game.scene.start('HomePreview');await frames(90);
   const sc=game.scene.getScene('HomePreview'),home=ctx.testAPI.HomeLife;
   Object.assign(home.state(),{cups:2,teaCount:5,bedMade:true,laundry:'сохнет',drawing:true,cleanDay:ctx.testAPI.Chronicle.state().elapsedDays});
   home.render(sc);sc._homeLife.steamUntil=sc._homeLife.elapsed+10000;home.bubble(sc,sc.tamir,'Чай готов. Твою кружку оставил рядом.');await frames(2);
   fs.writeFileSync(require('node:path').join(__dirname,'../test-results/Живой дом.png'),game.canvas.toBuffer('image/png'));game.destroy(true);process.exit(0);
 }
 const menu=game.scene.getScene('MainMenu');
 const row=menu.chapterPanel.list.find(x=>x.input&&x.y===-89);
 assert.ok(row,'chapter 2 has an interactive entry');
 row.emit('pointerdown');await frames(90);
 const scene=game.scene.getScene('Proposal'),ui=game.scene.getScene('UI');
 scene.cameras.main.preRender(1);
 assert.ok(scene.scene.isActive(),'chapter 2 starts');assert.ok(scene.player.sprite.body,'player has a live physics body');
 assert.ok(ui.fadeRect.alpha<.01,'chapter 2 is not hidden by the fade overlay');
 assert.ok(scene.cameras.main.worldView.contains(scene.player.sprite.x,scene.player.sprite.y),'camera shows the player');
 assert.equal(scene.locked,false);assert.equal(ui.isConversationActive(),false);
 console.log('PASS: chapter menu → Proposal, live player, visible camera, clear fade, unlocked input');
 ui.fadeOut(6000).catch(()=>{});await frames(2);
 ui.fadeIn(400);await frames(420);
 assert.ok(ui.fadeRect.alpha<.01,'an older fade-out must not black out the newly opened chapter');
 game.scene.stop('Proposal');game.scene.start('Apartment');await frames(90);
 const apartment=game.scene.getScene('Apartment');
 assert.ok(apartment._homeLife && apartment._homeLife.stations.length>=6,'physical home activities installed');
 if(process.argv.includes('--home-tests'))for(const station of apartment._homeLife.stations)
   assert.ok(ctx.testAPI.HomeLife.path(apartment,apartment.player.sprite,station.item),'reachable apartment furniture: '+station.key);
 if(render){
   await frames(120);
   apartment.cameras.main.stopFollow().removeBounds().setZoom(2.25).centerOn(176,112);
   ui.clearQuest();ui.hidePrompt();ui.setLifeStatus('');await frames(2);
   fs.writeFileSync(require('node:path').join(__dirname,'../test-results/Квартира после правок.png'),game.canvas.toBuffer('image/png'));
 }
 Object.assign(ctx.testAPI.GameState.flags,{dishesResolved:true,marsHome:true,abilkaHome:true});
 let completed=false,error;
 apartment.endingScene().then(()=>completed=true,e=>error=e);
 for(let n=0;n<2400&&!completed&&!error;n++){
   await frames(1);
   if(ui._canContinueDialogue()){ui.input.keyboard.emit('keydown-ENTER',{repeat:false});ui.input.keyboard.emit('keyup-ENTER',{});}
   if(ui.choiceContainer.visible){const list=ui.choiceContainer.list;const index=list.findIndex(x=>x.text==='Продолжить историю');if(index>0)list[index-1].emit('pointerdown');}
 }
 if(error)throw error;
 if(!completed)throw new Error('first chapter did not complete: '+JSON.stringify({now:ui.time.now,fade:ui.fadeRect.alpha,dialogue:ui.dlgText.text,line:!!ui._dialogueLine,choice:ui.choiceContainer.visible,options:ui.choiceContainer.list.map(x=>x.text).filter(Boolean),caption:ui.captionText.text,pending:ui._conversationPending,scenes:game.scene.getScenes(true).map(s=>s.scene.key),camera:[apartment.cameras.main?.scrollX,apartment.cameras.main?.scrollY]}));await frames(90);
 assert.ok(game.scene.isActive('Proposal'),'natural transition starts chapter 2');
 assert.ok(ui.fadeRect.alpha<.01,'natural transition clears the fade');
 assert.ok(ui.scene.isVisible(),'UI remains visible');
 const proposalAgain=game.scene.getScene('Proposal');proposalAgain.cameras.main.preRender(1);
 assert.ok(proposalAgain.cameras.main.worldView.contains(proposalAgain.player.sprite.x,proposalAgain.player.sprite.y),'new chapter camera returns from the remote balcony');
 console.log('PASS: Apartment balcony → chapter title → Proposal, clear fade and correct camera');
 for(let attempt=0;attempt<3;attempt++){
   const current=game.scene.getScene('Proposal');current.scene.pause();current.scene.launch('Pause',{returnKey:'Proposal'});await frames(3);
   game.scene.getScene('Pause').toMenu();await frames(40);
   const reopenedMenu=game.scene.getScene('MainMenu');
   const entry=reopenedMenu.chapterPanel.list.find(x=>x.input&&x.y===-89);entry.emit('pointerdown');await frames(60);
   assert.ok(game.scene.isActive('Proposal'));assert.ok(ui.scene.isActive());assert.ok(ui.scene.isVisible());assert.ok(ui.fadeRect.alpha<.01);
 }
 console.log('PASS: repeated pause → menu → chapter 2 returns');
 if(render){
   fs.writeFileSync(require('node:path').join(__dirname,'../test-results/Проверка главы 2.png'),game.canvas.toBuffer('image/png'));
   const dialogue=ui.dialogue([{who:'Настя',text:'Хорошо, что мы дома. Заварим чай и посидим рядом — сегодня можно никуда не торопиться.'}]);
   await frames(45);
   assert.ok(ui.dlgText.text.length>0 && ui.dlgText.text.length<80, 'real engine renders partially typed text');
   assert.equal(ui._canContinueDialogue(),false,'next remains unavailable during typing');
   fs.writeFileSync(require('node:path').join(__dirname,'../test-results/Диалог после правок.png'),game.canvas.toBuffer('image/png'));
   while(!ui._canContinueDialogue())await frames(1);
   ui.input.keyboard.emit('keydown-ENTER',{repeat:false});ui.input.keyboard.emit('keyup-ENTER',{});
   await frames(30);await dialogue;
   game.scene.stop('Proposal');game.scene.start('HomePreview');await frames(180);
   fs.writeFileSync(require('node:path').join(__dirname,'../test-results/Семейный дом после правок.png'),game.canvas.toBuffer('image/png'));
 }
 if(process.argv.includes('--home-tests')){
   if(!game.scene.isActive('HomePreview')){game.scene.stop('Proposal');game.scene.start('HomePreview');await frames(180);}
   const sc=game.scene.getScene('HomePreview'),home=ctx.testAPI.HomeLife,chronicle=ctx.testAPI.Chronicle;
   const room=sc._homeLife;assert.ok(room,'home module is installed after scene population');
   async function drive(promise,max=1800){let done=false,error;promise.then(()=>done=true,e=>{error=e;done=true;});
     for(let i=0;i<max&&!done;i++){await frames(1);if(ui._canContinueDialogue()){ui.input.keyboard.emit('keydown-ENTER',{repeat:false});ui.input.keyboard.emit('keyup-ENTER',{});}}
     if(error)throw error;assert.ok(done,'household action completes without hanging');await frames(2);
   }
   // Direct furniture interactions are reachable with the same real collision geometry.
   for(const station of room.stations){assert.ok(home.path(sc,sc.player.sprite,station.item),'reachable furniture: '+station.key);}
   for(const id of [17,3,8,11,13,108])await drive(chronicle.run(sc,()=>chronicle.activity(sc,id,{noEvent:true})));
   let state=home.state();
   assert.equal(state.cups,2);assert.ok(state.teaCount>0);assert.equal(state.cleanDay,chronicle.state().elapsedDays);
   assert.equal(state.laundry,'сохнет');assert.equal(state.bedMade,true);assert.equal(state.drawing,true);
   const persisted=JSON.stringify(state);assert.ok(storage.size>0);
   sc.originalSave.call(ctx.testAPI.SaveSystem);assert.equal(ctx.testAPI.SaveSystem.load(),true);
   state=home.state();assert.equal(JSON.stringify(state),persisted,'household details survive a save/load round trip');
   await drive(chronicle.run(sc,()=>chronicle.activity(sc,2,{noEvent:true})));assert.equal(state.cups,0,'washing clears cups');
   // Family initiative never opens a modal dialogue, and routes around furniture.
   room.quiet=0;room.serial=0;sc.tamir.target=null;home.routine(sc);
   assert.ok(room.walk,'Tamir has a collision-safe tea route');
   for(let i=0;i<1000&&room.walk;i++)await frames(1);
   assert.equal(room.walk,null);assert.equal(state.cups,2,'Tamir really reaches the table and makes tea');
   assert.equal(ui.isConversationActive(),false,'family initiative does not interrupt with a modal');
   assert.ok(room.offer,'the original Tamir conversations remain available by choice');
   room.serial=1;state.drawing=false;sc.kids.forEach(k=>k.target=null);home.routine(sc);
   assert.ok(room.walk,'child has a route toward Nastya');for(let i=0;i<1000&&room.walk;i++)await frames(1);
   assert.equal(state.drawing,true,'child brings a drawing');
   const before={x:sc.player.sprite.x,y:sc.player.sprite.y,body:sc.player.sprite.body.enable};
   await drive(chronicle.run(sc,()=>home.rest(sc)));
   assert.equal(sc.player.sprite.x,before.x);assert.equal(sc.player.sprite.y,before.y);assert.equal(sc.player.sprite.body.enable,before.body);
   const quiet=home.freeTime(sc);assert.equal(sc.locked,false);await frames(2);
   assert.ok(room.freeText?.visible,'free exploration has an explicit continue control');
   sc.scene.pause();await frames(2);assert.equal(room.freeText.visible,false,'home-only control hides on leaving or pausing');sc.scene.resume();await frames(2);
   const eventCount=Object.keys(chronicle.state().events).length;
   await chronicle.event(sc);assert.equal(Object.keys(chronicle.state().events).length,eventCount,'quiet time does not trigger surprise events');
   room.freeText.emit('pointerdown');await quiet;assert.equal(sc.locked,true);sc.unlockInput();
   chronicle.newDay(sc);assert.equal(state.bedMade,false);assert.equal(state.laundry,'высохло');
   assert.ok(home.history().includes('отметки роста'),'home remembers the children across eras');
   // Snapshot effects without changing the user's file or storage.
   Object.assign(state,JSON.parse(persisted));home.render(sc);room.steamUntil=room.elapsed+10000;
   if(render){await frames(2);fs.writeFileSync(require('node:path').join(__dirname,'../test-results/Живой дом.png'),game.canvas.toBuffer('image/png'));}
   let cancelled=false;const pending=home.delay(sc,5000).catch(e=>{cancelled=e.code==='DIALOGUE_CANCELLED';});
   game.scene.stop('HomePreview');await frames(2);await pending;assert.ok(cancelled,'scene shutdown cancels pending household animations');
   console.log('PASS: home stations, reachable routes, 6 persistent visual actions, washing, Tamir tea, child drawing, rest, free exploration, new day and shutdown cancellation');
 }
 // Loading a manual checkpoint must stop both a paused scene and its pause menu.
 game.scene.start('Proposal');await frames(90);
 const saved=ctx.testAPI.DEFAULT_STATE();saved.chapter='apartment';saved.flags.metTamir=true;
 assert.equal(ctx.testAPI.SaveSystem.writeSlot(3,saved),true);
 game.scene.pause('Proposal');game.scene.getScene('Proposal').scene.launch('Pause',{returnKey:'Proposal'});await frames(3);
 const adaptive=ctx.testAPI.AdaptiveUI;adaptive.game=game;adaptive.ui=ui;adaptive.root=new Element();adaptive.menu=new Element();adaptive.createSaveTools();
 assert.equal(adaptive.loadSave(saved),true);await frames(90);
 assert.equal(game.scene.isActive('Pause'),false);assert.equal(game.scene.isPaused('Proposal'),false);
 assert.equal(game.scene.isActive('Apartment'),true);assert.equal(ui.scene.isVisible(),true);assert.ok(ui.fadeRect.alpha<.01);
 const restored=game.scene.getScene('Apartment');restored.cameras.main.preRender(1);
 assert.ok(restored.cameras.main.worldView.contains(restored.player.sprite.x,restored.player.sprite.y));
 console.log('PASS: manual checkpoint load from pause, old scenes stopped, live apartment, visible camera and clear fade');
 if(process.argv.includes('--home-tests'))await require('./support/kids-kitchen-engine.cjs')({game,ctx,frames,ui});
 game.destroy(true);process.exit(0);
})().catch(e=>{errorReport(e);process.exit(1)});

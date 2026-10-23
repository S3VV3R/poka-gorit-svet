const assert=require('node:assert/strict'),vm=require('node:vm');
module.exports=async function({game,ctx,frames,ui}){
  const api=ctx.testAPI,adaptive=api.AdaptiveUI;
  const state=()=>vm.runInContext('GameState',ctx);
  let pick=0;
  async function until(condition,label,max=20000){
    for(let i=0;i<max;i++){
      await frames(1);
      if(ui._canContinueDialogue()){ui.input.keyboard.emit('keydown-ENTER',{repeat:false});ui.input.keyboard.emit('keyup-ENTER',{});}
      if(ui.choiceContainer.visible){
        const list=ui.choiceContainer.list,choices=list.filter(x=>x.input);
        const advance=list.findIndex(x=>x.text==='Продолжить историю');
        if(advance>0)list[advance-1].emit('pointerdown');else choices[Math.min(pick,choices.length-1)]?.emit('pointerdown');
      }
      if(condition())return;
    }
    throw new Error(label+': '+JSON.stringify({quest:ui.questText.text,dialogue:ui.dlgText.text,scenes:game.scene.getScenes(true).map(s=>s.scene.key)}));
  }
  function cleanSave(){
    const s=api.DEFAULT_STATE();s.chapter='kids';s.settings.textSpeed='fast';
    Object.assign(s.flags,{metTamir:true,marsHome:true,abilkaHome:true,quarrelBella:true});return s;
  }
  const ready=sc=>!sc.locked&&!ui.isConversationActive()&&ui.captionText.alpha<.01;
  for(pick=0;pick<3;pick++){
    assert.equal(adaptive.loadSave(cleanSave()),true);await frames(90);
    const sc=game.scene.getScene('Kids');assert.equal(sc.kitchenTask.stage,'tidy','v1.1.3 checkpoint recovered, no morning replay');
    assert.equal(state().ageStage,'mid');assert.ok(ui.questText.text.includes('Закончить уборку'));
    assert.equal(sc.kitchenTask.items.length,2);
    for(const item of sc.kitchenTask.items)assert.ok(api.HomeLife.path(sc,sc.player.sprite,item),'story sink/table reachable');
    assert.ok(!sc.interactions.items.some(i=>['накрыть ужин','помыть посуду','вернуться к посуде'].includes(i.label)));
    if(pick===0){
      sc.player.setPosition(296.82,66);await frames(2);
      sc.interactions.update(sc.player,false,16);sc.interactions.update(sc.player,true,400);
      assert.equal(sc.interactions.active.priority,10,'physical hold starts the current story task');
    }else{
      sc.pendingTest=api.Chronicle.run(sc,()=>api.Chronicle.activity(sc,pick===1?1:3));
    }
    await until(()=>sc.kitchenTask?.stage==='together'&&ready(sc),'cleanup to parents conversation');
    if(sc.pendingTest)await sc.pendingTest;
    assert.equal(state().flags.quarrelParents,true);assert.equal(state().flags.kidsKitchenReconcile,pick!==1);
    const saved=api.SaveSystem.read().state;
    assert.equal(adaptive.loadSave(saved),true);await frames(90);
    const resumed=game.scene.getScene('Kids');assert.equal(resumed.kitchenTask.stage,'together');assert.equal(resumed.reconcile,pick!==1);
    const before=state().stats.reconciled;
    const task=api.Chronicle.run(resumed,()=>api.Chronicle.activity(resumed,1));
    await until(()=>state().flags.kitchenWashed&&ready(resumed)&&ui.questText.text==='Подойти к Белле','kitchen washing to graduation');await task;
    assert.equal(resumed.kitchenTask,null);assert.equal(state().stats.reconciled,before+(pick!==1?1:0));
    assert.equal(state().flags.shardKept,pick===0);assert.ok(ui.fadeRect.alpha<.01);
    assert.equal(state().flags.graduationDone,false,'graduation not skipped');
    const graduationSave=api.SaveSystem.read().state;
    assert.equal(adaptive.loadSave(graduationSave),true);
    const graduate=game.scene.getScene('Kids');
    await until(()=>ready(graduate)&&ui.questText.text==='Подойти к Белле','graduation reload');
    assert.equal(state().stats.reconciled,before+(pick!==1?1:0),'reload does not duplicate reconciliation');
    const entry=graduate.interactions.items.find(i=>i.label==='подойти к Белле');assert.ok(entry);entry.onInteract();
    await until(()=>game.scene.isActive('EmptyNest'),'graduation advances to chapter 6');
    assert.equal(state().flags.chapter5Complete,true);assert.equal(state().flags.graduationDone,true);
    console.log('PASS: chapter 5 cleanup → parents choice '+pick+' → kitchen → graduation → chapter 6; old save + reload, real dialogue/hold/menu path');
  }
  // The first dishwashing task must still lead into the Bella scene, not skip it.
  const early=cleanSave();early.flags.quarrelBella=false;early.flags.kidsKitchenStage='dishes';
  assert.equal(adaptive.loadSave(early),true);await frames(90);
  const sc=game.scene.getScene('Kids');assert.equal(sc.kitchenTask.stage,'dishes');pick=0;
  const task=api.Chronicle.run(sc,()=>api.Chronicle.activity(sc,1));
  await until(()=>sc.kitchenTask?.stage==='tidy'&&ready(sc),'first washing to Bella conversation');await task;
  assert.equal(state().flags.quarrelBella,true);assert.equal(state().flags.quarrelParents,false);
  console.log('PASS: first dishes checkpoint preserves the Bella story scene');
  const fresh=api.DEFAULT_STATE();fresh.chapter='kids';
  assert.equal(adaptive.loadSave(fresh),true);await frames(90);
  assert.equal(game.scene.getScene('Kids').kitchenTask,null,'reused scene must not keep a previous playthrough task');
};

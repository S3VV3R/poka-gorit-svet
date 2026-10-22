const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
class Element {
  constructor(tag){this.tagName=tag;this.children=[];this.attributes={};this.value='';this.textContent='';this.checked=false;}
  append(...items){this.children.push(...items);if(this.tagName==='select'&&!this.value&&items[0])this.value=items[0].value;}
  replaceChildren(...items){this.children=items;}
  setAttribute(key,value){this.attributes[key]=value;}
  focus(){}
}
const source=require('./support/load-game.cjs').html();
const data=source.slice(source.indexOf('const SCRIPT_CONTENT ='),source.indexOf('const TOWN_PLACES ='));
const actions=vm.runInNewContext(data+'; SCRIPT_CONTENT.actions');
const context={document:{createElement:tag=>new Element(tag),createTextNode:text=>({textContent:text})},
  GameState:{flags:{metTamir:true,marsHome:true,abilkaHome:true},life:{season:3}},SCRIPT_CONTENT:{actions}};
const chronicle=vm.runInNewContext(source.slice(source.indexOf('const TOWN_PLACES ='),source.indexOf('const originalCommonCreate='))+'; Chronicle',context);
const state={era:6,month:1,year:0,day:1,minute:600,money:3800,pantry:8,food:6,phase:'утро',actions:{},paid:{},items:{},widowed:false};
chronicle.state=()=>state;
const nodes=Object.fromEntries(['main','nav','h2','.sub'].map(key=>[key,new Element(key)]));
chronicle.panel={querySelector:key=>nodes[key],setAttribute(){}};
chronicle.owner={};chronicle.render('Дела');
assert.deepEqual(nodes.nav.children.map(node=>node.textContent),['Дела','Альбом','Дом и планы'],'Only the three retained sections are present');
for(const removed of ['Карта','Истории']){
  chronicle.render(removed);
  assert.equal(nodes.h2.textContent,'Чем заняться?','An outdated section request safely opens activities');
  assert.ok(!nodes.nav.children.some(node=>node.textContent===removed));
}
chronicle.render('Дела');
const menuSource=source.slice(source.indexOf('const TOWN_PLACES ='));
for(const obsolete of ["keydown-C","Карта · C","C — карта","посмотреть карту","if(tab==='Истории')","if(tab==='Карта')"])
  assert.ok(!menuSource.includes(obsolete),'Removed section entry point: '+obsolete);
assert.ok(!nodes.nav.children.some(node=>node.textContent==='Люди'), 'The all-characters section is removed');
assert.ok(!source.includes("button(a,'Встретиться'"), 'No character-catalogue meeting buttons');
const main=nodes.main;
const walk=node=>[node,...(node.children||[]).flatMap(walk)];
const select=walk(main).find(n=>n.tagName==='select');
const search=walk(main).find(n=>n.tagName==='input'&&n.type==='search');
const locked=walk(main).find(n=>n.tagName==='input'&&n.type==='checkbox');
const cards=()=>main.children.at(-1).children.filter(n=>n.tagName==='article');
assert.equal(cards().length,8,'Initial menu is a short available selection');
assert.ok(cards().every(card=>!card.children.at(-1).disabled),'Initial selection contains no locked actions');
select.value='all';select.onchange();const available=cards().length;
locked.checked=true;locked.onchange();assert.equal(cards().length,120,'All authored actions remain reachable');
assert.equal(new Set(cards().map(card=>card.children[0].textContent)).size,120,'No duplicate cards');
const categoryCounts=[];
for(const option of select.children.slice(2)){select.value=option.value;select.onchange();categoryCounts.push(cards().length);}
assert.equal(categoryCounts.reduce((a,b)=>a+b,0),120,'Categories include each action once');
select.value='all';search.value='фотограф';locked.checked=false;search.oninput();
assert.ok(cards().length>0&&cards().length<available,'Search narrows the catalogue');
for(let id=1;id<=120;id++)assert.ok(chronicle.actionInfo(id)&&chronicle.actionGroup(id));
assert.equal(chronicle.actionGroup(75),'Кухня');
assert.equal(chronicle.actionGroup(101),'Кухня');
assert.equal(chronicle.actionGroup(111),'Отдых и прогулки');
state.money=0;assert.ok(chronicle.actionReason(23).includes('260'),'Unaffordable actions explain their cost');
const scene={locked:false,_chronicleBusy:false,ui:{isConversationActive:()=>false}};
assert.equal(chronicle.canOpen(scene),true,'Menu opens after a conversation finishes');
scene.ui.isConversationActive=()=>true;assert.equal(chronicle.canOpen(scene),false,'Menu cannot interrupt a queued conversation');
scene.ui.isConversationActive=()=>false;scene.ui.logContainer={visible:true};assert.equal(chronicle.canOpen(scene),false,'Dialogue log retains focus');
scene.ui.logContainer.visible=false;assert.equal(chronicle.canOpen(scene),true,'Closing the log releases the menu');
const styles=fs.readFileSync(require('node:path').join(__dirname,'../styles/activities.css'),'utf8');
for(const [hex] of styles.matchAll(/#[0-9a-f]{3,8}\b/gi)){
  const value=hex.slice(1),rgb=value.length<5?value.slice(0,3).split('').map(c=>c+c):value.slice(0,6).match(/../g);
  assert.equal(new Set(rgb).size,1,'Menu colour remains monochrome: '+hex);
}
assert.ok(source.includes('ЧЕМ ЗАНЯТЬСЯ? · J'),'Discoverable activity entry is present');
console.log('Menu verified: 8 initial choices, 120 reachable actions, categories, search, availability, and costs.');

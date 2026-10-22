function ensureCozyBalconyTextures(scene) {
  const make = (key, w, h, draw) => {
    if (scene.textures.exists(key)) return;
    const texture = scene.textures.createCanvas(key, w, h);
    const ctx = texture.context;
    ctx.imageSmoothingEnabled = false;
    draw(ctx, (color, x, y, width, height) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
    });
    texture.refresh();
  };
  make('cozy_balcony_room', 480, 320, (ctx, r) => {
    // The view is a real courtyard with facades, trees and warm windows.
    r('#151b27', 0, 0, 480, 320);
    ctx.save(); ctx.beginPath(); ctx.rect(112, 64, 246, 104); ctx.clip();
    r('#252b3b', 58, 38, 364, 115);
    const stars = [[116,53],[169,45],[218,62],[273,47],[329,59],[366,44]];
    stars.forEach(([x,y], i) => r(i % 2 ? '#b3afa3' : '#7d869a', x, y, 1, 1));
    r('#31323b', 79, 82, 98, 74);
    r('#3d3a40', 280, 69, 105, 87);
    r('#1c2530', 168, 100, 115, 56);
    r('#464047', 78, 81, 100, 3);
    r('#55474a', 279, 68, 108, 3);
    [93,120,147].forEach((x, col) => {
      [94,120].forEach((y, row) => {
        r('#202630', x - 2, y - 2, 15, 20);
        const lit = (col + row) % 3 !== 1;
        r(lit ? '#d2ab72' : '#353c48', x, y, 11, 16);
        if (lit) {
          r('#f1d599', x + 1, y + 1, 4, 11);
          r('#96774e', x + 6, y, 1, 16);
          r('#ad8a5d', x, y + 8, 11, 1);
          r('#eee0bb', x - 1, y + 16, 13, 2);
        }
      });
    });
    [294,321,348].forEach((x, col) => {
      [82,108,134].forEach((y, row) => {
        r('#232832', x - 2, y - 2, 15, 18);
        const lit = (col * 2 + row) % 4 < 2;
        r(lit ? '#be9969' : '#303b48', x, y, 11, 14);
        if (lit) {
          r('#ecd3a2', x + 2, y + 1, 3, 11);
          r('#765d48', x + 6, y, 1, 14);
        }
        r('#544b49', x - 1, y + 14, 13, 2);
      });
    });
    // Close garden canopy breaks the distant buildings into a soft view.
    const tree = (x, y, scale) => {
      r('#252d2b', x - 2, y, 4, 32);
      [[-16,0,31,16],[-22,9,43,15],[-15,-8,28,16],[-9,-15,18,13]].forEach(([a,b,w,h],i) => {
        r(['#263932','#2a4036','#31473b','#394c3d'][i],x+a*scale,y+b*scale,w*scale,h*scale);
      });
      r('#4d5d42',x-11*scale,y-7*scale,6*scale,2);
      r('#455940',x+8*scale,y+5*scale,7*scale,2);
    };
    tree(194,139,1); tree(270,151,0.8); tree(383,143,1.2);
    r('#59604e', 201, 148, 55, 3);
    r('#a09273', 213, 148, 29, 1);
    ctx.restore();

    // Solid side walls and a timber ceiling frame one intimate space.
    r('#322d2c', 101, 54, 270, 10);
    r('#775a42', 105, 64, 262, 5);
    r('#b78b59', 114, 68, 244, 2);
    r('#322c2c', 101, 64, 13, 183);
    r('#544337', 104, 67, 7, 177);
    r('#87674b', 111, 67, 3, 177);
    r('#28292c', 357, 64, 14, 183);
    r('#72533c', 358, 67, 4, 177);
    r('#a78055', 356, 67, 2, 177);

    // Floor planks, grain and the shallow front edge.
    r('#3a2e28', 114, 166, 242, 78);
    const plankColors = ['#72563e','#795c42','#806044','#76583e','#896747','#7d5c3f','#71523c'];
    ctx.save(); ctx.beginPath(); ctx.rect(115,167,240,74); ctx.clip();
    for (let y = 167, row = 0; y < 241; y += 12, row++) {
      r(plankColors[row % plankColors.length], 115, y, 240, 11);
      r('#a47a4e',115,y,240,1);
      r('#4f3b2e',115,y+11,240,1);
      for (let x = 119 + (row % 2) * 31; x < 355; x += 62) {
        r('#4f3b2e',x,y,1,14);
        r('#b28b59',x+4,y+3,17,1);
        r('#694b34',x+24,y+10,22,1);
        r('#342c27',x+3,y+11,1,1);
      }
    }
    ctx.restore();
    r('#42312a', 114, 241, 242, 6);
    r('#ae8051', 115, 241, 240, 2);
    r('#1c2227', 113, 247, 244, 4);
    // The apartment door reaches the floor; it is not hidden by floor paint.
    r('#24252a', 114, 99, 40, 109);
    r('#9a7751', 117, 102, 34, 101);
    r('#ead2a1', 120, 106, 28, 58);
    r('#c9ad7a', 122, 109, 24, 52);
    r('#775b43', 120, 165, 28, 3);
    r('#b38c5c', 120, 168, 28, 32);
    r('#9d754b', 122, 171, 24, 26);
    r('#f4dda4', 143, 177, 3, 3);
    r('#e7c493', 116, 203, 37, 3);
    r('#5c4938', 115, 206, 39, 3);
    // The railing is behind the chairs, never laid across their faces.
    r('#24282c', 154, 140, 202, 4);
    r('#bea478', 155, 140, 200, 1);
    for (let x = 159; x < 356; x += 18) {
      r('#24292c',x,144,3,23);
      r('#777065',x,144,1,22);
    }
    r('#28282a', 154, 165, 202, 3);
    r('#806748', 154, 167, 202, 2);
    // Small woven rug ties the chairs and tea table together.
    r('#5b4942', 187, 195, 99, 45);
    r('#c4ad87', 189, 197, 95, 41);
    r('#79675a', 192, 200, 89, 35);
    r('#bda789', 195, 203, 83, 29);
    for(let y=206;y<232;y+=4) r('#a58d72',197,y,79,1);
    for(let x=192;x<282;x+=5) { r('#c4ad87',x,193,1,3); r('#c4ad87',x,240,1,3); }
    // Door mat and a neat stack of books belong by the threshold.
    r('#4b4540', 120, 211, 32, 15);
    r('#bda786', 122, 213, 28, 11);
    [216,219,222].forEach(y => r('#6d5a49',125,y,22,1));
    r('#524336', 163, 229, 17, 4); r('#d4c5a0',165,229,13,1);
    r('#728074', 165, 224, 16, 4); r('#dbd0b7',166,225,12,1);
    // Hanging string lights trace the opening instead of floating in sky.
    for(let x=154;x<354;x++) {
      const y=Math.round(75+7*Math.sin((x-154)/200*Math.PI));
      r('#5d5141',x,y,1,1);
    }
    [163,199,235,271,307,343].forEach(x => {
      const y=Math.round(75+7*Math.sin((x-154)/200*Math.PI));
      r('#655442',x,y,1,4); r('#ffe3a1',x-1,y+4,3,4); r('#fff0bd',x,y+4,1,2);
    });
  });
  make('cozy_balcony_chair', 28, 38, (ctx,r) => {
    r('#2b2929',3,2,22,33); r('#604c3e',4,3,20,31);
    r('#a68a65',6,4,16,19); r('#c4ad83',7,5,14,2);
    r('#877456',8,9,12,12); r('#9f8863',7,23,14,7);
    r('#3c3029',4,33,3,5); r('#3c3029',21,33,3,5);
    r('#cfb88c',2,21,5,10); r('#cfb88c',21,21,5,10);
    r('#7f684e',2,29,5,3); r('#7f684e',21,29,5,3);
  });
  make('cozy_balcony_blanket', 28, 17, (ctx,r) => {
    r('#515b59',6,0,16,13); r('#98a39b',7,1,14,3);
    for(let x=8;x<21;x+=4) r('#b7bcb0',x,2,1,11);
    [5,9].forEach(y=>r('#313e40',6,y,16,1));
    r('#a4ada2',7,13,14,1); [7,10,13,16,19].forEach(x=>r('#bfc6b7',x,14,1,2));
    r('#b99d75',1,0,5,5); r('#b99d75',22,0,5,5);
  });
  make('cozy_balcony_tea', 29, 25, (ctx,r) => {
    r('#342d28',6,11,3,14); r('#342d28',22,11,3,14);
    r('#6b4a32',2,4,25,10); r('#c79659',2,3,25,6);
    r('#e2b67a',4,3,21,2); r('#8a5c38',2,10,25,3);
    r('#eee1bf',7,0,5,6); r('#867b68',8,0,3,1); r('#eee1bf',12,1,2,3);
    r('#899b97',18,1,5,5); r('#394b48',19,1,3,1); r('#899b97',23,2,2,3);
    r('#d4b28a',14,6,4,2); r('#f0ce94',15,6,2,1);
  });
  make('cozy_balcony_plant', 31, 48, (ctx,r) => {
    r('#342f28',8,34,16,3); r('#98714e',9,37,14,10); r('#bf9360',10,38,3,8);
    r('#c49b6b',7,33,18,4); r('#4b4b30',9,32,14,2);
    r('#526044',15,6,2,28);
    [[10,9,6,3],[17,5,6,4],[5,16,10,4],[17,14,9,4],[9,23,8,4],[17,23,11,4],[2,24,7,3],[18,30,6,3]].forEach(([x,y,w,h],i)=>{
      r(i%2?'#5f7950':'#405d42',x,y,w,h);r('#819058',x+1,y,w-3,1);
    });
  });
  make('cozy_balcony_vine', 27, 52, (ctx,r) => {
    r('#304735',14,0,2,48);
    for(let y=4;y<48;y+=7){r('#526e47',7,y,8,3);r('#6e8453',17,y+4,7,3);r('#78915c',9,y,4,1);}
    r('#5b744b',11,47,5,3);
  });
}

HouseScene.prototype.buildBalconyTableau = function () {
  ensureCozyBalconyTextures(this);
  const ox = 1400;
  this.balcOX = ox;
  this.add.image(ox, 0, 'cozy_balcony_room').setOrigin(0).setDepth(0);
  // Light spilling from the apartment stays restrained and behind the cast.
  this.add.image(ox+134,177,'glow').setScale(0.8,1).setTint(0xffce83).setAlpha(0.12).setDepth(1);
  this.balcChairA = this.add.image(ox+214,205,'cozy_balcony_chair').setOrigin(0.5,1).setDepth(190);
  this.balcChairB = this.add.image(ox+258,205,'cozy_balcony_chair').setOrigin(0.5,1).setDepth(190);
  this.balcN = this.add.sprite(ox+214,193,'nastya',4).setOrigin(0.5,1).setDepth(191);
  this.balcT = this.add.sprite(ox+258,193,'tamir',4).setOrigin(0.5,1).setDepth(191);
  this.add.image(ox+214,204,'cozy_balcony_blanket').setOrigin(0.5,1).setDepth(192);
  this.add.image(ox+258,204,'cozy_balcony_blanket').setOrigin(0.5,1).setDepth(192);
  this.add.image(ox+236,222,'cozy_balcony_tea').setOrigin(0.5,1).setDepth(194);
  this.add.image(ox+171,214,'cozy_balcony_plant').setOrigin(0.5,1).setDepth(213);
  this.add.image(ox+326,232,'cozy_balcony_plant').setOrigin(0.5,1).setDepth(231);
  this.add.image(ox+322,173,'cozy_balcony_plant').setOrigin(0.5,1).setScale(0.70).setDepth(172);
  [166,343].forEach((x,i)=>{
    const vine=this.add.image(ox+x,69,'cozy_balcony_vine').setOrigin(0.5,0).setDepth(4);
    this.tweens.add({targets:vine,angle:i?1:-1,duration:3800+i*300,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
  });
  [163,199,235,271,307,343].forEach((x,i)=>{
    const y=Math.round(75+7*Math.sin((x-154)/200*Math.PI))+6;
    const glow=this.add.image(ox+x,y,'glow').setScale(0.28).setTint(0xffd497).setAlpha(0.13).setDepth(5);
    this.tweens.add({targets:glow,alpha:0.20,duration:2400+i*173,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
  });
  [231,242].forEach((x,i)=>{
    const steam=this.add.graphics({x:ox+x,y:197}).setDepth(195);
    steam.fillStyle(0xf4e9d0,0.55);steam.fillRect(0,0,1,3);steam.fillRect(1,-3,1,3);steam.fillRect(0,-5,1,2);
    this.tweens.add({targets:steam,y:186,alpha:0,duration:2200+i*240,delay:i*900,repeat:-1,ease:'Sine.easeOut'});
  });
};

// A real scene for visual checking. It never changes age, flags or saves.
class BalconyPreviewScene extends Phaser.Scene {
  constructor() { super('BalconyPreview'); }
  create() {
    HouseScene.prototype.buildBalconyTableau.call(this);
    this.cameras.main.setBackgroundColor('#151b27').setZoom(2.6).centerOn(this.balcOX+236,160);
    const ui=this.scene.get('UI');
    if(ui) ui.scene.setVisible(false);
    const panel=document.createElement('div');
    panel.id='balcony-preview-controls';
    panel.setAttribute('aria-label','Предпросмотр балкона');
    panel.style.cssText='position:fixed;z-index:10000;left:50%;bottom:16px;transform:translateX(-50%);display:flex;gap:8px;flex-wrap:wrap;justify-content:center;max-width:95vw;padding:10px;background:#080808ed;border:1px solid #fff;color:#fff;font:14px monospace;';
    const addButton=(label,run)=>{
      const button=document.createElement('button');button.type='button';button.textContent=label;
      button.style.cssText='background:#080808;color:#fff;border:1px solid #888;padding:9px 12px;cursor:pointer;font:inherit;';
      button.onclick=run;panel.appendChild(button);return button;
    };
    const ages=[['Молодость','nastya','tamir'],['Зрелость','nastya_mid','tamir_mid'],['Поздние годы','nastya_old','tamir_old']];
    const buttons=[];
    ages.forEach(([label,n,t],index)=>buttons.push(addButton(label,()=>{
      this.balcN.setTexture(n,4);this.balcT.setTexture(t,4);
      buttons.forEach((button,i)=>{button.style.background=i===index?'#fff':'#080808';button.style.color=i===index?'#080808':'#fff';});
    })));
    buttons[0].style.background='#fff';buttons[0].style.color='#080808';
    addButton('В главное меню',()=>{
      history.replaceState(null,'',location.pathname+location.search);
      this.scene.start('MainMenu');
    });
    document.body.appendChild(panel);
    this.events.once('shutdown',()=>{panel.remove();if(ui)ui.scene.setVisible(true);});
  }
}

// The smaller room geometry is already baked into this edition's scene coordinates.
// The first home's balcony uses the same detailed outdoor corner as the later years.

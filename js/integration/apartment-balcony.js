const compactApartmentEnd=ApartmentScene.prototype.endingScene;
ApartmentScene.prototype.endingScene=async function(...args){
  if(!this.balcN)HouseScene.prototype.buildBalconyTableau.call(this);
  this.lockInput();
  await HouseScene.prototype.toBalcony.call(this,GameState.ageStage);
  await this.ui.dialogue([
    {who:'Настя',text:'Вот здесь и будем сидеть по вечерам.'},
    {who:'Тамир',text:'Два кресла. Две кружки. Уже неплохой план.'},
  ]);
  await HouseScene.prototype.fromBalcony.call(this);
  return compactApartmentEnd.apply(this,args);
};

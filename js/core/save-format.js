// Save files are data, never code. Legacy unwrapped saves remain readable.
const SaveFormat = {
  maxBytes: 8 * 1024 * 1024,
  chapters: {
    menu:'Начало', street:'Знакомство', date:'Свидание', trip:'Поездка', apartment:'Совместная жизнь',
    proposal:'Предложение', wedding:'Свадьба', youngfamily:'Молодая семья', baby:'Дети', kids:'Дом, полный голосов',
    emptynest:'Тихий дом', lateyears:'Поздние годы', ending:'Финал', complete:'Конец главы 1',
    complete2:'Конец главы 2', complete3:'Конец главы 3', complete4:'Конец главы 4', complete5:'Конец главы 5', complete6:'Конец главы 6',
  },
  object(v) { return !!v && typeof v === 'object' && !Array.isArray(v); },
  normalize(value) {
    let nodes = 0;
    const inspect = (v, depth = 0) => {
      if (++nodes > 100000 || depth > 24) throw new Error('Сохранение слишком сложное.');
      if (typeof v === 'number' && (!Number.isFinite(v) || Math.abs(v) > 1e9)) throw new Error('Некорректное число.');
      if (v && typeof v === 'object') for (const key of Object.keys(v)) {
        if (['__proto__','prototype','constructor'].includes(key)) throw new Error('Недопустимое поле сохранения.');
        inspect(v[key], depth + 1);
      }
    };
    inspect(value);
    if (!this.object(value) || !Object.hasOwn(this.chapters, value.chapter) || !this.object(value.flags)) throw new Error('Это не сохранение «Пока горит свет».');
    const merge = (defaults, input) => {
      if (input === undefined) return defaults;
      if (defaults === null) return input;
      if (Array.isArray(defaults)) {
        if (!Array.isArray(input)) throw new Error('Повреждён список в сохранении.');
        return input;
      }
      if (this.object(defaults)) {
        if (!this.object(input)) throw new Error('Повреждён раздел сохранения.');
        const result = { ...input };
        for (const key of Object.keys(defaults)) result[key] = merge(defaults[key], input[key]);
        return result;
      }
      if (typeof defaults !== typeof input) throw new Error('Неверный тип данных в сохранении.');
      return input;
    };
    const state = merge(DEFAULT_STATE(), JSON.parse(JSON.stringify(value)));
    if (value.tutorial === undefined && (state.flags.metTamir || !['menu','street'].includes(state.chapter))) state.tutorial.dismissed = true;
    if (state.flags.cast !== undefined) {
      if (!this.object(state.flags.cast)) throw new Error('Повреждён список знакомых.');
      for (const person of Object.values(state.flags.cast)) {
        if (!this.object(person) || !this.object(person.beats) || typeof person.met !== 'boolean' || typeof person.bond !== 'number' || typeof person.talks !== 'number') throw new Error('Повреждена запись о персонаже.');
      }
    }
    if (!['young','mid','old'].includes(state.ageStage) || !Number.isInteger(state.life.season) || state.life.season < 0 || state.life.season > 3) throw new Error('Неверный возраст или сезон.');
    for (const list of [state.life.memories, state.life.photos]) for (const item of list) {
      if (!this.object(item) || typeof item.title !== 'string') throw new Error('Повреждена запись альбома.');
      if (item.image && (typeof item.image !== 'string' || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(item.image))) throw new Error('Неподдерживаемое изображение.');
    }
    if (state.chronicle !== undefined) {
      const c = state.chronicle;
      if (!this.object(c)) throw new Error('Повреждён раздел жизни семьи.');
      for (const key of ['actions','decisions','events','milestones','extraBonds','items','repairs','interests','spending','paid','memories','homeLife','clockAnchors']) {
        if (c[key] !== undefined && !this.object(c[key])) throw new Error('Повреждён раздел: ' + key);
      }
      for (const key of ['reminders','journal','pendingVisits']) if (c[key] !== undefined && !Array.isArray(c[key])) throw new Error('Повреждён список: ' + key);
      for (const key of ['era','day','month','year','minute','elapsedDays','money','debt','pantry','food','energy','stress','actionSerial']) {
        if (c[key] !== undefined && typeof c[key] !== 'number') throw new Error('Повреждён счётчик: ' + key);
      }
      for (const item of c.journal || []) if (!this.object(item) || typeof item.title !== 'string') throw new Error('Повреждён журнал.');
      for (const [key,min,max] of [['era',1,9],['day',1,30],['month',1,12],['year',0,10000],['minute',0,10080]]) {
        if (c[key] !== undefined && (!Number.isInteger(c[key]) || c[key] < min || c[key] > max)) throw new Error('Неверная дата или время.');
      }
      if ((c.pendingVisits || []).some(key => !['bella','nia'].includes(key)) || (c.reminders || []).some(item => typeof item !== 'string')) throw new Error('Повреждены планы семьи.');
    }
    return state;
  },
  parse(text) {
    if (typeof text !== 'string' || text.length > this.maxBytes) throw new Error('Файл слишком большой (максимум 8 МБ).');
    let data;
    try { data = JSON.parse(text); } catch { throw new Error('Не удалось прочитать JSON-файл сохранения.'); }
    const wrapped = this.object(data) && Object.hasOwn(data, 'format');
    if (wrapped && (data.game !== 'poka-gorit-svet' || data.format !== 1)) throw new Error('Этот формат сохранения не поддерживается.');
    return { state: this.normalize(wrapped ? data.state : data), savedAt: wrapped && typeof data.savedAt === 'string' && Number.isFinite(Date.parse(data.savedAt)) ? data.savedAt : null };
  },
  encode(state) {
    const text = JSON.stringify({ game:'poka-gorit-svet', format:1, version:'1.1.4', savedAt:new Date().toISOString(), state:this.normalize(state) });
    if (text.length > this.maxBytes) throw new Error('Сохранение слишком большое.');
    return text;
  },
};

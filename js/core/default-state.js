const DEFAULT_STATE = () => ({
  chapter: 'menu',       // which checkpoint the player last reached
  flags: {
    metTamir: false,
    firstImpression: null,   // 'warm' | 'guarded'
    firstDateDone: false,
    firstKissDone: false,
    tripDone: false,
    movedInTogether: false,
    dishesResolved: null,    // 'laughed' | 'sharp'
    marsHome: false,
    abilkaHome: false,
    chapter1Complete: false,
    proposalDone: false,
    weddingStyle: null,       // 'big' | 'small' | 'family' | 'spontaneous'
    weddingDone: false,
    chapter2Complete: false,
    pregnancyRevealed: false,
    chapter3Complete: false,
    drawingOnFridge: false,
    firstWordsDone: false,
    niaBorn: false,
    chapter4Complete: false,
    schoolChoice: null,
    quarrelBella: false,
    quarrelParents: false,
    kitchenWashed: false,
    graduationDone: false,
    shardKept: false,
    photoBella: false,
    chapter5Complete: false,
    bellaLeft: false,
    niaLeft: false,
    marsGone: false,
    abilkaGone: false,
    chapter6Complete: false,
    lastBalcony: false,
    ending1: false, ending2: false, ending3: false, ending4: false,
    ending5: false, ending6: false, ending7: false, ending8: false,
  },
  stats: {
    talk: 0,        // способность разговаривать
    avoid: 0,       // «потом поговорим»
    kidsBond: 0,    // близость с детьми
    letGo: 0,       // способность отпускать
    houseAttach: 0, // привязанность к дому
    memories: 0,    // сохранённые воспоминания
    quarrels: 0,
    reconciled: 0,
    habits: 0,      // тёплые бытовые привычки
  },
  // A light-weight life layer sits underneath the authored chapters.
  // It gives the player a few genuinely lived days without turning the
  // story into a stressful management game.
  life: {
    day: 1,
    year: 1,
    season: 0,
    phase: 'утро',
    completedDays: 0,
    routines: { breakfast: 0, work: 0, rest: 0, talks: 0, familyCalls: 0 },
    homeMood: 0,
    memories: [],
    photos: [],
    seenEvents: {},
    daughters: { bella: 2, nia: 2, bellaCalls: 0, niaCalls: 0 },
  },
  tamirLife: {
    energy: 70,
    openness: 55,
    daysSinceTalk: 0,
    initiatives: 0,
    lastTopic: '',
  },
  ageStage: 'young',     // 'young' | 'mid' | 'old' — внешность героев и портреты
  relationship: {
    trust: 2,
    closeness: 2,
    warmth: 2,
  },
  settings: {
    music: 0.55,
    sfx: 0.8,
    textSpeed: 'normal',   // 'slow' | 'normal' | 'fast'
    textSize: 'normal',
  },
  tutorial: { moved:false, interacted:false, activities:false, dismissed:false },
});

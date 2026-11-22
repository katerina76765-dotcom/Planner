'use strict';

/* =========================================================
   Планер — всё хранится только на этом телефоне (localStorage).
   Резервная копия — файл .json, который вы сохраняете сами.
   ========================================================= */

const KEY = 'planner.v1';
const WD_SHORT = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
const WD_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const DAY_COLORS = ['#e9a3a8', '#a9c493', '#b9a9dc', '#ecc66a', '#eba574', '#93b8d6', '#dca3c4'];
const HABIT_COLORS = ['#f2b8a8', '#ecc66a', '#a9c493', '#93b8d6', '#b9a9dc', '#e9a3a8', '#d9b48f'];

const MOODS = [
  { v: 5, e: '☀️', t: 'Чудесно', c: '#f2c14e' },
  { v: 4, e: '🌤️', t: 'Хорошо', c: '#a9c493' },
  { v: 3, e: '⛅', t: 'Спокойно', c: '#93b8d6' },
  { v: 2, e: '🌧️', t: 'Грустно', c: '#b9a9dc' },
  { v: 1, e: '⛈️', t: 'Тяжело', c: '#a89382' }
];
const moodOf = (v) => MOODS.find((m) => m.v === v);

const APP_VERSION = 'v1';
// Питание: поля, подписи и нормы по умолчанию (меняются в настройках)
const NUTR = [
  { k: 'kcal', t: 'Калории', s: 'ккал', short: 'Ккал' },
  { k: 'p', t: 'Белки', s: 'г', short: 'Б' },
  { k: 'f', t: 'Жиры', s: 'г', short: 'Ж' },
  { k: 'c', t: 'Углеводы', s: 'г', short: 'У' },
  { k: 'fib', t: 'Клетчатка', s: 'г', short: 'Кл' }
];
const NORMS_DEFAULT = { kcal: 1800, p: 90, f: 60, c: 200, fib: 25 };
const num = (v) => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) && n >= 0 ? Math.round(n * 10) / 10 : 0; };
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
// дни, в которые повторяется закреплённое дело (пусто = каждый день)
const fixedDays = (f) => (Array.isArray(f.days) && f.days.length ? f.days : ALL_DAYS);
const daysLabel = (f) => {
  const d = fixedDays(f);
  if (d.length === 7) return 'каждый день';
  if (d.length === 5 && d.every((x) => x < 5)) return 'по будням';
  if (d.length === 2 && d.includes(5) && d.includes(6)) return 'по выходным';
  return d.slice().sort().map((x) => WD_SHORT[x].toLowerCase()).join(', ');
};
const dropSvg = (cls = '') => `<svg class="ds ${cls}" viewBox="0 0 24 24" aria-hidden="true"><use href="#drop"/></svg>`;
const starSvg = (cls = '') => `<svg class="ss ${cls}" viewBox="0 0 24 24" aria-hidden="true"><use href="#star"/></svg>`;
const drops = (n, cls = '') => n ? `<span class="drops ${cls}">${dropSvg().repeat(n)}</span>` : '';
const ui = { foodOpen: null };

/* ---------- сезоны: картинки, фразы, акценты ---------- */
const SEASONS = {
  winter: {
    days: ['i-cocoa', 'i-fir', 'i-mitten', 'i-tangerines', 'i-candle', 'i-pine', 'i-gift'],
    hero: 'i-cocoa', note: 'i-candle', garden: ['i-fir', 'i-gift', 'i-pine', 'i-tangerines'],
    decor: 'd-winter',
    tags: ['Тёплый плед,<br>ясные планы', 'Какао<br>и мечты', 'Уют<br>внутри', 'Медленная<br>зима'],
    quotes: ['Зима — время для тепла и тихих планов', 'Маленькие шаги греют лучше всего', 'Чашка какао и одно важное дело', 'Пусть каждый день будет уютным']
  },
  spring: {
    days: ['i-tulips', 'i-blossom', 'i-lily', 'i-plant', 'i-wateringcan', 'i-daisies', 'i-coffee'],
    hero: 'i-blossom', note: 'i-tulips', garden: ['i-blossom', 'i-tulips', 'i-lily', 'i-wateringcan'],
    decor: 'd-spring',
    tags: ['Всё<br>расцветает', 'Новые<br>начала', 'Шаг за шагом<br>к цветению', 'Мягче к себе'],
    quotes: ['Весна — лучшее время начать', 'Каждый день — новый росток', 'Растём понемногу, но каждый день', 'Свежий воздух, свежие идеи']
  },
  summer: {
    days: ['i-sunflower', 'i-berries', 'i-lemonade', 'i-watermelon', 'i-hydrangea', 'i-shell', 'i-daisies'],
    hero: 'i-lemonade', note: 'i-shell', garden: ['i-hydrangea', 'i-sunflower', 'i-watermelon', 'i-daisies'],
    decor: 'd-summer',
    tags: ['Солнечные<br>дни', 'Лёгкость<br>и свет', 'Лето<br>внутри', 'Больше<br>радости'],
    quotes: ['Лето — время для лёгких шагов', 'Солнце, ягоды и хорошие планы', 'Делай с удовольствием', 'Пусть день будет тёплым']
  },
  autumn: {
    days: ['i-pumpkin', 'i-coffee', 'i-apples', 'i-candle', 'i-mushrooms', 'i-autumnvase', 'i-plant'],
    hero: 'i-coffee', note: 'i-candle', garden: ['i-autumnvase', 'i-pumpkin', 'i-mushrooms', 'i-apples'],
    decor: 'd-autumn',
    tags: ['Уютные планы,<br>светлые дни', 'Мягче к себе,<br>ярче день', 'Чай, книги,<br>хорошие дни', 'Всё получится'],
    quotes: ['Маленькие шаги — большие перемены', 'Тёплый чай, ясные планы, спокойные дни', 'Бережно к себе, смело к целям', 'Каждый день — новая чистая страница']
  }
};
const seasonKey = (d) => { const m = d.getMonth(); return m === 11 || m < 2 ? 'winter' : m < 5 ? 'spring' : m < 8 ? 'summer' : 'autumn'; };
const seasonOf = (d) => SEASONS[seasonKey(d)];

/* ---------- утилиты ---------- */
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const clone = (o) => JSON.parse(JSON.stringify(o));
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const wdIndex = (d) => (d.getDay() + 6) % 7;
const mondayOf = (d) => addDays(d, -wdIndex(d));
const todayISO = () => iso(new Date());
const isValidISO = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
const fmtLong = (d) => `${d.getDate()} ${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()}`;
const art = (id, cls = '', style = '') => `<svg class="art ${cls}" style="${style}" viewBox="0 0 64 64" aria-hidden="true"><use href="#${id}"/></svg>`;
const heartSvg = (cls = '') => `<svg class="hs ${cls}" viewBox="0 0 24 24" aria-hidden="true"><use href="#heart"/></svg>`;
const pinSvg = (cls = '') => `<svg class="ps ${cls}" viewBox="0 0 24 24" aria-hidden="true"><use href="#pin"/></svg>`;
const pick = (arr, n) => arr[((n % arr.length) + arr.length) % arr.length];

/* ---------- данные ---------- */
function defaults() {
  return {
    version: 3,
    fixed: [
      { id: uid(), title: 'Заправить кровать', fav: false },
      { id: uid(), title: 'Прогулка 30 минут', fav: false }
    ],
    habits: [
      { id: uid(), icon: '☀️', title: 'Ранний подъём', color: HABIT_COLORS[0] },
      { id: uid(), icon: '💧', title: 'Пить воду', color: HABIT_COLORS[3] },
      { id: uid(), icon: '🏃‍♀️', title: 'Тренировка', color: HABIT_COLORS[2] },
      { id: uid(), icon: '📖', title: 'Читать', color: HABIT_COLORS[4] },
      { id: uid(), icon: '💛', title: 'Благодарность', color: HABIT_COLORS[1] }
    ],
    norms: { ...NORMS_DEFAULT },
    days: {},
    weeks: {},
    lastBackup: null
  };
}

function migrate(s) {
  const base = defaults();
  if (!s || typeof s !== 'object') return base;
  const days = s.days && typeof s.days === 'object' ? s.days : {};
  for (const d of Object.values(days)) {
    d.tasks ||= []; d.habits ||= {}; d.note ??= ''; d.fixedDone ||= {};
    delete d.routine; delete d.routineDone;
    d.period = Math.max(0, Math.min(3, Number(d.period) || 0));
    if (!Array.isArray(d.food)) d.food = [];
  }
  // v1: заметки недели стали списком (каждую можно отметить ★ главной)
  const weeks = s.weeks && typeof s.weeks === 'object' ? s.weeks : {};
  for (const w of Object.values(weeks)) {
    if (!Array.isArray(w.notes)) {
      w.notes = (w.note && w.note.trim()) ? [{ id: uid(), text: w.note.trim(), main: false }] : [];
    }
    delete w.note;
  }
  return {
    version: 4,
    fixed: Array.isArray(s.fixed) ? s.fixed : base.fixed,
    habits: Array.isArray(s.habits) ? s.habits : base.habits,
    norms: { ...NORMS_DEFAULT, ...(s.norms || {}) },
    days,
    weeks,
    lastBackup: s.lastBackup || null
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch (e) { /* ignore */ }
  return defaults();
}

let S = load();

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast('Не получилось сохранить — проверьте память телефона'); }
}

/*  Закреплённые дела («каждый день»):
    S.fixed — сам список. Сегодняшний день хранит его «снимок» (d.fixed),
    поэтому прошлые дни в архиве не меняются, если потом поправить список.
    Будущие дни показывают актуальный список.                          */
function ensureDay(dISO) {
  const today = todayISO();
  let d = S.days[dISO];
  if (!d) d = S.days[dISO] = { tasks: [], habits: {}, note: '', fixedDone: {}, period: 0, food: [] };
  d.fixedDone ||= {}; d.food ||= [];
  if (!d.fixed && dISO <= today) d.fixed = dISO === today ? fixedTemplateFor(dISO) : [];
  return d;
}
const getDay = (dISO) => S.days[dISO];
// закреплённые дела, которые выпадают на этот день недели
const fixedTemplateFor = (dISO) => clone(S.fixed.filter((f) => fixedDays(f).includes(wdIndex(parseISO(dISO)))));
function fixedFor(dISO) {
  const d = S.days[dISO];
  if (d && d.fixed) return d.fixed;
  return dISO >= todayISO() ? fixedTemplateFor(dISO) : [];
}
function syncTodayFixed() {
  const t = todayISO();
  const d = S.days[t];
  if (d) d.fixed = fixedTemplateFor(t);
}
function foodTotals(dISO) {
  const d = getDay(dISO);
  const tot = { kcal: 0, p: 0, f: 0, c: 0, fib: 0 };
  if (d && d.food) d.food.forEach((x) => NUTR.forEach((n) => { tot[n.k] += num(x[n.k]); }));
  NUTR.forEach((n) => { tot[n.k] = Math.round(tot[n.k] * 10) / 10; });
  return tot;
}

function dayStats(dISO) {
  const d = getDay(dISO);
  const fx = fixedFor(dISO);
  let total = fx.length, done = 0;
  if (d) {
    fx.forEach((f) => { if (d.fixedDone[f.id]) done++; });
    d.tasks.forEach((t) => { if (t.moved) return; total++; if (t.done) done++; });
  }
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}
const hasActivity = (dISO) => {
  const d = getDay(dISO);
  if (!d) return false;
  return d.tasks.length > 0 || Object.values(d.fixedDone || {}).some(Boolean) || Object.values(d.habits).some(Boolean)
    || !!(d.note && d.note.trim()) || !!d.mood || !!d.period || (d.food && d.food.length > 0);
};

/* ---------- маршрутизация ---------- */
function parseRoute() {
  const [view = 'week', arg = ''] = location.hash.replace(/^#\/?/, '').split('/');
  return { view, arg };
}
const go = (path) => { location.hash = '#/' + path; };
let pendingFocus = null;

function render() {
  const { view, arg } = parseRoute();
  const el = $('#view');
  const today = todayISO();
  let tab = view, sDate = new Date();
  if (view === 'week') { const a = isValidISO(arg) ? arg : today; sDate = addDays(mondayOf(parseISO(a)), 3); el.innerHTML = viewWeek(a); }
  else if (view === 'day') { const a = isValidISO(arg) ? arg : today; sDate = parseISO(a); el.innerHTML = viewDay(a); tab = a === today ? 'day' : 'week'; }
  else if (view === 'notes') { const a = isValidISO(arg) ? arg : today; sDate = parseISO(a); el.innerHTML = viewNotes(a); tab = 'day'; }
  else if (view === 'calendar') { const a = /^\d{4}-\d{2}$/.test(arg) ? arg : today.slice(0, 7); sDate = parseISO(a + '-15'); el.innerHTML = viewCalendar(a); }
  else if (view === 'settings') el.innerHTML = viewSettings();
  else { el.innerHTML = viewWeek(today); tab = 'week'; }
  document.body.dataset.season = seasonKey(sDate);
  document.querySelectorAll('.wn-in').forEach((t) => autosize(t));
  document.querySelectorAll('.tabbar a').forEach((a) => a.classList.toggle('active', a.dataset.tab === tab));
  if (pendingFocus) { const f = $(pendingFocus); if (f) f.focus({ preventScroll: true }); pendingFocus = null; }
}

/* ---------- декор ---------- */
function garden(season, text) {
  const g = season.garden;
  return `
    <div class="garden" aria-hidden="true">
      ${art(g[0], '', 'width:70px;height:70px')}
      ${art(g[1], '', 'width:62px;height:62px')}
      <div class="tag hang" style="--r:3deg">${text} ${heartSvg()}</div>
      ${art(g[2], '', 'width:60px;height:60px')}
      ${art(g[3], '', 'width:56px;height:56px')}
    </div>`;
}
const decor = (season, style) => `<svg class="decor" viewBox="0 0 40 40" style="${style}" aria-hidden="true"><use href="#${season.decor}"/></svg>`;

/* ---------- экран: неделя ---------- */
function viewWeek(anchorISO) {
  const mon = mondayOf(parseISO(anchorISO));
  const sun = addDays(mon, 6);
  const monISO = iso(mon);
  const today = todayISO();
  const season = seasonOf(addDays(mon, 3));
  const range = mon.getMonth() === sun.getMonth()
    ? `${mon.getDate()} – ${sun.getDate()} ${MONTHS_GEN[sun.getMonth()]}`
    : `${mon.getDate()} ${MONTHS_GEN[mon.getMonth()]} – ${sun.getDate()} ${MONTHS_GEN[sun.getMonth()]}`;
  const weekNo = Math.floor(mon.getTime() / (7 * 864e5));

  const days = [...Array(7)].map((_, i) => {
    const d = addDays(mon, i);
    const dISO = iso(d);
    const rec = getDay(dISO);
    const favs = [
      ...fixedFor(dISO).filter((f) => f.fav).map((f) => ({ id: f.id, title: f.title, done: !!(rec && rec.fixedDone[f.id]), fixed: true })),
      ...(rec ? rec.tasks.filter((t) => t.fav && !t.moved) : [])
    ];
    const st = dayStats(dISO);
    const shown = favs.slice(0, 4);
    let rows = shown.map((t) => `
      <li class="${t.done ? 'done' : ''}">
        <button class="box sm" data-act="${t.fixed ? 'toggleFixed' : 'toggleTask'}" data-d="${dISO}" data-id="${t.id}" aria-label="Отметить"></button>
        <span>${esc(t.title)}</span>
      </li>`).join('');
    if (favs.length > shown.length) rows += `<li class="more">и ещё ${favs.length - shown.length}…</li>`;
    for (let k = shown.length; k < 3; k++) rows += '<li class="blank"></li>';
    const allDone = st.total > 0 && st.done === st.total && dISO <= today;
    const mood = rec && moodOf(rec.mood);
    return `
      <article class="daycard ${dISO === today ? 'today' : ''}" style="--c:${DAY_COLORS[i]}" data-go="day/${dISO}">
        <div class="dc-head">
          <span class="badge">${WD_SHORT[i]}</span>
          <span class="dc-name">${WD_FULL[i]}</span>
          ${rec && rec.period ? drops(1, 'dc-drop') : ''}
          ${mood ? `<span class="dc-mood" title="${mood.t}">${mood.e}</span>` : ''}
          <span class="dc-heart ${allDone ? 'on' : ''}">${heartSvg()}</span>
        </div>
        <ul class="dc-list">${rows}</ul>
        <div class="dc-foot">
          <span class="dc-date">${d.getDate()}</span>
          <span class="dc-count">${st.total && (rec || dISO >= today) ? `${st.done}/${st.total}` : ''}${rec && rec.note && rec.note.trim() ? ' · ✎' : ''}</span>
          ${art(season.days[i], 'dc-art')}
        </div>
      </article>`;
  }).join('');

  const head = WD_SHORT.map((w, i) => `<th class="${iso(addDays(mon, i)) === today ? 'today' : ''}">${w}</th>`).join('');
  const habitRows = S.habits.map((h) => {
    let count = 0;
    const cells = [...Array(7)].map((_, i) => {
      const dISO = iso(addDays(mon, i));
      const on = !!(getDay(dISO) && getDay(dISO).habits[h.id]);
      if (on) count++;
      return `<td><button class="hbox ${on ? 'on' : ''}" data-act="toggleHabit" data-d="${dISO}" data-id="${h.id}" aria-label="${esc(h.title)} ${WD_SHORT[i]}"></button></td>`;
    }).join('');
    return `<tr style="--hc:${h.color}"><td class="hname"><span class="em">${esc(h.icon)}</span>${esc(h.title)}</td>${cells}<td class="hcount">${count}</td></tr>`;
  }).join('');

  // настроение недели
  const moodCells = [...Array(7)].map((_, i) => {
    const rec = getDay(iso(addDays(mon, i)));
    const m = rec && moodOf(rec.mood);
    return `<div class="wm-cell"><span class="wm-e">${m ? m.e : '<i></i>'}</span>${drops(rec && rec.period, 'wm-drops')}<span class="wm-d">${WD_SHORT[i]}</span></div>`;
  }).join('');

  const wnotes = (S.weeks[monISO] && S.weeks[monISO].notes) || [];
  const notesHtml = wnotes.map((n) => `
      <li class="wnote ${n.main ? 'main' : ''}">
        <textarea class="wn-in" rows="1" data-input="wnText" data-w="${monISO}" data-id="${n.id}" aria-label="Заметка">${esc(n.text)}</textarea>
        <button class="star-btn ${n.main ? 'on' : ''}" data-act="wnMain" data-w="${monISO}" data-id="${n.id}" aria-label="Главная заметка">${starSvg()}</button>
        <button class="del" data-act="wnDel" data-w="${monISO}" data-id="${n.id}" aria-label="Удалить">×</button>
      </li>`).join('');

  return `
    <header class="hero week-hero">
      <div class="tag hang corner-l" style="--r:-5deg">${pick(season.tags, weekNo)} ${heartSvg()}</div>
      ${art(season.hero, 'corner-r')}
      ${decor(season, 'left:30%;top:70px;transform:rotate(-20deg)')}
      ${decor(season, 'right:27%;top:4px;width:15px;height:15px;transform:rotate(25deg)')}
      <h1><span class="script big">Планер</span><span class="script sub">на неделю ${heartSvg('inline')}</span></h1>
      <div class="weeknav">
        <button class="iconbtn" data-act="week" data-d="${iso(addDays(mon, -7))}" aria-label="Прошлая неделя">‹</button>
        <span class="range">${range}</span>
        <button class="iconbtn" data-act="week" data-d="${iso(addDays(mon, 7))}" aria-label="Следующая неделя">›</button>
      </div>
      <div class="quote">${esc(pick(season.quotes, weekNo))}</div>
    </header>
    ${backupNudge()}
    <section class="week-grid">${days}</section>
    <p class="hint center">Здесь видны дела, отмеченные ${heartSvg('inline')} в плане дня</p>

    <section class="card tape" style="--tape:rgba(233,163,168,.55)">
      <div class="sec-row">
        <h2 class="sec-title" style="--hl:rgba(233,163,168,.45)">Трекер привычек ${heartSvg('inline')}</h2>
        <a class="link" href="#/settings">изменить</a>
      </div>
      ${S.habits.length ? `<table class="habit-table"><thead><tr><th></th>${head}<th></th></tr></thead><tbody>${habitRows}</tbody></table>`
        : '<div class="empty">Добавьте привычки в настройках</div>'}
    </section>

    <section class="card tape" style="--tape:rgba(147,184,214,.5)">
      <h2 class="sec-title" style="--hl:rgba(147,184,214,.45)">Настроение недели</h2>
      <div class="week-mood">${moodCells}</div>
    </section>

    <section class="card tape notes-card" style="--tape:rgba(167,185,143,.55)">
      <h2 class="sec-title" style="--hl:rgba(167,185,143,.5)">Заметки недели ${heartSvg('inline')}</h2>
      <p class="hint">${starSvg('inline')} — главная заметка: попадёт в итоги месяца в календаре</p>
      <ul class="wnotes">${notesHtml}</ul>
      <form class="add" data-form="addWeekNote" data-w="${monISO}">
        <input name="t" placeholder="Фокус недели, мысль, идея…" autocomplete="off" enterkeyhint="done" id="addNoteInput">
        <button class="btn sage" type="submit" aria-label="Добавить">+</button>
      </form>
      ${art(season.note, 'card-art')}
    </section>
    ${garden(season, 'Действуй<br>сегодня')}`;
}

function backupNudge() {
  const active = Object.keys(S.days).filter(hasActivity);
  const last = S.lastBackup ? new Date(S.lastBackup) : null;
  const days = last ? Math.floor((Date.now() - last.getTime()) / 864e5) : Infinity;
  if (last ? days < 7 : active.length < 3) return '';
  return `
    <div class="backup-nudge">
      <span>🌿 ${last ? `Последняя резервная копия — ${days} дн. назад.` : 'Вы ещё не сохраняли резервную копию.'} Сохраните, чтобы записи были в безопасности.</span>
      <button class="btn sage" data-act="backup">Сохранить</button>
    </div>`;
}

/* ---------- экран: день ---------- */
function ring(pct, color) {
  const r = 24, c = 2 * Math.PI * r;
  return `<div class="ring"><svg viewBox="0 0 58 58">
      <circle cx="29" cy="29" r="${r}" fill="none" stroke="${color}" stroke-opacity=".25" stroke-width="6"/>
      <circle cx="29" cy="29" r="${r}" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round"
        stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct / 100)}"/>
    </svg><b>${pct}%</b></div>`;
}

function viewDay(dISO) {
  const d = parseISO(dISO);
  const i = wdIndex(d);
  const color = DAY_COLORS[i];
  const today = todayISO();
  const season = seasonOf(d);
  const rec = getDay(dISO);
  const st = dayStats(dISO);
  const isPast = dISO < today;

  const fixedHtml = fixedFor(dISO).map((f) => {
    const done = !!(rec && rec.fixedDone[f.id]);
    const tpl = S.fixed.find((x) => x.id === f.id);
    const lbl = daysLabel(tpl || f);
    const editing = !isPast && tpl && ui.editDays === f.id;
    return `
      <li class="task fixed ${done ? 'done' : ''}">
        <span class="t-txt">${esc(f.title)}
          ${isPast || !tpl ? `<small class="days-lbl static">${lbl}</small>`
            : `<button class="days-lbl" data-act="editDays" data-id="${f.id}">${lbl} ▾</button>`}
        </span>
        ${isPast ? `<span class="pin-btn on static">${pinSvg()}</span>`
          : `<button class="pin-btn on" data-act="unpin" data-d="${dISO}" data-id="${f.id}" aria-label="Открепить">${pinSvg()}</button>`}
        <button class="heart-btn ${f.fav ? 'on' : ''}" data-act="fixFav" data-d="${dISO}" data-id="${f.id}" aria-label="Показать в неделе">${heartSvg()}</button>
        <button class="box" data-act="toggleFixed" data-d="${dISO}" data-id="${f.id}" aria-label="Выполнено"></button>
      </li>
      ${editing ? `<li class="days-editor">${dayPicker(tpl)}</li>` : ''}`;
  }).join('');

  // питание
  const food = rec ? rec.food || [] : [];
  const tot = foodTotals(dISO);
  const bars = NUTR.map((n) => {
    const v = tot[n.k], norm = num(S.norms[n.k]);
    const pct = norm ? Math.min(100, (v / norm) * 100) : 0;
    const state = !v ? '' : norm && v > norm * 1.1 ? 'over' : norm && v >= norm * 0.9 ? 'ok' : 'under';
    return `<div class="nbar ${state} ${n.k === 'kcal' ? 'big' : ''}">
        <span class="nl">${n.t}</span><span class="nv"><b>${v}</b> / ${norm || '—'} ${n.s}</span>
        <i><em style="width:${pct}%"></em></i>
      </div>`;
  }).join('');
  const foodRows = food.map((x) => `
      <li class="food-row">
        <div class="fr-main"><span class="fr-name">${esc(x.name || 'Без названия')}</span>
          <span class="fr-nums">${num(x.kcal)} ккал · Б ${num(x.p)} · Ж ${num(x.f)} · У ${num(x.c)} · Кл ${num(x.fib)}</span></div>
        <button class="del" data-act="foodDel" data-d="${dISO}" data-id="${x.id}" aria-label="Удалить">×</button>
      </li>`).join('');
  const foodOpen = ui.foodOpen ?? food.length > 0;

  const periodHtml = [1, 2, 3].map((k) => `
      <button class="drop-btn ${rec && rec.period >= k ? 'on' : ''}" data-act="period" data-d="${dISO}" data-v="${k}" aria-label="${k} из 3">${dropSvg()}</button>`).join('');

  const tasks = rec ? rec.tasks : [];
  const tasksHtml = tasks.map((t) => `
      <li class="task ${t.done ? 'done' : ''} ${t.moved ? 'moved' : ''}">
        <input class="t-in" value="${esc(t.title)}" data-input="taskTitle" data-d="${dISO}" data-id="${t.id}" enterkeyhint="done" aria-label="Дело">
        ${t.moved ? '<span class="moved-tag">→ перенесено</span>'
          : `<button class="pin-btn" data-act="pin" data-d="${dISO}" data-id="${t.id}" aria-label="Каждый день">${pinSvg()}</button>
             <button class="heart-btn ${t.fav ? 'on' : ''}" data-act="fav" data-d="${dISO}" data-id="${t.id}" aria-label="Показать в неделе">${heartSvg()}</button>
             <button class="box" data-act="toggleTask" data-d="${dISO}" data-id="${t.id}" aria-label="Выполнено"></button>`}
        <button class="del" data-act="delTask" data-d="${dISO}" data-id="${t.id}" aria-label="Удалить">×</button>
      </li>`).join('');

  const habitsHtml = S.habits.map((h) => {
    const on = !!(rec && rec.habits[h.id]);
    return `<button class="hchip ${on ? 'on' : ''}" style="--hc:${h.color}" data-act="toggleHabit" data-d="${dISO}" data-id="${h.id}">${esc(h.icon)} ${esc(h.title)}</button>`;
  }).join('');

  const moodHtml = MOODS.map((m) => `
      <button class="mood ${rec && rec.mood === m.v ? 'on' : ''}" style="--mc:${m.c}" data-act="mood" data-d="${dISO}" data-v="${m.v}">
        <span class="me">${m.e}</span><span class="mt">${m.t}</span>
      </button>`).join('');

  const undone = tasks.filter((t) => !t.done && !t.moved).length;
  const hasNote = rec && rec.note && rec.note.trim();
  const tag = dISO === today ? ' · <span class="today-tag">сегодня</span>' : '';
  const msg = !st.total ? 'Запишите дела на день' : st.done === st.total ? 'Всё сделано — вы умница!' : 'Шаг за шагом';

  return `
    <header class="dayhead">
      <svg class="sprig l"><use href="#sprig"/></svg>
      <svg class="sprig r"><use href="#sprig"/></svg>
      <button class="iconbtn" data-act="day" data-d="${iso(addDays(d, -1))}" aria-label="Предыдущий день">‹</button>
      <div class="title">
        <div class="script dname">${WD_FULL[i]}</div>
        <div class="ddate">${fmtLong(d)}${tag}</div>
      </div>
      <button class="iconbtn" data-act="day" data-d="${iso(addDays(d, 1))}" aria-label="Следующий день">›</button>
    </header>

    <div class="day-banner" style="--c:${color}">
      ${ring(st.pct, color)}
      <div class="txt"><strong>${st.done} из ${st.total}</strong><span class="hand">${msg}</span></div>
      ${art(season.days[i], 'banner-art')}
    </div>

    <div class="day-links">
      <a class="link" href="#/week/${dISO}">← к неделе</a>
      <a class="pill ${hasNote ? 'has' : ''}" href="#/notes/${dISO}">✎ Заметки дня${hasNote ? ' •' : ''}</a>
    </div>

    <section class="card tape" style="--tape:rgba(147,184,214,.5)">
      <h2 class="sec-title" style="--hl:rgba(147,184,214,.45)">Самочувствие</h2>
      <div class="moods">${moodHtml}</div>
      <div class="period-row">
        <span class="pr-label">Месячные</span>
        <div class="drop-btns">${periodHtml}</div>
        <span class="pr-hint">${rec && rec.period ? ['', 'слабые', 'средние', 'сильные'][rec.period] : 'нажмите, если нужно'}</span>
      </div>
    </section>

    <section class="card tape paper-card" style="--tape:${color}99">
      <h2 class="sec-title" style="--hl:rgba(232,196,106,.55)">Дела на сегодня ${heartSvg('inline')}</h2>
      <p class="hint legend-line"><span>${pinSvg('inline')} повторять</span><span>${heartSvg('inline')} в неделю</span><span><i class="mini-box"></i> выполнено</span></p>
      ${fixedHtml ? `<div class="sub-label">${pinSvg('inline')} Повторяющиеся</div><ul class="list tasks fixed-list" style="--c:${color}">${fixedHtml}</ul>` : ''}
      ${fixedHtml && tasksHtml ? '<div class="sub-label">На этот день</div>' : ''}
      <ul class="list tasks" style="--c:${color}">${tasksHtml}</ul>
      <form class="add" data-form="addTask" data-d="${dISO}">
        <input name="t" placeholder="Новое дело…" autocomplete="off" enterkeyhint="done" id="addInput">
        <button class="btn" type="submit" aria-label="Добавить">+</button>
      </form>
    </section>

    <section class="card tape" style="--tape:rgba(167,185,143,.55)">
      <h2 class="sec-title" style="--hl:rgba(167,185,143,.5)">Привычки</h2>
      <div class="habit-chips">${habitsHtml || '<span class="empty">Добавьте привычки в настройках</span>'}</div>
    </section>

    <details class="card tape food-card" style="--tape:rgba(235,165,116,.5)" data-details="food" ${foodOpen ? 'open' : ''}>
      <summary>
        <h2 class="sec-title" style="--hl:rgba(235,165,116,.45)">Питание</h2>
        <span class="food-sum">${tot.kcal} / ${num(S.norms.kcal) || '—'} ккал</span>
        <span class="chev">▾</span>
      </summary>
      <div class="nbars">${bars}</div>
      ${foodRows ? `<ul class="food-list">${foodRows}</ul>` : '<p class="hint" style="margin-top:8px">Добавляйте приёмы пищи — итог посчитается сам.</p>'}
      <form class="food-add" data-form="addFood" data-d="${dISO}">
        <input name="name" class="fa-name" placeholder="Что съели (завтрак, перекус…)" autocomplete="off">
        <div class="fa-nums">
          ${NUTR.map((n) => `<label><span>${n.short}</span><input name="${n.k}" inputmode="decimal" autocomplete="off" placeholder="0"></label>`).join('')}
          <button class="btn" type="submit" aria-label="Добавить">+</button>
        </div>
      </form>
      <a class="link" href="#/settings" style="display:inline-block;margin-top:8px">Изменить дневную норму →</a>
    </details>

    ${undone ? `<div style="margin-top:14px"><button class="btn soft block" data-act="carry" data-d="${dISO}">Перенести невыполненное (${undone}) на ${dISO === today ? 'завтра' : 'следующий день'} →</button></div>` : ''}
    ${garden(season, 'Маленькие шаги —<br>большие перемены')}
  `;
}

/* ---------- экран: заметки дня ---------- */
function viewNotes(dISO) {
  const d = parseISO(dISO);
  const rec = getDay(dISO);
  const season = seasonOf(d);
  return `
    <header class="dayhead">
      <svg class="sprig l"><use href="#sprig"/></svg>
      <svg class="sprig r"><use href="#sprig"/></svg>
      <a class="iconbtn" href="#/day/${dISO}" aria-label="Назад" style="text-decoration:none">‹</a>
      <div class="title">
        <div class="script dname">Заметки</div>
        <div class="ddate">${WD_FULL[wdIndex(d)].toLowerCase()}, ${fmtLong(d)}</div>
      </div>
      <span style="width:40px"></span>
    </header>
    <section class="card tape notes-page" style="--tape:rgba(233,163,168,.55)">
      <div class="sec-row" style="margin-bottom:4px">
        <h2 class="sec-title" style="--hl:rgba(233,163,168,.45)">Мысли дня ${heartSvg('inline')}</h2>
        <span class="saved-mark" id="savedMark">сохранено ✓</span>
      </div>
      <textarea class="lined" data-input="dayNote" data-d="${dISO}" placeholder="Как прошёл день? Что порадовало? Что хочется запомнить…">${esc(rec ? rec.note : '')}</textarea>
      ${art(season.note, 'card-art')}
    </section>`;
}

/* ---------- экран: календарь ---------- */
function cellColor(pct) {
  const a = [246, 228, 210], b = [143, 168, 118];
  const t = pct / 100;
  return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * t)).join(',')})`;
}

function viewCalendar(ym) {
  const [y, m] = ym.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const daysIn = new Date(y, m, 0).getDate();
  const today = todayISO();
  const prev = iso(new Date(y, m - 2, 1)).slice(0, 7);
  const next = iso(new Date(y, m, 1)).slice(0, 7);
  const season = seasonOf(first);

  let cells = WD_SHORT.map((w) => `<div class="wd">${w}</div>`).join('');
  for (let k = 0; k < wdIndex(first); k++) cells += '<div class="cell blank"></div>';
  let active = 0, tasksDone = 0, sumPct = 0, withTasks = 0, notes = 0, periodDays = 0;
  const moodCount = {};
  for (let n = 1; n <= daysIn; n++) {
    const dISO = `${ym}-${pad(n)}`;
    const act = hasActivity(dISO);
    const rec = getDay(dISO);
    const st = dayStats(dISO);
    let style = '';
    if (act) {
      active++;
      tasksDone += st.done;
      if (st.total) { withTasks++; sumPct += st.pct; }
      style = `background:${cellColor(st.pct)}`;
    }
    const hasNote = rec && rec.note && rec.note.trim();
    if (hasNote) notes++;
    const mood = rec && moodOf(rec.mood);
    if (mood) moodCount[mood.v] = (moodCount[mood.v] || 0) + 1;
    cells += `<a class="cell ${dISO === today ? 'today' : ''} ${dISO > today ? 'future' : ''}" href="#/day/${dISO}" style="${style}">
        ${mood ? `<span class="cmood">${mood.e}</span>` : ''}
        ${n}${act && st.total ? `<span class="pct">${st.done}/${st.total}</span>` : ''}${hasNote ? '<span class="ndot"></span>' : ''}
        ${drops(rec && rec.period, 'cdrops')}</a>`;
    if (rec && rec.period) periodDays++;
  }
  const topMood = Object.entries(moodCount).sort((a, b) => b[1] - a[1])[0];
  const top = topMood ? moodOf(Number(topMood[0])) : null;

  // главные заметки недель этого месяца (неделя относится к месяцу, в котором её четверг)
  const mainBlocks = [];
  for (let mon = mondayOf(first); mon <= new Date(y, m - 1, daysIn); mon = addDays(mon, 7)) {
    if (addDays(mon, 3).getMonth() !== m - 1) continue;
    const w = S.weeks[iso(mon)];
    const mains = w && w.notes ? w.notes.filter((x) => x.main && x.text.trim()) : [];
    if (!mains.length) continue;
    const sun = addDays(mon, 6);
    mainBlocks.push(`
      <div class="mn-week">
        <a class="mn-range" href="#/week/${iso(mon)}">${mon.getDate()} ${MONTHS_GEN[mon.getMonth()]} – ${sun.getDate()} ${MONTHS_GEN[sun.getMonth()]} →</a>
        <ul>${mains.map((x) => `<li>${starSvg('inline')} ${esc(x.text).replace(/\n/g, '<br>')}</li>`).join('')}</ul>
      </div>`);
  }

  return `
    <header class="cal-head hero">
      <svg class="sprig l" style="width:70px;height:70px"><use href="#sprig"/></svg>
      <svg class="sprig r" style="width:70px;height:70px"><use href="#sprig"/></svg>
      <h1 class="script">${MONTHS[m - 1]}</h1>
      <div class="weeknav" style="margin-top:2px">
        <a class="iconbtn" href="#/calendar/${prev}" style="text-decoration:none" aria-label="Прошлый месяц">‹</a>
        <span class="year range">${y}</span>
        <a class="iconbtn" href="#/calendar/${next}" style="text-decoration:none" aria-label="Следующий месяц">›</a>
      </div>
    </header>
    <section class="card tape" style="--tape:rgba(232,196,106,.55)">
      <div class="cal-grid">${cells}</div>
      <div class="legend">мало <i style="background:${cellColor(0)}"></i><i style="background:${cellColor(50)}"></i><i style="background:${cellColor(100)}"></i> всё сделано · <span style="color:var(--terracotta)">●</span> заметка · ${dropSvg('inline')} месячные</div>
    </section>
    <section class="card tape notes-card" style="--tape:rgba(167,185,143,.55)">
      <h2 class="sec-title" style="--hl:rgba(167,185,143,.5)">Главное за месяц ${starSvg('inline')}</h2>
      ${mainBlocks.join('') || `<p class="hint" style="margin:4px 0 0">Отмечайте ${starSvg('inline')} главные заметки на странице недели — они соберутся здесь.</p>`}
    </section>
    <section class="card">
      <h2 class="sec-title" style="--hl:rgba(232,196,106,.55)">Итоги месяца ${heartSvg('inline')}</h2>
      <div class="stats">
        <div><b>${active}</b><span>дней с записями</span></div>
        <div><b>${withTasks ? Math.round(sumPct / withTasks) : 0}%</b><span>в среднем выполнено</span></div>
        <div><b>${tasksDone}</b><span>дел сделано</span></div>
      </div>
      ${top ? `<p class="muted" style="text-align:center;margin:12px 0 0">Чаще всего настроение: <span style="font-size:18px">${top.e}</span> ${top.t.toLowerCase()}</p>` : ''}
      ${notes ? `<p class="muted" style="text-align:center;margin:6px 0 0">Заметок за месяц: ${notes}</p>` : ''}
      ${periodDays ? `<p class="muted" style="text-align:center;margin:6px 0 0">${dropSvg('inline')} Дней месячных: ${periodDays}</p>` : ''}
    </section>
    ${garden(season, 'Каждый день —<br>новая страница')}`;
}

/* ---------- экран: настройки ---------- */
function viewSettings() {
  const season = seasonOf(new Date());
  const fRows = S.fixed.map((f) => `
      <div class="edit-row" style="flex-wrap:wrap">
        ${pinSvg('inline row-pin')}
        <input class="txt" value="${esc(f.title)}" data-input="fTitle" data-id="${f.id}" placeholder="Повторяющееся дело">
        <button class="heart-btn ${f.fav ? 'on' : ''}" data-act="fixFav" data-id="${f.id}" aria-label="В неделю">${heartSvg()}</button>
        <button class="del" data-act="fDel" data-id="${f.id}" aria-label="Удалить">×</button>
        <div class="row-days">${dayPicker(f)}</div>
      </div>`).join('');
  const normRows = NUTR.map((n) => `
      <label class="norm-row"><span>${n.t}</span>
        <input inputmode="decimal" value="${num(S.norms[n.k]) || ''}" data-input="norm" data-k="${n.k}" placeholder="0"><em>${n.s}</em></label>`).join('');
  const hRows = S.habits.map((h) => `
      <div class="edit-row" style="flex-wrap:wrap">
        <input class="emoji" value="${esc(h.icon)}" data-input="hIcon" data-id="${h.id}" aria-label="Значок">
        <input class="txt" value="${esc(h.title)}" data-input="hTitle" data-id="${h.id}" placeholder="Привычка">
        <button class="del" data-act="hDel" data-id="${h.id}" aria-label="Удалить">×</button>
        <div class="swatches">${HABIT_COLORS.map((c) =>
          `<button class="sw ${c === h.color ? 'on' : ''}" style="--hc:${c}" data-act="hColor" data-id="${h.id}" data-c="${c}" aria-label="Цвет"></button>`).join('')}</div>
      </div>`).join('');
  const last = S.lastBackup ? new Date(S.lastBackup) : null;
  const daysCount = Object.keys(S.days).filter(hasActivity).length;

  return `
    <header class="hero" style="padding-bottom:4px">
      <svg class="sprig l" style="width:70px;height:70px"><use href="#sprig"/></svg>
      <svg class="sprig r" style="width:70px;height:70px"><use href="#sprig"/></svg>
      <h1><span class="script big" style="font-size:46px">Настройки</span></h1>
    </header>

    <section class="card tape" style="--tape:rgba(232,196,106,.55)">
      <h2 class="sec-title">Повторяющиеся дела</h2>
      <p class="hint">Сами появляются в выбранные дни недели (например, французский по СР и ПТ). Закрепить можно и прямо в плане дня — значком ${pinSvg('inline')}. Прошлые дни в архиве не изменятся.</p>
      ${fRows || '<div class="empty">Пока пусто</div>'}
      <div class="settings-actions"><button class="btn soft" data-act="fAdd">+ Добавить дело</button></div>
    </section>

    <section class="card tape" style="--tape:rgba(235,165,116,.5)">
      <h2 class="sec-title" style="--hl:rgba(235,165,116,.45)">Дневная норма питания</h2>
      <p class="hint">С ней сравниваются записи в разделе «Питание» на странице дня.</p>
      <div class="norms">${normRows}</div>
    </section>

    <section class="card tape" style="--tape:rgba(233,163,168,.55)">
      <h2 class="sec-title" style="--hl:rgba(233,163,168,.45)">Привычки</h2>
      <p class="hint">Отмечаются каждый день и видны в недельном трекере.</p>
      ${hRows || '<div class="empty">Пока пусто</div>'}
      <div class="settings-actions"><button class="btn soft" data-act="hAdd">+ Добавить привычку</button></div>
    </section>

    <section class="card tape" style="--tape:rgba(167,185,143,.55)">
      <h2 class="sec-title" style="--hl:rgba(167,185,143,.5)">Резервная копия</h2>
      <p class="muted" style="margin:0">Записей: ${daysCount} дн. · Последняя копия: ${last ? fmtLong(last) : 'ещё не было'}</p>
      <div class="settings-actions">
        <button class="btn sage" data-act="backup">Сохранить резервную копию</button>
        <button class="btn soft" data-act="restore">Восстановить из файла</button>
        <button class="btn soft" data-act="csv">Выгрузить таблицу (CSV)</button>
      </div>
      <div class="about">
        <p>Все записи хранятся только на этом телефоне — никуда не отправляются.</p>
        <p>Копия — это файл. Сохраните его в «Файлы», на компьютер, в Telegram «Избранное» или на почту. Лучше в два разных места.</p>
      </div>
    </section>
    <p class="hint center" style="margin-top:16px">Планер · версия ${APP_VERSION}</p>
    ${garden(season, 'Всё<br>получится')}`;
}

/* ---------- действия ---------- */
function findTask(dISO, id) { const d = getDay(dISO); return d ? d.tasks.find((t) => t.id === id) : null; }

const actions = {
  week: (el) => go('week/' + el.dataset.d),
  day: (el) => go('day/' + el.dataset.d),
  toggleTask(el) { const t = findTask(el.dataset.d, el.dataset.id); if (t && !t.moved) { t.done = !t.done; save(); render(); } },
  toggleFixed(el) { const d = ensureDay(el.dataset.d); d.fixedDone[el.dataset.id] = !d.fixedDone[el.dataset.id]; save(); render(); },
  fav(el) { const t = findTask(el.dataset.d, el.dataset.id); if (t) { t.fav = !t.fav; save(); render(); toast(t.fav ? 'Дело появится в неделе ♡' : 'Убрано из недели'); } },
  fixFav(el) {
    const id = el.dataset.id;
    const f = S.fixed.find((x) => x.id === id);
    const snap = el.dataset.d && getDay(el.dataset.d) && getDay(el.dataset.d).fixed;
    const sf = snap ? snap.find((x) => x.id === id) : null;
    const val = !((f || sf || {}).fav);
    if (f) f.fav = val;
    if (sf) sf.fav = val;
    const td = getDay(todayISO()); if (td && td.fixed) { const x = td.fixed.find((y) => y.id === id); if (x) x.fav = val; }
    save(); render(); toast(val ? 'Будет видно в неделе ♡' : 'Убрано из недели');
  },
  pin(el) {
    const dISO = el.dataset.d;
    const d = getDay(dISO); const t = findTask(dISO, el.dataset.id); if (!t) return;
    const nf = { id: uid(), title: t.title, fav: !!t.fav };
    S.fixed.push(nf);
    if (dISO >= todayISO()) {
      d.tasks = d.tasks.filter((x) => x.id !== t.id);
      if (t.done) d.fixedDone[nf.id] = true;
    }
    syncTodayFixed(); ui.editDays = nf.id; save(); render();
    toast('Закреплено 📌 Выберите дни недели под делом');
  },
  editDays(el) { ui.editDays = ui.editDays === el.dataset.id ? null : el.dataset.id; render(); },
  fixDay(el) {
    const f = S.fixed.find((x) => x.id === el.dataset.id); if (!f) return;
    const wd = Number(el.dataset.wd);
    let days = fixedDays(f).slice();
    days = days.includes(wd) ? days.filter((x) => x !== wd) : [...days, wd].sort();
    if (!days.length) { toast('Нужен хотя бы один день'); return; }
    f.days = days;
    syncTodayFixed(); save(); render();
  },
  period(el) {
    const d = ensureDay(el.dataset.d); const v = Number(el.dataset.v);
    d.period = d.period === v ? v - 1 : v; save(); render();
  },
  wnMain(el) {
    const w = S.weeks[el.dataset.w]; const n = w && w.notes.find((x) => x.id === el.dataset.id); if (!n) return;
    n.main = !n.main; save(); render(); toast(n.main ? 'Главная — появится в итогах месяца ★' : 'Больше не главная');
  },
  wnDel(el) {
    const w = S.weeks[el.dataset.w]; if (!w) return;
    const n = w.notes.find((x) => x.id === el.dataset.id);
    if (n && n.text.trim() && !confirm('Удалить заметку?')) return;
    w.notes = w.notes.filter((x) => x.id !== el.dataset.id); save(); render();
  },
  foodDel(el) {
    const d = getDay(el.dataset.d); if (!d) return;
    d.food = d.food.filter((x) => x.id !== el.dataset.id); save(); render();
  },
  unpin(el) {
    const dISO = el.dataset.d; const id = el.dataset.id;
    const f = S.fixed.find((x) => x.id === id) || (fixedFor(dISO).find((x) => x.id === id));
    if (!f || !confirm(`Открепить «${f.title}»? Оно перестанет появляться каждый день.`)) return;
    const d = ensureDay(dISO);
    // на этом дне дело остаётся обычным
    d.tasks.unshift({ id: uid(), title: f.title, done: !!d.fixedDone[id], fav: !!f.fav });
    delete d.fixedDone[id];
    S.fixed = S.fixed.filter((x) => x.id !== id);
    syncTodayFixed();
    save(); render(); toast('Откреплено');
  },
  mood(el) {
    const d = ensureDay(el.dataset.d); const v = Number(el.dataset.v);
    d.mood = d.mood === v ? null : v; save(); render();
  },
  delTask(el) {
    const d = getDay(el.dataset.d); if (!d) return;
    const t = d.tasks.find((x) => x.id === el.dataset.id);
    if (t && t.title.trim() && !confirm(`Удалить «${t.title}»?`)) return;
    d.tasks = d.tasks.filter((x) => x.id !== el.dataset.id); save(); render();
  },
  toggleHabit(el) { const d = ensureDay(el.dataset.d); d.habits[el.dataset.id] = !d.habits[el.dataset.id]; save(); render(); },
  carry(el) {
    const dISO = el.dataset.d;
    const d = getDay(dISO); if (!d) return;
    const nd = ensureDay(iso(addDays(parseISO(dISO), 1)));
    let n = 0;
    d.tasks.forEach((t) => {
      if (t.done || t.moved) return;
      nd.tasks.push({ id: uid(), title: t.title, done: false, fav: !!t.fav });
      t.moved = true; n++;
    });
    save(); render(); toast(`Перенесено дел: ${n}`);
  },
  fAdd() { S.fixed.push({ id: uid(), title: '', fav: false }); syncTodayFixed(); save(); pendingFocus = '.edit-row input.txt[value=""]'; render(); },
  fDel(el) {
    const f = S.fixed.find((x) => x.id === el.dataset.id);
    if (f && f.title && !confirm(`Убрать «${f.title}» из повторяющихся дел?`)) return;
    S.fixed = S.fixed.filter((x) => x.id !== el.dataset.id); syncTodayFixed(); save(); render();
  },
  hAdd() { S.habits.push({ id: uid(), icon: '🌸', title: '', color: HABIT_COLORS[S.habits.length % HABIT_COLORS.length] }); save(); pendingFocus = '.edit-row input.txt[value=""]'; render(); },
  hDel(el) { const h = S.habits.find((x) => x.id === el.dataset.id); if (h && h.title && !confirm(`Удалить привычку «${h.title}»?`)) return; S.habits = S.habits.filter((x) => x.id !== el.dataset.id); save(); render(); },
  hColor(el) { const h = S.habits.find((x) => x.id === el.dataset.id); if (h) { h.color = el.dataset.c; save(); render(); } },
  backup: () => backup(),
  restore: () => $('#restoreInput').click(),
  csv: () => exportCSV()
};

document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-act]');
  if (a) { e.preventDefault(); e.stopPropagation(); const fn = actions[a.dataset.act]; if (fn) fn(a); return; }
  const g = e.target.closest('[data-go]');
  if (g && !e.target.closest('input,textarea')) go(g.dataset.go);
});

function dayPicker(f) {
  const on = fixedDays(f);
  return `<div class="day-picker">${WD_SHORT.map((w, i) =>
    `<button class="dp ${on.includes(i) ? 'on' : ''}" data-act="fixDay" data-id="${f.id}" data-wd="${i}">${w}</button>`).join('')}</div>`;
}

document.addEventListener('submit', (e) => {
  const f = e.target.closest('form[data-form]');
  if (!f) return;
  e.preventDefault();
  const kind = f.dataset.form;
  if (kind === 'addTask') {
    const title = f.t.value.trim(); if (!title) return;
    ensureDay(f.dataset.d).tasks.push({ id: uid(), title, done: false, fav: false });
    save(); pendingFocus = '#addInput'; render();
  } else if (kind === 'addWeekNote') {
    const text = f.t.value.trim(); if (!text) return;
    const w = (S.weeks[f.dataset.w] ||= { notes: [] }); w.notes ||= [];
    w.notes.push({ id: uid(), text, main: false });
    save(); pendingFocus = '#addNoteInput'; render();
  } else if (kind === 'addFood') {
    const entry = { id: uid(), name: f.name.value.trim() };
    NUTR.forEach((n) => { entry[n.k] = num(f[n.k].value); });
    if (!entry.name && NUTR.every((n) => !entry[n.k])) { toast('Введите название или цифры'); return; }
    ensureDay(f.dataset.d).food.push(entry);
    ui.foodOpen = true; save(); render();
  }
});

// раскрыт/свёрнут блок «Питание»
document.addEventListener('toggle', (e) => {
  if (e.target.dataset && e.target.dataset.details === 'food') ui.foodOpen = e.target.open;
}, true);

const autosize = (el) => { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; };

let noteTimer = null;
document.addEventListener('input', (e) => {
  const el = e.target;
  const kind = el.dataset && el.dataset.input;
  if (kind === 'wnText') autosize(el);
  if (kind !== 'dayNote' && kind !== 'wnText') return;
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => {
    if (kind === 'dayNote') ensureDay(el.dataset.d).note = el.value;
    else {
      const w = S.weeks[el.dataset.w]; const n = w && w.notes.find((x) => x.id === el.dataset.id);
      if (n) n.text = el.value;
    }
    save();
    const m = $('#savedMark'); if (m) { m.classList.add('show'); setTimeout(() => m.classList.remove('show'), 1200); }
  }, 350);
});

document.addEventListener('change', (e) => {
  const el = e.target;
  const kind = el.dataset && el.dataset.input;
  if (!kind) return;
  const id = el.dataset.id;
  if (kind === 'taskTitle') {
    const t = findTask(el.dataset.d, id); if (!t) return;
    const v = el.value.trim();
    if (!v) { const d = getDay(el.dataset.d); d.tasks = d.tasks.filter((x) => x.id !== id); save(); render(); return; }
    t.title = v; save();
  } else if (kind === 'norm') {
    S.norms[el.dataset.k] = num(el.value); save();
  } else if (kind === 'fTitle') {
    const f = S.fixed.find((x) => x.id === id); if (!f) return;
    f.title = el.value.trim(); syncTodayFixed(); save();
  } else if (kind === 'hIcon' || kind === 'hTitle') {
    const h = S.habits.find((x) => x.id === id); if (!h) return;
    if (kind === 'hIcon') h.icon = el.value.trim() || '•'; else h.title = el.value.trim();
    save();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('t-in')) e.target.blur();
});

function tidy() {
  const today = todayISO();
  for (const k of Object.keys(S.days)) if (k !== today && !hasActivity(k)) delete S.days[k];
}

/* ---------- резервные копии ---------- */
async function shareOrDownload(file) {
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: file.name }); return true; }
    catch (e) { if (e && e.name === 'AbortError') return false; }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url; a.download = file.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return true;
}

async function backup() {
  tidy();
  const payload = { app: 'planner', exportedAt: new Date().toISOString(), ...S };
  const file = new File([JSON.stringify(payload, null, 1)], `planner-backup-${todayISO()}.json`, { type: 'application/json' });
  if (await shareOrDownload(file)) { S.lastBackup = new Date().toISOString(); save(); render(); toast('Резервная копия готова 🌿'); }
}

function csvCell(v) { const s = String(v ?? ''); return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }
async function exportCSV() {
  const rows = [['Дата', 'День недели', 'Тип', 'Пункт', 'Выполнено', 'В неделе']];
  for (const dISO of Object.keys(S.days).sort()) {
    if (!hasActivity(dISO)) continue;
    const d = S.days[dISO];
    const wd = WD_FULL[wdIndex(parseISO(dISO))];
    const mood = moodOf(d.mood);
    if (mood) rows.push([dISO, wd, 'Настроение', mood.t, '', '']);
    if (d.period) rows.push([dISO, wd, 'Месячные', ['', 'слабые', 'средние', 'сильные'][d.period], '', '']);
    (d.food || []).forEach((x) => rows.push([dISO, wd, 'Питание',
      `${x.name || ''}: ${num(x.kcal)} ккал, Б ${num(x.p)}, Ж ${num(x.f)}, У ${num(x.c)}, Кл ${num(x.fib)}`, '', '']));
    fixedFor(dISO).forEach((f) => rows.push([dISO, wd, 'Повторяющееся', f.title, d.fixedDone[f.id] ? 'да' : 'нет', f.fav ? 'да' : '']));
    d.tasks.forEach((t) => rows.push([dISO, wd, t.moved ? 'Дело (перенесено)' : 'Дело', t.title, t.done ? 'да' : 'нет', t.fav ? 'да' : '']));
    S.habits.forEach((h) => { if (d.habits[h.id]) rows.push([dISO, wd, 'Привычка', h.title, 'да', '']); });
    if (d.note && d.note.trim()) rows.push([dISO, wd, 'Заметка', d.note.trim(), '', '']);
  }
  for (const monISO of Object.keys(S.weeks).sort()) {
    (S.weeks[monISO].notes || []).forEach((n) => {
      if (n.text.trim()) rows.push([monISO, 'неделя', n.main ? 'Заметка недели (главная)' : 'Заметка недели', n.text.trim(), '', '']);
    });
  }
  const csv = '﻿' + rows.map((r) => r.map(csvCell).join(';')).join('\n');
  await shareOrDownload(new File([csv], `planner-${todayISO()}.csv`, { type: 'text/csv' }));
}

$('#restoreInput').addEventListener('change', async (e) => {
  const f = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    if (!data || typeof data.days !== 'object') throw new Error('bad');
    const n = Object.keys(data.days).length;
    if (!confirm(`Восстановить копию? В ней ${n} дн. записей.\nТекущие данные на телефоне будут заменены.`)) return;
    S = migrate(data);
    ensureDay(todayISO());
    save(); render(); toast('Данные восстановлены ✓');
  } catch (err) {
    toast('Это не похоже на файл копии планера');
  }
});

/* ---------- прочее ---------- */
let toastTimer = null;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

let lastDay = todayISO();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  const t = todayISO();
  if (t !== lastDay) { lastDay = t; ensureDay(t); save(); render(); }
});

window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });

ensureDay(todayISO());
save();
if (!location.hash) location.replace('#/day');
render();

if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

/* FlowTimer Notes - popup.js */
(function () {
  'use strict';

  // Cross-browser storage helpers (MV3)
  const storageArea = (typeof browser !== 'undefined' && browser.storage && browser.storage.local)
    ? browser.storage.local
    : ((typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) ? chrome.storage.local : null);
  const hasExtStorage = !!storageArea;

  const getRuntimeLastError = () => {
    try {
      return (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) || null;
    } catch (_) {
      return null;
    }
  };
  const isBrowserAPI = (typeof browser !== 'undefined' && browser.storage && browser.storage.local && storageArea === browser.storage.local);

  function storageGet(keys) {
    return new Promise((resolve, reject) => {
      try {
        if (!hasExtStorage) {
          // LocalStorage fallback for standalone testing
          const out = {};
          const arr = Array.isArray(keys) ? keys : (typeof keys === 'string' ? [keys] : Object.keys(keys || {}));
          for (const k of arr) {
            try {
              const raw = localStorage.getItem(k);
              out[k] = raw ? JSON.parse(raw) : (Array.isArray(keys) ? undefined : (keys && keys[k]));
            } catch { out[k] = undefined; }
          }
          return resolve(out);
        }
        if (isBrowserAPI) {
          storageArea.get(keys).then((result) => resolve(result || {})).catch(reject);
        } else {
          storageArea.get(keys, (result) => {
            const err = getRuntimeLastError();
            if (err) return reject(err);
            resolve(result || {});
          });
        }
      } catch (e) { reject(e); }
    });
  }
  function storageSet(items) {
    return new Promise((resolve, reject) => {
      try {
        if (!hasExtStorage) {
          try {
            for (const [k, v] of Object.entries(items || {})) {
              localStorage.setItem(k, JSON.stringify(v));
            }
            return resolve();
          } catch (e) { return reject(e); }
        }
        if (isBrowserAPI) {
          storageArea.set(items).then(() => resolve()).catch(reject);
        } else {
          storageArea.set(items, () => {
            const err = getRuntimeLastError();
            if (err) return reject(err);
            resolve();
          });
        }
      } catch (e) { reject(e); }
    });
  }

  const KEY = 'tasks_v1';
  const POM_KEY = 'pomodoro_v1';
  const TAB_KEY = 'last_tab_v1';

  async function loadTasks() {
    const obj = await storageGet([KEY]);
    return Array.isArray(obj[KEY]) ? obj[KEY] : [];
  }
  async function saveTasks(tasks) {
    await storageSet({ [KEY]: tasks });
  }

  // Utilities
  function formatDuration(ms) {
    ms = Math.max(0, Math.floor(ms));
    const s = Math.floor(ms / 1000);
    const hh = Math.floor(s / 3600);
    const mm = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    const parts = [];
    if (hh > 0) parts.push(String(hh).padStart(2, '0'));
    parts.push(String(mm).padStart(2, '0'));
    parts.push(String(ss).padStart(2, '0'));
    return parts.join(':');
  }
  function uid() {
    return 't_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
  }
  function todayStamp(d = new Date()) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }
  function isSameDay(a, b) {
    return todayStamp(new Date(a)) === todayStamp(new Date(b));
  }

  // DOM
  const els = {
    taskTitle: document.getElementById('taskTitle'),
    addBtn: document.getElementById('addBtn'),
    pauseAllBtn: document.getElementById('pauseAllBtn'),
    clearDoneBtn: document.getElementById('clearDoneBtn'),
    taskList: document.getElementById('taskList'),
    doneList: document.getElementById('doneList'),
    exportBtn: document.getElementById('exportBtn'),
    importBtn: document.getElementById('importBtn'),
    importFile: document.getElementById('importFile'),
    tabs: Array.from(document.querySelectorAll('.tab')),
    panels: Array.from(document.querySelectorAll('.tab-panel')),
    heatmapGrid: document.getElementById('heatmapGrid'),
    // Pomodoro
    pomWork: document.getElementById('pomWork'),
    pomBreak: document.getElementById('pomBreak'),
    pomLong: document.getElementById('pomLong'),
    pomCycles: document.getElementById('pomCycles'),
    pomPhase: document.getElementById('pomPhase'),
    pomTime: document.getElementById('pomTime'),
    pomStart: document.getElementById('pomStart'),
    pomPause: document.getElementById('pomPause'),
    pomReset: document.getElementById('pomReset'),
    pomCycle: document.getElementById('pomCycle'),
  };

  /** @typedef {{id:string,title:string,status:'running'|'paused'|'done',createdAt:number,startedAt:number|null,elapsedMs:number,completedAt?:number}} Task */
  /** @type {Task[]} */
  let state = [];
  let tickHandle = 0;
  let pomTickHandle = 0;

  // Responsive sizing: constrain only in extension popup
  (function setExtensionClass() {
    const href = String(location.href || '');
    if (href.startsWith('chrome-extension://') || href.startsWith('moz-extension://') || href.startsWith('safari-web-extension://')) {
      document.documentElement.classList.add('is-extension');
      document.body.classList.add('is-extension');
    }
  })();

  function computeElapsed(task, now = Date.now()) {
    if (task.status === 'running' && task.startedAt) {
      return task.elapsedMs + (now - task.startedAt);
    }
    return task.elapsedMs;
  }

  function setRunning(task, running) {
    const now = Date.now();
    if (running) {
      if (task.status !== 'running') {
        task.status = 'running';
        task.startedAt = now;
      }
    } else {
      if (task.status === 'running') {
        task.elapsedMs = computeElapsed(task, now);
        task.status = 'paused';
        task.startedAt = null;
      }
    }
  }

  function completeTask(task) {
    const now = Date.now();
    if (task.status === 'running') {
      task.elapsedMs = computeElapsed(task, now);
    }
    task.status = 'done';
    task.startedAt = null;
    task.completedAt = now;
  }

  function resetTask(task) {
    task.elapsedMs = 0;
    task.startedAt = null;
    task.status = 'paused';
    delete task.completedAt;
  }

  function el(tag, className, attrs = {}) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'text') node.textContent = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v);
    }
    return node;
  }

  function svgIcon(name) {
    const paths = {
      play: '<path d="M7 4l12 8-12 8z" fill="currentColor"/>',
      pause: '<path d="M6 5h4v14H6zM14 5h4v14h-4z" fill="currentColor"/>',
      check: '<path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
      reset: '<path d="M20 11a8 8 0 1 1-2.34-5.66" stroke="currentColor" stroke-width="2.5" fill="none"/><path d="M20 4v7h-7" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
      trash: '<path d="M4 7h16" stroke="currentColor" stroke-width="2.2" fill="none"/><path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2.2" fill="none"/><path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
    };
    const svg = `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || ''}</svg>`;
    return svg;
  }

  function render() {
    // Split into active and today's done
    const now = Date.now();
    const active = state.filter(t => t.status !== 'done');
    const doneToday = state.filter(t => t.status === 'done' && t.completedAt && isSameDay(t.completedAt, now));

    // Active list
    els.taskList.innerHTML = '';
    for (const task of active) {
      const li = el('li', 'task');
      const meta = el('div', 'meta');
      const title = el('div', 'title', { text: task.title });
      title.setAttribute('contenteditable', 'true');
      title.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); title.blur(); }
      });
      title.addEventListener('blur', async () => {
        const newTitle = title.textContent.trim();
        if (!newTitle) { title.textContent = task.title; return; }
        task.title = newTitle;
        await saveTasks(state);
      });

      const sub = el('div', 'subline');
      const badge = el('span', `badge ${task.status}`);
      badge.append(el('span', 'dot'));
      badge.append(document.createTextNode(task.status));
      sub.append(badge);

      meta.append(title, sub);

      // Big time display
      const bigTime = el('div', 'big-time', { text: formatDuration(computeElapsed(task)) });

      const controls = el('div', 'controls');
      const toggleBtn = el('button', `btn icon ${task.status === 'running' ? 'pause' : 'play'}`, { 'aria-label': task.status === 'running' ? 'Pause' : 'Start', html: svgIcon(task.status === 'running' ? 'pause' : 'play') + '<span class="sr-only">' + (task.status === 'running' ? 'Pause' : 'Start') + '</span>' });
      toggleBtn.addEventListener('click', async () => {
        setRunning(task, task.status !== 'running');
        await saveTasks(state);
        scheduleTick();
        render();
      });

      const stopBtn = el('button', 'btn icon stop', { 'aria-label': 'Done', html: svgIcon('check') + '<span class="sr-only">Done</span>' });
      stopBtn.addEventListener('click', async () => {
        completeTask(task);
        await saveTasks(state);
        render();
      });

      const resetBtn = el('button', 'btn icon reset', { 'aria-label': 'Reset', html: svgIcon('reset') + '<span class="sr-only">Reset</span>' });
      resetBtn.addEventListener('click', async () => {
        resetTask(task);
        await saveTasks(state);
        render();
      });

      const delBtn = el('button', 'btn icon danger', { 'aria-label': 'Delete', html: svgIcon('trash') + '<span class="sr-only">Delete</span>' });
      delBtn.addEventListener('click', async () => {
        const ok = confirm('Delete this task? This cannot be undone.');
        if (!ok) return;
        state = state.filter(t => t.id !== task.id);
        await saveTasks(state);
        render();
      });

      controls.append(toggleBtn, stopBtn, resetBtn, delBtn);

      li.append(meta, bigTime, controls);
      els.taskList.append(li);
    }

    // Done today list
    els.doneList.innerHTML = '';
    for (const task of doneToday) {
      const li = el('li', 'task');
      const meta = el('div', 'meta');
      const title = el('div', 'title', { text: task.title });
      title.contentEditable = false;
      const sub = el('div', 'subline');
      const badge = el('span', 'badge done');
      badge.append(el('span', 'dot'));
      badge.append(document.createTextNode('done'));
      const time = el('span', 'time', { text: formatDuration(task.elapsedMs) });
      sub.append(badge, time);
      meta.append(title, sub);

      const controls = el('div', 'controls');
      const restartBtn = el('button', 'btn small ghost', { text: 'Restart' });
      restartBtn.addEventListener('click', async () => {
        // Create a new active copy
        const newTask = {
          id: uid(),
          title: task.title,
          status: 'running',
          createdAt: Date.now(),
          startedAt: Date.now(),
          elapsedMs: 0,
        };
        state.unshift(newTask);
        await saveTasks(state);
        scheduleTick();
        render();
      });

      const delBtn = el('button', 'btn small danger ghost', { text: 'Delete' });
      delBtn.addEventListener('click', async () => {
        const ok = confirm('Delete this completed task?');
        if (!ok) return;
        state = state.filter(t => t.id !== task.id);
        await saveTasks(state);
        render();
      });

      controls.append(restartBtn, delBtn);
      li.append(meta, controls);
      els.doneList.append(li);
    }
  }

  function scheduleTick() {
    if (tickHandle) return; // already ticking
    tickHandle = window.setInterval(() => {
      const anyRunning = state.some(t => t.status === 'running');
      if (!anyRunning) {
        clearInterval(tickHandle);
        tickHandle = 0;
        // don't return early; let pomodoro tick continue independently
      }
      // Update only time text nodes for performance
      const rows = els.taskList.querySelectorAll('.task');
      let i = 0;
      for (const task of state) {
        if (task.status === 'done') continue;
        const row = rows[i++];
        if (!row) continue;
        const big = row.querySelector('.big-time');
        const val = formatDuration(computeElapsed(task));
        if (big) big.textContent = val;
      }
    }, 500);
  }

  async function addTask(title) {
    const trimmed = (title || '').trim();
    if (!trimmed) return;
    const task = {
      id: uid(),
      title: trimmed,
      status: 'paused',
      createdAt: Date.now(),
      startedAt: null,
      elapsedMs: 0,
    };
    state.unshift(task);
    await saveTasks(state);
    render();
  }

  async function pauseAll() {
    let changed = false;
    for (const t of state) {
      if (t.status === 'running') {
        setRunning(t, false);
        changed = true;
      }
    }
    if (changed) {
      await saveTasks(state);
      render();
    }
  }

  async function clearDoneToday() {
    const now = Date.now();
    const keep = state.filter(t => !(t.status === 'done' && t.completedAt && isSameDay(t.completedAt, now)));
    if (keep.length !== state.length) {
      state = keep;
      await saveTasks(state);
      render();
    }
  }

  // Tabs
  async function switchTab(name) {
    for (const tab of els.tabs) {
      const isActive = tab.getAttribute('data-tab') === name;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    }
    for (const p of els.panels) {
      const isActive = p.getAttribute('data-panel') === name;
      p.classList.toggle('is-hidden', !isActive);
      p.setAttribute('aria-hidden', String(!isActive));
    }
    await storageSet({ [TAB_KEY]: name });
    if (name === 'heatmap') buildHeatmap();
  }

  function initTabs() {
    els.tabs.forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.getAttribute('data-tab')));
    });
  }

  // Pomodoro
  /** @typedef {{work:number, break:number, long:number, cycles:number, phase:'work'|'break'|'long', remainingMs:number, running:boolean, cycleIndex:number, startedAt:number|null}} PomState */
  /** @type {PomState} */
  let pom = { work: 25, break: 5, long: 15, cycles: 4, phase: 'work', remainingMs: 25*60*1000, running: false, cycleIndex: 1, startedAt: null };

  async function loadPom() {
    const o = await storageGet([POM_KEY]);
    if (o && o[POM_KEY]) pom = { ...pom, ...o[POM_KEY] };
  }
  async function savePom() { await storageSet({ [POM_KEY]: pom }); }

  function updatePomUI() {
    els.pomWork.value = String(pom.work);
    els.pomBreak.value = String(pom.break);
    els.pomLong.value = String(pom.long);
    els.pomCycles.value = String(pom.cycles);
    els.pomPhase.textContent = pom.phase === 'work' ? 'Work' : (pom.phase === 'break' ? 'Break' : 'Long Break');
    els.pomTime.textContent = formatDuration(pom.remainingMs);
    els.pomCycle.textContent = `Cycle ${pom.cycleIndex}`;
  }

  function pomSetPhase(phase, minutes) {
    pom.phase = phase;
    pom.remainingMs = Math.max(1000, Math.round(minutes * 60 * 1000));
    pom.startedAt = null;
    pom.running = false;
    updatePomUI();
  }

  function pomNextPhase() {
    if (pom.phase === 'work') {
      if (pom.cycleIndex % pom.cycles === 0) {
        pomSetPhase('long', pom.long);
      } else {
        pomSetPhase('break', pom.break);
      }
    } else {
      pom.cycleIndex = (pom.cycleIndex % pom.cycles) + 1;
      pomSetPhase('work', pom.work);
    }
    savePom();
  }

  function pomStart() {
    if (pom.running) return;
    pom.running = true;
    pom.startedAt = Date.now();
    savePom();
    schedulePomTick();
    updatePomUI();
  }
  function pomPause() {
    if (!pom.running) return;
    const now = Date.now();
    pom.remainingMs = Math.max(0, pom.remainingMs - (now - (pom.startedAt || now)));
    pom.startedAt = null;
    pom.running = false;
    savePom();
    updatePomUI();
  }
  function pomReset() {
    pom.running = false;
    pom.startedAt = null;
    pom.cycleIndex = 1;
    pomSetPhase('work', pom.work);
    savePom();
  }

  function schedulePomTick() {
    if (pomTickHandle) return;
    pomTickHandle = window.setInterval(() => {
      if (!pom.running) {
        clearInterval(pomTickHandle);
        pomTickHandle = 0;
        return;
      }
      const now = Date.now();
      const elapsed = now - (pom.startedAt || now);
      const remaining = Math.max(0, pom.remainingMs - elapsed);
      els.pomTime.textContent = formatDuration(remaining);
      if (remaining <= 0) {
        pom.running = false;
        pom.startedAt = null;
        pom.remainingMs = 0;
        updatePomUI();
        pomNextPhase();
      }
    }, 500);
  }

  function bindPomUI() {
    // Changes to config
    const applyConfig = async () => {
      pom.work = Math.max(1, Math.min(180, Number(els.pomWork.value) || 25));
      pom.break = Math.max(1, Math.min(60, Number(els.pomBreak.value) || 5));
      pom.long = Math.max(1, Math.min(60, Number(els.pomLong.value) || 15));
      pom.cycles = Math.max(1, Math.min(12, Number(els.pomCycles.value) || 4));
      // If not running, reset remaining to current phase's minutes
      if (!pom.running) {
        const mins = pom.phase === 'work' ? pom.work : (pom.phase === 'break' ? pom.break : pom.long);
        pom.remainingMs = mins * 60 * 1000;
      }
      await savePom();
      updatePomUI();
    };
    [els.pomWork, els.pomBreak, els.pomLong, els.pomCycles].forEach(inp => inp.addEventListener('change', applyConfig));
    els.pomStart.addEventListener('click', pomStart);
    els.pomPause.addEventListener('click', pomPause);
    els.pomReset.addEventListener('click', pomReset);
  }

  // Heatmap
  function buildHeatmap() {
    if (!els.heatmapGrid) return;
    const now = todayStamp(new Date());
    const days = 84; // 12 columns x 7 rows = 84 days
    const counts = new Map();
    for (const t of state) {
      if (t.status === 'done' && t.completedAt) {
        const d = todayStamp(new Date(t.completedAt));
        counts.set(d, (counts.get(d) || 0) + 1);
      }
    }
    let max = 0;
    for (const v of counts.values()) max = Math.max(max, v);
    const cells = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = now - i * 24 * 60 * 60 * 1000;
      const count = counts.get(day) || 0;
      let level = 0;
      if (count > 0 && max > 0) {
        const ratio = count / max;
        if (ratio > 0.75) level = 4;
        else if (ratio > 0.5) level = 3;
        else if (ratio > 0.25) level = 2;
        else level = 1;
      }
      const cell = el('div', `heat-cell ${level ? 'level-' + level : ''}`, { 'data-count': String(count) });
      cell.setAttribute('title', `${new Date(day).toDateString()} • ${count} done`);
      cells.push(cell);
    }
    els.heatmapGrid.innerHTML = '';
    cells.forEach(c => els.heatmapGrid.appendChild(c));
  }

  function setupImportExport() {
    els.exportBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const data = { exportedAt: new Date().toISOString(), tasks: state };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'flowtimer-notes.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    });

    els.importBtn.addEventListener('click', (e) => {
      e.preventDefault();
      els.importFile.click();
    });

    els.importFile.addEventListener('change', async () => {
      const file = els.importFile.files && els.importFile.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        if (!json || !Array.isArray(json.tasks)) throw new Error('Invalid file');
        state = json.tasks.map((t) => ({
          id: t.id || uid(),
          title: String(t.title || 'Untitled'),
          status: t.status === 'running' || t.status === 'paused' || t.status === 'done' ? t.status : 'paused',
          createdAt: Number(t.createdAt) || Date.now(),
          startedAt: t.startedAt ? Number(t.startedAt) : null,
          elapsedMs: Math.max(0, Number(t.elapsedMs) || 0),
          completedAt: t.completedAt ? Number(t.completedAt) : undefined,
        }));
        await saveTasks(state);
        render();
      } catch (err) {
        alert('Failed to import: ' + (err && err.message ? err.message : String(err)));
      } finally {
        els.importFile.value = '';
      }
    });
  }

  function bindUI() {
    els.addBtn.addEventListener('click', async () => {
      await addTask(els.taskTitle.value);
      els.taskTitle.value = '';
      els.taskTitle.focus();
    });
    els.taskTitle.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        await addTask(els.taskTitle.value);
        els.taskTitle.value = '';
      }
    });
    els.pauseAllBtn.addEventListener('click', pauseAll);
    els.clearDoneBtn.addEventListener('click', clearDoneToday);
    setupImportExport();
    initTabs();
    bindPomUI();
  }

  async function init() {
    bindUI();
    state = await loadTasks();
    await loadPom();
    render();
    if (state.some(t => t.status === 'running')) scheduleTick();
    updatePomUI();
    // Restore last tab
    try {
      const o = await storageGet([TAB_KEY]);
      const last = o && o[TAB_KEY];
      if (last) await switchTab(last); else await switchTab('tasks');
    } catch { await switchTab('tasks'); }
    // Sticky tabs shadow
    setupStickyTabs();
  }

  function setupStickyTabs() {
    const bar = document.querySelector('.tabs-bar');
    if (!bar) return;
    const onScroll = () => {
      if (window.scrollY > 0) bar.classList.add('is-stuck');
      else bar.classList.remove('is-stuck');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  document.addEventListener('DOMContentLoaded', init);
})();

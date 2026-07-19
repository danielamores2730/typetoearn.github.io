(() => {
  const STORAGE_KEY = 'type_earn_mvp_v1';
  const POINTS_PER_WORD = 1;
  const POINTS_TO_PESOS = 10;
  const GAME_DURATION_SEC = 60;
  const MIN_WITHDRAW_POINTS = 100;

  const DICT = {
    easy: ['cat','care', 'dog','sun', 'love', 'tree','book','milk','house','bird','fish','moon','green','happy','cool','small','big','light','water','chair','table','road'],
    medium: ['planet','garden','camera','notebook','triangle','yellow','football','butter','magnetic','computer','rainbow','language','umbrella','backpack','mountain'],
    hard: ['extraordinary','international','characterization','miscommunication','electromagnetic','congratulations','intercontinental','institutional','indistinguishable','responsibilities']
  };

  const DIFF_TO_WORD_MS = { easy: 3500, medium: 3000, hard: 2500 };

  const els = (id) => document.getElementById(id);

  let state;
  function defaultState() {
    return {
      points: 0,
      referral: null,
      daily: {
        lastClaimDay: null,
        claimedTotal: 0,
      },
      history: [],
      withdrawals: []
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      state = raw ? JSON.parse(raw) : defaultState();
    } catch {
      state = defaultState();
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function dayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }

  function moneyFromPoints(p) {
    return Math.floor(p / POINTS_TO_PESOS);
  }

  function pickRandomWord(diff) {
    const list = DICT[diff];
    return list[Math.floor(Math.random() * list.length)];
  }

  // UI
  const views = {
    home: els('homeView'),
    game: els('gameView'),
    history: els('historyView'),
    withdraw: els('withdrawView')
  };

  function showView(key) {
    Object.values(views).forEach(v => (v.style.display = 'none'));
    views[key].style.display = 'block';
  }

  function setActiveDiff(diff) {
    document.querySelectorAll('.seg-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.diff === diff);
    });
  }

  let currentDifficulty = 'medium';
  function initDifficulty() {
    document.querySelectorAll('.seg-btn').forEach(b => {
      b.addEventListener('click', () => {
        currentDifficulty = b.dataset.diff;
        setActiveDiff(currentDifficulty);
      });
    });
  }

  function renderTopStats() {
    els('points').textContent = String(state.points);
    els('earnings').textContent = String(moneyFromPoints(state.points));
  }

  function renderHistory() {
    const list = els('historyList');
    list.innerHTML = '';
    if (!state.history.length) {
      const div = document.createElement('div');
      div.className = 'item muted';
      div.textContent = 'No games yet.';
      list.appendChild(div);
      return;
    }

    state.history
      .slice().reverse()
      .slice(0, 30)
      .forEach((g) => {
        const div = document.createElement('div');
        div.className = 'item';
        div.innerHTML = `
          <div class="item-title">${new Date(g.finishedAt).toLocaleString()}</div>
          <div class="muted small">Difficulty: ${g.difficulty} | WPM: ${Math.round(g.wpm)} | Accuracy: ${g.accuracy.toFixed(1)}%</div>
          <div class="muted small">Correct: ${g.correctTyped}/${g.totalTyped} | Points earned: ${g.pointsEarned}</div>
        `;
        list.appendChild(div);
      });
  }

  function renderWithdraw() {
    els('withdrawPoints').textContent = String(state.points);
    els('withdrawAmount').textContent = String(moneyFromPoints(state.points));

    const list = els('withdrawList');
    list.innerHTML = '';

    if (!state.withdrawals.length) {
      const div = document.createElement('div');
      div.className = 'item muted';
      div.textContent = 'No withdrawal requests yet.';
      list.appendChild(div);
      return;
    }

    state.withdrawals
      .slice().reverse()
      .slice(0, 30)
      .forEach((w) => {
        const div = document.createElement('div');
        div.className = 'item';
        div.innerHTML = `
          <div class="item-title">${w.status.toUpperCase()}</div>
          <div class="muted small">${new Date(w.createdAt).toLocaleString()}</div>
          <div class="muted small">Name: ${escapeHtml(w.fullName)} | GCash: ${escapeHtml(w.gcashNumber)}</div>
          <div class="muted small">Points: ${w.pointsAtRequest} | Amount: ₱${w.amountPesos}</div>
        `;
        list.appendChild(div);
      });
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'<','>':'>','"':'"',"'":'&#39;'}[c]));
  }

  // Daily rewards (simple streak-like)
  const DAILY_REWARD_POINTS = [20,30,40,50,60,80,100]; // day 1..7

  function renderDaily() {
    const today = dayKey();
    const last = state.daily.lastClaimDay;

    const claimedToday = last === today;
    if (claimedToday) {
      els('dailyStatus').textContent = 'Claimed';
      els('dailyStatus').style.color = '#16a34a';
    } else {
      els('dailyStatus').textContent = 'Not claimed';
      els('dailyStatus').style.color = '#eaf1ff';
    }

    // compute reward index by total claimed (cap at 7)
    const dayIndex = Math.min(DAILY_REWARD_POINTS.length, (state.daily.claimedTotal || 0) + 1);
    const reward = DAILY_REWARD_POINTS[dayIndex - 1] ?? DAILY_REWARD_POINTS[0];

    els('dailyMeta').textContent = `Reward today: +${reward} points (Day ${dayIndex} of streak).`;
    els('btnClaimDaily').disabled = claimedToday;
    els('btnClaimDaily').style.opacity = claimedToday ? 0.6 : 1;
  }

  function claimDaily() {
    const today = dayKey();
    if (state.daily.lastClaimDay === today) return;

    const dayIndex = Math.min(DAILY_REWARD_POINTS.length, (state.daily.claimedTotal || 0) + 1);
    const reward = DAILY_REWARD_POINTS[dayIndex - 1] ?? DAILY_REWARD_POINTS[0];

    state.points += reward;
    state.daily.lastClaimDay = today;
    state.daily.claimedTotal = (state.daily.claimedTotal || 0) + 1;

    save();
    renderTopStats();
    renderDaily();
    renderWithdraw();
    showToast(`Daily reward claimed: +${reward} points`);
  }

  // Game
  let game = null;
  function initGameUI() {
    els('typedInput').value = '';
    els('currentWord').textContent = '—';
    els('gameNotice').style.display = 'none';
  }

  function setGameRunning(running) {
    els('typedInput').disabled = !running;
    els('btnSubmit').disabled = !running;
  }

  function startGame() {
    const startAt = Date.now();
    const wordDurationMs = DIFF_TO_WORD_MS[currentDifficulty];

    game = {
      running: true,
      paused: false,
      startedAt: startAt,
      endsAt: startAt + GAME_DURATION_SEC * 1000,
      wordDurationMs,
      currentWord: pickRandomWord(currentDifficulty),
      typed: '',
      timerId: null,
      wordId: null,
      totalTyped: 0,
      correctTyped: 0,
      gameScore: 0,
      timeLeftMs: GAME_DURATION_SEC * 1000,
      lastTick: startAt,
      wordExpiresAt: startAt + wordDurationMs,
    };

    els('gameScore').textContent = '0';
    els('gameCorrect').textContent = '0';
    els('gameTotal').textContent = '0';

    els('gameNotice').style.display = 'none';
    showView('game');
    initGameUI();
    setActiveDiff(currentDifficulty);

    els('currentWord').textContent = game.currentWord;
    els('typedInput').disabled = false;
    els('btnSubmit').disabled = false;
    els('typedInput').focus();

    // Start global timer
    game.timerId = setInterval(() => {
      if (!game || !game.running || game.paused) return;

      const now = Date.now();
      game.timeLeftMs = Math.max(0, game.endsAt - now);
      const elapsedMs = now - game.startedAt;

      els('timeLeft').textContent = `${Math.ceil(game.timeLeftMs / 1000)}s`;

      const progress = (elapsedMs / (GAME_DURATION_SEC * 1000)) * 100;
      const clamped = Math.max(0, Math.min(100, progress));
      els('progressBar').style.width = `${clamped}%`;
      els('progressText').textContent = `${clamped.toFixed(0)}%`;

      const accuracy = game.totalTyped ? (game.correctTyped / game.totalTyped) * 100 : 0;
      els('accuracy').textContent = `${accuracy.toFixed(1)}%`;

      // WPM approximation: correctWords * 5 chars / 5 / minutes = correctWords / minutes
      const minutes = elapsedMs / 60000;
      const wpm = minutes > 0 ? (game.correctTyped / 1) / minutes : 0;
      els('wpm').textContent = `${Math.round(wpm)}`;

      if (game.timeLeftMs <= 0) endGame();
    }, 60);

    // Word timeout loop: advance word (counts as typed attempt only when user submits)
    game.wordId = setInterval(() => {
      if (!game || !game.running || game.paused) return;
      const now = Date.now();
      if (now >= game.wordExpiresAt) {
        game.currentWord = pickRandomWord(currentDifficulty);
        game.wordExpiresAt = now + wordDurationMs;
        game.typed = '';
        els('typedInput').value = '';
        els('currentWord').textContent = game.currentWord;
      }
    }, 60);
  }

  function submitWord() {
    if (!game || !game.running || game.paused) return;

    const typed = (els('typedInput').value || '').trim();
    if (!typed) return;

    game.totalTyped += 1;

    const isCorrect = typed.toLowerCase() === game.currentWord.toLowerCase();
    if (isCorrect) {
      game.correctTyped += 1;
      game.gameScore += POINTS_PER_WORD;
    }

    els('gameTotal').textContent = String(game.totalTyped);
    els('gameCorrect').textContent = String(game.correctTyped);
    els('gameScore').textContent = String(game.gameScore);

    // Next word immediately
    game.currentWord = pickRandomWord(currentDifficulty);
    game.wordExpiresAt = Date.now() + game.wordDurationMs;
    game.typed = '';
    els('typedInput').value = '';
    els('currentWord').textContent = game.currentWord;
  }

  function pauseGame() {
    if (!game || !game.running) return;
    game.paused = !game.paused;
    els('btnPause').textContent = game.paused ? 'Resume' : 'Pause';
    if (!game.paused) {
      // realign end times so pause doesn't shorten game
      // shift endsAt by paused duration
      // Simplified: we don't track pause duration; MVP only.
      els('typedInput').focus();
    }
  }

  function endGame() {
    if (!game || !game.running) return;
    game.running = false;

    clearInterval(game.timerId);
    clearInterval(game.wordId);

    const finishedAt = Date.now();
    const totalTyped = game.totalTyped;
    const correctTyped = game.correctTyped;
    const accuracy = totalTyped ? (correctTyped / totalTyped) * 100 : 0;

    const elapsedMs = finishedAt - game.startedAt;
    const minutes = elapsedMs / 60000;
    const wpm = minutes > 0 ? (correctTyped) / minutes : 0;

    const pointsEarned = game.gameScore;

    state.points += pointsEarned;
    save();

    renderTopStats();
    renderWithdraw();
    renderHistory();

    state.history.push({
      finishedAt,
      difficulty: currentDifficulty,
      totalTyped,
      correctTyped,
      accuracy,
      wpm,
      pointsEarned
    });
    save();

    const earningsPesos = moneyFromPoints(pointsEarned);

    els('gameSummary').innerHTML = `
      <div class="muted small">Points earned: <b>${pointsEarned}</b> (Est. ₱${earningsPesos})</div>
      <div class="muted small">Accuracy: <b>${accuracy.toFixed(1)}%</b></div>
      <div class="muted small">WPM: <b>${Math.round(wpm)}</b></div>
      <div class="muted small">Correct: <b>${correctTyped}</b> / ${totalTyped}</div>
    `;

    els('gameNotice').style.display = 'block';
  }

  function restartGame() {
    if (game && game.running) {
      clearInterval(game.timerId);
      clearInterval(game.wordId);
    }
    game = null;
    startGame();
  }

  // Withdraw
  function submitWithdrawal() {
    const fullName = (els('withdrawName').value || '').trim();
    const gcashNumber = (els('withdrawGCash').value || '').trim();

    const points = state.points;
    if (points < MIN_WITHDRAW_POINTS) {
      showToast(`Minimum is ${MIN_WITHDRAW_POINTS} points.` , true);
      return;
    }
    if (!fullName) {
      showToast('Enter full name.', true);
      return;
    }
    if (!gcashNumber) {
      showToast('Enter GCash number.', true);
      return;
    }

    const amountPesos = moneyFromPoints(points);
    if (amountPesos <= 0) {
      showToast('Points too low for ₱ amount.', true);
      return;
    }

    const withdrawalId = `w_${Date.now()}`;

    // MVP business rule: deduct withdrawn points
    state.points = Math.max(0, state.points - points);

    const req = {
      withdrawalId,
      createdAt: Date.now(),
      uid: 'local',
      fullName,
      gcashNumber,
      pointsAtRequest: points,
      amountPesos,
      status: 'pending'
    };

    state.withdrawals.push(req);
    save();

    renderTopStats();
    renderWithdraw();
    showToast('Withdrawal requested (pending).');

    els('withdrawName').value = '';
    els('withdrawGCash').value = '';
  }

  // Toast
  let toastTimer = null;
  function showToast(msg, isError=false) {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.style.position = 'fixed';
      t.style.left = '50%';
      t.style.bottom = '18px';
      t.style.transform = 'translateX(-50%)';
      t.style.padding = '12px 14px';
      t.style.borderRadius = '14px';
      t.style.border = '1px solid rgba(255,255,255,.12)';
      t.style.background = 'rgba(12,19,42,.92)';
      t.style.color = '#eaf1ff';
      t.style.zIndex = '9999';
      t.style.maxWidth = '92vw';
      t.style.fontWeight = '900';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.background = isError ? 'rgba(255,77,109,.18)' : 'rgba(12,19,42,.92)';
    t.style.borderColor = isError ? 'rgba(255,77,109,.5)' : 'rgba(255,255,255,.12)';

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      if (t) t.remove();
    }, 2200);
  }

  // Events
  function bindEvents() {
    initDifficulty();

    els('btnPlay').addEventListener('click', () => {
      restartGame();
    });

    els('btnSubmit').addEventListener('click', submitWord);
    els('typedInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitWord();
    });

    els('btnPause').addEventListener('click', pauseGame);
    els('btnRestart').addEventListener('click', restartGame);

    els('btnBackHome').addEventListener('click', () => {
      game = null;
      showView('home');
      els('typedInput').blur();
    });

    els('btnHistory').addEventListener('click', () => {
      renderHistory();
      showView('history');
    });

    els('btnWithdraw').addEventListener('click', () => {
      renderWithdraw();
      showView('withdraw');
    });

    els('btnClearHistory').addEventListener('click', () => {
      state.history = [];
      save();
      renderHistory();
      showToast('History cleared');
    });

    els('btnClaimDaily').addEventListener('click', () => claimDaily());

    els('saveReferral').addEventListener('click', () => {
      const code = (els('refInput').value || '').trim();
      if (!code) {
        state.referral = null;
        save();
        els('refStatus').textContent = 'No referral applied.';
        return;
      }
      state.referral = code;
      save();
      els('refStatus').textContent = `Referral code saved: ${code}`;
      showToast('Referral saved. Bonus awarded after first game (MVP rule).');

      // Award referral bonus after at least one completed game.
    });

    els('btnSubmitWithdraw').addEventListener('click', submitWithdrawal);
  }

  function awardReferralIfEligible(gameCompleted) {
    if (!gameCompleted) return;
    if (!state.referral) return;
    if (state._referralAwarded) return;
    // MVP rule: award 50 points once after first completed game
    state.points += 50;
    state._referralAwarded = true;
    save();
    renderTopStats();
  }

  // Patch endGame to award referral
  const _endGame = endGame;
  endGame = function() {
    const wasRunning = game && game.running;
    _endGame();
    if (wasRunning) {
      // since state history/push already happens in _endGame, award referral after
      awardReferralIfEligible(true);
      renderTopStats();
    }
  };

  function boot() {
    load();
    renderTopStats();
    renderDaily();
    renderHistory();
    renderWithdraw();

    // referral UI
    const code = state.referral;
    if (code) {
      els('refInput').value = code;
      els('refStatus').textContent = `Referral code saved: ${code}`;
    } else {
      els('refStatus').textContent = 'No referral applied.';
    }

    bindEvents();

    // Focus input when in game view
    els('typedInput').addEventListener('focus', () => {
      if (views.game.style.display !== 'none') els('typedInput').scrollLeft = 0;
    });
  }

  boot();
})();


(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  if (!canvas || !ctx) {
    return;
  }

  const ui = {
    startBtn: document.getElementById("start-btn"),
    confirmBtn: document.getElementById("confirm-btn"),
    nextBtn: document.getElementById("next-btn"),
    cameraBtn: document.getElementById("camera-btn"),
    resetBtn: document.getElementById("reset-btn"),
    hint: document.getElementById("hint"),
  };

  const CAM_W = 160;
  const CAM_H = 120;
  const MAX_LIVES = 4;
  const THEME = {
    teal: "#22495A",
    darkTeal: "#1A3642",
    beige: "#D8C7BD",
    lightBeige: "#F2EBE7",
    cream: "#FAFAFA",
    text: "#1F2937",
    muted: "#6B7280",
    softWhite: "rgba(255, 255, 255, 0.9)",
  };

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(list) {
    return list[randInt(0, list.length - 1)];
  }

  function shuffle(list) {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
    return arr;
  }

  function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y !== 0) {
      const t = x % y;
      x = y;
      y = t;
    }
    return x || 1;
  }

  function simplifyFraction(num, den) {
    if (den === 0) {
      return { num: 0, den: 1 };
    }
    const sign = den < 0 ? -1 : 1;
    const n = num * sign;
    const d = Math.abs(den);
    const g = gcd(n, d);
    return { num: n / g, den: d / g };
  }

  function toFractionLabel(value, maxDen = 12) {
    if (!Number.isFinite(value)) {
      return "?";
    }
    const rounded = Math.round(value);
    if (Math.abs(value - rounded) < 0.0001) {
      return String(rounded);
    }

    let bestNum = 0;
    let bestDen = 1;
    let bestErr = Infinity;

    for (let den = 1; den <= maxDen; den += 1) {
      const num = Math.round(value * den);
      const err = Math.abs(value - num / den);
      if (err < bestErr) {
        bestErr = err;
        bestNum = num;
        bestDen = den;
      }
    }

    const simplified = simplifyFraction(bestNum, bestDen);
    if (simplified.den === 1) {
      return String(simplified.num);
    }
    return `${simplified.num}/${simplified.den}`;
  }

  function toMixedLabel(value, maxDen = 12) {
    const sign = value < 0 ? -1 : 1;
    const abs = Math.abs(value);
    const whole = Math.floor(abs);
    const frac = abs - whole;
    if (whole === 0 || frac < 0.0001) {
      return toFractionLabel(value, maxDen);
    }

    let bestNum = 0;
    let bestDen = 1;
    let bestErr = Infinity;

    for (let den = 2; den <= maxDen; den += 1) {
      const num = Math.round(frac * den);
      const err = Math.abs(frac - num / den);
      if (num === 0) {
        continue;
      }
      if (err < bestErr) {
        bestErr = err;
        bestNum = num;
        bestDen = den;
      }
    }

    if (bestNum === 0) {
      return String(sign * whole);
    }

    const simplified = simplifyFraction(bestNum, bestDen);
    const prefix = sign < 0 ? "-" : "";
    return `${prefix}${whole} ${Math.abs(simplified.num)}/${simplified.den}`;
  }

  function makeLevel1Question() {
    const den = pick([2, 4, 8]);
    const num = randInt(1, den - 1);
    return {
      value: num / den,
      label: `${num}/${den}`,
      tip: "Temel kesir avcisi",
    };
  }

  function makeLevel2Question() {
    const den = pick([2, 3, 4, 5, 6]);
    const num = randInt(1, den - 1);
    const mul = pick([2, 3, 4]);
    return {
      value: num / den,
      label: `${num * mul}/${den * mul}`,
      tip: `${num}/${den} ile esdeger`,
    };
  }

  function makeLevel3Question(range) {
    const den = pick([2, 3, 4, 5, 6]);
    const minNum = Math.ceil(range[0] * den);
    const maxNum = Math.floor(range[1] * den);
    let num = randInt(minNum, maxNum);
    if (num === 0) {
      num = Math.random() < 0.5 ? -1 : 1;
    }
    const simplified = simplifyFraction(num, den);
    return {
      value: simplified.num / simplified.den,
      label: `${simplified.num}/${simplified.den}`,
      tip: "Negatif bolge dikkat ister",
    };
  }

  function makeLevel4Question() {
    const den = pick([2, 3, 4, 5, 6, 8]);
    const whole = randInt(1, 2);
    const num = randInt(1, den - 1);
    const improperNum = whole * den + num;
    const asMixed = Math.random() < 0.55;
    return {
      value: improperNum / den,
      label: asMixed ? `${whole} ${num}/${den}` : `${improperNum}/${den}`,
      tip: asMixed ? "Tam + kesir" : "Bilesik kesir",
    };
  }

  function makeLevel5Question(range) {
    const den = pick([3, 4, 5, 6, 7, 8, 9]);
    const minNum = Math.ceil(range[0] * den);
    const maxNum = Math.floor(range[1] * den);
    const num = randInt(minNum + 1, Math.max(minNum + 1, maxNum - 1));
    const simplified = simplifyFraction(num, den);
    return {
      value: simplified.num / simplified.den,
      label: toFractionLabel(simplified.num / simplified.den, 12),
      tip: "Kayan hat modu",
    };
  }

  function makeLevel6Question(range) {
    const den = pick([3, 4, 5, 6, 7, 8, 9, 10]);
    const minNum = Math.ceil(range[0] * den);
    const maxNum = Math.floor(range[1] * den);
    const num = randInt(minNum, maxNum);
    const simplified = simplifyFraction(num, den);
    const value = simplified.num / simplified.den;
    const fancy = Math.random() < 0.45 ? toMixedLabel(value, 12) : toFractionLabel(value, 12);
    return {
      value,
      label: fancy,
      tip: "Kamera boss savasi",
    };
  }

  const LEVELS = [
    {
      id: "L1",
      name: "Kesir Isinmasi",
      range: [0, 1],
      tickStep: 0.125,
      questions: 4,
      tolerance: 0.07,
      timeLimit: 0,
      moving: false,
      cameraFocus: false,
      generator: makeLevel1Question,
    },
    {
      id: "L2",
      name: "Esdeger Portali",
      range: [0, 1],
      tickStep: 0.125,
      questions: 4,
      tolerance: 0.04,
      timeLimit: 0,
      moving: false,
      cameraFocus: false,
      generator: makeLevel2Question,
    },
    {
      id: "L3",
      name: "Negatif Kanyon",
      range: [-2, 2],
      tickStep: 0.25,
      questions: 4,
      tolerance: 0.035,
      timeLimit: 0,
      moving: false,
      cameraFocus: false,
      generator: makeLevel3Question,
    },
    {
      id: "L4",
      name: "Bilesik Laboratuvar",
      range: [0, 3],
      tickStep: 0.25,
      questions: 4,
      tolerance: 0.034,
      timeLimit: 0,
      moving: false,
      cameraFocus: false,
      generator: makeLevel4Question,
    },
    {
      id: "L5",
      name: "Kayan Hat Sprint",
      range: [0, 3],
      tickStep: 0.25,
      questions: 5,
      tolerance: 0.038,
      timeLimit: 11,
      moving: true,
      cameraFocus: false,
      generator: makeLevel5Question,
    },
    {
      id: "L6",
      name: "Kamera Boss",
      range: [-1, 2],
      tickStep: 0.25,
      questions: 5,
      tolerance: 0.04,
      timeLimit: 10,
      moving: true,
      cameraFocus: true,
      generator: makeLevel6Question,
    },
  ];

  const cameraVideo = document.createElement("video");
  cameraVideo.autoplay = true;
  cameraVideo.muted = true;
  cameraVideo.playsInline = true;

  const cameraSampleCanvas = document.createElement("canvas");
  cameraSampleCanvas.width = CAM_W;
  cameraSampleCanvas.height = CAM_H;
  const cameraSampleCtx = cameraSampleCanvas.getContext("2d", { willReadFrequently: true });

  const state = {
    mode: "menu",
    hasPlayed: false,
    levelIndex: 0,
    level: null,
    questions: [],
    questionIndex: 0,
    markerValue: 0,
    score: 0,
    levelScore: 0,
    combo: 0,
    lives: 4,
    elapsedInLevel: 0,
    timeLeft: 0,
    lineShift: 0,
    feedback: "Kampanyayi baslat ve gezegenlere kesir yolu ciz.",
    feedbackType: "info",
    feedbackT: 0,
    particles: [],
    inputMode: "pointer",
    pointer: {
      down: false,
      x: 0,
      y: 0,
    },
    confirmRect: {
      x: 0,
      y: 0,
      w: 0,
      h: 0,
    },
    camera: {
      active: false,
      stream: null,
      baselineReady: false,
      prevFrame: new Uint8Array(CAM_W * CAM_H),
      currFrame: new Uint8Array(CAM_W * CAM_H),
      pointerX: 0.5,
      pointerY: 0.5,
      lastStableX: 0.5,
      dwell: 0,
      submitCooldown: 0,
      sampleAccumulator: 0,
      lastMotion: 0,
      errorText: "",
    },
    hudShakeT: 0,
    lifeDropT: 0,
    lifeDropText: "",
    flashT: 0,
    flashDuration: 0,
    flashColor: "34, 73, 90",
    lastTick: performance.now(),
    tickPulse: 0,
  };

  function pointInRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  function getLineGeometry() {
    return {
      x: canvas.width * 0.1,
      y: canvas.height * 0.64,
      width: canvas.width * 0.8,
    };
  }

  function getVisualRange() {
    if (!state.level) {
      return { min: 0, max: 1 };
    }
    const [min, max] = state.level.range;
    if (!state.level.moving) {
      return { min, max };
    }
    return {
      min: min + state.lineShift,
      max: max + state.lineShift,
    };
  }

  function valueToX(value) {
    const line = getLineGeometry();
    const range = getVisualRange();
    const ratio = (value - range.min) / (range.max - range.min);
    return line.x + ratio * line.width;
  }

  function xToValue(x) {
    const line = getLineGeometry();
    const range = getVisualRange();
    const ratio = clamp((x - line.x) / line.width, 0, 1);
    return range.min + ratio * (range.max - range.min);
  }

  function currentQuestion() {
    return state.questions[state.questionIndex] || null;
  }

  function buildQuestions(level) {
    if (level.id === "L1") {
      const warmups = [
        { value: 1 / 2, label: "1/2", tip: "Orta noktayi bul" },
        { value: 1 / 4, label: "1/4", tip: "Birinci ceyrek" },
        { value: 3 / 4, label: "3/4", tip: "Ucuncu ceyrek" },
        { value: 1 / 8, label: "1/8", tip: "Sekizde bir" },
        { value: 7 / 8, label: "7/8", tip: "Sona yakin" },
        { value: 3 / 8, label: "3/8", tip: "Uc sekizde" },
      ];
      return shuffle(warmups).slice(0, level.questions);
    }

    const picked = [];
    const seen = new Set();
    let guard = 0;

    while (picked.length < level.questions && guard < 240) {
      guard += 1;
      const question = level.generator(level.range);
      const key = Math.round(question.value * 10000) / 10000;
      if (key < level.range[0] || key > level.range[1]) {
        continue;
      }
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      picked.push(question);
    }

    while (picked.length < level.questions) {
      const span = level.range[1] - level.range[0];
      const value = level.range[0] + Math.random() * span;
      picked.push({
        value,
        label: toFractionLabel(value, 10),
        tip: "Serbest atis",
      });
    }

    return picked;
  }

  function updateHintText() {
    if (state.mode === "playing" && state.level) {
      const q = currentQuestion();
      const timerText = state.level.timeLimit > 0 ? ` | Sure: ${state.timeLeft.toFixed(1)} sn` : "";
      const modeText = state.inputMode === "camera" ? "kamera" : "fare/dokunmatik";
      ui.hint.textContent = `Seviye ${state.levelIndex + 1}/${LEVELS.length} (${state.level.name}) | Hedef: ${q ? q.label : "-"} | Can: ${state.lives} | Skor: ${state.score} | Mod: ${modeText}${timerText}`;
      return;
    }

    if (state.mode === "level_clear") {
      ui.hint.textContent = `${state.level ? state.level.name : "Seviye"} tamamlandi. Sonraki bolume gec.`;
      return;
    }

    if (state.mode === "game_complete") {
      ui.hint.textContent = `Harika. Kampanya bitti. Toplam skor: ${state.score}. Tekrar baslatabilirsin.`;
      return;
    }

    ui.hint.textContent = "Klavye: 1-6 seviye sec, 0 menu, Sol/Sag konum, Space/Enter kilitle, C kamera, F tam ekran.";
  }

  function updateCameraButtonText() {
    if (!state.camera.active) {
      ui.cameraBtn.textContent = "Kamera: Kapali";
      return;
    }
    ui.cameraBtn.textContent = state.inputMode === "camera" ? "Kamera: Aktif" : "Kamera: Hazir";
  }

  function updateUI() {
    ui.startBtn.hidden = state.mode !== "menu";
    ui.confirmBtn.hidden = state.mode !== "playing";
    ui.nextBtn.hidden = !(state.mode === "level_clear" || state.mode === "game_complete");
    ui.resetBtn.hidden = state.mode === "menu";

    ui.startBtn.textContent = state.hasPlayed ? "Yeniden Baslat" : "Kampanyayi Baslat";
    ui.nextBtn.textContent = state.mode === "game_complete" ? "Bastan Oyna" : "Sonraki Seviye";

    updateCameraButtonText();
    updateHintText();
  }

  function setFeedback(text, type = "info", duration = 2) {
    state.feedback = text;
    state.feedbackType = type;
    state.feedbackT = duration;
  }

  function triggerFlash(color, duration) {
    state.flashColor = color;
    state.flashDuration = duration;
    state.flashT = duration;
  }

  function triggerDamageFeedback(previousLives, nextLives) {
    const lost = Math.max(0, previousLives - nextLives);
    if (lost <= 0) {
      return;
    }
    state.hudShakeT = 0.42;
    state.lifeDropT = 1.2;
    state.lifeDropText = `CAN -${lost}`;
    triggerFlash("220, 38, 38", 0.28);
  }

  function spawnParticles(x, y, color, count = 18) {
    for (let i = 0; i < count; i += 1) {
      const speed = 90 + Math.random() * 180;
      const angle = Math.random() * Math.PI * 2;
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.6 + Math.random() * 0.9,
        ttl: 0.6 + Math.random() * 0.9,
        color,
        size: 2 + Math.random() * 4,
      });
    }

    if (state.particles.length > 260) {
      state.particles.splice(0, state.particles.length - 260);
    }
  }

  function setMarkerFromCanvasX(x) {
    if (!state.level) {
      return;
    }
    const value = xToValue(x);
    state.markerValue = normalizeMarkerValue(value);
  }

  function normalizeMarkerValue(value) {
    if (!state.level) {
      return value;
    }
    let nextValue = clamp(value, state.level.range[0], state.level.range[1]);
    if (state.level.id === "L1") {
      const step = state.level.tickStep;
      nextValue = Math.round(nextValue / step) * step;
      nextValue = clamp(nextValue, state.level.range[0], state.level.range[1]);
    }
    return nextValue;
  }

  function beginLevel(index) {
    state.levelIndex = index;
    state.level = LEVELS[index];
    state.questions = buildQuestions(state.level);
    state.questionIndex = 0;
    state.levelScore = 0;
    state.elapsedInLevel = 0;
    state.timeLeft = state.level.timeLimit;
    state.lineShift = 0;
    state.mode = "playing";
    setFeedback(`Seviye ${index + 1} basladi: ${state.level.name}`, "info", 2.2);

    const center = (state.level.range[0] + state.level.range[1]) * 0.5;
    state.markerValue = center;

    if (state.level.cameraFocus && state.inputMode !== "camera") {
      setFeedback(`Seviye ${index + 1} basladi: ${state.level.name} | Kamera modu tavsiye edilir (C)`, "info", 2.2);
    }

    updateUI();
  }

  function startCampaign() {
    startCampaignFromLevel(0);
  }

  function startCampaignFromLevel(levelIndex) {
    const safeLevelIndex = clamp(Math.floor(levelIndex), 0, LEVELS.length - 1);
    state.hasPlayed = true;
    state.score = 0;
    state.combo = 0;
    state.lives = MAX_LIVES;
    beginLevel(safeLevelIndex);
  }

  function getLevelShortcutIndex(key) {
    if (!/^[1-9]$/.test(key)) {
      return -1;
    }
    const index = Number(key) - 1;
    if (!Number.isInteger(index) || index < 0 || index >= LEVELS.length) {
      return -1;
    }
    return index;
  }

  function returnToMenu() {
    state.mode = "menu";
    state.level = null;
    state.questions = [];
    state.questionIndex = 0;
    state.markerValue = 0;
    state.elapsedInLevel = 0;
    state.lineShift = 0;
    state.timeLeft = 0;
    state.combo = 0;
    setFeedback("Menuye donuldu.", "info", 1.2);
    updateUI();
  }

  function handleQuestionAdvance() {
    state.questionIndex += 1;
    if (state.questionIndex >= state.questions.length) {
      if (state.levelIndex >= LEVELS.length - 1) {
        state.mode = "game_complete";
        setFeedback("Butun kesir sistemleri dengelendi.", "success", 3);
      } else {
        state.mode = "level_clear";
        setFeedback(`${state.level.name} temizlendi.`, "success", 2.6);
      }
      updateUI();
      return;
    }

    state.timeLeft = state.level.timeLimit;
  }

  function submitGuess(source = "manual") {
    if (state.mode !== "playing" || !state.level) {
      return;
    }

    const question = currentQuestion();
    if (!question) {
      return;
    }

    const span = state.level.range[1] - state.level.range[0];
    const tolerance = span * state.level.tolerance;
    const error = Math.abs(state.markerValue - question.value);
    const correct = error <= tolerance;

    if (correct) {
      const timeBonus = state.level.timeLimit > 0 ? Math.round(Math.max(0, state.timeLeft) * 12) : 20;
      const precisionBonus = Math.round((1 - Math.min(1, error / tolerance)) * 100);
      const comboBonus = Math.min(120, state.combo * 8);
      const gain = 140 + timeBonus + precisionBonus + comboBonus;
      state.score += gain;
      state.levelScore += 1;
      state.combo += 1;
      setFeedback(`DOGRU! ${question.label} bulundu. +${gain} puan`, "success", 2.4);
      triggerFlash("22, 163, 74", 0.18);
      spawnParticles(valueToX(question.value), getLineGeometry().y - 6, "#2fbf71", 22);

      handleQuestionAdvance();
      updateHintText();
    } else {
      const previousLives = state.lives;
      state.lives -= 1;
      state.combo = 0;
      setFeedback(`YANLIS! Hedef ${question.label}. Can -1 (${previousLives} -> ${state.lives})`, "error", 3);
      triggerDamageFeedback(previousLives, state.lives);
      spawnParticles(valueToX(state.markerValue), getLineGeometry().y - 6, "#e65100", 16);

      if (state.lives <= 0) {
        setFeedback("Canlar bitti. Kampanyayi yeniden baslat.", "error", 2.8);
        state.mode = "menu";
        updateUI();
        return;
      }
    }
  }

  function timeoutPenalty() {
    if (state.mode !== "playing" || !state.level) {
      return;
    }

    const previousLives = state.lives;
    state.lives -= 1;
    state.combo = 0;
    setFeedback(`SURE DOLDU! Can -1 (${previousLives} -> ${state.lives})`, "warning", 2.4);
    triggerDamageFeedback(previousLives, state.lives);

    if (state.lives <= 0) {
      setFeedback("Sureyi yetistiremedin. Yeniden dene.", "error", 2.8);
      state.mode = "menu";
      updateUI();
      return;
    }

    handleQuestionAdvance();
    updateHintText();
  }

  function ensureCanvasSize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(760, Math.floor(rect.width));
    const h = Math.max(420, Math.floor(rect.height));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  async function ensureCameraActive() {
    if (state.camera.active) {
      return true;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      state.camera.errorText = "Tarayici kamera API yok.";
      setFeedback(state.camera.errorText, "warning", 2.2);
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      state.camera.stream = stream;
      cameraVideo.srcObject = stream;
      await cameraVideo.play();
      state.camera.active = true;
      state.camera.baselineReady = false;
      state.camera.pointerX = 0.5;
      state.camera.pointerY = 0.5;
      state.camera.lastStableX = 0.5;
      state.camera.dwell = 0;
      state.camera.submitCooldown = 0;
      state.camera.sampleAccumulator = 0;
      state.camera.lastMotion = 0;
      state.camera.errorText = "";
      updateCameraButtonText();
      return true;
    } catch (error) {
      state.camera.errorText = "Kamera acilamadi. Izin verip tekrar dene.";
      setFeedback(state.camera.errorText, "warning", 2.6);
      return false;
    }
  }

  function stopCamera() {
    if (!state.camera.stream) {
      state.camera.active = false;
      return;
    }

    state.camera.stream.getTracks().forEach((track) => track.stop());
    state.camera.stream = null;
    state.camera.active = false;
    state.camera.baselineReady = false;
    state.camera.lastMotion = 0;
    updateCameraButtonText();
  }

  async function toggleCameraMode() {
    if (state.inputMode === "camera") {
      state.inputMode = "pointer";
      setFeedback("Kamera imleci pasif.", "info", 1.2);
      updateUI();
      return;
    }

    const ok = await ensureCameraActive();
    if (!ok) {
      updateUI();
      return;
    }

    state.inputMode = "camera";
    setFeedback("Kamera imleci aktif. Parmagini hareket ettir, sabit tutunca kilitler.", "info", 2.4);
    updateUI();
  }

  function processCamera(dt) {
    if (!state.camera.active || !cameraSampleCtx || cameraVideo.readyState < 2) {
      return;
    }

    state.camera.sampleAccumulator += dt;
    if (state.camera.sampleAccumulator < 0.07) {
      return;
    }
    state.camera.sampleAccumulator = 0;

    cameraSampleCtx.drawImage(cameraVideo, 0, 0, CAM_W, CAM_H);
    const pixels = cameraSampleCtx.getImageData(0, 0, CAM_W, CAM_H).data;

    if (!state.camera.baselineReady) {
      for (let i = 0; i < CAM_W * CAM_H; i += 1) {
        const p = i * 4;
        state.camera.prevFrame[i] = Math.round(pixels[p] * 0.299 + pixels[p + 1] * 0.587 + pixels[p + 2] * 0.114);
      }
      state.camera.baselineReady = true;
      return;
    }

    let motion = 0;
    let xSum = 0;
    let ySum = 0;

    for (let i = 0; i < CAM_W * CAM_H; i += 1) {
      const p = i * 4;
      const gray = Math.round(pixels[p] * 0.299 + pixels[p + 1] * 0.587 + pixels[p + 2] * 0.114);
      state.camera.currFrame[i] = gray;
      const diff = Math.abs(gray - state.camera.prevFrame[i]);
      if (diff < 25) {
        continue;
      }
      const x = i % CAM_W;
      const y = Math.floor(i / CAM_W);
      if (y > CAM_H * 0.92) {
        continue;
      }
      motion += diff;
      xSum += x * diff;
      ySum += y * diff;
    }

    const temp = state.camera.prevFrame;
    state.camera.prevFrame = state.camera.currFrame;
    state.camera.currFrame = temp;

    if (motion > 17000) {
      const nx = xSum / motion / CAM_W;
      const ny = ySum / motion / CAM_H;
      state.camera.pointerX = lerp(state.camera.pointerX, nx, 0.35);
      state.camera.pointerY = lerp(state.camera.pointerY, ny, 0.35);
      state.camera.lastMotion = motion;

      if (state.mode === "playing" && state.level && state.inputMode === "camera") {
        const line = getLineGeometry();
        const mirroredX = 1 - state.camera.pointerX;
        const canvasX = line.x + mirroredX * line.width;
        setMarkerFromCanvasX(canvasX);

        if (Math.abs(state.camera.pointerX - state.camera.lastStableX) < 0.012) {
          state.camera.dwell += 0.07;
        } else {
          state.camera.dwell = 0;
          state.camera.lastStableX = state.camera.pointerX;
        }

        state.camera.submitCooldown = Math.max(0, state.camera.submitCooldown - 0.07);
        if (state.camera.dwell > 1.1 && state.camera.submitCooldown <= 0) {
          submitGuess("camera-dwell");
          state.camera.dwell = 0;
          state.camera.submitCooldown = 1.4;
        }
      }
    } else {
      state.camera.lastMotion = Math.max(0, state.camera.lastMotion * 0.85);
      state.camera.dwell = Math.max(0, state.camera.dwell - 0.05);
      state.camera.submitCooldown = Math.max(0, state.camera.submitCooldown - 0.07);
    }
  }

  function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.45, THEME.cream);
    grad.addColorStop(1, THEME.lightBeige);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 12; i += 1) {
      const phase = state.tickPulse * 0.35 + i * 0.7;
      const x = canvas.width * (0.08 + (i / 12) * 0.84);
      const y = canvas.height * (0.2 + 0.1 * Math.sin(phase));
      const r = 18 + 12 * Math.sin(phase * 1.1 + i);
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = i % 2 === 0 ? "rgba(216, 199, 189, 0.46)" : "rgba(34, 73, 90, 0.16)";
      ctx.beginPath();
      ctx.arc(x, y, Math.abs(r), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawNumberLine() {
    if (!state.level) {
      return;
    }

    const line = getLineGeometry();
    const range = getVisualRange();
    const span = range.max - range.min;

    ctx.strokeStyle = THEME.teal;
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(line.x, line.y);
    ctx.lineTo(line.x + line.width, line.y);
    ctx.stroke();

    const step = state.level.tickStep;
    const from = Math.floor(range.min / step) - 1;
    const to = Math.ceil(range.max / step) + 1;

    for (let i = from; i <= to; i += 1) {
      const value = i * step;
      if (value < range.min - 0.00001 || value > range.max + 0.00001) {
        continue;
      }
      const ratio = (value - range.min) / span;
      const x = line.x + ratio * line.width;

      const major = Math.abs(value - Math.round(value)) < step * 0.49;
      const tickH = major ? 24 : 14;
      ctx.strokeStyle = major ? THEME.darkTeal : "rgba(34, 73, 90, 0.65)";
      ctx.lineWidth = major ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(x, line.y - tickH / 2);
      ctx.lineTo(x, line.y + tickH / 2);
      ctx.stroke();
    }

    const markerX = valueToX(state.markerValue);
    ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
    ctx.beginPath();
    ctx.arc(markerX, line.y, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(34, 73, 90, 0.22)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = THEME.teal;
    ctx.strokeStyle = THEME.darkTeal;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(markerX, line.y - 28);
    ctx.lineTo(markerX - 16, line.y - 60);
    ctx.lineTo(markerX + 16, line.y - 60);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const confirmRect = {
      x: canvas.width * 0.76,
      y: canvas.height * 0.73,
      w: canvas.width * 0.18,
      h: canvas.height * 0.1,
    };
    state.confirmRect = confirmRect;

    const hoveringConfirm = pointInRect(state.pointer, confirmRect);
    const btnGrad = ctx.createLinearGradient(confirmRect.x, confirmRect.y, confirmRect.x, confirmRect.y + confirmRect.h);
    btnGrad.addColorStop(0, hoveringConfirm ? "#2d6074" : THEME.teal);
    btnGrad.addColorStop(1, hoveringConfirm ? "#214a5d" : THEME.darkTeal);
    ctx.fillStyle = btnGrad;
    ctx.strokeStyle = "rgba(26, 54, 66, 0.95)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(confirmRect.x, confirmRect.y, confirmRect.w, confirmRect.h, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 20px 'Outfit', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ONAYLA", confirmRect.x + confirmRect.w * 0.5, confirmRect.y + confirmRect.h * 0.52);
    ctx.textBaseline = "alphabetic";
  }

  function drawTopCards() {
    const q = currentQuestion();
    const hudShake = state.hudShakeT > 0 ? Math.sin(state.tickPulse * 95) * 8 * (state.hudShakeT / 0.42) : 0;
    const rightX = canvas.width * 0.95 + hudShake;

    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.strokeStyle = "rgba(34, 73, 90, 0.24)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(canvas.width * 0.03, canvas.height * 0.04, canvas.width * 0.58, canvas.height * 0.17, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = THEME.teal;
    ctx.textAlign = "left";
    ctx.font = "700 30px 'Forum', 'Caudex', serif";
    ctx.fillText(`Seviye ${state.levelIndex + 1}: ${state.level ? state.level.name : "-"}`, canvas.width * 0.05, canvas.height * 0.1);

    ctx.font = "700 28px 'Outfit', sans-serif";
    ctx.fillStyle = THEME.darkTeal;
    ctx.fillText(`Hedef Kesir: ${q ? q.label : "-"}`, canvas.width * 0.05, canvas.height * 0.16);

    ctx.textAlign = "right";
    ctx.fillStyle = THEME.text;
    ctx.font = "700 22px 'Outfit', sans-serif";
    ctx.fillText(`Skor ${state.score}`, rightX, canvas.height * 0.1);

    ctx.fillStyle = state.lifeDropT > 0 ? "#b91c1c" : THEME.text;
    ctx.fillText(`Can ${state.lives}/${MAX_LIVES}`, rightX, canvas.height * 0.15);

    const lifeRowY = canvas.height * 0.185;
    const lifeSpacing = 22;
    const lifeStartX = rightX - (MAX_LIVES - 1) * lifeSpacing - 8;
    for (let i = 0; i < MAX_LIVES; i += 1) {
      const x = lifeStartX + i * lifeSpacing;
      const alive = i < state.lives;
      ctx.fillStyle = alive ? "#ef4444" : "#cbd5e1";
      ctx.beginPath();
      ctx.arc(x, lifeRowY, 6, 0, Math.PI * 2);
      ctx.fill();
      if (!alive) {
        ctx.strokeStyle = "#9ca3af";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 4, lifeRowY - 4);
        ctx.lineTo(x + 4, lifeRowY + 4);
        ctx.stroke();
      }
    }

    if (state.lifeDropT > 0 && state.lifeDropText) {
      const badgeAlpha = clamp(state.lifeDropT / 1.2, 0, 1);
      const bx = rightX - 156;
      const by = canvas.height * 0.208;
      const bw = 144;
      const bh = 34;
      ctx.globalAlpha = badgeAlpha;
      ctx.fillStyle = "rgba(220, 38, 38, 0.95)";
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 10);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = "700 18px 'Outfit', sans-serif";
      ctx.textBaseline = "middle";
      ctx.fillText(state.lifeDropText, bx + bw * 0.5, by + bh * 0.52);
      ctx.textBaseline = "alphabetic";
      ctx.globalAlpha = 1;
    }

    if (state.level && state.level.timeLimit > 0) {
      const timerW = canvas.width * 0.2;
      const timerH = 18;
      const timerX = canvas.width * 0.72;
      const timerY = canvas.height * 0.19;
      const ratio = clamp(state.timeLeft / state.level.timeLimit, 0, 1);

      ctx.fillStyle = "rgba(255,255,255,0.72)";
      ctx.beginPath();
      ctx.roundRect(timerX, timerY, timerW, timerH, 9);
      ctx.fill();

      ctx.fillStyle = ratio > 0.35 ? "#16a34a" : "#dc2626";
      ctx.beginPath();
      ctx.roundRect(timerX, timerY, timerW * ratio, timerH, 9);
      ctx.fill();

      ctx.fillStyle = THEME.darkTeal;
      ctx.font = "600 14px 'Outfit', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${state.timeLeft.toFixed(1)} sn`, timerX + timerW * 0.5, timerY - 4);
    }

    ctx.textAlign = "left";
    ctx.fillStyle = THEME.muted;
    ctx.font = "600 15px 'Outfit', sans-serif";
    if (q) {
      ctx.fillText(`Ipucu: ${q.tip}`, canvas.width * 0.05, canvas.height * 0.215);
    }
  }

  function drawParticles() {
    for (const p of state.particles) {
      const alpha = clamp(p.life / p.ttl, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawFeedback() {
    if (state.feedbackT <= 0 || !state.feedback) {
      return;
    }

    const palette = {
      info: { bg: "rgba(34, 73, 90, 0.92)", border: "rgba(26, 54, 66, 0.98)", chip: "#163642", chipText: "BILGI" },
      success: { bg: "rgba(22, 163, 74, 0.93)", border: "rgba(21, 128, 61, 0.98)", chip: "#166534", chipText: "DOGRU" },
      error: { bg: "rgba(220, 38, 38, 0.94)", border: "rgba(153, 27, 27, 0.98)", chip: "#991b1b", chipText: "YANLIS" },
      warning: { bg: "rgba(234, 88, 12, 0.94)", border: "rgba(194, 65, 12, 0.98)", chip: "#9a3412", chipText: "SURE" },
    };
    const style = palette[state.feedbackType] || palette.info;
    const alpha = clamp(state.feedbackT / 3, 0, 1);
    const x = canvas.width * 0.16;
    const y = canvas.height * 0.835;
    const w = canvas.width * 0.68;
    const h = canvas.height * 0.11;

    ctx.globalAlpha = alpha;
    ctx.fillStyle = style.bg;
    ctx.strokeStyle = style.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 16);
    ctx.fill();
    ctx.stroke();

    const chipW = 126;
    const chipH = 38;
    const chipX = x + 14;
    const chipY = y + h * 0.5 - chipH * 0.5;
    ctx.fillStyle = style.chip;
    ctx.beginPath();
    ctx.roundRect(chipX, chipY, chipW, chipH, 12);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 18px 'Outfit', sans-serif";
    ctx.fillText(style.chipText, chipX + chipW * 0.5, chipY + chipH * 0.52);

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 24px 'Outfit', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(state.feedback, chipX + chipW + 20, y + h * 0.52);
    ctx.textBaseline = "alphabetic";
    ctx.globalAlpha = 1;
  }

  function drawImpactFlash() {
    if (state.flashT <= 0 || state.flashDuration <= 0) {
      return;
    }
    const ratio = clamp(state.flashT / state.flashDuration, 0, 1);
    const alpha = 0.32 * ratio;
    ctx.fillStyle = `rgba(${state.flashColor}, ${alpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawCameraPreview() {
    if (!state.camera.active || cameraVideo.readyState < 2) {
      return;
    }

    const w = canvas.width * 0.2;
    const h = w * 0.75;
    const x = canvas.width * 0.76;
    const y = canvas.height * 0.04;

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.beginPath();
    ctx.roundRect(x - 5, y - 5, w + 10, h + 10, 12);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.clip();
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
    ctx.drawImage(cameraVideo, 0, 0, w, h);
    ctx.restore();

    const px = x + (1 - state.camera.pointerX) * w;
    const py = y + state.camera.pointerY * h;
    ctx.fillStyle = THEME.teal;
    ctx.strokeStyle = THEME.darkTeal;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = THEME.darkTeal;
    ctx.font = "600 13px 'Outfit', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`motion ${Math.round(state.camera.lastMotion)}`, x, y + h + 18);
  }

  function drawMenuPanel() {
    const panelW = canvas.width * 0.78;
    const panelH = canvas.height * 0.56;
    const panelX = (canvas.width - panelW) * 0.5;
    const panelY = canvas.height * 0.2;

    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.strokeStyle = "rgba(34, 73, 90, 0.25)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 20);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = THEME.teal;
    ctx.font = "700 48px 'Forum', 'Caudex', serif";

    if (state.mode === "menu") {
      ctx.fillText("KESIR KASIFI", canvas.width * 0.5, panelY + 74);
      ctx.font = "600 20px 'Outfit', sans-serif";
      ctx.fillText("Fare, dokunmatik veya kamera ile hedef kesri sayi dogrusuna yerlestir.", canvas.width * 0.5, panelY + 116);

      ctx.textAlign = "left";
      ctx.font = "600 18px 'Outfit', sans-serif";
      const items = [
        "1) Kesir Isinmasi (0-1)",
        "2) Esdeger Portali",
        "3) Negatif Kanyon",
        "4) Bilesik Laboratuvar",
        "5) Kayan Hat Sprint",
        "6) Kamera Boss (parmak modu)",
      ];
      items.forEach((item, i) => {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const x = panelX + 42 + col * (panelW * 0.5 - 24);
        const y = panelY + 170 + row * 58;
        ctx.fillStyle = i === 5 ? "#1a3642" : "#22495a";
        ctx.fillText(item, x, y);
      });

      ctx.textAlign = "center";
      ctx.font = "600 17px 'Outfit', sans-serif";
      ctx.fillStyle = "#4b5563";
      ctx.fillText("Baslat: buton veya 1-6 | Menu: 0 | Kamera: C | Tam ekran: F", canvas.width * 0.5, panelY + panelH - 38);
      return;
    }

    if (state.mode === "level_clear") {
      ctx.fillText("SEVIYE TAMAMLANDI", canvas.width * 0.5, panelY + 80);
      ctx.font = "700 28px 'Outfit', sans-serif";
      ctx.fillStyle = "#16a34a";
      ctx.fillText(`Skor: ${state.score}`, canvas.width * 0.5, panelY + 134);
      ctx.font = "600 20px 'Outfit', sans-serif";
      ctx.fillStyle = THEME.teal;
      ctx.fillText("Sonraki bolumde daha zor kesirler var.", canvas.width * 0.5, panelY + 182);
      ctx.fillText("Sonraki Seviye butonuna bas.", canvas.width * 0.5, panelY + 220);
      return;
    }

    if (state.mode === "game_complete") {
      ctx.fillText("GALAKSI KURTARILDI", canvas.width * 0.5, panelY + 80);
      ctx.font = "700 31px 'Outfit', sans-serif";
      ctx.fillStyle = "#16a34a";
      ctx.fillText(`Final Skor: ${state.score}`, canvas.width * 0.5, panelY + 136);
      ctx.font = "600 20px 'Outfit', sans-serif";
      ctx.fillStyle = THEME.teal;
      ctx.fillText("Kamera + sayi dogrusu kombinasyonunu tamamladin.", canvas.width * 0.5, panelY + 188);
      ctx.fillText("Bastan Oyna ile yeni bir tur ac.", canvas.width * 0.5, panelY + 226);
    }
  }

  function update(dt) {
    state.tickPulse += dt;

    if (state.feedbackT > 0) {
      state.feedbackT = Math.max(0, state.feedbackT - dt);
    }
    if (state.hudShakeT > 0) {
      state.hudShakeT = Math.max(0, state.hudShakeT - dt);
    }
    if (state.lifeDropT > 0) {
      state.lifeDropT = Math.max(0, state.lifeDropT - dt);
    }
    if (state.flashT > 0) {
      state.flashT = Math.max(0, state.flashT - dt);
    }

    for (let i = state.particles.length - 1; i >= 0; i -= 1) {
      const p = state.particles[i];
      p.life -= dt;
      p.vy += 240 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) {
        state.particles.splice(i, 1);
      }
    }

    processCamera(dt);

    if (state.mode !== "playing" || !state.level) {
      return;
    }

    state.elapsedInLevel += dt;

    if (state.level.moving) {
      const span = state.level.range[1] - state.level.range[0];
      state.lineShift = Math.sin(state.elapsedInLevel * 1.1) * span * 0.17;
    } else {
      state.lineShift = 0;
    }

    if (state.level.timeLimit > 0) {
      state.timeLeft -= dt;
      if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        timeoutPenalty();
      }
    }

    updateHintText();
  }

  function render() {
    ensureCanvasSize();

    drawBackground();

    if (state.mode === "playing" && state.level) {
      drawTopCards();
      drawNumberLine();
      drawParticles();
      drawCameraPreview();
    } else {
      drawParticles();
      drawMenuPanel();
      drawCameraPreview();
    }

    drawImpactFlash();
    drawFeedback();
  }

  function eventToCanvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  canvas.addEventListener("pointerdown", (event) => {
    const point = eventToCanvasPoint(event);
    state.pointer.down = true;
    state.pointer.x = point.x;
    state.pointer.y = point.y;
    canvas.setPointerCapture(event.pointerId);

    if (state.mode !== "playing") {
      return;
    }

    if (pointInRect(point, state.confirmRect)) {
      submitGuess("canvas-button");
      return;
    }

    if (state.inputMode !== "camera") {
      setMarkerFromCanvasX(point.x);
    }
  });

  canvas.addEventListener("pointermove", (event) => {
    const point = eventToCanvasPoint(event);
    state.pointer.x = point.x;
    state.pointer.y = point.y;

    if (!state.pointer.down || state.mode !== "playing") {
      return;
    }

    if (state.inputMode !== "camera") {
      setMarkerFromCanvasX(point.x);
    }
  });

  function releasePointer(event) {
    state.pointer.down = false;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  }

  canvas.addEventListener("pointerup", releasePointer);
  canvas.addEventListener("pointercancel", releasePointer);

  async function handleCameraButton() {
    await toggleCameraMode();
  }

  ui.startBtn.addEventListener("click", startCampaign);
  ui.confirmBtn.addEventListener("click", () => submitGuess("dom-button"));
  ui.nextBtn.addEventListener("click", () => {
    if (state.mode === "level_clear") {
      beginLevel(state.levelIndex + 1);
      return;
    }
    startCampaign();
  });
  ui.resetBtn.addEventListener("click", returnToMenu);
  ui.cameraBtn.addEventListener("click", () => {
    void handleCameraButton();
  });

  async function onKeyDown(event) {
    const key = event.key.toLowerCase();
    const levelShortcutIndex = getLevelShortcutIndex(key);

    if (key === "f") {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
      return;
    }

    if (key === "c") {
      event.preventDefault();
      await toggleCameraMode();
      return;
    }

    if (levelShortcutIndex !== -1) {
      event.preventDefault();
      startCampaignFromLevel(levelShortcutIndex);
      return;
    }

    if (key === "0") {
      event.preventDefault();
      returnToMenu();
      return;
    }

    if (key === "r") {
      returnToMenu();
      return;
    }

    if (key === "n" && (state.mode === "level_clear" || state.mode === "game_complete")) {
      if (state.mode === "level_clear") {
        beginLevel(state.levelIndex + 1);
      } else {
        startCampaign();
      }
      return;
    }

    if ((key === " " || key === "enter") && state.mode === "menu") {
      event.preventDefault();
      startCampaign();
      return;
    }

    if ((key === " " || key === "enter") && (state.mode === "level_clear" || state.mode === "game_complete")) {
      event.preventDefault();
      if (state.mode === "level_clear") {
        beginLevel(state.levelIndex + 1);
      } else {
        startCampaign();
      }
      return;
    }

    if (state.mode !== "playing" || !state.level) {
      return;
    }

    const span = state.level.range[1] - state.level.range[0];
    const step = state.level.id === "L1" ? state.level.tickStep : span / 60;

    if (key === "arrowleft") {
      state.markerValue = normalizeMarkerValue(state.markerValue - step);
      event.preventDefault();
    }

    if (key === "arrowright") {
      state.markerValue = normalizeMarkerValue(state.markerValue + step);
      event.preventDefault();
    }

    if (key === "arrowup") {
      state.markerValue = normalizeMarkerValue(state.markerValue + step * 2);
      event.preventDefault();
    }

    if (key === "arrowdown") {
      state.markerValue = normalizeMarkerValue(state.markerValue - step * 2);
      event.preventDefault();
    }

    if (key === " " || key === "enter") {
      event.preventDefault();
      submitGuess("keyboard");
    }
  }

  window.addEventListener("keydown", (event) => {
    void onKeyDown(event);
  });

  window.addEventListener("beforeunload", () => {
    stopCamera();
  });

  window.render_game_to_text = () => {
    const question = currentQuestion();
    const line = getLineGeometry();
    const visual = getVisualRange();

    return JSON.stringify({
      coordinateSystem: "Canvas origin top-left; x right, y down; number line values increase left to right.",
      mode: state.mode,
      level: state.level
        ? {
            index: state.levelIndex + 1,
            id: state.level.id,
            name: state.level.name,
          }
        : null,
      inputMode: state.inputMode,
      score: state.score,
      lives: state.lives,
      question: question
        ? {
            index: state.questionIndex + 1,
            total: state.questions.length,
            label: question.label,
            value: Number(question.value.toFixed(4)),
          }
        : null,
      line: state.level
        ? {
            pixelStart: Number(line.x.toFixed(2)),
            pixelEnd: Number((line.x + line.width).toFixed(2)),
            visualMin: Number(visual.min.toFixed(4)),
            visualMax: Number(visual.max.toFixed(4)),
            markerValue: Number(state.markerValue.toFixed(4)),
            markerX: Number(valueToX(state.markerValue).toFixed(2)),
          }
        : null,
      timer: state.level && state.level.timeLimit > 0 ? Number(state.timeLeft.toFixed(2)) : null,
      feedback: state.feedback,
      feedbackType: state.feedbackType,
      camera: {
        active: state.camera.active,
        usingCameraInput: state.inputMode === "camera",
        motion: Number(state.camera.lastMotion.toFixed(0)),
        pointerX: Number(state.camera.pointerX.toFixed(3)),
      },
    });
  };

  window.advanceTime = (ms) => {
    const frameMs = 1000 / 60;
    const steps = Math.max(1, Math.round(ms / frameMs));
    for (let i = 0; i < steps; i += 1) {
      update(1 / 60);
    }
    render();
  };

  function frame(now) {
    const dt = Math.min(0.05, (now - state.lastTick) / 1000);
    state.lastTick = now;
    update(dt);
    render();
    requestAnimationFrame(frame);
  }

  updateUI();
  render();
  requestAnimationFrame(frame);
})();

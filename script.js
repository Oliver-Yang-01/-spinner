const FORTUNES = [
  {
    key: "nuke",
    name: "核弹",
    chance: 1,
    tone: "bad",
    rank: "灭世凶签",
    message: "今日诸事宜缓。天雷已至，先离按钮远一点。",
  },
  {
    key: "superBad",
    name: "超大凶",
    chance: 2,
    tone: "bad",
    rank: "极凶之签",
    message: "风高浪急，暂避锋芒。能不硬刚，就先别硬刚。",
  },
  {
    key: "bigBad",
    name: "大凶",
    chance: 5,
    tone: "bad",
    rank: "大凶之签",
    message: "前路有坎，慢行则稳。今天适合做两遍备份。",
  },
  {
    key: "bad",
    name: "凶",
    chance: 13,
    tone: "bad",
    rank: "凶签",
    message: "小有逆风，不必惊慌。谨慎一点，便可绕过。",
  },
  {
    key: "smallBad",
    name: "小凶",
    chance: 24,
    tone: "bad",
    rank: "微凶之签",
    message: "云遮半月，只是一时。少说一句，多看一眼。",
  },
  {
    key: "again",
    name: "再来一次",
    chance: 10,
    tone: "neutral",
    rank: "未定之签",
    message: "天机打了个哈欠。此签不算，再问一次。",
  },
  {
    key: "smallGood",
    name: "小吉",
    chance: 24,
    tone: "good",
    rank: "微吉之签",
    message: "微光入怀，小事皆顺。留意身边悄悄出现的好消息。",
  },
  {
    key: "good",
    name: "吉",
    chance: 13,
    tone: "good",
    rank: "吉签",
    message: "顺水行舟，所求渐近。今日适合向前多走一步。",
  },
  {
    key: "bigGood",
    name: "大吉",
    chance: 5,
    tone: "good",
    rank: "大吉之签",
    message: "长风相送，万事可期。别藏着你的好主意。",
  },
  {
    key: "superGood",
    name: "超大吉",
    chance: 2,
    tone: "good",
    rank: "极吉之签",
    message: "紫气东来，鸿运正盛。大胆一点，今日命运偏爱你。",
  },
  {
    key: "divine",
    name: "神祈",
    chance: 1,
    tone: "good",
    rank: "天赐神签",
    message: "神明垂眸，所愿皆闻。去做那件你一直想做的事。",
  },
];

const REEL_ROWS = 55;
const RESULT_INDEX = REEL_ROWS - 3;
const SPIN_DURATION = 4700;
const HISTORY_KEY = "tianming-fortune-history-v1";

const reelTrack = document.querySelector("#reelTrack");
const oracleShell = document.querySelector("#oracleShell");
const spinButton = document.querySelector("#spinButton");
const spinLabel = spinButton.querySelector(".button-label");
const resultPanel = document.querySelector("#resultPanel");
const resultKicker = document.querySelector("#resultKicker");
const resultName = document.querySelector("#resultName");
const resultMessage = document.querySelector("#resultMessage");
const historyList = document.querySelector("#historyList");
const clearHistory = document.querySelector("#clearHistory");
const soundToggle = document.querySelector("#soundToggle");
const oddsDialog = document.querySelector("#oddsDialog");
const oddsButton = document.querySelector("#oddsButton");
const closeOdds = document.querySelector("#closeOdds");
const oddsList = document.querySelector("#oddsList");
const flashLayer = document.querySelector("#flashLayer");
const particleLayer = document.querySelector("#particleLayer");

let isSpinning = false;
let soundEnabled = true;
let audioContext;
let history = loadHistory();

function randomUnit() {
  if (window.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    window.crypto.getRandomValues(values);
    return values[0] / 4294967296;
  }
  return Math.random();
}

function randomFrom(items) {
  return items[Math.floor(randomUnit() * items.length)];
}

function weightedPick() {
  let roll = randomUnit() * 100;
  for (const fortune of FORTUNES) {
    roll -= fortune.chance;
    if (roll < 0) return fortune;
  }
  return FORTUNES[FORTUNES.length - 1];
}

function fortuneByKey(key) {
  return FORTUNES.find((fortune) => fortune.key === key);
}

function makeReelItem(fortune, target = false) {
  const item = document.createElement("div");
  item.className = `reel-item${target ? " is-target" : ""}`;
  item.dataset.key = fortune.key;
  item.dataset.tone = fortune.tone;
  item.textContent = fortune.name;
  return item;
}

function buildReel(target = fortuneByKey("again")) {
  const rareNearMisses = FORTUNES.filter((fortune) =>
    ["nuke", "divine", "superBad", "superGood", "bigBad", "bigGood"].includes(fortune.key),
  );
  const items = [];

  for (let index = 0; index < REEL_ROWS; index += 1) {
    let fortune = randomFrom(FORTUNES);

    if (index === RESULT_INDEX) fortune = target;
    if (index === RESULT_INDEX - 1 || index === RESULT_INDEX + 1) {
      const choices = rareNearMisses.filter((candidate) => candidate.key !== target.key);
      fortune = randomFrom(choices);
    }

    items.push(makeReelItem(fortune, index === RESULT_INDEX));
  }

  reelTrack.replaceChildren(...items);
  reelTrack.style.transition = "none";
  reelTrack.style.transform = "translateY(0px)";
}

function getRowHeight() {
  return Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--row-height"));
}

function getLandingOffset() {
  const viewportHeight = getRowHeight() * 5;
  return viewportHeight / 2 - getRowHeight() * (RESULT_INDEX + 0.5);
}

function initAudio() {
  if (!soundEnabled) return null;
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function playTone(frequency, duration, delay = 0, type = "sine", volume = 0.045) {
  const context = initAudio();
  if (!context) return;

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const startsAt = context.currentTime + delay;
  const endsAt = startsAt + duration;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startsAt);
  gain.gain.setValueAtTime(0.0001, startsAt);
  gain.gain.exponentialRampToValueAtTime(volume, startsAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, endsAt);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(startsAt);
  oscillator.stop(endsAt + 0.03);
}

function playStartSound() {
  playTone(146.8, 0.45, 0, "triangle", 0.035);
  playTone(220, 0.35, 0.08, "sine", 0.025);
}

function playResultSound(fortune) {
  if (fortune.key === "divine") {
    [392, 523.25, 659.25, 783.99].forEach((note, index) => playTone(note, 1.1, index * 0.11, "sine", 0.045));
    return;
  }

  if (fortune.key === "nuke") {
    playTone(82.41, 1.2, 0, "sawtooth", 0.055);
    playTone(55, 1.35, 0.08, "square", 0.025);
    return;
  }

  if (fortune.tone === "good") {
    [329.63, 493.88, 659.25].forEach((note, index) => playTone(note, 0.65, index * 0.1, "sine", 0.036));
  } else if (fortune.tone === "bad") {
    [196, 155.56, 116.54].forEach((note, index) => playTone(note, 0.58, index * 0.1, "triangle", 0.038));
  } else {
    playTone(293.66, 0.35, 0, "triangle", 0.03);
    playTone(293.66, 0.35, 0.28, "triangle", 0.03);
  }
}

function setResult(fortune) {
  resultKicker.textContent = fortune.rank;
  resultName.textContent = fortune.name;
  resultMessage.textContent = fortune.message;
  resultPanel.dataset.key = fortune.key;
  resultPanel.dataset.tone = fortune.tone;
  oracleShell.dataset.key = fortune.key;
  oracleShell.dataset.tone = fortune.tone;
  resultPanel.classList.remove("is-revealing");
  void resultPanel.offsetWidth;
  resultPanel.classList.add("is-revealing");
}

function triggerEffects(fortune) {
  const className = fortune.key === "divine"
    ? "flash-divine"
    : fortune.key === "nuke"
      ? "flash-nuke"
      : fortune.tone === "good"
        ? "flash-good"
        : fortune.tone === "bad"
          ? "flash-bad"
          : "";

  if (className) {
    flashLayer.className = `flash-layer ${className}`;
    window.setTimeout(() => { flashLayer.className = "flash-layer"; }, 1900);
  }

  if (!["divine", "nuke", "superGood", "superBad"].includes(fortune.key)) return;

  const count = fortune.key === "divine" || fortune.key === "nuke" ? 48 : 26;
  const colors = fortune.tone === "good"
    ? ["#ffe7a5", "#d9a63b", "#fff8d7"]
    : fortune.key === "nuke"
      ? ["#b9eb79", "#e94b32", "#f3d873"]
      : ["#d35a42", "#7e1915", "#e6a351"];

  const particles = Array.from({ length: count }, (_, index) => {
    const particle = document.createElement("i");
    particle.className = "particle";
    particle.style.setProperty("--angle", `${(360 / count) * index + randomUnit() * 14}deg`);
    particle.style.setProperty("--distance", `${140 + randomUnit() * 280}px`);
    particle.style.setProperty("--duration", `${0.9 + randomUnit() * 0.9}s`);
    particle.style.setProperty("--size", `${2 + randomUnit() * 5}px`);
    particle.style.setProperty("--particle-color", randomFrom(colors));
    return particle;
  });

  particleLayer.replaceChildren(...particles);
  window.setTimeout(() => particleLayer.replaceChildren(), 1900);
}

function addToHistory(fortune) {
  history.unshift({
    key: fortune.key,
    time: new Date().toISOString(),
  });
  history = history.slice(0, 5);

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // History remains available for this tab if storage is unavailable.
  }

  renderHistory();
}

function loadHistory() {
  try {
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(stored)
      ? stored.filter((entry) => fortuneByKey(entry.key)).slice(0, 5)
      : [];
  } catch {
    return [];
  }
}

function renderHistory() {
  clearHistory.disabled = history.length === 0;

  if (!history.length) {
    historyList.innerHTML = `
      <div class="history-empty">
        <span>○</span>
        <p>尚无签象，命运仍在静候。</p>
      </div>`;
    return;
  }

  const formatter = new Intl.DateTimeFormat("zh-Hans", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const cards = history.map((entry, index) => {
    const fortune = fortuneByKey(entry.key);
    const card = document.createElement("article");
    card.className = "history-card";
    card.dataset.key = fortune.key;
    card.dataset.tone = fortune.tone;
    card.dataset.mark = fortune.name.slice(-1);
    card.style.animationDelay = `${index * 55}ms`;

    const time = document.createElement("time");
    time.dateTime = entry.time;
    time.textContent = formatter.format(new Date(entry.time));

    const name = document.createElement("strong");
    name.textContent = fortune.name;
    card.append(time, name);
    return card;
  });

  historyList.replaceChildren(...cards);
}

function renderOdds() {
  const ordered = [...FORTUNES].sort((a, b) => b.chance - a.chance);
  const rows = ordered.map((fortune) => {
    const row = document.createElement("div");
    row.className = "odds-row";
    row.dataset.key = fortune.key;
    row.dataset.tone = fortune.tone;
    row.innerHTML = `
      <b>${fortune.name}</b>
      <div class="odds-bar"><i style="--chance: ${fortune.chance}"></i></div>
      <span>${fortune.chance}%</span>`;
    return row;
  });
  oddsList.replaceChildren(...rows);
}

async function spin() {
  if (isSpinning) return;
  isSpinning = true;
  const fortune = weightedPick();

  initAudio();
  playStartSound();
  buildReel(fortune);
  spinButton.disabled = true;
  spinButton.classList.add("is-spinning");
  oracleShell.classList.add("is-spinning");
  spinLabel.textContent = "天命轮转";
  resultKicker.textContent = "正在叩问";
  resultName.textContent = "万 · 象 · 轮 · 转";
  resultMessage.textContent = "莫急，命运正在翻找你的那一页。";
  delete resultPanel.dataset.key;
  delete resultPanel.dataset.tone;
  delete oracleShell.dataset.key;
  delete oracleShell.dataset.tone;

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  reelTrack.style.transition = `transform ${SPIN_DURATION}ms cubic-bezier(0.09, 0.68, 0.11, 1)`;
  reelTrack.style.transform = `translateY(${getLandingOffset()}px)`;

  window.setTimeout(() => {
    setResult(fortune);
    playResultSound(fortune);
    triggerEffects(fortune);
    addToHistory(fortune);
    spinButton.disabled = false;
    spinButton.classList.remove("is-spinning");
    oracleShell.classList.remove("is-spinning");
    spinLabel.textContent = fortune.key === "again" ? "奉命再问" : "再叩天命";
    isSpinning = false;
  }, SPIN_DURATION + 80);
}

spinButton.addEventListener("click", spin);

soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundToggle.setAttribute("aria-pressed", String(soundEnabled));
  soundToggle.setAttribute("aria-label", soundEnabled ? "关闭声音" : "开启声音");
  if (soundEnabled) playTone(440, 0.18, 0, "sine", 0.025);
});

oddsButton.addEventListener("click", () => oddsDialog.showModal());
closeOdds.addEventListener("click", () => oddsDialog.close());
oddsDialog.addEventListener("click", (event) => {
  if (event.target === oddsDialog) oddsDialog.close();
});

clearHistory.addEventListener("click", () => {
  history = [];
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // Nothing else to clear.
  }
  renderHistory();
});

window.addEventListener("resize", () => {
  if (!isSpinning && reelTrack.querySelector(".is-target")) {
    reelTrack.style.transform = `translateY(${getLandingOffset()}px)`;
  }
});

buildReel();
renderHistory();
renderOdds();

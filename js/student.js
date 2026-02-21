// ============================================
// CNC ACADEMY QUIZ DATA (EDIT QUESTIONS HERE)
// ============================================
const QUIZ = {
  title: "CNC Maintenance & Fundamentals Quiz",
  questions: [
    { id: "q1", text: "On a CNC lathe, which axis controls radial (in/out) movement?", choices: ["X Axis","Z Axis","Y Axis","C Axis"], correctIndex: 0 },
    { id: "q2", text: "Static accuracy primarily evaluates:", choices: ["Cutting vibration under load","Servo tuning stability","Geometric positioning accuracy","Tool life performance"], correctIndex: 2 },
    { id: "q3", text: "Before tuning servos after a crash, the first step should be:", choices: ["Increase gain values","Verify mechanical integrity","Clear all alarms","Replace encoder"], correctIndex: 1 },
    { id: "q4", text: "Which instrument is most commonly used to measure axis straightness?", choices: ["Dial indicator","Thermocouple","Micrometer","Torque wrench"], correctIndex: 0 },
    { id: "q5", text: "Laser interferometer systems are typically used to measure:", choices: ["Ball screw torque","Axis positioning error","Spindle horsepower","Hydraulic pressure"], correctIndex: 1 },
    { id: "q6", text: "Mechanical alignment checks fall under which category?", choices: ["Dynamic accuracy","Electrical maintenance","Static accuracy","Tool compensation"], correctIndex: 2 },
    { id: "q7", text: "Pitch error compensation corrects errors in:", choices: ["Spindle RPM","Axis linear positioning","Coolant pressure","Tool magazine indexing"], correctIndex: 1 },
    { id: "q8", text: "On a 5-axis machine, G43.4 typically activates:", choices: ["Spindle orientation","Tool length compensation with TCP","Rapid override","Coolant through spindle"], correctIndex: 1 },
    { id: "q9", text: "Excessive servo gain may cause:", choices: ["Axis sluggishness","Thermal expansion","Oscillation or vibration","Spindle taper wear"], correctIndex: 2 },
    { id: "q10", text: "Which condition most directly affects perpendicularity between axes?", choices: ["Improper lubrication","Mechanical misalignment","Low coolant level","Incorrect feed rate"], correctIndex: 1 },
  ],
};

// ============================================
// APP STATE
// ============================================
const STORAGE_KEY = "cnc_academy_attempts_v1";
let currentIndex = 0;

// answers[qid] = chosenIndex (number) or null
const answers = Object.fromEntries(QUIZ.questions.map(q => [q.id, null]));

// Review mode state
let inReviewMode = false;
let reviewQueue = []; // 0-based question indexes still missed
let reviewPos = 0;

// ============================================
// HELPERS
// ============================================
function $(id) { return document.getElementById(id); }

function getAttempts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function setAttempts(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

function ratingFor(score, total) {
  const pct = total ? (score / total) : 0;

  if (score === total) {
    return { label: "Awesome — Perfect!", cls: "good", detail: "No misses. That’s how it’s done." };
  }
  if (pct >= 0.8) {
    return { label: "Strong", cls: "good", detail: "Almost there — tighten up the few misses." };
  }
  if (pct >= 0.6) {
    return { label: "Getting there", cls: "warn", detail: "Decent foundation — review the missed topics and try again." };
  }
  if (pct >= 0.4) {
    return { label: "Needs work", cls: "warn", detail: "You’re close enough to build on — run it again and focus on fundamentals." };
  }
  return { label: "Try again", cls: "bad", detail: "No shame — reset and take it one question at a time." };
}

function updateProgressPill() {
  if (inReviewMode) {
    const remaining = reviewQueue.length;
    const pos = Math.min(reviewPos + 1, Math.max(remaining, 1));
    $("progressPill").textContent = `Review: ${pos}/${Math.max(remaining, 1)} remaining`;
  } else {
    $("progressPill").textContent = `Question ${currentIndex + 1}/${QUIZ.questions.length}`;
  }
}

function isCorrect(index) {
  const q = QUIZ.questions[index];
  const picked = answers[q.id];
  return picked !== null && picked === q.correctIndex;
}

function computeMissedIndexes() {
  const missed = [];
  QUIZ.questions.forEach((q, idx) => {
    const picked = answers[q.id];
    if (picked === null || picked !== q.correctIndex) missed.push(idx);
  });
  return missed;
}

// ============================================
// RENDER (ONE QUESTION AT A TIME)
// ============================================
function renderCurrentQuestion() {
  const q = QUIZ.questions[currentIndex];
  const stage = $("questionStage");
  stage.innerHTML = "";

  const card = document.createElement("div");
  card.className = "qCard";
  card.dataset.qid = q.id;

  const p = document.createElement("p");
  p.className = "qText";
  p.innerHTML = `<strong>${currentIndex + 1}. ${q.text}</strong>`;
  card.appendChild(p);

  q.choices.forEach((choice, idx) => {
    const label = document.createElement("label");
    label.className = "choice";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = q.id;
    input.value = String(idx);
    if (answers[q.id] === idx) input.checked = true;

    input.addEventListener("change", () => {
      answers[q.id] = idx;

      if (inReviewMode) {
        if (isCorrect(currentIndex)) {
          reviewQueue = reviewQueue.filter(i => i !== currentIndex);
          if (reviewQueue.length === 0) {
            finishReviewMode();
            return;
          }
          if (reviewPos >= reviewQueue.length) reviewPos = Math.max(reviewQueue.length - 1, 0);
          currentIndex = reviewQueue[Math.min(reviewPos, reviewQueue.length - 1)];
        }
      } else {
        $("result").innerHTML = "";
      }

      updateNavButtons();
      updateProgressPill();
      renderCurrentQuestion();
    });

    label.appendChild(input);
    label.appendChild(document.createTextNode(" " + choice));
    card.appendChild(label);
  });

  stage.appendChild(card);
  updateProgressPill();
  updateNavButtons();
}

function updateNavButtons() {
  if (inReviewMode) {
    $("backBtn").disabled = reviewQueue.length <= 1 || reviewPos === 0;
    $("nextBtn").disabled = reviewQueue.length <= 1 || reviewPos >= reviewQueue.length - 1;
    $("submitBtn").style.display = "none";
    $("nextBtn").style.display = "inline-block";
    $("backBtn").style.display = "inline-block";
    return;
  }

  $("backBtn").disabled = currentIndex === 0;
  $("nextBtn").disabled = currentIndex === QUIZ.questions.length - 1;

  const onLast = currentIndex === QUIZ.questions.length - 1;
  $("submitBtn").style.display = onLast ? "inline-block" : "none";
  $("nextBtn").style.display = onLast ? "none" : "inline-block";
}

function playPerfectFireworks() {
  const canvas = document.getElementById("fxCanvas");
  if (!canvas) return;

  canvas.style.display = "block";

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // iPhone Safari viewport quirks
  const vw = window.visualViewport ? window.visualViewport.width : window.innerWidth;
  const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  const w = Math.floor(vw);
  const h = Math.floor(vh);

  // hiDPI
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const particles = [];
  const bursts = 4;
  const colors = ["#ff8a00", "#ffb15c", "#e8eef5", "#ffb000"];

  function burst(x, y) {
    const count = 90;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 2 + Math.random() * 5.5;
      particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 75 + Math.random() * 45,
        age: 0,
        size: 2 + Math.random() * 2.2,
        color: colors[(Math.random() * colors.length) | 0]
      });
    }
  }

  ctx.clearRect(0, 0, w, h);

  for (let b = 0; b < bursts; b++) {
    setTimeout(() => {
      burst(
        w * (0.2 + Math.random() * 0.6),
        h * (0.18 + Math.random() * 0.45)
      );
      try { navigator.vibrate && navigator.vibrate(20); } catch {}
    }, b * 180);
  }

  let frame = 0;

  function step() {
    frame++;

    // trails (brighter for iPhone)
    ctx.fillStyle = "rgba(0,0,0,0.10)";
    ctx.fillRect(0, 0, w, h);

    // subtle glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(255,138,0,0.55)";

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.age++;

      p.vx *= 0.985;
      p.vy = p.vy * 0.985 + 0.08;

      p.x += p.vx;
      p.y += p.vy;

      const t = 1 - p.age / p.life;
      if (t <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.globalAlpha = Math.max(0, t);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    if (particles.length === 0 || frame > 240) {
      ctx.clearRect(0, 0, w, h);
      canvas.style.display = "none";
      return;
    }

    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// ============================================
// SCORING + SUMMARY + SAVE ATTEMPT
// ============================================
function scoreQuiz() {
  let score = 0;
  const missedNums = [];
  const unansweredNums = [];

  QUIZ.questions.forEach((q, i) => {
    const picked = answers[q.id];
    if (picked === null) {
      unansweredNums.push(i + 1);
      missedNums.push(i + 1);
      return;
    }
    if (picked === q.correctIndex) score++;
    else missedNums.push(i + 1);
  });

  return { score, total: QUIZ.questions.length, missedNums, unansweredNums };
}

function enterReviewMode() {
  reviewQueue = computeMissedIndexes();
  if (reviewQueue.length === 0) return;

  inReviewMode = true;
  reviewPos = 0;
  currentIndex = reviewQueue[0];

  $("result").innerHTML =
    `<div class="sub">Review mode: fix the missed questions. As you correct one, it drops off the list.</div>`;

  renderCurrentQuestion();
}

function finishReviewMode() {
  inReviewMode = false;
  reviewQueue = [];
  reviewPos = 0;

  $("result").innerHTML =
    `<div class="big">Review complete ✅</div>
     <div class="sub">Nice. You corrected all missed questions. You can reset and retake anytime.</div>`;

  currentIndex = 0;
  renderCurrentQuestion();
}

function showSummary() {
  const { score, total, missedNums, unansweredNums } = scoreQuiz();
  const r = ratingFor(score, total);
  
  if (score === total) {
  playPerfectFireworks();
}

  const parts = [];
  parts.push(`<div class="big">Score: ${score}/${total}</div>`);
  parts.push(`<div class="rating ${r.cls}">${r.label}</div>`);
  parts.push(`<div class="sub">${r.detail}</div>`);

  if (unansweredNums.length) {
    parts.push(`<div class="sub">Unanswered: ${unansweredNums.join(", ")}</div>`);
  } else if (missedNums.length) {
    parts.push(`<div class="sub">Missed: ${missedNums.join(", ")}</div>`);
  }

  if (missedNums.length > 0) {
    parts.push(`<button type="button" id="reviewBtn" class="reviewBtn">Review Missed Questions</button>`);
  }

  $("result").innerHTML = parts.join("");

  if (missedNums.length > 0) {
    $("reviewBtn").addEventListener("click", enterReviewMode);
  }

  const name = ($("studentName").value || "").trim() || "—";
  const attempt = {
    ts: Date.now(),
    student: name,
    score,
    total,
    rating: r.label,
    ratingClass: r.cls
  };

  const attempts = getAttempts();
  attempts.unshift(attempt);
  setAttempts(attempts.slice(0, 50));
}

// ============================================
// NAV ACTIONS
// ============================================
function nextQuestion() {
  if (inReviewMode) {
    if (reviewPos < reviewQueue.length - 1) {
      reviewPos++;
      currentIndex = reviewQueue[reviewPos];
      renderCurrentQuestion();
    }
    return;
  }

  if (currentIndex < QUIZ.questions.length - 1) {
    currentIndex++;
    renderCurrentQuestion();
  }
}

function prevQuestion() {
  if (inReviewMode) {
    if (reviewPos > 0) {
      reviewPos--;
      currentIndex = reviewQueue[reviewPos];
      renderCurrentQuestion();
    }
    return;
  }

  if (currentIndex > 0) {
    currentIndex--;
    renderCurrentQuestion();
  }
}

function resetAll() {
  QUIZ.questions.forEach(q => answers[q.id] = null);
  currentIndex = 0;

  inReviewMode = false;
  reviewQueue = [];
  reviewPos = 0;

  $("result").innerHTML = "";
  renderCurrentQuestion();
}

// ============================================
// SECRET INSTRUCTOR ACCESS (LONG PRESS ON "Y")
// ============================================
function enableAdminLongPress() {
  const trigger = document.getElementById("adminTrigger");
  if (!trigger) return;

  const HOLD_MS = 1500;
  let timer = null;
  let moved = false;

  const start = (e) => {
    moved = false;
    // Prevent iOS text selection / callout
    if (e && e.preventDefault) e.preventDefault();

    clearTimeout(timer);
timer = setTimeout(() => {
  const nameInput = document.getElementById("studentName");
  const nameValue = nameInput ? nameInput.value.trim().toLowerCase() : "";

  if (nameValue.includes("isaac")) {
    try { navigator.vibrate && navigator.vibrate(30); } catch {}
    window.location.href = "admin.html";
  }
  // If name does NOT include "isaac", nothing happens
}, HOLD_MS);
  };

  const cancel = () => {
    clearTimeout(timer);
    timer = null;
  };

  const markMove = () => { moved = true; cancel(); };

  // Touch + mouse support
  trigger.addEventListener("touchstart", start, { passive: false });
  trigger.addEventListener("touchend", cancel);
  trigger.addEventListener("touchcancel", cancel);
  trigger.addEventListener("touchmove", markMove);

  trigger.addEventListener("mousedown", start);
  trigger.addEventListener("mouseup", cancel);
  trigger.addEventListener("mouseleave", cancel);
  trigger.addEventListener("mousemove", () => { if (timer) markMove(); });
}

// ============================================
// INIT
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  $("quizTitle").textContent = QUIZ.title;

  const nameInput = $("studentName");

  function nameIsValid() {
    return nameInput.value.trim().length > 0;
  }

function updateNameRequirement() {
  const valid = nameIsValid();
  const errorEl = $("nameError");

  $("nextBtn").disabled = !valid;
  $("submitBtn").disabled = !valid;

  if (!valid) {
    nameInput.style.borderColor = "rgba(255,77,77,0.6)";
    if (errorEl) errorEl.style.display = "block";
  } else {
    nameInput.style.borderColor = "";
    if (errorEl) errorEl.style.display = "none";
  }
}

  // Watch for typing
  nameInput.addEventListener("input", updateNameRequirement);

function bindTap(id, handler) {
  const el = $(id);
  if (!el) return;

  // Normal desktop click
  el.addEventListener("click", handler);

  // iPhone Safari: make taps reliable
  el.addEventListener("touchend", (e) => {
    e.preventDefault();
    e.stopPropagation();
    handler(e);
  }, { passive: false });
}

bindTap("backBtn", prevQuestion);
bindTap("nextBtn", nextQuestion);
bindTap("submitBtn", showSummary);
bindTap("resetBtn", resetAll);

  enableAdminLongPress();

  updateNameRequirement();
  renderCurrentQuestion();
});

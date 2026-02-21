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

// iPhone Safari ghost-tap guard
let navLockUntil = 0;

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

function nameIsValid() {
  const nameInput = $("studentName");
  return !!nameInput && nameInput.value.trim().length > 0;
}

// Stronger iPhone fix: temporarily disable interaction on the whole question area
function lockQuestionStage(ms = 650) {
  navLockUntil = Date.now() + ms;

  const stage = $("questionStage");
  if (!stage) return;

  stage.style.pointerEvents = "none";

  setTimeout(() => {
    // Only unlock if our lock window has passed
    if (Date.now() >= navLockUntil) {
      stage.style.pointerEvents = "";
    }
  }, ms);
}

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
  const pill = $("progressPill");
  if (!pill) return;

  if (inReviewMode) {
    const remaining = reviewQueue.length;
    const pos = Math.min(reviewPos + 1, Math.max(remaining, 1));
    pill.textContent = `Review: ${pos}/${Math.max(remaining, 1)} remaining`;
  } else {
    pill.textContent = `Question ${currentIndex + 1}/${QUIZ.questions.length}`;
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
// NAME REQUIREMENT (LOCK QUIZ UNTIL NAME ENTERED)
// ============================================
function updateNameRequirement() {
  const valid = nameIsValid();
  const nameInput = $("studentName");
  const errorEl = $("nameError");

  // Lock nav/actions until name exists
  const backBtn = $("backBtn");
  const nextBtn = $("nextBtn");
  const submitBtn = $("submitBtn");
  const resetBtn = $("resetBtn");

  if (backBtn) backBtn.disabled = !valid;
  if (nextBtn) nextBtn.disabled = !valid;
  if (submitBtn) submitBtn.disabled = !valid;

  // I recommend leaving Reset enabled so you can always recover from a weird state
  if (resetBtn) resetBtn.disabled = false;

  if (!valid) {
    if (nameInput) nameInput.style.borderColor = "rgba(255,77,77,0.6)";
    if (errorEl) errorEl.style.display = "block";
  } else {
    if (nameInput) nameInput.style.borderColor = "";
    if (errorEl) errorEl.style.display = "none";
  }

  // Re-render so answers lock/unlock immediately
  renderCurrentQuestion();
}

// ============================================
// RENDER (ONE QUESTION AT A TIME)
// ============================================
function renderCurrentQuestion() {
  const q = QUIZ.questions[currentIndex];
  const stage = $("questionStage");
  if (!stage) return;

  stage.innerHTML = "";

  const card = document.createElement("div");
  card.className = "qCard";
  card.dataset.qid = q.id;

  const p = document.createElement("p");
  p.className = "qText";
  p.innerHTML = `<strong>${currentIndex + 1}. ${q.text}</strong>`;
  card.appendChild(p);

  const lockAnswers = !nameIsValid();

  q.choices.forEach((choice, idx) => {
    const label = document.createElement("label");
    label.className = "choice";

    // iPhone Safari ghost-tap guard: block a leftover tap right after Next/Back
    label.addEventListener("touchend", (e) => {
      if (Date.now() < navLockUntil) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, { passive: false });

    label.addEventListener("click", (e) => {
      if (Date.now() < navLockUntil) {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    const input = document.createElement("input");
    input.type = "radio";
    input.name = q.id;
    input.value = String(idx);
    input.disabled = lockAnswers;

    if (answers[q.id] === idx) input.checked = true;

    input.addEventListener("change", () => {
      // Ghost-tap guard: ignore any selection immediately after navigation
      if (Date.now() < navLockUntil) return;

      // Hard lock: ignore if name isn't valid
      if (!nameIsValid()) return;

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
        const result = $("result");
        if (result) result.innerHTML = "";
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
  const backBtn = $("backBtn");
  const nextBtn = $("nextBtn");
  const submitBtn = $("submitBtn");
  const resetBtn = $("resetBtn");

  // Always allow reset as a safe escape hatch
  if (resetBtn) resetBtn.disabled = false;

  // If name missing, keep quiz locked
  if (!nameIsValid()) {
    if (backBtn) backBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
    if (submitBtn) submitBtn.disabled = true;

    // Still show proper Next/Submit layout depending on last question
    const onLast = currentIndex === QUIZ.questions.length - 1;
    if (submitBtn) submitBtn.style.display = onLast ? "inline-block" : "none";
    if (nextBtn) nextBtn.style.display = onLast ? "none" : "inline-block";
    return;
  }

  if (inReviewMode) {
    if (backBtn) backBtn.disabled = reviewQueue.length <= 1 || reviewPos === 0;
    if (nextBtn) nextBtn.disabled = reviewQueue.length <= 1 || reviewPos >= reviewQueue.length - 1;

    if (submitBtn) submitBtn.style.display = "none";
    if (nextBtn) nextBtn.style.display = "inline-block";
    if (backBtn) backBtn.style.display = "inline-block";
    return;
  }

  if (backBtn) backBtn.disabled = currentIndex === 0;
  if (nextBtn) nextBtn.disabled = currentIndex === QUIZ.questions.length - 1;

  const onLast = currentIndex === QUIZ.questions.length - 1;
  if (submitBtn) submitBtn.style.display = onLast ? "inline-block" : "none";
  if (nextBtn) nextBtn.style.display = onLast ? "none" : "inline-block";
}

// ============================================
// FIREWORKS (PERFECT SCORE) - continuous until click
// IMPORTANT: does NOT touch your result/summary text
// ============================================
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

  // hiDPI scaling
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const particles = [];
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

  let running = true;
  let burstTimer = null;

  function stopAll(e) {
    // Eat the tap so it doesn't click buttons underneath
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    running = false;

    if (burstTimer) {
      clearInterval(burstTimer);
      burstTimer = null;
    }

    ctx.clearRect(0, 0, w, h);
    canvas.style.display = "none";

    // Remove listeners (capture = true)
    window.removeEventListener("pointerdown", stopAll, true);
    window.removeEventListener("touchstart", stopAll, true);
    window.removeEventListener("mousedown", stopAll, true);
  }

  // Stop fireworks on any interaction (capture phase)
  window.addEventListener("pointerdown", stopAll, { capture: true, passive: false });
  window.addEventListener("touchstart", stopAll, { capture: true, passive: false });
  window.addEventListener("mousedown", stopAll, { capture: true, passive: false });

  // Spawn bursts continuously
  burstTimer = setInterval(() => {
    burst(
      w * (0.15 + Math.random() * 0.70),
      h * (0.15 + Math.random() * 0.50)
    );
    try { navigator.vibrate && navigator.vibrate(15); } catch {}
  }, 260);

  ctx.clearRect(0, 0, w, h);

  function step() {
    if (!running) return;

    // Trails effect
    ctx.fillStyle = "rgba(0,0,0,0.10)";
    ctx.fillRect(0, 0, w, h);

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
  if (!nameIsValid()) return;

  reviewQueue = computeMissedIndexes();
  if (reviewQueue.length === 0) return;

  inReviewMode = true;
  reviewPos = 0;
  currentIndex = reviewQueue[0];

  const result = $("result");
  if (result) {
    result.innerHTML = `<div class="sub">Review mode: fix the missed questions. As you correct one, it drops off the list.</div>`;
  }

  lockQuestionStage(650);
  renderCurrentQuestion();
}

function finishReviewMode() {
  inReviewMode = false;
  reviewQueue = [];
  reviewPos = 0;

  const result = $("result");
  if (result) {
    result.innerHTML =
      `<div class="big">Review complete ✅</div>
       <div class="sub">Nice. You corrected all missed questions. You can reset and retake anytime.</div>`;
  }

  currentIndex = 0;
  lockQuestionStage(650);
  renderCurrentQuestion();
}

function showSummary() {
  if (!nameIsValid()) return;

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

  const result = $("result");
  if (result) result.innerHTML = parts.join("");

  if (missedNums.length > 0) {
    const reviewBtn = $("reviewBtn");
    if (reviewBtn) reviewBtn.addEventListener("click", enterReviewMode);
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
  if (!nameIsValid()) return;

  if (inReviewMode) {
    if (reviewPos < reviewQueue.length - 1) {
      reviewPos++;
      currentIndex = reviewQueue[reviewPos];
      lockQuestionStage(650);
      renderCurrentQuestion();
    }
    return;
  }

  if (currentIndex < QUIZ.questions.length - 1) {
    currentIndex++;
    lockQuestionStage(650);
    renderCurrentQuestion();
  }
}

function prevQuestion() {
  if (!nameIsValid()) return;

  if (inReviewMode) {
    if (reviewPos > 0) {
      reviewPos--;
      currentIndex = reviewQueue[reviewPos];
      lockQuestionStage(650);
      renderCurrentQuestion();
    }
    return;
  }

  if (currentIndex > 0) {
    currentIndex--;
    lockQuestionStage(650);
    renderCurrentQuestion();
  }
}

function resetAll() {
  // Allow reset even if name is blank (helps recover from weird states)
  QUIZ.questions.forEach(q => answers[q.id] = null);
  currentIndex = 0;

  inReviewMode = false;
  reviewQueue = [];
  reviewPos = 0;

  const result = $("result");
  if (result) result.innerHTML = "";

  lockQuestionStage(300);
  renderCurrentQuestion();

  // re-check name lock state + message
  updateNameRequirement();
}

// ============================================
// SECRET INSTRUCTOR ACCESS (LONG PRESS ON "Y")
// ============================================
function enableAdminLongPress() {
  const trigger = document.getElementById("adminTrigger");
  if (!trigger) return;

  const HOLD_MS = 1500;
  let timer = null;

  const start = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    clearTimeout(timer);

    timer = setTimeout(() => {
      const nameInput = document.getElementById("studentName");
      const nameValue = nameInput ? nameInput.value.trim().toLowerCase() : "";

      if (nameValue.includes("isaac")) {
        try { navigator.vibrate && navigator.vibrate(30); } catch {}
        window.location.href = "admin.html";
      }
    }, HOLD_MS);
  };

  const cancel = () => {
    clearTimeout(timer);
    timer = null;
  };

  trigger.addEventListener("touchstart", start, { passive: false });
  trigger.addEventListener("touchend", cancel);
  trigger.addEventListener("touchcancel", cancel);

  trigger.addEventListener("mousedown", start);
  trigger.addEventListener("mouseup", cancel);
  trigger.addEventListener("mouseleave", cancel);
}

// ============================================
// iPHONE-SAFE TAP BINDING (avoids double fire of touch + click)
// ============================================
function bindTap(id, handler) {
  const el = $(id);
  if (!el) return;

  let justHandledTouch = false;

  el.addEventListener("touchend", (e) => {
    justHandledTouch = true;
    e.preventDefault();
    e.stopPropagation();
    handler(e);
    setTimeout(() => { justHandledTouch = false; }, 400);
  }, { passive: false });

  el.addEventListener("click", (e) => {
    if (justHandledTouch) return;
    handler(e);
  });
}

// ============================================
// INIT
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  const titleEl = $("quizTitle");
  if (titleEl) titleEl.textContent = QUIZ.title;

  const nameInput = $("studentName");
  if (nameInput) {
    nameInput.addEventListener("input", updateNameRequirement);
  }

  bindTap("backBtn", prevQuestion);
  bindTap("nextBtn", nextQuestion);
  bindTap("submitBtn", showSummary);
  bindTap("resetBtn", resetAll);

  enableAdminLongPress();

  updateNameRequirement(); // shows message + locks quiz immediately
  renderCurrentQuestion();
});

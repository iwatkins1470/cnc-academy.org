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

// ============================================
// HELPERS
// ============================================
function $(id) { return document.getElementById(id); }

function formatTime(ts) {
  // simple local time string
  try { return new Date(ts).toLocaleString(); } catch { return String(ts); }
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
  $("progressPill").textContent = `Question ${currentIndex + 1}/${QUIZ.questions.length}`;
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
      updateNavButtons();
      // Clear result when changing answers (keeps it feeling “live”)
      $("result").innerHTML = "";
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
  $("backBtn").disabled = currentIndex === 0;
  $("nextBtn").disabled = currentIndex === QUIZ.questions.length - 1;

  // only show Submit on last question
  const onLast = currentIndex === QUIZ.questions.length - 1;
  $("submitBtn").style.display = onLast ? "inline-block" : "none";
  $("nextBtn").style.display = onLast ? "none" : "inline-block";
}

// ============================================
// SCORING + SUMMARY + SAVE ATTEMPT
// ============================================
function scoreQuiz() {
  let score = 0;
  const missed = [];
  const unanswered = [];

  QUIZ.questions.forEach((q, i) => {
    const picked = answers[q.id];
    if (picked === null) {
      unanswered.push(i + 1);
      missed.push(i + 1);
      return;
    }
    if (picked === q.correctIndex) score++;
    else missed.push(i + 1);
  });

  return { score, total: QUIZ.questions.length, missed, unanswered };
}

function showSummary() {
  const { score, total, missed, unanswered } = scoreQuiz();
  const r = ratingFor(score, total);

  const parts = [];
  parts.push(`<div class="big">Score: ${score}/${total}</div>`);
  parts.push(`<div class="rating ${r.cls}">${r.label}</div>`);
  parts.push(`<div class="sub">${r.detail}</div>`);

  if (unanswered.length) {
    parts.push(`<div class="sub">Unanswered: ${unanswered.join(", ")}</div>`);
  } else if (missed.length) {
    parts.push(`<div class="sub">Missed: ${missed.join(", ")}</div>`);
  }

  $("result").innerHTML = parts.join("");

  // Save attempt to dashboard
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
  // keep last 50
  setAttempts(attempts.slice(0, 50));
  renderDashboard();
}

// ============================================
// DASHBOARD
// ============================================
function renderDashboard() {
  const attempts = getAttempts();
  $("attemptCountPill").textContent = `${attempts.length} attempt${attempts.length === 1 ? "" : "s"}`;

  const body = $("dashBody");
  body.innerHTML = "";

  attempts.forEach(a => {
    const tr = document.createElement("tr");

    const tdTime = document.createElement("td");
    tdTime.textContent = formatTime(a.ts);
    tr.appendChild(tdTime);

    const tdStudent = document.createElement("td");
    tdStudent.textContent = a.student || "—";
    tr.appendChild(tdStudent);

    const tdScore = document.createElement("td");
    tdScore.textContent = `${a.score}/${a.total}`;
    tr.appendChild(tdScore);

    const tdRating = document.createElement("td");
    const tag = document.createElement("span");
    tag.className = `tag ${a.ratingClass || "warn"}`;
    tag.textContent = a.rating || "—";
    tdRating.appendChild(tag);
    tr.appendChild(tdRating);

    body.appendChild(tr);
  });
}

function copyResultsToClipboard() {
  const attempts = getAttempts();
  if (!attempts.length) {
    alert("No results to copy yet.");
    return;
  }

  // CSV-ish text
  const lines = ["Time,Student,Score,Rating"];
  attempts.forEach(a => {
    const time = formatTime(a.ts).replaceAll(",", " ");
    const student = (a.student || "—").replaceAll(",", " ");
    const score = `${a.score}/${a.total}`;
    const rating = (a.rating || "—").replaceAll(",", " ");
    lines.push(`${time},${student},${score},${rating}`);
  });

  const text = lines.join("\n");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(
      () => alert("Copied results to clipboard."),
      () => fallbackCopy(text)
    );
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
    alert("Copied results to clipboard.");
  } catch {
    alert("Could not copy automatically. (Browser blocked it.)");
  }
  document.body.removeChild(ta);
}

// ============================================
// NAV ACTIONS
// ============================================
function nextQuestion() {
  if (currentIndex < QUIZ.questions.length - 1) {
    currentIndex++;
    renderCurrentQuestion();
  }
}

function prevQuestion() {
  if (currentIndex > 0) {
    currentIndex--;
    renderCurrentQuestion();
  }
}

function resetAll() {
  QUIZ.questions.forEach(q => answers[q.id] = null);
  currentIndex = 0;
  $("result").innerHTML = "";
  renderCurrentQuestion();
}

// ============================================
// INIT
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  $("quizTitle").textContent = QUIZ.title;

  $("backBtn").addEventListener("click", prevQuestion);
  $("nextBtn").addEventListener("click", nextQuestion);
  $("submitBtn").addEventListener("click", showSummary);
  $("resetBtn").addEventListener("click", resetAll);

  $("exportBtn").addEventListener("click", copyResultsToClipboard);
  $("clearBtn").addEventListener("click", () => {
    const ok = confirm("Clear all saved results on this device?");
    if (!ok) return;
    setAttempts([]);
    renderDashboard();
  });

  renderCurrentQuestion();
  renderDashboard();
});

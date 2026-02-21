const STORAGE_KEY = "cnc_academy_attempts_v1";

function $(id) { return document.getElementById(id); }

function formatTime(ts) {
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

document.addEventListener("DOMContentLoaded", () => {
  renderDashboard();

  $("exportBtn").addEventListener("click", copyResultsToClipboard);
  $("clearBtn").addEventListener("click", () => {
    const ok = confirm("Clear all saved results on this device?");
    if (!ok) return;
    setAttempts([]);
    renderDashboard();
  });
});

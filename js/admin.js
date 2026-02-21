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

// Keep only one expanded row at a time
let expandedTs = null;

function normalizeMissedNums(a) {
  // Prefer the stored missed list if present (from updated student.js)
  if (Array.isArray(a.missedNums)) return a.missedNums;

  // Fallback: if you ever stored "missedNums" as strings etc.
  if (Array.isArray(a.missed)) return a.missed;

  return [];
}

function normalizeMissedTexts(a) {
  return Array.isArray(a.missedTexts) ? a.missedTexts : [];
}

function renderDashboard() {
  const attempts = getAttempts();

  const pill = $("attemptCountPill");
  if (pill) pill.textContent = `${attempts.length} attempt${attempts.length === 1 ? "" : "s"}`;

  const body = $("dashBody");
  if (!body) return;
  body.innerHTML = "";

  attempts.forEach(a => {
    const tr = document.createElement("tr");
    tr.style.cursor = "pointer";

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

    // ✅ NEW COLUMN: Missed
    const tdMissed = document.createElement("td");
    const missedNums = normalizeMissedNums(a);
    tdMissed.textContent = missedNums.length ? missedNums.join(", ") : "—";
    tr.appendChild(tdMissed);

    // Tap-to-expand if we have missed question text stored
    tr.addEventListener("click", () => {
      const missedTexts = normalizeMissedTexts(a);

      // If there’s nothing to expand, do nothing
      if (!missedTexts.length) return;

      // Collapse if this one is already expanded
      if (expandedTs === a.ts) {
        expandedTs = null;
        renderDashboard();
        return;
      }

      expandedTs = a.ts;
      renderDashboard();
    });

    body.appendChild(tr);

    // ✅ Expand row (details)
    if (expandedTs === a.ts) {
      const missedNums = normalizeMissedNums(a);
      const missedTexts = normalizeMissedTexts(a);

      const trDetails = document.createElement("tr");
      const tdDetails = document.createElement("td");

      // Must match number of columns in the table now (Time, Student, Score, Rating, Missed) = 5
      tdDetails.colSpan = 5;

      const wrap = document.createElement("div");
      wrap.style.padding = "10px 12px";
      wrap.style.margin = "6px 0";
      wrap.style.border = "1px solid rgba(255,255,255,0.10)";
      wrap.style.borderRadius = "12px";
      wrap.style.background = "rgba(0,0,0,0.18)";

      const title = document.createElement("div");
      title.style.fontWeight = "900";
      title.style.marginBottom = "6px";
      title.textContent = "Missed question details:";
      wrap.appendChild(title);

      const ul = document.createElement("ul");
      ul.style.margin = "0";
      ul.style.paddingLeft = "18px";

      missedTexts.forEach((t, i) => {
        const li = document.createElement("li");
        const num = missedNums[i] ?? "—";
        li.textContent = `Q${num}: ${t}`;
        ul.appendChild(li);
      });

      wrap.appendChild(ul);

      const hint = document.createElement("div");
      hint.style.marginTop = "8px";
      hint.style.opacity = "0.75";
      hint.style.fontSize = "0.9rem";
      hint.textContent = "Tap the row again to collapse.";
      wrap.appendChild(hint);

      tdDetails.appendChild(wrap);
      trDetails.appendChild(tdDetails);
      body.appendChild(trDetails);
    }
  });
}

function copyResultsToClipboard() {
  const attempts = getAttempts();
  if (!attempts.length) {
    alert("No results to copy yet.");
    return;
  }

  // ✅ Include Missed
  const lines = ["Time,Student,Score,Rating,Missed"];
  attempts.forEach(a => {
    const time = formatTime(a.ts).replaceAll(",", " ");
    const student = (a.student || "—").replaceAll(",", " ");
    const score = `${a.score}/${a.total}`;
    const rating = (a.rating || "—").replaceAll(",", " ");
    const missed = normalizeMissedNums(a).length ? normalizeMissedNums(a).join(" ") : "—";
    lines.push(`${time},${student},${score},${rating},${missed}`);
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

  const exportBtn = $("exportBtn");
  if (exportBtn) exportBtn.addEventListener("click", copyResultsToClipboard);

  const clearBtn = $("clearBtn");
  if (clearBtn) clearBtn.addEventListener("click", () => {
    const ok = confirm("Clear all saved results on this device?");
    if (!ok) return;
    setAttempts([]);
    expandedTs = null;
    renderDashboard();
  });
});

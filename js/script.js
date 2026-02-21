// ============================================
// CNC ACADEMY QUIZ DATA (EDIT QUESTIONS HERE)
// ============================================

const QUIZ = {
  title: "CNC Maintenance & Fundamentals Quiz",
  questions: [
    {
      id: "q1",
      text: "On a CNC lathe, which axis controls radial (in/out) movement?",
      choices: ["X Axis", "Z Axis", "Y Axis", "C Axis"],
      correctIndex: 0,
    },
    {
      id: "q2",
      text: "Static accuracy primarily evaluates:",
      choices: [
        "Cutting vibration under load",
        "Servo tuning stability",
        "Geometric positioning accuracy",
        "Tool life performance"
      ],
      correctIndex: 2,
    },
    {
      id: "q3",
      text: "Before tuning servos after a crash, the first step should be:",
      choices: [
        "Increase gain values",
        "Verify mechanical integrity",
        "Clear all alarms",
        "Replace encoder"
      ],
      correctIndex: 1,
    },
    {
      id: "q4",
      text: "Which instrument is most commonly used to measure axis straightness?",
      choices: [
        "Dial indicator",
        "Thermocouple",
        "Micrometer",
        "Torque wrench"
      ],
      correctIndex: 0,
    },
    {
      id: "q5",
      text: "Laser interferometer systems are typically used to measure:",
      choices: [
        "Ball screw torque",
        "Axis positioning error",
        "Spindle horsepower",
        "Hydraulic pressure"
      ],
      correctIndex: 1,
    },
    {
      id: "q6",
      text: "Mechanical alignment checks fall under which category?",
      choices: [
        "Dynamic accuracy",
        "Electrical maintenance",
        "Static accuracy",
        "Tool compensation"
      ],
      correctIndex: 2,
    },
    {
      id: "q7",
      text: "Pitch error compensation corrects errors in:",
      choices: [
        "Spindle RPM",
        "Axis linear positioning",
        "Coolant pressure",
        "Tool magazine indexing"
      ],
      correctIndex: 1,
    },
    {
      id: "q8",
      text: "On a 5-axis machine, G43.4 typically activates:",
      choices: [
        "Spindle orientation",
        "Tool length compensation with TCP",
        "Rapid override",
        "Coolant through spindle"
      ],
      correctIndex: 1,
    },
    {
      id: "q9",
      text: "Excessive servo gain may cause:",
      choices: [
        "Axis sluggishness",
        "Thermal expansion",
        "Oscillation or vibration",
        "Spindle taper wear"
      ],
      correctIndex: 2,
    },
    {
      id: "q10",
      text: "Which condition most directly affects perpendicularity between axes?",
      choices: [
        "Improper lubrication",
        "Mechanical misalignment",
        "Low coolant level",
        "Incorrect feed rate"
      ],
      correctIndex: 1,
    }
  ]
};

// ============================================
// QUIZ ENGINE (DO NOT EDIT BELOW)
// ============================================

function renderQuiz() {
  const titleEl = document.getElementById("quizTitle");
  const formEl = document.getElementById("quizForm");

  titleEl.textContent = QUIZ.title;
  formEl.innerHTML = "";

  QUIZ.questions.forEach((q, index) => {
    const card = document.createElement("div");
    card.className = "question";
    card.dataset.qid = q.id;

    const prompt = document.createElement("p");
    prompt.innerHTML = `<strong>${index + 1}. ${q.text}</strong>`;
    card.appendChild(prompt);

    q.choices.forEach((choice, cIndex) => {
      const label = document.createElement("label");
      label.className = "choice";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = q.id;
      input.value = cIndex;

      label.appendChild(input);
      label.appendChild(document.createTextNode(" " + choice));
      card.appendChild(label);
    });

    const feedback = document.createElement("div");
    feedback.className = "feedback";
    card.appendChild(feedback);

    formEl.appendChild(card);
  });

  document.getElementById("result").textContent = "";
}

function submitQuiz() {
  let score = 0;
  let missed = [];

  QUIZ.questions.forEach((q, index) => {
    const picked = document.querySelector(`input[name="${q.id}"]:checked`);
    const card = document.querySelector(`[data-qid="${q.id}"]`);
    const feedback = card.querySelector(".feedback");

    card.classList.remove("correct", "incorrect", "unanswered");
    feedback.textContent = "";

    if (!picked) {
      card.classList.add("unanswered");
      feedback.textContent = "No answer selected.";
      missed.push(index + 1);
      return;
    }

    if (Number(picked.value) === q.correctIndex) {
      score++;
      card.classList.add("correct");
      feedback.textContent = "Correct.";
    } else {
      card.classList.add("incorrect");
      feedback.textContent =
        "Incorrect. Correct answer: " + q.choices[q.correctIndex];
      missed.push(index + 1);
    }
  });

  const total = QUIZ.questions.length;
  const result = document.getElementById("result");

  if (missed.length > 0) {
    result.textContent =
      `Score: ${score}/${total} — Missed: ${missed.join(", ")}`;
  } else {
    result.textContent = `Score: ${score}/${total} — Perfect!`;
  }
}

function resetQuiz() {
  document.querySelectorAll("input[type='radio']").forEach((el) => {
    el.checked = false;
  });

  document.querySelectorAll(".question").forEach((card) => {
    card.classList.remove("correct", "incorrect", "unanswered");
    card.querySelector(".feedback").textContent = "";
  });

  document.getElementById("result").textContent = "";
}

document.addEventListener("DOMContentLoaded", function () {
  renderQuiz();
  document.getElementById("submitBtn").addEventListener("click", submitQuiz);
  document.getElementById("resetBtn").addEventListener("click", resetQuiz);
});

# cnc-academy.org
Online class testing webpage
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CNC Academy - Quiz</title>
<style>
body {
    font-family: Arial, sans-serif;
    background: #f4f6f8;
    margin: 0;
    padding: 0;
}

header {
    background: #cc0000;
    color: white;
    padding: 20px;
    text-align: center;
}

.container {
    max-width: 800px;
    margin: 40px auto;
    background: white;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

h2 {
    margin-top: 0;
}

.question {
    margin-bottom: 25px;
}

button {
    background: #cc0000;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
}

button:hover {
    background: #990000;
}

.result {
    margin-top: 20px;
    font-weight: bold;
}

.correct {
    color: green;
}

.incorrect {
    color: red;
}
</style>
</head>
<body>

<header>
    <h1>CNC Academy</h1>
    <p>Training Review Quiz</p>
</header>

<div class="container">
    <h2>Quiz</h2>

    <div class="question">
        <p><strong>1. On a CNC lathe, which axis controls radial (in/out) movement?</strong></p>
        <label><input type="radio" name="q1" value="0"> X Axis</label><br>
        <label><input type="radio" name="q1" value="1"> Z Axis</label><br>
        <label><input type="radio" name="q1" value="2"> A Axis</label><br>
        <label><input type="radio" name="q1" value="3"> B Axis</label>
    </div>

    <div class="question">
        <p><strong>2. Static accuracy refers to:</strong></p>
        <label><input type="radio" name="q2" value="0"> Cutting performance only</label><br>
        <label><input type="radio" name="q2" value="1"> Geometric positioning checks</label><br>
        <label><input type="radio" name="q2" value="2"> Servo alarm history</label><br>
        <label><input type="radio" name="q2" value="3"> Spindle speed only</label>
    </div>

    <div class="question">
        <p><strong>3. Before tuning servos after a crash, you should:</strong></p>
        <label><input type="radio" name="q3" value="0"> Increase gain immediately</label><br>
        <label><input type="radio" name="q3" value="1"> Verify mechanical condition first</label><br>
        <label><input type="radio" name="q3" value="2"> Replace control board</label><br>
        <label><input type="radio" name="q3" value="3"> Disable alarms</label>
    </div>

    <button onclick="submitQuiz()">Submit Quiz</button>

    <div id="result" class="result"></div>
</div>

<script>
function submitQuiz() {
    let score = 0;

    let answers = {
        q1: "0",
        q2: "1",
        q3: "1"
    };

    for (let question in answers) {
        let selected = document.querySelector('input[name="' + question + '"]:checked');
        if (selected && selected.value === answers[question]) {
            score++;
        }
    }

    let resultDiv = document.getElementById("result");
    resultDiv.innerHTML = "You scored " + score + " out of 3.";

    if (score === 3) {
        resultDiv.className = "result correct";
    } else {
        resultDiv.className = "result incorrect";
    }
}
</script>

</body>
</html>
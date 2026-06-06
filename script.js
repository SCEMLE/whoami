let masterQuestionsList = {};
let filteredQuestions = [];
let index = 0;

// Tracker state
let correctCount = 0;
let incorrectCount = 0;

fetch('./questions.json')
    .then(response => response.json())
    .then(data => {
        masterQuestionsList = data;
        buildDropdowns();
    })
    .catch(error => {
        console.error("Error connecting to database:", error);
        document.getElementById("questionOutput").textContent = "Error loading equations database.";
    });

function buildDropdowns() {
    const subjectDropdown = document.getElementById("subjectDropdown");
    subjectDropdown.innerHTML = "";
    const subjects = Object.keys(masterQuestionsList);
    if (subjects.length === 0) return;

    subjects.forEach(subject => {
        const option = document.createElement("option");
        option.value = subject;
        option.textContent = subject;
        subjectDropdown.appendChild(option);
    });

    subjectDropdown.addEventListener("change", updateUnitDropdown);
    updateUnitDropdown();
}

function updateUnitDropdown() {
    const selectedSubject = document.getElementById("subjectDropdown").value;
    const unitDropdown = document.getElementById("unitDropdown");
    
    unitDropdown.innerHTML = '<option value="all">All Units Combined</option>';
    if (!masterQuestionsList[selectedSubject]) return;

    const units = Object.keys(masterQuestionsList[selectedSubject]);
    units.sort((a, b) => {
        const numA = parseInt(a.replace("Unit ", ""));
        const numB = parseInt(b.replace("Unit ", ""));
        return numA - numB;
    });

    units.forEach(unitName => {
        const option = document.createElement("option");
        option.value = unitName;
        option.textContent = unitName;
        unitDropdown.appendChild(option);
    });
}

function filterQuestions() {
    const selectedSubject = document.getElementById("subjectDropdown").value;
    const selectedUnitValue = document.getElementById("unitDropdown").value;

    filteredQuestions = [];
    index = 0;

    if (!masterQuestionsList[selectedSubject]) {
        displayQuestion();
        return;
    }

    if (selectedUnitValue === "all") {
        const units = Object.keys(masterQuestionsList[selectedSubject]);
        units.forEach(unitNum => {
            filteredQuestions = filteredQuestions.concat(masterQuestionsList[selectedSubject][unitNum]);
        });
        filteredQuestions.sort(() => Math.random() - 0.5);
    } else {
        if (masterQuestionsList[selectedSubject][selectedUnitValue]) {
            filteredQuestions = [...masterQuestionsList[selectedSubject][selectedUnitValue]];
        }
    }

    // Initialize tracking variables for the current session run
    filteredQuestions.forEach(q => {
        q.userAttempted = false;
        q.userCorrect = null;
    });

    displayQuestion();
}

function displayQuestion() {
    const typeLabel = document.getElementById("typeOutput");
    const questionLabel = document.getElementById("questionOutput");
    const feedbackLabel = document.getElementById("feedbackOutput");
    const explanationLabel = document.getElementById("explanationOutput");
    const progressLabel = document.getElementById("progressLabel");
    const inputSection = document.getElementById("inputSection");
    const userInput = document.getElementById("userAnswer");

    feedbackLabel.textContent = "";
    explanationLabel.textContent = "";
    explanationLabel.style.display = "none";
    userInput.value = "";

    if (filteredQuestions.length === 0) {
        typeLabel.textContent = "Empty";
        questionLabel.textContent = "No math problems found matching this selection.";
        progressLabel.textContent = "";
        inputSection.style.display = "none";
        return;
    }

    inputSection.style.display = "flex";
    const currentQ = filteredQuestions[index];
    
    typeLabel.textContent = currentQ.type;
    questionLabel.textContent = currentQ.question;
    progressLabel.textContent = `${index + 1} / ${filteredQuestions.length}`;

    // If already answered previously in the session, lock it down and show explanation
    if (currentQ.userAttempted) {
        userInput.value = currentQ.savedInput || "";
        if (currentQ.userCorrect) {
            feedbackLabel.textContent = "✅ Correct";
            feedbackLabel.style.color = "#2ecc71";
        } else {
            feedbackLabel.textContent = `❌ Incorrect (Correct Answer: ${currentQ.answer})`;
            feedbackLabel.style.color = "#e74c3c";
        }
        showExplanation(currentQ);
    }
}

function checkAnswer() {
    if (filteredQuestions.length === 0) return;
    const currentQ = filteredQuestions[index];
    
    if (currentQ.userAttempted) return; // Prevent double checking/score stuffing

    const userInput = document.getElementById("userAnswer").value.trim().toLowerCase().replace(/\s+/g, '');
    const cleanAnswer = currentQ.answer.trim().toLowerCase().replace(/\s+/g, '');
    
    currentQ.userAttempted = true;
    currentQ.savedInput = document.getElementById("userAnswer").value;

    const feedbackLabel = document.getElementById("feedbackOutput");

    if (userInput === cleanAnswer) {
        currentQ.userCorrect = true;
        correctCount++;
        document.getElementById("correctCounter").textContent = correctCount;
        feedbackLabel.textContent = "✅ Correct!";
        feedbackLabel.style.color = "#2ecc71";
    } else {
        currentQ.userCorrect = false;
        incorrectCount++;
        document.getElementById("incorrectCounter").textContent = incorrectCount;
        feedbackLabel.textContent = `❌ Incorrect. Expected: ${currentQ.answer}`;
        feedbackLabel.style.color = "#e74c3c";
    }

    showExplanation(currentQ);
}

function showExplanation(questionObj) {
    const explanationLabel = document.getElementById("explanationOutput");
    explanationLabel.innerHTML = `<strong>Explanation:</strong> ${questionObj.explanation || "No explanation breakdown provided for this equation."}`;
    explanationLabel.style.display = "block";
}

document.getElementById("submitButton").addEventListener("click", filterQuestions);
document.getElementById("checkAnswerButton").addEventListener("click", checkAnswer);

document.getElementById("rightButton").addEventListener("click", function() {
    if (index < filteredQuestions.length - 1) {
        index++;
        displayQuestion();
    }
});

document.getElementById("leftButton").addEventListener("click", function() {
    if (index > 0) {
        index--;
        displayQuestion();
    }
});

// Allow hitting entry key inside text box to process submission
document.getElementById("userAnswer").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        checkAnswer();
    }
});

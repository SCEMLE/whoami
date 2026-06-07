let masterQuestionsList = {};
let filteredQuestions = [];
let index = 0;

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

    // Prepare each question with generated choices
    filteredQuestions.forEach(q => {
        q.userAttempted = false;
        q.userCorrect = null;
        q.chosenAnswer = null;
        q.generatedChoices = generateMultipleChoiceOptions(q, selectedSubject);
    });

    displayQuestion();
}

// Pulls 3 fake answers from alternative questions within the matching dataset to build choices
function generateMultipleChoiceOptions(currentQuestion, subject) {
    let pool = [];
    const units = Object.keys(masterQuestionsList[subject]);
    
    units.forEach(u => {
        masterQuestionsList[subject][u].forEach(q => {
            if (q.answer !== currentQuestion.answer) {
                pool.push(q.answer);
            }
        });
    });

    // Deduplicate pool values
    pool = [...new Set(pool)];
    
    // Shuffle the unique fakes and pick up to 3
    pool.sort(() => Math.random() - 0.5);
    let distractors = pool.slice(0, 3);
    
    // Combine with correct option, and shuffle entirely
    let choices = [currentQuestion.answer, ...distractors];
    choices.sort(() => Math.random() - 0.5);
    
    return choices;
}

function displayQuestion() {
    const typeLabel = document.getElementById("typeOutput");
    const questionLabel = document.getElementById("questionOutput");
    const feedbackLabel = document.getElementById("feedbackOutput");
    const explanationLabel = document.getElementById("explanationOutput");
    const progressLabel = document.getElementById("progressLabel");
    const optionsContainer = document.getElementById("optionsContainer");

    feedbackLabel.textContent = "";
    explanationLabel.textContent = "";
    explanationLabel.style.display = "none";
    optionsContainer.innerHTML = "";

    if (filteredQuestions.length === 0) {
        typeLabel.textContent = "Empty";
        questionLabel.textContent = "No math problems found matching this selection.";
        progressLabel.textContent = "";
        return;
    }

    const currentQ = filteredQuestions[index];
    typeLabel.textContent = currentQ.type;
    questionLabel.textContent = currentQ.question;
    progressLabel.textContent = `${index + 1} / ${filteredQuestions.length}`;

    // Render option buttons
    currentQ.generatedChoices.forEach(choice => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.textContent = choice;
        
        if (currentQ.userAttempted) {
            btn.disabled = true;
            // Style colors based on what happened
            if (choice === currentQ.answer) {
                btn.classList.add("correct");
            } else if (choice === currentQ.chosenAnswer) {
                btn.classList.add("incorrect");
            }
        } else {
            btn.addEventListener("click", () => handleOptionSelection(choice, btn));
        }
        optionsContainer.appendChild(btn);
    });

    if (currentQ.userAttempted) {
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

function handleOptionSelection(selectedChoice, clickedButton) {
    const currentQ = filteredQuestions[index];
    if (currentQ.userAttempted) return;

    currentQ.userAttempted = true;
    currentQ.chosenAnswer = selectedChoice;

    const feedbackLabel = document.getElementById("feedbackOutput");

    // Disable all choice selections instantly
    const buttons = document.querySelectorAll(".option-btn");
    buttons.forEach(btn => btn.disabled = true);

    if (selectedChoice === currentQ.answer) {
        currentQ.userCorrect = true;
        correctCount++;
        document.getElementById("correctCounter").textContent = correctCount;
        clickedButton.classList.add("correct");
        feedbackLabel.textContent = "✅ Correct!";
        feedbackLabel.style.color = "#2ecc71";
    } else {
        currentQ.userCorrect = false;
        incorrectCount++;
        document.getElementById("incorrectCounter").textContent = incorrectCount;
        clickedButton.classList.add("incorrect");
        
        // Find and highlight correct selection choice option
        buttons.forEach(btn => {
            if (btn.textContent === currentQ.answer) {
                btn.classList.add("correct");
            }
        });

        feedbackLabel.textContent = `❌ Incorrect.`;
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

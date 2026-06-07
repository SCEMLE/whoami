const DATA_URL = "calcab.json";

let masterQuestionsList = {}; 
let filteredQuestions = [];   
let currentQuestionIndex = 0;
let correctCount = 0;
let incorrectCount = 0;

const subjectDropdown = document.getElementById("subjectDropdown");
const unitDropdown = document.getElementById("unitDropdown");
const submitButton = document.getElementById("submitButton");
const typeOutput = document.getElementById("typeOutput");
const questionOutput = document.getElementById("questionOutput");
const optionsContainer = document.getElementById("optionsContainer");
const feedbackOutput = document.getElementById("feedbackOutput");
const explanationOutput = document.getElementById("explanationOutput");
const leftButton = document.getElementById("leftButton");
const rightButton = document.getElementById("rightButton");
const progressLabel = document.getElementById("progressLabel");
const correctCounter = document.getElementById("correctCounter");
const incorrectCounter = document.getElementById("incorrectCounter");

async function loadInitializationData() {
    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        masterQuestionsList = await response.json();
        populateSubjectDropdown();
    } catch (err) {
        console.error("Fetch Error:", err);
        if (questionOutput) {
            questionOutput.innerHTML = `<strong>Error loading data file.</strong><br>
            Please check that:<br>
            1. Your file is named exactly <code>calcab.json</code><br>
            2. You are using a local environment tracker like <strong>Live Server</strong> instead of opening the file locally.`;
        }
    }
}

function populateSubjectDropdown() {
    if (!subjectDropdown || !masterQuestionsList) return;
    const subjects = Object.keys(masterQuestionsList);
    if (subjects.length === 0) return;

    subjectDropdown.innerHTML = subjects.map(s => `<option value="${s}">${s}</option>`).join("");
    subjectDropdown.addEventListener("change", populateUnitDropdown);
    populateUnitDropdown();
}

function populateUnitDropdown() {
    if (!subjectDropdown || !unitDropdown || !masterQuestionsList) return;
    const selectedSubject = subjectDropdown.value;
    if (!masterQuestionsList[selectedSubject]) return;

    const units = Object.keys(masterQuestionsList[selectedSubject]);
    
    let dropdownHTML = `<option value="ALL">All Units</option>`;
    dropdownHTML += units.map(u => `<option value="${u}">${u}</option>`).join("");
    unitDropdown.innerHTML = dropdownHTML;
}

function generateDynamicChoices(currentQuestion, currentSubject) {
    let globalAnswerPool = [];
    const realAnswer = currentQuestion.answer ? String(currentQuestion.answer).trim() : "0";
    
    if (masterQuestionsList && masterQuestionsList[currentSubject]) {
        Object.keys(masterQuestionsList[currentSubject]).forEach(u => {
            const currentUnitArray = masterQuestionsList[currentSubject][u];
            if (Array.isArray(currentUnitArray)) {
                currentUnitArray.forEach(q => {
                    if (q && q.answer) {
                        const cleanAns = String(q.answer).trim();
                        if (cleanAns !== realAnswer) globalAnswerPool.push(cleanAns);
                    }
                });
            }
        });
    }

    globalAnswerPool = [...new Set(globalAnswerPool)].sort(() => Math.random() - 0.5);
    let choices = globalAnswerPool.slice(0, 3);
    
    const fallbacks = ["0", "DNE", "1", "e^x", "C"];
    while (choices.length < 3) {
        const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        if (!choices.includes(fallback) && fallback !== realAnswer) choices.push(fallback);
    }
    
    choices.push(realAnswer);
    choices = [...new Set(choices)].slice(0, 4).sort(() => Math.random() - 0.5);
    return choices;
}

function startStudyingSession() {
    const selectedSubject = subjectDropdown.value;
    const selectedUnit = unitDropdown.value;
    filteredQuestions = [];

    if (masterQuestionsList[selectedSubject]) {
        if (selectedUnit === "ALL") {
            Object.keys(masterQuestionsList[selectedSubject]).forEach(u => {
                if (Array.isArray(masterQuestionsList[selectedSubject][u])) {
                    filteredQuestions = filteredQuestions.concat(masterQuestionsList[selectedSubject][u]);
                }
            });
            filteredQuestions.sort(() => Math.random() - 0.5);
        } else if (masterQuestionsList[selectedSubject][selectedUnit]) {
            filteredQuestions = [...masterQuestionsList[selectedSubject][selectedUnit]];
        }
    }

    if (filteredQuestions.length > 0) {
        currentQuestionIndex = 0;
        filteredQuestions.forEach(q => {
            if (q) {
                q.userAttempted = false;
                q.chosenAnswer = null;
                q.generatedOptionsList = generateDynamicChoices(q, selectedSubject);
            }
        });
        displayActiveQuestion();
    } else {
        typeOutput.textContent = "Empty";
        questionOutput.textContent = "No questions found.";
        optionsContainer.innerHTML = "";
        feedbackOutput.textContent = "";
        explanationOutput.style.display = "none";
        progressLabel.textContent = "0 / 0";
    }
}

function displayActiveQuestion() {
    optionsContainer.innerHTML = "";
    feedbackOutput.textContent = "";
    explanationOutput.style.display = "none";
    explanationOutput.innerHTML = "";

    const activeQuestion = filteredQuestions[currentQuestionIndex];
    if (!activeQuestion) return;

    const cleanAnswer = activeQuestion.answer ? String(activeQuestion.answer).trim() : "";
    typeOutput.textContent = activeQuestion.type || "Multiple Choice";
    questionOutput.textContent = activeQuestion.question || "";
    progressLabel.textContent = `${currentQuestionIndex + 1} / ${filteredQuestions.length}`;

    if (activeQuestion.type === "Multiple Choice") {
        if (Array.isArray(activeQuestion.generatedOptionsList)) {
            activeQuestion.generatedOptionsList.forEach(choice => {
                const btn = document.createElement("button");
                btn.className = "option-btn";
                btn.textContent = choice;
                
                if (activeQuestion.userAttempted) {
                    btn.disabled = true;
                    if (choice === cleanAnswer) btn.classList.add("correct");
                    else if (choice === activeQuestion.chosenAnswer) btn.classList.add("incorrect");
                } else {
                    btn.addEventListener("click", () => handleAnswerValidation(btn, choice, activeQuestion));
                }
                optionsContainer.appendChild(btn);
            });
        }
    } 
    else if (activeQuestion.type === "Free Response") {
        const inputWrapper = document.createElement("div");
        inputWrapper.style.display = "flex";
        inputWrapper.style.gap = "12px";
        inputWrapper.style.width = "100%";

        const txtInput = document.createElement("input");
        txtInput.type = "text";
        txtInput.placeholder = "Type your exact answer here...";
        txtInput.style.flexGrow = "1";
        txtInput.style.boxSizing = "border-box";

        const submitAnsBtn = document.createElement("button");
        submitAnsBtn.textContent = "Check Answer";
        submitAnsBtn.style.width = "auto";
        submitAnsBtn.style.padding = "14px 24px";
        submitAnsBtn.style.whiteSpace = "nowrap";

        if (activeQuestion.userAttempted) {
            txtInput.value = activeQuestion.chosenAnswer || "";
            txtInput.disabled = true;
            submitAnsBtn.disabled = true;
            submitAnsBtn.style.backgroundColor = "#cbd5e1";
            submitAnsBtn.style.color = "#475569";
            submitAnsBtn.style.cursor = "not-allowed";
            submitAnsBtn.style.transform = "none";
            submitAnsBtn.style.boxShadow = "none";
        } else {
            const processSubmission = () => {
                const userVal = txtInput.value.trim();
                if (!userVal) return;
                handleFreeResponseValidation(userVal, activeQuestion);
            };

            submitAnsBtn.addEventListener("click", processSubmission);
            txtInput.addEventListener("keypress", (e) => {
                if (e.key === 'Enter') processSubmission();
            });
        }

        inputWrapper.appendChild(txtInput);
        inputWrapper.appendChild(submitAnsBtn);
        optionsContainer.appendChild(inputWrapper);
    }

    if (activeQuestion.userAttempted) {
        const userClean = activeQuestion.chosenAnswer ? String(activeQuestion.chosenAnswer).trim().toLowerCase() : "";
        const systemClean = cleanAnswer.toLowerCase();

        if (userClean === systemClean) {
            feedbackOutput.textContent = "Correct! 🎉";
            feedbackOutput.style.color = "#10b981";
        } else {
            feedbackOutput.textContent = `Incorrect. Correct answer: ${cleanAnswer}`;
            feedbackOutput.style.color = "#ef4444";
        }
        showExplanationPanel(activeQuestion);
    }
}

function handleAnswerValidation(clickedBtn, userChoice, questionObj) {
    const allOptionButtons = optionsContainer.querySelectorAll(".option-btn");
    allOptionButtons.forEach(b => b.disabled = true);

    questionObj.userAttempted = true;
    questionObj.chosenAnswer = userChoice;
    const cleanAnswer = questionObj.answer ? String(questionObj.answer).trim() : "";

    if (userChoice === cleanAnswer) {
        clickedBtn.classList.add("correct");
        feedbackOutput.textContent = "Correct! 🎉";
        feedbackOutput.style.color = "#10b981";
        correctCount++;
        correctCounter.textContent = correctCount;
    } else {
        clickedBtn.classList.add("incorrect");
        feedbackOutput.textContent = `Incorrect. Correct answer: ${cleanAnswer}`;
        feedbackOutput.style.color = "#ef4444";
        incorrectCount++;
        incorrectCounter.textContent = incorrectCount;

        allOptionButtons.forEach(b => {
            if (b.textContent === cleanAnswer) b.classList.add("correct");
        });
    }
    showExplanationPanel(questionObj);
}

function handleFreeResponseValidation(userChoice, questionObj) {
    questionObj.userAttempted = true;
    questionObj.chosenAnswer = userChoice;
    const cleanAnswer = questionObj.answer ? String(questionObj.answer).trim() : "";

    if (userChoice.toLowerCase() === cleanAnswer.toLowerCase()) {
        correctCount++;
        correctCounter.textContent = correctCount;
    } else {
        incorrectCount++;
        incorrectCounter.textContent = incorrectCount;
    }
    
    displayActiveQuestion(); 
}

function showExplanationPanel(questionObj) {
    if (!explanationOutput) return;
    if (questionObj && questionObj.explanation) {
        explanationOutput.innerHTML = `<strong>Step-by-Step Explanation:</strong><br>${questionObj.explanation}`;
        explanationOutput.style.display = "block";
    } else {
        explanationOutput.innerHTML = "<em>No explicit explanation found for this problem entry.</em>";
        explanationOutput.style.display = "block";
    }
}

if (leftButton) {
    leftButton.addEventListener("click", () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            displayActiveQuestion();
        }
    });
}

if (rightButton) {
    rightButton.addEventListener("click", () => {
        if (currentQuestionIndex < filteredQuestions.length - 1) {
            currentQuestionIndex++;
            displayActiveQuestion();
        }
    });
}

if (submitButton) {
    submitButton.addEventListener("click", startStudyingSession);
}

document.addEventListener("DOMContentLoaded", loadInitializationData);

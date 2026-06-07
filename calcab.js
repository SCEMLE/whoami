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
        if (!response.ok) {
            throw new Error("HTTP error! status: " + response.status);
        }
        masterQuestionsList = await response.json();
        populateSubjectDropdown();
        startStudyingSession();
    } catch (err) {
        console.error("Fetch Error:", err);
        if (questionOutput) {
            questionOutput.textContent = "Error loading calcab.json file. Make sure it exists and is formatted cleanly.";
        }
    }
}

function populateSubjectDropdown() {
    if (!subjectDropdown || !masterQuestionsList) return;
    const subjects = Object.keys(masterQuestionsList);
    if (subjects.length === 0) return;

    subjectDropdown.innerHTML = subjects.map(s => '<option value="' + s + '">' + s + '</option>').join("");
    subjectDropdown.selectedIndex = 0;

    subjectDropdown.addEventListener("change", () => {
        populateUnitDropdown();
        startStudyingSession();
    });
    populateUnitDropdown();
}

function populateUnitDropdown() {
    if (!subjectDropdown || !unitDropdown || !masterQuestionsList) return;
    let selectedSubject = subjectDropdown.value;
    
    if (!selectedSubject || !masterQuestionsList[selectedSubject]) {
        const fallbackSubject = Object.keys(masterQuestionsList)[0];
        if (fallbackSubject) {
            subjectDropdown.value = fallbackSubject;
            selectedSubject = fallbackSubject;
        } else {
            return;
        }
    }

    const units = Object.keys(masterQuestionsList[selectedSubject] || {});
    let dropdownHTML = '<option value="ALL">All Units</option>';
    dropdownHTML += units.map(u => '<option value="' + u + '">' + u + '</option>').join("");
    unitDropdown.innerHTML = dropdownHTML;
    unitDropdown.value = "ALL";
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
                        if (cleanAns !== realAnswer) {
                            globalAnswerPool.push(cleanAns);
                        }
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
        if (!choices.includes(fallback) && fallback !== realAnswer) {
            choices.push(fallback);
        }
    }
    
    choices.push(realAnswer);
    choices = [...new Set(choices)].slice(0, 4).sort(() => Math.random() - 0.5);
    return choices;
}

function startStudyingSession() {
    if (!subjectDropdown || !unitDropdown) return;

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
            filteredQuestions.sort(() => Math.random() - 0.5);
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
        if (typeOutput) typeOutput.textContent = "Empty";
        if (questionOutput) questionOutput.textContent = "No questions found.";
        if (optionsContainer) optionsContainer.innerHTML = "";
        if (feedbackOutput) feedbackOutput.textContent = "";
        if (explanationOutput) explanationOutput.style.display = "none";
        if (progressLabel) progressLabel.textContent = "0 / 0";
    }
}

function displayActiveQuestion() {
    if (!optionsContainer || !feedbackOutput || !explanationOutput || !typeOutput || !questionOutput || !progressLabel) return;

    optionsContainer.innerHTML = "";
    feedbackOutput.textContent = "";
    explanationOutput.style.display = "none";
    explanationOutput.innerHTML = "";

    const activeQuestion = filteredQuestions[currentQuestionIndex];
    if (!activeQuestion) return;

    const cleanAnswer = activeQuestion.answer ? String(activeQuestion.answer).trim() : "";
    typeOutput.textContent = activeQuestion.type || "Multiple Choice";
    questionOutput.textContent = activeQuestion.question || "";
    progressLabel.textContent = (currentQuestionIndex + 1) + " / " + filteredQuestions.length;

    if (activeQuestion.generatedOptionsList && Array.isArray(activeQuestion.generatedOptionsList)) {
        for (let i = 0; i < activeQuestion.generatedOptionsList.length; i++) {
            const choice = activeQuestion.generatedOptionsList[i];
            const btn = document.createElement("button");
            btn.className = "option-btn";
            btn.textContent = choice;
            
            if (activeQuestion.userAttempted) {
                btn.disabled = true;
                if (choice === cleanAnswer) {
                    btn.classList.add("correct");
                } else if (choice === activeQuestion.chosenAnswer) {
                    btn.classList.add("incorrect");
                }
            } else {
                btn.addEventListener("click", function() {
                    handleAnswerValidation(btn, choice, activeQuestion);
                });
            }
            optionsContainer.appendChild(btn);
        }
    }

    if (activeQuestion.userAttempted) {
        if (activeQuestion.chosenAnswer === cleanAnswer) {
            feedbackOutput.textContent = "Correct! 🎉";
            feedbackOutput.style.color = "#2ecc71";
        } else {
            feedbackOutput.textContent = "Incorrect. Correct answer: " + cleanAnswer;
            feedbackOutput.style.color = "#e74c3c";
        }
        showExplanationPanel(activeQuestion);
    }
}

function handleAnswerValidation(clickedBtn, userChoice, questionObj) {
    if (!optionsContainer || !feedbackOutput || !correctCounter || !incorrectCounter) return;

    const allOptionButtons = optionsContainer.querySelectorAll(".option-btn");
    allOptionButtons.forEach(b => b.disabled = true);

    questionObj.userAttempted = true;
    questionObj.chosenAnswer = userChoice;
    const cleanAnswer = questionObj.answer ? String(questionObj.answer).trim() : "";

    if (userChoice === cleanAnswer) {
        clickedBtn.classList.add("correct");
        feedbackOutput.textContent = "Correct! 🎉";
        feedbackOutput.style.color = "#2ecc71";
        correctCount++;
        correctCounter.textContent = correctCount;
    } else {
        clickedBtn.classList.add("incorrect");
        feedbackOutput.textContent = "Incorrect. Correct answer: " + cleanAnswer;
        feedbackOutput.style.color = "#e74c3c";
        incorrectCount++;
        incorrectCounter.textContent = incorrectCount;

        allOptionButtons.forEach(b => {
            if (b.textContent === cleanAnswer) b.classList.add("correct");
        });
    }
    showExplanationPanel(questionObj);
}

function showExplanationPanel(questionObj) {
    if (!explanationOutput) return;
    if (questionObj && questionObj.explanation) {
        explanationOutput.innerHTML = "<strong>Step-by-Step Explanation:</strong><br>" + questionObj.explanation;
    } else {
        explanationOutput.innerHTML = "<em>No explicit explanation found.</em>";
    }
    explanationOutput.style.display = "block";
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

// Configuration: Path to your local JSON file
const DATA_URL = "questions.json";

// Application State Variables
let masterQuestionsList = {}; 
let filteredQuestions = [];   
let currentQuestionIndex = 0;
let correctCount = 0;
let incorrectCount = 0;

// Dynamic DOM Element Mapping
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

// 1. Fetch raw data on startup
async function loadInitializationData() {
    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        masterQuestionsList = await response.json();
        
        populateSubjectDropdown();
    } catch (err) {
        console.error("Critical Fetch Error:", err);
        questionOutput.textContent = "Error loading questions. Ensure questions.json is in your root repository folder.";
    }
}

// 2. Populate subjects dynamically from your JSON structure keys
function populateSubjectDropdown() {
    const subjects = Object.keys(masterQuestionsList);
    if (subjects.length === 0) return;

    subjectDropdown.innerHTML = subjects.map(s => `<option value="${s}">${s}</option>`).join("");
    
    // Set up event listener so unit dropdown changes when subject changes
    subjectDropdown.addEventListener("change", populateUnitDropdown);
    populateUnitDropdown();
}

// 3. Populate units based on the selected subject key
function populateUnitDropdown() {
    const selectedSubject = subjectDropdown.value;
    if (!masterQuestionsList[selectedSubject]) return;

    const units = Object.keys(masterQuestionsList[selectedSubject]);
    unitDropdown.innerHTML = units.map(u => `<option value="${u}">${u}</option>`).join("");
}

// 4. Build a robust pool of distractors across all 240 questions
function generateDynamicChoices(currentQuestion, currentSubject) {
    let globalAnswerPool = [];
    
    // Gather every single answer from this entire subject to mix as multiple choice distractors
    const units = Object.keys(masterQuestionsList[currentSubject] || {});
    units.forEach(u => {
        (masterQuestionsList[currentSubject][u] || []).forEach(q => {
            if (q.answer && q.answer.trim() !== currentQuestion.answer.trim()) {
                globalAnswerPool.push(q.answer.trim());
            }
        });
    });

    // Remove duplicates and shuffle the answer distractors
    globalAnswerPool = [...new Set(globalAnswerPool)];
    globalAnswerPool.sort(() => Math.random() - 0.5);
    
    // Grab up to 3 random wrong answers from your database
    let choices = globalAnswerPool.slice(0, 3);
    
    // Fallbacks if the pool doesn't have enough distinct values
    const fallbacks = ["0", "DNE", "1", "e^x", "C"];
    while (choices.length < 3) {
        const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        if (!choices.includes(fallback) && fallback !== currentQuestion.answer.trim()) {
            choices.push(fallback);
        }
    }
    
    // Combine with the real correct answer
    choices.push(currentQuestion.answer.trim());
    
    // Final duplicate scrub and shuffle
    choices = [...new Set(choices)].slice(0, 4); 
    choices.sort(() => Math.random() - 0.5);
    
    return choices;
}

// 5. Filter your dataset when clicking "Start Studying"
function startStudyingSession() {
    const selectedSubject = subjectDropdown.value;
    const selectedUnit = unitDropdown.value;

    if (masterQuestionsList[selectedSubject] && masterQuestionsList[selectedSubject][selectedUnit]) {
        filteredQuestions = [...masterQuestionsList[selectedSubject][selectedUnit]];
    } else {
        filteredQuestions = [];
    }

    if (filteredQuestions.length > 0) {
        currentQuestionIndex = 0;
        
        // Map elements out safely
        filteredQuestions.forEach(q => {
            q.userAttempted = false;
            q.chosenAnswer = null;
            if (!q.generatedOptionsList) {
                q.generatedOptionsList = generateDynamicChoices(q, selectedSubject);
            }
        });

        displayActiveQuestion();
    } else {
        typeOutput.textContent = "Empty";
        questionOutput.textContent = "No matching questions found for this selection.";
        optionsContainer.innerHTML = "";
        feedbackOutput.textContent = "";
        explanationOutput.style.display = "none";
        progressLabel.textContent = "0 / 0";
    }
}

// 6. Render the active question and choice buttons
function displayActiveQuestion() {
    optionsContainer.innerHTML = "";
    feedbackOutput.textContent = "";
    explanationOutput.style.display = "none";
    explanationOutput.innerHTML = "";

    const activeQuestion = filteredQuestions[currentQuestionIndex];

    typeOutput.textContent = activeQuestion.type || "Problem Details";
    questionOutput.textContent = activeQuestion.question;
    progressLabel.textContent = `${currentQuestionIndex + 1} / ${filteredQuestions.length}`;

    activeQuestion.generatedOptionsList.forEach(choice => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.textContent = choice;
        
        if (activeQuestion.userAttempted) {
            btn.disabled = true;
            if (choice === activeQuestion.answer.trim()) {
                btn.classList.add("correct");
            } else if (choice === activeQuestion.chosenAnswer) {
                btn.classList.add("incorrect");
            }
        } else {
            btn.addEventListener("click", () => handleAnswerValidation(btn, choice, activeQuestion));
        }
        
        optionsContainer.appendChild(btn);
    });

    if (activeQuestion.userAttempted) {
        if (activeQuestion.chosenAnswer === activeQuestion.answer.trim()) {
            feedbackOutput.textContent = "Correct! 🎉";
            feedbackOutput.style.color = "#2ecc71";
        } else {
            feedbackOutput.textContent = `Incorrect. The correct answer was: ${activeQuestion.answer}`;
            feedbackOutput.style.color = "#e74c3c";
        }
        showExplanationPanel(activeQuestion);
    }
}

// 7. Evaluate answer accuracy
function handleAnswerValidation(clickedBtn, userChoice, questionObj) {
    if (questionObj.userAttempted) return;

    const allOptionButtons = optionsContainer.querySelectorAll(".option-btn");
    allOptionButtons.forEach(b => b.disabled = true);

    questionObj.userAttempted = true;
    questionObj.chosenAnswer = userChoice;

    if (userChoice === questionObj.answer.trim()) {
        clickedBtn.classList.add("correct");
        feedbackOutput.textContent = "Correct! 🎉";
        feedbackOutput.style.color = "#2ecc71";
        correctCount++;
        correctCounter.textContent = correctCount;
    } else {
        clickedBtn.classList.add("incorrect");
        feedbackOutput.textContent = `Incorrect. The correct answer was: ${questionObj.answer}`;
        feedbackOutput.style.color = "#e74c3c";
        incorrectCount++;
        incorrectCounter.textContent = incorrectCount;

        allOptionButtons.forEach(b => {
            if (b.textContent === questionObj.answer.trim()) {
                b.classList.add("correct");
            }
        });
    }

    showExplanationPanel(questionObj);
}

function showExplanationPanel(questionObj) {
    if (questionObj.explanation) {
        explanationOutput.innerHTML = `<strong>Step-by-Step Explanation:</strong><br>${questionObj.explanation}`;
        explanationOutput.style.display = "block";
    } else {
        explanationOutput.innerHTML = "<em>No explicit explanation found for this problem entry.</em>";
        explanationOutput.style.display = "block";
    }
}

// 8. Navigation Event Listeners
leftButton.addEventListener("click", () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayActiveQuestion();
    }
});

rightButton.addEventListener("click", () => {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
        currentQuestionIndex++;
        displayActiveQuestion();
    }
});

submitButton.addEventListener("click", startStudyingSession);
document.addEventListener("DOMContentLoaded", loadInitializationData);

const DATA_URL = "calcab.json";

let masterQuestionsList = {}; 
let filteredQuestions = [];   
let currentQuestionIndex = 0;
let correctCount = 0;
let incorrectCount = 0;

// DOM Elements
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
const progressLabel = document.getElementById("progressLabel");
const correctCounter = document.getElementById("correctCounter");
const incorrectCounter = document.getElementById("incorrectCounter");

// ADD THIS LINE RIGHT HERE:
const bgMusic = document.getElementById("bgMusic");
/**
 * Loads the database JSON file on page load
 */
async function loadInitializationData() {
    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        masterQuestionsList = await response.json();
        
        // Populate the setup UI drop-downs
        populateSubjectDropdown();

        // FIX: Start the session automatically so the quiz doesn't load up completely blank!
        startStudyingSession();
        
    } catch (err) {
        console.error("Fetch Error:", err);
        if (questionOutput) {
            questionOutput.textContent = "Error loading calcab.json file. Make sure the file exists in the correct folder and is formatted cleanly.";
        }
    }
}

/**
 * Fills the subject dropdown based on the top-level keys in the JSON data
 */
function populateSubjectDropdown() {
    if (!subjectDropdown || !masterQuestionsList) return;
    
    const subjects = Object.keys(masterQuestionsList);
    if (subjects.length === 0) {
        console.warn("No subjects found in the master questions list.");
        return;
    }

    // Build options list
    subjectDropdown.innerHTML = subjects.map(s => `<option value="${s}">${s}</option>`).join("");
    
    // Explicitly guarantee the first option is highlighted active
    subjectDropdown.selectedIndex = 0;

    // Attach listener for user switches, then build the initial unit mapping
    subjectDropdown.addEventListener("change", () => {
        populateUnitDropdown();
        startStudyingSession(); // Auto-refresh when user picks a different subject
    });
    
    populateUnitDropdown();
}

/**
 * Fills the unit dropdown depending on which subject is currently active
 */
function populateUnitDropdown() {
    if (!subjectDropdown || !unitDropdown || !masterQuestionsList) return;
    
    let selectedSubject = subjectDropdown.value;
    
    // Fallback security check in case subject value reads empty
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
    
    let dropdownHTML = `<option value="ALL">All Units</option>`;
    dropdownHTML += units.map(u => `<option value="${u}">${u}</option>`).join("");
    unitDropdown.innerHTML = dropdownHTML;
    
    // Ensure "All Units" is selected by default on rebuild
    unitDropdown.value = "ALL";
}

/**
 * Dynamic Multiple Choice Distractor Engine
 * Pulls answers from other database items to generate plausible alternatives
 */
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
                        // Gather answer alternatives that are not the target answer
                        if (cleanAns !== realAnswer) {
                            globalAnswerPool.push(cleanAns);
                        }
                    }
                });
            }
        });
    }

    // De-duplicate alternatives array and shuffle random distribution
    globalAnswerPool = [...new Set(globalAnswerPool)].sort(() => Math.random() - 0.5);
    let choices = globalAnswerPool.slice(0, 3);
    
    // Fallback bank to inject standard math defaults if data pool is too shallow
    const fallbacks = ["0", "DNE", "1", "e^x", "C"];
    while (choices.length < 3) {
        const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        if (!choices.includes(fallback) && fallback !== realAnswer) {
            choices.push(fallback);
        }
    }
    
    // Merge real answer into choice set and perform final random shuffle
    choices.push(realAnswer);
    choices = [...new Set(choices)].slice(0, 4).sort(() => Math.random() - 0.5);
    return choices;
}

/**
 * Initializes or resets a study deck session based on user menu selections
 */
function startStudyingSession() {
    if (!subjectDropdown || !unitDropdown) return;

    const selectedSubject = subjectDropdown.value;
    const selectedUnit = unitDropdown.value;
    filteredQuestions = [];

    if (masterQuestionsList[selectedSubject]) {
        if (selectedUnit === "ALL") {
            // Aggregate all units for the chosen subject
            Object.keys(masterQuestionsList[selectedSubject]).forEach(u => {
                if (Array.isArray(masterQuestionsList[selectedSubject][u])) {
                    filteredQuestions = filteredQuestions.concat(masterQuestionsList[selectedSubject][u]);
                }
            });
            // Shuffle full cross-unit combination deck
            filteredQuestions.sort(() => Math.random() - 0.5);
        } else if (masterQuestionsList[selectedSubject][selectedUnit]) {
            // Clone isolated single unit data track
            filteredQuestions = [...masterQuestionsList[selectedSubject][selectedUnit]];
            // Shuffle the single unit to make it unique each run
            filteredQuestions.sort(() => Math.random() - 0.5);
        }
    }

    // Verify session deck contains payload elements
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
        // Fallback display if database array is empty
        if (typeOutput) typeOutput.textContent = "Empty";
        if (questionOutput) questionOutput.textContent = "No questions found for this selection.";
        if (optionsContainer) optionsContainer.innerHTML = "";
        if (feedbackOutput) feedbackOutput.textContent = "";
        if (explanationOutput) explanationOutput.style.display = "none";
        if (progressLabel) progressLabel.textContent = "0 / 0";
    }
}

/**
 * Initializes or resets a study deck session based on user menu selections
 */
function startStudyingSession() {
    if (!subjectDropdown || !unitDropdown) return;

    // ADD THESE LINES RIGHT HERE:
    if (bgMusic && bgMusic.paused) {
        bgMusic.volume = 0.25; 
        bgMusic.play().catch(err => console.log("Audio waiting for click: ", err));
    }

    const selectedSubject = subjectDropdown.value;
    const selectedUnit = unitDropdown.value;
    filteredQuestions = [];
    // ... rest of the function continues normally

/**
 * Handles rendering the current question state and historical inputs to the DOM
 */
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
    progressLabel.textContent = `${currentQuestionIndex + 1} / ${filteredQuestions.length}`;

    // Render interactive dynamic choice button stack
    if (Array.isArray(activeQuestion.generatedOptionsList)) {
        activeQuestion.generatedOptionsList.forEach(choice => {
            const btn = document.createElement("button");
            btn.className = "option-btn";
            btn.textContent = choice;
            
            if (activeQuestion.userAttempted) {
                // Freeze buttons and visually match saved selections if already answered
                btn.disabled = true;
                if (choice === cleanAnswer) {
                    btn.classList.add("correct");
                } else if (choice === activeQuestion.chosenAnswer) {
                    btn.classList.add("incorrect");
                }
            } else {
                // Bind real-time click processing
                btn.addEventListener("click", () => handleAnswerValidation(btn, choice, activeQuestion));
            }
            optionsContainer.appendChild(btn);
        });
    }

    // Restore contextual text flags if item already has historical submission data
    if (activeQuestion.userAttempted) {
        if (activeQuestion.chosenAnswer === cleanAnswer) {
            feedbackOutput.textContent = "Correct! 🎉";
            feedbackOutput.style.color = "#2ecc71";
        } else {
            feedbackOutput.textContent = `Incorrect. Correct answer: ${cleanAnswer}`;
            feedbackOutput.style.color = "#e74c3c";
        }
        showExplanationPanel(activeQuestion);
    }
}

/**
 * Validates selected answer clicks, increments tracking scores, and locks button interface
 */
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
        feedbackOutput.textContent = `Incorrect. Correct answer: ${cleanAnswer}`;
        feedbackOutput.style.color = "#e74c3c";
        incorrectCount++;
        incorrectCounter.textContent = incorrectCount;

        // Auto-highlight correct answer option path to user
        allOptionButtons.forEach(b => {
            if (b.textContent === cleanAnswer) b.classList.add("correct");
        });
    }
    showExplanationPanel(questionObj);
}

/**
 * Exposes the explanation details UI container block
 */
function showExplanationPanel(questionObj) {
    if (!explanationOutput) return;
    
    if (questionObj && questionObj.explanation) {
        explanationOutput.innerHTML = `<strong>Step-by-Step Explanation:</strong><br>${questionObj.explanation}`;
    } else {
        explanationOutput.innerHTML = "<em>No explicit explanation found for this problem entry.</em>";
    }
    explanationOutput.style.display = "block";
}

// Left/Previous Navigation Controller Action Hook
if (leftButton) {
    leftButton.addEventListener("click", () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            displayActiveQuestion();
        }
    });
}

// Right/Next Navigation Controller Action Hook
if (rightButton) {
    rightButton.addEventListener("click", () => {
        if (currentQuestionIndex < filteredQuestions.length - 1) {
            currentQuestionIndex++;
            displayActiveQuestion();
        }
    });
}

// Form/Submit Filter Trigger Action Hook
if (submitButton) {
    submitButton.addEventListener("click", startStudyingSession);
}

// Main Global Execution Initialization Hook
document.addEventListener("DOMContentLoaded", loadInitializationData);

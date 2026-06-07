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
        if (questionOutput) {
            questionOutput.textContent = "Error loading questions. Ensure questions.json is in your root repository folder and valid.";
        }
    }
}

// 2. Populate subjects dynamically from your JSON structure keys
function populateSubjectDropdown() {
    if (!subjectDropdown || !masterQuestionsList) return;
    
    const subjects = Object.keys(masterQuestionsList);
    if (subjects.length === 0) return;

    subjectDropdown.innerHTML = subjects.map(s => `<option value="${s}">${s}</option>`).join("");
    
    // Set up event listener so unit dropdown changes when subject changes
    subjectDropdown.removeEventListener("change", populateUnitDropdown);
    subjectDropdown.addEventListener("change", populateUnitDropdown);
    populateUnitDropdown();
}

// 3. Populate units based on the selected subject key + add "All Units"
function populateUnitDropdown() {
    if (!subjectDropdown || !unitDropdown || !masterQuestionsList) return;
    
    const selectedSubject = subjectDropdown.value;
    if (!masterQuestionsList[selectedSubject]) return;

    const units = Object.keys(masterQuestionsList[selectedSubject]);
    
    // Add "All Units" option right at the top of the dropdown string
    let dropdownHTML = `<option value="ALL">All Units</option>`;
    dropdownHTML += units.map(u => `<option value="${u}">${u}</option>`).join("");
    
    unitDropdown.innerHTML = dropdownHTML;
}

// 4. Build a robust pool of distractors safely
function generateDynamicChoices(currentQuestion, currentSubject) {
    let globalAnswerPool = [];
    
    // Fallback if current question answer is completely missing
    const realAnswer = (currentQuestion && currentQuestion.answer) ? String(currentQuestion.answer).trim() : "0";
    
    // Safety check to gather answers across your dataset structure
    if (masterQuestionsList && masterQuestionsList[currentSubject]) {
        const units = Object.keys(masterQuestionsList[currentSubject]);
        units.forEach(u => {
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

    // Remove duplicates and shuffle the answer distractors
    globalAnswerPool = [...new Set(globalAnswerPool)];
    globalAnswerPool.sort(() => Math.random() - 0.5);
    
    // Grab up to 3 random wrong answers from your database
    let choices = globalAnswerPool.slice(0, 3);
    
    // Fallbacks if the pool doesn't have enough distinct values
    const fallbacks = ["0", "DNE", "1", "e^x", "C"];
    while (choices.length < 3) {
        const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        if (!choices.includes(fallback) && fallback !== realAnswer) {
            choices.push(fallback);
        }
    }
    
    // Combine with the real correct answer
    choices.push(realAnswer);
    
    // Final duplicate scrub and shuffle
    choices = [...new Set(choices)].slice(0, 4); 
    choices.sort(() => Math.random() - 0.5);
    
    return choices;
}

// 5. Filter your dataset when clicking "Start Studying"
function startStudyingSession() {
    if (!subjectDropdown || !unitDropdown || !masterQuestionsList) return;

    const selectedSubject = subjectDropdown.value;
    const selectedUnit = unitDropdown.value;

    filteredQuestions = [];

    if (masterQuestionsList[selectedSubject]) {
        if (selectedUnit === "ALL") {
            const allUnits = Object.keys(masterQuestionsList[selectedSubject]);
            allUnits.forEach(u => {
                const currentUnitArray = masterQuestionsList[selectedSubject][u];
                if (Array.isArray(currentUnitArray)) {
                    filteredQuestions = filteredQuestions.concat(currentUnitArray);
                }
            });
            // Shuffle the complete set of questions
            filteredQuestions.sort(() => Math.random() - 0.5);
        } else if (masterQuestionsList[selectedSubject][selectedUnit]) {
            if (Array.isArray(masterQuestionsList[selectedSubject][selectedUnit])) {
                filteredQuestions = [...masterQuestionsList[selectedSubject][selectedUnit]];
            }
        }
    }

    if (filteredQuestions.length > 0) {
        currentQuestionIndex = 0;
        
        // Map elements out safely
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
        if (questionOutput) questionOutput.textContent = "No matching questions found for this selection.";
        if (optionsContainer) optionsContainer.innerHTML = "";
        if (feedbackOutput) feedbackOutput.textContent = "";
        if (explanationOutput) explanationOutput.style.display = "none";
        if (progressLabel) progressLabel.textContent = "0 / 0";
    }
}

// 6. Render the active question and choice buttons
function displayActiveQuestion() {
    if (!optionsContainer || !feedbackOutput || !explanationOutput || !progressLabel || !questionOutput || !typeOutput) return;

    optionsContainer.innerHTML = "";
    feedbackOutput.textContent = "";
    explanationOutput.style.display = "none";
    explanationOutput.innerHTML = "";

    const activeQuestion = filteredQuestions[currentQuestionIndex];
    if (!activeQuestion) return;

    const cleanAnswer = activeQuestion.answer ? String(activeQuestion.answer).trim() : "";

    typeOutput.textContent = activeQuestion.type || "Problem Details";
    questionOutput.textContent = activeQuestion.question || "Missing question content text.";
    progressLabel.textContent = `${currentQuestionIndex + 1} / ${filteredQuestions.length}`;

    if (Array.isArray(activeQuestion.generatedOptionsList)) {
        activeQuestion.generatedOptionsList.forEach(choice => {
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
                btn.addEventListener("click", () => handleAnswerValidation(btn, choice, activeQuestion));
            }
            
            optionsContainer.appendChild(btn);
        });
    }

    if (activeQuestion.userAttempted) {
        if (activeQuestion.chosenAnswer === cleanAnswer) {
            feedbackOutput.textContent = "Correct! 🎉";
            feedbackOutput.style.color = "#2ecc71";
        } else {
            feedbackOutput.textContent = `Incorrect. The correct answer was: ${cleanAnswer}`;
            feedbackOutput.style.color = "#e74c3c";
        }
        showExplanationPanel(activeQuestion);
    }
}

// 7. Evaluate answer accuracy
function handleAnswerValidation(clickedBtn, userChoice, questionObj) {
    if (!questionObj || questionObj.userAttempted || !optionsContainer || !feedbackOutput || !correctCounter || !incorrectCounter) return;

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
        feedbackOutput.textContent = `Incorrect. The correct answer was: ${cleanAnswer}`;
        feedbackOutput.style.color = "#e74c3c";
        incorrectCount++;
        incorrectCounter.textContent = incorrectCount;

        allOptionButtons.forEach(b => {
            if (b.textContent === cleanAnswer) {
                b.classList.add("correct");
            }
        });
    }

    showExplanationPanel(questionObj);
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

// 8. Navigation Event Listeners
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

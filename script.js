// Configuration: Path to your local JSON file
const DATA_URL = "questions.json";

// Application State Variables
let questionsData = [];
let filteredQuestions = [];
let currentQuestionIndex = 0;
let correctCount = 0;
let incorrectCount = 0;

// Dynamic DOM Element Mapping (Matching your exact HTML IDs)
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
        questionsData = await response.json();
        
        if (questionsData.length > 0) {
            populateDropdownFilters();
        } else {
            questionOutput.textContent = "Error: No questions found in data file.";
        }
    } catch (err) {
        console.error("Critical Fetch Error:", err);
        questionOutput.textContent = "Error loading questions. Ensure questions.json is in the correct folder.";
    }
}

// 2. Setup dynamic subject and unit filters based on your JSON values
function populateDropdownFilters() {
    const subjects = [...new Set(questionsData.map(q => q.subject).filter(Boolean))];
    const units = [...new Set(questionsData.map(q => q.unit).filter(Boolean))];

    subjectDropdown.innerHTML = subjects.map(s => `<option value="${s}">${s}</option>`).join("");
    unitDropdown.innerHTML = units.map(u => `<option value="${u}">${u}</option>`).join("");
}

// 3. Filter your calculus dataset when clicking "Start Studying"
function startStudyingSession() {
    const selectedSubject = subjectDropdown.value;
    const selectedUnit = unitDropdown.value;

    filteredQuestions = questionsData.filter(q => q.subject === selectedSubject && q.unit === selectedUnit);

    if (filteredQuestions.length > 0) {
        currentQuestionIndex = 0;
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

// 4. Render the active question and choice buttons
function displayActiveQuestion() {
    // Reset output card containers
    optionsContainer.innerHTML = "";
    feedbackOutput.textContent = "";
    explanationOutput.style.display = "none";
    explanationOutput.innerHTML = "";

    const activeQuestion = filteredQuestions[currentQuestionIndex];

    // Set layout elements
    typeOutput.textContent = activeQuestion.type || "Problem Details";
    questionOutput.textContent = activeQuestion.question;
    progressLabel.textContent = `${currentQuestionIndex + 1} / ${filteredQuestions.length}`;

    // Create custom multiple-choice options buttons matching your CSS color palette
    if (activeQuestion.options && Array.isArray(activeQuestion.options)) {
        activeQuestion.options.forEach(choice => {
            const btn = document.createElement("button");
            btn.className = "option-btn";
            btn.textContent = choice;
            btn.addEventListener("click", () => handleAnswerValidation(btn, choice, activeQuestion));
            optionsContainer.appendChild(btn);
        });
    }
}

// 5. Evaluate answer accuracy, increment counters, and reveal explanations
function handleAnswerValidation(clickedBtn, userChoice, questionObj) {
    const allOptionButtons = optionsContainer.querySelectorAll(".option-btn");
    
    // Immediately freeze selection options
    allOptionButtons.forEach(b => b.disabled = true);

    // Check accuracy and map to your specific CSS styles (`.correct` and `.incorrect`)
    if (userChoice === questionObj.answer) {
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

        // Auto-highlight the right answer so you learn from mistakes
        allOptionButtons.forEach(b => {
            if (b.textContent === questionObj.answer) {
                b.classList.add("correct");
            }
        });
    }

    // Unhide the step-by-step math explanation property block
    if (questionObj.explanation) {
        explanationOutput.innerHTML = `<strong>Step-by-Step Explanation:</strong><br>${questionObj.explanation}`;
        explanationOutput.style.display = "block";
    } else {
        explanationOutput.innerHTML = "<em>No explicit explanation found for this problem entry.</em>";
        explanationOutput.style.display = "block";
    }
}

// 6. Sidebar/Footer Quiz Navigation Event Listeners
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

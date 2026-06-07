// Configuration: Path to your local JSON file
const DATA_URL = "questions.json";

// State variables
let questionsData = [];
let currentQuestionIndex = 0;

// DOM Elements
const questionTextEl = document.getElementById("question-text");
const optionsContainerEl = document.getElementById("options-container");
const feedbackEl = document.getElementById("feedback");
const explanationEl = document.getElementById("explanation-box");
const nextBtn = document.getElementById("next-btn");

// 1. Fetch data from questions.json
async function loadQuestions() {
    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        questionsData = await response.json();
        
        if (questionsData.length > 0) {
            displayQuestion(currentQuestionIndex);
        } else {
            questionTextEl.textContent = "No questions found in the data file.";
        }
    } catch (error) {
        console.error("Failed to load questions JSON:", error);
        questionTextEl.textContent = "Error loading question data. Please check your JSON file.";
    }
}

// 2. Render a question to the page
function displayQuestion(index) {
    // Clear previous states
    optionsContainerEl.innerHTML = "";
    feedbackEl.textContent = "";
    explanationEl.style.display = "none";
    explanationEl.innerHTML = "";
    nextBtn.style.display = "none";

    const currentQuestion = questionsData[index];
    questionTextEl.textContent = `${index + 1}. ${currentQuestion.question}`;

    // Loop through options and create buttons
    currentQuestion.options.forEach(option => {
        const button = document.createElement("button");
        button.className = "option-btn";
        button.textContent = option;
        button.addEventListener("click", () => handleOptionClick(button, option, currentQuestion));
        optionsContainerEl.appendChild(button);
    });
}

// 3. Handle user answer selection
function handleOptionClick(selectedButton, chosenOption, questionObj) {
    // Disable all options after selection
    const allButtons = optionsContainerEl.querySelectorAll(".option-btn");
    allButtons.forEach(btn => btn.disabled = true);

    // Validate choice
    if (chosenOption === questionObj.answer) {
        selectedButton.classList.add("correct");
        feedbackEl.textContent = "Correct! 🎉";
        feedbackEl.className = "feedback-msg text-success";
    } else {
        selectedButton.classList.add("wrong");
        feedbackEl.textContent = `Incorrect. The correct answer was: ${questionObj.answer}`;
        feedbackEl.className = "feedback-msg text-danger";
        
        // Highlight the correct option for reference
        allButtons.forEach(btn => {
            if (btn.textContent === questionObj.answer) {
                btn.classList.add("correct");
            }
        });
    }

    // 4. Reveal the step-by-step mathematical explanation
    if (questionObj.explanation) {
        explanationEl.innerHTML = `<strong>Step-by-Step Explanation:</strong><br>${questionObj.explanation}`;
        explanationEl.style.display = "block";
    } else {
        explanationEl.innerHTML = "<em>No explanation available for this question.</em>";
        explanationEl.style.display = "block";
    }

    // Show "Next" button if there are more questions
    if (currentQuestionIndex < questionsData.length - 1) {
        nextBtn.style.display = "inline-block";
    } else {
        feedbackEl.textContent += " — Quiz Completed!";
    }
}

// 5. Setup Event Listeners
nextBtn.addEventListener("click", () => {
    if (currentQuestionIndex < questionsData.length - 1) {
        currentQuestionIndex++;
        displayQuestion(currentQuestionIndex);
    }
});

// Initialize application on page load
document.addEventListener("DOMContentLoaded", loadQuestions);

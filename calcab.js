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

        // Start the session automatically so the quiz doesn't load up blank
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

/**

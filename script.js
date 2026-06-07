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

// 3. Populate units based on the selected subject key + add "All Units"
function populateUnitDropdown() {
    const selectedSubject = subjectDropdown.value;
    if (!masterQuestionsList[selectedSubject]) return;

    const units = Object.keys(masterQuestionsList[selectedSubject]);
    
    // Add "All Units" option right at the top of the dropdown string
    let dropdownHTML = `<option value="ALL">All Units</option>`;
    dropdownHTML += units.map(u => `<option value="${u}">${u}</option>`).join("");
    
    unitDropdown.innerHTML = dropdownHTML;
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
        if (!

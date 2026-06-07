econst DATA_URL = "questions.json";

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
        if (questionOutput) questionOutput.textContent = "Error loading questions.json file.";
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

    const cleanAnswer = activeQuestion.

// Storage for our fetched data and filtered questions
let masterQuestionsList = [];
let filteredQuestions = [];
let index = 0;

// 1. Fetch the data from your JSON file when the page loads
fetch('./questions.json')
    .then(response => response.json())
    .then(data => {
        masterQuestionsList = data;
        console.log("Database loaded successfully!");
    })
    .catch(error => console.error("Error loading questions database:", error));

// 2. Filter logic
function filterQuestions() {
    const selectedSubject = document.getElementById("subjectDropdown").value;
    const selectedUnit = parseInt(document.getElementById("unitDropdown").value);

    // Reset filtering variables
    filteredQuestions = [];
    index = 0;

    // Loop through master list to find matches
    for (let i = 0; i < masterQuestionsList.length; i++) {
        if (masterQuestionsList[i].subject === selectedSubject && masterQuestionsList[i].unit === selectedUnit) {
            filteredQuestions.push(masterQuestionsList[i]);
        }
    }

    displayQuestion();
}

// 3. UI Display Logic
function displayQuestion() {
    const typeLabel = document.getElementById("typeOutput");
    const questionLabel = document.getElementById("questionOutput");
    const answerLabel = document.getElementById("answerOutput");
    const progressLabel = document.getElementById("progressLabel");
    const answerBtn = document.getElementById("showAnswerButton");

    // Always clear the previous answer field on question change
    answerLabel.textContent = "";

    if (filteredQuestions.length === 0) {
        typeLabel.textContent = "Empty";
        questionLabel.textContent = "No questions found for this specific subject and unit yet.";
        progressLabel.textContent = "";
        answerBtn.style.display = "none";
    } else {
        // Show current question data
        typeLabel.textContent = filteredQuestions[index].type;
        questionLabel.textContent = filteredQuestions[index].question;
        progressLabel.textContent = `${index + 1} of ${filteredQuestions.length}`;
        answerBtn.style.display = "inline-block";
    }
}

// 4. Event Listeners
document.getElementById("submitButton").addEventListener("click", filterQuestions);

document.getElementById("showAnswerButton").addEventListener("click", function() {
    if (filteredQuestions.length > 0) {
        document.getElementById("answerOutput").textContent = "💡 " + filteredQuestions[index].answer;
    }
});

document.getElementById("rightButton").addEventListener("click", function() {
    if (index < filteredQuestions.length - 1) {
        index++;
        displayQuestion();
    }
});

document.getElementById("leftButton").addEventListener("click", function() {
    if (index > 0) {
        index--;
        displayQuestion();
    }
});

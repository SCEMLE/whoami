let masterQuestionsList = [];
let filteredQuestions = [];
let index = 0;

// Fetch the data from the JSON file
fetch('./questions.json')
    .then(response => response.json())
    .then(data => {
        masterQuestionsList = data;
        console.log("Database loaded successfully!");
    })
    .catch(error => console.error("Error loading questions database:", error));

// Filter questions based on selections
function filterQuestions() {
    const selectedSubject = document.getElementById("subjectDropdown").value;
    const selectedUnit = parseInt(document.getElementById("unitDropdown").value);

    filteredQuestions = [];
    index = 0;

    for (let i = 0; i < masterQuestionsList.length; i++) {
        if (masterQuestionsList[i].subject === selectedSubject && masterQuestionsList[i].unit === selectedUnit) {
            filteredQuestions.push(masterQuestionsList[i]);
        }
    }

    displayQuestion();
}

// Update the user interface
function displayQuestion() {
    const typeLabel = document.getElementById("typeOutput");
    const questionLabel = document.getElementById("questionOutput");
    const answerLabel = document.getElementById("answerOutput");
    const progressLabel = document.getElementById("progressLabel");
    const answerBtn = document.getElementById("showAnswerButton");

    answerLabel.textContent = "";

    if (filteredQuestions.length === 0) {
        typeLabel.textContent = "Empty";
        questionLabel.textContent = "No questions found for this specific subject and unit yet.";
        progressLabel.textContent = "";
        answerBtn.style.display = "none";
    } else {
        typeLabel.textContent = filteredQuestions[index].type;
        questionLabel.textContent = filteredQuestions[index].question;
        progressLabel.textContent = `${index + 1} of ${filteredQuestions.length}`;
        answerBtn.style.display = "inline-block";
    }
}

// Setup click actions
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

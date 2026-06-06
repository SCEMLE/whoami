let masterQuestionsList = {};
let filteredQuestions = [];
let index = 0;

fetch('./questions.json')
    .then(response => response.json())
    .then(data => {
        masterQuestionsList = data;
        buildDropdowns();
    })
    .catch(error => {
        console.error("Error connecting to database:", error);
        document.getElementById("questionOutput").textContent = "Error loading equations database.";
    });

function buildDropdowns() {
    const subjectDropdown = document.getElementById("subjectDropdown");
    subjectDropdown.innerHTML = "";
    
    const subjects = Object.keys(masterQuestionsList);
    if (subjects.length === 0) return;

    subjects.forEach(subject => {
        const option = document.createElement("option");
        option.value = subject;
        option.textContent = subject;
        subjectDropdown.appendChild(option);
    });

    subjectDropdown.addEventListener("change", updateUnitDropdown);
    updateUnitDropdown();
}

function updateUnitDropdown() {
    const selectedSubject = document.getElementById("subjectDropdown").value;
    const unitDropdown = document.getElementById("unitDropdown");
    
    unitDropdown.innerHTML = '<option value="all">All Units Combined</option>';
    if (!masterQuestionsList[selectedSubject]) return;

    const units = Object.keys(masterQuestionsList[selectedSubject]);
    
    // Extract numbers to sort the descriptive string headings correctly (Unit 1, Unit 2, etc.)
    units.sort((a, b) => {
        const numA = parseInt(a.replace("Unit ", ""));
        const numB = parseInt(b.replace("Unit ", ""));
        return numA - numB;
    });

    units.forEach(unitName => {
        const option = document.createElement("option");
        option.value = unitName;
        option.textContent = unitName;
        unitDropdown.appendChild(option);
    });
}

function filterQuestions() {
    const selectedSubject = document.getElementById("subjectDropdown").value;
    const selectedUnitValue = document.getElementById("unitDropdown").value;

    filteredQuestions = [];
    index = 0;

    if (!masterQuestionsList[selectedSubject]) {
        displayQuestion();
        return;
    }

    if (selectedUnitValue === "all") {
        const units = Object.keys(masterQuestionsList[selectedSubject]);
        units.forEach(unitNum => {
            filteredQuestions = filteredQuestions.concat(masterQuestionsList[selectedSubject][unitNum]);
        });
        filteredQuestions.sort(() => Math.random() - 0.5); // Randomize for review variation
    } else {
        if (masterQuestionsList[selectedSubject][selectedUnitValue]) {
            filteredQuestions = [...masterQuestionsList[selectedSubject][selectedUnitValue]];
        }
    }

    displayQuestion();
}

function displayQuestion() {
    const typeLabel = document.getElementById("typeOutput");
    const questionLabel = document.getElementById("questionOutput");
    const answerLabel = document.getElementById("answerOutput");
    const progressLabel = document.getElementById("progressLabel");
    const answerBtn = document.getElementById("showAnswerButton");

    answerLabel.textContent = "";

    if (filteredQuestions.length === 0) {
        typeLabel.textContent = "Empty";
        questionLabel.textContent = "No math problems found matching this selection.";
        progressLabel.textContent = "";
        answerBtn.style.display = "none";
    } else {
        typeLabel.textContent = filteredQuestions[index].type;
        questionLabel.textContent = filteredQuestions[index].question;
        progressLabel.textContent = `${index + 1} / ${filteredQuestions.length}`;
        answerBtn.style.display = "inline-block";
    }
}

document.getElementById("submitButton").addEventListener("click", filterQuestions);

document.getElementById("showAnswerButton").addEventListener("click", function() {
    if (filteredQuestions.length > 0) {
        document.getElementById("answerOutput").textContent = "💡 Solution: " + filteredQuestions[index].answer;
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

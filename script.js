// 1. Core State variables
let masterQuestionsList = {};
let filteredQuestions = [];
let index = 0;

// 2. Load the JSON configuration when the browser finishes rendering the page
fetch('./questions.json')
    .then(response => response.json())
    .then(data => {
        masterQuestionsList = data;
        console.log("Dynamic Curriculum Engine active.");
        buildDropdowns();
        
        // Reset instructions once loaded
        document.getElementById("questionOutput").textContent = "Pick an AP course and unit above, then click Start Studying!";
    })
    .catch(error => {
        console.error("Critical database connection error:", error);
        document.getElementById("questionOutput").textContent = "Error loading database. Ensure questions.json is present and valid.";
    });

// Dynamic configuration generator
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
    
    units.sort((a, b) => parseInt(a) - parseInt(b)).forEach(unitNum => {
        const option = document.createElement("option");
        option.value = unitNum;
        option.textContent = `Unit ${unitNum}`;
        unitDropdown.appendChild(option);
    });
}

// 3. Selection parsing logic
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
        
        // Optional: Shuffle when studying mixed lists to maximize retention
        filteredQuestions.sort(() => Math.random() - 0.5);
    } else {
        if (masterQuestionsList[selectedSubject][selectedUnitValue]) {
            // Clone the array to protect core assets
            filteredQuestions = [...masterQuestionsList[selectedSubject][selectedUnitValue]];
        }
    }

    displayQuestion();
}

// 4. Interface Rendering Pipeline
function displayQuestion() {
    const typeLabel = document.getElementById("typeOutput");
    const questionLabel = document.getElementById("questionOutput");
    const answerLabel = document.getElementById("answerOutput");
    const progressLabel = document.getElementById("progressLabel");
    const answerBtn = document.getElementById("showAnswerButton");

    answerLabel.textContent = "";

    if (filteredQuestions.length === 0) {
        typeLabel.textContent = "Empty";
        questionLabel.textContent = "No curriculum items loaded matching your active query configurations.";
        progressLabel.textContent = "";
        answerBtn.style.display = "none";
    } else {
        typeLabel.textContent = filteredQuestions[index].type;
        questionLabel.textContent = filteredQuestions[index].question;
        progressLabel.textContent = `${index + 1} / ${filteredQuestions.length}`;
        answerBtn.style.display = "inline-block";
    }
}

// 5. System Event Registration mappings
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

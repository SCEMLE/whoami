// 1. Storage for our live API data
let filteredQuestions = [];
let index = 0;

// 2. Unified Live Database Fetch and Filter Function
function filterQuestions() {
    const selectedSubject = document.getElementById("subjectDropdown").value;
    
    // Map your dropdown choices to the API's category ID numbers
    // 22 = History, 19 = Mathematics/Science
    let categoryId = (selectedSubject === "AP US History") ? 22 : 19;

    // Reset filtering variables
    filteredQuestions = [];
    index = 0;

    const typeLabel = document.getElementById("typeOutput");
    const questionLabel = document.getElementById("questionOutput");
    typeLabel.textContent = "Loading...";
    questionLabel.textContent = "Fetching fresh questions from the live database...";

    // Fetch 10 random questions from the public database matching the category
    fetch(`https://opentdb.com/api.php?amount=10&category=${categoryId}&type=multiple`)
        .then(response => response.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                // Format the public database layout to fit your website's UI labels
                filteredQuestions = data.results.map(q => {
                    return {
                        type: q.type.toUpperCase() + " CHOICE",
                        question: decodeHTML(q.question),
                        answer: "The correct answer is: " + decodeHTML(q.correct_answer)
                    };
                });
                displayQuestion();
            } else {
                typeLabel.textContent = "Error";
                questionLabel.textContent = "No questions found. Try clicking Study again.";
            }
        })
        .catch(error => {
            console.error("Error loading remote database:", error);
            typeLabel.textContent = "Error";
            questionLabel.textContent = "Could not connect to the database.";
        });
}

// Helper function to fix weird text symbols (like &quot; or &#039;) from the internet
function decodeHTML(html) {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
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

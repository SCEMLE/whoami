// main.js - Core Profile, Google Authentication, and Subject Review Parser

document.addEventListener("DOMContentLoaded", () => {
    const usernameDisplay = document.getElementById("usernameDisplay");
    const streakDisplay = document.getElementById("streakDisplay");
    const userAvatar = document.getElementById("userAvatar");
    const googleBtnWrapper = document.getElementById("googleBtnWrapper");
    const logoutBtn = document.getElementById("logoutBtn");
    const toggleReviewHub = document.getElementById("toggleReviewHub");
    const globalReviewPanel = document.getElementById("globalReviewPanel");
    const reviewLogsContainer = document.getElementById("reviewLogsContainer");

    let currentUser = localStorage.getItem("ap_user") || "Guest";
    let userAvatarUrl = localStorage.getItem("ap_avatar") || "";
    let userStreak = parseInt(localStorage.getItem("ap_streak") || "0", 10);
    let lastActiveDate = localStorage.getItem("ap_last_date") || "";

    function syncProfileUI() {
        if (usernameDisplay) usernameDisplay.textContent = currentUser;
        if (streakDisplay) streakDisplay.textContent = userStreak;

        if (currentUser !== "Guest") {
            if (googleBtnWrapper) googleBtnWrapper.style.display = "none";
            if (logoutBtn) logoutBtn.style.display = "block";
            if (userAvatarUrl && userAvatar) {
                userAvatar.src = userAvatarUrl;
                userAvatar.style.display = "block";
            }
        } else {
            if (googleBtnWrapper) googleBtnWrapper.style.display = "block";
            if (logoutBtn) logoutBtn.style.display = "none";
            if (userAvatar) userAvatar.style.display = "none";
        }
        renderGlobalMissedQuestions();
    }

    // Google JWT Token payload decoder
    function parseJwt(token) {
        try {
            var base64Url = token.split('.')[1];
            var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(window.atob(base64));
        } catch (e) {
            return null;
        }
    }

    // Google Login Callback handler
    window.handleCredentialResponse = (response) => {
        const responsePayload = parseJwt(response.credential);
        if (responsePayload) {
            currentUser = responsePayload.name;
            userAvatarUrl = responsePayload.picture;
            
            localStorage.setItem("ap_user", currentUser);
            localStorage.setItem("ap_avatar", userAvatarUrl);

            // Set up or update streak upon authentication
            const todayStr = new Date().toDateString();
            if (lastActiveDate === "") {
                userStreak = 1;
                lastActiveDate = todayStr;
                localStorage.setItem("ap_streak", userStreak);
                localStorage.setItem("ap_last_date", lastActiveDate);
            }

            syncProfileUI();
        }
    };

    // Initialize Google Authentication SDK
    function initGoogleAuth() {
        if (typeof google !== 'undefined' && googleBtnWrapper) {
            google.accounts.id.initialize({
                client_id: "534730689520-9q2rpbik8e5manubq777i981endjirn9.apps.googleusercontent.com", 
                callback: window.handleCredentialResponse
            });
            google.accounts.id.renderButton(
                googleBtnWrapper,
                { theme: "outline", size: "medium", type: "standard", shape: "pill" }
            );
        }
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("ap_user");
            localStorage.removeItem("ap_avatar");
            currentUser = "Guest";
            userAvatarUrl = "";
            syncProfileUI();
        });
    }

    // Dynamic Breakdown of Incorrect Answers by Subject
    function renderGlobalMissedQuestions() {
        if (!reviewLogsContainer) return;
        
        // Retrieve master logged data from all practice sheets
        const fullLog = JSON.parse(localStorage.getItem("ap_global_missed_log") || "{}");
        const subjects = Object.keys(fullLog);

        // Check if there are actually questions inside the subject arrays
        let totalLoggedQuestions = 0;
        subjects.forEach(sub => {
            if (Array.isArray(fullLog[sub])) {
                totalLoggedQuestions += fullLog[sub].length;
            }
        });

        if (totalLoggedQuestions === 0) {
            reviewLogsContainer.innerHTML = "<em style='display:block; padding:15px;'>No missed questions found across any subjects. Solid work!</em>";
            return;
        }

        let htmlContent = "";
        subjects.forEach(subject => {
            const listItems = fullLog[subject];
            if (listItems && listItems.length > 0) {
                htmlContent += `<div class="subject-review-section" style="margin-top:15px;">
                    <h3 style="border-bottom:2px solid #946E83; padding-bottom:5px;">${subject}</h3>`;
                
                listItems.forEach(item => {
                    htmlContent += `
                        <div class="missed-item" style="margin-bottom: 12px; padding: 8px; border-left: 3px solid #e74c3c; background: rgba(0,0,0,0.02);">
                            <strong>Question:</strong> ${item.question}<br>
                            <span style="color: #946E83;"><strong>Correct Answer:</strong> ${item.answer}</span>
                        </div>`;
                });
                htmlContent += `</div>`;
            }
        });

        // Clear and add a Reset Button for the Main Hub
        reviewLogsContainer.innerHTML = htmlContent;
        
        const clearBtn = document.createElement("button");
        clearBtn.textContent = "Clear All Saved Questions";
        clearBtn.style.cssText = "margin-top: 15px; background: #e74c3c; color: white; border: none; padding: 8px 12px; cursor: pointer; border-radius: 4px;";
        clearBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to clear your missed questions logs?")) {
                localStorage.removeItem("ap_global_missed_log");
                renderGlobalMissedQuestions();
            }
        });
        reviewLogsContainer.appendChild(clearBtn);
    }

    // Open/Close Global Review Panel Toggle
    if (toggleReviewHub && globalReviewPanel) {
        globalReviewPanel.style.display = "none"; // Hide by default until clicked
        toggleReviewHub.addEventListener("click", () => {
            if (globalReviewPanel.style.display === "block") {
                globalReviewPanel.style.display = "none";
            } else {
                globalReviewPanel.style.display = "block";
                renderGlobalMissedQuestions();
            }
        });
    }

    // Check if streak was broken before painting screen
    if (currentUser !== "Guest" && lastActiveDate !== "") {
        const todayStr = new Date().toDateString();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (lastActiveDate !== todayStr && lastActiveDate !== yesterdayStr) {
            userStreak = 0;
            localStorage.setItem("ap_streak", "0");
        }
    }

    setTimeout(initGoogleAuth, 600); 
    syncProfileUI();
});

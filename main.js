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
        usernameDisplay.textContent = currentUser;
        streakDisplay.textContent = userStreak;

        if (currentUser !== "Guest") {
            googleBtnWrapper.style.display = "none";
            logoutBtn.style.display = "block";
            if (userAvatarUrl) {
                userAvatar.src = userAvatarUrl;
                userAvatar.style.display = "block";
            }
        } else {
            googleBtnWrapper.style.display = "block";
            logoutBtn.style.display = "none";
            userAvatar.style.display = "none";
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
        if (typeof google !== 'undefined') {
            google.accounts.id.initialize({
                client_id: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com", // Replace with your developer client ID
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
        // Expected format object structure: { "AP Calculus AB": [{q: "...", a: "..."}, ...] }
        const fullLog = JSON.parse(localStorage.getItem("ap_global_missed_log") || "{}");
        const subjects = Object.keys(fullLog);

        if (subjects.length === 0) {
            reviewLogsContainer.innerHTML = "<em>No missed questions found across any subjects. Solid work!</em>";
            return;
        }

        let htmlContent = "";
        subjects.forEach(subject => {
            const listItems = fullLog[subject];
            if (listItems && listItems.length > 0) {
                htmlContent += `<div class="subject-review-section"><h3>${subject}</h3>`;
                listItems.forEach(item => {
                    htmlContent += `
                        <div class="missed-item">
                            <strong>Question:</strong> ${item.question}<br>
                            <span style="color: #946E83;"><strong>Correct Answer:</strong> ${item.answer}</span>
                        </div>`;
                });
                htmlContent += `</div>`;
            }
        });

        reviewLogsContainer.innerHTML = htmlContent || "<em>No missed questions found across any subjects. Solid work!</em>";
    }

    // Open/Close Global Review Panel Toggle
    if (toggleReviewHub && globalReviewPanel) {
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

    setTimeout(initGoogleAuth, 600); // Small timeout allows library script load complete safety
    syncProfileUI();
});

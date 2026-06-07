// main.js - Core Profile & Streak Engine for the Portal Landing Page

document.addEventListener("DOMContentLoaded", () => {
    const loginActionBtn = document.getElementById("loginActionBtn");
    const usernameDisplay = document.getElementById("usernameDisplay");
    const streakDisplay = document.getElementById("streakDisplay");

    // Fetch account details from browser local storage
    let currentUser = localStorage.getItem("ap_user") || "Guest";
    let userStreak = parseInt(localStorage.getItem("ap_streak") || "0", 10);
    let lastActiveDate = localStorage.getItem("ap_last_date") || "";

    function syncProfileUI() {
        if (usernameDisplay) usernameDisplay.textContent = currentUser;
        if (streakDisplay) streakDisplay.textContent = userStreak;
        if (loginActionBtn) {
            loginActionBtn.textContent = currentUser !== "Guest" ? "Logout" : "Login";
        }
    }

    function verifyDailyStreak() {
        if (currentUser === "Guest") return;
        
        const todayStr = new Date().toDateString();
        if (lastActiveDate !== "" && lastActiveDate !== todayStr) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toDateString();

            // Reset streak if a full day was skipped
            if (lastActiveDate !== yesterdayStr) {
                userStreak = 0;
                localStorage.setItem("ap_streak", "0");
            }
        }
    }

    if (loginActionBtn) {
        loginActionBtn.addEventListener("click", () => {
            if (currentUser !== "Guest") {
                // Logout logic
                localStorage.removeItem("ap_user");
                localStorage.removeItem("ap_streak");
                localStorage.removeItem("ap_last_date");
                currentUser = "Guest";
                userStreak = 0;
                lastActiveDate = "";
                syncProfileUI();
            } else {
                // Login logic
                const nameInput = prompt("Enter a profile name to track progress:", "");
                if (nameInput && nameInput.trim() !== "") {
                    currentUser = nameInput.trim();
                    userStreak = 1;
                    lastActiveDate = new Date().toDateString();
                    
                    localStorage.setItem("ap_user", currentUser);
                    localStorage.setItem("ap_streak", userStreak);
                    localStorage.setItem("ap_last_date", lastActiveDate);
                    syncProfileUI();
                }
            }
        });
    }

    verifyDailyStreak();
    syncProfileUI();
});

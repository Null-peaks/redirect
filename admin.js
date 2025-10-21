async function generateCode() {
    const link = document.getElementById('linkInput').value.trim();
    const resultDiv = document.getElementById('result');
    const generatedCodeInput = document.getElementById('generatedCode');

    if (!link) {
        showNotification("⚠️ Please enter a link before generating a code.", "error");
        logAction("Attempted to generate code with empty link.");
        return;
    }

    // Generate a random 6-character code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
        // Fetch existing codes from GitHub
        const response = await fetch('https://raw.githubusercontent.com/nawsomey/redirect/main/codes.json');
        const data = await response.json();

        // Add new code and link
        data[code] = link;

        // Prepare updated JSON
        const updatedJSON = JSON.stringify(data, null, 4);

        // Upload updated JSON to GitHub
        const success = await uploadToGitHub(updatedJSON);

        if (success) {
            // Show success message and generated code
            generatedCodeInput.value = code;
            generatedCodeInput.style.display = 'block';
            showNotification(`✅ Code "${code}" generated successfully!`, "success");
            logAction(`Generated new code: ${code} for link: ${link}`);
        } else {
            showNotification("⚠️ Error while committing code to GitHub.", "error");
            logAction("Error committing code to GitHub.");
        }
    } catch (err) {
        showNotification("⚠️ Failed to fetch or update codes.json.", "error");
        logAction("Fetch/Update failed: " + err.message);
    }
}

// Upload updated JSON to GitHub
async function uploadToGitHub(updatedJSON) {
    const githubAPI = 'https://api.github.com/repos/nawsomey/redirect/contents/codes.json';
    const token = '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';  // ⚠️ Better to keep in a server-side script, not client-side

    try {
        // Get current file SHA
        const response = await fetch(githubAPI, {
            headers: { Authorization: `token ${token}` }
        });
        const fileData = await response.json();
        const sha = fileData.sha;

        // Commit updated content to GitHub
        const commitData = {
            message: "Update codes.json with new generated code",
            content: btoa(unescape(encodeURIComponent(updatedJSON))),
            sha: sha
        };

        const commitResponse = await fetch(githubAPI, {
            method: 'PUT',
            headers: {
                Authorization: `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(commitData)
        });

        const commitResult = await commitResponse.json();
        console.log('Commit Response:', commitResult);  // Log for debugging

        if (commitResult.content) {
            return true;
        } else {
            throw new Error('Failed to commit to GitHub');
        }
    } catch (error) {
        console.error("Error uploading to GitHub:", error.message);
        logAction("GitHub upload error: " + error.message);
        return false;
    }
}

// ========== Activity Log ==========
function logAction(action) {
    const logList = document.getElementById("logList");
    if (!logList) return; // Prevent errors if log element not found
    const li = document.createElement("li");
    li.textContent = new Date().toLocaleTimeString() + " - " + action;
    logList.appendChild(li);
}

// ========== Notifications ==========
function showNotification(message, type) {
    const notif = document.getElementById("notification");
    notif.textContent = message;

    notif.classList.remove("hidden", "success", "error");
    notif.classList.add(type);

    setTimeout(() => notif.classList.add("hidden"), 2500);
}

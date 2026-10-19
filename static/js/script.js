const toolCards = document.querySelectorAll(".tool-card");

const messageForm = document.getElementById("messageForm");
const emailForm = document.getElementById("emailForm");
const phoneForm = document.getElementById("phoneForm");

const loadingState = document.getElementById("loadingState");
const loadingTitle = document.getElementById("loadingTitle");
const loadingDescription = document.getElementById("loadingDescription");

const errorBox = document.getElementById("errorBox");
const errorMessage = document.getElementById("errorMessage");

const resultSection = document.getElementById("resultSection");
const resultContent = document.getElementById("resultContent");

const workspaceLabel = document.getElementById("workspaceLabel");
const workspaceTitle = document.getElementById("workspaceTitle");
const workspaceDescription = document.getElementById("workspaceDescription");
const workspaceSymbol = document.getElementById("workspaceSymbol");

const characterCount = document.getElementById("characterCount");
const messageInput = document.getElementById("messageInput");

const historyList = document.getElementById("historyList");

let currentTool = "message";
let history = [];


/* --------------------------------
   SAFE HTML HELPERS
-------------------------------- */

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function showElement(element) {
    element.classList.remove("hidden");
}

function hideElement(element) {
    element.classList.add("hidden");
}


/* --------------------------------
   TOOL SWITCHING
-------------------------------- */

const toolConfiguration = {
    message: {
        label: "AI MESSAGE ANALYSIS",
        title: "Analyze a message",
        description: "Paste a suspicious message to inspect its content.",
        symbol: "✳"
    },

    email: {
        label: "EMAIL VALIDATION",
        title: "Inspect an email address",
        description: "Check technical email characteristics and deliverability.",
        symbol: "✉"
    },

    phone: {
        label: "PHONE VALIDATION",
        title: "Inspect a phone number",
        description: "Validate a number and inspect available metadata.",
        symbol: "⌕"
    }
};


toolCards.forEach(card => {
    card.addEventListener("click", () => {
        const selectedTool = card.dataset.tool;

        currentTool = selectedTool;

        toolCards.forEach(item => {
            item.classList.toggle("active", item === card);
        });

        const config = toolConfiguration[selectedTool];

        workspaceLabel.textContent = config.label;
        workspaceTitle.textContent = config.title;
        workspaceDescription.textContent = config.description;
        workspaceSymbol.textContent = config.symbol;

        hideElement(loadingState);
        hideElement(errorBox);
        hideElement(resultSection);

        messageForm.classList.toggle("hidden", selectedTool !== "message");
        emailForm.classList.toggle("hidden", selectedTool !== "email");
        phoneForm.classList.toggle("hidden", selectedTool !== "phone");

        document.querySelector(".workspace-panel").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
});


/* --------------------------------
   MESSAGE COUNTER AND EXAMPLES
-------------------------------- */

messageInput.addEventListener("input", () => {
    characterCount.textContent =
        `${messageInput.value.length} / 10000`;
});


document.querySelectorAll(".example-chip").forEach(button => {
    button.addEventListener("click", () => {
        messageInput.value = button.dataset.example;

        characterCount.textContent =
            `${messageInput.value.length} / 10000`;

        messageInput.focus();
    });
});


/* --------------------------------
   API REQUEST HELPER
-------------------------------- */

async function postJSON(endpoint, payload) {
    const response = await fetch(endpoint, {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.error || `Request failed with status ${response.status}`
        );
    }

    return data;
}


/* --------------------------------
   LOADING AND ERROR STATES
-------------------------------- */

function startLoading(title, description, form) {
    hideElement(errorBox);
    hideElement(resultSection);

    showElement(loadingState);

    loadingTitle.textContent = title;
    loadingDescription.textContent = description;

    const button = form.querySelector('button[type="submit"]');

    if (button) {
        button.disabled = true;
    }

    return button;
}


function stopLoading(button) {
    hideElement(loadingState);

    if (button) {
        button.disabled = false;
    }
}


function showError(message) {
    errorMessage.textContent = message;
    showElement(errorBox);
}


/* --------------------------------
   RESULT HELPERS
-------------------------------- */

function formatBoolean(value) {
    if (value === true) return "Yes";
    if (value === false) return "No";

    return "Unknown";
}


function formatValue(value) {
    if (value === null || value === undefined || value === "") {
        return "Unavailable";
    }

    if (typeof value === "object") {
        return Object.values(value)
            .filter(item => item !== null && item !== undefined)
            .join(", ") || "Unavailable";
    }

    return String(value);
}


function renderMetric(label, value) {
    return `
        <div class="result-metric">
            <span class="metric-label">${escapeHTML(label)}</span>
            <div class="metric-value">${escapeHTML(formatValue(value))}</div>
        </div>
    `;
}


function renderNotice(message) {
    return `
        <p class="result-notice">${escapeHTML(message)}</p>
    `;
}


function showResults(html) {
    resultContent.innerHTML = html;

    showElement(resultSection);

    resultSection.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}


/* --------------------------------
   HISTORY
-------------------------------- */

function addHistory(tool, summary, status) {
    history.unshift({
        tool,
        summary,
        status,
        time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        })
    });

    history = history.slice(0, 8);

    renderHistory();
}


function renderHistory() {
    if (history.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history">
                <span>◷</span>
                <p>Your recent scans will appear here.</p>
            </div>
        `;

        return;
    }

    historyList.innerHTML = history.map(item => {
        const badgeClass = {
            SPAM: "spam",
            SUSPICIOUS: "suspicious",
            LEGITIMATE: "legitimate"
        }[item.status] || "suspicious";

        return `
            <div class="history-item">
                <div>
                    <strong>${escapeHTML(item.summary)}</strong>
                    <small>
                        ${escapeHTML(item.tool)} · ${escapeHTML(item.time)}
                    </small>
                </div>

                <span class="history-badge ${badgeClass}">
                    ${escapeHTML(item.status)}
                </span>
            </div>
        `;
    }).join("");
}


document.getElementById("clearHistory").addEventListener("click", () => {
    history = [];
    renderHistory();
});


document.getElementById("clearResult").addEventListener("click", () => {
    hideElement(resultSection);
});


/* --------------------------------
   MESSAGE SCANNER
-------------------------------- */

messageForm.addEventListener("submit", async event => {
    event.preventDefault();

    const message = messageInput.value.trim();

    if (!message) {
        showError("Please enter a message.");
        return;
    }

    const button = startLoading(
        "Analyzing your message",
        "Gemini is examining the supplied text...",
        messageForm
    );

    try {
        const data = await postJSON(
            "/api/analyze-message",
            { message }
        );

        renderMessageResult(data);

        addHistory(
            "Message Scanner",
            message.slice(0, 65),
            data.classification
        );

    } catch (error) {
        showError(error.message);
    } finally {
        stopLoading(button);
    }
});


function renderMessageResult(data) {
    const classification = data.classification;

    const riskClass = {
        HIGH: "status-high",
        MEDIUM: "status-medium",
        LOW: "status-low"
    }[data.risk_level] || "status-medium";

    const reasons = Array.isArray(data.reasons)
        ? data.reasons
        : [];

    const reasonHTML = reasons.length
        ? reasons.map(reason => `
            <li>${escapeHTML(reason)}</li>
        `).join("")
        : "<li>No detailed reasons were returned.</li>";

    showResults(`
        <div class="result-card">

            <span class="result-status ${riskClass}">
                ${classification === "SPAM" ? "⚠" : "✳"}
                ${escapeHTML(classification)}
            </span>

            <h3>
                ${escapeHTML(data.category || "Message analysis")}
            </h3>

            <p class="result-description">
                ${escapeHTML(data.explanation)}
            </p>

            <div class="result-grid">

                ${renderMetric("RISK LEVEL", data.risk_level)}

                <div class="result-metric">
                    <span class="metric-label">MODEL CONFIDENCE ESTIMATE</span>

                    <div class="metric-value">
                        ${escapeHTML(data.confidence)}%
                    </div>

                    <div class="confidence-bar">
                        <div style="width: ${Math.max(
                            0,
                            Math.min(100, Number(data.confidence) || 0)
                        )}%"></div>
                    </div>
                </div>

            </div>

            <h4 class="result-subheading">Why was it classified this way?</h4>

            <ul class="result-list">
                ${reasonHTML}
            </ul>

            <div class="recommendation-box">
                <strong>Recommended action</strong><br>
                ${escapeHTML(data.recommendation)}
            </div>

            ${renderNotice(
                "AI assessment only. This is not a guarantee that the message is safe or malicious."
            )}

        </div>
    `);
}


/* --------------------------------
   EMAIL CHECKER
-------------------------------- */

emailForm.addEventListener("submit", async event => {
    event.preventDefault();

    const email = document.getElementById("emailInput").value.trim();

    const button = startLoading(
        "Validating email",
        "Checking available email and domain indicators...",
        emailForm
    );

    try {
        const data = await postJSON(
            "/api/check-email",
            { email }
        );

        renderEmailResult(data);

        addHistory(
            "Email Checker",
            email,
            data.classification || (data.deliverability === "DELIVERABLE" ? "LEGITIMATE" : "SUSPICIOUS")
        );

    } catch (error) {
        showError(error.message);
    } finally {
        stopLoading(button);
    }
});


function renderEmailResult(data) {
    const classification = data.classification || (
        data.deliverability === "DELIVERABLE" ? "LEGITIMATE" : "SUSPICIOUS"
    );

    const riskClass = {
        HIGH: "status-high",
        MEDIUM: "status-medium",
        LOW: "status-low"
    }[data.risk_level] || (
        classification === "SPAM" ? "status-high" :
        classification === "LEGITIMATE" ? "status-low" : "status-medium"
    );

    const reasons = Array.isArray(data.reasons) ? data.reasons : [];
    const reasonHTML = reasons.length
        ? reasons.map(reason => `<li>${escapeHTML(reason)}</li>`).join("")
        : "<li>No threat factors detected.</li>";

    const deliverability = String(data.deliverability || "UNKNOWN").toUpperCase();

    showResults(`
        <div class="result-card">

            <span class="result-status ${riskClass}">
                ${classification === "SPAM" ? "⚠" : classification === "LEGITIMATE" ? "✓" : "✳"}
                ${escapeHTML(classification)}
            </span>

            <h3>${escapeHTML(data.category || "Email threat analysis")}</h3>

            <p class="result-description">
                ${escapeHTML(data.explanation || data.message)}
            </p>

            <div class="result-grid">
                ${renderMetric("RISK LEVEL", data.risk_level || "MEDIUM")}

                <div class="result-metric">
                    <span class="metric-label">THREAT CONFIDENCE</span>
                    <div class="metric-value">
                        ${escapeHTML(data.confidence || 90)}%
                    </div>
                    <div class="confidence-bar">
                        <div style="width: ${Math.max(0, Math.min(100, Number(data.confidence) || 90))}%"></div>
                    </div>
                </div>
            </div>

            <h4 class="result-subheading">Why was it classified this way?</h4>

            <ul class="result-list">
                ${reasonHTML}
            </ul>

            ${data.recommendation ? `
            <div class="recommendation-box">
                <strong>Recommended action</strong><br>
                ${escapeHTML(data.recommendation)}
            </div>
            ` : ""}

            <h4 class="result-subheading" style="margin-top: 1.5rem;">Technical & Domain Details</h4>

            <div class="result-grid">
                ${renderMetric("EMAIL ADDRESS", data.email)}
                ${renderMetric("DOMAIN", data.domain)}
                ${renderMetric("DELIVERABILITY", deliverability)}
                ${renderMetric("QUALITY SCORE", data.quality_score)}
                ${renderMetric("VALID FORMAT", formatBoolean(data.is_valid_format))}
                ${renderMetric("MAIL SERVER RECORDS", formatBoolean(data.is_mx_found))}
                ${renderMetric("SMTP CHECK", formatBoolean(data.is_smtp_valid))}
                ${renderMetric("DISPOSABLE ADDRESS", formatBoolean(data.is_disposable))}
                ${renderMetric("FREE PROVIDER", formatBoolean(data.is_free_provider))}
                ${renderMetric("ROLE ADDRESS", formatBoolean(data.is_role_account))}
            </div>

            ${renderNotice(
                "Email threat and reputation assessment. While this flags disposable domains and known threat scores, always verify unexpected requests."
            )}

        </div>
    `);
}


/* --------------------------------
   PHONE CHECKER
-------------------------------- */

phoneForm.addEventListener("submit", async event => {
    event.preventDefault();

    const phone = document.getElementById("phoneInput").value.trim();

    const country = document.getElementById("countryInput").value;

    const button = startLoading(
        "Checking phone number",
        "Inspecting available number and carrier information...",
        phoneForm
    );

    try {
        const data = await postJSON(
            "/api/check-phone",
            { phone, country }
        );

        renderPhoneResult(data);

        addHistory(
            "Phone Checker",
            phone,
            data.classification || (data.valid === true ? "LEGITIMATE" : "SUSPICIOUS")
        );

    } catch (error) {
        showError(error.message);
    } finally {
        stopLoading(button);
    }
});


function renderPhoneResult(data) {
    const classification = data.classification || (
        data.valid === true ? "LEGITIMATE" : "SUSPICIOUS"
    );

    const riskClass = {
        HIGH: "status-high",
        MEDIUM: "status-medium",
        LOW: "status-low"
    }[data.risk_level] || (
        classification === "SPAM" ? "status-high" :
        classification === "LEGITIMATE" ? "status-low" : "status-medium"
    );

    const reasons = Array.isArray(data.reasons) ? data.reasons : [];
    const reasonHTML = reasons.length
        ? reasons.map(reason => `<li>${escapeHTML(reason)}</li>`).join("")
        : "<li>No phone threat factors detected.</li>";

    const countryName = data.country && typeof data.country === "object"
        ? data.country.name
        : data.country;

    const statusText = data.valid === true ? "VALID FORMAT" : data.valid === false ? "INVALID" : "UNKNOWN";

    showResults(`
        <div class="result-card">

            <span class="result-status ${riskClass}">
                ${classification === "SPAM" ? "⚠" : classification === "LEGITIMATE" ? "✓" : "✳"}
                ${escapeHTML(classification)}
            </span>

            <h3>${escapeHTML(data.category || "Phone threat analysis")}</h3>

            <p class="result-description">
                ${escapeHTML(data.explanation || data.message)}
            </p>

            <div class="result-grid">
                ${renderMetric("RISK LEVEL", data.risk_level || "MEDIUM")}

                <div class="result-metric">
                    <span class="metric-label">THREAT CONFIDENCE</span>
                    <div class="metric-value">
                        ${escapeHTML(data.confidence || 90)}%
                    </div>
                    <div class="confidence-bar">
                        <div style="width: ${Math.max(0, Math.min(100, Number(data.confidence) || 90))}%"></div>
                    </div>
                </div>
            </div>

            <h4 class="result-subheading">Why was it classified this way?</h4>

            <ul class="result-list">
                ${reasonHTML}
            </ul>

            ${data.recommendation ? `
            <div class="recommendation-box">
                <strong>Recommended action</strong><br>
                ${escapeHTML(data.recommendation)}
            </div>
            ` : ""}

            <h4 class="result-subheading" style="margin-top: 1.5rem;">Carrier & Telecom Details</h4>

            <div class="result-grid">
                ${renderMetric("PHONE NUMBER", data.phone)}
                ${renderMetric("FORMAT STATUS", statusText)}
                ${renderMetric("COUNTRY", countryName)}
                ${renderMetric("LOCATION", data.location)}
                ${renderMetric("LINE TYPE", data.type)}
                ${renderMetric("CARRIER", data.carrier)}
                ${data.is_voip !== undefined ? renderMetric("VOIP / VIRTUAL", formatBoolean(data.is_voip)) : ""}
                ${data.is_abuse_detected !== undefined ? renderMetric("ABUSE REPORTED", formatBoolean(data.is_abuse_detected)) : ""}
            </div>

            ${renderNotice(
                "Phone threat and carrier assessment. Spoofed numbers can sometimes impersonate legitimate lines."
            )}

        </div>
    `);
}


const toolCards = document.querySelectorAll(".tool-card");
const workspaceTabButtons = document.querySelectorAll(".workspace-tab-btn");
const scannerTabPanes = document.querySelectorAll(".scanner-tab-pane");

const messageForm = document.getElementById("messageForm");
const emailForm = document.getElementById("emailForm");
const phoneForm = document.getElementById("phoneForm");
const qrForm = document.getElementById("qrForm");

const loadingState = document.getElementById("loadingState");
const loadingTitle = document.getElementById("loadingTitle");
const loadingDescription = document.getElementById("loadingDescription");

const errorBox = document.getElementById("errorBox");
const errorMessage = document.getElementById("errorMessage");
const dismissErrorBtn = document.getElementById("dismissError");

const resultSection = document.getElementById("resultSection");
const resultContent = document.getElementById("resultContent");
const copyReportBtn = document.getElementById("copyReportBtn");
const clearResultBtn = document.getElementById("clearResult");

const characterCount = document.getElementById("characterCount");
const messageInput = document.getElementById("messageInput");
const emailInput = document.getElementById("emailInput");
const phoneInput = document.getElementById("phoneInput");
const countryInput = document.getElementById("countryInput");
const clearMessageInput = document.getElementById("clearMessageInput");
const clearEmailInput = document.getElementById("clearEmailInput");

const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistory");
const historyFilterButtons = document.querySelectorAll(".history-filter-btn");

let currentTool = "message";
let currentHistoryFilter = "all";
let history = [];

const tabResults = {
    message: null,
    email: null,
    phone: null,
    qr: null
};

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
    if (element) element.classList.remove("hidden");
}

function hideElement(element) {
    if (element) element.classList.add("hidden");
}

function showToast(message, icon = "✦") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.innerHTML = `<span>${icon}</span> <span>${escapeHTML(message)}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3100);
}

function switchTab(toolId, shouldScroll = false) {
    const validTools = ["message", "email", "phone", "qr"];
    if (!validTools.includes(toolId)) toolId = "message";

    currentTool = toolId;

    workspaceTabButtons.forEach(btn => {
        const isSelected = btn.dataset.tab === toolId;
        btn.classList.toggle("active", isSelected);
        btn.setAttribute("aria-selected", isSelected ? "true" : "false");

        if (isSelected) {
            const icon = btn.querySelector(".tab-btn-icon");
            if (icon) {
                icon.style.animation = "none";
                void icon.offsetWidth;
                icon.style.animation = "";
            }
        }
    });

    toolCards.forEach(card => {
        card.classList.toggle("active", card.dataset.tool === toolId);
    });

    scannerTabPanes.forEach(pane => {
        const paneId = `pane-${toolId}`;
        const isActive = pane.id === paneId;
        if (isActive) {
            pane.classList.remove("hidden");

            pane.classList.remove("active");
            void pane.offsetWidth;
            pane.classList.add("active");
        } else {
            pane.classList.remove("active");
            pane.classList.add("hidden");
        }
    });

    hideElement(loadingState);
    hideElement(errorBox);

    if (tabResults[toolId]) {
        resultContent.innerHTML = tabResults[toolId];
        showElement(resultSection);
        const resHtml = tabResults[toolId];
        document.body.classList.remove("threat-spam", "threat-suspicious", "threat-legitimate");
        if (resHtml.includes("status-high") || resHtml.includes("SPAM")) {
            document.body.classList.add("threat-spam");
        } else if (resHtml.includes("status-medium") || resHtml.includes("SUSPICIOUS")) {
            document.body.classList.add("threat-suspicious");
        } else if (resHtml.includes("status-low") || resHtml.includes("LEGITIMATE")) {
            document.body.classList.add("threat-legitimate");
        }
    } else {
        hideElement(resultSection);
        document.body.classList.remove("threat-spam", "threat-suspicious", "threat-legitimate");
    }

    if (toolId !== "qr" && typeof stopCameraScanner === "function") {
        stopCameraScanner();
    }

    try {
        history.replaceState(null, null, `#${toolId}`);
    } catch (e) {

    }

    if (shouldScroll) {
        const workspaceElem = document.getElementById("scannerWorkspace");
        if (workspaceElem) {
            workspaceElem.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    }
}

workspaceTabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        switchTab(btn.dataset.tab, false);
    });
});

toolCards.forEach(card => {
    card.addEventListener("click", () => {
        switchTab(card.dataset.tool, true);
    });
});

window.addEventListener("DOMContentLoaded", () => {
    const hash = window.location.hash.replace("#", "").toLowerCase();
    if (["message", "email", "phone", "qr"].includes(hash)) {
        switchTab(hash, false);
    }
});

if (clearMessageInput && messageInput) {
    clearMessageInput.addEventListener("click", () => {
        messageInput.value = "";
        if (characterCount) characterCount.textContent = "0 / 10000";
        messageInput.focus();
        showToast("Message cleared", "✓");
    });
}

if (clearEmailInput && emailInput) {
    clearEmailInput.addEventListener("click", () => {
        emailInput.value = "";
        emailInput.focus();
        showToast("Email cleared", "✓");
    });
}

if (dismissErrorBtn && errorBox) {
    dismissErrorBtn.addEventListener("click", () => {
        hideElement(errorBox);
    });
}

if (messageInput && characterCount) {
    messageInput.addEventListener("input", () => {
        characterCount.textContent = `${messageInput.value.length} / 10000`;
    });
}

document.querySelectorAll(".example-chip:not(.email-example-chip):not(.phone-example-chip):not(.qr-example-chip)").forEach(button => {
    button.addEventListener("click", () => {
        if (messageInput) {
            messageInput.value = button.dataset.example;
            if (characterCount) characterCount.textContent = `${messageInput.value.length} / 10000`;
            messageInput.focus();
            showToast("Example loaded into Message Scanner", "💬");
        }
    });
});

document.querySelectorAll(".email-example-chip").forEach(button => {
    button.addEventListener("click", () => {
        if (emailInput) {
            emailInput.value = button.dataset.email;
            emailInput.focus();
            showToast("Example email loaded", "✉️");
        }
    });
});

document.querySelectorAll(".phone-example-chip").forEach(button => {
    button.addEventListener("click", () => {
        if (phoneInput) {
            phoneInput.value = button.dataset.phone;
            if (countryInput && button.dataset.country) {
                countryInput.value = button.dataset.country;
            }
            phoneInput.focus();
            showToast("Example phone number loaded", "📞");
        }
    });
});

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

function startLoading(title, description, form) {
    hideElement(errorBox);
    hideElement(resultSection);

    showElement(loadingState);

    loadingTitle.textContent = title;
    loadingDescription.textContent = description;

    const button = form ? form.querySelector('button[type="submit"]') : null;
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
    errorBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

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
    tabResults[currentTool] = html;
    resultContent.innerHTML = html;
    showElement(resultSection);

    document.body.classList.remove("threat-spam", "threat-suspicious", "threat-legitimate");
    if (html.includes("status-high") || html.includes("SPAM")) {
        document.body.classList.add("threat-spam");
    } else if (html.includes("status-medium") || html.includes("SUSPICIOUS")) {
        document.body.classList.add("threat-suspicious");
    } else if (html.includes("status-low") || html.includes("LEGITIMATE")) {
        document.body.classList.add("threat-legitimate");
    }

    resultSection.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}

if (copyReportBtn) {
    copyReportBtn.addEventListener("click", () => {
        if (!resultContent || !resultContent.innerText.trim()) {
            showToast("No active report to copy.", "⚠️");
            return;
        }

        const header = `[SpamShield AI Security Intelligence Report]\nGenerated: ${new Date().toLocaleString()}\nTool: ${currentTool.toUpperCase()}\n----------------------------------------\n`;
        const body = resultContent.innerText;

        navigator.clipboard.writeText(header + body).then(() => {
            showToast("Report copied to clipboard!", "📋");
        }).catch(() => {
            showToast("Could not copy report to clipboard.", "⚠️");
        });
    });
}

if (clearResultBtn) {
    clearResultBtn.addEventListener("click", () => {
        tabResults[currentTool] = null;
        hideElement(resultSection);
        showToast("Analysis result cleared", "✓");
    });
}

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

    history = history.slice(0, 15);
    renderHistory();
}

function renderHistory() {

    const allBtn = document.querySelector('.history-filter-btn[data-filter="all"]');
    if (allBtn) allBtn.textContent = `All (${history.length})`;

    if (history.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history">
                <span>◷</span>
                <p>Your recent scans in this session will appear here.</p>
            </div>
        `;
        return;
    }

    const filtered = currentHistoryFilter === "all"
        ? history
        : history.filter(item => item.tool.toLowerCase().includes(currentHistoryFilter.toLowerCase()));

    if (filtered.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history">
                <span>⌕</span>
                <p>No recent scans found for ${escapeHTML(currentHistoryFilter)}.</p>
            </div>
        `;
        return;
    }

    historyList.innerHTML = filtered.map(item => {
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

historyFilterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        currentHistoryFilter = btn.dataset.filter;
        historyFilterButtons.forEach(b => b.classList.toggle("active", b === btn));
        renderHistory();
    });
});

if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener("click", () => {
        history = [];
        renderHistory();
        showToast("Session history cleared", "✓");
    });
}

if (messageForm) {
    messageForm.addEventListener("submit", async event => {
        event.preventDefault();

        const message = messageInput.value.trim();

        if (!message) {
            showError("Please enter a message to analyze.");
            return;
        }

        const button = startLoading(
            "Analyzing Message with Gemini AI",
            "Inspecting semantics, urgency flags, and phishing lures...",
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
}

function renderMessageResult(data) {
    const classification = data.classification;

    const riskClass = {
        HIGH: "status-high",
        MEDIUM: "status-medium",
        LOW: "status-low"
    }[data.risk_level] || "status-medium";

    const reasons = Array.isArray(data.reasons) ? data.reasons : [];
    const reasonHTML = reasons.length
        ? reasons.map(reason => `<li>${escapeHTML(reason)}</li>`).join("")
        : "<li>No suspicious indicators detected in message payload.</li>";

    showResults(`
        <div class="result-card">

            <span class="result-status ${riskClass}">
                ${classification === "SPAM" ? "⚠" : classification === "LEGITIMATE" ? "✓" : "✳"}
                ${escapeHTML(classification)}
            </span>

            <h3>${escapeHTML(data.category || "Message Threat Analysis")}</h3>

            <p class="result-description">
                ${escapeHTML(data.explanation)}
            </p>

            <div class="result-grid">
                ${renderMetric("RISK LEVEL", data.risk_level)}

                <div class="result-metric">
                    <span class="metric-label">MODEL THREAT CONFIDENCE</span>
                    <div class="metric-value">
                        ${escapeHTML(data.confidence)}%
                    </div>
                    <div class="confidence-bar">
                        <div style="width: ${Math.max(0, Math.min(100, Number(data.confidence) || 0))}%"></div>
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
                "Gemini AI threat assessment. While highly accurate, always independently verify unexpected communications before sending sensitive data."
            )}

        </div>
    `);
}

if (emailForm) {
    emailForm.addEventListener("submit", async event => {
        event.preventDefault();

        const email = emailInput.value.trim();

        const button = startLoading(
            "Inspecting Email Reputation",
            "Verifying mail server MX records, SMTP handshake, and disposable domains...",
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
}

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
        : "<li>Clean mailbox with no negative threat records detected.</li>";

    const deliverability = String(data.deliverability || "UNKNOWN").toUpperCase();

    showResults(`
        <div class="result-card">

            <span class="result-status ${riskClass}">
                ${classification === "SPAM" ? "⚠" : classification === "LEGITIMATE" ? "✓" : "✳"}
                ${escapeHTML(classification)}
            </span>

            <h3>${escapeHTML(data.category || "Email Threat Assessment")}</h3>

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

            <h4 class="result-subheading" style="margin-top: 1.5rem;">Technical & Domain Diagnostics</h4>

            <div class="result-grid">
                ${renderMetric("EMAIL ADDRESS", data.email)}
                ${renderMetric("DOMAIN", data.domain)}
                ${data.domain_age ? renderMetric("DOMAIN AGE", data.domain_age) : ""}
                ${data.fraud_score !== undefined ? renderMetric("FRAUD SCORE", `${data.fraud_score} / 100`) : renderMetric("QUALITY SCORE", data.quality_score)}
                ${renderMetric("DELIVERABILITY", deliverability)}
                ${renderMetric("VALID FORMAT", formatBoolean(data.is_valid_format))}
                ${renderMetric("MAIL SERVER RECORDS", formatBoolean(data.is_mx_found))}
                ${renderMetric("SMTP CHECK", formatBoolean(data.is_smtp_valid))}
                ${renderMetric("DISPOSABLE ADDRESS", formatBoolean(data.is_disposable))}
                ${data.is_honeypot !== undefined ? renderMetric("HONEYPOT / TRAP", formatBoolean(data.is_honeypot)) : ""}
                ${data.is_leaked !== undefined ? renderMetric("BREACH LEAK", formatBoolean(data.is_leaked)) : ""}
                ${renderMetric("FREE PROVIDER", formatBoolean(data.is_free_provider))}
                ${renderMetric("ROLE ADDRESS", formatBoolean(data.is_role_account))}
            </div>

            ${renderNotice(
                "Email threat assessment evaluates domain security and disposable flags. Always verify unsolicited sender requests."
            )}

        </div>
    `);
}

if (phoneForm) {
    phoneForm.addEventListener("submit", async event => {
        event.preventDefault();

        const phone = phoneInput.value.trim();
        const country = countryInput ? countryInput.value : "";

        const button = startLoading(
            "Verifying Telecom Network Signals",
            "Checking international carrier registries, VoIP lines, and spam reports...",
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
}

function renderPhoneResult(data) {
    const classification = data.classification || (
        data.valid === true ? "SUSPICIOUS" : "SPAM"
    );

    const riskClass = {
        HIGH: "status-high",
        MEDIUM: "status-medium",
        LOW: "status-low"
    }[data.risk_level] || (
        classification === "SPAM" ? "status-high" : "status-medium"
    );

    const reasons = Array.isArray(data.reasons) ? data.reasons : [];
    const reasonHTML = reasons.length
        ? reasons.map(reason => `<li>${escapeHTML(reason)}</li>`).join("")
        : "<li>Clean carrier line with no reported abuse complaints.</li>";

    const countryName = data.country && typeof data.country === "object"
        ? data.country.name
        : data.country;

    const statusText = data.valid === true ? "ACTIVE FORMAT" : data.valid === false ? "INVALID" : "UNKNOWN";

    const spoofingAlert = data.spoofing_warning ? `
        <div class="spoofing-alert-box">
            <div class="spoofing-alert-title">
                <span>⚠️</span> <strong>CRITICAL CALLER SAFETY NOTICE (SPOOFING ALERT)</strong>
            </div>
            <p>
                Scammers routinely <strong>forge (spoof) caller IDs</strong> to display innocent local numbers, banks, couriers, or police. Telecom network validity does <strong>NOT</strong> prove the caller is authentic.
            </p>
            <div class="spoofing-rules">
                <span>✓ Never share OTPs or PINs</span>
                <span>✓ Never download remote apps (AnyDesk, APKs)</span>
                <span>✓ If claiming to be a bank/police, hang up and dial their official number</span>
            </div>
        </div>
    ` : "";

    showResults(`
        <div class="result-card">

            <span class="result-status ${riskClass}">
                ${classification === "SPAM" ? "⚠" : classification === "LEGITIMATE" ? "✓" : "✳"}
                ${escapeHTML(classification)}
            </span>

            <h3>${escapeHTML(data.category || "Phone Threat Analysis")}</h3>

            <p class="result-description">
                ${escapeHTML(data.explanation || data.message)}
            </p>

            ${spoofingAlert}

            <div class="result-grid">
                ${renderMetric("RISK LEVEL", data.risk_level || "MEDIUM")}

                <div class="result-metric">
                    <span class="metric-label">THREAT CONFIDENCE</span>
                    <div class="metric-value">
                        ${escapeHTML(data.confidence || 85)}%
                    </div>
                    <div class="confidence-bar">
                        <div style="width: ${Math.max(0, Math.min(100, Number(data.confidence) || 85))}%"></div>
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
                ${renderMetric("LINE STATUS", data.active_status || statusText)}
                ${data.caller_name ? renderMetric("CARRIER / IDENTITY", data.caller_name) : ""}
                ${data.reports_count !== undefined && data.reports_count > 0 ? renderMetric("SPAM COMPLAINTS", `${data.reports_count} community reports`) : ""}
                ${data.fraud_score !== undefined ? renderMetric("FRAUD SCORE", `${data.fraud_score} / 100`) : ""}
                ${renderMetric("COUNTRY", countryName)}
                ${renderMetric("LOCATION", data.location)}
                ${renderMetric("LINE TYPE", data.type)}
                ${renderMetric("TELECOM CARRIER", data.carrier)}
                ${data.is_voip !== undefined ? renderMetric("VOIP / VIRTUAL", formatBoolean(data.is_voip)) : ""}
                ${data.is_prepaid !== undefined ? renderMetric("PREPAID LINE", formatBoolean(data.is_prepaid)) : ""}
                ${data.is_abuse_detected !== undefined ? renderMetric("ABUSE REPORTED", formatBoolean(data.is_abuse_detected)) : ""}
                ${renderMetric("SPOOFING RISK", "HIGH on unexpected incoming calls")}
            </div>

            ${renderNotice(
                "Zero-Trust Phone Assessment: Technical carrier routing validates line existence, but cannot verify who holds the phone. Practice zero-trust on unsolicited calls."
            )}

        </div>
    `);
}

let currentQrMode = "camera";
let html5QrCodeScanner = null;
let isCameraActive = false;

const qrTabButtons = document.querySelectorAll(".qr-tab-btn");
const qrCameraMode = document.getElementById("qrCameraMode");
const qrFileMode = document.getElementById("qrFileMode");
const qrPasteMode = document.getElementById("qrPasteMode");

const qrTextInput = document.getElementById("qrTextInput");
const qrDropzone = document.getElementById("qrDropzone");
const qrFileInput = document.getElementById("qrFileInput");
const qrFilePreview = document.getElementById("qrFilePreview");
const qrPreviewImg = document.getElementById("qrPreviewImg");
const qrFileName = document.getElementById("qrFileName");
const qrDropContent = document.getElementById("qrDropContent");
const qrRemoveFileBtn = document.getElementById("qrRemoveFileBtn");

const startCameraBtn = document.getElementById("startCameraBtn");
const stopCameraBtn = document.getElementById("stopCameraBtn");
const qrCameraControls = document.getElementById("qrCameraControls");
const qrCameraPlaceholder = document.getElementById("qrCameraPlaceholder");

qrTabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const mode = btn.dataset.mode;
        currentQrMode = mode;

        qrTabButtons.forEach(b => b.classList.toggle("active", b === btn));

        if (qrCameraMode) qrCameraMode.classList.toggle("hidden", mode !== "camera");
        if (qrFileMode) qrFileMode.classList.toggle("hidden", mode !== "file");
        if (qrPasteMode) qrPasteMode.classList.toggle("hidden", mode !== "paste");

        if (mode !== "camera") {
            stopCameraScanner();
        }
    });
});

document.querySelectorAll(".qr-example-chip").forEach(chip => {
    chip.addEventListener("click", () => {
        const example = chip.dataset.example;
        const pasteBtn = document.querySelector('.qr-tab-btn[data-mode="paste"]');
        if (pasteBtn) pasteBtn.click();

        if (qrTextInput) {
            qrTextInput.value = example;
            qrTextInput.focus();
        }
        submitQrPayload(example, "example");
    });
});

function initQrScanner() {
    if (!html5QrCodeScanner && typeof Html5Qrcode !== "undefined") {
        try {
            html5QrCodeScanner = new Html5Qrcode("qrReader");
        } catch (e) {
            console.warn("Html5Qrcode init error:", e);
        }
    }
}

async function startCameraScanner() {
    initQrScanner();
    if (!html5QrCodeScanner) {
        showError("Camera scanner library not ready. Try uploading an image or pasting the link.");
        return;
    }

    try {
        hideElement(qrCameraPlaceholder);
        showElement(qrCameraControls);

        await html5QrCodeScanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText, decodedResult) => {
                stopCameraScanner();
                if (qrTextInput) qrTextInput.value = decodedText;
                submitQrPayload(decodedText, "camera");
            },
            (errorMessage) => {

            }
        );
        isCameraActive = true;
    } catch (err) {
        stopCameraScanner();
        showError("Could not access camera: " + (err.message || err));
    }
}

async function stopCameraScanner() {
    if (html5QrCodeScanner && isCameraActive) {
        try {
            await html5QrCodeScanner.stop();
        } catch (e) {
            console.warn("Camera stop error:", e);
        }
    }
    isCameraActive = false;
    if (qrCameraPlaceholder) showElement(qrCameraPlaceholder);
    if (qrCameraControls) hideElement(qrCameraControls);
}

if (startCameraBtn) {
    startCameraBtn.addEventListener("click", startCameraScanner);
}

if (stopCameraBtn) {
    stopCameraBtn.addEventListener("click", stopCameraScanner);
}

if (qrDropzone && qrFileInput) {
    qrDropzone.addEventListener("dragover", e => {
        e.preventDefault();
        qrDropzone.classList.add("dragover");
    });

    qrDropzone.addEventListener("dragleave", () => {
        qrDropzone.classList.remove("dragover");
    });

    qrDropzone.addEventListener("drop", e => {
        e.preventDefault();
        qrDropzone.classList.remove("dragover");
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleQrImageFile(e.dataTransfer.files[0]);
        }
    });

    qrFileInput.addEventListener("change", () => {
        if (qrFileInput.files && qrFileInput.files.length > 0) {
            handleQrImageFile(qrFileInput.files[0]);
        }
    });
}

if (qrRemoveFileBtn) {
    qrRemoveFileBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (qrFileInput) qrFileInput.value = "";
        if (qrPreviewImg) qrPreviewImg.src = "";
        if (qrFileName) qrFileName.textContent = "";
        hideElement(qrFilePreview);
        showElement(qrDropContent);
        showToast("QR file removed", "✓");
    });
}

async function handleQrImageFile(file) {
    if (!file || !file.type.startsWith("image/")) {
        showError("Please upload a valid image file (PNG, JPG, WebP).");
        return;
    }

    const reader = new FileReader();
    reader.onload = e => {
        if (qrPreviewImg) qrPreviewImg.src = e.target.result;
        if (qrFileName) qrFileName.textContent = file.name;
        if (qrDropContent) hideElement(qrDropContent);
        if (qrFilePreview) showElement(qrFilePreview);
    };
    reader.readAsDataURL(file);

    initQrScanner();
    if (!html5QrCodeScanner) {
        showError("QR reader not initialized. Try pasting the link.");
        return;
    }

    const button = startLoading(
        "Scanning QR Image File",
        "Reading and decoding visual matrix data...",
        qrForm
    );

    try {
        const decodedText = await html5QrCodeScanner.scanFile(file, true);
        if (qrTextInput) qrTextInput.value = decodedText;
        await submitQrPayload(decodedText, "file");
    } catch (err) {
        showError("Could not decode a QR code from this image. Please ensure the QR is clear and well-lit, or paste the link.");
    } finally {
        stopLoading(button);
    }
}

async function submitQrPayload(payload, sourceMethod = "manual") {
    payload = (payload || "").trim();
    if (!payload) {
        showError("Please scan a QR code, upload an image, or paste a link.");
        return;
    }

    const button = startLoading(
        "Verifying QR Code Security",
        "Gemini AI and Security Validators are inspecting destination links and fraud traps...",
        qrForm
    );

    try {
        const data = await postJSON("/api/check-qr", {
            payload,
            source_method: sourceMethod
        });

        renderQrResult(data);

        addHistory(
            "QR Verifier",
            payload.slice(0, 50),
            data.classification || "SUSPICIOUS"
        );
    } catch (error) {
        showError(error.message);
    } finally {
        stopLoading(button);
    }
}

if (qrForm) {
    qrForm.addEventListener("submit", event => {
        event.preventDefault();
        const text = qrTextInput ? qrTextInput.value.trim() : "";
        submitQrPayload(text, currentQrMode);
    });
}

function renderQrResult(data) {
    const classification = data.classification || "SUSPICIOUS";
    const riskLevel = data.risk_level || "MEDIUM";

    const riskClass = {
        HIGH: "status-high",
        MEDIUM: "status-medium",
        LOW: "status-low"
    }[riskLevel] || "status-medium";

    const reasons = Array.isArray(data.reasons) ? data.reasons : [];
    const reasonHTML = reasons.length
        ? reasons.map(r => `<li>${escapeHTML(r)}</li>`).join("")
        : "<li>QR code threat analysis completed.</li>";

    const checklist = Array.isArray(data.safety_checklist) ? data.safety_checklist : [];
    const checklistHTML = checklist.length
        ? checklist.map(c => `<li>${escapeHTML(c)}</li>`).join("")
        : "<li>Never enter your banking PIN or password on unverified QR links.</li>";

    const isUpi = Boolean(data.is_upi);
    const isRedirected = Boolean(data.is_redirected);

    const upiAlertHTML = isUpi ? `
        <div class="upi-alert-banner">
            <div class="upi-alert-title">
                <span>⚠️</span> <strong>CRITICAL PAYMENT FRAUD ALERT (UPI DEBIT TRAP)</strong>
            </div>
            <p>
                This QR code contains a <strong>Payment Request</strong> to debit your bank account!
                Scammers frequently trick victims with "Scan to receive cashback/lottery prize" claims.
            </p>
            <div class="spoofing-rules">
                <span>⛔ NEVER enter UPI PIN to receive money</span>
                <span>⛔ Scanning a QR code only SENDS money, never receives</span>
                <span>✓ Cancel transaction immediately</span>
            </div>
        </div>
    ` : "";

    const redirectHTML = isRedirected ? `
        <div class="quishing-redirect-box">
            <div class="quishing-redirect-title">
                <span>↗</span> <strong>URL SHORTENER UNMASKED (REDIRECT DETECTED)</strong>
            </div>
            <div class="quishing-redirect-path">
                <strong>Original Shortlink:</strong> ${escapeHTML(data.payload)}<br>
                <strong>True Landing Destination:</strong> <span style="color: #fca5a5; font-weight: 600;">${escapeHTML(data.final_url || data.parsed_info?.final_url || "")}</span>
            </div>
        </div>
    ` : "";

    const parsed = data.parsed_info || {};

    showResults(`
        <div class="result-card">

            <span class="result-status ${riskClass}">
                ${classification === "SPAM" ? "⚠" : classification === "LEGITIMATE" ? "✓" : "✳"}
                ${escapeHTML(classification)}
            </span>

            <h3>${escapeHTML(data.category || "QR Code Security Verification")}</h3>

            <p class="result-description">
                ${escapeHTML(data.explanation || data.message)}
            </p>

            ${upiAlertHTML}
            ${redirectHTML}

            <div class="qr-payload-display">
                <code>${escapeHTML(data.payload)}</code>
                <button type="button" class="copy-btn" onclick="navigator.clipboard.writeText(this.previousElementSibling.textContent); showToast('Decoded link copied!', '📋');">Copy</button>
            </div>

            <div class="result-grid">
                ${renderMetric("RISK LEVEL", riskLevel)}

                <div class="result-metric">
                    <span class="metric-label">THREAT CONFIDENCE</span>
                    <div class="metric-value">
                        ${escapeHTML(data.confidence || 85)}%
                    </div>
                    <div class="confidence-bar">
                        <div style="width: ${Math.max(0, Math.min(100, Number(data.confidence) || 85))}%"></div>
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

            <div class="safety-checklist-box">
                <h5>🛡️ Critical QR Safety Checklist</h5>
                <ul class="safety-checklist-list">
                    ${checklistHTML}
                </ul>
            </div>

            <h4 class="result-subheading" style="margin-top: 1.5rem;">Decoded Payload & Destination Details</h4>

            <div class="result-grid">
                ${renderMetric("PAYLOAD TYPE", data.qr_type)}
                ${data.fraud_score !== undefined ? renderMetric("FRAUD SCORE", `${data.fraud_score} / 100`) : ""}
                ${parsed.domain ? renderMetric("DESTINATION DOMAIN", parsed.domain) : ""}
                ${parsed.is_https !== undefined ? renderMetric("ENCRYPTED HTTPS", formatBoolean(parsed.is_https)) : ""}
                ${renderMetric("REDIRECT UNMASKED", formatBoolean(isRedirected))}
                ${parsed.payee_vpa ? renderMetric("PAYEE UPI ID", parsed.payee_vpa) : ""}
                ${parsed.amount ? renderMetric("REQUESTED AMOUNT", `₹${parsed.amount}`) : ""}
                ${parsed.has_dangerous_file ? renderMetric("MALICIOUS FILE", "Direct Executable / APK Download") : ""}
                ${renderMetric("VERIFICATION ENGINE", data.provider || "Gemini AI Quishing Arbiter")}
            </div>

            ${renderNotice(
                "Quishing Security Notice: Cybercriminals place deceptive QR codes on parking meters, emails, and flyers to bypass spam filters. Always inspect the destination domain."
            )}

        </div>
    `);
}

function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius, rotation, fillStyle, glowColor, glowBlur) {
    let rot = (Math.PI / 2) * 3 + (rotation || 0);
    const step = Math.PI / spikes;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
        let x = cx + Math.cos(rot) * outerRadius;
        let y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();

    ctx.fillStyle = fillStyle;
    if (glowColor && glowBlur) {
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = glowBlur;
    }
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(1.2, outerRadius * 0.25), 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.restore();
}

function initCyberBackground() {
    const canvas = document.getElementById("cyberCanvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let animationFrameId = null;
    let stars = [];
    let microStars = [];
    let sparks = [];
    const STAR_COUNT = Math.min(55, Math.max(25, Math.floor(window.innerWidth / 35)));
    const MICRO_STAR_COUNT = Math.min(65, Math.max(30, Math.floor(window.innerWidth / 28)));
    const MAX_DISTANCE = 140;
    const spotlight = document.getElementById("cyberSpotlight");
    const gridOverlay = document.querySelector(".cyber-grid-overlay");

    const mouse = {
        x: null,
        y: null,
        radius: 155
    };

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    class Star {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.35;
            this.vy = (Math.random() - 0.5) * 0.35;
            this.spikes = Math.random() > 0.2 ? 4 : 5;

            this.outerRadius = Math.random() * 7 + 5.5;
            this.innerRadius = this.outerRadius * (this.spikes === 4 ? 0.26 : 0.4);
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.008;
            this.baseAlpha = Math.random() * 0.35 + 0.55;
            this.twinklePhase = Math.random() * Math.PI * 2;
            this.twinkleSpeed = Math.random() * 0.035 + 0.015;
            this.color = Math.random() > 0.4 ? "167, 139, 250" : (Math.random() > 0.3 ? "96, 165, 250" : "244, 246, 255");
        }

        update() {
            if (this.x < 0) this.x = width;
            else if (this.x > width) this.x = 0;

            if (this.y < 0) this.y = height;
            else if (this.y > height) this.y = 0;

            this.rotation += this.rotationSpeed;
            this.twinklePhase += this.twinkleSpeed;

            if (mouse.x !== null && mouse.y !== null) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < mouse.radius && dist > 1) {
                    const force = (mouse.radius - dist) / mouse.radius;
                    this.x += (dx / dist) * force * 0.8;
                    this.y += (dy / dist) * force * 0.8;
                }
            }

            this.x += this.vx;
            this.y += this.vy;
        }

        draw() {
            const alpha = Math.max(0.25, Math.min(1, this.baseAlpha + Math.sin(this.twinklePhase) * 0.35));
            drawStar(
                ctx,
                this.x,
                this.y,
                this.spikes,
                this.outerRadius,
                this.innerRadius,
                this.rotation,
                `rgba(${this.color}, ${alpha})`,
                `rgba(${this.color}, 0.85)`,
                12
            );
        }
    }

    class MicroStar {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.radius = Math.random() * 3.2 + 2.8;
            this.twinklePhase = Math.random() * Math.PI * 2;
            this.twinkleSpeed = Math.random() * 0.03 + 0.012;
            this.color = Math.random() > 0.3 ? "244, 246, 255" : "196, 181, 253";
        }

        update() {
            this.twinklePhase += this.twinkleSpeed;
        }

        draw() {
            const alpha = Math.max(0.2, Math.min(0.95, 0.55 + Math.sin(this.twinklePhase) * 0.35));
            drawStar(
                ctx,
                this.x,
                this.y,
                4,
                this.radius,
                this.radius * 0.25,
                0,
                `rgba(${this.color}, ${alpha})`,
                `rgba(${this.color}, 0.65)`,
                6
            );
        }
    }

    class Spark {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 1.5;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.outerRadius = Math.random() * 4.5 + 4;
            this.innerRadius = this.outerRadius * 0.26;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.15;
            this.alpha = 1;
            this.decay = Math.random() * 0.03 + 0.02;
            this.color = Math.random() > 0.4 ? "167, 139, 250" : (Math.random() > 0.3 ? "96, 165, 250" : "254, 240, 138");
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.rotation += this.rotationSpeed;
            this.vx *= 0.95;
            this.vy *= 0.95;
            this.alpha -= this.decay;
        }

        draw() {
            if (this.alpha <= 0) return;
            drawStar(
                ctx,
                this.x,
                this.y,
                4,
                this.outerRadius,
                this.innerRadius,
                this.rotation,
                `rgba(${this.color}, ${this.alpha})`,
                `rgba(${this.color}, 0.9)`,
                12
            );
        }
    }

    function init() {
        resize();
        stars = [];
        microStars = [];
        sparks = [];

        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push(new Star());
        }

        for (let i = 0; i < MICRO_STAR_COUNT; i++) {
            microStars.push(new MicroStar());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < microStars.length; i++) {
            microStars[i].update();
            microStars[i].draw();
        }

        for (let i = 0; i < stars.length; i++) {
            for (let j = i + 1; j < stars.length; j++) {
                const dx = stars[i].x - stars[j].x;
                const dy = stars[i].y - stars[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < MAX_DISTANCE) {
                    const alpha = (1 - dist / MAX_DISTANCE) * 0.18;
                    ctx.beginPath();
                    ctx.moveTo(stars[i].x, stars[i].y);
                    ctx.lineTo(stars[j].x, stars[j].y);
                    ctx.strokeStyle = `rgba(167, 139, 250, ${alpha})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }

        if (mouse.x !== null && mouse.y !== null) {
            for (let i = 0; i < stars.length; i++) {
                const dx = mouse.x - stars[i].x;
                const dy = mouse.y - stars[i].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 165) {
                    const alpha = (1 - dist / 165) * 0.35;
                    ctx.beginPath();
                    ctx.moveTo(mouse.x, mouse.y);
                    ctx.lineTo(stars[i].x, stars[i].y);
                    ctx.strokeStyle = `rgba(167, 139, 250, ${alpha})`;
                    ctx.lineWidth = 1.2;
                    ctx.stroke();
                }
            }
        }

        for (let i = 0; i < stars.length; i++) {
            stars[i].update();
            stars[i].draw();
        }

        for (let i = sparks.length - 1; i >= 0; i--) {
            sparks[i].update();
            sparks[i].draw();
            if (sparks[i].alpha <= 0) {
                sparks.splice(i, 1);
            }
        }

        animationFrameId = requestAnimationFrame(animate);
    }

    let resizeTimer;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            resize();
        }, 150);
    });

    window.addEventListener("mousemove", (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;

        if (spotlight) {
            spotlight.style.setProperty("--mouse-screen-x", `${e.clientX}px`);
            spotlight.style.setProperty("--mouse-screen-y", `${e.clientY}px`);
        }

        if (gridOverlay) {
            const ox = ((e.clientX - window.innerWidth / 2) * 0.02).toFixed(1);
            const oy = ((e.clientY - window.innerHeight / 2) * 0.02).toFixed(1);
            gridOverlay.style.transform = `translate3d(${ox}px, ${oy}px, 0)`;
        }
    });

    window.addEventListener("mouseleave", () => {
        mouse.x = null;
        mouse.y = null;
    });

    window.addEventListener("click", (e) => {
        for (let i = 0; i < 10; i++) {
            sparks.push(new Spark(e.clientX, e.clientY));
        }
    });

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        } else {
            animationFrameId = requestAnimationFrame(animate);
        }
    });

    init();
    animate();
}

function initScrollReveal() {
    const revealElements = document.querySelectorAll("[data-scroll-reveal]");
    if (!revealElements.length) return;

    if ("IntersectionObserver" in window) {
        const observerOptions = {
            root: null,
            threshold: 0.08,
            rootMargin: "0px 0px -30px 0px"
        };

        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-revealed");
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        revealElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight - 30) {
                el.classList.add("is-revealed");
            } else {
                revealObserver.observe(el);
            }
        });
    } else {
        revealElements.forEach(el => el.classList.add("is-revealed"));
    }
}

function initScrollParallax() {
    const cyberBg = document.querySelector(".cyber-moving-bg");
    if (!cyberBg) return;

    let ticking = false;

    window.addEventListener("scroll", () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrolled = window.pageYOffset || document.documentElement.scrollTop;
                cyberBg.style.transform = `translate3d(0, ${scrolled * 0.12}px, 0)`;
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

function initCardTiltPhysics() {
    const tiltCards = document.querySelectorAll('[data-tilt="true"]');

    tiltCards.forEach(card => {
        let isHovered = false;

        card.addEventListener("mouseenter", () => {
            isHovered = true;
            card.style.transition = "transform 0.12s ease-out, box-shadow 0.25s ease, border-color 0.25s ease";
        });

        card.addEventListener("mousemove", (e) => {
            if (!isHovered) return;
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;

            const rotateX = ((y - 0.5) * -14).toFixed(2);
            const rotateY = ((x - 0.5) * 14).toFixed(2);

            card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale3d(1.035, 1.035, 1.035)`;
            card.style.setProperty("--glare-x", `${(x * 100).toFixed(1)}%`);
            card.style.setProperty("--glare-y", `${(y * 100).toFixed(1)}%`);
        });

        card.addEventListener("mouseleave", () => {
            isHovered = false;
            card.style.transition = "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease, border-color 0.25s ease";
            card.style.transform = "";
            card.style.setProperty("--glare-x", "50%");
            card.style.setProperty("--glare-y", "50%");
        });
    });
}

function initCustomCursor() {
    const cursorDot = document.getElementById("cursorDot");
    const cursorRing = document.getElementById("cursorRing");
    if (!cursorDot || !cursorRing) return;

    let isVisible = false;

    // Instant zero-lag tracking: update dot and ring directly on mousemove
    window.addEventListener("mousemove", (e) => {
        const x = e.clientX;
        const y = e.clientY;

        cursorDot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        cursorRing.style.transform = `translate3d(${x}px, ${y}px, 0)`;

        if (!isVisible) {
            cursorDot.style.opacity = "1";
            cursorRing.style.opacity = "1";
            isVisible = true;
        }
    }, { passive: true });

    window.addEventListener("mouseleave", () => {
        cursorDot.style.opacity = "0";
        cursorRing.style.opacity = "0";
        isVisible = false;
    });

    window.addEventListener("mouseenter", () => {
        cursorDot.style.opacity = "1";
        cursorRing.style.opacity = "1";
        isVisible = true;
    });

    window.addEventListener("mousedown", () => {
        cursorDot.classList.add("cursor-active");
        cursorRing.classList.add("cursor-active");
    });

    window.addEventListener("mouseup", () => {
        cursorDot.classList.remove("cursor-active");
        cursorRing.classList.remove("cursor-active");
    });

    const interactiveSelector = "button, a, .tool-card, .example-chip, .workspace-tab-btn, .history-filter-btn, .qr-dropzone, .form-action-link, .clear-button, .report-action-btn";
    const textInputSelector = "input, textarea, select";

    document.addEventListener("mouseover", (e) => {
        if (!e.target || !e.target.closest) return;
        if (e.target.closest(textInputSelector)) {
            // Keep text inputs clean with native I-beam cursor
            cursorDot.style.opacity = "0";
            cursorRing.style.opacity = "0";
        } else if (e.target.closest(interactiveSelector)) {
            cursorDot.classList.add("cursor-hover");
            cursorRing.classList.add("cursor-hover");
        }
    });

    document.addEventListener("mouseout", (e) => {
        if (!e.target || !e.target.closest) return;
        if (e.target.closest(textInputSelector)) {
            if (isVisible) {
                cursorDot.style.opacity = "1";
                cursorRing.style.opacity = "1";
            }
        } else if (e.target.closest(interactiveSelector)) {
            cursorDot.classList.remove("cursor-hover");
            cursorRing.classList.remove("cursor-hover");
        }
    });
}

function initLiveInteractions() {
    initCyberBackground();
    initCustomCursor();
    initScrollReveal();
    initScrollParallax();
    initCardTiltPhysics();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLiveInteractions);
} else {
    initLiveInteractions();
}

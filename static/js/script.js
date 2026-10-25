const toolCards = document.querySelectorAll(".tool-card");

const messageForm = document.getElementById("messageForm");
const emailForm = document.getElementById("emailForm");
const phoneForm = document.getElementById("phoneForm");
const qrForm = document.getElementById("qrForm");

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
    },

    qr: {
        label: "QR CODE & QUISHING SCANNER",
        title: "Verify a QR Code",
        description: "Scan with camera, upload an image, or paste decoded links to detect phishing & fraud.",
        symbol: "⚅"
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
        if (qrForm) qrForm.classList.toggle("hidden", selectedTool !== "qr");

        if (selectedTool !== "qr" && typeof stopCameraScanner === "function") {
            stopCameraScanner();
        }

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
        : "<li>No phone threat factors detected.</li>";

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

            <h3>${escapeHTML(data.category || "Phone threat analysis")}</h3>

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
                ${renderMetric("SPOOFING RISK", "HIGH on unexpected calls")}
            </div>

            ${renderNotice(
                "Zero-Trust Phone Assessment: Technical carrier routing validates line existence, but cannot verify who holds the receiver. Always practice zero-trust."
            )}

        </div>
    `);
}




/* ------------------------------------------
   QR CODE & QUISHING VERIFIER
------------------------------------------ */

let currentQrMode = "camera";
let html5QrCodeScanner = null;
let isCameraActive = false;

// Sub-mode tab switcher (Camera / File / Paste)
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

// QR Example chips
document.querySelectorAll(".qr-example-chip").forEach(chip => {
    chip.addEventListener("click", () => {
        const example = chip.dataset.example;
        // Switch to paste tab
        const pasteBtn = document.querySelector('.qr-tab-btn[data-mode="paste"]');
        if (pasteBtn) pasteBtn.click();

        if (qrTextInput) {
            qrTextInput.value = example;
            qrTextInput.focus();
        }
        submitQrPayload(example, "example");
    });
});

// Camera Scanner Controls
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
                // scanning frame error (ignore)
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

// File Upload Scanner
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

async function handleQrImageFile(file) {
    if (!file || !file.type.startsWith("image/")) {
        showError("Please upload a valid image file (PNG, JPG, WebP).");
        return;
    }

    // Show thumbnail
    const reader = new FileReader();
    reader.onload = e => {
        if (qrPreviewImg) qrPreviewImg.src = e.target.result;
        if (qrFileName) qrFileName.textContent = file.name;
        if (qrDropContent) hideElement(qrDropContent);
        if (qrFilePreview) showElement(qrFilePreview);
    };
    reader.readAsDataURL(file);

    // Decode QR code from file
    initQrScanner();
    if (!html5QrCodeScanner) {
        showError("QR reader not initialized. Try pasting the link.");
        return;
    }

    const button = startLoading(
        "Scanning QR image",
        "Reading and decoding QR code visual data...",
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

// Submit QR verification
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

// Render QR Security Report
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

    // UPI Payment Scam Alert Banner
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

    // Quishing Redirect Unmasking Box
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
                <button type="button" class="copy-btn" onclick="navigator.clipboard.writeText(this.previousElementSibling.textContent)">Copy</button>
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

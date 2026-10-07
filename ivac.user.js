// ==UserScript==
// @name         IVAC NORMAL+AUTOMATIC  AUTOMATIONLAST SCRIPT
// @namespace    ivac-helper
// @version      2.3
// @description  IVAC automation
// @match        https://appointment.ivacbd.com/*
// @updateURL    https://raw.githubusercontent.com/newchecksk2-lgtm/ivac-tampermonkey/main/ivac.user.js
// @downloadURL  https://raw.githubusercontent.com/newchecksk2-lgtm/ivac-tampermonkey/main/ivac.user.js
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';
console.log("AUTO UPDATE TEST 2.3");
    // ==========================================
    // ACCOUNT
    // ==========================================
    const MOBILE = "01789585852";
    const PASSWORD = "Saykot1122@#";

    // ==========================================
    // IVAC LOCATION
    // ==========================================
    let IVAC_LOCATION =
        localStorage.getItem("IVAC_LOCATION") || "Dhaka";

    // Supported:
    // "Dhaka"
    // "Rajshahi"

    let turnstileToken = null;
    let turnstileWidgetId = null;
// ==========================================
// SAFE TURNSTILE TOKEN POOL
// ==========================================
const captchaPool = {
    tokens: [],
    maxSize: 5
};

function updateCaptchaPoolUI() {

    const indicator =
        document.getElementById(
            "captchaPoolIndicator"
        );

    if (!indicator) {
        return;
    }

    indicator.textContent =
        `CAPTCHA Pool: ${captchaPool.tokens.length}/${captchaPool.maxSize}`;
}


// ==========================================
// ADD TOKEN TO POOL
// ==========================================
function saveCaptchaToPool(token) {

    if (!token) {
        console.warn(
            "⚠️ Empty CAPTCHA token received"
        );
        return;
    }

    console.log(
        "🛡️ New Turnstile token received"
    );

    console.log(
        "🛡️ Pool BEFORE:",
        captchaPool.tokens.length
    );

    // Prevent duplicate token
    const duplicate =
        captchaPool.tokens.some(
            item => item.token === token
        );

    if (duplicate) {

        console.warn(
            "⚠️ Duplicate CAPTCHA token ignored"
        );

        return;
    }

    // If pool is full, remove oldest token
// POOL MUST PRESERVE MAX 5 TOKENS
if (captchaPool.tokens.length >= captchaPool.maxSize) {
    console.log("🛡️ CAPTCHA pool FULL — keeping existing 5 tokens");
    updateCaptchaPoolUI();
    return;
}

captchaPool.tokens.push({
    token: token,
    createdAt: Date.now()
});

    updateCaptchaPoolUI();

    console.log(
        `✅ CAPTCHA stored. Pool AFTER: ${captchaPool.tokens.length}/${captchaPool.maxSize}`
    );
}


// ==========================================
// TAKE ONE TOKEN
// ==========================================
function getCaptchaFromPool() {

    if (
        captchaPool.tokens.length === 0
    ) {

        updateCaptchaPoolUI();

        console.warn(
            "⚠️ CAPTCHA pool is EMPTY"
        );

        return null;
    }

    const item =
        captchaPool.tokens.shift();

    updateCaptchaPoolUI();

    console.log(
        `🛡️ CAPTCHA token consumed. Remaining: ${captchaPool.tokens.length}/${captchaPool.maxSize}`
    );

    return item.token;
}


// ==========================================
// CLEAR POOL
// ==========================================
function clearCaptchaPool() {

    console.warn(
        "🧹 CAPTCHA POOL CLEARED"
    );

    console.trace(
        "Pool clear source:"
    );

    captchaPool.tokens.length = 0;

    updateCaptchaPoolUI();
}
    // ==========================================
    // ACCESS TOKEN
    // ==========================================
    const ACCESS_TOKEN_KEY = "auth-storage";

    // ==========================================
    // AUTO STATE
    // ==========================================
    let AUTO_MODE =
        localStorage.getItem("IVAC_AUTO_MODE") === "1";
    let AUTO_REDIRECT_TIME_SLOT =
    localStorage.getItem("IVAC_AUTO_REDIRECT") !== "0";

    let appointmentClicked = false;
    let loginTyped = false;
    let otpVerifyClicked = false;
    let otpRedirectDone = false;
    let payClicked = false;

    // ==========================================
    // DATE SWITCH
    // ==========================================
    let AUTO_DATE_SWITCH = true;
    let dateSwitchIndex = 0;
    let dateSwitchBusy = false;
    let captchaWaiting = false;
    // ==========================================
    // FULL AUTO APPOINTMENT FLOW
    // ==========================================
    let AUTO_FULL_FLOW = true;

    let appointmentFlowBusy = false;
    let uploadFlowBusy = false;
    let bookingConfigFlowBusy = false;

    let appointmentSuccess = false;
    let primaryUploadSuccess = false;
    let secondaryUploadSuccess = false;
    let bookingConfigSuccess = false;

    const MAX_APPOINTMENT_RETRIES = 5;
    const MAX_UPLOAD_RETRIES = 5;

    let appointmentRetryCount = 0;
    // ==========================================
    // RETRY
    // ==========================================
    let retryTimer = null;
    let retryCountdownTimer = null;
    let retryRemaining = 0;

    // ==========================================
    // HELPERS
    // ==========================================
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ==========================================
    // TURNSTILE
    // ==========================================
    function loadTurnstile() {
        return new Promise((resolve, reject) => {

            if (window.turnstile) {
                resolve();
                return;
            }

            const script = document.createElement("script");

            script.src =
                "https://challenges.cloudflare.com/turnstile/v0/api.js";

            script.async = true;
            script.defer = true;

            script.onload = resolve;
            script.onerror = reject;

            document.head.appendChild(script);
        });
    }

    async function createTurnstileWidget() {
        try {

            await loadTurnstile();

            const container =
                document.getElementById("turnstileWidget");

            if (!container || !window.turnstile) {
                return;
            }

            if (turnstileWidgetId !== null) {
                return;
            }

            turnstileWidgetId =
                turnstile.render(container, {

                    sitekey:
                        "0x4AAAAAACghKkJHL1t7UkuZ",

                    callback: function(token) {
    turnstileToken = token;

    // Also keep a copy in the local pool
    saveCaptchaToPool(token);

    console.log("🛡️ Turnstile token added to pool");


                        const status =
                            document.getElementById(
                                "turnstileStatus"
                            );

                        if (status) {
                            status.innerText =
                                "✓ Verification completed";

                            status.style.color =
                                "#20e58a";
                        }

                        console.log(
                            "Turnstile verification completed"
                        );
                    },

                    "expired-callback": function () {

                        turnstileToken = null;

                        const status =
                            document.getElementById(
                                "turnstileStatus"
                            );

                        if (status) {
                            status.innerText =
                                "Verification expired";

                            status.style.color =
                                "#8fa8c4";
                        }
                    },

                    "error-callback": function () {

                        turnstileToken = null;

                        const status =
                            document.getElementById(
                                "turnstileStatus"
                            );

                        if (status) {
                            status.innerText =
                                "Turnstile error";

                            status.style.color =
                                "#ff5969";
                        }
                    }
                });

        } catch (error) {

            console.error(
                "Turnstile initialization failed:",
                error
            );
        }
    }

    // ==========================================
    // ACCESS TOKEN
    // ==========================================
    function getAccessToken() {

        const raw =
            localStorage.getItem(ACCESS_TOKEN_KEY) ||
            sessionStorage.getItem(ACCESS_TOKEN_KEY);

        if (!raw) {
            throw new Error(
                "auth-storage not found"
            );
        }

        try {

            const authData =
                JSON.parse(raw);

            const token =
                authData?.state?.token;

            if (!token) {
                throw new Error(
                    "Token not found inside auth-storage"
                );
            }

            return token
                .replace(/^Bearer\s+/i, "")
                .trim();

        } catch (error) {

            console.error(
                "Failed to read auth-storage:",
                error
            );

            throw new Error(
                "Could not read access token from auth-storage"
            );
        }
    }

 // ==========================================
// FILE UPLOAD
// ==========================================
async function uploadIVACFile(
    file,
    isPrimary = false
) {

    if (!file) {
        throw new Error(
            "No file selected."
        );
    }

// ======================================
// TAKE ONE TOKEN FROM CAPTCHA POOL
// ======================================
const tokenForThisUpload =
    getCaptchaFromPool();

if (!tokenForThisUpload) {
    throw new Error(
        "CAPTCHA pool is empty. Complete a new CAPTCHA."
    );
}

    try {

        const accessToken =
            getAccessToken();

        if (!accessToken) {
            throw new Error(
                "Authorization token not found."
            );
        }

        const formData =
            new FormData();

        formData.append(
            "files",
            file
        );

        formData.append(
            "isPrimary",
            isPrimary ? "true" : "false"
        );

        const response =
            await fetch(
                "https://api.ivacbd.com/iams/api/v1/file/upload-file-v453",
                {
                    method: "POST",

                    headers: {
                        "Authorization":
                            `Bearer ${accessToken}`,

                        "x-token":
                            tokenForThisUpload,

                        "x-sec-runtime-state":
                            "v1.5a4c8831.9a53.47ed.b579.042a2c0cee5a"
                    },

                    body: formData
                }
            );

        let data = null;

        try {

            data =
                await response.json();

        } catch (error) {

            throw new Error(
                `Invalid server response (${response.status})`
            );
        }

        if (!response.ok) {

            throw new Error(
                data?.message ||
                data?.error ||
                `Upload failed (${response.status})`
            );
        }

        if (data?.successFlag === false) {

            throw new Error(
                data?.message ||
                data?.error ||
                "Server rejected the upload."
            );
        }

        return data;

    }
        finally {

    // ======================================
    // DO NOT AUTO-RESET TURNSTILE
    // ======================================
    // The token was already consumed from
    // the local CAPTCHA pool.
    //
    // Remaining pool tokens stay available.
    // CAPTCHA reset is manual only.
    // ======================================

    turnstileToken = null;

    updateCaptchaPoolUI();

    const status =
        document.getElementById(
            "turnstileStatus"
        );

    if (status) {

        if (captchaPool.tokens.length > 0) {

            status.innerText =
                `✓ ${captchaPool.tokens.length} CAPTCHA token(s) ready`;

            status.style.color =
                "#20e58a";

        } else {

            status.innerText =
                "CAPTCHA pool empty";

            status.style.color =
                "#ffd166";
        }
    }

    console.log(
        `🛡️ CAPTCHA remains untouched. Pool: ${captchaPool.tokens.length}/${captchaPool.maxSize}`
    );
}
}   // <-- ADD THIS ONE
    // ==========================================
    // LOCATION CONFIG
    // ==========================================
    const IVAC_LOCATIONS = {

        Dhaka: {
            mission: "Dhaka",
            ivacCenter: "IVAC, Dhaka (JFP)"
        },

        Rajshahi: {
            mission: "Rajshahi",
            ivacCenter: "IVAC, RAJSHAHI"
        }
    };

    function getCurrentLocationConfig() {

        const config =
            IVAC_LOCATIONS[IVAC_LOCATION];

        if (!config) {

            throw new Error(
                "Invalid IVAC_LOCATION: " +
                IVAC_LOCATION
            );
        }

        return config;
    }

    // ==========================================
    // SEND BOOKING CONFIG
    // ==========================================
    async function sendAppointmentBookingConfig() {

        try {

            const accessToken =
                getAccessToken();

            const payload =
                getCurrentLocationConfig();

            console.log(
                "📍 Current IVAC:",
                IVAC_LOCATION
            );

            console.log(
                "📤 Booking Config:",
                payload
            );

            const response =
                await fetch(
                    "https://api.ivacbd.com/iams/api/v1/appointment/appointment-booking-config",
                    {
                        method: "POST",

                        headers: {
                            "Authorization":
                                "Bearer " + accessToken,

                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(payload)
                    }
                );

            const text =
                await response.text();

            console.log(
                "📡 Booking Config Status:",
                response.status
            );

            console.log(
                "📥 Booking Config Response:",
                text
            );

            if (!response.ok) {
    throw new Error(
        `Booking Config failed (${response.status})`
    );
}

return {
    status: response.status,
    response: text
};

        } catch (error) {

            console.error(
                "❌ Booking Config Error:",
                error
            );

            throw error;
        }
    }

    // ==========================================
    // APPOINTMENT API
    // ==========================================
    async function sendAppointmentRequest() {

        try {

            const accessToken =
                getAccessToken();

            console.log(
                "🚀 Sending appointment request..."
            );

            const response =
                await fetch(
                    "https://api.ivacbd.com/iams/api/v1/appointment",
                    {
                        method: "POST",

                        headers: {
                            "Authorization":
                                "Bearer " + accessToken
                        }
                    }
                );

            const text =
                await response.text();

            console.log(
                "📡 Appointment API status:",
                response.status
            );

            console.log(
                "📥 Appointment API response:",
                text
            );

            const status =
                document.getElementById(
                    "appointmentApiStatus"
                );

            if (status) {

                if (response.ok) {

                    status.innerText =
                        "✅ Sent (" +
                        response.status +
                        ")";

                    status.style.color =
                        "#20e58a";

                } else {

                    status.innerText =
                        "❌ Failed (" +
                        response.status +
                        ")";

                    status.style.color =
                        "#ff5969";
                }
            }

            return {
                status: response.status,
                response: text
            };

        } catch (error) {

            console.error(
                "❌ Appointment request error:",
                error
            );

            const status =
                document.getElementById(
                    "appointmentApiStatus"
                );

            if (status) {

                status.innerText =
                    "❌ " + error.message;

                status.style.color =
                    "#ff5969";
            }

            throw error;
        }
    }

    // ==========================================
    // CLOSE NOTICES
    // ==========================================
    function closeNotices() {

        document
            .querySelector(
                'button[aria-label="Close notice"]'
            )
            ?.click();

        document
            .querySelector(
                'button[aria-label="Close popup"]'
            )
            ?.click();
    }

    // ==========================================
    // TAKE APPOINTMENT
    // ==========================================
    // ==========================================
    // TAKE APPOINTMENT
    // ==========================================
    async function clickAppointmentWithRetry() {

        if (appointmentFlowBusy) {
            return false;
        }

        appointmentFlowBusy = true;

        try {

            for (
                let attempt = 1;
                attempt <= MAX_APPOINTMENT_RETRIES;
                attempt++
            ) {

                if (!AUTO_MODE) {
                    return false;
                }

                // Already successful
                if (appointmentSuccess) {
                    return true;
                }

                const btn =
                    [
                        ...document.querySelectorAll(
                            "button,a"
                        )
                    ].find(el =>
                        el.textContent?.trim().includes(
                            "Take Your Appointment"
                        )
                    );

                if (!btn) {

                    console.log(
                        `⏳ Appointment button not available yet (${attempt}/${MAX_APPOINTMENT_RETRIES})`
                    );

                    await sleep(1000);
                    continue;
                }

                if (btn.disabled) {

                    console.log(
                        `⏳ Appointment button disabled (${attempt}/${MAX_APPOINTMENT_RETRIES})`
                    );

                    await sleep(1000);
                    continue;
                }

                console.log(
                    `🚀 Take Your Appointment attempt ${attempt}/${MAX_APPOINTMENT_RETRIES}`
                );

                btn.click();

                await sleep(1500);

                /*
                 * Check whether the click actually moved
                 * the application forward.
                 */

                const stillThere =
                    [
                        ...document.querySelectorAll(
                            "button,a"
                        )
                    ].some(el =>
                        el.textContent?.trim().includes(
                            "Take Your Appointment"
                        )
                    );

                /*
                 * If the button disappeared or the page
                 * changed, consider Appointment successful.
                 */

                if (
                    !stillThere ||
                    location.pathname !== "/"
                ) {

                    appointmentSuccess = true;

                    console.log(
                        "✅ Appointment step SUCCESS"
                    );

                    return true;
                }

                console.warn(
                    `⚠️ Appointment attempt ${attempt} failed`
                );

                await sleep(1000);
            }

            console.error(
                "❌ Appointment failed after all retries"
            );

            return false;

        } finally {

            appointmentFlowBusy = false;
        }
    }
    // ==========================================
    // HUMAN TYPING
    // ==========================================
    async function typeHuman(
        el,
        text
    ) {

        const setter =
            Object.getOwnPropertyDescriptor(
                HTMLInputElement.prototype,
                "value"
            ).set;

        el.focus();

        setter.call(
            el,
            ""
        );

        el.dispatchEvent(
            new Event(
                "input",
                { bubbles: true }
            )
        );

        for (const char of text) {

            setter.call(
                el,
                el.value + char
            );

            el.dispatchEvent(
                new Event(
                    "input",
                    { bubbles: true }
                )
            );

            await sleep(
                80 +
                Math.random() * 120
            );
        }
    }

    // ==========================================
    // LOGIN AUTO FILL
    // ==========================================
    async function fillLogin() {

        if (loginTyped) {
            return;
        }

        const mobile =
            document.querySelector(
                'input[name="phone"]'
            );

        const pass =
            document.querySelector(
                'input[name="password"]'
            );

        if (mobile && pass) {

            loginTyped = true;

            console.log(
                "⌨️ Typing mobile..."
            );

            await typeHuman(
                mobile,
                MOBILE
            );

            await sleep(400);

            console.log(
                "⌨️ Typing password..."
            );

            await typeHuman(
                pass,
                PASSWORD
            );

            console.log(
                "⏳ Waiting for Sign In"
            );
        }
    }

 // ==========================================
// OTP VERIFY
// ==========================================
let otpVerifyTimer = null;

function autoVerifyOTP() {

    // Find Verify OTP button
    const verifyBtn = [
        ...document.querySelectorAll("button")
    ].find(b =>
        b.innerText.trim().includes("Verify OTP")
    );

    if (!verifyBtn) {
        return;
    }

    // Find text inputs
    const otpInputs = document.querySelectorAll(
        'input[type="text"]'
    );

    // Need at least 6 OTP inputs
    if (otpInputs.length < 6) {
        return;
    }

    // Check all 6 OTP boxes are filled
    const otpComplete = [...otpInputs]
        .slice(0, 6)
        .every(input =>
            input.value.trim() !== ""
        );

    if (!otpComplete) {
        // If OTP becomes incomplete, allow a new timer
        if (otpVerifyTimer) {
            clearTimeout(otpVerifyTimer);
            otpVerifyTimer = null;
        }
        return;
    }

    // Already clicked
    if (otpVerifyClicked) {
        return;
    }

    // Already waiting for click
    if (otpVerifyTimer) {
        return;
    }

    console.log(
        "✅ 6-digit OTP detected — waiting 3–4 seconds..."
    );

    // Random delay between 3 and 4 seconds
    const delay =
        3000 +
        Math.floor(Math.random() * 1000);

    otpVerifyTimer = setTimeout(() => {

        otpVerifyTimer = null;

        // Check button again before clicking
        if (
            otpVerifyClicked ||
            verifyBtn.disabled
        ) {
            return;
        }

        // Make sure OTP is still complete
        const currentOtpInputs =
            document.querySelectorAll(
                'input[type="text"]'
            );

        if (currentOtpInputs.length < 6) {
            return;
        }

        const stillComplete =
            [...currentOtpInputs]
                .slice(0, 6)
                .every(input =>
                    input.value.trim() !== ""
                );

        if (!stillComplete) {
            return;
        }

        // Click Verify OTP
        otpVerifyClicked = true;

        verifyBtn.click();

        console.log(
            "✅ Verify OTP clicked after 3–4 seconds"
        );

    }, delay);
}
    // ==========================================
    // CONTINUE BOOKING
    // ==========================================
    function autoContinueBooking() {

        const continueBtn =
            [
                ...document.querySelectorAll(
                    "button"
                )
            ].find(b =>
                b.innerText.includes(
                    "Continue Booking"
                )
            );

        if (!continueBtn) {
            return;
        }

        if (
            continueBtn.dataset.clicked === "1"
        ) {
            return;
        }

        const success =
            document.body.innerText.includes(
                "Success!"
            ) ||
            document.body.innerText.includes(
                "Captcha verified"
            ) ||
            !continueBtn.disabled;

        if (success) {

            continueBtn.dataset.clicked =
                "1";

            continueBtn.click();

            console.log(
                "🚀 Continue Booking clicked"
            );
        }
    }

    // ==========================================
    // CONTINUE PAYMENT
    // ==========================================
    function autoContinuePayment() {

        const payBtn =
            [
                ...document.querySelectorAll(
                    "button,a"
                )
            ].find(b =>
                b.innerText.includes(
                    "Continue Payment"
                )
            );

        if (!payBtn) {
            return;
        }

        if (payClicked) {
            return;
        }

        if (!payBtn.disabled) {

            payClicked = true;

            payBtn.click();

            console.log(
                "💳 Continue Payment clicked"
            );
        }
    }

    // ==========================================
    // FIND AVAILABLE DATES
    // ==========================================
    function getAvailableDateButtons() {

        const buttons =
            [
                ...document.querySelectorAll(
                    "button"
                )
            ];

        return buttons.filter(btn => {

            const text =
                btn.innerText.trim();

            if (
                !/^\d{1,2}$/.test(text)
            ) {
                return false;
            }

            const day =
                Number(text);

            if (
                day < 1 ||
                day > 31
            ) {
                return false;
            }

            if (btn.disabled) {
                return false;
            }

            if (
                btn.getAttribute(
                    "aria-disabled"
                ) === "true"
            ) {
                return false;
            }

            const style =
                window.getComputedStyle(btn);

            if (
                style.display === "none" ||
                style.visibility === "hidden"
            ) {
                return false;
            }

            return true;
        });
    }

    // ==========================================
    // SWITCH DATE
    // ==========================================
    async function switchAvailableDate() {

        if (!AUTO_DATE_SWITCH) {
            return;
        }

        if (dateSwitchBusy) {
            return;
        }

        if (
            !location.pathname.includes(
                "/appointment/time-slot"
            )
        ) {
            return;
        }

        const dates =
            getAvailableDateButtons();

        if (!dates.length) {
            return;
        }

        dateSwitchBusy = true;

        if (
            dateSwitchIndex >=
            dates.length
        ) {
            dateSwitchIndex = 0;
        }

        const dateButton =
            dates[dateSwitchIndex];

        console.log(
            "📅 Available date:",
            dateButton.innerText.trim()
        );

        dateButton.click();

        dateSwitchIndex++;

        if (
            dateSwitchIndex >=
            dates.length
        ) {
            dateSwitchIndex = 0;
        }

        await sleep(500);

        dateSwitchBusy = false;
    }

    // ==========================================
    // CREATE PANEL
    // ==========================================
    function createRetryUI() {

        if (
            document.getElementById(
                "retryPanel"
            )
        ) {
            return;
        }

        const panel =
            document.createElement("div");

        panel.id = "retryPanel";

        panel.style.cssText = `
            position: fixed;
            top: 90px;
            right: 25px;
            width: 330px;
            background:
                linear-gradient(
                    145deg,
                    rgba(10,22,38,.98),
                    rgba(4,12,24,.98)
                );
            color: #fff;
            border: 1px solid rgba(255,102,0,.9);
            border-radius: 18px;
            padding: 0;
            z-index: 999999;
            font-family:
                Inter,
                Segoe UI,
                Arial,
                sans-serif;
            box-shadow:
                0 18px 60px rgba(0,0,0,.55),
                0 0 30px rgba(255,102,0,.12);
            overflow: hidden;
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
        `;

        panel.innerHTML = `

<style>

.ivacSection {
    margin-bottom: 7px;
    border: 1px solid rgba(120,160,200,.14);
    border-radius: 11px;
    background: rgba(18,32,48,.72);
    overflow: hidden;
}

.ivacSection summary {
    list-style: none;
    cursor: pointer;
    padding: 10px 11px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    font-weight: 750;
    color: #dcecff;
}

.ivacSection summary::-webkit-details-marker {
    display: none;
}

.ivacSection summary::after {
    content: "›";
    font-size: 18px;
    opacity: .65;
    transition: transform .15s ease;
}

.ivacSection[open] summary::after {
    transform: rotate(90deg);
}

.ivacSectionBody {
    padding: 0 9px 9px;
}

.ivacFileRow {
    padding: 8px;
    margin-top: 6px;
    border-radius: 9px;
    background: rgba(8,20,34,.65);
    border: 1px solid rgba(120,160,200,.10);
}

.ivacFileTitle {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 10px;
    margin-bottom: 6px;
    color: #d8e7f7;
}

.ivacFileTitle span {
    width: 22px;
    height: 22px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    background: rgba(80,130,190,.20);
    font-size: 9px;
    font-weight: 800;
}

.ivacFileInput {
    width: 100%;
    box-sizing: border-box;
    margin: 2px 0 9px;
    padding: 6px;
    border: 1px solid rgba(100,140,180,.22);
    border-radius: 8px;
    background: rgba(5,16,29,.85);
    color: #aebfd1;
    font-size: 10px;
    cursor: pointer;
}

.ivacFileInput::file-selector-button {
    border: 0;
    border-radius: 7px;
    padding: 7px 11px;
    margin-right: 9px;
    background: linear-gradient(
        135deg,
        #315b82,
        #244666
    );
    color: #fff;
    font-size: 10px;
    font-weight: 750;
    cursor: pointer;
}

.ivacFileActions {
    display: flex;
    align-items: center;
    gap: 7px;
}

.ivacUploadBtn {
    border: 0;
    border-radius: 6px;
    padding: 5px 9px;
    background: rgba(55,95,135,.75);
    color: white;
    font-size: 9px;
    font-weight: 750;
    cursor: pointer;
}

.ivacUploadBtn.primary {
    background: rgba(35,120,95,.9);
}

.ivacFileStatus {
    font-size: 9px;
    color: #91a5b9;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.ivacUploadAllBtn {
    width: 100%;
    margin-top: 8px;
    padding: 8px;
    border: 0;
    border-radius: 8px;
    background: rgba(190,105,35,.9);
    color: white;
    font-size: 10px;
    font-weight: 800;
    cursor: pointer;
}

#retryPanelBody {
    max-height: calc(100vh - 150px);
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 3px;
}

#retryPanelBody::-webkit-scrollbar {
    width: 4px;
}

#retryPanelBody::-webkit-scrollbar-thumb {
    background: rgba(150,170,190,.35);
    border-radius: 10px;
}

</style>

<!-- HEADER -->

<div
    id="retryHeader"
    style="
        position:relative;
        padding:18px 20px;
        background:
            linear-gradient(
                135deg,
                rgba(255,102,0,.98),
                rgba(255,72,0,.82) 45%,
                rgba(8,22,38,.96) 100%
            );
        cursor:move;
        user-select:none;
    "
>

<div
    style="
        display:flex;
        align-items:center;
        justify-content:space-between;
    "
>

<div
    style="
        display:flex;
        align-items:center;
        gap:12px;
    "
>

<div
    style="
        width:42px;
        height:42px;
        border-radius:12px;
        display:flex;
        align-items:center;
        justify-content:center;
        background:rgba(255,255,255,.16);
        border:1px solid rgba(255,255,255,.22);
        font-size:23px;
    "
>
⚡
</div>

<div>
<div
    style="
        font-size:18px;
        font-weight:800;
        letter-spacing:.2px;
    "
>
Retry Control
</div>

<div
    style="
        margin-top:3px;
        font-size:11px;
        opacity:.82;
    "
>
Appointment Automation
</div>

<div
    id="captchaPoolIndicator"
    style="
        margin-top:6px;
        font-size:10px;
        font-weight:700;
        color:rgba(255,255,255,.78);
    "
>
CAPTCHA Pool: 0/5
</div>

</div>

</div>

<div
    id="retryLiveIndicator"
    style="
        display:flex;
        align-items:center;
        gap:6px;
        padding:6px 9px;
        border-radius:20px;
        background:rgba(0,0,0,.18);
        font-size:10px;
        font-weight:700;
    "
>

<span
    id="retryLiveDot"
    style="
        width:8px;
        height:8px;
        border-radius:50%;
        background:#9ca3af;
    "
></span>

<span id="retryLiveText">
IDLE
</span>

<button
    id="retryMinimize"
    type="button"
    style="
        width:28px;
        height:28px;
        margin-left:6px;
        border:1px solid rgba(255,255,255,.2);
        border-radius:8px;
        background:rgba(0,0,0,.18);
        color:#fff;
        cursor:pointer;
        font-size:16px;
        font-weight:700;
    "
>
−
</button>

</div>

</div>

</div>

<!-- BODY -->

<div
    id="retryPanelBody"
    style="padding:16px;"
>

<!-- RETRY INTERVAL -->

<div
    style="
        padding:15px;
        border-radius:14px;
        background:rgba(20,38,60,.72);
        border:1px solid rgba(120,160,200,.13);
        margin-bottom:12px;
    "
>

<div
    style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        margin-bottom:10px;
    "
>

<div>

<div
    style="
        font-size:13px;
        font-weight:750;
    "
>
⏱ Retry Interval
</div>

<div
    style="
        margin-top:3px;
        font-size:10px;
        color:#8fa8c4;
    "
>
Time between each attempt
</div>

</div>

<div
    style="
        font-size:10px;
        color:#7189a5;
    "
>
SECONDS
</div>

</div>

<div
    style="
        display:flex;
        align-items:center;
        overflow:hidden;
        border:1px solid #29415d;
        border-radius:10px;
        background:#071424;
    "
>

<input
    id="retrySec"
    type="number"
    min="1"
    value="1"
    style="
        width:100%;
        box-sizing:border-box;
        background:transparent;
        color:#fff;
        border:none;
        outline:none;
        padding:11px 13px;
        font-size:18px;
        font-weight:700;
    "
>

<div
    style="
        padding:0 13px;
        color:#88a0bb;
        font-size:12px;
    "
>
sec
</div>

</div>

</div>

<!-- TURNSTILE -->

<div
    id="turnstileCard"
    style="
        padding:14px 15px;
        border-radius:14px;
        background:rgba(20,38,60,.72);
        border:1px solid rgba(120,160,200,.13);
        margin-bottom:12px;
    "
>

<div
    style="
        font-size:13px;
        font-weight:750;
        margin-bottom:10px;
    "
>
🛡️ Security Verification
</div>

<div id="turnstileWidget"></div>
<button
    id="refreshTurnstileBtn"
    type="button"
    style="
        width:100%;
        margin-top:10px;
        padding:9px;
        border:1px solid rgba(100,150,200,.25);
        border-radius:9px;
        background:rgba(45,75,105,.75);
        color:#fff;
        font-size:10px;
        font-weight:800;
        cursor:pointer;
    "
>
    🔄 REFRESH CAPTCHA
</button>
<div
    id="turnstileStatus"
    style="
        margin-top:8px;
        font-size:10px;
        color:#8fa8c4;
    "
>
Please complete verification
</div>

</div>

<!-- FILE UPLOADS -->

<details
    class="ivacSection"
    open
>

<summary>

<span>
📎 FILE UPLOADS
</span>

<span id="ivacUploadCount">
0/4
</span>

</summary>

<div class="ivacSectionBody">

${[1,2,3,4].map(i => `
<div class="ivacFileRow">

<div class="ivacFileTitle">

<span>
${String(i).padStart(2,"0")}
</span>

<b>
${i === 1 ? "Primary File" : "Supporting File"}
</b>

</div>

<input
    type="file"
    id="ivacFileInput${i}"
    class="ivacFileInput"
>

<div class="ivacFileActions">

<button
    type="button"
    id="ivacUploadBtn${i}"
    class="ivacUploadBtn ${i === 1 ? "primary" : ""}"
>
UPLOAD
</button>

<span
    id="ivacFileStatus${i}"
    class="ivacFileStatus"
>
Not selected
</span>

</div>

</div>
`).join("")}

<button
    type="button"
    id="ivacUploadAllBtn"
    class="ivacUploadAllBtn"
>
⬆ UPLOAD ALL
</button>

</div>

</details>

<!-- DATE SWITCH -->

<div
    id="dateSwitchCard"
    style="
        padding:14px 15px;
        border-radius:14px;
        background:rgba(10,48,42,.55);
        border:1px solid rgba(0,220,130,.38);
        margin-bottom:12px;
    "
>

<div
    style="
        display:flex;
        align-items:center;
        justify-content:space-between;
    "
>

<div
    style="
        display:flex;
        align-items:center;
        gap:11px;
    "
>

<div
    style="
        width:38px;
        height:38px;
        border-radius:11px;
        display:flex;
        align-items:center;
        justify-content:center;
        background:rgba(0,220,130,.12);
        font-size:19px;
    "
>
📅
</div>

<div>

<div
    style="
        font-size:13px;
        font-weight:750;
    "
>
Auto Switch Dates
</div>

<div
    style="
        margin-top:3px;
        font-size:10px;
        color:#83a99e;
    "
>
Cycle through available dates
</div>

</div>

</div>

<label
    style="
        position:relative;
        width:46px;
        height:25px;
        display:block;
    "
>

<input
    id="autoDateSwitch"
    type="checkbox"
    checked
    style="
        opacity:0;
        width:0;
        height:0;
    "
>

<span
    id="dateSwitchSlider"
    style="
        position:absolute;
        inset:0;
        border-radius:30px;
        background:#334155;
        cursor:pointer;
    "
>

<span
    id="dateSwitchKnob"
    style="
        position:absolute;
        width:19px;
        height:19px;
        left:3px;
        top:3px;
        border-radius:50%;
        background:#fff;
        transition:.25s;
    "
></span>

</span>

</label>

</div>

</div>

<!-- APPOINTMENT API -->

<div
    style="
        padding:14px 15px;
        border-radius:14px;
        background:rgba(20,38,60,.72);
        border:1px solid rgba(120,160,200,.13);
        margin-bottom:12px;
    "
>

<div
    style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        margin-bottom:10px;
    "
>

<div>

<div
    style="
        font-size:13px;
        font-weight:750;
    "
>
📡 Appointment API
</div>

<div
    style="
        margin-top:3px;
        font-size:10px;
        color:#8fa8c4;
    "
>
POST request • No payload
</div>

</div>

<span
    id="appointmentApiStatus"
    style="
        font-size:10px;
        color:#8fa8c4;
    "
>
READY
</span>

</div>

<button
    id="sendAppointmentBtn"
    type="button"
    style="
        width:100%;
        border:none;
        border-radius:10px;
        padding:11px;
        cursor:pointer;
        color:#fff;
        background:linear-gradient(
            135deg,
            #087cff,
            #0754d8
        );
        font-weight:800;
        font-size:12px;
    "
>
🚀 SEND APPOINTMENT
</button>

</div>

<!-- BOOKING CONFIG -->

<div
    style="
        padding:14px 15px;
        border-radius:14px;
        background:rgba(20,38,60,.72);
        border:1px solid rgba(120,160,200,.13);
        margin-bottom:12px;
    "
>

<div
    style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        margin-bottom:10px;
    "
>

<div>

<div
    style="
        font-size:13px;
        font-weight:750;
    "
>
⚙️ Booking Config
</div>

<select
    id="ivacLocationSelect"
    style="
        width:100%;
        margin-top:8px;
        padding:8px 10px;
        background:#1f2937;
        color:#fff;
        border:1px solid #4b5563;
        border-radius:6px;
        font-size:13px;
        outline:none;
    "
>

<option value="Dhaka">
Dhaka
</option>

<option value="Rajshahi">
Rajshahi
</option>

</select>

<!-- AUTO REDIRECT TO TIME-SLOT -->
<div
    style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        margin-top:12px;
        padding:10px 11px;
        border-radius:9px;
        background:rgba(8,20,34,.65);
        border:1px solid rgba(120,160,200,.10);
    "
>

<div>
    <div
        style="
            font-size:11px;
            font-weight:750;
            color:#dcecff;
        "
    >
        ↪ Auto Redirect to Time-Slot
    </div>

    <div
        id="autoRedirectStatus"
        style="
            margin-top:3px;
            font-size:9px;
            color:#8fa8c4;
        "
    >
        ON
    </div>
</div>

<label
    style="
        position:relative;
        width:42px;
        height:23px;
        display:block;
    "
>
    <input
        id="autoRedirectTimeSlot"
        type="checkbox"
        style="
            opacity:0;
            width:0;
            height:0;
        "
    >

    <span
        id="autoRedirectSlider"
        style="
            position:absolute;
            inset:0;
            border-radius:30px;
            background:#18d982;
            cursor:pointer;
            transition:.2s;
        "
    >
        <span
            id="autoRedirectKnob"
            style="
                position:absolute;
                width:17px;
                height:17px;
                left:22px;
                top:3px;
                border-radius:50%;
                background:#fff;
                transition:.2s;
            "
        ></span>
    </span>
</label>

</div>

</div>

<span
    id="bookingConfigStatus"
    style="
        font-size:10px;
        color:#8fa8c4;
    "
>
READY
</span>

</div>

<button
    id="sendBookingConfigBtn"
    type="button"
    style="
        width:100%;
        border:none;
        border-radius:10px;
        padding:11px;
        cursor:pointer;
        color:#fff;
        background:linear-gradient(
            135deg,
            #8b5cf6,
            #6d28d9
        );
        font-weight:800;
        font-size:12px;
    "
>
⚙️ SEND BOOKING CONFIG
</button>

</div>

<!-- CONTROLS -->

<div
    style="
        display:grid;
        grid-template-columns:1fr 1fr 1fr;
        gap:8px;
        margin-bottom:12px;
    "
>

<button
    id="startAuto"
    style="
        border:none;
        border-radius:11px;
        padding:11px 5px;
        cursor:pointer;
        color:#fff;
        background:linear-gradient(
            135deg,
            #087cff,
            #0754d8
        );
        font-weight:800;
        font-size:11px;
    "
>
▶ AUTO
</button>

<button
    id="startRetry"
    style="
        border:none;
        border-radius:11px;
        padding:11px 5px;
        cursor:pointer;
        color:#fff;
        background:linear-gradient(
            135deg,
            #14c878,
            #079451
        );
        font-weight:800;
        font-size:11px;
    "
>
▶ START
</button>

<button
    id="stopRetry"
    style="
        border:none;
        border-radius:11px;
        padding:11px 5px;
        cursor:pointer;
        color:#fff;
        background:linear-gradient(
            135deg,
            #f04455,
            #c91e35
        );
        font-weight:800;
        font-size:11px;
    "
>
■ STOP
</button>

</div>

<!-- STATUS -->

<div
    style="
        padding:15px;
        border-radius:14px;
        background:rgba(20,38,60,.72);
        border:1px solid rgba(120,160,200,.13);
    "
>

<div
    style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        margin-bottom:10px;
    "
>

<div
    style="
        display:flex;
        align-items:center;
        gap:9px;
    "
>

<span
    id="statusDot"
    style="
        width:10px;
        height:10px;
        border-radius:50%;
        background:#94a3b8;
        display:inline-block;
    "
></span>

<span
    style="
        font-size:12px;
        color:#9bb0c7;
    "
>
STATUS
</span>

</div>

<strong
    id="retryStatus"
    style="
        font-size:12px;
        color:#cbd5e1;
    "
>
OFF
</strong>

</div>

<div
    style="
        display:flex;
        align-items:center;
        justify-content:space-between;
    "
>

<div>

<div
    style="
        color:#8fa8c4;
        font-size:10px;
    "
>
NEXT RETRY
</div>

<div
    id="retryCountdown"
    style="
        margin-top:2px;
        font-size:22px;
        font-weight:800;
        color:#20e58a;
    "
>
--
<span
    style="
        font-size:11px;
        font-weight:600;
        color:#7790aa;
    "
>
sec
</span>
</div>

</div>

<div
    style="
        font-size:25px;
        opacity:.7;
    "
>
◷
</div>

</div>

<div
    style="
        height:5px;
        margin-top:13px;
        border-radius:10px;
        overflow:hidden;
        background:#1b3048;
    "
>

<div
    id="retryProgress"
    style="
        height:100%;
        width:0%;
        border-radius:10px;
        background:linear-gradient(
            90deg,
            #16d982,
            #20e58a
        );
    "
></div>

</div>

</div>

<div
    style="
        margin-top:11px;
        padding:9px 4px 2px;
        text-align:center;
        color:#627b96;
        font-size:9px;
    "
>
⚡ Automation ready • Drag header to move
</div>

</div>
`;

        document.body.appendChild(panel);

        createTurnstileWidget();

        setupUploadSystem();
        setupPanelEvents();
        setupLocationSelector();
        setupDateSwitch();
        setupDragging();

        if (AUTO_MODE) {
            updateRetryPanelStatus("RUNNING");
        }
    }
// ==========================================
// PERSISTENT FILE STORAGE
// Uses IndexedDB because localStorage cannot
// store File objects.
// ==========================================

const FILE_DB_NAME = "IVAC_Retry_File_DB";
const FILE_STORE_NAME = "files";
const FILE_DB_VERSION = 1;

function openFileDB() {
    return new Promise((resolve, reject) => {

        const request = indexedDB.open(
            FILE_DB_NAME,
            FILE_DB_VERSION
        );

        request.onupgradeneeded = function (event) {

            const db = event.target.result;

            if (!db.objectStoreNames.contains(FILE_STORE_NAME)) {
                db.createObjectStore(
                    FILE_STORE_NAME
                );
            }
        };

        request.onsuccess = function () {
            resolve(request.result);
        };

        request.onerror = function () {
            reject(request.error);
        };
    });
}


// ==========================================
// SAVE FILE
// ==========================================

async function savePersistentFile(index, file) {

    if (!file) {
        return;
    }

    try {

        const db =
            await openFileDB();

        const transaction =
            db.transaction(
                FILE_STORE_NAME,
                "readwrite"
            );

        const store =
            transaction.objectStore(
                FILE_STORE_NAME
            );

        store.put(
            {
                file: file,
                name: file.name,
                type: file.type,
                size: file.size,
                lastModified: file.lastModified,
                savedAt: Date.now()
            },
            `file_${index}`
        );

        await new Promise((resolve, reject) => {

            transaction.oncomplete =
                resolve;

            transaction.onerror =
                () => reject(
                    transaction.error
                );
        });

        db.close();

        console.log(
            `💾 File ${index} saved:`,
            file.name
        );

    } catch (error) {

        console.error(
            `Failed to save file ${index}:`,
            error
        );
    }
}


// ==========================================
// LOAD FILE
// ==========================================

async function loadPersistentFile(index) {

    try {

        const db =
            await openFileDB();

        const transaction =
            db.transaction(
                FILE_STORE_NAME,
                "readonly"
            );

        const store =
            transaction.objectStore(
                FILE_STORE_NAME
            );

        const request =
            store.get(
                `file_${index}`
            );

        const result =
            await new Promise((resolve, reject) => {

                request.onsuccess =
                    () => resolve(
                        request.result
                    );

                request.onerror =
                    () => reject(
                        request.error
                    );
            });

        db.close();

        return result || null;

    } catch (error) {

        console.error(
            `Failed to load file ${index}:`,
            error
        );

        return null;
    }
}


// ==========================================
// RESTORE FILE INTO INPUT
// ==========================================

async function restorePersistentFile(
    index,
    input,
    status
) {

    if (!input) {
        return false;
    }

    const saved =
        await loadPersistentFile(index);

    if (!saved?.file) {
        return false;
    }

    try {

        const file =
            saved.file;

        const dataTransfer =
            new DataTransfer();

        dataTransfer.items.add(
            file
        );

        input.files =
            dataTransfer.files;

        if (status) {

            status.textContent =
                file.name;

            status.dataset.uploaded =
                "0";
        }

        console.log(
            `♻️ Restored File ${index}:`,
            file.name
        );

        return true;

    } catch (error) {

        console.error(
            `Failed to restore file ${index}:`,
            error
        );

        return false;
    }
}


// ==========================================
// DELETE SAVED FILE
// ==========================================

async function deletePersistentFile(index) {

    try {

        const db =
            await openFileDB();

        const transaction =
            db.transaction(
                FILE_STORE_NAME,
                "readwrite"
            );

        transaction
            .objectStore(FILE_STORE_NAME)
            .delete(
                `file_${index}`
            );

        await new Promise((resolve, reject) => {

            transaction.oncomplete =
                resolve;

            transaction.onerror =
                () => reject(
                    transaction.error
                );
        });

        db.close();

        console.log(
            `🗑️ Saved File ${index} deleted`
        );

    } catch (error) {

        console.error(
            `Failed to delete file ${index}:`,
            error
        );
    }
}
  // ==========================================
// UPLOAD SYSTEM
// ==========================================
async function setupUploadSystem() {

    const uploadRows =
        [1, 2, 3, 4].map(index => ({

            index,

            input:
                document.getElementById(
                    `ivacFileInput${index}`
                ),

            button:
                document.getElementById(
                    `ivacUploadBtn${index}`
                ),

            status:
                document.getElementById(
                    `ivacFileStatus${index}`
                )
        }));

    const uploadCount =
        document.getElementById(
            "ivacUploadCount"
        );

    const uploadAllBtn =
        document.getElementById(
            "ivacUploadAllBtn"
        );


    // ======================================
    // UPDATE UPLOAD COUNT
    // ======================================
    function updateUploadCount() {

        const uploaded =
            uploadRows.filter(row =>
                row.status?.dataset.uploaded === "1"
            ).length;

        if (uploadCount) {
            uploadCount.textContent =
                `${uploaded}/4`;
        }
    }


    // ======================================
    // WAIT FOR CAPTCHA
    //
    // IMPORTANT:
    // Works for BOTH:
    // 1. Manual Upload button
    // 2. Automatic Upload Flow
    //
    // If pool is empty:
    // automatically click REFRESH CAPTCHA
    // and wait for a new token.
    // ======================================
   async function waitForCaptchaForUpload() {

    // ======================================
    // TOKEN ALREADY AVAILABLE
    // ======================================

    if (captchaPool.tokens.length > 0) {
        return true;
    }

    // ======================================
    // SOMEONE ELSE IS ALREADY WAITING
    // ======================================

    if (captchaWaiting) {

        console.log(
            "🛡️ CAPTCHA wait already active — waiting..."
        );

        while (
            captchaWaiting &&
            captchaPool.tokens.length === 0
        ) {
            await sleep(500);
        }

        return captchaPool.tokens.length > 0;
    }

    // ======================================
    // START NEW CAPTCHA WAIT
    // ======================================

    captchaWaiting = true;

    try {

        console.log(
            "🛡️ CAPTCHA pool empty"
        );

        console.log(
            "🔄 Automatically clicking REFRESH CAPTCHA..."
        );

        const refreshBtn =
            document.getElementById(
                "refreshTurnstileBtn"
            );

        if (!refreshBtn) {

            console.warn(
                "⚠️ REFRESH CAPTCHA button not found"
            );

            return false;
        }

        refreshBtn.click();

        const status =
            document.getElementById(
                "turnstileStatus"
            );

        if (status) {

            status.innerText =
                "🛡️ CAPTCHA required — complete verification";

            status.style.color =
                "#ffd166";
        }

        // ======================================
        // WAIT FOR USER TO SOLVE CAPTCHA
        // ======================================

        while (
            captchaPool.tokens.length === 0
        ) {

            await sleep(500);
        }

        console.log(
            "✅ New CAPTCHA token received"
        );

        return true;

    } finally {

        captchaWaiting = false;
    }
}

    // ======================================
    // UPLOAD ONE FILE
    //
    // Used by:
    // - Manual individual upload
    // - Automatic upload
    // ======================================
    async function uploadFileRow(row) {

        if (!row?.input) {
            return false;
        }

        const file =
            row.input.files?.[0];

        if (!file) {

            if (row.status) {
                row.status.textContent =
                    "Choose file";
            }

            return false;
        }


        // ==================================
        // CAPTCHA CHECK
        // ==================================

        const captchaReady =
            await waitForCaptchaForUpload();

        if (!captchaReady) {

            if (row.status) {
                row.status.textContent =
                    "⚠️ CAPTCHA unavailable";
            }

            return false;
        }


        if (row.button) {
            row.button.disabled = true;
        }

        if (row.status) {
            row.status.textContent =
                "Uploading...";
        }


        try {

            const isPrimary =
                row.index === 1;

            console.log(
                `📤 Uploading File ${row.index}...`
            );

            const result =
                await uploadIVACFile(
                    file,
                    isPrimary
                );

            console.log(
                `📥 File ${row.index} response:`,
                result
            );


            // ==================================
            // SUCCESS
            // ==================================

            if (
                result &&
                result.successFlag === true
            ) {

                if (row.status) {

                    row.status.textContent =
                        isPrimary
                            ? "✓ Uploaded • PRIMARY"
                            : "✓ Uploaded";

                    row.status.dataset.uploaded =
                        "1";
                }

                updateUploadCount();

                console.log(
                    `✅ File ${row.index} UPLOAD SUCCESS`
                );

                return true;
            }


            // ==================================
            // SERVER REJECTED
            // ==================================

            if (row.status) {

                row.status.textContent =
                    "⚠️ Server response";

                row.status.dataset.uploaded =
                    "0";
            }

            return false;


        } catch (error) {

            console.error(
                `❌ File ${row.index} upload error:`,
                error
            );

            if (row.status) {

                row.status.textContent =
                    "❌ " +
                    (
                        error.message ||
                        "Upload failed"
                    );

                row.status.dataset.uploaded =
                    "0";
            }

            return false;


        } finally {

            if (row.button) {
                row.button.disabled = false;
            }

            updateUploadCount();
        }
    }


    // ======================================
    // UPLOAD ONE FILE WITH RETRY
    //
    // CAPTCHA is checked before EVERY attempt.
    // ======================================
    async function uploadFileRowWithRetry(
        row,
        maxAttempts = MAX_UPLOAD_RETRIES
    ) {

        if (!row?.input) {
            return false;
        }

        if (
            row.status?.dataset.uploaded === "1"
        ) {
            return true;
        }

        if (!row.input.files?.[0]) {

            if (row.status) {
                row.status.textContent =
                    "Choose file";
            }

            return false;
        }


        for (
            let attempt = 1;
            attempt <= maxAttempts;
            attempt++
        ) {

            /*
             * Automatic flow respects AUTO_MODE.
             * Manual upload does not use this function.
             */

            if (!AUTO_MODE) {
                return false;
            }

            if (
                row.status?.dataset.uploaded === "1"
            ) {
                return true;
            }


            // ==================================
            // CAPTCHA
            // ==================================

            const captchaReady =
                await waitForCaptchaForUpload();

            if (!captchaReady) {

                if (row.status) {
                    row.status.textContent =
                        "⚠️ CAPTCHA required";
                }

                return false;
            }


            if (row.status) {

                row.status.textContent =
                    `Uploading ${attempt}/${maxAttempts}...`;
            }

            console.log(
                `📤 File ${row.index} attempt ${attempt}/${maxAttempts}`
            );


            const success =
                await uploadFileRow(row);

            if (success) {

                console.log(
                    `✅ File ${row.index} SUCCESS`
                );

                return true;
            }


            console.warn(
                `❌ File ${row.index} attempt ${attempt} failed`
            );


            if (
                attempt < maxAttempts
            ) {

                await sleep(1500);
            }
        }


        if (row.status) {

            row.status.textContent =
                `❌ FAILED after ${maxAttempts} attempts`;
        }

        return false;
    }


    // ======================================
    // AUTO UPLOAD FLOW
    //
    // 1. File 1 first
    // 2. Files 2/3/4 together
    // 3. Retry ONLY failed files
    // 4. Booking Config after all succeed
    // ======================================
    async function runAutoUploadFlow() {

        if (uploadFlowBusy) {
            return false;
        }

        if (!AUTO_MODE) {
            return false;
        }

        uploadFlowBusy = true;

        try {

            const rows =
                [1, 2, 3, 4].map(index => ({

                    index,

                    input:
                        document.getElementById(
                            `ivacFileInput${index}`
                        ),

                    button:
                        document.getElementById(
                            `ivacUploadBtn${index}`
                        ),

                    status:
                        document.getElementById(
                            `ivacFileStatus${index}`
                        )
                }));


            const selectedRows =
                rows.filter(row =>
                    row.input?.files?.[0]
                );


            if (!selectedRows.length) {

                console.log(
                    "📎 No files selected"
                );

                return false;
            }


            // ==================================
            // STEP 1
            // PRIMARY FILE
            // ==================================

            const primary =
                rows.find(
                    row => row.index === 1
                );


            if (
                primary &&
                primary.input?.files?.[0] &&
                primary.status?.dataset.uploaded !== "1"
            ) {

                console.log(
                    "━━━━━━━━━━━━━━━━━━━━━━"
                );

                console.log(
                    "📤 STEP 1: PRIMARY FILE"
                );

                console.log(
                    "━━━━━━━━━━━━━━━━━━━━━━"
                );


                primaryUploadSuccess =
                    await uploadFileRowWithRetry(
                        primary
                    );


                if (!primaryUploadSuccess) {

                    console.error(
                        "❌ PRIMARY FAILED"
                    );

                    return false;
                }


                console.log(
                    "✅ PRIMARY UPLOAD SUCCESS"
                );


                await sleep(1000);

            } else if (
                primary?.status?.dataset.uploaded === "1"
            ) {

                primaryUploadSuccess = true;
            }


            // ==================================
            // STEP 2
            // SECONDARY FILES
            // ==================================

            const secondaryRows =
                rows.filter(row =>
                    row.index !== 1 &&
                    row.input?.files?.[0] &&
                    row.status?.dataset.uploaded !== "1"
                );


            if (secondaryRows.length) {

                console.log(
                    "━━━━━━━━━━━━━━━━━━━━━━"
                );

                console.log(
                    "📤 STEP 2: FILES 2/3/4 TOGETHER"
                );

                console.log(
                    "━━━━━━━━━━━━━━━━━━━━━━"
                );


                /*
                 * First attempt:
                 * run selected secondary files together.
                 *
                 * Each upload independently checks
                 * the CAPTCHA pool.
                 */
                await Promise.all(
                    secondaryRows.map(row =>
                        uploadFileRow(row)
                    )
                );


                // ==================================
                // RETRY ONLY FAILED FILES
                // ==================================

                let failedRows =
                    secondaryRows.filter(row =>
                        row.status?.dataset.uploaded !== "1"
                    );


                console.log(
                    `📊 Secondary complete. Failed: ${failedRows.length}`
                );


                for (
                    const row of failedRows
                ) {

                    if (!AUTO_MODE) {
                        return false;
                    }


                    console.log(
                        `🔁 Retrying ONLY File ${row.index}`
                    );


                    await uploadFileRowWithRetry(
                        row
                    );


                    await sleep(500);
                }


                // ==================================
                // FINAL SECONDARY CHECK
                // ==================================

                failedRows =
                    secondaryRows.filter(row =>
                        row.status?.dataset.uploaded !== "1"
                    );


                if (failedRows.length) {

                    console.error(
                        "❌ Secondary files still failed:",
                        failedRows.map(
                            row => row.index
                        )
                    );

                    return false;
                }


                secondaryUploadSuccess = true;


                console.log(
                    "✅ ALL SECONDARY FILES SUCCESS"
                );

            } else {

                secondaryUploadSuccess = true;

                console.log(
                    "ℹ️ No secondary files selected"
                );
            }


            // ==================================
            // FINAL FILE CHECK
            // ==================================

            const remaining =
                selectedRows.filter(row =>
                    row.status?.dataset.uploaded !== "1"
                );


            if (remaining.length) {

                console.error(
                    "❌ Remaining files:",
                    remaining.map(
                        row => row.index
                    )
                );

                return false;
            }


            console.log(
                "━━━━━━━━━━━━━━━━━━━━━━"
            );

            console.log(
                "✅ ALL SELECTED FILES UPLOADED"
            );

            console.log(
                "━━━━━━━━━━━━━━━━━━━━━━"
            );


            // ==================================
            // NEXT STEP
            // BOOKING CONFIG
            // ==================================

            await sleep(1000);

            return await runBookingConfigFlow();


        } catch (error) {

            console.error(
                "❌ AUTO UPLOAD FLOW ERROR:",
                error
            );

            return false;


        } finally {

            uploadFlowBusy = false;
        }
    }


    // ======================================
    // AUTO BOOKING CONFIG FLOW
    // ======================================
    async function runBookingConfigFlow() {

        if (bookingConfigFlowBusy) {
            return false;
        }

        if (bookingConfigSuccess) {
            return true;
        }

        bookingConfigFlowBusy = true;

        try {

            const status =
                document.getElementById(
                    "bookingConfigStatus"
                );

            const btn =
                document.getElementById(
                    "sendBookingConfigBtn"
                );


            if (status) {

                status.innerText =
                    "SENDING...";

                status.style.color =
                    "#ffd166";
            }


            if (btn) {
                btn.disabled = true;
            }


            console.log(
                "⚙️ Sending Booking Config..."
            );


            await sendAppointmentBookingConfig();


            bookingConfigSuccess = true;


            if (status) {

                status.innerText =
                    "SUCCESS";

                status.style.color =
                    "#20e58a";
            }


            if (btn) {

                btn.innerText =
                    "✅ BOOKING CONFIG SENT";
            }


            console.log(
                "✅ Booking Config SUCCESS"
            );


            // ==================================
            // GO TO TIME-SLOT
            // ==================================

            if (
                AUTO_REDIRECT_TIME_SLOT
            ) {

                console.log(
                    "➡️ Redirecting to Time-Slot..."
                );


                await sleep(700);


                window.location.href =
                    "https://appointment.ivacbd.com/appointment/time-slot";


                return true;
            }


            return true;


        } catch (error) {

            console.error(
                "❌ Booking Config failed:",
                error
            );


            bookingConfigSuccess = false;


            const status =
                document.getElementById(
                    "bookingConfigStatus"
                );


            if (status) {

                status.innerText =
                    "FAILED";

                status.style.color =
                    "#ff5969";
            }


            return false;


        } finally {

            bookingConfigFlowBusy = false;


            const btn =
                document.getElementById(
                    "sendBookingConfigBtn"
                );


            if (btn) {
                btn.disabled = false;
            }
        }
    }


    // ======================================
    // START UPLOAD AFTER APPOINTMENT
    // ======================================
    async function startUploadAfterAppointment() {

        if (!AUTO_MODE) {
            return;
        }

        if (!appointmentSuccess) {
            return;
        }

        if (uploadFlowBusy) {
            return;
        }


        const inputs =
            [1, 2, 3, 4].map(index =>
                document.getElementById(
                    `ivacFileInput${index}`
                )
            );


        const hasFiles =
            inputs.some(
                input =>
                    input?.files?.length > 0
            );


        if (!hasFiles) {
            return;
        }


        console.log(
            "📎 Appointment successful → starting UPLOAD ALL"
        );


        await runAutoUploadFlow();
    }


    // ======================================
    // MAKE AUTO FLOW AVAILABLE TO MAIN()
    // ======================================
    window.startUploadAfterAppointment =
        startUploadAfterAppointment;


    window.runAutoUploadFlow =
        runAutoUploadFlow;


    // ======================================
    // INDIVIDUAL FILE BUTTONS
    //
    // MANUAL UPLOAD
    //
    // CAPTCHA behavior:
    // If pool empty → automatically click
    // REFRESH CAPTCHA → wait → upload.
    // ======================================

    uploadRows.forEach(row => {

        if (!row.input || !row.button) {
            return;
        }


        // ==================================
        // FILE SELECTED
        // ==================================

        row.input.addEventListener(
            "change",
            async function () {

                const file =
                    this.files?.[0];


                row.status.dataset.uploaded =
                    "0";


                if (file) {

                    row.status.textContent =
                        file.name;


                    await savePersistentFile(
                        row.index,
                        file
                    );

                } else {

                    row.status.textContent =
                        "Not selected";


                    await deletePersistentFile(
                        row.index
                    );
                }


                updateUploadCount();
            }
        );


        // ==================================
        // MANUAL UPLOAD BUTTON
        // ==================================

        row.button.addEventListener(
            "click",
            async function () {

                console.log(
                    `📤 MANUAL UPLOAD: File ${row.index}`
                );


                /*
                 * IMPORTANT:
                 * This uses uploadFileRow()
                 * directly, so it works even
                 * when AUTO_MODE is OFF.
                 */

                await uploadFileRow(row);
            }
        );
    });


    // ======================================
    // UPLOAD ALL
    // ======================================
    if (uploadAllBtn) {

        uploadAllBtn.addEventListener(
            "click",
            async function () {

                if (uploadFlowBusy) {
                    return;
                }


                /*
                 * UPLOAD ALL requires AUTO_MODE
                 * because runAutoUploadFlow()
                 * uses the automatic flow.
                 */

                if (!AUTO_MODE) {

                    console.warn(
                        "⚠️ AUTO MODE is OFF"
                    );

                    uploadAllBtn.textContent =
                        "⚠️ START AUTO FIRST";

                    setTimeout(() => {

                        uploadAllBtn.textContent =
                            "⬆ UPLOAD ALL";

                    }, 1500);

                    return;
                }


                console.log(
                    "🚀 UPLOAD ALL clicked"
                );


                uploadAllBtn.disabled = true;

                uploadAllBtn.textContent =
                    "⏳ UPLOAD FLOW...";


                try {

                    const success =
                        await runAutoUploadFlow();


                    if (success) {

                        uploadAllBtn.textContent =
                            "✓ FLOW COMPLETE";

                    } else {

                        uploadAllBtn.textContent =
                            "⚠️ CHECK FAILED FILES";
                    }


                } catch (error) {

                    console.error(
                        "UPLOAD ALL ERROR:",
                        error
                    );


                    uploadAllBtn.textContent =
                        "❌ UPLOAD ERROR";


                } finally {

                    uploadAllBtn.disabled = false;


                    updateUploadCount();
                    updateCaptchaPoolUI();


                    setTimeout(() => {

                        uploadAllBtn.textContent =
                            "⬆ UPLOAD ALL";

                    }, 2000);
                }
            }
        );
    }


    // ======================================
    // RESTORE SAVED FILES
    // ======================================
    for (
        const row of uploadRows
    ) {

        await restorePersistentFile(
            row.index,
            row.input,
            row.status
        );
    }


    updateUploadCount();
}

    // ==========================================
    // LOCATION SELECTOR
    // ==========================================
    function setupLocationSelector() {

        const select =
            document.getElementById(
                "ivacLocationSelect"
            );

        if (!select) {
            return;
        }

        // Safety fallback
        if (!IVAC_LOCATIONS[IVAC_LOCATION]) {
            IVAC_LOCATION = "Dhaka";
            localStorage.setItem(
                "IVAC_LOCATION",
                IVAC_LOCATION
            );
        }

        select.value =
            IVAC_LOCATION;

        select.addEventListener(
            "change",
            function () {

                const selected =
                    this.value;

                if (
                    !IVAC_LOCATIONS[selected]
                ) {

                    this.value =
                        IVAC_LOCATION;

                    return;
                }

                IVAC_LOCATION =
                    selected;

                localStorage.setItem(
                    "IVAC_LOCATION",
                    IVAC_LOCATION
                );

                console.log(
                    "📍 IVAC Location changed:",
                    IVAC_LOCATION
                );

                console.log(
                    "📤 Config will use:",
                    IVAC_LOCATIONS[
                        IVAC_LOCATION
                    ]
                );
            }
        );
    }

    // ==========================================
    // PANEL EVENTS
    // ==========================================
    function setupPanelEvents() {

        const startAuto =
            document.getElementById(
                "startAuto"
            );

        const startRetryBtn =
            document.getElementById(
                "startRetry"
            );

        const stopRetryBtn =
            document.getElementById(
                "stopRetry"
            );

        const appointmentBtn =
            document.getElementById(
                "sendAppointmentBtn"
            );

const bookingBtn =
    document.getElementById(
        "sendBookingConfigBtn"
    );

// ======================================
// AUTO REDIRECT TO TIME-SLOT
// ======================================

const autoRedirectToggle =
    document.getElementById(
        "autoRedirectTimeSlot"
    );

const autoRedirectSlider =
    document.getElementById(
        "autoRedirectSlider"
    );

const autoRedirectKnob =
    document.getElementById(
        "autoRedirectKnob"
    );

const autoRedirectStatus =
    document.getElementById(
        "autoRedirectStatus"
    );

function updateAutoRedirectUI() {

    if (
        !autoRedirectToggle ||
        !autoRedirectSlider ||
        !autoRedirectKnob ||
        !autoRedirectStatus
    ) {
        return;
    }

    autoRedirectToggle.checked =
        AUTO_REDIRECT_TIME_SLOT;

    if (AUTO_REDIRECT_TIME_SLOT) {

        autoRedirectSlider.style.background =
            "#18d982";

        autoRedirectKnob.style.left =
            "22px";

        autoRedirectStatus.innerText =
            "ON";

        autoRedirectStatus.style.color =
            "#20e58a";

    } else {

        autoRedirectSlider.style.background =
            "#334155";

        autoRedirectKnob.style.left =
            "3px";

        autoRedirectStatus.innerText =
            "OFF";

        autoRedirectStatus.style.color =
            "#8fa8c4";
    }
}

if (autoRedirectToggle) {

    updateAutoRedirectUI();

    autoRedirectToggle.addEventListener(
        "change",
        function () {

            AUTO_REDIRECT_TIME_SLOT =
                this.checked;

            localStorage.setItem(
                "IVAC_AUTO_REDIRECT",
                AUTO_REDIRECT_TIME_SLOT
                    ? "1"
                    : "0"
            );

            updateAutoRedirectUI();

            console.log(
                AUTO_REDIRECT_TIME_SLOT
                    ? "↪ Auto redirect ON"
                    : "↪ Auto redirect OFF"
            );
        }
    );
}
        const refreshTurnstileBtn =
    document.getElementById(
        "refreshTurnstileBtn"
    );

if (refreshTurnstileBtn) {
    refreshTurnstileBtn.onclick = function () {

        turnstileToken = null;

        // NEVER clear existing valid CAPTCHA tokens
        updateCaptchaPoolUI();

        if (
            window.turnstile &&
            turnstileWidgetId !== null
        ) {
            try {
                window.turnstile.reset(
                    turnstileWidgetId
                );
            } catch (error) {
                console.warn(
                    "Turnstile refresh failed:",
                    error
                );
            }
        }

        const status =
            document.getElementById(
                "turnstileStatus"
            );

        if (status) {
            status.innerText =
                captchaPool.tokens.length > 0
                    ? `Complete new CAPTCHA — ${captchaPool.tokens.length}/5 tokens already saved`
                    : "Please complete new verification";

            status.style.color = "#ffd166";
        }

        console.log(
            `🔄 CAPTCHA refreshed — existing pool preserved: ${captchaPool.tokens.length}/5`
        );
    };
}

        if (startAuto) {
            startAuto.onclick =
                startAutoMode;
        }

        if (startRetryBtn) {
            startRetryBtn.onclick =
                startRetry;
        }

        if (stopRetryBtn) {

            stopRetryBtn.onclick =
                function () {

                    stopRetry();
                    stopAutoMode();
                };
        }

        if (appointmentBtn) {

            appointmentBtn.onclick =
                async function () {

                    const btn = this;

                    try {

                        btn.disabled = true;
                        btn.innerText =
                            "⏳ SENDING...";

                        await sendAppointmentRequest();

                        btn.innerText =
                            "✅ SENT";

                    } catch (error) {

                        btn.innerText =
                            "❌ FAILED";

                    } finally {

                        setTimeout(() => {

                            btn.disabled =
                                false;

                            btn.innerText =
                                "🚀 SEND APPOINTMENT";

                        }, 1500);
                    }
                };
        }

        if (bookingBtn) {

            bookingBtn.onclick =
                async function () {

                    const btn = this;
                if (bookingConfigFlowBusy) {
    return;
}
if (bookingConfigSuccess) {
    console.log("⚙️ Booking Config already completed");
    return;
}
                    const status =
                        document.getElementById(
                            "bookingConfigStatus"
                        );

                    try {

                        btn.disabled = true;

                        btn.innerText =
                            "⏳ SENDING...";

                        if (status) {

                            status.innerText =
                                "SENDING";

                            status.style.color =
                                "#ffd166";
                        }

                       await sendAppointmentBookingConfig();

btn.innerText =
    "✅ SENT";

if (status) {

    status.innerText =
        "SUCCESS";

    status.style.color =
        "#20e58a";
}

// ======================================
// GO TO TIME-SLOT PAGE AFTER SUCCESS
// ======================================
if (AUTO_REDIRECT_TIME_SLOT) {

    await sleep(500);

    window.location.href =
        "https://appointment.ivacbd.com/appointment/time-slot";

} else {

    console.log(
        "↪ Auto redirect disabled — staying on current page"
    );
}
                    } catch (error) {

                        console.error(
                            error
                        );

                        btn.innerText =
                            "❌ FAILED";

                        if (status) {

                            status.innerText =
                                "FAILED";

                            status.style.color =
                                "#ff5969";
                        }

                    } finally {

                        setTimeout(() => {

                            btn.disabled =
                                false;

                            btn.innerText =
                                "⚙️ SEND BOOKING CONFIG";

                            if (status) {

                                status.innerText =
                                    "READY";

                                status.style.color =
                                    "#8fa8c4";
                            }

                        }, 1500);
                    }
                };
        }

        // ======================================
        // MINIMIZE
        // ======================================
        const minimizeBtn =
            document.getElementById(
                "retryMinimize"
            );

        const panelBody =
            document.getElementById(
                "retryPanelBody"
            );

        const panel =
            document.getElementById(
                "retryPanel"
            );

        if (
            minimizeBtn &&
            panelBody &&
            panel
        ) {

            minimizeBtn.onclick =
                function (e) {

                    e.stopPropagation();

                    if (
                        panelBody.style.display ===
                        "none"
                    ) {

                        panelBody.style.display =
                            "block";

                        minimizeBtn.innerText =
                            "−";

                        panel.style.width =
                            "330px";

                    } else {

                        panelBody.style.display =
                            "none";

                        minimizeBtn.innerText =
                            "+";

                        panel.style.width =
                            "230px";
                    }
                };
        }
    }

    // ==========================================
    // DATE SWITCH UI
    // ==========================================
    function setupDateSwitch() {

        const checkbox =
            document.getElementById(
                "autoDateSwitch"
            );

        const slider =
            document.getElementById(
                "dateSwitchSlider"
            );

        const knob =
            document.getElementById(
                "dateSwitchKnob"
            );

        const card =
            document.getElementById(
                "dateSwitchCard"
            );

        if (
            !checkbox ||
            !slider ||
            !knob ||
            !card
        ) {
            return;
        }

        function updateUI() {

            if (checkbox.checked) {

                slider.style.background =
                    "linear-gradient(135deg,#18d982,#08a965)";

                knob.style.left =
                    "24px";

                card.style.borderColor =
                    "rgba(0,220,130,.45)";

                card.style.background =
                    "rgba(10,48,42,.55)";

            } else {

                slider.style.background =
                    "#334155";

                knob.style.left =
                    "3px";

                card.style.borderColor =
                    "rgba(120,160,200,.13)";

                card.style.background =
                    "rgba(20,38,60,.72)";
            }
        }

        checkbox.checked =
            AUTO_DATE_SWITCH;

        updateUI();

        checkbox.onchange =
            function () {

                AUTO_DATE_SWITCH =
                    this.checked;

                updateUI();

                console.log(
                    AUTO_DATE_SWITCH
                        ? "📅 Auto date switching ON"
                        : "📅 Auto date switching OFF"
                );
            };
    }

    // ==========================================
    // PANEL STATUS
    // ==========================================
    function updateRetryPanelStatus(
        status
    ) {

        const statusText =
            document.getElementById(
                "retryStatus"
            );

        const statusDot =
            document.getElementById(
                "statusDot"
            );

        const liveDot =
            document.getElementById(
                "retryLiveDot"
            );

        const liveText =
            document.getElementById(
                "retryLiveText"
            );

        if (!statusText) {
            return;
        }

        if (status === "RUNNING") {

            statusText.innerText =
                "RUNNING";

            statusText.style.color =
                "#20e58a";

            if (statusDot) {
                statusDot.style.background =
                    "#20e58a";
            }

            if (liveDot) {
                liveDot.style.background =
                    "#20e58a";
            }

            if (liveText) {
                liveText.innerText =
                    "ACTIVE";
            }

        } else if (status === "STOPPED") {

            statusText.innerText =
                "STOPPED";

            statusText.style.color =
                "#ff5969";

            if (statusDot) {
                statusDot.style.background =
                    "#ff5969";
            }

            if (liveDot) {
                liveDot.style.background =
                    "#ff5969";
            }

            if (liveText) {
                liveText.innerText =
                    "STOPPED";
            }

        } else {

            statusText.innerText =
                "OFF";

            statusText.style.color =
                "#cbd5e1";

            if (statusDot) {
                statusDot.style.background =
                    "#94a3b8";
            }

            if (liveDot) {
                liveDot.style.background =
                    "#94a3b8";
            }

            if (liveText) {
                liveText.innerText =
                    "IDLE";
            }
        }
    }

    // ==========================================
    // START RETRY
    // ==========================================
    function startRetry() {

        const input =
            document.getElementById(
                "retrySec"
            );

        const sec =
            parseFloat(
                input?.value
            );

        if (!sec || sec <= 0) {
            return;
        }

        clearInterval(
            retryTimer
        );

        clearInterval(
            retryCountdownTimer
        );

        retryRemaining =
            sec;

        retryCountdownTimer =
            setInterval(() => {

                retryRemaining--;

                if (
                    retryRemaining < 0
                ) {
                    retryRemaining = 0;
                }

                const countdown =
                    document.getElementById(
                        "retryCountdown"
                    );

                if (countdown) {

                    countdown.innerHTML =
                        `${retryRemaining}
                        <span style="
                            font-size:11px;
                            font-weight:600;
                            color:#7790aa;
                        ">sec</span>`;
                }

            }, 1000);

        retryTimer =
            setInterval(
                async () => {

                    retryRemaining =
                        sec;

                    const countdown =
                        document.getElementById(
                            "retryCountdown"
                        );

                    if (countdown) {

                        countdown.innerHTML =
                            `${retryRemaining}
                            <span style="
                                font-size:11px;
                                font-weight:600;
                                color:#7790aa;
                            ">sec</span>`;
                    }

                    if (
                        document.body.innerText.includes(
                            "Continue Payment"
                        )
                    ) {

                        stopRetry();
                        return;
                    }

                    if (
                        location.pathname.includes(
                            "/appointment/time-slot"
                        )
                    ) {

                        if (
                            AUTO_DATE_SWITCH
                        ) {

                            await switchAvailableDate();

                            await sleep(500);
                        }

                        autoContinueBooking();
                    }

                    const signBtn =
                        document.querySelector(
                            'button[type="submit"]'
                        );

                    if (
                        signBtn &&
                        signBtn.innerText.includes(
                            "Sign In Now"
                        ) &&
                        !signBtn.disabled
                    ) {

                        signBtn.click();

                        console.log(
                            "🔁 Sign In retry"
                        );

                        return;
                    }

                    const btn =
                        [
                            ...document.querySelectorAll(
                                "button"
                            )
                        ].find(b =>
                            b.innerText.includes(
                                "Continue Booking"
                            )
                        );

                    if (
                        btn &&
                        !btn.disabled
                    ) {

                        btn.click();

                        console.log(
                            "🔁 Continue Booking retry"
                        );
                    }

                },
                sec * 1000
            );

        updateRetryPanelStatus(
            "RUNNING"
        );
    }

    // ==========================================
    // STOP RETRY
    // ==========================================
    function stopRetry() {

        clearInterval(
            retryTimer
        );

        clearInterval(
            retryCountdownTimer
        );

        retryTimer = null;
        retryCountdownTimer = null;

        retryRemaining = 0;

        const countdown =
            document.getElementById(
                "retryCountdown"
            );

        if (countdown) {

            countdown.innerHTML =
                `--
                <span style="
                    font-size:11px;
                    font-weight:600;
                    color:#7790aa;
                ">sec</span>`;
        }

        const progress =
            document.getElementById(
                "retryProgress"
            );

        if (progress) {
            progress.style.width =
                "0%";
        }

        updateRetryPanelStatus(
            "STOPPED"
        );
    }

    // ==========================================
    // AUTO START
    // ==========================================
    function startAutoMode() {

        AUTO_MODE = true;

        localStorage.setItem(
            "IVAC_AUTO_MODE",
            "1"
        );

        console.log(
            "🟢 AUTO ENABLED"
        );

        updateRetryPanelStatus(
            "RUNNING"
        );
    }

    // ==========================================
    // AUTO STOP
    // ==========================================
    function stopAutoMode() {

        AUTO_MODE = false;

        localStorage.setItem(
            "IVAC_AUTO_MODE",
            "0"
        );

        console.log(
            "🔴 AUTO DISABLED"
        );

        updateRetryPanelStatus(
            "STOPPED"
        );
    }

    // ==========================================
    // DRAG PANEL
    // ==========================================
    function setupDragging() {

        const panel =
            document.getElementById(
                "retryPanel"
            );

        const header =
            document.getElementById(
                "retryHeader"
            );

        if (!panel || !header) {
            return;
        }

        let pos1 = 0;
        let pos2 = 0;
        let pos3 = 0;
        let pos4 = 0;

        header.onmousedown =
            dragMouseDown;

        function dragMouseDown(e) {

            if (
                e.target.closest(
                    "#retryMinimize"
                )
            ) {
                return;
            }

            e.preventDefault();

            pos3 =
                e.clientX;

            pos4 =
                e.clientY;

            document.onmouseup =
                closeDrag;

            document.onmousemove =
                dragPanel;
        }

        function dragPanel(e) {

            e.preventDefault();

            pos1 =
                pos3 -
                e.clientX;

            pos2 =
                pos4 -
                e.clientY;

            pos3 =
                e.clientX;

            pos4 =
                e.clientY;

            panel.style.top =
                (
                    panel.offsetTop -
                    pos2
                ) + "px";

            panel.style.left =
                (
                    panel.offsetLeft -
                    pos1
                ) + "px";

            panel.style.right =
                "auto";
        }

        function closeDrag() {

            document.onmouseup =
                null;

            document.onmousemove =
                null;
        }
    }

    // ==========================================
    // MAIN AUTO FLOW
    // ==========================================
    async function main() {

        createRetryUI();

        closeNotices();

        if (!AUTO_MODE) {
            return;
        }

        // ======================================
        // STEP 1 — LOGIN
        // ======================================

        fillLogin();

        // ======================================
        // STEP 2 — OTP
        // ======================================

        autoVerifyOTP();


// ======================================
// STEP 3 — AFTER LOGIN/OTP
// TAKE APPOINTMENT
// ======================================

const loginScreen =
    document.querySelector(
        'input[name="phone"]'
    );

const passwordScreen =
    document.querySelector(
        'input[name="password"]'
    );

const verifyBtn =
    [
        ...document.querySelectorAll("button")
    ].find(b =>
        b.innerText?.includes(
            "Verify OTP"
        )
    );

// Login / OTP screen still active
if (
    loginScreen ||
    passwordScreen ||
    verifyBtn
) {
    return;
}

// ======================================
// WAIT FOR APPOINTMENT BUTTON
// ======================================

if (
    AUTO_MODE &&
    !appointmentSuccess &&
    !appointmentFlowBusy
) {

    const appointmentBtn =
        [
            ...document.querySelectorAll(
                "button,a"
            )
        ].find(el =>
            el.textContent
                ?.trim()
                .includes(
                    "Take Your Appointment"
                )
        );

    if (appointmentBtn) {

        console.log(
            "🎯 Take Your Appointment detected"
        );

        await clickAppointmentWithRetry();

        if (appointmentSuccess) {

            console.log(
                "✅ Appointment completed → Upload Flow"
            );

            await window.startUploadAfterAppointment();
        }

    } else {

        console.log(
            "⏳ Waiting for Take Your Appointment..."
        );
    }
}


        // ======================================
        // STEP 4 — TIME SLOT
        // ======================================

        if (
            location.pathname.includes(
                "/appointment/time-slot"
            )
        ) {

            if (AUTO_DATE_SWITCH) {

                await switchAvailableDate();

                await sleep(300);
            }

            autoContinueBooking();
        }

        // ======================================
        // STEP 5 — PAYMENT
        // ======================================

        autoContinuePayment();
    }

    // ==========================================
    // START
    // ==========================================
    setInterval(
        main,
        500
    );

    // ==========================================
    // DOM OBSERVER
    // ==========================================
    const observer =
        new MutationObserver(() => {

            main();
        });

    if (document.body) {

        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );
    }

})();

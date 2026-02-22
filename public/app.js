const bannerTextEl = document.getElementById("bannerText");
const claimForm = document.getElementById("claimForm");
const textInput = document.getElementById("textInput");
const submitBtn = document.getElementById("submitBtn");
const statusEl = document.getElementById("status");
const minutesLeftEl = document.getElementById("minutesLeft");
const resetInfoEl = document.getElementById("resetInfo");
const charCountEl = document.getElementById("charCount");
const shareBtnEl = document.getElementById("shareBtn");
const shareStatusEl = document.getElementById("shareStatus");
const EMPTY_BANNER_TEXT = "Awaiting today's champion...";
const DEFAULT_TIMEZONE = "Asia/Seoul";
const RESET_INFO_LABEL = "Resets daily at 00:00 KST (UTC+9)";

let appState = null;

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#ef4444" : "#22c55e";
}

function setShareStatus(message, isError = false) {
  if (!shareStatusEl) return;
  shareStatusEl.textContent = message;
  shareStatusEl.style.color = isError ? "#ef4444" : "#22c55e";
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

async function copyShareLink() {
  const shareUrl = window.location.href;
  try {
    await copyText(shareUrl);
    setShareStatus("Share link copied.");
  } catch (err) {
    setShareStatus("Failed to copy link.", true);
  }
}

function getResetInfoLabel(tz) {
  return RESET_INFO_LABEL;
}

function setIdleTimerText() {
  minutesLeftEl.textContent = "--h --m --s";
}

function updateCharCount() {
  if (!charCountEl) return;
  const maxLength = Number(textInput.maxLength) || 40;
  charCountEl.textContent = `${textInput.value.length} / ${maxLength}`;
}

function render(state) {
  const timezone = state.timezone || DEFAULT_TIMEZONE;
  appState = { ...state, timezone };
  if (resetInfoEl) {
    resetInfoEl.textContent = getResetInfoLabel(timezone);
  }

  if (state.text) {
    bannerTextEl.textContent = state.text;
    textInput.disabled = true;
    submitBtn.disabled = true;
    tickRemaining();
  } else {
    bannerTextEl.textContent = EMPTY_BANNER_TEXT;
    textInput.disabled = false;
    submitBtn.disabled = false;
    setIdleTimerText();
  }

  updateCharCount();
}

function getTimeLeft(tz) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).formatToParts(now);

  const hour = Number(parts.find((p) => p.type === "hour")?.value || 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value || 0);
  const second = Number(parts.find((p) => p.type === "second")?.value || 0);
  const elapsedSeconds = hour * 3600 + minute * 60 + second;
  const remainingSeconds = 24 * 3600 - elapsedSeconds;
  const safeSeconds = Math.max(remainingSeconds, 0);
  const hoursLeft = Math.floor(safeSeconds / 3600);
  const minutesLeft = Math.floor((safeSeconds % 3600) / 60);
  const secondsLeft = safeSeconds % 60;

  return { hoursLeft, minutesLeft, secondsLeft };
}

function tickRemaining() {
  if (!appState || !appState.text) return;

  const now = new Date();
  const tz = appState?.timezone || DEFAULT_TIMEZONE;
  const { hoursLeft, minutesLeft, secondsLeft } = getTimeLeft(tz);
  const mm = String(minutesLeft).padStart(2, "0");
  const ss = String(secondsLeft).padStart(2, "0");
  minutesLeftEl.textContent = `${hoursLeft}h ${mm}m ${ss}s`;

  const currentDate = now.toLocaleDateString("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  if (appState.dateKey && appState.dateKey !== currentDate) {
    fetchState();
  }
}

async function fetchState() {
  try {
    const res = await fetch("/api/state");
    const state = await res.json();
    render(state);
  } catch (err) {
    setStatus("Failed to load state.", true);
  }
}

claimForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = textInput.value.trim();
  if (!text) {
    setStatus("Please enter a message.", true);
    return;
  }

  submitBtn.disabled = true;

  try {
    const res = await fetch("/api/claim", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    });

    const data = await res.json();

    if (!res.ok) {
      if (data.state) render(data.state);
      setStatus(data.message || "Failed to claim the banner.", true);
      return;
    }

    render(data.state);
    setStatus("Claim complete. Try again after the next reset.");
  } catch (err) {
    setStatus("Request failed. Please try again.", true);
  }
});

textInput.addEventListener("input", updateCharCount);

if (shareBtnEl) {
  shareBtnEl.addEventListener("click", copyShareLink);
}

fetchState();
setInterval(tickRemaining, 1000);
tickRemaining();
updateCharCount();

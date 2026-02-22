const bannerTextEl = document.getElementById("bannerText");
const claimForm = document.getElementById("claimForm");
const textInput = document.getElementById("textInput");
const submitBtn = document.getElementById("submitBtn");
const statusEl = document.getElementById("status");
const clockEl = document.getElementById("clock");
const dateLabelEl = document.getElementById("dateLabel");
const tzLabelEl = document.getElementById("tzLabel");

let appState = null;

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#b91c1c" : "#065f46";
}

function render(state) {
  appState = state;
  tzLabelEl.textContent = `KST 기준 (${state.timezone})`;

  if (state.text) {
    bannerTextEl.textContent = state.text;
    textInput.disabled = true;
    submitBtn.disabled = true;
  } else {
    bannerTextEl.textContent = "아직 아무도 선점하지 않았습니다.";
    textInput.disabled = false;
    submitBtn.disabled = false;
  }
}

function tickClock() {
  const now = new Date();
  const tz = appState?.timezone || "Asia/Seoul";
  clockEl.textContent = now.toLocaleTimeString("ko-KR", { hour12: false, timeZone: tz });
  dateLabelEl.textContent = now.toLocaleDateString("ko-KR", {
    timeZone: tz,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short"
  });

  if (!appState) return;

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
    setStatus("상태를 불러오지 못했습니다.", true);
  }
}

claimForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = textInput.value.trim();
  if (!text) {
    setStatus("텍스트를 입력해 주세요.", true);
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
      setStatus(data.message || "선점에 실패했습니다.", true);
      return;
    }

    render(data.state);
    setStatus("선점 완료. 내일 리셋 후 다시 도전할 수 있습니다.");
  } catch (err) {
    setStatus("요청 중 오류가 발생했습니다.", true);
  }
});

fetchState();
setInterval(tickClock, 1000);
tickClock();

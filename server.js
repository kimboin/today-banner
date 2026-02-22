const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || "0.0.0.0";
const TIMEZONE = "Asia/Seoul";
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "state.json");
const PUBLIC_DIR = path.join(__dirname, "public");

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initial = {
      dateKey: getDateKey(),
      text: "",
      claimedAt: null
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), "utf8");
  }
}

function getDateKey() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);

  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;

  return `${y}-${m}-${d}`;
}

function loadState() {
  ensureDataFile();

  const raw = fs.readFileSync(DATA_FILE, "utf8");
  let state = JSON.parse(raw);
  const today = getDateKey();

  if (state.dateKey !== today) {
    state = { dateKey: today, text: "", claimedAt: null };
    saveState(state);
  }

  return state;
}

function saveState(state) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf8");
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";

    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        const parsed = data ? JSON.parse(data) : {};
        resolve(parsed);
      } catch (err) {
        reject(new Error("Invalid JSON body"));
      }
    });

    req.on("error", reject);
  });
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".js") return "application/javascript; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}

function serveStatic(req, res) {
  const urlPath = req.url === "/" ? "/index.html" : req.url;
  const safePath = path.normalize(urlPath).replace(/^([.][.][/\\])+/, "");
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    res.writeHead(200, { "Content-Type": getContentType(filePath) });
    res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/api/state") {
      const state = loadState();
      return sendJson(res, 200, {
        ...state,
        serverNow: new Date().toISOString(),
        timezone: TIMEZONE
      });
    }

    if (req.method === "POST" && req.url === "/api/claim") {
      const body = await parseBody(req);
      const input = String(body.text || "").trim();

      if (!input) {
        return sendJson(res, 400, { message: "텍스트를 입력해 주세요." });
      }

      if (input.length > 120) {
        return sendJson(res, 400, { message: "텍스트는 120자 이하로 입력해 주세요." });
      }

      const state = loadState();
      if (state.text) {
        return sendJson(res, 409, {
          message: "이미 오늘의 현수막이 선점되었습니다. 다음날 다시 시도해 주세요.",
          state
        });
      }

      const nextState = {
        ...state,
        text: input,
        claimedAt: new Date().toISOString()
      };

      saveState(nextState);

      return sendJson(res, 200, {
        message: "현수막 선점 완료",
        state: nextState
      });
    }

    if (req.method === "GET") {
      return serveStatic(req, res);
    }

    res.writeHead(404);
    res.end("Not found");
  } catch (err) {
    sendJson(res, 500, { message: err.message || "Server error" });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Banner server running on http://${HOST}:${PORT}`);
  console.log(`Daily reset timezone: ${TIMEZONE}`);
});

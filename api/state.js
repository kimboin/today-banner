const { sendJson } = require('./_lib/http');
const { getTodayState } = require('./_lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { message: 'Method Not Allowed' });
  }

  try {
    const { state, timezone } = await getTodayState();
    return sendJson(res, 200, {
      ...state,
      serverNow: new Date().toISOString(),
      timezone
    });
  } catch (err) {
    return sendJson(res, 500, { message: err.message || 'Server error' });
  }
};

const { parseJsonBody, sendJson } = require('./_lib/http');
const { getSupabaseClient, getTodayState, toState } = require('./_lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { message: 'Method Not Allowed' });
  }

  try {
    const body = await parseJsonBody(req);
    const input = String(body.text || '').trim();

    if (!input) {
      return sendJson(res, 400, { message: 'Please enter a message.' });
    }

    if (input.length > 40) {
      return sendJson(res, 400, { message: 'Message must be 40 characters or fewer.' });
    }

    const { dateKey } = await getTodayState();
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('daily_banner_claims')
      .insert({
        date_key: dateKey,
        text: input
      })
      .select('date_key,text,claimed_at')
      .single();

    if (error && error.code === '23505') {
      const current = await getTodayState();
      return sendJson(res, 409, {
        message: "Today's banner has already been claimed. Try again after reset.",
        state: current.state
      });
    }

    if (error) {
      throw error;
    }

    const state = toState(data, dateKey);
    return sendJson(res, 200, {
      message: 'Banner claimed',
      state
    });
  } catch (err) {
    return sendJson(res, 500, { message: err.message || 'Server error' });
  }
};

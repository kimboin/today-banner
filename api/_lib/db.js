const { createClient } = require('@supabase/supabase-js');
const { createEmptyState, getDateKey, getTimezone } = require('./time');

let client;

function getSupabaseClient() {
  if (client) {
    return client;
  }

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  client = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  return client;
}

function toState(row, dateKey) {
  if (!row) {
    return createEmptyState(dateKey);
  }

  return {
    dateKey: row.date_key,
    text: row.text,
    claimedAt: row.claimed_at
  };
}

async function getTodayState() {
  const supabase = getSupabaseClient();
  const timezone = getTimezone();
  const dateKey = getDateKey(timezone);

  const { data, error } = await supabase
    .from('daily_banner_claims')
    .select('date_key,text,claimed_at')
    .eq('date_key', dateKey)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    dateKey,
    timezone,
    state: toState(data, dateKey)
  };
}

module.exports = {
  getSupabaseClient,
  getTodayState,
  toState
};

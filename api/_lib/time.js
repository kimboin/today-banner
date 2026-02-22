function getDateKey(timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

function getTimezone() {
  return process.env.RESET_TIMEZONE || 'Asia/Seoul';
}

function createEmptyState(dateKey) {
  return {
    dateKey,
    text: '',
    claimedAt: null
  };
}

module.exports = {
  getDateKey,
  getTimezone,
  createEmptyState
};

function sendJson(res, statusCode, payload) {
  res.status(statusCode).json(payload);
}

async function parseJsonBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (err) {
      throw new Error('Invalid JSON body');
    }
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  if (!chunks.length) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error('Invalid JSON body');
  }
}

module.exports = {
  sendJson,
  parseJsonBody
};

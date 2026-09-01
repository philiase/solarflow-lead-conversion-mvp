const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 8080);
const WEBHOOK_URL =
  process.env.SOLARFLOW_WEBHOOK_URL ||
  'http://localhost:5678/webhook/solar-lead-message';
const ACCESS_CODE = process.env.SOLARFLOW_FORM_ACCESS_CODE || '';

const publicDir = path.join(__dirname, 'public');
const logsDir = path.join(__dirname, 'logs');
const eventsLogPath = path.join(logsDir, 'events.jsonl');

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function logEvent(type, details = {}) {
  const event = {
    timestamp: new Date().toISOString(),
    type,
    ...details,
  };

  fs.mkdirSync(logsDir, { recursive: true });
  fs.appendFileSync(eventsLogPath, `${JSON.stringify(event)}\n`);
}

function redactPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  return {
    ...payload,
    access_code: payload.access_code ? '[REDACTED]' : payload.access_code,
  };
}

function serializeError(error) {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;

      if (body.length > 100_000) {
        req.destroy();
        reject(new Error('Request body is too large.'));
      }
    });

    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

async function handleLead(req, res) {
  let rawBody = '';
  let payload = null;

  try {
    rawBody = await readRequestBody(req);

    try {
      payload = JSON.parse(rawBody || '{}');
    } catch (error) {
      logEvent('invalid_request_json', {
        error: serializeError(error),
        rawBody,
      });
      sendJson(res, 400, {
        ok: false,
        message: 'The form sent invalid JSON. The error has been logged.',
      });
      return;
    }

    if (!payload.channel_user_id || !payload.customer_message) {
      logEvent('invalid_lead_payload', {
        payload: redactPayload(payload),
      });
      sendJson(res, 400, {
        ok: false,
        message: 'channel_user_id and customer_message are required.',
      });
      return;
    }

    if (ACCESS_CODE && payload.access_code !== ACCESS_CODE) {
      logEvent('invalid_access_code', {
        channel_user_id: payload.channel_user_id,
        payload: redactPayload(payload),
      });
      sendJson(res, 401, {
        ok: false,
        message: 'Invalid access code.',
      });
      return;
    }

    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel_user_id: payload.channel_user_id,
        customer_message: payload.customer_message,
      }),
    });

    const responseText = await webhookResponse.text();
    let responseBody;

    try {
      responseBody = JSON.parse(responseText);
    } catch (error) {
      logEvent('invalid_webhook_json', {
        channel_user_id: payload.channel_user_id,
        statusCode: webhookResponse.status,
        error: serializeError(error),
        responseText,
      });
      responseBody = { raw: responseText };
    }

    logEvent(webhookResponse.ok ? 'lead_forwarded' : 'webhook_error', {
      channel_user_id: payload.channel_user_id,
      statusCode: webhookResponse.status,
      request: redactPayload(payload),
      response: responseBody,
    });

    sendJson(res, webhookResponse.ok ? 200 : webhookResponse.status, {
      ok: webhookResponse.ok,
      workflow: responseBody,
    });
  } catch (error) {
    logEvent('lead_api_error', {
      error: serializeError(error),
      rawBody,
      payload: redactPayload(payload),
    });
    sendJson(res, 500, {
      ok: false,
      message: 'Lead submission failed. The error has been logged.',
    });
  }
}

async function handleClientError(req, res) {
  try {
    const rawBody = await readRequestBody(req);
    let payload;

    try {
      payload = JSON.parse(rawBody || '{}');
    } catch (error) {
      payload = {
        parse_error: serializeError(error),
        rawBody,
      };
    }

    logEvent('client_error', {
      payload: redactPayload(payload),
    });
    sendJson(res, 200, { ok: true });
  } catch (error) {
    logEvent('client_error_logging_failed', {
      error: serializeError(error),
    });
    sendJson(res, 500, { ok: false });
  }
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const requestedPath = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = path.normalize(path.join(publicDir, requestedPath));

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': contentTypes[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'POST' && url.pathname === '/api/lead') {
    handleLead(req, res);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/client-error') {
    handleClientError(req, res);
    return;
  }

  if (req.method === 'GET') {
    serveStatic(req, res);
    return;
  }

  res.writeHead(405);
  res.end('Method not allowed');
});

server.listen(PORT, () => {
  console.log(`SolarFlow website form running at http://localhost:${PORT}`);
  console.log(`Forwarding leads to ${WEBHOOK_URL}`);
  console.log(
    ACCESS_CODE
      ? 'Access code protection is enabled.'
      : 'Access code protection is disabled.',
  );
});

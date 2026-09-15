const WEBHOOK_PATH = '/webhooks/whatsapp';

const DEVELOPMENT_REPLY =
  'PACTSOL development test: we received your message. This is an automated test reply.';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname !== WEBHOOK_PATH) {
      return new Response('Not found', { status: 404 });
    }

    if (request.method === 'GET') {
      return verifyWebhook(url, env);
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: { Allow: 'GET, POST' },
      });
    }

    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    if (!(await isValidSignature(rawBody, signature, env.META_APP_SECRET))) {
      return new Response('Invalid signature', { status: 401 });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    const newMessages = await persistInboundMessages(env.PACTSOL_DB, payload);

    // Meta receives its acknowledgement immediately; reply processing continues safely.
    ctx.waitUntil(sendDevelopmentReplies(env, newMessages));

    return new Response('EVENT_RECEIVED', { status: 200 });
  },
};

function verifyWebhook(url, env) {
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (
    mode === 'subscribe' &&
    challenge &&
    token === env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  ) {
    return new Response(challenge, { status: 200 });
  }

  return new Response('Forbidden', { status: 403 });
}

async function persistInboundMessages(db, payload) {
  if (!db || !Array.isArray(payload?.entry)) {
    return [];
  }

  const newMessages = [];

  for (const entry of payload.entry) {
    for (const change of entry.changes || []) {
      if (change.field !== 'messages') continue;

      for (const message of change.value?.messages || []) {
        const phone = normalizePhone(message.from);

        if (!phone || !message.id) continue;

        const result = await db
          .prepare(
            `INSERT OR IGNORE INTO whatsapp_messages (
              id,
              phone_e164,
              direction,
              source,
              provider_message_id,
              message_type,
              body,
              payload_json
            ) VALUES (?, ?, 'inbound', 'customer', ?, ?, ?, ?)`
          )
          .bind(
            crypto.randomUUID(),
            phone,
            message.id,
            message.type || 'unknown',
            message.text?.body || null,
            JSON.stringify(message)
          )
          .run();

        // Never send a second reply when Meta retries the same webhook.
        if (result.meta.changes > 0) {
          newMessages.push({ phone });
        }

        await db
          .prepare(
            `INSERT INTO whatsapp_sessions (
              phone_e164,
              current_step,
              draft_json
            ) VALUES (?, 'welcome_pending', '{}')
            ON CONFLICT(phone_e164) DO UPDATE SET
              updated_at = CURRENT_TIMESTAMP`
          )
          .bind(phone)
          .run();
      }
    }
  }

  return newMessages;
}

async function sendDevelopmentReplies(env, messages) {
  if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    return;
  }

  for (const message of messages) {
    const response = await fetch(
      `https://graph.facebook.com/v26.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: message.phone.slice(1),
          type: 'text',
          text: { body: DEVELOPMENT_REPLY },
        }),
      }
    );

    if (!response.ok) continue;

    const result = await response.json();
    const providerMessageId = result.messages?.[0]?.id;

    if (!providerMessageId) continue;

    await env.PACTSOL_DB
      .prepare(
        `INSERT OR IGNORE INTO whatsapp_messages (
          id,
          phone_e164,
          direction,
          source,
          provider_message_id,
          message_type,
          body,
          payload_json
        ) VALUES (?, ?, 'outbound', 'automation', ?, 'text', ?, ?)`
      )
      .bind(
        crypto.randomUUID(),
        message.phone,
        providerMessageId,
        DEVELOPMENT_REPLY,
        JSON.stringify(result)
      )
      .run();
  }
}

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? `+${digits}` : null;
}

async function isValidSignature(body, signature, appSecret) {
  if (!body || !signature || !appSecret) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const digest = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(body)
  );

  return timingSafeEqual(signature, `sha256=${toHex(digest)}`);
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  if (left.length !== right.length) return false;

  let result = 0;

  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return result === 0;
}
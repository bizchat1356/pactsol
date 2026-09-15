CREATE TABLE whatsapp_messages (
  id TEXT PRIMARY KEY,
  phone_e164 TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  source TEXT NOT NULL CHECK (source IN ('customer', 'automation', 'human')),
  provider_message_id TEXT UNIQUE,
  message_type TEXT NOT NULL,
  body TEXT,
  payload_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_whatsapp_messages_phone_created
  ON whatsapp_messages(phone_e164, created_at DESC);
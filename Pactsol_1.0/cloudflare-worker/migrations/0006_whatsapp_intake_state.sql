ALTER TABLE whatsapp_sessions
  ADD COLUMN revision INTEGER NOT NULL DEFAULT 0;

ALTER TABLE whatsapp_messages
  ADD COLUMN processing_status TEXT NOT NULL DEFAULT 'completed'
  CHECK (processing_status IN ('pending', 'completed', 'failed'));

ALTER TABLE whatsapp_messages
  ADD COLUMN processed_at TEXT;

ALTER TABLE whatsapp_messages
  ADD COLUMN processing_error TEXT;

CREATE INDEX idx_whatsapp_messages_processing
  ON whatsapp_messages(processing_status, created_at);
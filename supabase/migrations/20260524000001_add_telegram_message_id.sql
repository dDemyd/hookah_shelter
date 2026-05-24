-- ============================================================
-- Сховище — Telegram notification linkage on orders
-- ============================================================
-- We post one HTML message per new order into the staff Telegram group
-- with an inline keyboard. To later edit that message in place (e.g. on
-- status change, on accept/cancel) we need the message_id and chat_id
-- the message was posted to.

ALTER TABLE orders
  ADD COLUMN telegram_message_id bigint,
  ADD COLUMN telegram_chat_id    text;

COMMENT ON COLUMN orders.telegram_message_id IS
  'Telegram message_id of the notification posted to the staff chat. NULL until POST /api/orders successfully sends.';
COMMENT ON COLUMN orders.telegram_chat_id IS
  'Telegram chat_id where the notification lives. Stored as text because group IDs are negative bigints and we forward them straight to the Bot API.';

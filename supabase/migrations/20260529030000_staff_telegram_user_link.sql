ALTER TABLE staff_profiles
  ADD COLUMN user_telegram_id bigint UNIQUE;

COMMENT ON COLUMN staff_profiles.user_telegram_id IS
  'Telegram user id used to link staff actions from bot callbacks. Separate from telegram_chat_id, which is used for direct messages/reminders.';

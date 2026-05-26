-- Сховище — editable non-refundable price for day-loaner orders.
--
-- The refundable deposit is already stored separately as
-- app_settings.day_loaner_deposit and orders.deposit_amount. This setting
-- controls the actual order price/revenue for "кальян з собою на день".

INSERT INTO app_settings (key, value, description) VALUES
  ('day_loaner_price', '350', 'Ціна міксу/послуги для кальяну «з собою на день» (₴, без залогу)')
ON CONFLICT (key) DO NOTHING;

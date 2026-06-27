
ALTER TABLE public.leads
  ALTER COLUMN email DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS phone_country text,
  ADD COLUMN IF NOT EXISTS phone_country_code text,
  ADD COLUMN IF NOT EXISTS phone_dial_code text,
  ADD COLUMN IF NOT EXISTS whatsapp_number text;

DROP POLICY IF EXISTS "Public can submit leads" ON public.leads;

CREATE POLICY "Public can submit leads"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(trim(name)) BETWEEN 1 AND 120
  AND char_length(trim(message)) BETWEEN 1 AND 2000
  AND char_length(coalesce(business_category, '')) <= 80
  AND char_length(coalesce(custom_business_category, '')) <= 120
  AND char_length(coalesce(phone, '')) <= 40
  AND char_length(coalesce(whatsapp_number, '')) <= 40
  AND char_length(coalesce(phone_country, '')) <= 80
  AND char_length(coalesce(phone_country_code, '')) <= 4
  AND char_length(coalesce(phone_dial_code, '')) <= 8
  AND char_length(coalesce(whatsapp_number, '')) >= 6
  AND (email IS NULL OR (
    char_length(trim(email)) BETWEEN 3 AND 255
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ))
  AND preferred_contact_method = ANY (ARRAY['WhatsApp'::text, 'Mail'::text])
);

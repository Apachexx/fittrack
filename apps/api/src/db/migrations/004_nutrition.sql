CREATE TABLE IF NOT EXISTS foods (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  barcode      TEXT UNIQUE,
  brand        TEXT,
  calories     NUMERIC(7,2) NOT NULL,
  protein_g    NUMERIC(6,2) NOT NULL DEFAULT 0,
  carbs_g      NUMERIC(6,2) NOT NULL DEFAULT 0,
  fat_g        NUMERIC(6,2) NOT NULL DEFAULT 0,
  serving_size NUMERIC(6,2) DEFAULT 100,
  serving_unit TEXT DEFAULT 'g',
  is_verified  BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nutrition_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  food_id    UUID NOT NULL REFERENCES foods(id),
  logged_at  DATE NOT NULL,
  meal_type  TEXT NOT NULL CHECK (meal_type IN ('breakfast','lunch','dinner','snack')),
  servings   NUMERIC(5,2) NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS water_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  logged_at  DATE NOT NULL,
  amount_ml  INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_foods_name ON foods USING gin(to_tsvector('turkish', name));
CREATE INDEX IF NOT EXISTS idx_foods_barcode ON foods(barcode);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_date ON nutrition_logs(user_id, logged_at);
CREATE INDEX IF NOT EXISTS idx_water_logs_user_date ON water_logs(user_id, logged_at);

-- Örnek gıdalar
INSERT INTO foods (name, brand, calories, protein_g, carbs_g, fat_g, serving_size, serving_unit, is_verified) VALUES
  ('Tavuk Göğsü (Haşlama)', NULL, 165, 31, 0, 3.6, 100, 'g', true),
  ('Yumurta (Tam)', NULL, 155, 13, 1.1, 11, 100, 'g', true),
  ('Yulaf Ezmesi', NULL, 389, 17, 66, 7, 100, 'g', true),
  ('Beyaz Pirinç (Pişmiş)', NULL, 130, 2.7, 28, 0.3, 100, 'g', true),
  ('Tam Buğday Ekmeği', NULL, 247, 13, 41, 4.2, 100, 'g', true),
  ('Muz', NULL, 89, 1.1, 23, 0.3, 100, 'g', true),
  ('Elma', NULL, 52, 0.3, 14, 0.2, 100, 'g', true),
  ('Süt (%2)', NULL, 50, 3.4, 4.8, 2, 100, 'ml', true),
  ('Yoğurt (Sade)', NULL, 59, 10, 3.6, 0.4, 100, 'g', true),
  ('Fındık', NULL, 628, 15, 17, 61, 100, 'g', true),
  ('Zeytinyağı', NULL, 884, 0, 0, 100, 100, 'ml', true),
  ('Dana Kıyma (%20 yağ)', NULL, 215, 17, 0, 15, 100, 'g', true),
  ('Somon', NULL, 208, 20, 0, 13, 100, 'g', true),
  ('Ton Balığı (Konserve, Suda)', NULL, 116, 25.5, 0, 1, 100, 'g', true),
  ('Brokoli', NULL, 34, 2.8, 7, 0.4, 100, 'g', true)
ON CONFLICT DO NOTHING;

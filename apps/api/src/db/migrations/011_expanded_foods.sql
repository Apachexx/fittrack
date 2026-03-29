-- Add user_id to foods for custom foods support
ALTER TABLE foods ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_foods_user_id ON foods(user_id);

-- Expanded food database — all values per 100g/100ml unless noted
-- Uses INSERT WHERE NOT EXISTS to be safe on re-runs

INSERT INTO foods (name, brand, calories, protein_g, carbs_g, fat_g, serving_size, serving_unit, is_verified)
SELECT name, brand, calories, protein_g, carbs_g, fat_g, serving_size, serving_unit, true
FROM (VALUES
  -- TAHILLAR & EKMEK
  ('Bulgur (Pişmiş)',          NULL, 151,  5.6, 30.0,  0.7, 100, 'g'),
  ('Makarna (Pişmiş)',         NULL, 158,  5.8, 31.0,  0.9, 100, 'g'),
  ('Kepekli Makarna (Pişmiş)', NULL, 149,  5.9, 29.0,  1.0, 100, 'g'),
  ('Beyaz Ekmek',              NULL, 265,  9.0, 49.0,  3.2, 100, 'g'),
  ('Çavdar Ekmeği',            NULL, 259,  8.5, 48.0,  3.3, 100, 'g'),
  ('Basmati Pirinç (Pişmiş)',  NULL, 121,  2.5, 25.0,  0.3, 100, 'g'),
  ('Kinoa (Pişmiş)',           NULL, 120,  4.4, 22.0,  1.9, 100, 'g'),
  ('Mısır Gevreği',            NULL, 357,  7.0, 84.0,  1.0, 100, 'g'),
  ('Granola',                  NULL, 471, 10.0, 64.0, 20.0, 100, 'g'),
  ('Tortilla (Buğday)',        NULL, 306,  8.0, 50.0,  8.0, 100, 'g'),
  ('Pitta Ekmeği',             NULL, 275,  9.2, 55.0,  1.7, 100, 'g'),
  ('Krep',                     NULL, 217,  6.1, 26.0,  9.7, 100, 'g'),
  ('Galeta Unu',               NULL, 395, 11.0, 74.0,  5.0, 100, 'g'),
  -- ET & TAVUK
  ('Dana Biftek (Yağsız)',     NULL, 143, 26.0,  0.0,  4.0, 100, 'g'),
  ('Dana Kıyma (%10 Yağ)',     NULL, 176, 20.0,  0.0, 10.0, 100, 'g'),
  ('Tavuk But (Derisiz)',      NULL, 163, 23.0,  0.0,  8.0, 100, 'g'),
  ('Tavuk Kanat',              NULL, 203, 19.0,  0.0, 13.0, 100, 'g'),
  ('Hindi Göğsü',              NULL, 135, 30.0,  0.0,  1.0, 100, 'g'),
  ('Kuzu But',                 NULL, 258, 21.0,  0.0, 19.0, 100, 'g'),
  ('Domuz Eti (Bonfile)',      NULL, 143, 26.0,  0.0,  4.0, 100, 'g'),
  ('Sucuk (Dana)',             NULL, 451, 18.0,  1.0, 41.0, 100, 'g'),
  ('Köfte (Izgara)',           NULL, 200, 18.0,  5.0, 12.0, 100, 'g'),
  ('Tavuk Döner',              NULL, 195, 21.0,  6.0, 10.0, 100, 'g'),
  -- BALIK & DENİZ ÜRÜNLERİ
  ('Çipura (Izgara)',          NULL,  96, 21.0,  0.0,  1.5, 100, 'g'),
  ('Levrek (Izgara)',          NULL,  97, 19.0,  0.0,  2.0, 100, 'g'),
  ('Hamsi',                   NULL, 131, 20.0,  0.0,  5.5, 100, 'g'),
  ('Uskumru',                 NULL, 205, 19.0,  0.0, 13.0, 100, 'g'),
  ('Palamut',                 NULL, 172, 21.0,  0.0,  9.0, 100, 'g'),
  ('Karides',                 NULL,  85, 18.0,  0.9,  0.9, 100, 'g'),
  ('Ton Balığı (Zeytinyağlı)', NULL, 190, 18.0,  0.0, 13.0, 100, 'g'),
  -- SÜT ÜRÜNLERİ
  ('Tam Yağlı Süt',           NULL,  61,  3.2,  4.8,  3.3, 100, 'ml'),
  ('Yağsız Süt',              NULL,  34,  3.4,  5.0,  0.1, 100, 'ml'),
  ('Beyaz Peynir (Tam Yağlı)', NULL, 264, 16.0,  2.0, 21.0, 100, 'g'),
  ('Kaşar Peyniri',           NULL, 371, 25.0,  1.3, 30.0, 100, 'g'),
  ('Lor Peyniri',             NULL, 105,  9.0,  4.0,  6.0, 100, 'g'),
  ('Süzme Yoğurt',            NULL,  68,  8.0,  4.8,  1.0, 100, 'g'),
  ('Greek Yoğurt (%0)',       NULL,  57, 10.0,  3.6,  0.1, 100, 'g'),
  ('Kefir',                   NULL,  63,  3.4,  4.8,  3.6, 100, 'ml'),
  ('Mozzarella',              NULL, 280, 28.0,  3.1, 17.0, 100, 'g'),
  ('Çedar Peyniri',           NULL, 403, 25.0,  1.3, 33.0, 100, 'g'),
  ('Parmesan',                NULL, 431, 38.0,  4.0, 29.0, 100, 'g'),
  ('Cottage Cheese',          NULL,  98, 11.0,  3.4,  4.3, 100, 'g'),
  -- YUMURTA
  ('Yumurta Akı',             NULL,  52, 11.0,  0.7,  0.2, 100, 'g'),
  ('Haşlanmış Yumurta',       NULL, 155, 13.0,  1.1, 11.0, 100, 'g'),
  -- MEYVE
  ('Çilek',                   NULL,  32,  0.7,  7.7,  0.3, 100, 'g'),
  ('Portakal',                NULL,  47,  0.9, 12.0,  0.1, 100, 'g'),
  ('Kivi',                    NULL,  61,  1.1, 15.0,  0.5, 100, 'g'),
  ('Üzüm',                    NULL,  69,  0.7, 18.0,  0.2, 100, 'g'),
  ('Armut',                   NULL,  57,  0.4, 15.0,  0.1, 100, 'g'),
  ('Şeftali',                 NULL,  39,  0.9, 10.0,  0.3, 100, 'g'),
  ('Karpuz',                  NULL,  30,  0.6,  7.6,  0.2, 100, 'g'),
  ('Kavun',                   NULL,  34,  0.8,  8.0,  0.2, 100, 'g'),
  ('Kiraz',                   NULL,  50,  1.0, 12.0,  0.3, 100, 'g'),
  ('Ananas',                  NULL,  50,  0.5, 13.0,  0.1, 100, 'g'),
  ('Mango',                   NULL,  65,  0.5, 15.0,  0.3, 100, 'g'),
  ('Kuru Üzüm',               NULL, 299,  3.1, 79.0,  0.5, 100, 'g'),
  ('Kuru Kayısı',             NULL, 241,  3.4, 63.0,  0.5, 100, 'g'),
  -- SEBZE
  ('Ispanak',                 NULL,  23,  2.9,  3.6,  0.4, 100, 'g'),
  ('Domates',                 NULL,  18,  0.9,  3.9,  0.2, 100, 'g'),
  ('Salatalık',               NULL,  16,  0.7,  3.6,  0.1, 100, 'g'),
  ('Kırmızı Biber',           NULL,  31,  1.0,  7.3,  0.3, 100, 'g'),
  ('Havuç',                   NULL,  41,  0.9, 10.0,  0.2, 100, 'g'),
  ('Patates',                 NULL,  77,  2.0, 17.0,  0.1, 100, 'g'),
  ('Tatlı Patates',           NULL,  86,  1.6, 20.0,  0.1, 100, 'g'),
  ('Patlıcan',                NULL,  25,  1.0,  6.0,  0.2, 100, 'g'),
  ('Mantar',                  NULL,  22,  3.1,  3.3,  0.3, 100, 'g'),
  ('Mısır',                   NULL,  86,  3.2, 19.0,  1.2, 100, 'g'),
  ('Bezelye',                 NULL,  81,  5.4, 14.0,  0.4, 100, 'g'),
  ('Karnabahar',              NULL,  25,  1.9,  5.0,  0.3, 100, 'g'),
  ('Kabak',                   NULL,  17,  1.2,  3.1,  0.3, 100, 'g'),
  ('Pırasa',                  NULL,  61,  1.5, 14.0,  0.3, 100, 'g'),
  ('Marul',                   NULL,  15,  1.4,  2.9,  0.2, 100, 'g'),
  -- BAKLAGİLLER
  ('Nohut (Haşlanmış)',       NULL, 164,  8.9, 27.0,  2.6, 100, 'g'),
  ('Kırmızı Mercimek (Haşlanmış)', NULL, 116, 9.0, 20.0, 0.4, 100, 'g'),
  ('Yeşil Mercimek (Haşlanmış)', NULL, 116, 9.0, 20.0, 0.4, 100, 'g'),
  ('Fasulye (Haşlanmış)',     NULL, 127,  8.7, 22.8,  0.5, 100, 'g'),
  ('Edamame',                 NULL, 122, 11.0, 10.0,  5.0, 100, 'g'),
  ('Soya Fasulyesi (Haşlanmış)', NULL, 173, 17.0, 10.0, 9.0, 100, 'g'),
  -- KURUYEMIŞ & TOHUMLAR
  ('Badem',                   NULL, 579, 21.0, 22.0, 50.0, 100, 'g'),
  ('Ceviz',                   NULL, 654, 15.0, 14.0, 65.0, 100, 'g'),
  ('Kaju',                    NULL, 553, 18.0, 30.0, 44.0, 100, 'g'),
  ('Antep Fıstığı',           NULL, 560, 20.0, 28.0, 45.0, 100, 'g'),
  ('Yer Fıstığı',             NULL, 567, 26.0, 16.0, 49.0, 100, 'g'),
  ('Fıstık Ezmesi (Doğal)',   NULL, 588, 25.0, 20.0, 50.0, 100, 'g'),
  ('Chia Tohumu',             NULL, 486, 17.0, 42.0, 31.0, 100, 'g'),
  ('Keten Tohumu',            NULL, 534, 18.0, 29.0, 42.0, 100, 'g'),
  ('Susam',                   NULL, 573, 17.0, 23.0, 50.0, 100, 'g'),
  ('Tahini',                  NULL, 595, 17.0, 26.0, 54.0, 100, 'g'),
  -- YAĞ & TATLI
  ('Avokado',                 NULL, 160,  2.0,  9.0, 15.0, 100, 'g'),
  ('Tereyağı',                NULL, 717,  0.9,  0.1, 81.0, 100, 'g'),
  ('Bal',                     NULL, 304,  0.3, 82.0,  0.0, 100, 'g'),
  ('Bitter Çikolata (%70+)',  NULL, 598,  7.8, 46.0, 43.0, 100, 'g'),
  ('Fındık Kreması',          NULL, 539,  6.3, 57.0, 31.0, 100, 'g'),
  ('Portakal Suyu (Taze)',    NULL,  45,  0.7, 10.0,  0.2, 100, 'ml'),
  ('Soya Sütü (Şekersiz)',    NULL,  33,  2.9,  2.8,  1.8, 100, 'ml'),
  ('Badem Sütü (Şekersiz)',   NULL,  15,  0.6,  0.3,  1.3, 100, 'ml'),
  -- SPOR GIDA
  ('Whey Protein Tozu',       NULL, 400, 80.0, 10.0,  6.7, 100, 'g'),
  ('Kazein Protein Tozu',     NULL, 375, 75.0,  8.0,  5.0, 100, 'g'),
  ('Protein Bar',             NULL, 350, 20.0, 40.0, 10.0, 100, 'g'),
  ('Sporcu İçeceği',          NULL,  26,  0.0,  7.0,  0.0, 100, 'ml')
) AS v(name, brand, calories, protein_g, carbs_g, fat_g, serving_size, serving_unit)
WHERE NOT EXISTS (
  SELECT 1 FROM foods f WHERE f.name = v.name AND f.user_id IS NULL
);

-- Supplements catalog
CREATE TABLE IF NOT EXISTS supplements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  name_tr      TEXT NOT NULL,
  category     TEXT NOT NULL CHECK (category IN ('vitamin','mineral','sports','health')),
  default_dose TEXT NOT NULL,
  timing       TEXT,
  description  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- User's personal supplement stack
CREATE TABLE IF NOT EXISTS user_supplements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supplement_id   UUID NOT NULL REFERENCES supplements(id) ON DELETE CASCADE,
  dose            TEXT,
  schedule_time   TIME,
  is_active       BOOLEAN DEFAULT TRUE,
  last_notified   DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, supplement_id)
);

-- Daily intake logs (check-off)
CREATE TABLE IF NOT EXISTS supplement_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_supplement_id  UUID NOT NULL REFERENCES user_supplements(id) ON DELETE CASCADE,
  taken_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_supplement_id, taken_date)
);

-- Push subscriptions for web push notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL,
  p256dh     TEXT NOT NULL,
  auth_key   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Seed supplement catalog
INSERT INTO supplements (name, name_tr, category, default_dose, timing, description) VALUES
-- Vitamins
('Vitamin A',              'A Vitamini',           'vitamin',  '5000 IU',    'Kahvaltıyla',          'Göz sağlığı, bağışıklık sistemi ve cilt için temel vitamin'),
('Vitamin B1 (Thiamine)',  'B1 Vitamini (Tiamin)', 'vitamin',  '1.5 mg',     'Sabah',                'Enerji metabolizması ve sinir sistemi fonksiyonu için gerekli'),
('Vitamin B6',             'B6 Vitamini',          'vitamin',  '2 mg',       'Sabah',                'Protein metabolizması ve bağışıklık desteği sağlar'),
('Vitamin B12',            'B12 Vitamini',         'vitamin',  '1000 mcg',   'Sabah aç karnına',     'Sinir sistemi sağlığı ve kırmızı kan hücresi üretimi için kritik'),
('Vitamin C',              'C Vitamini',           'vitamin',  '1000 mg',    'Öğle yemeğiyle',       'Güçlü antioksidan; bağışıklık sistemi ve kolajen sentezi için'),
('Vitamin D3',             'D3 Vitamini',          'vitamin',  '2000 IU',    'Kahvaltıyla',          'Kemik sağlığı, bağışıklık ve kas fonksiyonu için hayati önem taşır'),
('Vitamin E',              'E Vitamini',           'vitamin',  '400 IU',     'Yemekle',              'Hücre koruyucu antioksidan; cilt ve kalp sağlığını destekler'),
('Vitamin K2',             'K2 Vitamini',          'vitamin',  '100 mcg',    'Yemekle',              'Kalsiyumun kemiklere yönlendirilmesinde D3 ile birlikte çalışır'),
('Folic Acid',             'Folik Asit',           'vitamin',  '400 mcg',    'Sabah',                'DNA sentezi ve hücre bölünmesi için temel; gebelikte kritik'),
('Biotin',                 'Biyotin',              'vitamin',  '5000 mcg',   'Sabah',                'Saç, tırnak ve cilt sağlığını destekler; yağ metabolizmasına katkı'),
('Niacin (B3)',            'Niasin (B3)',          'vitamin',  '20 mg',      'Yemekle',              'Enerji üretimi ve DNA onarımında rol oynar; kolesterol yönetimine katkı'),
('Pantothenic Acid (B5)',  'Pantotenik Asit (B5)', 'vitamin',  '5 mg',       'Sabah',                'Koenzim A sentezinde yer alır; enerji ve hormon üretimini destekler'),

-- Minerals
('Magnesium',              'Magnezyum',            'mineral',  '400 mg',     'Gece yatmadan önce',   'Kas gevşemesi, uyku kalitesi ve 300+ enzimatik reaksiyonda rol oynar'),
('Zinc',                   'Çinko',                'mineral',  '30 mg',      'Gece yatmadan önce',   'Testosteron üretimi, bağışıklık ve yara iyileşmesi için gerekli'),
('Calcium',                'Kalsiyum',             'mineral',  '1000 mg',    'Yemekle',              'Kemik ve diş sağlığının temeli; kas ve sinir iletiminde kritik'),
('Iron',                   'Demir',                'mineral',  '18 mg',      'Sabah aç karnına',     'Hemoglobin üretimi ve oksijen taşıması için hayati önem taşır'),
('Selenium',               'Selenyum',             'mineral',  '200 mcg',    'Sabah',                'Tiroid sağlığı ve antioksidan savunma sistemini destekler'),
('Iodine',                 'İyot',                 'mineral',  '150 mcg',    'Sabah',                'Tiroid hormonu sentezi için vazgeçilmez; metabolizma düzenlenmesinde rol oynar'),
('Chromium',               'Krom',                 'mineral',  '200 mcg',    'Yemekle',              'İnsülin duyarlılığını artırır; kan şekeri düzenlenmesine yardımcı'),
('Potassium',              'Potasyum',             'mineral',  '3500 mg',    'Gün boyunca',          'Kalp ritmi, kas fonksiyonu ve sıvı dengesi için kritik elektrolit'),

-- Sports Performance
('Creatine Monohydrate',   'Kreatin Monohidrat',   'sports',   '5 g',        'Antrenman sonrası',    'Güç ve patlayıcı performansı artıran en çok araştırılmış takviye'),
('Whey Protein',           'Whey Protein',         'sports',   '25 g',       'Antrenman sonrası',    'Hızlı sindirilen protein; kas onarımı ve büyümesi için ideal'),
('BCAA',                   'BCAA',                 'sports',   '10 g',       'Antrenman sırasında',  'Dallanmış zincirli amino asitler; kas yıkımını azaltır ve iyileşmeyi hızlandırır'),
('Glutamine',              'Glutamin',             'sports',   '10 g',       'Antrenman sonrası',    'Bağırsak sağlığını korur; yoğun antrenman sonrası kas iyileşmesini destekler'),
('Beta-Alanine',           'Beta-Alanin',          'sports',   '3.2 g',      'Antrenman öncesi',     'Kas asiditesini tamponlar; dayanıklılık ve kas yorulmasına karşı etkili'),
('Caffeine',               'Kafein',               'sports',   '200 mg',     'Antrenman 30 dk öncesi','Odaklanmayı ve performansı artırır; yağ yakımını destekler'),
('Arginine',               'Arginin',              'sports',   '5 g',        'Antrenman öncesi',     'Nitrik oksit üretimini artırarak kan akışını ve pompa hissini güçlendirir'),
('Citrulline Malate',      'Sitrülin Malat',       'sports',   '6 g',        'Antrenman öncesi',     'Performans ve dayanıklılığı artırır; kas yorgunluğunu azaltır'),
('HMB',                    'HMB',                  'sports',   '3 g',        'Gün boyunca',          'Kas yıkımını önler; yüksek yoğunluklu antrenmanlarda kas kütlesini korur'),
('L-Carnitine',            'L-Karnitin',           'sports',   '2 g',        'Antrenman öncesi',     'Yağ asitlerini enerji üretimi için mitokondriyadit taşır'),
('Casein Protein',         'Kazein Protein',       'sports',   '30 g',       'Gece yatmadan önce',   'Yavaş sindirim; uyku sırasında uzun süreli kas protein sentezini destekler'),
('Mass Gainer',            'Mass Gainer',          'sports',   '1 servis',   'Kahvaltıyla',          'Yüksek kalori ve protein; kilo almak isteyenler için karbonhidrat ve protein karışımı'),
('CLA',                    'CLA',                  'sports',   '3 g',        'Yemekle',              'Konjuge linoleik asit; vücut kompozisyonunu iyileştirir ve yağ yakımını destekler'),
('Electrolytes',           'Elektrolit',           'sports',   '1 servis',   'Antrenman sırasında',  'Sodyum, potasyum ve magnezyum dengesi; terleme sırasında performansı korur'),
('Collagen Peptides',      'Kolajen Peptit',       'sports',   '10 g',       'Sabah aç karnına',     'Eklem, bağ dokusu ve cilt sağlığını destekler; iyileşmeyi hızlandırır'),

-- Health & Wellness
('Omega-3 Fish Oil',       'Omega-3 Balık Yağı',   'health',   '2 g',        'Yemekle',              'EPA ve DHA; kalp, beyin ve eklem sağlığı için temel yağ asitleri'),
('Probiotics',             'Probiyotik',           'health',   '10 milyar CFU', 'Sabah aç karnına',  'Bağırsak florası dengesini korur; sindirim ve bağışıklık sistemini güçlendirir'),
('Coenzyme Q10',           'Koenzim Q10 (CoQ10)',  'health',   '100 mg',     'Sabah yemekle',        'Mitokondriyal enerji üretiminde kritik; kalp sağlığı ve antioksidan etki'),
('Ashwagandha',            'Ashwagandha',          'health',   '600 mg',     'Gece yatmadan önce',   'Kortizolü düşürür; stres, anksiyete ve uyku kalitesini iyileştirir'),
('Resveratrol',            'Resveratrol',          'health',   '250 mg',     'Yemekle',              'Güçlü antioksidan; kardiyovasküler sağlık ve yaşlanma karşıtı etkileri'),
('Curcumin',               'Kurkumin',             'health',   '500 mg',     'Yemekle',              'Zerdeçalın aktif bileşeni; güçlü antienflamatuvar ve antioksidan etki'),
('Spirulina',              'Spirulina',            'health',   '5 g',        'Sabah',                'Protein ve mikro besin zengini alg; antioksidan ve detoks desteği sağlar'),
('Melatonin',              'Melatonin',            'health',   '3 mg',       'Uyku 30 dk öncesi',    'Uyku kalitesini artırır; sirkadiyen ritmi düzenler ve jet lag''a karşı etkili'),
('Glucosamine',            'Glukozamin',           'health',   '1500 mg',    'Yemekle',              'Kıkırdak yapısını destekler; eklem ağrısını azaltır ve hareketliliği artırır'),
('Ginger Extract',         'Zencefil Ekstresi',    'health',   '1 g',        'Yemekle',              'Antienflamatuvar özelliği; bulantı, sindirim ve kas ağrısı üzerine olumlu etki'),
('Garlic Extract',         'Sarımsak Ekstresi',    'health',   '600 mg',     'Yemekle',              'Kardiyovasküler sağlık, bağışıklık güçlendirme ve antimikrobiyal etki'),
('Green Tea Extract',      'Yeşil Çay Ekstresi',   'health',   '400 mg',     'Sabah',                'EGCG içeriği ile metabolizmayı hızlandırır; antioksidan ve yağ yakımını destekler')

ON CONFLICT DO NOTHING;

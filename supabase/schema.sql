-- Arizon PDS Platform -- Full Schema + Seed Data
-- Run this entire script in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS shops (
  id TEXT PRIMARY KEY, name TEXT NOT NULL,
  district TEXT NOT NULL, taluk TEXT NOT NULL,
  lat NUMERIC(9,6) NOT NULL, lon NUMERIC(9,6) NOT NULL
);
CREATE TABLE IF NOT EXISTS commodities (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, unit TEXT NOT NULL DEFAULT 'kg'
);
CREATE TABLE IF NOT EXISTS ration_cards (
  id TEXT PRIMARY KEY, shop_id TEXT REFERENCES shops(id), category TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS card_members (
  id TEXT PRIMARY KEY, card_id TEXT REFERENCES ration_cards(id),
  name TEXT NOT NULL, phone_number TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY, card_id TEXT REFERENCES ration_cards(id),
  shop_id TEXT REFERENCES shops(id), commodity_id TEXT REFERENCES commodities(id),
  qty NUMERIC(10,2) NOT NULL, timestamp TIMESTAMPTZ DEFAULT NOW(), source TEXT DEFAULT 'epos'
);
CREATE TABLE IF NOT EXISTS deliveries (
  id TEXT PRIMARY KEY, shop_id TEXT REFERENCES shops(id),
  commodity_id TEXT REFERENCES commodities(id),
  dispatched_qty NUMERIC(10,2) NOT NULL, weighed_qty NUMERIC(10,2) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS confirmations (
  id TEXT PRIMARY KEY, transaction_id TEXT REFERENCES transactions(id),
  confirmed BOOLEAN NOT NULL, timestamp TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS stock_ledger (
  id SERIAL PRIMARY KEY, shop_id TEXT REFERENCES shops(id),
  commodity_id TEXT REFERENCES commodities(id), period TEXT NOT NULL,
  opening NUMERIC(10,2) DEFAULT 0, received NUMERIC(10,2) DEFAULT 0,
  sold NUMERIC(10,2) DEFAULT 0, closing NUMERIC(10,2) DEFAULT 0,
  UNIQUE(shop_id, commodity_id, period)
);
CREATE TABLE IF NOT EXISTS forecasts (
  id SERIAL PRIMARY KEY, shop_id TEXT REFERENCES shops(id),
  commodity_id TEXT REFERENCES commodities(id), period TEXT NOT NULL,
  predicted_qty NUMERIC(10,2) NOT NULL, basis TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS anomaly_flags (
  id SERIAL PRIMARY KEY, shop_id TEXT REFERENCES shops(id),
  period TEXT NOT NULL, trust_score NUMERIC(3,2) NOT NULL,
  reasoning TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY, card_id TEXT REFERENCES ration_cards(id),
  shop_id TEXT REFERENCES shops(id), commodity_id TEXT REFERENCES commodities(id),
  created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(card_id, shop_id, commodity_id)
);
CREATE TABLE IF NOT EXISTS sms_outbox (
  id SERIAL PRIMARY KEY, card_id TEXT REFERENCES ration_cards(id),
  phone_number TEXT NOT NULL, message TEXT NOT NULL, sent_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS unfulfilled_requests (
  id SERIAL PRIMARY KEY, card_id TEXT REFERENCES ration_cards(id),
  shop_id TEXT REFERENCES shops(id), commodity_id TEXT REFERENCES commodities(id),
  status TEXT DEFAULT 'pending', requested_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEED DATA
INSERT INTO shops VALUES
  ('shop-402','Kaloor Fair Price Shop #402','Ernakulam','Kanayannur',9.988661,76.290598),
  ('shop-114','Fort Kochi Fair Price Shop #114','Ernakulam','Fort Kochi',9.963100,76.242520),
  ('shop-308','Palarivattom Fair Price Shop #308','Ernakulam','Kanayannur',10.001700,76.308300),
  ('shop-012','Kazhakkoottam Fair Price Shop #012','Thiruvananthapuram','Thiruvananthapuram',8.572100,76.876900),
  ('shop-501','Aluva Fair Price Shop #501','Ernakulam','Aluva',10.100600,76.357400),
  ('shop-215','Thrippunithura Fair Price Shop #215','Ernakulam','Kanayannur',9.945300,76.351900)
ON CONFLICT (id) DO NOTHING;

INSERT INTO commodities VALUES
  ('comm-matta','Matta Rice','kg'),('comm-kuruva','Kuruva Rice','kg'),
  ('comm-wheat','Wheat','kg'),('comm-sugar','Fortified Sugar','kg'),
  ('comm-kerosene','Kerosene','liter')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ration_cards VALUES
  ('card-KL048821','shop-402','PHH'),('card-KL041234','shop-402','AAY'),
  ('card-KL115566','shop-114','PHH'),('card-KL309901','shop-308','NPS'),
  ('card-KL012345','shop-012','PHH')
ON CONFLICT (id) DO NOTHING;

INSERT INTO card_members VALUES
  ('mem-001','card-KL048821','Rajan Pillai','+919876543210'),
  ('mem-002','card-KL048821','Suma Rajan','+919876543211'),
  ('mem-003','card-KL048821','Arjun Rajan','+919876543212'),
  ('mem-004','card-KL041234','Mary Thomas','+919876500001'),
  ('mem-005','card-KL041234','Biju Thomas','+919876500002'),
  ('mem-006','card-KL115566','Sreekumar Nair','+919845001122'),
  ('mem-007','card-KL115566','Lekha Sreekumar','+919845001123'),
  ('mem-008','card-KL309901','Abdul Rahman','+919745112233'),
  ('mem-009','card-KL012345','Geetha Devi','+919745998877')
ON CONFLICT (id) DO NOTHING;

INSERT INTO stock_ledger (shop_id,commodity_id,period,opening,received,sold,closing) VALUES
  ('shop-402','comm-matta','2026-09',200,800,650,350),
  ('shop-402','comm-kuruva','2026-09',100,400,380,120),
  ('shop-402','comm-wheat','2026-09',80,300,290,90),
  ('shop-402','comm-sugar','2026-09',50,200,250,0),
  ('shop-402','comm-kerosene','2026-09',100,500,480,120),
  ('shop-114','comm-matta','2026-09',150,600,590,160),
  ('shop-114','comm-wheat','2026-09',60,250,248,62),
  ('shop-114','comm-sugar','2026-09',40,150,150,40),
  ('shop-114','comm-kerosene','2026-09',80,400,399,81),
  ('shop-308','comm-matta','2026-09',180,700,430,450),
  ('shop-308','comm-wheat','2026-09',70,280,100,250),
  ('shop-308','comm-kerosene','2026-09',90,450,200,340),
  ('shop-012','comm-matta','2026-09',220,900,880,240),
  ('shop-012','comm-wheat','2026-09',90,360,355,95),
  ('shop-012','comm-sugar','2026-09',55,220,219,56),
  ('shop-012','comm-kerosene','2026-09',110,550,548,112),
  ('shop-501','comm-matta','2026-09',160,650,610,200),
  ('shop-215','comm-matta','2026-09',140,560,555,30)
ON CONFLICT (shop_id,commodity_id,period) DO NOTHING;

INSERT INTO deliveries VALUES
  ('del-001','shop-402','comm-matta',1000,850,'2026-09-01 09:00:00+05:30'),
  ('del-002','shop-402','comm-wheat',300,299,'2026-09-01 09:30:00+05:30'),
  ('del-003','shop-114','comm-matta',600,598,'2026-09-02 10:00:00+05:30'),
  ('del-004','shop-308','comm-matta',700,700,'2026-09-03 11:00:00+05:30'),
  ('del-005','shop-012','comm-matta',900,760,'2026-09-04 09:00:00+05:30')
ON CONFLICT (id) DO NOTHING;

INSERT INTO transactions VALUES
  ('txn-001','card-KL048821','shop-402','comm-matta',10,'2026-09-05 10:15:00+05:30','epos'),
  ('txn-002','card-KL048821','shop-402','comm-sugar',2,'2026-09-05 10:16:00+05:30','epos'),
  ('txn-003','card-KL041234','shop-402','comm-matta',5,'2026-09-06 11:00:00+05:30','epos'),
  ('txn-004','card-KL041234','shop-402','comm-wheat',3,'2026-09-06 11:01:00+05:30','epos'),
  ('txn-005','card-KL115566','shop-114','comm-matta',10,'2026-09-07 09:30:00+05:30','epos'),
  ('txn-006','card-KL309901','shop-308','comm-matta',8,'2026-09-08 14:00:00+05:30','epos'),
  ('txn-007','card-KL012345','shop-012','comm-matta',10,'2026-09-09 10:00:00+05:30','epos'),
  ('txn-008','card-KL012345','shop-012','comm-kerosene',5,'2026-09-09 10:02:00+05:30','epos')
ON CONFLICT (id) DO NOTHING;

INSERT INTO confirmations VALUES
  ('conf-001','txn-001',true,'2026-09-05 10:20:00+05:30'),
  ('conf-002','txn-002',true,'2026-09-05 10:21:00+05:30'),
  ('conf-003','txn-005',true,'2026-09-07 09:35:00+05:30'),
  ('conf-004','txn-003',false,'2026-09-06 11:10:00+05:30')
ON CONFLICT (id) DO NOTHING;

INSERT INTO anomaly_flags (shop_id,period,trust_score,reasoning) VALUES
  ('shop-402','2026-09',0.42,'Warehouse dispatched 1000kg Matta Rice but e-Balance scale logged only 850kg received (15% variance). 5 of 8 transactions have zero citizen confirmation, indicating possible ghost biometric claims.'),
  ('shop-012','2026-09',0.55,'Delivery weight variance of 15.6% for Matta Rice. Citizen confirmation rate 12.5% against 8 e-POS transactions. Recommend field audit.')
ON CONFLICT DO NOTHING;

INSERT INTO forecasts (shop_id,commodity_id,period,predicted_qty,basis) VALUES
  ('shop-402','comm-matta','2026-10',920,'3-month moving average +2.5%. Festive season uplift applied.'),
  ('shop-114','comm-matta','2026-10',640,'Near-depletion in Sep. Increase allocation 7%.'),
  ('shop-308','comm-matta','2026-10',700,'Healthy closing stock. Historical average maintained.'),
  ('shop-012','comm-matta','2026-10',950,'High-demand shop. Consistent monthly off-take ~900kg.'),
  ('shop-501','comm-matta','2026-10',680,'Steady demand pattern, slight growth trend.'),
  ('shop-215','comm-matta','2026-10',580,'Near-depletion warning: closing 30kg below threshold.')
ON CONFLICT DO NOTHING;

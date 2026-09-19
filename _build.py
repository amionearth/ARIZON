import pathlib
def w(p,c):
 f=pathlib.Path(p)
 f.parent.mkdir(parents=True,exist_ok=True)
 f.write_text(c,encoding='utf-8')
 print('wrote',p)
c=''
c+='NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co\n'
c+='NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-key\n'
c+='GROK_API_KEY=placeholder-grok-key\n'
w('.env.local',c)
# schema.sql
c='-- ANAVANDI Schema\n'
c+='CREATE TABLE IF NOT EXISTS shops (\n'
c+=' id TEXT PRIMARY KEY,\n'
c+=' name TEXT NOT NULL,\n'
c+=' district TEXT NOT NULL,\n'
c+=' taluk TEXT NOT NULL,\n'
c+=' lat NUMERIC(9,6) NOT NULL,\n'
c+=' lon NUMERIC(9,6) NOT NULL\n'
c+=');\n'
c+='CREATE TABLE IF NOT EXISTS commodities (\n'
c+=' id TEXT PRIMARY KEY,\n'
c+=' name TEXT NOT NULL,\n'
c+=' unit TEXT NOT NULL DEFAULT chr(39)||chr(107)||chr(103)||chr(39)\n'
c+=');\n'
c+='CREATE TABLE IF NOT EXISTS ration_cards (\n'
c+=' id TEXT PRIMARY KEY,\n'
c+=' shop_id TEXT REFERENCES shops(id),\n'
c+=' category TEXT NOT NULL\n'
c+=');\n'
c+='CREATE TABLE IF NOT EXISTS card_members (\n'
c+=' id TEXT PRIMARY KEY,\n'
c+=' card_id TEXT REFERENCES ration_cards(id),\n'
c+=' name TEXT NOT NULL,\n'
c+=' phone_number TEXT NOT NULL\n'
c+=');\n'
c+='CREATE TABLE IF NOT EXISTS transactions (\n'
c+=' id TEXT PRIMARY KEY,\n'
c+=' card_id TEXT REFERENCES ration_cards(id),\n'
c+=' shop_id TEXT REFERENCES shops(id),\n'
c+=' commodity_id TEXT REFERENCES commodities(id),\n'
c+=' qty NUMERIC(10,2) NOT NULL,\n'
c+=' timestamp TIMESTAMPTZ DEFAULT NOW(),\n'
c+=' source TEXT DEFAULT chr(39)||chr(101)||chr(112)||chr(111)||chr(115)||chr(39)\n'
c+=');\n'
c+='CREATE TABLE IF NOT EXISTS deliveries (\n'
c+=' id TEXT PRIMARY KEY,\n'
c+=' shop_id TEXT REFERENCES shops(id),\n'
c+=' commodity_id TEXT REFERENCES commodities(id),\n'
c+=' dispatched_qty NUMERIC(10,2) NOT NULL,\n'
c+=' weighed_qty NUMERIC(10,2) NOT NULL,\n'
c+=' timestamp TIMESTAMPTZ DEFAULT NOW()\n'
c+=');\n'
c+='CREATE TABLE IF NOT EXISTS confirmations (\n'
c+=' id TEXT PRIMARY KEY,\n'
c+=' transaction_id TEXT REFERENCES transactions(id),\n'
c+=' confirmed BOOLEAN NOT NULL,\n'
c+=' timestamp TIMESTAMPTZ DEFAULT NOW()\n'
c+=');\n'
c+='CREATE TABLE IF NOT EXISTS stock_ledger (\n'
c+=' id SERIAL PRIMARY KEY,\n'
c+=' shop_id TEXT REFERENCES shops(id),\n'
c+=' commodity_id TEXT REFERENCES commodities(id),\n'
c+=' period TEXT NOT NULL,\n'
c+=' opening NUMERIC(10,2) DEFAULT 0,\n'
c+=' received NUMERIC(10,2) DEFAULT 0,\n'
c+=' sold NUMERIC(10,2) DEFAULT 0,\n'
c+=' closing NUMERIC(10,2) DEFAULT 0,\n'
c+=' UNIQUE(shop_id,commodity_id,period)\n'
c+=');\n'
c+='CREATE TABLE IF NOT EXISTS forecasts (\n'
c+=' id SERIAL PRIMARY KEY,\n'
c+=' shop_id TEXT REFERENCES shops(id),\n'
c+=' commodity_id TEXT REFERENCES commodities(id),\n'
c+=' period TEXT NOT NULL,\n'
c+=' predicted_qty NUMERIC(10,2) NOT NULL,\n'
c+=' basis TEXT NOT NULL\n'
c+=');\n'
c+='CREATE TABLE IF NOT EXISTS anomaly_flags (\n'
c+=' id SERIAL PRIMARY KEY,\n'
c+=' shop_id TEXT REFERENCES shops(id),\n'
c+=' period TEXT NOT NULL,\n'
c+=' trust_score NUMERIC(3,2) NOT NULL,\n'
c+=' reasoning TEXT NOT NULL,\n'
c+=' created_at TIMESTAMPTZ DEFAULT NOW()\n'
c+=');\n'
c+='CREATE TABLE IF NOT EXISTS subscriptions (\n'
c+=' id SERIAL PRIMARY KEY,\n'
c+=' card_id TEXT REFERENCES ration_cards(id),\n'
c+=' shop_id TEXT REFERENCES shops(id),\n'
c+=' commodity_id TEXT REFERENCES commodities(id),\n'
c+=' created_at TIMESTAMPTZ DEFAULT NOW(),\n'
c+=' UNIQUE(card_id,shop_id,commodity_id)\n'
c+=');\n'
c+='CREATE TABLE IF NOT EXISTS sms_outbox (\n'
c+=' id SERIAL PRIMARY KEY,\n'
c+=' card_id TEXT REFERENCES ration_cards(id),\n'
c+=' phone_number TEXT NOT NULL,\n'
c+=' message TEXT NOT NULL,\n'
c+=' sent_at TIMESTAMPTZ DEFAULT NOW()\n'
c+=');\n\n'
# Seed shops
c+="INSERT INTO shops VALUES\n"
c+="('shop-402','Kaloor FPS #402','Ernakulam','Kanayannur',9.988661,76.290598),\n"
c+="('shop-114','Fort Kochi FPS #114','Ernakulam','Fort Kochi',9.963100,76.242520),\n"
c+="('shop-308','Palarivattom FPS #308','Ernakulam','Kanayannur',10.001700,76.308300),\n"
c+="('shop-012','Kazhakkoottam FPS #012','TVM','TVM',8.572100,76.876900),\n"
c+="('shop-501','Aluva FPS #501','Ernakulam','Aluva',10.100600,76.357400),\n"
c+="('shop-215','Thrippunithura FPS #215','Ernakulam','Kanayannur',9.945300,76.351900)\n"
c+='ON CONFLICT (id) DO NOTHING;\n\n'
c+="INSERT INTO commodities VALUES\n"
c+="('comm-matta','Matta Rice','kg'),\n"
c+="('comm-kuruva','Kuruva Rice','kg'),\n"
c+="('comm-wheat','Wheat','kg'),\n"
c+="('comm-sugar','Fortified Sugar','kg'),\n"
c+="('comm-kerosene','Kerosene','liter')\n"
c+='ON CONFLICT (id) DO NOTHING;\n\n'
c+="INSERT INTO ration_cards VALUES\n"
c+="('card-KL048821','shop-402','PHH'),\n"
c+="('card-KL041234','shop-402','AAY'),\n"
c+="('card-KL115566','shop-114','PHH'),\n"
c+="('card-KL309901','shop-308','NPS'),\n"
c+="('card-KL012345','shop-012','PHH')\n"
c+='ON CONFLICT (id) DO NOTHING;\n\n'
c+="INSERT INTO card_members VALUES\n"
c+="('mem-001','card-KL048821','Rajan Pillai','+919876543210'),\n"
c+="('mem-002','card-KL048821','Suma Rajan','+919876543211'),\n"
c+="('mem-003','card-KL048821','Arjun Rajan','+919876543212'),\n"
c+="('mem-004','card-KL041234','Mary Thomas','+919876500001'),\n"
c+="('mem-005','card-KL041234','Biju Thomas','+919876500002'),\n"
c+="('mem-006','card-KL115566','Sreekumar Nair','+919845001122'),\n"
c+="('mem-007','card-KL115566','Lekha Sreekumar','+919845001123'),\n"
c+="('mem-008','card-KL309901','Abdul Rahman','+919745112233'),\n"
c+="('mem-009','card-KL012345','Geetha Devi','+919745998877')\n"
c+='ON CONFLICT (id) DO NOTHING;\n\n'
w('supabase/schema.sql',c)
# lib/supabase.ts
c="import { createClient } from '@supabase/supabase-js'\n"
c+="const url = process.env.NEXT_PUBLIC_SUPABASE_URL!\n"
c+="const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!\n"
c+="export const supabase = createClient(url, key)\n"
w('lib/supabase.ts',c)
# lib/tools.ts
c="import { supabase } from './supabase'\n"
c+="import { v4 as uuidv4 } from 'uuid'\n\n"
c+="export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'\n\n"
c+="function haversine(lat1:number,lon1:number,lat2:number,lon2:number):number{\n"
c+="  const R=6371\n"
c+="  const dLat=(lat2-lat1)*Math.PI/180\n"
c+="  const dLon=(lon2-lon1)*Math.PI/180\n"
c+="  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2\n"
c+="  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))\n"
c+='}\n\n'
c+="function stockStatus(closing:number):StockStatus{\n"
c+="  if(closing<=0) return 'OUT_OF_STOCK'\n"
c+="  if(closing<50) return 'LOW_STOCK'\n"
c+="  return 'IN_STOCK'\n"
c+='}\n\n'
c+="export async function get_stock(shop_id:string,commodity_id?:string){\n"
c+="  const period=new Date().toISOString().slice(0,7)\n"
c+="  let q=supabase.from('stock_ledger').select('*,shops(name),commodities(name,unit)').eq('shop_id',shop_id).eq('period',period)\n"
c+="  if(commodity_id) q=q.eq('commodity_id',commodity_id)\n"
c+="  const{data,error}=await q\n"
c+="  if(error) throw error\n"
c+="  return data\n"
c+='}\n\n'
c+="export async function get_nearby_shops(lat:number,lon:number,commodity_id?:string){\n"
c+="  const period=new Date().toISOString().slice(0,7)\n"
c+="  const{data:shops}=await supabase.from('shops').select('*')\n"
c+="  if(!shops) return []\n"
c+="  const results=await Promise.all(shops.map(async s=>{\n"
c+="    const dist=haversine(lat,lon,Number(s.lat),Number(s.lon))\n"
c+="    let q=supabase.from('stock_ledger').select('closing').eq('shop_id',s.id).eq('period',period)\n"
c+="    if(commodity_id) q=q.eq('commodity_id',commodity_id)\n"
c+="    const{data}=await q\n"
c+="    const closing=data?.[0]?.closing??0\n"
c+="    return{shop_id:s.id,name:s.name,district:s.district,taluk:s.taluk,distance_km:Math.round(dist*10)/10,stock_status:stockStatus(Number(closing))}\n"
c+="  }))\n"
c+="  return results.sort((a,b)=>a.distance_km-b.distance_km)\n"
c+='}\n\n'
c+="export async function log_delivery(shop_id:string,commodity_id:string,dispatched_qty:number,weighed_qty:number){\n"
c+="  const id=uuidv4()\n"
c+="  const mismatch=Math.abs(dispatched_qty-weighed_qty)/dispatched_qty>0.05\n"
c+="  await supabase.from('deliveries').insert({id,shop_id,commodity_id,dispatched_qty,weighed_qty})\n"
c+="  const period=new Date().toISOString().slice(0,7)\n"
c+="  await supabase.from('stock_ledger').upsert({shop_id,commodity_id,period,opening:0,received:weighed_qty,sold:0,closing:weighed_qty},{onConflict:'shop_id,commodity_id,period',ignoreDuplicates:false})\n"
c+="  await supabase.rpc('increment_stock',{p_shop:shop_id,p_comm:commodity_id,p_period:period,p_received:weighed_qty})\n"
c+="  return{delivery_id:id,mismatch_flag:mismatch}\n"
c+='}\n\n'
c+="export async function subscribe_notify(card_id:string,shop_id:string,commodity_id:string){\n"
c+="  const{data,error}=await supabase.from('subscriptions').upsert({card_id,shop_id,commodity_id},{onConflict:'card_id,shop_id,commodity_id'})\n"
c+="  if(error) throw error\n"
c+="  return{subscription_id:sub--}\n"
c+='}\n\n'
c+="export async function send_sms(card_id:string,message:string,all_members=true){\n"
c+="  const{data:members}=await supabase.from('card_members').select('phone_number').eq('card_id',card_id)\n"
c+="  if(!members) return{sent_to:[]}\n"
c+="  const phones=members.map(m=>m.phone_number)\n"
c+="  const rows=phones.map(phone=>({card_id,phone_number:phone,message}))\n"
c+="  await supabase.from('sms_outbox').insert(rows)\n"
c+="  return{sent_to:phones}\n"
c+='}\n\n'
c+="export async function compute_reconciliation(shop_id:string,period:string){\n"
c+="  const{data:ledger}=await supabase.from('stock_ledger').select('*').eq('shop_id',shop_id).eq('period',period)\n"
c+="  if(!ledger?.length) return{error:'No ledger data'}\n"
c+="  const results=ledger.map(row=>{\n"
c+="    const calc_closing=Number(row.opening)+Number(row.received)-Number(row.sold)\n"
c+="    const variance=row.received>0?Math.abs(Number(row.closing)-calc_closing)/Number(row.received)*100:0\n"
c+="    return{...row,calc_closing,variance_pct:Math.round(variance*100)/100}\n"
c+="  })\n"
c+="  return results\n"
c+='}\n\n'

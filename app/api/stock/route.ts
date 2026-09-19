// app/api/stock/route.ts
//
// Ration-shop stock bulk operations:
//   GET  /api/stock?action=template      -> download .xlsx template
//   POST /api/stock  (action=preview)    -> parse uploaded .xlsx, return a diff
//   POST /api/stock  (action=commit)     -> apply the diff to the data store
//
import { NextRequest } from 'next/server';
import { read as xlsxRead, utils as xlsxUtils, write as xlsxWrite } from 'xlsx';
import { store } from '@/lib/data';

export const dynamic = 'force-dynamic';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function normalizeHeader(s: string): string {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

const HEADER_ALIASES: Record<string, string> = {
  shop_id: 'shop_id',
  shopid: 'shop_id',
  shop: 'shop_id',
  fps: 'shop_id',
  period: 'period',
  month: 'period',
  commodity_id: 'commodity_id',
  commodityid: 'commodity_id',
  commodity: 'commodity_id',
  item: 'commodity_id',
  commodity_name: 'commodity_name',
  item_name: 'commodity_name',
  name: 'commodity_name',
  unit: 'unit',
  uom: 'unit',
  opening_balance: 'opening',
  opening: 'opening',
  received: 'received',
  receipt: 'received',
  receipts: 'received',
  qty_received: 'received',
  delivered: 'delivered',
  dispatched: 'delivered',
  qty_delivered: 'delivered',
  sold: 'sold',
  sales: 'sold',
  qty_sold: 'sold',
  closing_balance: 'closing',
  closing: 'closing',
  closing_stock: 'closing',
  storage_capacity: 'storage_capacity',
  capacity: 'storage_capacity',
  remarks: 'remarks',
  notes: 'remarks',
};

function coerceNumber(v: unknown, fallback = 0): number {
  if (v === null || v === undefined || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function parseSheet(rows: Record<string, unknown>[]) {
  const cleaned: Record<string, string | number>[] = [];
  const errors: string[] = [];

  rows.forEach((raw, idx) => {
    const mapped: Record<string, string | number> = {};
    Object.entries(raw).forEach(([k, v]) => {
      const key = HEADER_ALIASES[normalizeHeader(k)];
      if (!key) return;
      if (
        ['opening', 'received', 'sold', 'closing', 'storage_capacity', 'delivered'].includes(key)
      ) {
        mapped[key] = coerceNumber(v);
      } else {
        mapped[key] = String(v ?? '').trim();
      }
    });

    const required = ['shop_id', 'commodity_id', 'period'] as const;
    for (const r of required) {
      if (!mapped[r]) {
        errors.push(`Row ${idx + 2}: missing required column "${r}"`);
        return;
      }
    }

    // Be lenient: if the user accidentally types "Matta Rice" for commodity_id,
    // map it to the canonical id.
    if (mapped.commodity_id && !String(mapped.commodity_id).startsWith('comm-')) {
      const match = store.commodities.find(
        (c) =>
          c.name.toLowerCase() === String(mapped.commodity_id).toLowerCase() ||
          c.id === String(mapped.commodity_id),
      );
      if (match) mapped.commodity_id = match.id;
    }

    if (mapped.shop_id && !String(mapped.shop_id).startsWith('shop-')) {
      const match = store.shops.find(
        (s) =>
          s.id.toLowerCase() === String(mapped.shop_id).toLowerCase() ||
          s.name.toLowerCase() === String(mapped.shop_id).toLowerCase(),
      );
      if (match) mapped.shop_id = match.id;
    }

    if (!mapped.period || !/^\d{4}-\d{2}$/.test(String(mapped.period))) {
      mapped.period = '2026-09';
    }

    cleaned.push(mapped);
  });

  return { cleaned, errors };
}

function diffRows(cleaned: Record<string, string | number>[]) {
  const diff: any[] = [];
  const invalid: { row: number; reason: string }[] = [];

  cleaned.forEach((r, idx) => {
    const shop = store.getShopById(String(r.shop_id));
    if (!shop) {
      invalid.push({ row: idx + 2, reason: `Unknown shop_id "${r.shop_id}"` });
      return;
    }
    const comm = store.getCommodityById(String(r.commodity_id));
    if (!comm) {
      invalid.push({ row: idx + 2, reason: `Unknown commodity_id "${r.commodity_id}"` });
      return;
    }

    const period = String(r.period);
    const existing = store.getLedgerRow(String(r.shop_id), String(r.commodity_id), period);
    const previous = existing
      ? {
          opening: existing.opening,
          received: existing.received,
          sold: existing.sold,
          closing: existing.closing,
        }
      : null;

    diff.push({
      shop_id: String(r.shop_id),
      commodity_id: String(r.commodity_id),
      period,
      shop_name: shop.name,
      commodity_name: comm.name,
      unit: comm.unit,
      opening: 'opening' in r ? Number(r.opening) : previous?.opening ?? 0,
      received: 'received' in r ? Number(r.received) : previous?.received ?? 0,
      sold: 'sold' in r ? Number(r.sold) : previous?.sold ?? 0,
      closing: 'closing' in r ? Number(r.closing) : previous?.closing ?? 0,
      storage_capacity:
        'storage_capacity' in r && r.storage_capacity !== ''
          ? Number(r.storage_capacity)
          : undefined,
      previous,
    });
  });

  return { diff, invalid };
}

/* -------------------------------------------------------------------------- */
/* GET - download template                                                   */
/* -------------------------------------------------------------------------- */

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action') ?? 'template';

  if (action === 'template') {
    const wb = xlsxUtils.book_new();

    const headers = [
      'Shop ID',
      'Shop Name',
      'District',
      'Taluk',
      'Period (YYYY-MM)',
      'Commodity ID',
      'Commodity Name',
      'Unit',
      'Opening Balance',
      'Received',
      'Sold',
      'Delivered',
      'Closing Balance',
      'Storage Capacity (kg)',
      'Remarks',
    ];

    const sample = [
      [
        'shop-402',
        'Kaloor Fair Price Shop #402',
        'Ernakulam',
        'Kanayannur',
        '2026-09',
        'comm-matta',
        'Matta Rice',
        'kg',
        200,
        800,
        650,
        1000,
        350,
        5000,
        'Onam festive demand uplift applied',
      ],
      [
        'shop-402',
        'Kaloor Fair Price Shop #402',
        'Ernakulam',
        'Kanayannur',
        '2026-09',
        'comm-wheat',
        'Wheat',
        'kg',
        80,
        300,
        290,
        300,
        90,
        2000,
        '',
      ],
    ];
    const ws1 = xlsxUtils.aoa_to_sheet([headers, ...sample]);
    (ws1 as any)['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 2, 14) }));
    (ws1 as any)['!freeze'] = { ySplit: 1 };

    const shopList = store.shops.map((s) => [s.id, s.name, s.district, s.taluk]);
    const commodityList = store.commodities.map((c) => [c.id, c.name, c.unit]);

    xlsxUtils.book_append_sheet(wb, ws1, 'Stock Ledger');

    const wsShops = xlsxUtils.aoa_to_sheet([
      ['Shop ID', 'Shop Name', 'District', 'Taluk'],
      ...shopList,
    ]);
    (wsShops as any)['!cols'] = [
      { wch: 14 },
      { wch: 38 },
      { wch: 18 },
      { wch: 20 },
    ];
    xlsxUtils.book_append_sheet(wb, wsShops, 'Shops');

    const wsComm = xlsxUtils.aoa_to_sheet([
      ['Commodity ID', 'Commodity Name', 'Unit'],
      ...commodityList,
    ]);
    (wsComm as any)['!cols'] = [{ wch: 16 }, { wch: 24 }, { wch: 8 }];
    xlsxUtils.book_append_sheet(wb, wsComm, 'Commodities');

    const wsHelp = xlsxUtils.aoa_to_sheet([
      ['Arizon - FPS Stock Bulk Upload Template'],
      [],
      ['Purpose', 'Bulk-upload opening balance, receipts, sales and storage capacity for one or more FPS.'],
      ['Period', 'Default is 2026-09 (current month). Use YYYY-MM format.'],
      ['How to upload', '1. Fill the Stock Ledger sheet. 2. Save the file. 3. Upload via Seller portal.'],
      ['Tip', 'You can paste commodity names (e.g. "Matta Rice") instead of IDs - they will be auto-resolved.'],
      ['Validation', 'Unknown shop/commodity IDs return a row-level error in the preview before commit.'],
      ['Audit', 'Every committed upload is logged with timestamp; AI Agent recomputes the trust score.'],
    ]);
    (wsHelp as any)['!cols'] = [{ wch: 14 }, { wch: 90 }];
    xlsxUtils.book_append_sheet(wb, wsHelp, 'Instructions');

    const buf = xlsxWrite(wb, { type: 'buffer', bookType: 'xlsx' });
    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="arizon-stock-template-${new Date().toISOString().slice(0, 10)}.xlsx"`,
        'Content-Length': String((buf as Buffer).byteLength),
      },
    });
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
}

/* -------------------------------------------------------------------------- */
/* POST - preview or commit                                                  */
/* -------------------------------------------------------------------------- */

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') ?? req.headers.get('x-action') ?? 'preview';
    const contentType = req.headers.get('content-type') ?? '';

    if (!contentType.includes('multipart/form-data')) {
      return Response.json(
        { error: 'Expected multipart/form-data with the .xlsx file as "file"' },
        { status: 400 },
      );
    }

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return Response.json({ error: 'Missing "file" in form data' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = xlsxRead(buffer, { type: 'buffer' });
    const firstSheet =
      wb.SheetNames.find((s) => /stock|ledger|main|sheet1/i.test(s)) ?? wb.SheetNames[0];
    const ws = wb.Sheets[firstSheet];
    if (!ws)
      return Response.json({ error: 'No sheet found in uploaded workbook' }, { status: 400 });

    const raw: Record<string, unknown>[] = xlsxUtils.sheet_to_json(ws, { defval: '' });
    const { cleaned, errors } = parseSheet(raw);
    const { diff, invalid } = diffRows(cleaned);

    if (action === 'commit' && invalid.length === 0 && diff.length > 0) {
      let committed = 0;
      for (const row of diff) {
        const existing = store.getLedgerRow(row.shop_id, row.commodity_id, row.period);
        if (existing) {
          existing.opening = row.opening;
          existing.received = row.received;
          existing.sold = row.sold;
          existing.closing = row.closing;
        } else {
          store.stockLedger.push({
            id: store.nextLedgerId(),
            shop_id: row.shop_id,
            commodity_id: row.commodity_id,
            period: row.period,
            opening: row.opening,
            received: row.received,
            sold: row.sold,
            closing: row.closing,
          });
        }
        // Recompute trust score so the dashboard reflects the new ledger.
        store.recomputeAnomaly(row.shop_id, row.period);
        committed++;
      }
      return Response.json({
        success: true,
        action: 'commit',
        committed,
        invalid,
        parse_errors: errors,
        rows: diff,
      });
    }

    return Response.json({
      action: 'preview',
      rows: diff,
      invalid,
      parse_errors: errors,
      summary: {
        total_rows: raw.length,
        valid_rows: diff.length,
        invalid_rows: invalid.length,
        period_counts: diff.reduce<Record<string, number>>((acc, r) => {
          acc[r.period] = (acc[r.period] ?? 0) + 1;
          return acc;
        }, {}),
      },
    });
  } catch (e) {
    console.error('stock upload error:', e);
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
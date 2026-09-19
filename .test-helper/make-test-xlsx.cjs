// Helper: build a sample workbook to test the upload pipeline.
// Lives inside the project so it can resolve the `xlsx` package from node_modules.
const XLSX = require('xlsx');

const wb = XLSX.utils.book_new();

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

const rows = [
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
    950,
    720,
    1200,
    430,
    5000,
    'Bumped up for Onam',
  ],
  [
    'shop-402',
    'Kaloor Fair Price Shop #402',
    'Ernakulam',
    'Kanayannur',
    '2026-09',
    'comm-sugar',
    'Fortified Sugar',
    'kg',
    50,
    300,
    330,
    400,
    20,
    1500,
    'Restock arrived',
  ],
  [
    'shop-114',
    'Fort Kochi Fair Price Shop #114',
    'Ernakulam',
    'Fort Kochi',
    '2026-09',
    'comm-matta',
    'Matta Rice',
    'kg',
    150,
    750,
    720,
    800,
    180,
    3500,
    '',
  ],
];

const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
XLSX.utils.book_append_sheet(wb, ws, 'Stock Ledger');
const wbout = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
process.stdout.write(wbout);

// lib/translations.ts - Bilingual strings used across all portals.
// Use t.<key> in any page. Add keys here as the UI grows.

export type Language = 'en' | 'ml';

type Dict = Record<string, string>;

const en: Dict = {
  // App / nav
  appName: 'Arizon — Smart PDS',
  tagline: 'Kerala Civil Supplies & Consumer Affairs',
  customer: 'Customer',
  seller: 'Seller',
  supplier: 'Supplier',
  government: 'Government',
  login: 'Login',
  logout: 'Logout',
  changeLanguage: 'മലയാളം',

  // Generic
  back: 'Back',
  refresh: 'Refresh',
  loading: 'Loading...',
  saving: 'Saving...',
  submit: 'Submit',
  cancel: 'Cancel',
  yes: 'Yes',
  no: 'No',
  error: 'Something went wrong. Please try again.',

  // Login
  rationCardId: 'Ration Card ID',
  phone: 'Phone Number',
  requestOtp: 'Request OTP',
  enterOtp: 'Enter OTP',
  verifyEnter: 'Verify & Enter Portal',
  loginTitle: 'Citizen PDS Portal',
  loginSubtitle:
    'Frictionless password-less access using your Ration Card ID and Aadhaar-linked phone.',
  demoOtpHint: 'Hackathon Demo: Enter 1234',
  changeCard: 'Change Card',

  // Customer
  cust_title: 'Citizen Stock Finder',
  cust_subtitle:
    'Check live ration stock at your nearest Fair Price Shop. Subscribe for SMS arrival alerts.',
  search_shop: 'Search shops or localities',
  select_commodity: 'All Commodities',
  nearby_shops_title: 'Nearby Ration Shops',
  item_availability: 'Item Availability',
  purchase_history: 'Purchase History',
  confirm_purchase: 'Confirm Purchase',
  flag_dispute: 'Flag as Unauthorised',
  entitlement_title: 'My Ration Card',
  card_number: 'Card Number',
  category: 'Card Category',
  family_members: 'Family Members (Aadhaar-Linked)',
  chat_title: 'Arizon AI Agent — Citizen Assistant',
  chat_placeholder: 'Ask the AI Agent about stock in English or Malayalam...',
  notify_me: 'Notify Me When Available',
  subscribed: 'Subscribed to SMS Alert',

  // Seller
  seller_title: 'FPS Dealer Operations',
  seller_subtitle:
    'Verify e-Balance scale weight, process biometric sales, and broadcast household SMS.',
  shop_select: 'Selected FPS Shop',
  stock_ledger_title: 'Live Stock Ledger',
  opening: 'Opening',
  received: 'Received',
  sold_epos: 'e-POS Sold',
  closing_balance: 'Closing',
  goods_received_title: 'Goods Received (e-Balance Verification)',
  goods_received_desc:
    'Enter challan weight and electronic-scale weight. Mismatches >5% are flagged for Taluk audit.',
  dispatch_qty: 'Dispatched Qty',
  scale_qty: 'Weighed Qty (e-Balance)',
  submit_receipt: 'Verify & Update Ledger',
  mismatch_alert: 'Scale Mismatch Detected!',
  match_success: 'Verified At Scale',
  epos_sim_title: 'e-POS Biometric Sale Simulator',
  epos_sim_desc:
    'Simulate a biometric sale to a cardholder. Auto-deducts stock and broadcasts SMS to all Aadhaar-linked family members.',
  simulate_sale: 'Process Biometric Sale & Broadcast SMS',
  seller_ai_title: 'Arizon AI Agent — Dealer Consultant',
  seller_ai_placeholder: 'Ask the AI Agent about stock, burn rate, or restock planning...',

  // Supplier
  supplier_title: 'Taluk Supply Officer Console',
  supplier_subtitle:
    'Aggregate taluk-level demand, view AI forecasts, and run allocation vectors.',
  optimizer_title: 'Arizon AI Agent — Supply Optimizer',
  optimizer_desc:
    'Cross-references current stock, citizen stockout requests, and forecast to recommend dispatch vectors.',
  generate_opt: 'Generate Optimization Matrix',
  dispatch_schedule: 'Dispatch Schedule & Scale Verification',
  forecast_title: '3-Month Demand Forecast',

  // Gov
  gov_dash_title: 'State Civil Supplies Directorate',
  gov_dash_subtitle:
    'Live state-wide audit: 3-signal trust scoring, anomaly heatmap, reconciliation matrix and SMS fan-out oversight.',
  run_reconciliation: 'Run Month-End Carryover',
  heatmap_title: 'Multi-Signal Anti-Leakage Heatmap',
  heatmap_desc:
    'Each shop scored on e-Balance variance ($S_1$), citizen confirmation ($S_2$) and transaction velocity ($S_3$).',
  plain_reasoning: 'AI Audit Inspector',
  reconcile_matrix_title: 'State-Wide Stock Reconciliation Matrix',
  sms_outbox_title: 'Live Multi-Member SMS Outbox',
  sms_outbox_desc:
    'Every e-POS sale broadcasts an SMS to all Aadhaar-linked family members. Every delivery triggers SMS to waiting subscribers.',

  // Stock badge
  inStock: 'In Stock',
  lowStock: 'Low Stock',
  outOfStock: 'Out of Stock',

  // Tool calls
  toolCalls: 'Tool Calls',
  toolCall: 'Tool Call',
};

const ml: Dict = {
  // App / nav
  appName: 'അരിസോൺ - സ്മാർട്ട് PDS',
  tagline: 'കേരള സിവിൽ സപ്ലൈസ് & ഉപഭോക്തൃ കാര്യ',
  customer: 'ഉപഭോക്താവ്',
  seller: 'വ്യാപാരി',
  supplier: 'വിതരണക്കാരൻ',
  government: 'സർക്കാർ',
  login: 'ലോഗിൻ',
  logout: 'ലോഗൗട്ട്',
  changeLanguage: 'English',

  // Generic
  back: 'തിരികെ',
  refresh: 'പുതുക്കുക',
  loading: 'ലോഡ് ചെയ്യുന്നു...',
  saving: 'സംരക്ഷിക്കുന്നു...',
  submit: 'സമർപ്പിക്കുക',
  cancel: 'റദ്ദാക്കുക',
  yes: 'ഉവ്വ്',
  no: 'ഇല്ല',
  error: 'എന്തോ തെറ്റ് സംഭവിച്ചു. ദയവായി വീണ്ടും ശ്രമിക്കൂ.',

  // Login
  rationCardId: 'റേഷൻ കാർഡ് ഐഡി',
  phone: 'ഫോൺ നമ്പർ',
  requestOtp: 'OTP അഭ്യർത്ഥിക്കുക',
  enterOtp: 'OTP നൽകുക',
  verifyEnter: 'പരിശോധിച്ച് പോർട്ടൽ പ്രവേശിക്കുക',
  loginTitle: 'പൗര PDS പോർട്ടൽ',
  loginSubtitle:
    'നിങ്ങളുടെ റേഷൻ കാർഡ് ഐഡിയും ആധാർ-ലിങ്ക്ഡ് ഫോൺ നമ്പറും ഉപയോഗിച്ച് പാസ്‌വേഡ് ഇല്ലാതെ ലോഗിൻ.',
  demoOtpHint: 'ഹാക്കത്തോൺ ഡെമോ: 1234 നൽകൂ',
  changeCard: 'കാർഡ് മാറ്റുക',

  // Customer
  cust_title: 'സ്റ്റോക്ക് കണ്ടെത്തൽ പോർട്ടൽ',
  cust_subtitle:
    'അടുത്തുള്ള റേഷൻ കടയിലെ സ്റ്റോക്ക് പരിശോധിക്കുക. ലഭ്യമാകുമ്പോൾ SMS അലർട്ട് നേടുക.',
  search_shop: 'കട അല്ലെങ്കിൽ പ്രദേശം തിരയുക',
  select_commodity: 'എല്ലാ ഉൽപ്പന്നങ്ങളും',
  nearby_shops_title: 'അടുത്തുള്ള റേഷൻ കടകൾ',
  item_availability: 'ഉൽപ്പന്ന ലഭ്യത',
  purchase_history: 'വാങ്ങൽ ചരിത്രം',
  confirm_purchase: 'വാങ്ങൽ സ്ഥിരീകരിക്കുക',
  flag_dispute: 'അനധികൃതമെന്ന് ഫ്ലാഗ് ചെയ്യുക',
  entitlement_title: 'എന്റെ റേഷൻ കാർഡ്',
  card_number: 'കാർഡ് നമ്പർ',
  category: 'കാർഡ് വിഭാഗം',
  family_members: 'കുടുംബാംഗങ്ങൾ (ആധാർ-ലിങ്ക്ഡ്)',
  chat_title: 'Arizon AI ഏജന്റ് — പൗര സഹായി',
  chat_placeholder: 'AI ഏജന്റിനോട് ഇംഗ്ലീഷിലോ മലയാളത്തിലോ ചോദിക്കൂ...',
  notify_me: 'ലഭ്യമാകുമ്പോൾ അറിയിക്കൂ',
  subscribed: 'SMS അലർട്ടിൽ ചേർന്നു',

  // Seller
  seller_title: 'റേഷൻ വ്യാപാരി കൺസോൾ',
  seller_subtitle:
    'e-Balance സ്കെയിൽ വെരിഫിക്കേഷൻ, ബയോമെട്രിക് വിൽപ്പന, കുടുംബ SMS ഫാൻ-ഔട്ട്.',
  shop_select: 'തിരഞ്ഞെടുത്ത കട',
  stock_ledger_title: 'തത്സമയ സ്റ്റോക്ക് ലെഡ്ജർ',
  opening: 'ആരംഭ ബാലൻസ്',
  received: 'ലഭിച്ചത്',
  sold_epos: 'വിറ്റത്',
  closing_balance: 'ക്ലോസിംഗ്',
  goods_received_title: 'സ്വീകൃതി (e-Balance വെരിഫിക്കേഷൻ)',
  goods_received_desc:
    'ചലാൻ ഭാരവും ഇലക്ട്രോണിക് സ്കെയിൽ ഭാരവും നൽകൂ. 5% വ്യത്യാസം ഉണ്ടെങ്കിൽ താലൂക്ക് ഓഡിറ്റിന് ഫ്ലാഗ്.',
  dispatch_qty: 'അയച്ച അളവ്',
  scale_qty: 'തൂക്കിയ അളവ് (e-Balance)',
  submit_receipt: 'സ്ഥിരീകരിച്ച് ലെഡ്ജർ അപ്ഡേറ്റ് ചെയ്യൂ',
  mismatch_alert: 'സ്കെയിൽ പൊരുത്തക്കേട്!',
  match_success: 'സ്കെയിലിൽ സ്ഥിരീകരിച്ചു',
  epos_sim_title: 'e-POS ബയോമെട്രിക് സിമുലേറ്റർ',
  epos_sim_desc:
    'ഒരു കാർഡുടമയ്ക്ക് ബയോമെട്രിക് വിൽപ്പന സിമുലേറ്റ് ചെയ്യൂ. സ്റ്റോക്ക് കുറയുകയും കുടുംബത്തിലേക്ക് SMS അയക്കുകയും ചെയ്യുന്നു.',
  simulate_sale: 'ബയോമെട്രിക് വിൽപ്പന നടത്തൂ',
  seller_ai_title: 'Arizon AI ഏജന്റ് — വ്യാപാര ഉപദേശകൻ',
  seller_ai_placeholder: 'AI ഏജന്റിനോട് സ്റ്റോക്ക്, ബേൺ റേറ്റ്, റീസ്റ്റോക്ക് എന്നിവയെക്കുറിച്ച് ചോദിക്കൂ...',

  // Supplier
  supplier_title: 'താലൂക്ക് സപ്ലൈ കൺസോൾ',
  supplier_subtitle:
    'താലൂക്ക് തലത്തിൽ ഡിമാൻഡ്, AI ഫോർകാസ്റ്റ്, ഒപ്റ്റിമൽ അലോക്കേഷൻ വെക്ടർ.',
  optimizer_title: 'Arizon AI ഏജന്റ് — സപ്ലൈ ഒപ്റ്റിമൈസർ',
  optimizer_desc:
    'നിലവിലെ സ്റ്റോക്ക്, പൗര ഡിമാൻഡ്, ഫോർകാസ്റ്റ് എന്നിവ സംയോജിപ്പിച്ച് വിതരണ വെക്ടർ ശുപാർശ ചെയ്യുന്നു.',
  generate_opt: 'ഒപ്റ്റിമൈസേഷൻ മാട്രിക്സ്',
  dispatch_schedule: 'ഡിസ്പാച്ച് ഷെഡ്യൂൾ & സ്കെയിൽ വെരിഫിക്കേഷൻ',
  forecast_title: '3-മാസ ഡിമാൻഡ് പ്രവചനം',

  // Gov
  gov_dash_title: 'സംസ്ഥാന സിവിൽ സപ്ലൈസ് ഡയറക്ടറേറ്റ്',
  gov_dash_subtitle:
    '3-സിഗ്നൽ ട്രസ്റ്റ് സ്കോറിംഗ്, അനോമലി ഹീറ്റ്മാപ്പ്, റീകൺസിലിയേഷൻ മാട്രിക്സ്.',
  run_reconciliation: 'മാസാന്ത ക്ലോഷർ',
  heatmap_title: 'മൾട്ടി-സിഗ്നൽ ആന്റി-ലീക്കേജ് ഹീറ്റ്മാപ്പ്',
  heatmap_desc:
    'ഓരോ കടയും e-Balance ($S_1$), പൗര കൺഫർമേഷൻ ($S_2$), വെലോസിറ്റി ($S_3$) എന്നിവ ഉപയോഗിച്ച് സ്കോർ ചെയ്യുന്നു.',
  plain_reasoning: 'AI ഓഡിറ്റ് ഇൻസ്പെക്ടർ',
  reconcile_matrix_title: 'സംസ്ഥാന സ്റ്റോക്ക് റീകൺസിലിയേഷൻ മാട്രിക്സ്',
  sms_outbox_title: 'തത്സമയ മൾട്ടി-മെമ്പർ SMS ഔട്ട്ബോക്സ്',
  sms_outbox_desc:
    'ഓരോ e-POS വിൽപ്പനയും എല്ലാ ആധാർ-ലിങ്ക്ഡ് കുടുംബാംഗങ്ങൾക്കും SMS അയക്കുന്നു.',

  // Stock badge
  inStock: 'സ്റ്റോക്ക് ഉണ്ട്',
  lowStock: 'കുറഞ്ഞ സ്റ്റോക്ക്',
  outOfStock: 'സ്റ്റോക്ക് ഇല്ല',

  // Tool calls
  toolCalls: 'ടൂൾ കോളുകൾ',
  toolCall: 'ടൂൾ കോൾ',
};

// Convenience export that all pages consume.
export const translations: Record<Language, Dict> = { en, ml };

/**
 * Type-safe helper: returns a Proxy that gives the supplied language's dict,
 * falling back to English for any missing key (prevents `undefined` crashes).
 */
export function makeT(lang: Language): Dict {
  const primary = translations[lang] ?? en;
  return new Proxy(primary, {
    get(target, prop: string) {
      if (prop in target) return target[prop];
      if (prop in en) return en[prop];
      return '';
    },
  });
}
/* Rupya.com core: shell, smart search, live data, charts, engraving, storage, forms */
(() => {
  const D = document, root = D.documentElement;
  const sc = D.currentScript || D.querySelector('script[src*="assets/site.js"]');
  const R = sc.getAttribute('src').split('assets/site.js')[0];
  const $ = (q, e = D) => e.querySelector(q), $$ = (q, e = D) => [...e.querySelectorAll(q)];
  const store = {
    get(k, d) { try { const v = localStorage.getItem('rupya:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('rupya:' + k, JSON.stringify(v)); } catch (e) {} }
  };
  const theme = store.get('theme');
  if (theme) root.dataset.theme = theme;
  const reduced = matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ---------- numbers ---------- */
  const trim = x => String(+x.toFixed(2));
  const inr = (n, d = 0) => (n < 0 ? '−' : '') + '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
  const human = n => {
    const a = Math.abs(n), s = n < 0 ? '−' : '';
    if (a >= 1e7) return s + '₹' + trim(a / 1e7) + ' crore';
    if (a >= 1e5) return s + '₹' + trim(a / 1e5) + ' lakh';
    if (a >= 1e3) return s + '₹' + trim(a / 1e3) + ' thousand';
    return s + '₹' + Math.round(a);
  };
  const short = n => {
    const a = Math.abs(n), s = n < 0 ? '−' : '';
    const f = x => String(+x.toFixed(x < 10 ? 1 : 0));
    if (a >= 1e7) return s + '₹' + f(a / 1e7) + 'Cr';
    if (a >= 1e5) return s + '₹' + f(a / 1e5) + 'L';
    if (a >= 1e3) return s + '₹' + f(a / 1e3) + 'K';
    return s + '₹' + Math.round(a);
  };
  const num = (n, d = 2) => n.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
  const O = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const T = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const two = n => n < 20 ? O[n] : T[Math.floor(n / 10)] + (n % 10 ? '-' + O[n % 10] : '');
  const three = n => (n >= 100 ? O[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' : '') : '') + two(n % 100);
  const words = n => {
    n = Math.floor(Math.abs(n));
    if (!n) return 'zero';
    let s = '';
    const cr = Math.floor(n / 1e7), la = Math.floor(n % 1e7 / 1e5), th = Math.floor(n % 1e5 / 1e3), re = n % 1e3;
    if (cr) s += words(cr) + ' crore ';
    if (la) s += two(la) + ' lakh ';
    if (th) s += two(th) + ' thousand ';
    if (re) s += three(re);
    return s.trim();
  };
  const rupeeWords = v => {
    v = Math.abs(+v || 0);
    const r = Math.floor(v), p = Math.round((v - r) * 100);
    const t = 'Rupees ' + words(r) + (p ? ' and ' + two(p) + ' paise' : '') + ' only';
    return t.replace(/\b[a-z]/g, c => c.toUpperCase()).replace(/\bAnd\b/g, 'and');
  };

  /* ---------- icons ---------- */
  const IC = {
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    moon: '<path d="M20 14.6A8 8 0 1 1 9.4 4a6.4 6.4 0 0 0 10.6 10.6z"/>',
    down: '<path d="M6 9l6 6 6-6"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    inv: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    bor: '<path d="M3 11.5L12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M10 20v-5.5h4V20"/>',
    tax: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    sav: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="12" cy="12" r="3.5"/><path d="M12 8.5V7M12 17v-1.5M7 19v2M17 19v2"/>',
    pln: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
    day: '<path d="M18.5 5.5l-13 13"/><circle cx="7" cy="7" r="2.6"/><circle cx="17" cy="17" r="2.6"/>',
    fx: '<path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5"/>',
    gold: '<path d="M2.5 20l2-5h6l2 5zM11.5 20l2-5h6l2 5zM7 15l2-5h6l2 5z"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M9 8h6M9 11h6M11.5 8c3 0 3 6-2.5 6l4.5 3.5"/>',
    hex: '<path d="M12 2.8l8 4.6v9.2l-8 4.6-8-4.6V7.4z"/><path d="M12 7.5l4 2.3v4.4l-4 2.3-4-2.3V9.8z"/>',
    bank: '<path d="M3 10l9-6 9 6"/><path d="M5 10.5v7.5M9.7 10.5v7.5M14.3 10.5v7.5M19 10.5v7.5M3 20.5h18"/>',
    type: '<path d="M4 7V5h16v2M12 5v14M9 19h6"/>',
    save: '<path d="M6 3.5h12v17l-6-4-6 4z"/>', link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 1 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 1 0 5.7 5.7l1-1"/>',
    dl: '<path d="M12 3.5v11M7 10l5 5 5-5M5 20.5h14"/>', print: '<path d="M7 9V3.5h10V9"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v6.5H7z"/>',
    scale: '<path d="M12 3.5v17M6 20.5h12M5 7h14"/><path d="M5 7l-2.5 6.5a3 3 0 0 0 5 0zM19 7l-2.5 6.5a3 3 0 0 0 5 0z"/>',
    chart: '<path d="M4 20V4M4 20h16"/><path d="M7.5 15l3.5-4.5 3 2.5 5-6.5"/>', table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9.5h18M3 15h18M9 4v16"/>',
    shield: '<path d="M12 3l8 3v6c0 4.8-3.4 7.9-8 9-4.6-1.1-8-4.2-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H4.5a3.5 3.5 0 0 0 4 4M16 6h3.5a3.5 3.5 0 0 1-4 4M12 13v4M8 20.5h8M9.5 17h5"/>',
    case: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4.5h6V7M3 12.5h18"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5.5 3.5-5.5 3.5z"/>', book: '<path d="M4.5 5.5a2.5 2.5 0 0 1 2.5-2.5h12.5v15H7a2.5 2.5 0 0 0-2.5 2.5z"/><path d="M4.5 20V5.5M8.5 7.5h7"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    spark: '<path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 20.5a8 8 0 0 1 16 0"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.3 2"/>', trash: '<path d="M4 7h16M9 7V4.5h6V7M6 7l1 13.5h10L18 7"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>', calc: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7h7M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01M8.5 15h.01M12 15h.01M15.5 15h.01M8.5 18h.01M12 18h3.5"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>', users: '<circle cx="9" cy="8" r="3.4"/><path d="M2.8 20a6.2 6.2 0 0 1 12.4 0M16 4.8a3.4 3.4 0 0 1 0 6.5M21.2 20a6.2 6.2 0 0 0-3.8-5.7"/>'
  };
  const ic = (n, c = '') => `<svg class="ic ${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const LOGO = '<svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="17.2" fill="#14213D"/><circle cx="18" cy="18" r="14.4" fill="none" stroke="#F2B705" stroke-width="1.7" stroke-dasharray="1.15 1.2"/><circle cx="18" cy="18" r="11.8" fill="none" stroke="#1FA391" stroke-width=".8"/><path d="M13.4 11.6h9.4M13.4 15.1h9.4M16.6 11.6c5 0 5 7.1 0 7.1h-3.2l7.2 6.5" fill="none" stroke="#F2B705" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ---------- site map ---------- */
  const CAT = { inv: ['Invest', 'inv'], sav: ['Save safely', 'sav'], bor: ['Borrow', 'bor'], tax: ['Tax & salary', 'tax'], pln: ['Plan', 'pln'], day: ['Everyday', 'day'] };
  const CALCS = [
    ['sip', 'SIP calculator', 'inv', 'mutual fund monthly investment returns'], ['step-up-sip', 'Step-up SIP calculator', 'inv', 'top-up increasing sip annual increase'],
    ['lumpsum', 'Lumpsum calculator', 'inv', 'one time investment mutual fund'], ['goal-sip', 'Goal SIP calculator', 'inv', 'target corpus monthly needed'],
    ['sip-delay', 'Cost of delay calculator', 'inv', 'start sip late waiting'], ['swp', 'SWP calculator', 'inv', 'systematic withdrawal plan pension income'],
    ['cagr', 'CAGR calculator', 'inv', 'annual growth rate returns'], ['compound-interest', 'Compound interest calculator', 'inv', 'interest on interest'],
    ['fd', 'FD calculator', 'sav', 'fixed deposit bank interest maturity'], ['rd', 'RD calculator', 'sav', 'recurring deposit post office'],
    ['ppf', 'PPF calculator', 'sav', 'public provident fund 7.1'], ['ssy', 'Sukanya Samriddhi calculator', 'sav', 'ssy girl child daughter 8.2'],
    ['scss', 'SCSS calculator', 'sav', 'senior citizens savings scheme quarterly interest'], ['nsc', 'NSC calculator', 'sav', 'national savings certificate post office'],
    ['kvp', 'Kisan Vikas Patra calculator', 'sav', 'kvp double money 115 months'], ['pomis', 'Post Office MIS calculator', 'sav', 'monthly income scheme pomis'],
    ['simple-interest', 'Simple interest calculator', 'sav', 'si principal rate time'],
    ['emi', 'EMI calculator', 'bor', 'loan instalment amortisation'], ['home-loan', 'Home loan EMI calculator', 'bor', 'housing loan emi'],
    ['car-loan', 'Car loan EMI calculator', 'bor', 'auto vehicle loan'], ['personal-loan', 'Personal loan EMI calculator', 'bor', 'instant loan emi'],
    ['education-loan', 'Education loan EMI calculator', 'bor', 'student study abroad loan'], ['loan-eligibility', 'Home loan eligibility calculator', 'bor', 'how much loan can i get foir'],
    ['prepayment', 'Loan prepayment calculator', 'bor', 'part payment foreclosure save interest'], ['flat-vs-reducing', 'Flat vs reducing rate calculator', 'bor', 'flat interest effective rate'],
    ['credit-card', 'Credit card interest calculator', 'bor', 'minimum due revolving payoff'], ['rent-vs-buy', 'Rent vs buy calculator', 'bor', 'buy house or rent'],
    ['income-tax', 'Income tax calculator', 'tax', 'new old regime fy 2026-27 slab'], ['salary', 'Salary calculator', 'tax', 'ctc in hand take home'],
    ['hra', 'HRA calculator', 'tax', 'house rent allowance exemption'], ['gratuity', 'Gratuity calculator', 'tax', 'retirement resignation 15/26'],
    ['capital-gains', 'Capital gains tax calculator', 'tax', 'ltcg stcg shares mutual funds'], ['gst', 'GST calculator', 'tax', 'goods services tax cgst sgst'],
    ['retirement', 'Retirement calculator', 'pln', 'corpus pension planning'], ['nps', 'NPS calculator', 'pln', 'national pension system annuity'],
    ['epf', 'EPF calculator', 'pln', 'provident fund pf balance 8.25'], ['fire', 'FIRE calculator', 'pln', 'financial independence retire early'],
    ['life-cover', 'Life cover calculator', 'pln', 'term insurance how much cover'], ['emergency-fund', 'Emergency fund calculator', 'pln', 'safety net savings'],
    ['net-worth', 'Net worth calculator', 'pln', 'assets liabilities wealth'], ['inflation', 'Inflation calculator', 'pln', 'future value cost purchasing power'],
    ['budget', '50/30/20 budget calculator', 'day', 'monthly budget needs wants'], ['percentage', 'Percentage calculator', 'day', 'percent change increase'],
    ['discount', 'Discount calculator', 'day', 'sale price offer'], ['gold', 'Gold price calculator', 'day', 'jewellery making charges gst grams']
  ];
  const CN = Object.fromEntries(CALCS.map(c => [c[0], c[1]]));
  const CUR = {
    USD: ['US Dollar', 'United States'], EUR: ['Euro', 'Eurozone'], GBP: ['British Pound', 'United Kingdom'], AED: ['UAE Dirham', 'United Arab Emirates'],
    SAR: ['Saudi Riyal', 'Saudi Arabia'], QAR: ['Qatari Riyal', 'Qatar'], KWD: ['Kuwaiti Dinar', 'Kuwait'], OMR: ['Omani Rial', 'Oman'], BHD: ['Bahraini Dinar', 'Bahrain'],
    SGD: ['Singapore Dollar', 'Singapore'], AUD: ['Australian Dollar', 'Australia'], CAD: ['Canadian Dollar', 'Canada'], NZD: ['New Zealand Dollar', 'New Zealand'],
    JPY: ['Japanese Yen', 'Japan'], CHF: ['Swiss Franc', 'Switzerland'], CNY: ['Chinese Yuan', 'China'], HKD: ['Hong Kong Dollar', 'Hong Kong'],
    MYR: ['Malaysian Ringgit', 'Malaysia'], THB: ['Thai Baht', 'Thailand'], ZAR: ['South African Rand', 'South Africa'],
    LKR: ['Sri Lankan Rupee', 'Sri Lanka'], NPR: ['Nepalese Rupee', 'Nepal'], BDT: ['Bangladeshi Taka', 'Bangladesh'], PKR: ['Pakistani Rupee', 'Pakistan'],
    RUB: ['Russian Rouble', 'Russia'], INR: ['Indian Rupee', 'India']
  };
  const PAIRS = ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'QAR', 'KWD', 'OMR', 'BHD', 'SGD', 'AUD', 'CAD', 'NZD', 'JPY', 'CHF', 'CNY', 'HKD', 'MYR', 'THB', 'ZAR'];
  const REV = ['USD', 'AED', 'EUR', 'GBP'];
  const pairUrl = (c, rev) => `currency/${rev ? 'inr-to-' + c.toLowerCase() : c.toLowerCase() + '-to-inr'}.html`;
  const CRYPTO = [['bitcoin', 'Bitcoin', 'BTC'], ['ethereum', 'Ethereum', 'ETH'], ['tether', 'Tether', 'USDT'], ['binancecoin', 'BNB', 'BNB'], ['solana', 'Solana', 'SOL'], ['ripple', 'XRP', 'XRP'], ['usd-coin', 'USD Coin', 'USDC'], ['dogecoin', 'Dogecoin', 'DOGE'], ['cardano', 'Cardano', 'ADA'], ['tron', 'TRON', 'TRX']];
  const PAGES = [
    ['Today’s rates in India', 'rates.html', 'Rates', 'live repo rate gold dollar'], ['Rupee converter', 'currency.html', 'Rates', 'currency exchange forex inr'],
    ['Gold rate today', 'gold-rate-today.html', 'Rates', '24k 22k 18k gram tola'], ['Silver rate today', 'silver-rate-today.html', 'Rates', 'chandi kg gram'],
    ['Crypto prices in INR', 'crypto-prices-inr.html', 'Rates', 'bitcoin ethereum rupees'], ['IFSC code finder', 'ifsc-code-finder.html', 'Tool', 'bank branch micr swift'],
    ['Rupees in words', 'rupees-in-words.html', 'Tool', 'number to words cheque lakh crore million converter'], ['Free expert advice', 'advisor.html', 'Help', 'advisor home loan insurance tax help'],
    ['Money check-up', 'money-checkup.html', 'Tool', 'financial health score'], ['My Rupya', 'my-rupya.html', 'Tool', 'saved calculations dashboard'],
    ['Money guides', 'guides/index.html', 'Guide', 'learn articles'], ['New vs old tax regime', 'guides/new-vs-old-tax-regime.html', 'Guide', 'which regime'],
    ['SIP for beginners', 'guides/sip-for-beginners.html', 'Guide', 'mutual fund start'], ['Build an emergency fund', 'guides/emergency-fund.html', 'Guide', 'savings'],
    ['Home loan prepayment', 'guides/home-loan-prepayment.html', 'Guide', 'part payment'], ['Small savings schemes compared', 'guides/small-savings-schemes.html', 'Guide', 'ppf ssy scss nsc kvp rates'],
    ['Credit score explained', 'guides/credit-score.html', 'Guide', 'cibil'], ['Staying safe on UPI', 'guides/upi-safety.html', 'Guide', 'fraud scam 1930'],
    ['Sending money to India', 'guides/sending-money-to-india.html', 'Guide', 'remittance nri nre nro'], ['The story of the rupee', 'guides/story-of-the-rupee.html', 'Guide', 'history symbol'],
    ['Glossary', 'glossary.html', 'Guide', 'terms meaning'], ['Video lessons', 'videos.html', 'Guide', 'youtube'], ['Money quiz and prizes', 'contest.html', 'Contest', 'quiz win'],
    ['Support Rupya', 'support.html', 'Help', 'donate sponsor jobs work with us'], ['About Rupya', 'about.html', 'Page', ''], ['Contact', 'contact.html', 'Page', 'email message'],
    ['Editorial policy', 'editorial-policy.html', 'Page', 'methodology sources'], ['Privacy policy', 'privacy.html', 'Page', 'cookies'], ['Disclaimer', 'disclaimer.html', 'Page', 'trademark']
  ];
  const INDEX = [
    ...CALCS.map(c => [c[1], 'calculators/' + c[0] + '.html', 'Calculator', c[3] + ' ' + c[0]]),
    ...PAIRS.map(c => [`${CUR[c][0]} to rupee (${c} to INR)`, pairUrl(c), 'Rates', c.toLowerCase() + ' inr ' + CUR[c][1].toLowerCase()]),
    ...REV.map(c => [`Rupee to ${CUR[c][0]} (INR to ${c})`, pairUrl(c, 1), 'Rates', 'inr ' + c.toLowerCase()]),
    ...PAGES
  ];

  /* ---------- live data ---------- */
  const OZ = 31.1034768, DUTY = 0.15, GST = 0.03;
  const mem = {};
  function getJ(url, key, ttl) {
    const k = 'rupya:c:' + key;
    try { const c = JSON.parse(sessionStorage.getItem(k)); if (c && Date.now() - c.t < ttl * 6e4) return Promise.resolve(c.d); } catch (e) {}
    if (mem[key]) return mem[key];
    const p = (async () => {
      const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 9000);
      try {
        const r = await fetch(url, { signal: ctl.signal });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const d = await r.json();
        try { sessionStorage.setItem(k, JSON.stringify({ t: Date.now(), d })); } catch (e) {}
        return d;
      } finally { clearTimeout(tm); }
    })();
    mem[key] = p;
    p.catch(() => { delete mem[key]; });
    return p;
  }
  const ECB = ['USD', 'EUR', 'GBP', 'SGD', 'AUD', 'CAD', 'NZD', 'JPY', 'CHF', 'CNY', 'HKD', 'MYR', 'THB', 'ZAR'];
  const PEG = { AED: 3.6725, SAR: 3.75, QAR: 3.64, OMR: 0.3845, BHD: 0.376 };
  const live = {
    async rates() {
      try {
        const j = await getJ('https://open.er-api.com/v6/latest/INR', 'fx', 60);
        if (j.result !== 'success' || !j.rates || !j.rates.USD) throw new Error('bad');
        return { r: j.rates, t: j.time_last_update_unix * 1000, live: true };
      } catch (e) {
        const j = await getJ(R + 'data/rates.json', 'fxs', 60);
        return { r: j.rates, t: Date.parse(j.updated) || 0, live: false };
      }
    },
    async metals() {
      const [fx, g, s] = await Promise.all([live.rates(), getJ('https://api.gold-api.com/price/XAU', 'xau', 10), getJ('https://api.gold-api.com/price/XAG', 'xag', 10)]);
      const u = 1 / fx.r.USD;
      return { usdinr: u, xau: g.price, xag: s.price, t: Date.parse(g.updatedAt) || Date.now(), g24: g.price * u / OZ * (1 + DUTY), ag: s.price * u / OZ * (1 + DUTY) };
    },
    crypto() { return getJ('https://api.coingecko.com/api/v3/simple/price?ids=' + CRYPTO.map(c => c[0]).join(',') + '&vs_currencies=inr,usd&include_24hr_change=true&include_market_cap=true', 'cg', 5); },
    async hist(days) {
      const from = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
      const j = await getJ(`https://api.frankfurter.dev/v1/${from}..?base=INR&symbols=${ECB.join(',')}`, 'h' + days, 360);
      const dates = Object.keys(j.rates).sort(), s = {};
      ECB.forEach(c => { s[c] = dates.map(d => j.rates[d][c] ? 1 / j.rates[d][c] : NaN); });
      Object.keys(PEG).forEach(c => { s[c] = s.USD.map(v => v / PEG[c]); });
      return { dates, s };
    }
  };

  /* ---------- engraving (guilloche) ---------- */
  const glCache = {};
  function guilloche(svg, o = {}) {
    const ns = 'http://www.w3.org/2000/svg';
    svg.setAttribute('viewBox', '0 0 500 500');
    svg.classList.add('gl');
    const bands = o.bands || [
      [222, 9, 36, 6, '#F2B705', .5], [196, 13, 24, 10, '#1FA391', .55], [160, 11, 30, 9, '#A898EC', .5],
      [128, 9, 18, 8, '#F2B705', .45], [100, 22, 12, 8, '#1FA391', .35]
    ];
    const key = JSON.stringify(bands);
    if (!glCache[key]) {
      let m = '';
      for (const [r0, a, lobes, n, col, op] of bands) {
        const N = Math.max(400, lobes * 22);
        let g = '';
        for (let j = 0; j < n; j++) {
          const ph = 2 * Math.PI * j / (lobes * n);
          let d = '';
          for (let i = 0; i < N; i++) {
            const t = 2 * Math.PI * i / N, r = r0 + a * Math.sin(lobes * (t + ph)) + a * .18 * Math.sin(3 * lobes * (t - ph));
            d += (i ? 'L' : 'M') + (250 + r * Math.cos(t)).toFixed(1) + ' ' + (250 + r * Math.sin(t)).toFixed(1);
          }
          g += '<path d="' + d + 'Z"/>';
        }
        m += '<g stroke="' + col + '" stroke-opacity="' + op + '">' + g + '</g>';
      }
      m += '<g stroke="#F2B705" stroke-opacity=".35"><circle cx="250" cy="250" r="238"/><circle cx="250" cy="250" r="242"/></g>';
      glCache[key] = URL.createObjectURL(new Blob(['<svg xmlns="' + ns + '" viewBox="0 0 500 500" fill="none" stroke-width=".8">' + m + '</svg>'], { type: 'image/svg+xml' }));
    }
    const im = D.createElementNS(ns, 'image');
    im.setAttribute('href', glCache[key]); im.setAttribute('width', 500); im.setAttribute('height', 500);
    svg.replaceChildren(im);
    if (o.draw && !reduced) svg.classList.add('draw');
  }

  /* ---------- charts ---------- */
  function chart(el, o) {
    el.classList.add('chart');
    el._o = o;
    if (!el._ro && window.ResizeObserver) { el._ro = new ResizeObserver(() => draw(el)); el._ro.observe(el); }
    draw(el);
  }
  function draw(el) {
    const o = el._o; if (!o || !o.x || !o.x.length) return;
    const W = Math.max(260, el.clientWidth || 600), H = o.h || 230, L = 4, Rr = 6, Tp = 16, B = 24;
    const vals = o.s.flatMap(s => s.d).filter(v => isFinite(v));
    if (!vals.length) return;
    let lo = Math.min(...vals), hi = Math.max(...vals);
    if (o.zero !== false) lo = Math.min(0, lo);
    if (hi === lo) { hi += Math.abs(hi) * .05 || 1; lo -= Math.abs(lo) * .05 || 1; } else if (o.zero === false) { const p = (hi - lo) * .1; hi += p; lo -= p; }
    const n = o.x.length, X = i => L + (n > 1 ? i / (n - 1) : .5) * (W - L - Rr), Y = v => Tp + (1 - (v - lo) / (hi - lo)) * (H - Tp - B);
    const f = o.f || short, ft = o.ft || f, xl = o.xl || '';
    let g = '';
    for (let k = 0; k <= 3; k++) { const v = lo + (hi - lo) * k / 3, y = Y(v); g += `<line class="gr" x1="${L}" x2="${W - Rr}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/>` + (k ? `<text x="${L}" y="${(y - 5).toFixed(1)}">${f(v)}</text>` : ''); }
    const idx = n > 2 ? [0, Math.floor((n - 1) / 2), n - 1] : [...Array(n).keys()];
    g += idx.map((i, j) => `<text x="${X(i).toFixed(1)}" y="${H - 5}" text-anchor="${j === 0 ? 'start' : j === idx.length - 1 ? 'end' : 'middle'}">${xl}${o.x[i]}</text>`).join('');
    const base = Y(Math.max(lo, Math.min(0, hi)));
    o.s.forEach((s, si) => {
      const pts = []; s.d.forEach((v, i) => { if (isFinite(v)) pts.push(X(i).toFixed(1) + ',' + Y(v).toFixed(1)); });
      if (!pts.length) return;
      const line = 'M' + pts.join('L');
      if (si === o.s.length - 1 && o.area !== false) g += `<path d="${line}L${pts[pts.length - 1].split(',')[0]},${base.toFixed(1)}L${pts[0].split(',')[0]},${base.toFixed(1)}Z" style="fill:${s.c};opacity:.11"/>`;
      g += `<path d="${line}" style="fill:none;stroke:${s.c};stroke-width:2.4;stroke-linejoin:round;stroke-linecap:round${s.dash ? ';stroke-dasharray:5 5' : ''}"/>`;
    });
    g += `<line class="hx" x1="0" x2="0" y1="${Tp}" y2="${H - B}" style="stroke:var(--mute);stroke-width:1;opacity:0"/>` + o.s.map(s => `<circle r="4.5" style="fill:var(--sheet);stroke:${s.c};stroke-width:2.4;opacity:0"/>`).join('');
    el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${o.label || 'Chart'}">${g}</svg><div class="tt"></div>` +
      (o.s.length > 1 || o.key ? `<div class="ck">${o.s.map(s => `<span><i style="background:${s.c}"></i>${s.n}</span>`).join('')}</div>` : '');
    const svg = $('svg', el), hx = $('.hx', el), dots = $$('circle', svg), tt = $('.tt', el);
    const move = e => {
      const b = svg.getBoundingClientRect(), x = (e.touches ? e.touches[0].clientX : e.clientX) - b.left;
      const i = Math.max(0, Math.min(n - 1, Math.round((x - L) / (W - L - Rr) * (n - 1))));
      const px = X(i);
      hx.setAttribute('x1', px); hx.setAttribute('x2', px); hx.style.opacity = .5;
      dots.forEach((c, k) => { const v = o.s[k].d[i]; if (isFinite(v)) { c.setAttribute('cx', px); c.setAttribute('cy', Y(v)); c.style.opacity = 1; } else c.style.opacity = 0; });
      tt.innerHTML = `<b>${xl}${o.x[i]}</b>` + o.s.map(s => isFinite(s.d[i]) ? `<div><i style="background:${s.c}"></i>${s.n}: ${ft(s.d[i])}</div>` : '').join('');
      const tw = tt.offsetWidth; tt.style.left = Math.max(tw / 2, Math.min(W - tw / 2, px)) + 'px'; tt.style.transform = 'translate(-50%,-102%)';
      el.classList.add('hv');
    };
    const leave = () => { el.classList.remove('hv'); hx.style.opacity = 0; dots.forEach(c => c.style.opacity = 0); };
    svg.addEventListener('pointermove', move); svg.addEventListener('pointerdown', move); svg.addEventListener('pointerleave', leave);
  }
  const spark = (arr, col) => {
    const v = arr.filter(isFinite); if (v.length < 2) return '';
    const lo = Math.min(...v), hi = Math.max(...v), sp = hi - lo || 1;
    const pts = arr.map((x, i) => isFinite(x) ? (i / (arr.length - 1) * 100).toFixed(1) + ',' + (26 - (x - lo) / sp * 24 - 1).toFixed(1) : null).filter(Boolean).join(' ');
    return `<svg viewBox="0 0 100 26" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="${col}" stroke-width="1.6" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>`;
  };
  const chg = (a, b) => { const p = (b / a - 1) * 100; return `<span class="${p >= 0 ? 'up' : 'dn'}">${p >= 0 ? '+' : '−'}${Math.abs(p).toFixed(2)}%</span>`; };

  /* ---------- toast ---------- */
  let tT;
  const toast = m => { let t = $('.toast'); if (!t) { t = D.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); D.body.append(t); } t.textContent = m; t.hidden = false; clearTimeout(tT); tT = setTimeout(() => { t.hidden = true; }, 2400); };

  /* ---------- smart search ---------- */
  const SYN = { dollar: 'USD', dollars: 'USD', '$': 'USD', euro: 'EUR', euros: 'EUR', pound: 'GBP', pounds: 'GBP', sterling: 'GBP', dirham: 'AED', dirhams: 'AED', riyal: 'SAR', riyals: 'SAR', dinar: 'KWD', dinars: 'KWD', yen: 'JPY', yuan: 'CNY', rmb: 'CNY', ringgit: 'MYR', baht: 'THB', rand: 'ZAR', franc: 'CHF', francs: 'CHF', taka: 'BDT', rupee: 'INR', rupees: 'INR', rs: 'INR', '₹': 'INR', rupaye: 'INR' };
  const curOf = w => { if (!w) return null; const u = w.toUpperCase(); return CUR[u] ? u : SYN[w] || null; };
  const UNIT = { k: 1e3, thousand: 1e3, l: 1e5, lac: 1e5, lacs: 1e5, lakh: 1e5, lakhs: 1e5, cr: 1e7, crore: 1e7, crores: 1e7, mn: 1e6, million: 1e6, bn: 1e9, billion: 1e9 };
  function tokens(q) {
    const t = [];
    q.replace(/(\d[\d,]*\.?\d*)\s*(crores?|cr|lakhs?|lacs?|lac|l|k|thousand|million|mn|billion|bn|%|percent|years?|yrs?|yr|y|months?|mos?|grams?|gms?|gm|g)?(?![a-z])/g, (a, n, u) => {
      let v = parseFloat(n.replace(/,/g, '')), k = null;
      if (!isFinite(v)) return a;
      if (u) {
        if (UNIT[u]) { v *= UNIT[u]; k = 'amt'; } else if (u === '%' || u === 'percent') k = 'pct';
        else if (/^y/.test(u)) k = 'yr'; else if (/^mo/.test(u)) k = 'mo'; else if (/^g/.test(u)) k = 'g';
      }
      t.push({ v, k }); return a;
    });
    return t;
  }
  const emiOf = (p, i, n) => i ? p * i * Math.pow(1 + i, n) / (Math.pow(1 + i, n) - 1) : p / n;
  const fvSip = (m, i, n) => i ? m * ((Math.pow(1 + i, n) - 1) / i) * (1 + i) : m * n;
  function pick(t) {
    const used = new Set(), take = f => { const i = t.findIndex((x, j) => !used.has(j) && f(x)); if (i < 0) return null; used.add(i); return t[i].v; };
    const amt = take(x => x.k === 'amt') ?? take(x => !x.k && x.v >= 500);
    const rate = take(x => x.k === 'pct') ?? take(x => !x.k && x.v > 0 && x.v <= 40 && x.v % 1 !== 0);
    let yr = take(x => x.k === 'yr'); const mo = yr == null ? take(x => x.k === 'mo') : null;
    if (yr == null && mo != null) yr = mo / 12;
    if (yr == null) yr = take(x => !x.k && x.v >= 1 && x.v <= 40);
    const r2 = rate ?? take(x => !x.k && x.v > 0 && x.v <= 40);
    return { amt, rate: r2, yr };
  }
  const H = o => Object.entries(o).map(e => e[0] + '=' + (+(+e[1]).toFixed(4))).join('&');
  function answer(q) {
    const s = q.toLowerCase().replace(/[?]/g, ' ').trim(), t = tokens(s);
    // currency: "100 usd to inr", "aed to inr", "5000 rupees in dollars"
    const cm = s.replace(/[\d,.]+\s*(k|lakh|lakhs|lac|cr|crore|million)?/g, ' ').match(/([a-z$₹]{1,9})\s*(?:to|in|into|=|vs)\s*([a-z$₹]{1,9})|^\s*([a-z$₹]{1,9})\s*$/);
    let from = null, to = null;
    if (cm) { from = curOf(cm[1] || cm[3]); to = curOf(cm[2]) || (cm[3] ? 'INR' : null); }
    if (!from) { const w = s.split(/[^a-z$₹]+/).map(curOf).filter(Boolean); if (w.length && /(to|in|rate|price|convert)/.test(s) || (w.length && t.length && s.split(/\s+/).length <= 3)) { from = w[0]; to = w[1] || (from === 'INR' ? 'USD' : 'INR'); } }
    if (from && to && from !== to) {
      const a = t.length ? t[0].v : 1;
      return live.rates().then(fx => {
        const v = a / fx.r[from] * fx.r[to];
        if (!isFinite(v)) return null;
        const pg = to === 'INR' && PAIRS.includes(from) ? pairUrl(from) : from === 'INR' && REV.includes(to) ? pairUrl(to, 1) : 'currency.html';
        return { k: `${num(a, a % 1 ? 2 : 0)} ${from} in ${to}`, v: (to === 'INR' ? '₹' : '') + num(v) + (to === 'INR' ? '' : ' ' + to), s: `1 ${from} = ${num(1 / fx.r[from] * fx.r[to], 4)} ${to}. Open the converter`, u: pg };
      }).catch(() => null);
    }
    if (/\b(in )?words?\b/.test(s) && t.length) return { k: inr(t[0].v, t[0].v % 1 ? 2 : 0) + ' in words', v: rupeeWords(t[0].v), s: 'Open the words converter', u: 'rupees-in-words.html#' + t[0].v };
    if (/\bgold\b/.test(s)) {
      const g = (t.find(x => x.k === 'g') || {}).v || 10;
      return live.metals().then(m => ({ k: `${g} g of 24K gold (indicative, excl. GST)`, v: inr(m.g24 * g), s: 'See today’s gold rate', u: 'gold-rate-today.html' })).catch(() => ({ k: 'Gold price', v: 'Today’s gold rate', s: 'Open gold rate', u: 'gold-rate-today.html' }));
    }
    if (/\bsilver\b/.test(s)) return live.metals().then(m => ({ k: '1 kg silver (indicative, excl. GST)', v: inr(m.ag * 1000), s: 'See today’s silver rate', u: 'silver-rate-today.html' })).catch(() => null);
    const p = pick(t);
    if (/\b(sip|mutual fund|monthly invest)/.test(s) && p.amt) {
      const r = p.rate || 12, y = p.yr || 10, v = fvSip(p.amt, r / 1200, y * 12);
      return { k: `${inr(p.amt)} a month for ${trim(y)} years at ${r}%`, v: inr(v), s: human(v) + ' estimated. Open the SIP calculator', u: `calculators/sip.html#${H({ m: p.amt, r, y: Math.round(y), s: 0 })}` };
    }
    const lm = s.match(/home loan|car loan|personal loan|education loan|\bemi\b|\bloan\b/);
    if (lm && p.amt) {
      const id = { 'home loan': 'home-loan', 'car loan': 'car-loan', 'personal loan': 'personal-loan', 'education loan': 'education-loan' }[lm[0]] || 'emi';
      const r = p.rate || 8.5, y = p.yr || 20, e = emiOf(p.amt, r / 1200, Math.round(y * 12));
      return { k: `EMI on ${human(p.amt)} at ${r}% for ${trim(y)} years`, v: inr(e) + ' a month', s: `Total interest ${human(e * Math.round(y * 12) - p.amt)}. Open the EMI calculator`, u: `calculators/${id}.html#${H({ p: p.amt, r, y: Math.round(y) })}` };
    }
    if (/\b(fd|fixed deposit)\b/.test(s) && p.amt) {
      const r = p.rate || 7, y = p.yr || 5, v = p.amt * Math.pow(1 + r / 400, 4 * y);
      return { k: `${human(p.amt)} FD at ${r}% for ${trim(y)} years`, v: inr(v), s: 'Quarterly compounding. Open the FD calculator', u: `calculators/fd.html#${H({ p: p.amt, r, y: Math.round(y), c: 4 })}` };
    }
    if (/\b(lumpsum|lump sum)\b/.test(s) && p.amt) {
      const r = p.rate || 12, y = p.yr || 10, v = p.amt * Math.pow(1 + r / 100, y);
      return { k: `${human(p.amt)} invested for ${trim(y)} years at ${r}%`, v: inr(v), s: 'Open the lumpsum calculator', u: `calculators/lumpsum.html#${H({ p: p.amt, r, y: Math.round(y) })}` };
    }
    if (/\bgst\b/.test(s) && p.amt) {
      const g = p.rate || 18;
      return { k: `${inr(p.amt)} plus ${g}% GST`, v: inr(p.amt * (1 + g / 100), 2), s: `GST ${inr(p.amt * g / 100, 2)}. Open the GST calculator`, u: `calculators/gst.html#${H({ a: p.amt, g, mode: 0 })}` };
    }
    if (/\btax\b/.test(s) && p.amt) return { k: `Income tax on ${human(p.amt)}`, v: 'Compare both regimes', s: 'Open the income tax calculator', u: `calculators/income-tax.html#${H({ inc: p.amt, sal: 1, ded: 0, ex: 0 })}` };
    if (/\bppf\b/.test(s) && p.amt) return { k: `PPF with ${inr(p.amt)} a year`, v: 'See the maturity value', s: 'Open the PPF calculator', u: `calculators/ppf.html#${H({ d: Math.min(p.amt, 150000), r: 7.1, y: Math.max(15, Math.round(p.yr || 15)) })}` };
    return null;
  }
  function find(q) {
    const w = q.toLowerCase().split(/\s+/).filter(x => x.length > 1 && !/^\d/.test(x));
    if (!w.length) return [];
    return INDEX.map(e => {
      const h = (e[0] + ' ' + e[3]).toLowerCase(), tl = e[0].toLowerCase();
      if (!w.every(x => h.includes(x))) return null;
      return [e, (tl.startsWith(w[0]) ? 3 : 0) + w.filter(x => tl.includes(x)).length];
    }).filter(Boolean).sort((a, b) => b[1] - a[1]).slice(0, 8).map(x => x[0]);
  }
  function mountSearch(box, o = {}) {
    box.classList.add('ss');
    box.innerHTML = `<div class="ss-box">${ic('search')}<input type="search" enterkeyhint="go" aria-label="Search Rupya or type a money question" placeholder="${o.ph || 'Try “EMI 50 lakh 8.5% 20 years”'}" autocomplete="off" spellcheck="false">${o.btn ? '<button class="btn gold" type="button">Work it out</button>' : ''}</div><div class="ss-res" role="listbox" aria-label="Results"></div>`;
    const inp = $('input', box), res = $('.ss-res', box);
    let sel = 0, seq = 0, links = [];
    const render = (a, it) => {
      let h = '';
      if (a) h += `<a class="ss-ans" href="${R + a.u}"><small>${a.k}</small><b>${a.v}</b><span>${a.s}</span></a>`;
      h += it.map(e => `<a class="ss-it" href="${R + e[1]}">${ic(e[2] === 'Calculator' ? 'calc' : e[2] === 'Rates' ? 'fx' : e[2] === 'Guide' ? 'book' : 'arrow')}${e[0]}<small>${e[2]}</small></a>`).join('');
      if (!h) h = '<div class="ss-none">No match yet. Try a tool name, a currency like “AED to INR”, or a question like “SIP 10000 for 15 years”.</div>';
      res.innerHTML = h;
      links = $$('a', res); sel = 0; mark();
    };
    const mark = () => links.forEach((l, i) => l.setAttribute('aria-selected', i === sel));
    const run = () => {
      const q = inp.value.trim(), my = ++seq;
      if (!q) { box.classList.remove('on'); return; }
      box.classList.add('on');
      const a = answer(q), it = find(q);
      if (a && a.then) { render(null, it); a.then(x => { if (my === seq && x) render(x, it); }); } else render(a, it);
    };
    inp.addEventListener('input', run);
    inp.addEventListener('focus', () => { if (inp.value.trim()) run(); });
    inp.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (links.length) { sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length; mark(); } }
      if (e.key === 'Enter') { e.preventDefault(); if (links[sel]) location.href = links[sel].href; }
      if (e.key === 'Escape') { box.classList.remove('on'); if (o.onEsc) o.onEsc(); }
    });
    const b = $('.btn', box); if (b) b.onclick = () => { if (!inp.value.trim()) { inp.focus(); return; } run(); setTimeout(() => { if (links[0]) location.href = links[0].href; }, 350); };
    D.addEventListener('click', e => { if (!box.contains(e.target) && !o.modal) box.classList.remove('on'); });
    return inp;
  }
  let pal;
  function openPalette(q = '') {
    if (!pal) {
      pal = D.createElement('div'); pal.className = 'pal'; pal.setAttribute('role', 'dialog'); pal.setAttribute('aria-modal', 'true'); pal.setAttribute('aria-label', 'Search');
      pal.innerHTML = '<div></div>'; D.body.append(pal);
      pal._in = mountSearch(pal.firstChild, { modal: 1, ph: 'Search tools, rates, guides, or ask “100 USD to INR”', onEsc: closePalette });
      pal.addEventListener('click', e => { if (e.target === pal) closePalette(); });
    }
    pal.classList.add('on'); pal._in.value = q; pal._in.focus(); pal._in.dispatchEvent(new Event('input'));
  }
  const closePalette = () => pal && pal.classList.remove('on');
  D.addEventListener('keydown', e => {
    const tag = (e.target.tagName || '').toLowerCase(), typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
    if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) { e.preventDefault(); openPalette(); }
    if (e.key === 'Escape') closePalette();
  });

  /* ---------- shell ---------- */
  const here = location.pathname.replace(/index\.html$/, '');
  const L = (u, t) => `<a href="${R + u}"${here.endsWith('/' + u.replace(/index\.html$/, '')) && u !== 'index.html' ? ' aria-current="page"' : ''}>${t}</a>`;
  const cl = s => ['calculators/' + s + '.html', CN[s]];
  const NAV = [
    ['Calculators', 'calculators/index.html', 3, [
      ['Invest', ['sip', 'step-up-sip', 'lumpsum', 'goal-sip', 'swp'].map(cl)], ['Borrow', ['emi', 'home-loan', 'car-loan', 'loan-eligibility', 'prepayment'].map(cl)],
      ['Tax & salary', ['income-tax', 'salary', 'hra', 'gratuity', 'capital-gains'].map(cl)], ['Save safely', ['fd', 'ppf', 'ssy', 'scss', 'rd'].map(cl)],
      ['Plan', ['retirement', 'nps', 'epf', 'fire', 'life-cover'].map(cl)], ['Everyday', ['gst', 'gold', 'percentage', 'budget', 'discount'].map(cl)]
    ], 'All 45 calculators'],
    ['Rates', 'rates.html', 2, [
      ['Currency', [['currency.html', 'Rupee converter'], [pairUrl('USD'), 'US dollar to rupee'], [pairUrl('AED'), 'UAE dirham to rupee'], [pairUrl('GBP'), 'British pound to rupee'], [pairUrl('EUR'), 'Euro to rupee'], [pairUrl('SAR'), 'Saudi riyal to rupee']]],
      ['Markets', [['rates.html', 'Today’s rates'], ['gold-rate-today.html', 'Gold rate today'], ['silver-rate-today.html', 'Silver rate today'], ['crypto-prices-inr.html', 'Crypto prices in INR'], ['ifsc-code-finder.html', 'IFSC code finder'], ['rupees-in-words.html', 'Rupees in words']]]
    ], 'All rates'],
    ['Learn', 'guides/index.html', 2, [
      ['Read', [['guides/index.html', 'Money guides'], ['guides/new-vs-old-tax-regime.html', 'New vs old tax regime'], ['guides/sip-for-beginners.html', 'SIP for beginners'], ['guides/upi-safety.html', 'Staying safe on UPI'], ['glossary.html', 'Glossary']]],
      ['Do', [['money-checkup.html', 'Money check-up'], ['contest.html', 'Money quiz and prizes'], ['videos.html', 'Video lessons'], ['my-rupya.html', 'My Rupya'], ['support.html', 'Support Rupya']]]
    ], 'All guides']
  ];
  const hdr = $('#hdr');
  if (hdr) {
    hdr.innerHTML = `<div class="wrap hd"><a class="logo" href="${R}index.html" aria-label="Rupya home">${LOGO}<b>rupya</b><i lang="hi">रुपया</i></a>` +
      `<nav class="nv" aria-label="Main">${NAV.map(n => `<div class="nv-i"><a class="nv-b" href="${R + n[1]}" aria-haspopup="true">${n[0]}${ic('down')}</a><div class="nv-p" style="--cols:${n[2]}">${n[3].map(c => `<div><h4>${c[0]}</h4>${c[1].map(l => L(l[0], l[1])).join('')}</div>`).join('')}<a class="all" href="${R + n[1]}">${n[4]}</a></div></div>`).join('')}</nav>` +
      `<button class="sbtn" type="button" aria-label="Search">${ic('search')}<span>Search or ask</span><kbd>/</kbd></button>` +
      `<button class="ib th" type="button" aria-label="Switch light or dark theme">${ic('moon')}</button>` +
      `<a class="btn gold sm" href="${R}advisor.html">Free advice</a><button class="ib burger" type="button" aria-label="Open menu" aria-expanded="false">${ic('menu')}</button></div>`;
    $('.sbtn', hdr).onclick = () => openPalette();
    const th = $('.th', hdr);
    const setIc = () => { const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme:dark)').matches; th.innerHTML = ic(dark ? 'sun' : 'moon'); };
    setIc();
    th.onclick = () => { const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme:dark)').matches; root.dataset.theme = dark ? 'light' : 'dark'; store.set('theme', root.dataset.theme); setIc(); D.dispatchEvent(new Event('rupya-theme')); };
    $$('.nv-i', hdr).forEach(i => { $('.nv-b', i).addEventListener('keydown', e => { if (e.key === 'Escape') i.classList.remove('open'); }); });
    const dr = D.createElement('div'); dr.className = 'drawer'; dr.setAttribute('role', 'dialog'); dr.setAttribute('aria-label', 'Menu');
    dr.innerHTML = `<div class="dh"><a class="logo" href="${R}index.html">${LOGO}<b>rupya</b></a><button class="ib" type="button" aria-label="Close menu">${ic('close')}</button></div><div class="sbox"></div>` +
      NAV.map(n => `<details><summary>${n[0]}</summary>${n[3].flatMap(c => c[1]).map(l => L(l[0], l[1])).join('')}${L(n[1], n[4])}</details>`).join('') +
      `<details><summary>Rupya</summary>${L('about.html', 'About')}${L('support.html', 'Support Rupya')}${L('contact.html', 'Contact')}</details><a class="btn gold" href="${R}advisor.html">Get free advice</a>`;
    D.body.append(dr);
    mountSearch($('.sbox', dr), { ph: 'Search or ask a money question' });
    const bg = $('.burger', hdr);
    bg.onclick = () => { dr.classList.add('on'); bg.setAttribute('aria-expanded', 'true'); D.body.style.overflow = 'hidden'; };
    $('.dh .ib', dr).onclick = () => { dr.classList.remove('on'); bg.setAttribute('aria-expanded', 'false'); D.body.style.overflow = ''; };
  }

  const ftr = $('#ftr');
  if (ftr) {
    const col = (h, ls) => `<div><h4>${h}</h4><nav aria-label="${h}">${ls.map(l => `<a href="${l[0].startsWith('http') ? l[0] : R + l[0]}">${l[1]}</a>`).join('')}</nav></div>`;
    ftr.innerHTML = `<svg class="gl" aria-hidden="true"></svg><div class="wrap ft"><div><a class="logo" href="${R}index.html">${LOGO}<b>rupya</b><i lang="hi">रुपया</i></a><p style="margin-top:14px;max-width:32ch">Free calculators, live rupee rates and plain-English money guides for India and Indians abroad.</p><form class="inline" data-form="Newsletter signup"><label class="sr" for="nl-e">Email address</label><input id="nl-e" type="email" name="email" required placeholder="Your email"><button class="btn gold sm">Get the weekly note</button></form><p class="note" style="margin-top:8px;color:#8D99B2">One email a week: rate changes, new tools, no spam.</p></div>` +
      col('Calculators', [cl('sip'), cl('emi'), cl('income-tax'), cl('salary'), cl('ppf'), cl('fd'), cl('retirement'), ['calculators/index.html', 'All 45 calculators']]) +
      col('Rates and tools', [['rates.html', 'Today’s rates'], ['currency.html', 'Rupee converter'], [pairUrl('USD'), 'Dollar to rupee'], ['gold-rate-today.html', 'Gold rate today'], ['crypto-prices-inr.html', 'Crypto in INR'], ['ifsc-code-finder.html', 'IFSC finder'], ['rupees-in-words.html', 'Rupees in words']]) +
      col('Learn', [['guides/index.html', 'Money guides'], ['glossary.html', 'Glossary'], ['videos.html', 'Video lessons'], ['contest.html', 'Quiz and prizes'], ['money-checkup.html', 'Money check-up'], ['my-rupya.html', 'My Rupya']]) +
      col('Rupya', [['about.html', 'About'], ['advisor.html', 'Free advice'], ['support.html', 'Support Rupya'], ['support.html#hire', 'Work with us'], ['https://web.works/contact', 'Advertise or sponsor'], ['editorial-policy.html', 'Editorial policy'], ['contact.html', 'Contact'], ['privacy.html', 'Privacy'], ['terms.html', 'Terms'], ['disclaimer.html', 'Disclaimer']]) +
      `</div><div class="wrap fine"><p>© ${new Date().getFullYear()} Rupya.com. Educational information only; not financial, tax, legal or investment advice. Rates are indicative.</p><p>“Rupya” is used as a transliteration of रुपया, the common Hindi word for the rupee. Rupya.com is independent and is not affiliated with the Reserve Bank of India, the Government of India, NPCI or RuPay, or any company with a similar name. Other names and marks belong to their owners. <a href="${R}disclaimer.html">Full disclosure</a>.</p></div>`;
    guilloche($('.gl', ftr));
  }

  /* ---------- cookie notice ---------- */
  if (!store.get('ck')) {
    const c = D.createElement('div'); c.className = 'cookie'; c.setAttribute('role', 'region'); c.setAttribute('aria-label', 'Cookie notice');
    c.innerHTML = `<p>We use cookies to remember your settings and, through Google AdSense, to show and measure ads. <a href="${R}privacy.html">Privacy policy</a></p><button class="btn sm" type="button">OK</button>`;
    D.body.append(c);
    $('button', c).onclick = () => { store.set('ck', 1); c.remove(); };
  }

  /* ---------- forms: delivered by email; the inbox is stored encoded and never printed ---------- */
  const K = [126, 108, 105, 126, 118, 121, 114, 122, 104, 56, 71, 110, 116, 104, 112, 115, 53, 106, 118, 116];
  const inbox = () => String.fromCharCode(...K.map(c => c - 7));
  const trap = f => { if (!f.querySelector('[name=_honey]')) f.insertAdjacentHTML('beforeend', '<input name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px">'); };
  $$('form[data-form]').forEach(trap);
  new MutationObserver(() => $$('form[data-form]').forEach(trap)).observe(D.body, { childList: true, subtree: true });
  D.addEventListener('submit', async e => {
    const f = e.target;
    if (!f.matches || !f.matches('form[data-form]')) return;
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    if (d._honey) return;
    delete d._honey;
    const subject = '[Rupya.com] ' + f.dataset.form;
    const btn = f.querySelector('button:not([type=button])');
    let msg = $('.fmsg', f);
    if (!msg) { msg = D.createElement('p'); msg.className = 'fmsg'; msg.setAttribute('role', 'status'); f.append(msg); }
    if (btn) btn.disabled = true;
    msg.textContent = 'Sending…';
    try {
      const r = await fetch('https://formsubmit.co/ajax/' + inbox(), {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...d, _subject: subject, _template: 'table', _captcha: 'false', page: location.href })
      });
      const j = await r.json();
      if (!r.ok || String(j.success) !== 'true') throw new Error('rejected');
      f.innerHTML = `<p class="ok">${f.dataset.ok || 'Thank you. We have your details and will reply by email.'}</p>`;
      f.dispatchEvent(new CustomEvent('rupya-sent', { bubbles: true }));
    } catch (err) {
      if (btn) btn.disabled = false;
      msg.innerHTML = 'That did not send. Check your connection and try again, or <button type="button" class="link">send it from your email app</button>.';
      $('button', msg).onclick = () => {
        const body = Object.entries(d).map(p => p[0] + ': ' + p[1]).join('\n');
        location.href = 'mailto:' + inbox() + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      };
    }
  });

  /* ---------- structured data ---------- */
  const ld = o => { const s = D.createElement('script'); s.type = 'application/ld+json'; s.textContent = JSON.stringify(o); D.head.append(s); };
  const abs = h => new URL(h, location.href).href;
  const crumb = $('.crumb');
  if (crumb) {
    const it = $$('a', crumb).map(a => ({ name: a.textContent.trim(), item: abs(a.getAttribute('href')) }));
    const h1 = $('h1');
    if (h1) it.push({ name: h1.textContent.trim(), item: location.href.split('#')[0] });
    ld({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: it.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.name, item: x.item })) });
  }
  const faqs = $$('main details').filter(d => $('summary', d) && !d.closest('.drawer'));
  if (faqs.length >= 2) ld({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(d => { const c = d.cloneNode(true); $('summary', c).remove(); return { '@type': 'Question', name: $('summary', d).textContent.trim(), acceptedAnswer: { '@type': 'Answer', text: c.textContent.trim().replace(/\s+/g, ' ') } }; }) });
  const calcHost = $('[data-calc]:not([data-mini])');
  if (calcHost) {
    const h1 = $('h1'), t = h1 ? h1.textContent.trim() : 'Calculator';
    ld({ '@context': 'https://schema.org', '@type': 'WebApplication', name: t, url: location.href.split('#')[0], applicationCategory: 'FinanceApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' }, publisher: { '@type': 'Organization', name: 'Rupya.com' } });
    const rec = store.get('recent', []).filter(x => x.u !== location.pathname);
    rec.unshift({ u: location.pathname, t }); store.set('recent', rec.slice(0, 8));
  }

  /* ---------- app shell: manifest, theme colour, offline ---------- */
  const m = D.createElement('link'); m.rel = 'manifest'; m.href = R + 'manifest.webmanifest'; D.head.append(m);
  const tc = D.createElement('meta'); tc.name = 'theme-color'; tc.content = '#0E1830'; D.head.append(tc);
  if ('serviceWorker' in navigator && location.protocol === 'https:') addEventListener('load', () => navigator.serviceWorker.register(R + 'sw.js').catch(() => {}));

  /* ---------- page hooks ---------- */
  $$('[data-search]').forEach(b => mountSearch(b, { btn: b.hasAttribute('data-btn'), ph: b.dataset.search || undefined }));
  $$('[data-q]').forEach(b => b.addEventListener('click', () => { const t = $('[data-search] input') || null; if (t) { t.value = b.dataset.q; t.focus(); t.dispatchEvent(new Event('input')); } else openPalette(b.dataset.q); }));
  const q = new URLSearchParams(location.search).get('q');
  if (q) setTimeout(() => openPalette(q), 50);
  $$('svg[data-guilloche]').forEach(s => guilloche(s, { draw: s.dataset.guilloche === 'draw' }));

  window.Rupya = { R, $, $$, store, inr, human, short, num, words, rupeeWords, ic, chart, spark, chg, guilloche, live, toast, openPalette, CALCS, CN, CAT, CUR, PAIRS, REV, pairUrl, CRYPTO, OZ, DUTY, GST };
  const sp = D.createElement('div');
  sp.innerHTML = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${Object.entries(IC).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`).join('')}</svg>`;
  D.body.prepend(sp.firstChild);
})();

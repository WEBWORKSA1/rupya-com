/* Rupya.com currency tools: live INR rates, converter, table, history chart, amount in words. */
(() => {
  const R = (window.Rupya || {}).R || '';
  const $ = q => document.querySelector(q);
  const CUR = { INR: 'Indian Rupee', USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', AED: 'UAE Dirham', SAR: 'Saudi Riyal', QAR: 'Qatari Riyal', KWD: 'Kuwaiti Dinar', OMR: 'Omani Rial', BHD: 'Bahraini Dinar', SGD: 'Singapore Dollar', AUD: 'Australian Dollar', CAD: 'Canadian Dollar', NZD: 'New Zealand Dollar', JPY: 'Japanese Yen', CNY: 'Chinese Yuan', HKD: 'Hong Kong Dollar', CHF: 'Swiss Franc', MYR: 'Malaysian Ringgit', THB: 'Thai Baht', LKR: 'Sri Lankan Rupee', NPR: 'Nepalese Rupee', BDT: 'Bangladeshi Taka', PKR: 'Pakistani Rupee', ZAR: 'South African Rand', RUB: 'Russian Rouble' };
  const HIST = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'JPY', 'CHF', 'CNY', 'HKD', 'NZD', 'MYR', 'THB', 'ZAR'];
  const num = (n, d = 2) => n.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
  let rates = null, stamp = '';

  async function load() {
    try {
      const j = await (await fetch('https://open.er-api.com/v6/latest/INR')).json();
      if (j.result !== 'success') throw 0;
      rates = j.rates; stamp = new Date(j.time_last_update_unix * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      try {
        const j = await (await fetch(R + 'data/rates.json')).json();
        if (j.rates && j.rates.USD) { rates = j.rates; stamp = j.updated || ''; }
      } catch (e2) {}
    }
    render();
  }
  const conv = (a, f, t) => a / rates[f] * rates[t];

  function render() {
    const tk = $('#ticker'), fx = $('#fx'), tb = $('#fxtable'), st = $('#fxstamp');
    if (!rates) { [tk, tb].forEach(e => e && (e.innerHTML = '<span class="note">Live rates are unavailable right now. Please try again shortly.</span>')); return; }
    if (st) st.textContent = 'Rates updated ' + stamp + '.';
    if (tk) tk.innerHTML = ['USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD'].map(c => `<span class="chip">1 ${c} = <b>₹${num(conv(1, c, 'INR'))}</b></span>`).join('');
    if (tb) tb.innerHTML = '<tr><th>Currency</th><th>1 unit in ₹</th><th>₹1,000 buys</th></tr>' + Object.keys(CUR).filter(c => c !== 'INR' && rates[c]).map(c => `<tr><td><b>${c}</b> · ${CUR[c]}</td><td>₹${num(conv(1, c, 'INR'), conv(1, c, 'INR') < 1 ? 4 : 2)}</td><td>${num(conv(1000, 'INR', c))} ${c}</td></tr>`).join('');
    if (fx) calc();
  }

  function calc() {
    const a = parseFloat($('#fxa').value) || 0, f = $('#fxf').value, t = $('#fxt').value;
    if (!rates || !rates[f] || !rates[t]) return;
    $('#fxo').innerHTML = `<div class="out big"><span>${num(a)} ${f} =</span><b>${num(conv(a, f, t))} ${t}</b></div><p class="note">1 ${f} = ${num(conv(1, f, t), 4)} ${t} · 1 ${t} = ${num(conv(1, t, f), 4)} ${f}. Mid-market reference rate; banks and money changers add a margin.</p>`;
  }

  const fx = $('#fx');
  if (fx) {
    const opts = s => Object.keys(CUR).map(c => `<option value="${c}"${c === s ? ' selected' : ''}>${c} · ${CUR[c]}</option>`).join('');
    fx.innerHTML = `<div class="f"><label for="fxa">Amount</label><input id="fxa" type="number" inputmode="decimal" min="0" value="${fx.dataset.amount || 1000}"></div><div class="row" style="display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:end"><div><label for="fxf">From</label><select id="fxf">${opts(fx.dataset.from || 'USD')}</select></div><button type="button" class="theme" id="fxs" aria-label="Swap currencies">⇄</button><div><label for="fxt">To</label><select id="fxt">${opts(fx.dataset.to || 'INR')}</select></div></div><div id="fxo" aria-live="polite" style="margin-top:14px"><p class="note">Loading live rates…</p></div>`;
    fx.addEventListener('input', calc);
    $('#fxs').onclick = () => { const f = $('#fxf'), t = $('#fxt'), x = f.value; f.value = t.value; t.value = x; calc(); };
  }

  /* 90-day history (ECB reference rates via Frankfurter) */
  const ch = $('#fxchart');
  if (ch) {
    const sel = $('#fxh');
    sel.innerHTML = HIST.map(c => `<option value="${c}">${c} to INR</option>`).join('');
    let pts = [];
    const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const draw = () => {
      if (!pts.length) return;
      const d = devicePixelRatio || 1, w = ch.clientWidth, h = ch.clientHeight, x = ch.getContext('2d');
      ch.width = w * d; ch.height = h * d; x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, w, h);
      const v = pts.map(p => p[1]), lo = Math.min(...v), hi = Math.max(...v), sp = hi - lo || 1, px = i => 8 + i / (pts.length - 1 || 1) * (w - 16), py = n => h - 26 - (n - lo) / sp * (h - 46);
      x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(px(i), py(p[1])) : x.moveTo(px(i), py(p[1])));
      x.strokeStyle = css('--green'); x.lineWidth = 2.5; x.stroke();
      x.lineTo(px(pts.length - 1), h - 26); x.lineTo(px(0), h - 26); x.closePath(); x.globalAlpha = .14; x.fillStyle = css('--green'); x.fill(); x.globalAlpha = 1;
      x.fillStyle = css('--muted'); x.font = '12px system-ui';
      x.fillText(pts[0][0], 8, h - 8); x.textAlign = 'right'; x.fillText(pts[pts.length - 1][0], w - 8, h - 8);
      x.fillText('High ₹' + num(hi) + ' · Low ₹' + num(lo), w - 8, 14); x.textAlign = 'left';
    };
    const get = async () => {
      const c = sel.value, from = new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10), info = $('#fxhi');
      try {
        const j = await (await fetch(`https://api.frankfurter.dev/v1/${from}..?base=${c}&symbols=INR`)).json();
        pts = Object.entries(j.rates).map(e => [e[0], e[1].INR]);
        const a = pts[0][1], b = pts[pts.length - 1][1];
        info.textContent = `1 ${c} moved from ₹${num(a)} to ₹${num(b)} over 90 days (${b >= a ? '+' : ''}${num((b / a - 1) * 100)}%).`;
        draw();
      } catch (e) { info.textContent = 'History is unavailable right now.'; }
    };
    sel.onchange = get; addEventListener('resize', draw); document.addEventListener('rupya-theme', draw); get();
  }

  /* Amount in words, Indian numbering */
  const wi = $('#words');
  if (wi) {
    const O = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'], T = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const two = n => n < 20 ? O[n] : T[Math.floor(n / 10)] + (n % 10 ? '-' + O[n % 10] : '');
    const three = n => (n >= 100 ? O[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' : '') : '') + two(n % 100);
    const words = n => {
      if (n === 0) return 'zero';
      let s = '';
      const cr = Math.floor(n / 1e7), la = Math.floor(n % 1e7 / 1e5), th = Math.floor(n % 1e5 / 1e3), re = n % 1e3;
      if (cr) s += words(cr) + ' crore ';
      if (la) s += two(la) + ' lakh ';
      if (th) s += two(th) + ' thousand ';
      if (re) s += three(re);
      return s.trim();
    };
    window.rupyaWords = words;
    const show = () => {
      const v = Math.abs(parseFloat(wi.value) || 0), r = Math.floor(v), p = Math.round((v - r) * 100);
      if (r > 9999999999999) { $('#wordso').textContent = 'That number is too large.'; return; }
      const t = 'Rupees ' + words(r) + (p ? ' and ' + two(p) + ' paise' : '') + ' only';
      $('#wordso').textContent = t.replace(/\b[a-z]/g, c => c.toUpperCase()).replace(/\bAnd\b/g, 'and');
      $('#wordsn').textContent = '₹' + v.toLocaleString('en-IN', { maximumFractionDigits: 2 });
    };
    wi.addEventListener('input', show); show();
  }

  if ($('#ticker') || fx || $('#fxtable')) load();
})();

/* Rupya.com live markets: converter, medallion, board, rate tables, history, pair pages, metals, crypto, IFSC, words */
(() => {
  const U = window.Rupya; if (!U) return;
  const { $, $$, inr, num, human, ic, live, CUR, PAIRS, REV, pairUrl, R } = U;
  const D = document;
  const fmtR = v => '₹' + num(v, v < 1 ? 4 : 2);
  const when = t => t ? new Date(t).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
  const fail = (el, what) => { el.innerHTML = `<p class="note">${what} could not load just now. Check your connection and refresh the page.</p>`; };
  const opts = (sel, skip) => Object.keys(CUR).filter(c => c !== skip).map(c => `<option value="${c}"${c === sel ? ' selected' : ''}>${c} · ${CUR[c][0]}</option>`).join('');
  const toINR = (fx, c) => 1 / fx.r[c];

  /* converter */
  function initConv(el) {
    const fixed = el.hasAttribute('data-fixed');
    let from = el.dataset.from || 'USD', to = el.dataset.to || 'INR';
    el.classList.add('conv');
    el.innerHTML = `<div class="conv-g"><div class="amt"><label for="cv-a">Amount</label><input id="cv-a" type="number" inputmode="decimal" min="0" step="any" value="${el.dataset.amount || 1}"></div>` +
      `<div><label for="cv-f">From</label><select id="cv-f"${fixed ? ' disabled' : ''}>${opts(from)}</select></div><button class="swap" type="button" aria-label="Swap currencies">${ic('fx')}</button><div><label for="cv-t">To</label><select id="cv-t"${fixed ? ' disabled' : ''}>${opts(to)}</select></div></div><div class="conv-r" aria-live="polite"><p class="note">Loading live rates…</p></div>`;
    const a = $('#cv-a', el), f = $('#cv-f', el), t = $('#cv-t', el), out = $('.conv-r', el);
    let fx;
    const run = () => {
      if (!fx) return;
      const amt = parseFloat(a.value) || 0, F = f.value, T = t.value, v = amt / fx.r[F] * fx.r[T], one = 1 / fx.r[F] * fx.r[T];
      const pg = T === 'INR' && PAIRS.includes(F) ? pairUrl(F) : F === 'INR' && REV.includes(T) ? pairUrl(T, 1) : null;
      out.innerHTML = `<span class="from">${num(amt, amt % 1 ? 2 : 0)} ${CUR[F][0]}${amt === 1 ? '' : 's'} equals</span><span class="big">${T === 'INR' ? '₹' + num(v) : num(v, v < 1 ? 4 : 2) + ' ' + T}</span>` +
        (T === 'INR' && v >= 1e3 ? `<span class="w">${human(v)}</span>` : '') +
        `<p class="note" style="margin:10px 0 0">1 ${F} = ${num(one, one < 1 ? 6 : 4)} ${T} · 1 ${T} = ${num(1 / one, 1 / one < 1 ? 6 : 4)} ${F}<br>Mid-market rate, ${fx.live ? 'updated ' + when(fx.t) : 'from the last saved snapshot (' + when(fx.t) + ')'}. Banks and transfer services add a margin.${pg && !el.hasAttribute('data-nolink') ? ` <a href="${R + pg}">${F} to ${T} chart and tables</a>` : ''}</p>`;
    };
    [a, f, t].forEach(x => x.addEventListener('input', run));
    $('.swap', el).onclick = () => { const x = f.value; f.value = t.value; t.value = x; run(); el.dispatchEvent(new CustomEvent('swap', { detail: { from: f.value, to: t.value } })); };
    live.rates().then(r => { fx = r; run(); }).catch(() => fail(out, 'Live rates'));
  }
  $$('[data-conv]').forEach(initConv);

  /* hero medallion */
  $$('[data-medallion]').forEach(el => {
    const list = (el.dataset.medallion || 'USD,AED,GBP,EUR,SAR').split(',');
    el.classList.add('med');
    el.innerHTML = `<svg class="gl" aria-hidden="true"></svg><div class="med-c"><span class="k">1 US Dollar</span><span class="v">₹—</span><span class="d"></span><a href="${R}currency.html">Convert any currency</a></div><div class="med-t" role="group" aria-label="Choose currency">${list.map((c, i) => `<button type="button" aria-pressed="${!i}" data-c="${c}">${c}</button>`).join('')}</div>`;
    U.guilloche($('svg', el), { draw: true });
    let fx, h, cur = list[0];
    const show = () => {
      if (!fx) return;
      const v = toINR(fx, cur), s = h && h.s[cur], first = s && s.find(isFinite);
      $('.k', el).textContent = '1 ' + CUR[cur][0];
      $('.v', el).textContent = '₹' + num(v);
      $('.d', el).innerHTML = first ? U.chg(first, v) + ' <span style="color:#8E9BB6">in 30 days</span>' : '';
      $('a', el).href = R + (PAIRS.includes(cur) ? pairUrl(cur) : 'currency.html');
      $('a', el).textContent = 'See ' + cur + ' to INR';
    };
    $('.med-t', el).onclick = e => { const b = e.target.closest('button'); if (!b) return; cur = b.dataset.c; $$('button', el).forEach(x => x.setAttribute('aria-pressed', x === b)); show(); };
    live.rates().then(r => { fx = r; show(); }).catch(() => { $('.v', el).textContent = 'Offline'; });
    live.hist(30).then(r => { h = r; show(); }).catch(() => {});
  });

  /* live board */
  $$('[data-board]').forEach(el => {
    const items = (el.dataset.board || 'g24,ag,USD,AED,GBP,EUR,BTC,repo').split(',');
    const L = { g24: ['Gold 24K, 10 g', 'gold-rate-today.html'], g22: ['Gold 22K, 10 g', 'gold-rate-today.html'], ag: ['Silver, 1 kg', 'silver-rate-today.html'], BTC: ['Bitcoin', 'crypto-prices-inr.html'], repo: ['RBI repo rate', 'rates.html'] };
    el.classList.add('board');
    el.innerHTML = items.map(k => { const l = L[k] || [k + ' to INR', PAIRS.includes(k) ? pairUrl(k) : 'currency.html']; return `<a class="bd" data-k="${k}" href="${R + l[1]}"><span class="l">${l[0]}</span><span class="v">${k === 'repo' ? '5.50%' : '…'}</span><span class="c">${k === 'repo' ? '<span class="dn">+0.25 on 7 Oct 2026</span>' : '&nbsp;'}</span></a>`; }).join('');
    const set = (k, v, c, sp) => { const b = $(`[data-k="${k}"]`, el); if (!b) return; $('.v', b).textContent = v; $('.c', b).innerHTML = c || '&nbsp;'; if (sp) b.insertAdjacentHTML('beforeend', sp); };
    const lightBg = el.classList.contains('l');
    Promise.all([live.rates(), live.hist(30).catch(() => null)]).then(([fx, h]) => items.filter(k => CUR[k]).forEach(k => {
      const v = toINR(fx, k), s = h && h.s[k], f = s && s.find(isFinite);
      set(k, '₹' + num(v), f ? U.chg(f, v) + ' 30d' : '', s ? U.spark([...s, v], lightBg ? 'var(--c2)' : '#5DE3A8') : '');
    })).catch(() => {});
    if (items.some(k => k === 'g24' || k === 'g22' || k === 'ag')) live.metals().then(m => { set('g24', inr(m.g24 * 10), 'Excl. 3% GST'); set('g22', inr(m.g24 * 10 * 22 / 24), 'Excl. 3% GST'); set('ag', inr(m.ag * 1000), 'Excl. 3% GST'); }).catch(() => ['g24', 'g22', 'ag'].forEach(k => set(k, 'See rate', '')));
    if (items.includes('BTC')) live.crypto().then(c => { const b = c.bitcoin; set('BTC', human(b.inr).replace(' lakh', 'L').replace(' crore', 'Cr'), `<span class="${b.inr_24h_change >= 0 ? 'up' : 'dn'}">${b.inr_24h_change >= 0 ? '+' : '−'}${Math.abs(b.inr_24h_change).toFixed(2)}%</span> 24h`); }).catch(() => set('BTC', 'See price', ''));
  });

  /* full rates table */
  $$('[data-ratestable]').forEach(el => {
    el.classList.add('tbl', 'scroll');
    el.innerHTML = '<p class="note" style="padding:16px">Loading live rates…</p>';
    Promise.all([live.rates(), live.hist(30).catch(() => null)]).then(([fx, h]) => {
      const st = $('[data-stamp]'); if (st) st.textContent = (fx.live ? 'Live mid-market rates, updated ' : 'Saved snapshot from ') + when(fx.t) + '.';
      el.innerHTML = `<table><thead><tr><th scope="col">Currency</th><th scope="col">1 unit in rupees</th><th scope="col">₹1,000 buys</th><th scope="col">30-day change</th><th scope="col">Trend</th></tr></thead><tbody>` +
        Object.keys(CUR).filter(c => c !== 'INR' && fx.r[c]).map(c => { const v = toINR(fx, c), s = h && h.s[c], f = s && s.find(isFinite); return `<tr><td>${PAIRS.includes(c) ? `<a href="${R + pairUrl(c)}">${c}</a>` : `<b>${c}</b>`} <span class="muted">${CUR[c][0]}</span></td><td>${fmtR(v)}</td><td>${num(1000 * fx.r[c], 1000 * fx.r[c] < 10 ? 3 : 2)} ${c}</td><td>${f ? U.chg(f, v) : '<span class="muted">—</span>'}</td><td>${s ? `<span class="sp">${U.spark([...s, v], 'var(--c2)')}</span>` : ''}</td></tr>`; }).join('') + '</tbody></table>';
    }).catch(() => fail(el, 'Live rates'));
  });

  /* history chart */
  function hist(el, code, fixed) {
    const RG = [['1M', 31], ['3M', 92], ['1Y', 366], ['5Y', 1830]];
    const all = Object.keys(CUR).filter(c => U.CUR[c] && ['USD', 'EUR', 'GBP', 'SGD', 'AUD', 'CAD', 'NZD', 'JPY', 'CHF', 'CNY', 'HKD', 'MYR', 'THB', 'ZAR', 'AED', 'SAR', 'QAR', 'OMR', 'BHD'].includes(c));
    if (!all.includes(code)) { el.innerHTML = `<p class="note">Daily history for ${code} is not available from the European Central Bank reference series, so only today’s live rate is shown.</p>`; return; }
    el.innerHTML = `<div style="display:flex;gap:12px;justify-content:space-between;align-items:center;flex-wrap:wrap;margin-bottom:10px">${fixed ? `<b>${code} to INR</b>` : `<select aria-label="Currency" style="max-width:260px">${all.map(c => `<option value="${c}"${c === code ? ' selected' : ''}>${c} to INR · ${CUR[c][0]}</option>`).join('')}</select>`}<div class="rng" role="group" aria-label="Time range">${RG.map((r, i) => `<button type="button" aria-pressed="${i === 1}" data-d="${r[1]}">${r[0]}</button>`).join('')}</div></div><div class="hc"></div><p class="note hn" style="margin:8px 0 0"></p>`;
    let d = 92;
    const go = () => {
      const c = fixed ? code : $('select', el).value, hc = $('.hc', el), hn = $('.hn', el);
      hn.textContent = 'Loading history…';
      live.hist(d).then(h => {
        const s = h.s[c], idx = s.map((v, i) => i).filter(i => isFinite(s[i])), a = s[idx[0]], b = s[idx[idx.length - 1]], vs = idx.map(i => s[i]);
        U.chart(hc, { x: h.dates.map(x => new Date(x).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: d > 366 ? '2-digit' : undefined })), s: [{ n: '1 ' + c + ' in rupees', d: s, c: 'var(--c2)' }], f: v => '₹' + num(v, v < 10 ? 3 : 2), zero: false, h: 250, label: c + ' to INR history' });
        hn.innerHTML = `1 ${c} went from ₹${num(a)} to ₹${num(b)} (${U.chg(a, b)}). High ₹${num(Math.max(...vs))}, low ₹${num(Math.min(...vs))}. European Central Bank reference rates${['AED', 'SAR', 'QAR', 'OMR', 'BHD'].includes(c) ? ', derived through the currency’s fixed peg to the US dollar' : ''}.`;
        el.dispatchEvent(new CustomEvent('hist', { detail: { s, vs, a, b } }));
      }).catch(() => { hn.textContent = 'History could not load just now. Refresh the page to try again.'; });
    };
    el.addEventListener('click', e => { const b = e.target.closest('[data-d]'); if (!b) return; d = +b.dataset.d; $$('[data-d]', el).forEach(x => x.setAttribute('aria-pressed', x === b)); go(); });
    if (!fixed) $('select', el).onchange = go;
    go();
  }
  $$('[data-hist]').forEach(el => hist(el, el.dataset.hist || 'USD', el.hasAttribute('data-fixed')));

  /* pair pages */
  $$('[data-pair]').forEach(el => {
    const c = el.dataset.pair, rev = el.hasAttribute('data-rev'), name = CUR[c][0];
    const A1 = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000], A2 = [100, 500, 1000, 2000, 5000, 10000, 25000, 50000, 100000, 500000, 1000000];
    el.innerHTML = `<div class="cx" style="margin-top:8px"><div data-conv data-fixed data-nolink data-from="${rev ? 'INR' : c}" data-to="${rev ? c : 'INR'}" data-amount="${rev ? 1000 : 1}"></div><dl class="kv" style="align-self:stretch"><div><dt>Today</dt><dd class="p-now">…</dd></div><div><dt>30-day high</dt><dd class="p-hi">…</dd></div><div><dt>30-day low</dt><dd class="p-lo">…</dd></div><div><dt>1-year change</dt><dd class="p-1y">…</dd></div></dl></div>` +
      `<h2>${rev ? 'INR to ' + c : c + ' to INR'} history</h2><div class="panel"><div class="ph"></div></div>` +
      `<h2>Quick conversions</h2><div class="split"><div class="tbl"><table><thead><tr><th scope="col">${c}</th><th scope="col">INR</th></tr></thead><tbody class="q1"></tbody></table></div><div class="tbl"><table><thead><tr><th scope="col">INR</th><th scope="col">${c}</th></tr></thead><tbody class="q2"></tbody></table></div></div>` +
      `<h2>Other currencies to rupees</h2><div class="chips">${PAIRS.filter(x => x !== c).map(x => `<a class="chip" href="${x.toLowerCase()}-to-inr.html">${x} to INR</a>`).join('')}${REV.filter(x => x !== c || !rev).map(x => `<a class="chip" href="inr-to-${x.toLowerCase()}.html">INR to ${x}</a>`).join('')}</div>`;
    initConv($('[data-conv]', el));
    live.rates().then(fx => {
      const v = toINR(fx, c);
      $('.p-now', el).innerHTML = rev ? num(1000 * fx.r[c], 3) + ' ' + c + '<small>for ₹1,000</small>' : '₹' + num(v) + '<small>' + (fx.live ? 'Live mid-market' : 'Saved snapshot') + '</small>';
      $('.q1', el).innerHTML = A1.map(x => `<tr><td>${num(x, 0)} ${c}</td><td>₹${num(x * v)}</td></tr>`).join('');
      $('.q2', el).innerHTML = A2.map(x => `<tr><td>₹${num(x, 0)}</td><td>${num(x / v, x / v < 1 ? 4 : 2)} ${c}</td></tr>`).join('');
    }).catch(() => { $('.p-now', el).textContent = 'Offline'; });
    const ph = $('.ph', el);
    hist(ph, c, true);
    live.hist(366).then(h => {
      const s = h.s[c]; if (!s) { ['.p-hi', '.p-lo', '.p-1y'].forEach(q => $(q, el).innerHTML = '—<small>No history series</small>'); return; }
      const vs = s.filter(isFinite), m = vs.slice(-22), inv = x => rev ? num(1000 / x, 3) + ' ' + c : '₹' + num(x);
      $('.p-hi', el).innerHTML = inv(rev ? Math.min(...m) : Math.max(...m)) + '<small>Last 30 days</small>';
      $('.p-lo', el).innerHTML = inv(rev ? Math.max(...m) : Math.min(...m)) + '<small>Last 30 days</small>';
      $('.p-1y', el).innerHTML = (rev ? U.chg(1 / vs[0], 1 / vs[vs.length - 1]) : U.chg(vs[0], vs[vs.length - 1])) + `<small>${rev ? 'Rupee’s buying power in ' + c : 'Rupees per ' + c}</small>`;
    }).catch(() => ['.p-hi', '.p-lo', '.p-1y'].forEach(q => $(q, el).innerHTML = '—'));
  });

  /* metals */
  $$('[data-metal]').forEach(el => {
    const gold = el.dataset.metal === 'gold';
    el.innerHTML = '<p class="note">Loading today’s price…</p>';
    live.metals().then(m => {
      const st = $('[data-stamp]'); if (st) st.textContent = 'Indicative price, updated ' + when(m.t) + '.';
      const k = [24, 22, 18], g = m.g24, ag = m.ag;
      const W = gold ? [[1, '1 gram'], [8, '8 grams (1 sovereign)'], [10, '10 grams'], [11.6638, '1 tola (11.66 g)'], [100, '100 grams']] : [[1, '1 gram'], [10, '10 grams'], [100, '100 grams'], [1000, '1 kilogram']];
      const big = gold ? `<dl class="kv">${k.map(x => `<div><dt>${x} karat, 10 g</dt><dd>${inr(g * 10 * x / 24)}<small>${inr(g * 10 * x / 24 * 1.03)} with 3% GST</small></dd></div>`).join('')}<div><dt>International price</dt><dd>$${num(m.xau)}<small>per troy ounce</small></dd></div></dl>`
        : `<dl class="kv"><div><dt>Silver, 1 kg</dt><dd>${inr(ag * 1000)}<small>${inr(ag * 1030)} with 3% GST</small></dd></div><div><dt>Silver, 10 g</dt><dd>${inr(ag * 10)}<small>${inr(ag * 10.3)} with 3% GST</small></dd></div><div><dt>Silver, 1 g</dt><dd>${inr(ag, 2)}</dd></div><div><dt>International price</dt><dd>$${num(m.xag)}<small>per troy ounce</small></dd></div></dl>`;
      const tb = `<div class="tbl scroll" style="margin-top:18px"><table><thead><tr><th scope="col">Weight</th>${gold ? k.map(x => `<th scope="col">${x}K</th>`).join('') : '<th scope="col">Silver (999)</th><th scope="col">With 3% GST</th>'}</tr></thead><tbody>${W.map(w => `<tr><td>${w[1]}</td>${gold ? k.map(x => `<td>${inr(g * w[0] * x / 24)}</td>`).join('') : `<td>${inr(ag * w[0])}</td><td>${inr(ag * w[0] * 1.03)}</td>`}</tr>`).join('')}</tbody></table></div>`;
      const how = `<div class="callout" style="margin-top:18px"><p><b>How this price is worked out.</b> International ${gold ? 'gold' : 'silver'} at $${num(gold ? m.xau : m.xag)} an ounce × ₹${num(m.usdinr)} per dollar ÷ 31.1035 grams per ounce × 1.15 for India’s 15% import duty = <b>${inr(gold ? g : ag, 2)} per gram</b> of ${gold ? '24 karat' : 'fine'} ${gold ? 'gold' : 'silver'}, before 3% GST. Jewellers’ rates differ by city and shop, and jewellery adds making charges.</p></div>`;
      el.innerHTML = big + tb + how;
    }).catch(() => fail(el, 'Today’s price'));
  });

  /* crypto */
  $$('[data-crypto]').forEach(el => {
    el.classList.add('tbl', 'scroll');
    el.innerHTML = '<p class="note" style="padding:16px">Loading prices…</p>';
    live.crypto().then(c => {
      const st = $('[data-stamp]'); if (st) st.textContent = 'Prices refresh every few minutes. Last loaded ' + when(Date.now()) + '.';
      el.innerHTML = `<table><thead><tr><th scope="col">Coin</th><th scope="col">Price in INR</th><th scope="col">24 hours</th><th scope="col">Price in USD</th><th scope="col">Market value</th></tr></thead><tbody>` +
        U.CRYPTO.filter(x => c[x[0]]).map(x => { const d = c[x[0]], ch = d.inr_24h_change || 0; return `<tr><td><b>${x[1]}</b> <span class="muted">${x[2]}</span></td><td>${inr(d.inr, d.inr < 100 ? 2 : 0)}</td><td><span class="${ch >= 0 ? 'up' : 'dn'}">${ch >= 0 ? '+' : '−'}${Math.abs(ch).toFixed(2)}%</span></td><td>$${num(d.usd, d.usd < 10 ? 4 : 2)}</td><td>${d.inr_market_cap ? human(d.inr_market_cap) : '—'}</td></tr>`; }).join('') + '</tbody></table>';
    }).catch(() => fail(el, 'Crypto prices'));
  });

  /* IFSC finder */
  $$('[data-ifsc]').forEach(el => {
    el.innerHTML = `<form class="inline" onsubmit="return false"><label class="sr" for="ifsc">IFSC code</label><input id="ifsc" maxlength="11" autocomplete="off" spellcheck="false" placeholder="e.g. SBIN0000300" style="text-transform:uppercase;font-weight:600;letter-spacing:.04em"><button class="btn" type="submit">Find branch</button></form><div class="ifr" aria-live="polite" style="margin-top:18px"></div>`;
    const inp = $('input', el), out = $('.ifr', el);
    const go = () => {
      const v = inp.value.trim().toUpperCase();
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(v)) { out.innerHTML = '<p class="callout">An IFSC has 11 characters: four letters for the bank, a zero, then six letters or numbers for the branch. For example SBIN0000300.</p>'; return; }
      out.innerHTML = '<p class="note">Looking up ' + v + '…</p>';
      fetch('https://ifsc.razorpay.com/' + v).then(r => { if (r.status === 404) throw new Error('nf'); if (!r.ok) throw new Error('net'); return r.json(); }).then(d => {
        const yn = b => b ? '<span class="up">Yes</span>' : '<span class="muted">No</span>';
        out.innerHTML = `<div class="panel"><h3 style="margin:0 0 4px">${d.BANK}</h3><p class="muted" style="margin:0 0 14px">${d.BRANCH} branch · ${d.CITY}, ${d.STATE}</p><dl class="facts"><div><dt>IFSC</dt><dd>${d.IFSC}</dd></div><div><dt>MICR</dt><dd>${d.MICR || '—'}</dd></div><div><dt>SWIFT</dt><dd>${d.SWIFT || '—'}</dd></div><div><dt>District</dt><dd>${d.DISTRICT || '—'}</dd></div><div><dt>NEFT</dt><dd>${yn(d.NEFT)}</dd></div><div><dt>RTGS</dt><dd>${yn(d.RTGS)}</dd></div><div><dt>IMPS</dt><dd>${yn(d.IMPS)}</dd></div><div><dt>UPI</dt><dd>${yn(d.UPI)}</dd></div></dl><p style="margin:0"><b>Address:</b> ${d.ADDRESS}</p>${d.CONTACT ? `<p class="note" style="margin:8px 0 0">Branch contact on record: ${d.CONTACT}</p>` : ''}</div>`;
        const r = U.store.get('ifsc', []).filter(x => x !== v); r.unshift(v); U.store.set('ifsc', r.slice(0, 5));
      }).catch(e => { out.innerHTML = `<p class="callout">${e.message === 'nf' ? 'No branch has the code ' + v + '. Check it against your cheque book or passbook; the fifth character is always zero.' : 'The lookup service did not respond. Try again in a moment.'}</p>`; });
    };
    $('form', el).addEventListener('submit', go);
    const pre = location.hash.slice(1).toUpperCase(); if (/^[A-Z]{4}0/.test(pre)) { inp.value = pre; go(); }
  });

  /* rupees in words */
  $$('[data-words]').forEach(el => {
    el.innerHTML = `<label for="w-in">Amount in rupees</label><input id="w-in" type="number" inputmode="decimal" min="0" step="0.01" style="font:700 1.5rem var(--disp)"><div class="wo" aria-live="polite" style="margin-top:16px"></div>`;
    const inp = $('input', el), out = $('.wo', el);
    const intl = n => n.toLocaleString('en-US', { maximumFractionDigits: 2 });
    const show = () => {
      const v = Math.abs(parseFloat(inp.value) || 0);
      if (v > 999999999999999) { out.innerHTML = '<p class="note">That number is too large to write out.</p>'; return; }
      const mil = v >= 1e9 ? (v / 1e9).toLocaleString('en-US', { maximumFractionDigits: 3 }) + ' billion' : v >= 1e6 ? (v / 1e6).toLocaleString('en-US', { maximumFractionDigits: 3 }) + ' million' : intl(v);
      out.innerHTML = `<div class="panel"><p class="muted" style="margin:0 0 4px">In words</p><p style="font:600 1.3rem/1.4 var(--disp);margin:0 0 16px">${U.rupeeWords(v)}</p><dl class="facts" style="margin:0"><div><dt>Indian format</dt><dd>₹${v.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</dd></div><div><dt>International format</dt><dd>₹${intl(v)}</dd></div><div><dt>In lakh and crore</dt><dd>${human(v)}</dd></div><div><dt>In millions</dt><dd>₹${mil}</dd></div></dl><p style="margin:14px 0 0"><button class="btn sm ghost" type="button">${ic('link')}Copy the words</button></p></div>`;
      $('button', out).onclick = () => navigator.clipboard && navigator.clipboard.writeText(U.rupeeWords(v)).then(() => U.toast('Copied'));
    };
    inp.value = parseFloat(location.hash.slice(1)) || 1250000;
    inp.addEventListener('input', show); show();
  });
})();

/* Rupya.com calculator engine. Each calculator: fields + run(values) -> result. */
(() => {
  const inr = n => (n < 0 ? '-' : '') + '₹' + Math.round(Math.abs(n)).toLocaleString('en-IN');
  const pct = n => (isFinite(n) ? n.toFixed(2) : '0.00') + '%';
  const N = (k, l, min, max, step, def) => ({ k, l, min, max, step, def });
  const S = (k, l, opts, def) => ({ k, l, opts, def });
  const slab = (t, s) => { let x = 0, p = 0; for (const [lim, rt] of s) { if (t > p) x += (Math.min(t, lim) - p) * rt; p = lim; } return x; };
  const NEW = [[4e5, 0], [8e5, .05], [12e5, .1], [16e5, .15], [2e6, .2], [24e5, .25], [Infinity, .3]];
  const OLD = [[2.5e5, 0], [5e5, .05], [1e6, .2], [Infinity, .3]];
  const sur = (ti, old) => ti > 5e7 ? (old ? .37 : .25) : ti > 2e7 ? .25 : ti > 1e7 ? .15 : ti > 5e6 ? .1 : 0;
  const sipNeed = (target, i, n) => i ? target * i / ((Math.pow(1 + i, n) - 1) * (1 + i)) : target / n;

  const C = {
    sip: {
      name: 'SIP calculator', f: [N('m', 'Monthly investment (₹)', 500, 200000, 500, 10000), N('r', 'Expected return (% a year)', 1, 30, .5, 12), N('y', 'Time period (years)', 1, 40, 1, 10), N('s', 'Annual step-up (%)', 0, 25, 1, 0)],
      run(v) {
        let bal = 0, inv = 0, m = v.m; const i = v.r / 1200, se = [];
        for (let y = 1; y <= v.y; y++) { for (let k = 0; k < 12; k++) { bal = (bal + m) * (1 + i); inv += m; } se.push([y, inv, bal]); m *= 1 + v.s / 100; }
        return { out: [['Amount invested', inr(inv)], ['Estimated returns', inr(bal - inv)], ['Total value', inr(bal), 1]], parts: [['Invested', inv], ['Returns', bal - inv]], se, cols: ['Year', 'Invested', 'Value'] };
      }
    },
    lumpsum: {
      name: 'Lumpsum calculator', f: [N('p', 'Amount invested (₹)', 1000, 10000000, 1000, 100000), N('r', 'Expected return (% a year)', 1, 30, .5, 12), N('y', 'Time period (years)', 1, 40, 1, 10)],
      run(v) {
        const se = []; for (let y = 1; y <= v.y; y++) se.push([y, v.p, v.p * Math.pow(1 + v.r / 100, y)]);
        const fv = se[se.length - 1][2];
        return { out: [['Amount invested', inr(v.p)], ['Estimated returns', inr(fv - v.p)], ['Total value', inr(fv), 1]], parts: [['Invested', v.p], ['Returns', fv - v.p]], se, cols: ['Year', 'Invested', 'Value'] };
      }
    },
    'goal-sip': {
      name: 'Goal SIP calculator', f: [N('t', 'Target amount (₹)', 50000, 100000000, 50000, 2500000), N('y', 'Years to goal', 1, 40, 1, 10), N('r', 'Expected return (% a year)', 1, 30, .5, 12)],
      run(v) {
        const i = v.r / 1200, n = v.y * 12, m = sipNeed(v.t, i, n), se = []; let bal = 0;
        for (let y = 1; y <= v.y; y++) { for (let k = 0; k < 12; k++) bal = (bal + m) * (1 + i); se.push([y, m * 12 * y, bal]); }
        return { out: [['Total you invest', inr(m * n)], ['Growth does the rest', inr(v.t - m * n)], ['Monthly SIP needed', inr(m), 1]], parts: [['Invested', m * n], ['Growth', v.t - m * n]], se, cols: ['Year', 'Invested', 'Value'] };
      }
    },
    swp: {
      name: 'SWP calculator', f: [N('c', 'Starting corpus (₹)', 100000, 100000000, 50000, 5000000), N('w', 'Monthly withdrawal (₹)', 1000, 1000000, 1000, 30000), N('r', 'Expected return (% a year)', 1, 20, .5, 8), N('y', 'Time period (years)', 1, 40, 1, 20)],
      run(v) {
        let bal = v.c, out = 0, dead = 0; const i = v.r / 1200, se = [];
        for (let y = 1; y <= v.y; y++) { for (let k = 0; k < 12; k++) { if (bal <= 0) break; bal = bal * (1 + i); const w = Math.min(v.w, bal); bal -= w; out += w; if (bal <= 0 && !dead) dead = (y - 1) * 12 + k + 1; } se.push([y, out, Math.max(bal, 0)]); }
        return { out: [['Total withdrawn', inr(out)], dead ? ['Corpus runs out after', Math.floor(dead / 12) + ' yr ' + dead % 12 + ' mo'] : ['Corpus lasts', 'the full ' + v.y + ' years'], ['Balance at the end', inr(bal), 1]], se, cols: ['Year', 'Withdrawn', 'Balance'] };
      }
    },
    emi: {
      name: 'EMI calculator', f: [N('p', 'Loan amount (₹)', 10000, 100000000, 10000, 5000000), N('r', 'Interest rate (% a year)', 1, 30, .05, 8.5), N('y', 'Tenure (years)', 1, 30, 1, 20)],
      run(v) {
        const i = v.r / 1200, n = v.y * 12, k = Math.pow(1 + i, n), emi = v.p * i * k / (k - 1), se = []; let bal = v.p, int = 0;
        for (let m = 1; m <= n; m++) { const x = bal * i; int += x; bal -= emi - x; if (m % 12 === 0) se.push([m / 12, int, Math.max(bal, 0)]); }
        return { out: [['Principal', inr(v.p)], ['Total interest', inr(emi * n - v.p)], ['Total payment', inr(emi * n)], ['Monthly EMI', inr(emi), 1]], parts: [['Principal', v.p], ['Interest', emi * n - v.p]], se, cols: ['Year', 'Interest paid', 'Balance'] };
      }
    },
    fd: {
      name: 'FD calculator', f: [N('p', 'Deposit amount (₹)', 1000, 50000000, 1000, 100000), N('r', 'Interest rate (% a year)', 1, 12, .05, 7), N('y', 'Tenure (years)', 1, 10, 1, 5), S('c', 'Compounding', [[4, 'Quarterly'], [12, 'Monthly'], [2, 'Half-yearly'], [1, 'Yearly']], 4)],
      run(v) {
        const se = []; for (let y = 1; y <= v.y; y++) se.push([y, v.p, v.p * Math.pow(1 + v.r / (100 * v.c), v.c * y)]);
        const fv = se[se.length - 1][2];
        return { out: [['Deposit', inr(v.p)], ['Interest earned', inr(fv - v.p)], ['Effective annual yield', pct((Math.pow(1 + v.r / (100 * v.c), v.c) - 1) * 100)], ['Maturity value', inr(fv), 1]], parts: [['Deposit', v.p], ['Interest', fv - v.p]], se, cols: ['Year', 'Deposit', 'Value'] };
      }
    },
    rd: {
      name: 'RD calculator', f: [N('m', 'Monthly deposit (₹)', 100, 500000, 100, 5000), N('r', 'Interest rate (% a year)', 1, 12, .05, 6.7), N('y', 'Tenure (years)', 1, 10, 1, 5)],
      run(v) {
        const n = v.y * 12, q = 1 + v.r / 400, val = t => { let s = 0; for (let k = 1; k <= t; k++) s += v.m * Math.pow(q, (t - k + 1) / 3); return s; }, se = [];
        for (let y = 1; y <= v.y; y++) se.push([y, v.m * 12 * y, val(12 * y)]);
        const fv = val(n);
        return { out: [['Total deposited', inr(v.m * n)], ['Interest earned', inr(fv - v.m * n)], ['Maturity value', inr(fv), 1]], parts: [['Deposited', v.m * n], ['Interest', fv - v.m * n]], se, cols: ['Year', 'Deposited', 'Value'] };
      }
    },
    ppf: {
      name: 'PPF calculator', f: [N('d', 'Yearly deposit (₹)', 500, 150000, 500, 150000), N('r', 'Interest rate (% a year)', 4, 12, .1, 7.1), N('y', 'Time period (years)', 15, 50, 1, 15)],
      run(v) {
        let bal = 0; const se = []; for (let y = 1; y <= v.y; y++) { bal = (bal + v.d) * (1 + v.r / 100); se.push([y, v.d * y, bal]); }
        return { out: [['Total deposited', inr(v.d * v.y)], ['Interest earned', inr(bal - v.d * v.y)], ['Maturity value', inr(bal), 1]], parts: [['Deposited', v.d * v.y], ['Interest', bal - v.d * v.y]], se, cols: ['Year', 'Deposited', 'Balance'] };
      }
    },
    'income-tax': {
      name: 'Income tax calculator', f: [N('inc', 'Annual income (₹)', 0, 100000000, 10000, 1500000), S('sal', 'Salaried or pensioner?', [[1, 'Yes'], [0, 'No']], 1), N('ded', 'Old-regime deductions (80C, 80D, home-loan interest…) (₹)', 0, 1000000, 5000, 200000), N('ex', 'Old-regime exemptions (HRA, LTA…) (₹)', 0, 1000000, 5000, 0)],
      run(v) {
        const tn = Math.max(0, v.inc - (v.sal ? 75000 : 0)), to = Math.max(0, v.inc - (v.sal ? 50000 : 0) - v.ded - v.ex);
        let a = slab(tn, NEW); a = tn <= 12e5 ? 0 : Math.min(a, tn - 12e5); a *= (1 + sur(tn, 0)) * 1.04;
        let b = slab(to, OLD); if (to <= 5e5) b = 0; b *= (1 + sur(to, 1)) * 1.04;
        const best = Math.min(a, b);
        return { out: [['Taxable income, new regime', inr(tn)], ['Tax under new regime', inr(a)], ['Taxable income, old regime', inr(to)], ['Tax under old regime', inr(b)], ['Monthly in-hand after tax', inr((v.inc - best) / 12)], [a <= b ? 'New regime saves you' : 'Old regime saves you', inr(Math.abs(a - b)), 1]], parts: [['New regime', a], ['Old regime', b]], note: 'FY 2026-27 (tax year 2026-27) slabs for residents under 60, including 4% cess and surcharge. Surcharge marginal relief is not modelled.' };
      }
    },
    hra: {
      name: 'HRA calculator', f: [N('b', 'Basic salary + DA (₹ a year)', 0, 20000000, 10000, 600000), N('h', 'HRA received (₹ a year)', 0, 10000000, 5000, 240000), N('rent', 'Rent paid (₹ a year)', 0, 10000000, 5000, 300000), S('m', 'City category', [[.5, '50% city (metro)'], [.4, '40% city (other)']], .5)],
      run(v) {
        const a = v.h, b = Math.max(0, v.rent - .1 * v.b), c = v.m * v.b, ex = Math.max(0, Math.min(a, b, c));
        return { out: [['HRA actually received', inr(a)], ['Rent paid minus 10% of salary', inr(b)], [v.m * 100 + '% of salary', inr(c)], ['Taxable HRA', inr(v.h - ex)], ['Exempt HRA (lowest of the three)', inr(ex), 1]], parts: [['Exempt', ex], ['Taxable', v.h - ex]], note: 'The HRA exemption applies only under the old tax regime.' };
      }
    },
    gst: {
      name: 'GST calculator', f: [N('a', 'Amount (₹)', 1, 100000000, 100, 10000), N('g', 'GST rate (%)', 0, 40, .25, 18), S('mode', 'Amount is', [[0, 'Before GST (add tax)'], [1, 'GST-inclusive (remove tax)']], 0)],
      run(v) {
        const base = v.mode ? v.a / (1 + v.g / 100) : v.a, tax = base * v.g / 100, f = n => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return { out: [['Net price before GST', f(base)], ['CGST (' + v.g / 2 + '%)', f(tax / 2)], ['SGST (' + v.g / 2 + '%)', f(tax / 2)], ['Total GST', f(tax)], ['Price including GST', f(base + tax), 1]], parts: [['Net price', base], ['GST', tax]], note: 'For inter-state supplies the whole tax is charged as IGST instead of CGST + SGST.' };
      }
    },
    cagr: {
      name: 'CAGR calculator', f: [N('b', 'Starting value (₹)', 1, 1000000000, 1000, 100000), N('e', 'Ending value (₹)', 1, 1000000000, 1000, 250000), N('y', 'Time period (years)', 1, 50, .5, 5)],
      run(v) {
        const g = (Math.pow(v.e / v.b, 1 / v.y) - 1) * 100, se = []; for (let y = 1; y <= Math.ceil(v.y); y++) se.push([y, v.b, v.b * Math.pow(1 + g / 100, Math.min(y, v.y))]);
        return { out: [['Gain or loss', inr(v.e - v.b)], ['Absolute return', pct((v.e / v.b - 1) * 100)], ['CAGR', pct(g), 1]], se, cols: ['Year', 'Start', 'Value'] };
      }
    },
    inflation: {
      name: 'Inflation calculator', f: [N('a', 'Cost today (₹)', 100, 100000000, 100, 100000), N('r', 'Inflation (% a year)', 1, 15, .25, 6), N('y', 'Years from now', 1, 50, 1, 15)],
      run(v) {
        const k = Math.pow(1 + v.r / 100, v.y), se = []; for (let y = 1; y <= v.y; y++) se.push([y, v.a, v.a * Math.pow(1 + v.r / 100, y)]);
        return { out: [['Cost today', inr(v.a)], ['What ' + inr(v.a) + ' will buy then, in today’s money', inr(v.a / k)], ['Cost after ' + v.y + ' years', inr(v.a * k), 1]], se, cols: ['Year', 'Today', 'Future cost'] };
      }
    },
    retirement: {
      name: 'Retirement calculator', f: [N('age', 'Your age', 18, 65, 1, 30), N('ret', 'Retirement age', 40, 75, 1, 60), N('life', 'Plan until age', 65, 100, 1, 85), N('exp', 'Monthly expenses today (₹)', 5000, 1000000, 1000, 50000), N('inf', 'Inflation (% a year)', 1, 12, .25, 6), N('pre', 'Return before retirement (%)', 1, 20, .5, 12), N('post', 'Return after retirement (%)', 1, 15, .5, 7)],
      run(v) {
        const yrs = Math.max(1, v.ret - v.age), n = Math.max(1, v.life - v.ret), mo = v.exp * Math.pow(1 + v.inf / 100, yrs), ann = mo * 12, rr = (1 + v.post / 100) / (1 + v.inf / 100) - 1;
        const corpus = Math.abs(rr) < 1e-9 ? ann * n : ann * (1 - Math.pow(1 + rr, -n)) / rr * (1 + rr), i = v.pre / 1200, m = sipNeed(corpus, i, yrs * 12), se = []; let bal = 0;
        for (let y = 1; y <= yrs; y++) { for (let k = 0; k < 12; k++) bal = (bal + m) * (1 + i); se.push([v.age + y, m * 12 * y, bal]); }
        return { out: [['Monthly expenses at retirement', inr(mo)], ['Years in retirement', n], ['Corpus needed at ' + v.ret, inr(corpus)], ['Monthly SIP to get there', inr(m), 1]], se, cols: ['Age', 'Invested', 'Corpus'] };
      }
    }
  };

  if (typeof module !== 'undefined') { module.exports = C; return; }
  const host = document.querySelector('[data-calc]');
  if (!host) return;
  const id = host.dataset.calc, def = C[id];
  if (!def) return;
  const R = (window.Rupya || {}).R || '../';
  const hash = new URLSearchParams(location.hash.slice(1));
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  host.innerHTML = `<div class="calc"><div class="card"><form id="cf" onsubmit="return false">${def.f.map(f => f.opts
    ? `<div class="fld"><label for="c-${f.k}">${f.l}</label><select id="c-${f.k}" name="${f.k}">${f.opts.map(o => `<option value="${o[0]}"${String(hash.get(f.k) ?? f.def) === String(o[0]) ? ' selected' : ''}>${o[1]}</option>`).join('')}</select></div>`
    : `<div class="fld"><label for="c-${f.k}">${f.l}</label><div class="r"><input id="c-${f.k}" name="${f.k}" type="number" inputmode="decimal" min="${f.min}" max="${f.max}" step="${f.step}" value="${hash.get(f.k) ?? f.def}"><input type="range" aria-label="${f.l} slider" data-for="${f.k}" min="${f.min}" max="${f.max}" step="${f.step}" value="${hash.get(f.k) ?? f.def}"></div></div>`).join('')}</form></div>` +
    `<div class="card" aria-live="polite"><div id="co"></div><div class="viz" id="cv"></div><canvas class="ch" id="cc" hidden></canvas><p class="note" id="cn"></p><div class="tools"><button class="btn sm ghost" id="cl" type="button">Copy link to this result</button><button class="btn sm ghost" type="button" onclick="print()">Print</button><a class="btn sm gold" href="${R}money-checkup.html">Turn this into a plan →</a></div></div></div>` +
    `<details id="ct" hidden><summary>Year-by-year table</summary><div class="scroll"><table></table></div></details>` +
    `<h2>More calculators</h2><div class="grid">${Object.keys(C).filter(k => k !== id).slice(0, 6).map(k => `<a class="card" href="${k}.html"><h3>${C[k].name}</h3></a>`).join('')}</div>`;

  const form = host.querySelector('#cf'), canvas = host.querySelector('#cc');
  let last;
  const draw = () => {
    const r = last; if (!r || !r.se) { canvas.hidden = true; return; }
    canvas.hidden = false;
    const d = devicePixelRatio || 1, w = canvas.clientWidth, h = canvas.clientHeight, x = canvas.getContext('2d');
    canvas.width = w * d; canvas.height = h * d; x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, w, h);
    const max = Math.max(...r.se.map(s => Math.max(s[1], s[2]))) || 1, n = r.se.length, px = i => 8 + (n > 1 ? i / (n - 1) : .5) * (w - 16), py = v => h - 22 - v / max * (h - 34);
    x.strokeStyle = css('--line'); x.lineWidth = 1; x.beginPath(); x.moveTo(8, h - 22); x.lineTo(w - 8, h - 22); x.stroke();
    [[2, css('--green') || '#0d6b4e', .16], [1, css('--gold') || '#f0a500', 0]].forEach(([c, col, fill]) => {
      x.beginPath(); r.se.forEach((s, i) => i ? x.lineTo(px(i), py(s[c])) : x.moveTo(px(i), py(s[c])));
      x.strokeStyle = col; x.lineWidth = 2.5; x.stroke();
      if (fill) { x.lineTo(px(n - 1), h - 22); x.lineTo(px(0), h - 22); x.closePath(); x.globalAlpha = fill; x.fillStyle = col; x.fill(); x.globalAlpha = 1; }
    });
    x.fillStyle = css('--muted'); x.font = '12px system-ui'; x.fillText(r.cols[0] + ' ' + r.se[0][0], 8, h - 6); x.textAlign = 'right'; x.fillText(r.cols[0] + ' ' + r.se[n - 1][0], w - 8, h - 6); x.textAlign = 'left';
  };
  const calc = () => {
    const v = {}; let ok = true;
    def.f.forEach(f => { const n = parseFloat(form.elements[f.k].value); if (!isFinite(n)) ok = false; v[f.k] = f.opts ? n : Math.min(f.max, Math.max(f.min, n)); });
    if (!ok) return;
    const r = last = def.run(v);
    host.querySelector('#co').innerHTML = r.out.map(o => `<div class="out${o[2] ? ' big' : ''}"><span>${o[0]}</span><b>${o[1]}</b></div>`).join('');
    const viz = host.querySelector('#cv'), tot = r.parts ? r.parts[0][1] + r.parts[1][1] : 0;
    viz.innerHTML = r.parts && tot > 0 ? `<div class="donut" role="img" aria-label="${r.parts[0][0]} ${Math.round(r.parts[0][1] / tot * 100)}%, ${r.parts[1][0]} ${Math.round(r.parts[1][1] / tot * 100)}%" style="background:conic-gradient(var(--gold) 0 ${r.parts[0][1] / tot * 360}deg,var(--green) 0)"></div><div class="lg"><div><i style="background:var(--gold)"></i>${r.parts[0][0]} · ${Math.round(r.parts[0][1] / tot * 100)}%</div><div><i style="background:var(--green)"></i>${r.parts[1][0]} · ${Math.round(r.parts[1][1] / tot * 100)}%</div></div>` : '';
    host.querySelector('#cn').textContent = (r.se ? 'Chart: ' + r.cols[1] + ' (gold) and ' + r.cols[2] + ' (green). ' : '') + (r.note || 'Estimates only; actual returns, rates and taxes will differ.');
    const t = host.querySelector('#ct'); t.hidden = !r.se;
    if (r.se) t.querySelector('table').innerHTML = `<tr>${r.cols.map(c => `<th>${c}</th>`).join('')}</tr>` + r.se.map(s => `<tr><td>${s[0]}</td><td>${inr(s[1])}</td><td>${inr(s[2])}</td></tr>`).join('');
    draw();
    history.replaceState(null, '', '#' + new URLSearchParams(v));
  };
  form.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.for) form.elements[t.dataset.for].value = t.value;
    else { const s = form.querySelector(`[data-for="${t.name}"]`); if (s) s.value = t.value; }
    calc();
  });
  host.querySelector('#cl').onclick = e => { const b = e.target; (navigator.clipboard ? navigator.clipboard.writeText(location.href) : Promise.reject()).then(() => b.textContent = 'Link copied ✓', () => prompt('Copy this link', location.href)); };
  addEventListener('resize', draw); document.addEventListener('rupya-theme', draw);
  calc();
})();

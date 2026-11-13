/* Rupya.com calculator engine: 45 calculators, one renderer.
   Each calculator: f = fields, run(values) -> { out:[[label, value, fmt, isHero]], parts, ch (chart), tb (table), note } */
(() => {
  const W = typeof window !== 'undefined';
  const N = (k, l, min, max, step, def, u = '', x = {}) => ({ k, l, min, max, step, def, u, ...x });
  const S = (k, l, o, def) => ({ k, l, o, def });
  const pw = Math.pow;
  const slab = (t, s) => { let x = 0, p = 0; for (const [l, r] of s) { if (t > p) x += (Math.min(t, l) - p) * r; p = l; } return x; };
  const NEW = [[4e5, 0], [8e5, .05], [12e5, .1], [16e5, .15], [2e6, .2], [24e5, .25], [1 / 0, .3]];
  const OLD = [[2.5e5, 0], [5e5, .05], [1e6, .2], [1 / 0, .3]];
  const sur = (t, old) => t > 5e7 ? (old ? .37 : .25) : t > 2e7 ? .25 : t > 1e7 ? .15 : t > 5e6 ? .1 : 0;
  const tax = (t, old) => { t = Math.max(0, t); let x = slab(t, old ? OLD : NEW); if (old) { if (t <= 5e5) x = 0; } else x = t <= 12e5 ? 0 : Math.min(x, t - 12e5); return x * (1 + sur(t, old)) * 1.04; };
  const fvSip = (m, i, n) => i ? m * ((pw(1 + i, n) - 1) / i) * (1 + i) : m * n;
  const pmtSip = (t, i, n) => i ? t * i / ((pw(1 + i, n) - 1) * (1 + i)) : t / n;
  const emiOf = (p, i, n) => i ? p * i * pw(1 + i, n) / (pw(1 + i, n) - 1) : p / n;
  const ym = m => { m = Math.round(m); const y = Math.floor(m / 12), r = m % 12; return ((y ? y + (y === 1 ? ' year ' : ' years ') : '') + (r ? r + (r === 1 ? ' month' : ' months') : '')).trim() || '0 months'; };
  const pc = x => (isFinite(x) ? (+x.toFixed(2)).toString() : '0') + '%';
  const I = 'a', V = 'b', G = 'c', O = 'd', SL = 'e'; // series colour keys

  const emiRun = v => {
    const i = v.r / 1200, n = Math.round(v.y * 12), emi = emiOf(v.p, i, n);
    let bal = v.p, ci = 0, yp = 0, yi = 0; const X = [], B = [], CI = [], T = [];
    for (let m = 1; m <= n; m++) { const x = bal * i, pr = emi - x; bal -= pr; ci += x; yi += x; yp += pr; if (m % 12 === 0 || m === n) { const y = Math.ceil(m / 12); X.push(y); B.push(Math.max(bal, 0)); CI.push(ci); T.push([y, yp, yi, Math.max(bal, 0)]); yp = yi = 0; } }
    const fee = v.fee ? v.p * v.fee / 100 : 0, ti = emi * n - v.p;
    const out = [['Monthly EMI', emi, 'r', 1], ['Principal', v.p, 'r'], ['Total interest', ti, 'r'], ['Total amount payable', emi * n, 'r']];
    if (v.fee != null) out.push(['Processing fee (' + pc(v.fee) + ')', fee, 'r'], ['Total cost of the loan', ti + fee, 'r']);
    return { out, parts: [['Principal', v.p], ['Interest', ti]], ch: { x: X, xl: 'Year ', s: [{ n: 'Interest paid so far', d: CI, c: G }, { n: 'Loan balance', d: B, c: V }] }, tb: { h: ['Year', 'Principal paid', 'Interest paid', 'Balance'], r: T } };
  };
  const sipRun = v => {
    let b = 0, inv = 0, m = v.m; const i = v.r / 1200, X = [], A = [], B = [], T = [];
    for (let y = 1; y <= v.y; y++) { for (let k = 0; k < 12; k++) { b = (b + m) * (1 + i); inv += m; } X.push(y); A.push(inv); B.push(b); T.push([y, inv, b - inv, b]); m *= 1 + v.s / 100; }
    return { out: [['Estimated value', b, 'r', 1], ['Amount invested', inv, 'r'], ['Estimated returns', b - inv, 'r'], ['Value to amount invested', (b / inv).toFixed(2) + '×', 't']], parts: [['Invested', inv], ['Returns', b - inv]], ch: { x: X, xl: 'Year ', s: [{ n: 'Invested', d: A, c: I }, { n: 'Value', d: B, c: V }] }, tb: { h: ['Year', 'Invested', 'Returns', 'Value'], r: T } };
  };
  const yearly = (y, f) => { const X = [], A = [], B = [], T = []; for (let k = 1; k <= y; k++) { const [a, b] = f(k); X.push(k); A.push(a); B.push(b); T.push([k, a, b - a, b]); } return { X, A, B, T }; };
  const growth = (s, n1 = 'Invested', n2 = 'Value') => ({ ch: { x: s.X, xl: 'Year ', s: [{ n: n1, d: s.A, c: I }, { n: n2, d: s.B, c: V }] }, tb: { h: ['Year', n1, 'Growth', n2], r: s.T } });

  const C = {
    sip: { n: 'SIP calculator', c: 'inv', f: [N('m', 'Monthly investment', 100, 1e6, 100, 10000, '₹'), N('r', 'Expected return', 1, 30, .1, 12, '% a year'), N('y', 'Time period', 1, 40, 1, 10, 'years'), N('s', 'Annual step-up', 0, 25, 1, 0, '%')], run: sipRun },
    'step-up-sip': { n: 'Step-up SIP calculator', c: 'inv', f: [N('m', 'Starting monthly SIP', 100, 1e6, 100, 10000, '₹'), N('s', 'Increase every year', 0, 25, 1, 10, '%'), N('r', 'Expected return', 1, 30, .1, 12, '% a year'), N('y', 'Time period', 1, 40, 1, 20, 'years')], run: sipRun },
    lumpsum: {
      n: 'Lumpsum calculator', c: 'inv', f: [N('p', 'Amount invested', 1000, 1e9, 1000, 100000, '₹'), N('r', 'Expected return', 1, 30, .1, 12, '% a year'), N('y', 'Time period', 1, 40, 1, 10, 'years')],
      run(v) { const s = yearly(v.y, k => [v.p, v.p * pw(1 + v.r / 100, k)]), fv = s.B[s.B.length - 1]; return { out: [['Estimated value', fv, 'r', 1], ['Amount invested', v.p, 'r'], ['Estimated returns', fv - v.p, 'r'], ['Value to amount invested', (fv / v.p).toFixed(2) + '×', 't']], parts: [['Invested', v.p], ['Returns', fv - v.p]], ...growth(s) }; }
    },
    'goal-sip': {
      n: 'Goal SIP calculator', c: 'inv', f: [N('t', 'Target amount', 10000, 1e9, 10000, 2500000, '₹'), N('y', 'Years to goal', 1, 40, 1, 10, 'years'), N('r', 'Expected return', 1, 30, .1, 12, '% a year')],
      run(v) { const i = v.r / 1200, n = v.y * 12, m = pmtSip(v.t, i, n); let b = 0; const s = yearly(v.y, k => { for (let j = 0; j < 12; j++) b = (b + m) * (1 + i); return [m * 12 * k, b]; }); return { out: [['Monthly SIP needed', m, 'r', 1], ['Total you invest', m * n, 'r'], ['Growth contributes', v.t - m * n, 'r'], ['Goal', v.t, 'r']], parts: [['Your money', m * n], ['Growth', v.t - m * n]], ...growth(s) }; }
    },
    'sip-delay': {
      n: 'Cost of delay calculator', c: 'inv', f: [N('m', 'Monthly SIP', 500, 1e6, 500, 10000, '₹'), N('y', 'Years until you need the money', 5, 40, 1, 25, 'years'), N('d', 'Delay before starting', 1, 15, 1, 5, 'years'), N('r', 'Expected return', 1, 30, .1, 12, '% a year')],
      run(v) {
        const d = Math.min(v.d, v.y - 1), i = v.r / 1200, now = fvSip(v.m, i, v.y * 12), late = fvSip(v.m, i, (v.y - d) * 12), need = pmtSip(now, i, (v.y - d) * 12);
        const X = [], A = [], B = []; let a = 0, b = 0;
        for (let k = 1; k <= v.y; k++) { for (let j = 0; j < 12; j++) { a = (a + v.m) * (1 + i); if (k > d) b = (b + v.m) * (1 + i); } X.push(k); A.push(b); B.push(a); }
        return { out: [['Cost of waiting ' + d + (d === 1 ? ' year' : ' years'), now - late, 'r', 1], ['Value if you start today', now, 'r'], ['Value if you start in ' + d + (d === 1 ? ' year' : ' years'), late, 'r'], ['Monthly SIP needed to catch up', need, 'r']], parts: [['Delayed start', late], ['Lost to waiting', now - late]], ch: { x: X, xl: 'Year ', s: [{ n: 'Start later', d: A, c: I }, { n: 'Start today', d: B, c: V }] } };
      }
    },
    swp: {
      n: 'SWP calculator', c: 'inv', f: [N('c', 'Starting corpus', 100000, 1e9, 10000, 5000000, '₹'), N('w', 'Monthly withdrawal', 500, 1e7, 500, 30000, '₹'), N('r', 'Expected return', 1, 20, .1, 8, '% a year'), N('y', 'Time period', 1, 40, 1, 20, 'years')],
      run(v) {
        let bal = v.c, out = 0, dead = 0; const i = v.r / 1200, X = [], A = [], B = [], T = [];
        for (let y = 1; y <= v.y; y++) { let yw = 0; for (let k = 0; k < 12; k++) { if (bal <= 0) break; bal *= 1 + i; const w = Math.min(v.w, bal); bal -= w; out += w; yw += w; if (bal <= 0 && !dead) dead = (y - 1) * 12 + k + 1; } X.push(y); A.push(out); B.push(Math.max(bal, 0)); T.push([y, yw, out, Math.max(bal, 0)]); }
        return { out: [['Balance at the end', Math.max(bal, 0), 'r', 1], ['Total withdrawn', out, 'r'], dead ? ['Corpus runs out after', ym(dead), 't'] : ['Corpus lasts', 'All ' + v.y + ' years', 't'], ['Withdrawal rate', pc(v.w * 12 / v.c * 100) + ' a year', 't']], ch: { x: X, xl: 'Year ', s: [{ n: 'Withdrawn so far', d: A, c: I }, { n: 'Balance', d: B, c: V }] }, tb: { h: ['Year', 'Withdrawn that year', 'Withdrawn so far', 'Balance'], r: T } };
      }
    },
    cagr: {
      n: 'CAGR calculator', c: 'inv', f: [N('b', 'Starting value', 1, 1e10, 1000, 100000, '₹'), N('e', 'Ending value', 1, 1e10, 1000, 250000, '₹'), N('y', 'Time period', .5, 50, .5, 5, 'years')],
      run(v) { const g = (pw(v.e / v.b, 1 / v.y) - 1) * 100, s = yearly(Math.ceil(v.y), k => [v.b, v.b * pw(1 + g / 100, Math.min(k, v.y))]); return { out: [['CAGR', pc(g), 't', 1], ['Absolute return', pc((v.e / v.b - 1) * 100), 't'], ['Gain or loss', v.e - v.b, 'r'], ['Value multiplied by', (v.e / v.b).toFixed(2) + '×', 't']], ...growth(s, 'Start', 'Value at CAGR') }; }
    },
    'compound-interest': {
      n: 'Compound interest calculator', c: 'inv', f: [N('p', 'Principal', 100, 1e9, 100, 100000, '₹'), N('r', 'Interest rate', .1, 30, .1, 8, '% a year'), N('y', 'Time period', 1, 50, 1, 10, 'years'), S('c', 'Compounding', [[1, 'Yearly'], [2, 'Half-yearly'], [4, 'Quarterly'], [12, 'Monthly'], [365, 'Daily']], 4)],
      run(v) { const X = [], A = [], B = [], T = []; for (let k = 1; k <= v.y; k++) { const ci = v.p * pw(1 + v.r / (100 * v.c), v.c * k), si = v.p * (1 + v.r * k / 100); X.push(k); A.push(si); B.push(ci); T.push([k, si, ci - si, ci]); } const fv = B[B.length - 1]; return { out: [['Maturity value', fv, 'r', 1], ['Interest earned', fv - v.p, 'r'], ['Effective annual rate', pc((pw(1 + v.r / (100 * v.c), v.c) - 1) * 100), 't'], ['Extra over simple interest', fv - A[A.length - 1], 'r']], parts: [['Principal', v.p], ['Interest', fv - v.p]], ch: { x: X, xl: 'Year ', s: [{ n: 'Simple interest', d: A, c: I }, { n: 'Compound interest', d: B, c: V }] }, tb: { h: ['Year', 'With simple interest', 'Difference', 'With compounding'], r: T } }; }
    },
    fd: {
      n: 'FD calculator', c: 'sav', f: [N('p', 'Deposit amount', 1000, 1e9, 1000, 100000, '₹'), N('r', 'Interest rate', 1, 12, .05, 7, '% a year'), N('y', 'Tenure', 1, 10, 1, 5, 'years'), S('c', 'Compounding', [[4, 'Quarterly'], [12, 'Monthly'], [2, 'Half-yearly'], [1, 'Yearly']], 4)],
      run(v) { const s = yearly(v.y, k => [v.p, v.p * pw(1 + v.r / (100 * v.c), v.c * k)]), fv = s.B[s.B.length - 1]; return { out: [['Maturity value', fv, 'r', 1], ['Deposit', v.p, 'r'], ['Interest earned', fv - v.p, 'r'], ['Effective annual yield', pc((pw(1 + v.r / (100 * v.c), v.c) - 1) * 100), 't']], parts: [['Deposit', v.p], ['Interest', fv - v.p]], ...growth(s, 'Deposit', 'Value') }; }
    },
    rd: {
      n: 'RD calculator', c: 'sav', f: [N('m', 'Monthly deposit', 100, 1e6, 100, 5000, '₹'), N('r', 'Interest rate', 1, 12, .05, 6.7, '% a year'), N('y', 'Tenure', 1, 10, 1, 5, 'years')],
      run(v) { const q = 1 + v.r / 400, val = t => { let s = 0; for (let k = 1; k <= t; k++) s += v.m * pw(q, (t - k + 1) / 3); return s; }; const s = yearly(v.y, k => [v.m * 12 * k, val(12 * k)]), fv = s.B[s.B.length - 1], dep = v.m * 12 * v.y; return { out: [['Maturity value', fv, 'r', 1], ['Total deposited', dep, 'r'], ['Interest earned', fv - dep, 'r']], parts: [['Deposited', dep], ['Interest', fv - dep]], ...growth(s, 'Deposited', 'Value') }; }
    },
    ppf: {
      n: 'PPF calculator', c: 'sav', f: [N('d', 'Yearly deposit', 500, 150000, 500, 150000, '₹'), N('r', 'Interest rate', 4, 12, .1, 7.1, '% a year'), N('y', 'Time period', 15, 50, 5, 15, 'years')],
      run(v) { let b = 0; const s = yearly(v.y, k => { b = (b + v.d) * (1 + v.r / 100); return [v.d * k, b]; }); return { out: [['Maturity value', b, 'r', 1], ['Total deposited', v.d * v.y, 'r'], ['Interest earned (tax-free)', b - v.d * v.y, 'r']], parts: [['Deposited', v.d * v.y], ['Interest', b - v.d * v.y]], ...growth(s, 'Deposited', 'Balance') }; }
    },
    ssy: {
      n: 'Sukanya Samriddhi calculator', c: 'sav', f: [N('d', 'Yearly deposit', 250, 150000, 250, 150000, '₹'), N('a', 'Daughter’s age today', 0, 10, 1, 1, 'years'), N('r', 'Interest rate', 5, 10, .1, 8.2, '% a year')],
      run(v) { let b = 0; const s = yearly(21, k => { b = (k <= 15 ? b + v.d : b) * (1 + v.r / 100); return [v.d * Math.min(k, 15), b]; }); return { out: [['Maturity value', b, 'r', 1], ['Total deposited (15 years)', v.d * 15, 'r'], ['Interest earned (tax-free)', b - v.d * 15, 'r'], ['Matures when she turns', (v.a + 21) + ' (' + (new Date().getFullYear() + 21) + ')', 't']], parts: [['Deposited', v.d * 15], ['Interest', b - v.d * 15]], ...growth(s, 'Deposited', 'Balance'), note: 'Deposits run for 15 years and the account matures 21 years after opening. Interest compounds yearly at the rate notified each quarter.' }; }
    },
    scss: {
      n: 'SCSS calculator', c: 'sav', f: [N('p', 'Amount invested', 1000, 3e6, 1000, 1500000, '₹'), N('r', 'Interest rate', 5, 10, .1, 8.2, '% a year')],
      run(v) { const q = v.p * v.r / 400, T = []; for (let y = 1; y <= 5; y++) T.push([y, q * 4, q * 4 * y, v.p]); return { out: [['Interest every quarter', q, 'r', 1], ['Income a year', q * 4, 'r'], ['Total interest over 5 years', q * 20, 'r'], ['Amount returned at maturity', v.p, 'r']], parts: [['Principal', v.p], ['Interest over 5 years', q * 20]], tb: { h: ['Year', 'Interest that year', 'Interest so far', 'Principal'], r: T }, note: 'SCSS pays interest every quarter at the rate fixed on the day you invest. The limit is ₹30 lakh per person and the interest is taxable.' }; }
    },
    nsc: {
      n: 'NSC calculator', c: 'sav', f: [N('p', 'Amount invested', 1000, 1e8, 1000, 100000, '₹'), N('r', 'Interest rate', 5, 10, .1, 7.7, '% a year')],
      run(v) { const s = yearly(5, k => [v.p, v.p * pw(1 + v.r / 100, k)]), fv = s.B[4]; return { out: [['Maturity value after 5 years', fv, 'r', 1], ['Amount invested', v.p, 'r'], ['Interest earned', fv - v.p, 'r']], parts: [['Invested', v.p], ['Interest', fv - v.p]], ...growth(s) }; }
    },
    kvp: {
      n: 'Kisan Vikas Patra calculator', c: 'sav', f: [N('p', 'Amount invested', 1000, 1e8, 1000, 100000, '₹'), N('r', 'Interest rate', 5, 10, .1, 7.5, '% a year')],
      run(v) { const mo = Math.round(Math.log(2) / Math.log(1 + v.r / 100) * 12), s = yearly(Math.ceil(mo / 12), k => [v.p, v.p * pw(1 + v.r / 100, Math.min(k, mo / 12))]); return { out: [['Maturity value', v.p * 2, 'r', 1], ['Money doubles in', ym(mo) + ' (' + mo + ' months)', 't'], ['Amount invested', v.p, 'r'], ['Interest earned', v.p, 'r']], parts: [['Invested', v.p], ['Interest', v.p]], ...growth(s) }; }
    },
    pomis: {
      n: 'Post Office MIS calculator', c: 'sav', f: [N('p', 'Amount invested', 1000, 15e5, 1000, 9e5, '₹'), N('r', 'Interest rate', 5, 10, .1, 7.4, '% a year'), S('j', 'Account type', [[0, 'Single (limit ₹9 lakh)'], [1, 'Joint (limit ₹15 lakh)']], 0)],
      run(v) { const cap = v.j ? 15e5 : 9e5, p = Math.min(v.p, cap), mth = p * v.r / 1200, out = [['Monthly income', mth, 'r', 1], ['Income a year', mth * 12, 'r'], ['Total interest over 5 years', mth * 60, 'r'], ['Amount returned at maturity', p, 'r']]; if (v.p > cap) out.push(['Amount above the limit, not invested', v.p - cap, 'r']); return { out, parts: [['Principal', p], ['Interest over 5 years', mth * 60]], note: 'Interest is paid monthly and is taxable. The deposit is returned after five years.' }; }
    },
    'simple-interest': {
      n: 'Simple interest calculator', c: 'sav', f: [N('p', 'Principal', 100, 1e9, 100, 100000, '₹'), N('r', 'Interest rate', .1, 40, .1, 8, '% a year'), N('y', 'Time period', .25, 50, .25, 5, 'years')],
      run(v) { const si = v.p * v.r * v.y / 100, X = [], A = [], B = [], T = []; for (let k = 1; k <= Math.ceil(v.y); k++) { const t = Math.min(k, v.y), a = v.p * (1 + v.r * t / 100), b = v.p * pw(1 + v.r / 100, t); X.push(k); A.push(a); B.push(b); T.push([k, a, b - a, b]); } return { out: [['Total amount', v.p + si, 'r', 1], ['Simple interest', si, 'r'], ['Principal', v.p, 'r'], ['Yearly compounding would add', B[B.length - 1] - (v.p + si), 'r']], parts: [['Principal', v.p], ['Interest', si]], ch: { x: X, xl: 'Year ', s: [{ n: 'Simple interest', d: A, c: I }, { n: 'If compounded yearly', d: B, c: V, dash: 1 }] }, tb: { h: ['Year', 'Simple', 'Difference', 'Compounded'], r: T } }; }
    },
    emi: { n: 'EMI calculator', c: 'bor', lead: 'loan', f: [N('p', 'Loan amount', 10000, 1e9, 10000, 5000000, '₹'), N('r', 'Interest rate', 1, 30, .05, 8.5, '% a year'), N('y', 'Tenure', 1, 30, 1, 20, 'years')], run: emiRun },
    'home-loan': { n: 'Home loan EMI calculator', c: 'bor', lead: 'home', f: [N('p', 'Loan amount', 100000, 5e8, 50000, 5000000, '₹'), N('r', 'Interest rate', 6, 15, .05, 8.5, '% a year'), N('y', 'Tenure', 1, 30, 1, 20, 'years'), N('fee', 'Processing fee', 0, 3, .05, .5, '%')], run: emiRun },
    'car-loan': { n: 'Car loan EMI calculator', c: 'bor', lead: 'loan', f: [N('p', 'Loan amount', 50000, 1e8, 10000, 800000, '₹'), N('r', 'Interest rate', 6, 20, .05, 9.25, '% a year'), N('y', 'Tenure', 1, 8, 1, 5, 'years'), N('fee', 'Processing fee', 0, 3, .05, 1, '%')], run: emiRun },
    'personal-loan': { n: 'Personal loan EMI calculator', c: 'bor', lead: 'loan', f: [N('p', 'Loan amount', 10000, 4e7, 10000, 500000, '₹'), N('r', 'Interest rate', 8, 36, .05, 12, '% a year'), N('y', 'Tenure', 1, 7, 1, 3, 'years'), N('fee', 'Processing fee', 0, 5, .05, 2, '%')], run: emiRun },
    'education-loan': { n: 'Education loan EMI calculator', c: 'bor', lead: 'loan', f: [N('p', 'Loan amount', 50000, 2e8, 10000, 1500000, '₹'), N('r', 'Interest rate', 6, 18, .05, 10, '% a year'), N('y', 'Repayment tenure', 1, 15, 1, 10, 'years'), N('fee', 'Processing fee', 0, 3, .05, 1, '%')], run: emiRun },
    'loan-eligibility': {
      n: 'Home loan eligibility calculator', c: 'bor', lead: 'home', f: [N('inc', 'Net monthly income', 10000, 1e7, 1000, 100000, '₹'), N('ex', 'Existing EMIs a month', 0, 1e7, 500, 0, '₹'), N('r', 'Interest rate', 6, 15, .05, 8.5, '% a year'), N('y', 'Tenure', 5, 30, 1, 20, 'years'), S('fo', 'Share of income lenders allow for EMIs', [[50, '50% (typical)'], [40, '40% (cautious)'], [60, '60% (high income)']], 50)],
      run(v) { const i = v.r / 1200, n = v.y * 12, e = Math.max(0, v.inc * v.fo / 100 - v.ex), L = e * (1 - pw(1 + i, -n)) / i, ltv = L <= 3e6 ? .9 : L <= 7.5e6 ? .8 : .75, prop = L / ltv; return { out: [['Loan you may be eligible for', L, 'r', 1], ['Maximum EMI', e, 'r'], ['Property budget', prop, 'r'], ['Down payment needed (' + Math.round((1 - ltv) * 100) + '%)', prop - L, 'r']], parts: [['Loan', L], ['Down payment', prop - L]], note: 'Lenders also weigh your credit score, age, job stability and the property. RBI caps the loan at 90%, 80% or 75% of the property value depending on the loan size.' }; }
    },
    prepayment: {
      n: 'Loan prepayment calculator', c: 'bor', lead: 'home', f: [N('o', 'Outstanding loan', 50000, 1e9, 10000, 4000000, '₹'), N('r', 'Interest rate', 1, 20, .05, 8.5, '% a year'), N('y', 'Remaining tenure', 1, 30, 1, 18, 'years'), N('a', 'Prepayment now', 1000, 1e9, 1000, 500000, '₹'), S('m', 'After prepaying, reduce', [[1, 'Tenure (save more)'], [0, 'EMI (lower monthly outgo)']], 1)],
      run(v) {
        const i = v.r / 1200, n = v.y * 12, E = emiOf(v.o, i, n), I0 = E * n - v.o, o2 = Math.max(0, v.o - Math.min(v.a, v.o));
        let n2 = n, E2 = E, I1;
        if (!o2) { n2 = 0; I1 = 0; } else if (+v.m) { n2 = Math.ceil(-Math.log(1 - o2 * i / E) / Math.log(1 + i)); let b = o2; I1 = 0; for (let k = 0; k < n2; k++) { const x = b * i; I1 += x; b -= Math.min(E - x, b); } } else { E2 = emiOf(o2, i, n); I1 = E2 * n - o2; }
        const X = [], A = [], B = []; let b1 = v.o, b2 = o2;
        for (let k = 1; k <= v.y; k++) { for (let j = 0; j < 12; j++) { b1 = Math.max(0, b1 * (1 + i) - E); b2 = Math.max(0, b2 * (1 + i) - E2); } X.push(k); A.push(b1); B.push(b2); }
        const out = [['Interest saved', I0 - I1, 'r', 1], ['Interest without prepaying', I0, 'r'], ['Interest after prepaying', I1, 'r']];
        if (+v.m) out.push(['Loan closes', o2 ? (ym(n - n2) + ' earlier') : 'Immediately', 't'], ['New tenure', ym(n2), 't']); else out.push(['New EMI', E2, 'r'], ['EMI falls by', E - E2, 'r']);
        return { out, ch: { x: X, xl: 'Year ', s: [{ n: 'Balance without prepaying', d: A, c: I }, { n: 'Balance after prepaying', d: B, c: V }] } };
      }
    },
    'flat-vs-reducing': {
      n: 'Flat vs reducing rate calculator', c: 'bor', lead: 'loan', f: [N('p', 'Loan amount', 10000, 1e8, 10000, 500000, '₹'), N('f', 'Quoted flat rate', 1, 30, .05, 9, '% a year'), N('y', 'Tenure', 1, 10, 1, 3, 'years')],
      run(v) { const n = v.y * 12, e = (v.p + v.p * v.f / 100 * v.y) / n; let lo = 0, hi = 200; for (let k = 0; k < 80; k++) { const mid = (lo + hi) / 2; if (emiOf(v.p, mid / 1200, n) > e) hi = mid; else lo = mid; } return { out: [['Real (reducing) interest rate', pc(lo), 't', 1], ['Monthly EMI', e, 'r'], ['Total interest', e * n - v.p, 'r'], ['Flat rate quoted', pc(v.f), 't']], parts: [['Principal', v.p], ['Interest', e * n - v.p]], note: 'A flat rate charges interest on the full loan for the whole tenure, even as you repay it. The reducing rate above is the true annual cost, comparable with bank quotes.' }; }
    },
    'credit-card': {
      n: 'Credit card interest calculator', c: 'bor', lead: 'debt', f: [N('b', 'Outstanding balance', 1000, 1e7, 500, 100000, '₹'), N('r', 'Interest rate', .5, 5, .05, 3.75, '% a month'), N('pay', 'Payment each month', 100, 1e7, 100, 5000, '₹')],
      run(v) {
        let b = v.b, ti = 0, m = 0; const X = [0], B = [v.b], T = []; let yi = 0, yp = 0;
        while (b > 0.5 && m < 600) { const it = b * v.r / 100, g = it * .18; if (v.pay <= it + g) { m = -1; break; } const p = Math.min(v.pay, b + it + g); b = b + it + g - p; ti += it + g; yi += it + g; yp += p; m++; if (m % 12 === 0 || b <= .5) { X.push(Math.ceil(m / 12)); B.push(Math.max(b, 0)); T.push([Math.ceil(m / 12), yp, yi, Math.max(b, 0)]); yi = yp = 0; } }
        if (m < 0) return { out: [['Time to clear', 'Never at this payment', 't', 1], ['Interest and GST in month one', v.b * v.r / 100 * 1.18, 'r'], ['Pay at least', v.b * v.r / 100 * 1.18 + 1, 'r'], ['Annual interest rate', pc(v.r * 12), 't']], note: 'Your payment does not cover the monthly interest plus 18% GST on it, so the balance keeps growing.' };
        return { out: [['Time to clear', ym(m), 't', 1], ['Interest and GST paid', ti, 'r'], ['Total paid', v.b + ti, 'r'], ['Annual interest rate', pc(v.r * 12), 't']], parts: [['Balance', v.b], ['Interest and GST', ti]], ch: { x: X, xl: 'Year ', s: [{ n: 'Balance', d: B, c: O }] }, tb: { h: ['Year', 'Paid that year', 'Interest and GST that year', 'Balance'], r: T }, note: 'Assumes no new spending. Card interest attracts 18% GST, included here.' };
      }
    },
    'rent-vs-buy': {
      n: 'Rent vs buy calculator', c: 'bor', lead: 'home', f: [N('price', 'Property price', 5e5, 5e8, 50000, 8000000, '₹'), N('dp', 'Down payment', 10, 60, 1, 20, '%'), N('lr', 'Home loan rate', 6, 15, .05, 8.5, '% a year'), N('y', 'Years to compare (loan tenure)', 5, 30, 1, 20, 'years'), N('rent', 'Rent for a similar home', 1000, 1e6, 500, 25000, '₹'), N('ri', 'Rent increase', 0, 15, .5, 5, '% a year'), N('ap', 'Property price growth', 0, 15, .5, 5, '% a year'), N('ir', 'Return on investments', 1, 20, .5, 10, '% a year'), N('uc', 'Stamp duty and other buying costs', 0, 15, .5, 7, '%')],
      run(v) {
        const L = v.price * (1 - v.dp / 100), i = v.lr / 1200, n = v.y * 12, E = emiOf(L, i, n), ri = v.ir / 1200;
        let bal = L, rent = v.rent, rp = v.price * (v.dp + v.uc) / 100, bp = 0; const X = [], A = [], B = [];
        for (let m = 1; m <= n; m++) { bal = Math.max(0, bal * (1 + i) - E); const d = E - rent; rp *= 1 + ri; bp *= 1 + ri; if (d > 0) rp += d; else bp -= d; if (m % 12 === 0) { const y = m / 12, pv = v.price * pw(1 + v.ap / 100, y); X.push(y); A.push(rp); B.push(pv - bal + bp); rent *= 1 + v.ri / 100; } }
        const bw = B[B.length - 1], rw = A[A.length - 1], buy = bw >= rw;
        return { out: [[(buy ? 'Buying' : 'Renting') + ' leaves you ahead by', Math.abs(bw - rw), 'r', 1], ['Wealth if you buy', bw, 'r'], ['Wealth if you rent and invest', rw, 'r'], ['Monthly EMI', E, 'r'], ['Rent in the first year', v.rent, 'r']], ch: { x: X, xl: 'Year ', s: [{ n: 'Rent and invest', d: A, c: I }, { n: 'Buy', d: B, c: V }] }, note: 'Both sides spend the same each month: whoever pays less invests the difference. Maintenance, tax benefits and selling costs are not included.' };
      }
    },
    'income-tax': {
      n: 'Income tax calculator', c: 'tax', f: [N('inc', 'Annual income', 0, 1e9, 10000, 1500000, '₹'), S('sal', 'Salaried or pensioner?', [[1, 'Yes'], [0, 'No']], 1), N('ded', 'Old-regime deductions (80C, 80D, home loan interest)', 0, 1e7, 5000, 200000, '₹'), N('ex', 'Old-regime exemptions (HRA, LTA)', 0, 1e7, 5000, 0, '₹')],
      run(v) {
        const tn = Math.max(0, v.inc - (+v.sal ? 75000 : 0)), to = Math.max(0, v.inc - (+v.sal ? 50000 : 0) - v.ded - v.ex), a = tax(tn), b = tax(to, 1), best = Math.min(a, b);
        return { out: [[a <= b ? 'New regime saves you' : 'Old regime saves you', Math.abs(a - b), 'r', 1], ['Tax under the new regime', a, 'r'], ['Tax under the old regime', b, 'r'], ['Taxable income, new regime', tn, 'r'], ['Taxable income, old regime', to, 'r'], ['Monthly income after tax', (v.inc - best) / 12, 'r'], ['Effective tax rate', pc(best / Math.max(v.inc, 1) * 100), 't']], parts: [['Income after tax', v.inc - best], ['Tax', best]], note: 'Tax year 2026-27 (FY 2026-27) slabs for residents under 60, including the rebate, surcharge and 4% cess. Surcharge marginal relief is not modelled.' };
      }
    },
    salary: {
      n: 'Salary calculator', c: 'tax', f: [N('ctc', 'Annual CTC', 100000, 1e9, 10000, 1200000, '₹'), N('bp', 'Basic pay as a share of CTC', 20, 70, 1, 50, '%'), S('pf', 'Provident fund', [['cap', 'On ₹15,000 wage ceiling (₹1,800 a month)'], ['full', '12% of full basic'], ['none', 'Not deducted']], 'cap'), S('gr', 'Does the CTC include gratuity?', [[1, 'Yes'], [0, 'No']], 1), N('pt', 'Professional tax a year', 0, 2500, 100, 2500, '₹'), S('reg', 'Tax regime', [[0, 'New regime'], [1, 'Old regime']], 0), N('ded', 'Other old-regime deductions', 0, 1e7, 5000, 0, '₹')],
      run(v) {
        const basic = v.ctc * v.bp / 100, pf = v.pf === 'full' ? .12 * basic : v.pf === 'cap' ? Math.min(.12 * basic, 21600) : 0, gr = +v.gr ? .0481 * basic : 0, gross = v.ctc - pf - gr;
        const old = +v.reg, ti = old ? gross - 50000 - v.pt - Math.min(150000, pf) - v.ded : gross - 75000, t = tax(ti, old), home = gross - pf - v.pt - t;
        return { out: [['Monthly take-home pay', home / 12, 'r', 1], ['Annual take-home pay', home, 'r'], ['Gross salary', gross, 'r'], ['Income tax', t, 'r'], ['Your PF contribution', pf, 'r'], ['Employer PF (in CTC)', pf, 'r'], ['Gratuity provision (in CTC)', gr, 'r'], ['Professional tax', v.pt, 'r']], parts: [['Take-home', home], ['Income tax', t], ['PF (both shares)', 2 * pf], ['Gratuity and professional tax', gr + v.pt]], note: 'Under the labour codes, basic pay plus DA should be at least half of total pay. Gratuity is provided at 4.81% of basic. Tax uses FY 2026-27 slabs.' };
      }
    },
    hra: {
      n: 'HRA calculator', c: 'tax', f: [N('b', 'Basic salary plus DA (a year)', 0, 1e8, 10000, 600000, '₹'), N('h', 'HRA received (a year)', 0, 1e8, 5000, 240000, '₹'), N('rent', 'Rent paid (a year)', 0, 1e8, 5000, 300000, '₹'), S('m', 'City', [[.5, 'Metro (50% of salary)'], [.4, 'Other city (40% of salary)']], .5)],
      run(v) { const b = Math.max(0, v.rent - .1 * v.b), c = v.m * v.b, ex = Math.max(0, Math.min(v.h, b, c)); return { out: [['Exempt HRA', ex, 'r', 1], ['Taxable HRA', v.h - ex, 'r'], ['HRA received', v.h, 'r'], ['Rent minus 10% of salary', b, 'r'], [Math.round(v.m * 100) + '% of salary', c, 'r']], parts: [['Exempt', ex], ['Taxable', v.h - ex]], note: 'The exemption is the lowest of the three figures and is available only under the old tax regime.' }; }
    },
    gratuity: {
      n: 'Gratuity calculator', c: 'tax', f: [N('w', 'Last monthly basic plus DA', 1000, 1e7, 500, 60000, '₹'), N('y', 'Completed years of service', 1, 50, 1, 10, 'years'), N('mo', 'Extra months', 0, 11, 1, 0, 'months'), S('cov', 'Is the employer covered by the gratuity law?', [[1, 'Yes (most employers)'], [0, 'No']], 1)],
      run(v) { const yrs = +v.cov ? v.y + (v.mo > 6 ? 1 : 0) : v.y, g = v.w * 15 / (+v.cov ? 26 : 30) * yrs, pay = +v.cov ? Math.min(g, 2e6) : g, free = Math.min(pay, 2e6); const out = [['Gratuity', pay, 'r', 1], ['Years counted', yrs + ' years', 't'], ['Tax-free', free, 'r'], ['Taxable', pay - free, 'r']]; if (v.y < 5) out.push(['Eligibility', 'Permanent staff need 5 years; fixed-term staff 1 year', 't']); return { out, parts: [['Tax-free', free], ['Taxable', pay - free]], note: 'Formula: last wages × 15 ÷ 26 × years (15 ÷ 30 if not covered). More than six months counts as a full year. Statutory gratuity is capped at ₹20 lakh.' }; }
    },
    'capital-gains': {
      n: 'Capital gains tax calculator', c: 'tax', f: [N('b', 'Purchase value', 1, 1e10, 1000, 500000, '₹'), N('s', 'Sale value', 1, 1e10, 1000, 800000, '₹'), N('h', 'Holding period', 1, 600, 1, 18, 'months'), N('u', 'LTCG exemption already used this year', 0, 125000, 1000, 0, '₹')],
      run(v) {
        const g = v.s - v.b, lt = v.h > 12;
        if (g <= 0) return { out: [['Tax payable', 0, 'r', 1], [(lt ? 'Long' : 'Short') + '-term capital loss', -g, 'r'], ['Amount received', v.s, 'r']], note: 'Short-term losses can be set off against any capital gains; long-term losses only against long-term gains. Losses can be carried forward for eight years if you file on time.' };
        const ex = lt ? Math.min(g, Math.max(0, 125000 - v.u)) : 0, tg = g - ex, t = tg * (lt ? .125 : .2) * 1.04;
        return { out: [['Tax payable', t, 'r', 1], ['Type of gain', lt ? 'Long-term (over 12 months)' : 'Short-term (12 months or less)', 't'], ['Capital gain', g, 'r'], ['Exempt (₹1.25 lakh yearly limit)', ex, 'r'], ['Taxable gain', tg, 'r'], ['Tax rate', lt ? '12.5% + 4% cess' : '20% + 4% cess', 't'], ['You keep', v.s - t, 'r'], ['Effective tax on the gain', pc(t / g * 100), 't']], parts: [['Gain kept', g - t], ['Tax', t]], note: 'For listed shares and equity mutual funds with STT paid. Surcharge is not included.' };
      }
    },
    gst: {
      n: 'GST calculator', c: 'tax', f: [N('a', 'Amount', 1, 1e10, 1, 10000, '₹'), S('g', 'GST rate', [[18, '18%'], [5, '5%'], [40, '40%'], [3, '3% (gold, silver)'], [0.25, '0.25%'], [0, '0% (exempt)'], [12, '12% (old rate)'], [28, '28% (old rate)']], 18), S('mode', 'The amount is', [[0, 'Before GST (add GST)'], [1, 'Including GST (remove GST)']], 0)],
      run(v) { const base = +v.mode ? v.a / (1 + v.g / 100) : v.a, t = base * v.g / 100; return { out: [['Price including GST', base + t, 'r2', 1], ['Price before GST', base, 'r2'], ['Total GST', t, 'r2'], ['CGST (' + v.g / 2 + '%)', t / 2, 'r2'], ['SGST (' + v.g / 2 + '%)', t / 2, 'r2']], parts: [['Price', base], ['GST', t]], note: 'Within a state GST splits equally into CGST and SGST; between states the whole amount is IGST.' }; }
    },
    retirement: {
      n: 'Retirement calculator', c: 'pln', lead: 'ret', f: [N('age', 'Your age', 18, 65, 1, 30, 'years'), N('ret', 'Retirement age', 40, 75, 1, 60, 'years'), N('life', 'Plan until age', 65, 100, 1, 85, 'years'), N('exp', 'Monthly expenses today', 5000, 1e7, 1000, 50000, '₹'), N('inf', 'Inflation', 1, 12, .25, 6, '% a year'), N('pre', 'Return before retirement', 1, 20, .5, 12, '% a year'), N('post', 'Return after retirement', 1, 15, .5, 7, '% a year')],
      run(v) {
        const yrs = Math.max(1, v.ret - v.age), n = Math.max(1, v.life - v.ret), mo = v.exp * pw(1 + v.inf / 100, yrs), ann = mo * 12, rr = (1 + v.post / 100) / (1 + v.inf / 100) - 1;
        const corpus = Math.abs(rr) < 1e-9 ? ann * n : ann * (1 - pw(1 + rr, -n)) / rr * (1 + rr), i = v.pre / 1200, m = pmtSip(corpus, i, yrs * 12); let b = 0; const X = [], A = [], B = [];
        for (let y = 1; y <= yrs; y++) { for (let k = 0; k < 12; k++) b = (b + m) * (1 + i); X.push(v.age + y); A.push(m * 12 * y); B.push(b); }
        return { out: [['Monthly SIP needed', m, 'r', 1], ['Corpus needed at ' + v.ret, corpus, 'r'], ['Monthly expenses at retirement', mo, 'r'], ['Years in retirement', n + ' years', 't']], ch: { x: X, xl: 'Age ', s: [{ n: 'Invested', d: A, c: I }, { n: 'Corpus', d: B, c: V }] } };
      }
    },
    nps: {
      n: 'NPS calculator', c: 'pln', lead: 'ret', f: [N('m', 'Monthly contribution', 500, 1e6, 500, 10000, '₹'), N('age', 'Your age', 18, 65, 1, 30, 'years'), N('ret', 'Exit age', 60, 75, 1, 60, 'years'), N('r', 'Expected return', 4, 15, .5, 10, '% a year'), N('an', 'Share used to buy an annuity', 20, 100, 5, 20, '%'), N('ar', 'Annuity rate', 4, 9, .1, 6, '% a year')],
      run(v) { const n = Math.max(1, v.ret - v.age) * 12, i = v.r / 1200, cp = fvSip(v.m, i, n), an = cp * v.an / 100, s = yearly(n / 12, k => [v.m * 12 * k, fvSip(v.m, i, 12 * k)]); return { out: [['Corpus at ' + v.ret, cp, 'r', 1], ['Lump sum you can withdraw', cp - an, 'r'], ['Used for annuity', an, 'r'], ['Estimated monthly pension', an * v.ar / 1200, 'r'], ['Total contributed', v.m * n, 'r']], parts: [['Lump sum', cp - an], ['Annuity', an]], ...growth(s, 'Contributed', 'Corpus'), note: 'Non-government subscribers with a corpus above ₹12 lakh can withdraw up to 80% and must annuitise at least 20%. Up to ₹8 lakh, the whole corpus can be withdrawn. Government employees must annuitise at least 40%.' }; }
    },
    epf: {
      n: 'EPF calculator', c: 'pln', lead: 'ret', f: [N('b', 'Monthly basic plus DA', 5000, 1e7, 500, 30000, '₹'), N('age', 'Your age', 18, 58, 1, 28, 'years'), N('ret', 'Retirement age', 40, 60, 1, 58, 'years'), N('bal', 'Current EPF balance', 0, 1e9, 1000, 0, '₹'), N('inc', 'Yearly salary increase', 0, 20, .5, 6, '%'), N('r', 'EPF interest rate', 5, 12, .05, 8.25, '% a year')],
      run(v) {
        let b = v.bal, w = v.b, me = 0, er = 0; const X = [], A = [], B = [], T = [];
        for (let y = v.age + 1; y <= v.ret; y++) { let yi = 0; for (let k = 0; k < 12; k++) { const e = .12 * w, c = .12 * w - Math.min(.0833 * Math.min(w, 15000), 1250); b += e + c; me += e; er += c; yi += b * v.r / 1200; } b += yi; X.push(y); A.push(v.bal + me + er); B.push(b); T.push([y, me, er, b]); w *= 1 + v.inc / 100; }
        return { out: [['EPF corpus at ' + v.ret, b, 'r', 1], ['Your contributions', me, 'r'], ['Employer contributions to EPF', er, 'r'], ['Interest earned', b - me - er - v.bal, 'r']], parts: [['Contributions', me + er + v.bal], ['Interest', b - me - er - v.bal]], ch: { x: X, xl: 'Age ', s: [{ n: 'Contributions', d: A, c: I }, { n: 'Balance', d: B, c: V }] }, tb: { h: ['Age', 'Your share so far', 'Employer share so far', 'Balance'], r: T }, note: 'Of the employer’s 12%, up to ₹1,250 a month goes to the pension scheme (EPS) and the rest to EPF. EPF interest for FY 2025-26 is 8.25%.' };
      }
    },
    fire: {
      n: 'FIRE calculator', c: 'pln', lead: 'ret', f: [N('exp', 'Monthly expenses today', 5000, 1e7, 1000, 60000, '₹'), N('age', 'Your age', 18, 70, 1, 30, 'years'), N('cur', 'Investments today', 0, 1e10, 10000, 1000000, '₹'), N('m', 'Monthly investment', 0, 1e7, 1000, 40000, '₹'), N('r', 'Expected return', 1, 20, .5, 11, '% a year'), N('inf', 'Inflation', 1, 12, .25, 6, '% a year'), N('swr', 'Safe withdrawal rate', 2, 6, .1, 3.5, '%')],
      run(v) {
        const i = v.r / 1200, X = [], A = [], B = []; let p = v.cur, fy = 0;
        for (let y = 1; y <= 60; y++) { for (let k = 0; k < 12; k++) p = (p + v.m) * (1 + i); const tg = v.exp * 12 * pw(1 + v.inf / 100, y) / (v.swr / 100); X.push(v.age + y); A.push(tg); B.push(p); if (p >= tg) { fy = y; break; } }
        const n0 = v.exp * 12 / (v.swr / 100);
        return { out: [['Financially independent at', fy ? 'Age ' + (v.age + fy) : 'Not within 60 years', 't', 1], ['Years from now', fy ? fy + ' years' : 'More than 60', 't'], ['FIRE number in today’s money', n0, 'r'], ['FIRE number at that time', A[A.length - 1], 'r']], ch: { x: X, xl: 'Age ', s: [{ n: 'Target', d: A, c: G, dash: 1 }, { n: 'Your investments', d: B, c: V }] }, note: 'Your FIRE number is the corpus whose yearly withdrawal at the safe rate covers your expenses. Many Indian planners use 3% to 3.5% because of higher inflation.' };
      }
    },
    'life-cover': {
      n: 'Life cover calculator', c: 'pln', lead: 'ins', f: [N('inc', 'Your annual income', 100000, 1e9, 10000, 1200000, '₹'), N('fe', 'Family’s yearly expenses without you', 10000, 1e9, 10000, 600000, '₹'), N('ys', 'Years of support needed', 1, 40, 1, 20, 'years'), N('l', 'Outstanding loans', 0, 1e10, 10000, 2000000, '₹'), N('g', 'Future goals (education, marriage)', 0, 1e10, 10000, 2500000, '₹'), N('s', 'Savings and investments', 0, 1e10, 10000, 1000000, '₹'), N('ex', 'Existing life cover', 0, 1e10, 100000, 0, '₹')],
      run(v) { let pv = 0; for (let t = 0; t < v.ys; t++) pv += v.fe * pw(1.06, t) / pw(1.07, t); const need = Math.max(0, pv + v.l + v.g - v.s - v.ex); return { out: [['Recommended term cover', Math.ceil(need / 5e5) * 5e5, 'r', 1], ['Present value of family expenses', pv, 'r'], ['Loans and goals', v.l + v.g, 'r'], ['Less savings and existing cover', v.s + v.ex, 'r'], ['As a multiple of income', (need / v.inc).toFixed(1) + '×', 't']], parts: [['Expenses', pv], ['Loans and goals', v.l + v.g]], note: 'Expenses grow at 6% inflation and the payout earns 7%. Rounded up to the nearest ₹5 lakh. A common rule of thumb is 10 to 15 times annual income.' }; }
    },
    'emergency-fund': {
      n: 'Emergency fund calculator', c: 'pln', f: [N('e', 'Essential monthly expenses', 1000, 1e7, 1000, 40000, '₹'), S('mo', 'Months of cover', [[6, '6 months (most households)'], [3, '3 months (stable job, dual income)'], [9, '9 months (single earner)'], [12, '12 months (irregular income)']], 6), N('have', 'Saved so far', 0, 1e9, 1000, 50000, '₹'), N('save', 'Monthly saving towards it', 0, 1e7, 500, 10000, '₹')],
      run(v) { const t = v.e * v.mo, gap = Math.max(0, t - v.have), m = gap && v.save ? Math.ceil(gap / v.save) : 0; return { out: [['Emergency fund target', t, 'r', 1], ['Still to save', gap, 'r'], ['Time to reach it', gap ? (v.save ? ym(m) : 'Set a monthly saving') : 'Already there', 't'], ['Months covered today', (v.have / v.e).toFixed(1), 't']], parts: [['Saved', Math.min(v.have, t)], ['Gap', gap]] }; }
    },
    'net-worth': {
      n: 'Net worth calculator', c: 'pln', f: [N('cash', 'Bank and cash', 0, 1e10, 1000, 200000, '₹'), N('fd', 'FDs and debt funds', 0, 1e10, 1000, 300000, '₹'), N('eq', 'Shares and equity funds', 0, 1e10, 1000, 500000, '₹'), N('rt', 'EPF, PPF and NPS', 0, 1e10, 1000, 400000, '₹'), N('gold', 'Gold', 0, 1e10, 1000, 200000, '₹'), N('prop', 'Property', 0, 1e11, 10000, 0, '₹'), N('hl', 'Home loan outstanding', 0, 1e11, 10000, 0, '₹'), N('ol', 'Other loans and card dues', 0, 1e10, 1000, 50000, '₹')],
      run(v) { const as = v.cash + v.fd + v.eq + v.rt + v.gold + v.prop, li = v.hl + v.ol; return { out: [['Net worth', as - li, 'r', 1], ['Total assets', as, 'r'], ['Total liabilities', li, 'r'], ['Debt to assets', pc(as ? li / as * 100 : 0), 't'], ['Liquid assets (bank, FDs, equity)', v.cash + v.fd + v.eq, 'r']], parts: [['Bank and cash', v.cash], ['FDs and debt', v.fd], ['Equity', v.eq], ['Retirement accounts', v.rt], ['Gold', v.gold], ['Property', v.prop]], note: 'Save this result to My Rupya and recalculate every few months to track your progress.' }; }
    },
    inflation: {
      n: 'Inflation calculator', c: 'pln', f: [N('a', 'Cost today', 100, 1e10, 100, 100000, '₹'), N('r', 'Inflation', 1, 15, .25, 6, '% a year'), N('y', 'Years from now', 1, 50, 1, 15, 'years')],
      run(v) { const k = pw(1 + v.r / 100, v.y), s = yearly(v.y, j => [v.a, v.a * pw(1 + v.r / 100, j)]); return { out: [['Cost after ' + v.y + ' years', v.a * k, 'r', 1], ['Today’s money will buy only', v.a / k, 'r'], ['Prices multiply by', k.toFixed(2) + '×', 't'], ['Prices double in about', (72 / v.r).toFixed(1) + ' years', 't']], ...growth(s, 'Cost today', 'Future cost') }; }
    },
    budget: {
      n: '50/30/20 budget calculator', c: 'day', f: [N('inc', 'Monthly take-home income', 1000, 1e8, 1000, 80000, '₹'), N('nd', 'Needs', 10, 80, 1, 50, '%'), N('wt', 'Wants', 0, 60, 1, 30, '%')],
      run(v) { const sv = Math.max(0, 100 - v.nd - v.wt), f = x => v.inc * x / 100; return { out: [['Save and invest', f(sv), 'r', 1], ['Needs: rent, EMIs, groceries, bills', f(v.nd), 'r'], ['Wants: eating out, shopping, travel', f(v.wt), 'r'], ['Savings rate', pc(sv), 't']], parts: [['Needs', f(v.nd)], ['Wants', f(v.wt)], ['Savings', f(sv)]], note: v.nd + v.wt > 100 ? 'Needs and wants add up to more than 100%; savings are set to zero.' : 'Pay yourself first: move the savings amount out on salary day.' }; }
    },
    percentage: {
      n: 'Percentage calculator', c: 'day', f: [S('md', 'I want to find', [[0, 'X% of Y'], [1, 'X is what % of Y'], [2, '% change from X to Y']], 0), N('x', 'X', -1e12, 1e12, .01, 15), N('y', 'Y', -1e12, 1e12, .01, 2000)],
      run(v) { const md = +v.md; if (md === 0) return { out: [[v.x + '% of ' + v.y.toLocaleString('en-IN'), +(v.x * v.y / 100).toFixed(4), 'n', 1]] }; if (md === 1) return { out: [[v.x.toLocaleString('en-IN') + ' as a share of ' + v.y.toLocaleString('en-IN'), pc(v.y ? v.x / v.y * 100 : 0), 't', 1]] }; return { out: [['Change from ' + v.x.toLocaleString('en-IN') + ' to ' + v.y.toLocaleString('en-IN'), (v.y >= v.x ? '+' : '') + pc(v.x ? (v.y - v.x) / Math.abs(v.x) * 100 : 0), 't', 1], ['Difference', +(v.y - v.x).toFixed(4), 'n']] }; }
    },
    discount: {
      n: 'Discount calculator', c: 'day', f: [N('p', 'Original price', 1, 1e9, 1, 2999, '₹'), N('d1', 'Discount', 0, 100, 1, 30, '%'), N('d2', 'Extra discount (bank or coupon)', 0, 100, 1, 10, '%')],
      run(v) { const f = v.p * (1 - v.d1 / 100) * (1 - v.d2 / 100); return { out: [['You pay', f, 'r2', 1], ['You save', v.p - f, 'r2'], ['Effective discount', pc((1 - f / v.p) * 100), 't'], ['Not the same as', (v.d1 + v.d2) + '% off', 't']], parts: [['You pay', f], ['You save', v.p - f]], note: 'Stacked discounts multiply, they do not add: 30% and then 10% off is 37% off, not 40%.' }; }
    },
    gold: {
      n: 'Gold price calculator', c: 'day', f: [N('w', 'Weight', .1, 10000, .1, 10, 'g'), S('k', 'Purity', [[24, '24 karat (99.9%)'], [22, '22 karat (91.6%)'], [18, '18 karat (75%)'], [14, '14 karat (58.5%)']], 22), N('rate', '24K rate per gram', 1000, 1e6, 1, 13000, '₹', { live: 'g24' }), N('mk', 'Making charges', 0, 35, .5, 12, '%')],
      run(v) { const g = v.w * v.rate * v.k / 24, mk = g * v.mk / 100, gst = (g + mk) * .03; return { out: [['Total price', g + mk + gst, 'r', 1], ['Gold value', g, 'r'], ['Making charges', mk, 'r'], ['GST at 3%', gst, 'r'], ['Effective price per gram', (g + mk + gst) / v.w, 'r']], parts: [['Gold', g], ['Making', mk], ['GST', gst]], note: 'The 24K rate fills in with today’s indicative price (international price plus 15% import duty). Jewellers’ rates differ by city.' }; }
    }
  };

  if (!W) { module.exports = { C, tax }; return; }
  const U = window.Rupya, D = document;
  if (!U) return;
  const { $, $$, inr, human, ic, store } = U;
  const COL = { a: 'var(--c1)', b: 'var(--c2)', c: 'var(--c3)', d: 'var(--c4)', e: 'var(--c5)' };
  const PART = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)', 'var(--c6)'];
  const LEAD = {
    inv: ['Want this turned into a real plan?', 'Get a free, personalised investment plan from the Rupya team.', 'advisor.html#invest'],
    sav: ['Not sure which scheme fits your goal?', 'Get a free plan that matches safe schemes to your timeline.', 'advisor.html#invest'],
    loan: ['Planning a loan?', 'Get free help comparing offers before you sign anything.', 'advisor.html#personal-loan'],
    home: ['Buying a home?', 'Get free help comparing home loan offers and eligibility.', 'advisor.html#home-loan'],
    debt: ['Struggling with card dues or loans?', 'Get a free, confidential plan to clear expensive debt.', 'advisor.html#debt'],
    tax: ['Want to pay less tax, legally?', 'Get free help choosing a regime, claiming deductions and filing.', 'advisor.html#tax'],
    ret: ['Planning for retirement?', 'Get a free review of your retirement savings and pension options.', 'advisor.html#retirement'],
    ins: ['Is your family properly covered?', 'Get free help choosing term and health insurance.', 'advisor.html#insurance']
  };
  const fmt = (x, f) => f === 'r' ? inr(x) : f === 'r2' ? inr(x, 2) : f === 'n' ? (+x).toLocaleString('en-IN', { maximumFractionDigits: 4 }) : x;
  const words = (x, f) => (f === 'r' || f === 'r2') && Math.abs(x) >= 1e5 ? human(x) : '';
  const isLog = f => f.u === '₹' && f.max / Math.max(f.min, 1) >= 500;
  const nice = v => { const a = Math.abs(v), s = a < 1e3 ? 10 : a < 1e4 ? 100 : a < 1e5 ? 500 : a < 1e6 ? 1000 : a < 1e7 ? 10000 : a < 1e8 ? 100000 : 1e6; return Math.round(v / s) * s; };

  function mount(host, id, opt = {}) {
    const def = C[id]; if (!def) return;
    const mini = !!opt.mini, R = U.R;
    const h = new URLSearchParams(mini ? '' : location.hash.slice(1));
    const val = f => h.has(f.k) ? h.get(f.k) : f.def;
    const pos = (f, v) => { if (isLog(f)) { const lo = Math.log(Math.max(f.min, 1)), hi = Math.log(f.max); return v <= f.min ? 0 : (Math.log(Math.max(v, 1)) - lo) / (hi - lo) * 1000; } return v; };
    host.classList.toggle('cx-mini', mini);
    host.innerHTML = `<div class="cx"><form class="cx-in" onsubmit="return false" aria-label="${def.n} inputs">${def.f.map(f => f.o
      ? `<div class="fd"><label for="c-${id}-${f.k}">${f.l}</label><select id="c-${id}-${f.k}" name="${f.k}">${f.o.map(o => `<option value="${o[0]}"${String(val(f)) === String(o[0]) ? ' selected' : ''}>${o[1]}</option>`).join('')}</select></div>`
      : `<div class="fd"><div class="fd-t"><label for="c-${id}-${f.k}">${f.l}</label><div class="fd-x">${f.u === '₹' ? '<span>₹</span>' : ''}<input id="c-${id}-${f.k}" name="${f.k}" type="number" inputmode="decimal" min="${f.min}" max="${f.max}" step="${f.step}" value="${val(f)}">${f.u && f.u !== '₹' ? `<span class="s">${f.u}</span>` : ''}</div></div>` +
        (f.min < 0 ? '' : `<input type="range" tabindex="-1" aria-hidden="true" data-for="${f.k}" min="${isLog(f) ? 0 : f.min}" max="${isLog(f) ? 1000 : f.max}" step="${isLog(f) ? 1 : f.step}" value="${pos(f, +val(f))}">`) + `<div class="fd-h" data-h="${f.k}"></div></div>`).join('')}</form>` +
      `<section class="cx-out" aria-live="polite" aria-label="Results"><div class="cx-hero"><span class="l"></span><output></output><span class="w"></span></div><div class="cx-st"></div><div class="cx-viz"></div>` +
      (mini ? `<div class="tp"><div class="ch-el"></div><p style="margin:12px 0 0"><a class="btn sm" href="${R}calculators/${id}.html">Open the full ${def.n}</a></p></div>` :
        `<div class="tabs" role="tablist"><button type="button" role="tab" data-t="ch" aria-selected="true">${ic('chart')}Chart</button><button type="button" role="tab" data-t="tb" aria-selected="false">${ic('table')}Year by year</button><button type="button" role="tab" data-t="cmp" aria-selected="false">${ic('scale')}Compare</button></div>` +
        `<div class="tp" data-p="ch"><div class="ch-el"></div><p class="note" style="margin:10px 0 0"></p></div><div class="tp" data-p="tb" hidden><div class="scroll"><table></table></div></div><div class="tp" data-p="cmp" hidden></div>` +
        `<div class="cx-act"><button class="btn sm ghost" type="button" data-a="save">${ic('save')}Save</button><button class="btn sm ghost" type="button" data-a="link">${ic('link')}Copy link</button><button class="btn sm ghost" type="button" data-a="csv">${ic('dl')}Download CSV</button><button class="btn sm ghost" type="button" data-a="print">${ic('print')}Print</button></div>`) +
      `</section></div>` + (mini ? '' : `<div class="cx-sticky" aria-hidden="true"><span></span><b></b></div>`);
    const form = $('form', host), hero = $('.cx-hero', host);
    let last, pin = null, cur = {};
    const tabs = $$('.tabs button', host);
    tabs.forEach(b => b.onclick = () => { tabs.forEach(x => x.setAttribute('aria-selected', x === b)); $$('.tp[data-p]', host).forEach(p => p.hidden = p.dataset.p !== b.dataset.t); if (b.dataset.t === 'ch') U.chart($('.ch-el', host), $('.ch-el', host)._o); });
    const sync = f => {
      const n = form.elements[f.k]; if (!n || f.o) return;
      const r = $(`[data-for="${f.k}"]`, form), v = +n.value;
      if (r) { r.value = pos(f, v); r.style.setProperty('--p', (r.value - r.min) / (r.max - r.min) * 100 + '%'); }
      const hh = $(`[data-h="${f.k}"]`, form);
      if (hh) hh.textContent = f.u === '₹' && v >= 1e3 ? human(v) : f.u === 'months' && v >= 12 ? ym(v) : f.hint || '';
    };
    const calc = () => {
      const v = {}; let ok = true;
      def.f.forEach(f => {
        const el = form.elements[f.k];
        if (f.o) { v[f.k] = isNaN(+el.value) ? el.value : +el.value; return; }
        const n = parseFloat(el.value); if (!isFinite(n)) { ok = false; return; }
        v[f.k] = Math.min(f.max, Math.max(f.min, n));
      });
      if (!ok) return;
      cur = v;
      let r; try { r = def.run(v); } catch (e) { return; }
      last = r;
      const hi = r.out.find(o => o[3]) || r.out[0];
      $('.l', hero).textContent = hi[0]; $('output', hero).textContent = fmt(hi[1], hi[2]); $('.w', hero).textContent = words(hi[1], hi[2]) || (mini ? '' : ' ');
      $('.cx-st', host).innerHTML = r.out.filter(o => o !== hi).map(o => `<div class="st"><span>${o[0]}</span><b>${fmt(o[1], o[2])}</b></div>`).join('');
      const parts = (r.parts || []).filter(p => p[1] > 0), tot = parts.reduce((a, p) => a + p[1], 0);
      let acc = 0;
      $('.cx-viz', host).innerHTML = parts.length > 1 && tot > 0 ? `<div class="donut" role="img" aria-label="${parts.map(p => p[0] + ' ' + Math.round(p[1] / tot * 100) + '%').join(', ')}" style="background:conic-gradient(${parts.map((p, i) => { const a = acc; acc += p[1] / tot * 360; return `${PART[i]} ${a}deg ${acc}deg`; }).join(',')})"></div><div class="lg">${parts.map((p, i) => `<div><i style="background:${PART[i]}"></i>${p[0]} <b>${Math.round(p[1] / tot * 100)}%</b></div>`).join('')}</div>` : '';
      const ce = $('.ch-el', host);
      if (r.ch) { ce.parentElement.hidden = false; U.chart(ce, { x: r.ch.x, xl: r.ch.xl, s: r.ch.s.map(s => ({ ...s, c: COL[s.c] || s.c })), f: U.short, ft: inr, h: mini ? 200 : 240, label: def.n + ' chart' }); }
      else if (mini) ce.innerHTML = '';
      if (!mini) {
        const tb = $('[data-t="tb"]', host), cb = $('[data-t="ch"]', host);
        tb.hidden = !r.tb; cb.hidden = !r.ch;
        const sel = $('.tabs [aria-selected="true"]', host);
        if (sel && sel.hidden) { const vis = tabs.find(b => !b.hidden); if (vis) vis.click(); }
        if (!r.ch && !r.tb && sel && sel.dataset.t !== 'cmp') $('[data-t="cmp"]', host).click();
        $('.tp[data-p="ch"] .note', host).textContent = r.note || 'Estimates for planning only. Actual returns, rates and taxes will differ.';
        if (!r.ch && r.note) { const cp = $('.tp[data-p="cmp"]', host); cp.dataset.note = r.note; }
        if (r.tb) $('[data-p="tb"] table', host).innerHTML = `<thead><tr>${r.tb.h.map(c => `<th scope="col">${c}</th>`).join('')}</tr></thead><tbody>` + r.tb.r.map(row => `<tr>${row.map((c, i) => `<td>${i ? inr(c) : c}</td>`).join('')}</tr>`).join('') + '</tbody>';
        renderCmp();
        const st = $('.cx-sticky', host); $('span', st).textContent = hi[0]; $('b', st).textContent = fmt(hi[1], hi[2]);
        history.replaceState(null, '', '#' + new URLSearchParams(Object.entries(v).map(([k, x]) => [k, typeof x === 'number' ? +x.toFixed(4) : x])));
      }
    };
    const renderCmp = () => {
      const p = $('.tp[data-p="cmp"]', host); if (!p || !last) return;
      const nt = p.dataset.note ? `<p class="note">${p.dataset.note}</p>` : '';
      if (!pin) { p.innerHTML = `<p style="margin-top:0">Pin these numbers as scenario A, then change any input to see the difference side by side.</p><button class="btn sm" type="button" data-a="pin">${ic('scale')}Pin as scenario A</button>${nt}`; return; }
      const rows = def.f.filter(f => String(pin.v[f.k]) !== String(cur[f.k])).map(f => `<tr><td>${f.l}</td><td>${f.o ? (f.o.find(o => String(o[0]) === String(pin.v[f.k])) || [, pin.v[f.k]])[1] : (+pin.v[f.k]).toLocaleString('en-IN')}</td><td>${f.o ? (f.o.find(o => String(o[0]) === String(cur[f.k])) || [, cur[f.k]])[1] : (+cur[f.k]).toLocaleString('en-IN')}</td><td></td></tr>`).join('');
      const outs = last.out.map((o, i) => { const a = pin.r.out[i]; if (!a) return ''; const num = typeof o[1] === 'number' && typeof a[1] === 'number', d = num ? o[1] - a[1] : null; return `<tr><td>${o[0]}</td><td>${fmt(a[1], a[2])}</td><td>${fmt(o[1], o[2])}</td><td class="dlt ${d > 0 ? 'up' : d < 0 ? 'dn' : ''}">${num && Math.abs(d) > 1e-9 ? (d > 0 ? '+' : '−') + fmt(Math.abs(d), o[2]) : ''}</td></tr>`; }).join('');
      p.innerHTML = `<div class="scroll"><table class="cmp"><thead><tr><th>&nbsp;</th><th>Scenario A</th><th>Now</th><th>Change</th></tr></thead><tbody>${rows}${outs}</tbody></table></div><p style="margin:12px 0 0"><button class="btn sm ghost" type="button" data-a="pin">Pin current as A</button> <button class="btn sm ghost" type="button" data-a="unpin">Clear</button></p>${nt}`;
    };
    host.addEventListener('click', e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const a = b.dataset.a;
      if (a === 'pin') { pin = { v: { ...cur }, r: last }; renderCmp(); U.toast('Scenario A pinned. Change any input to compare.'); }
      if (a === 'unpin') { pin = null; renderCmp(); }
      if (a === 'print') print();
      if (a === 'link') { const u = location.href; (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(() => U.toast('Link copied'), () => prompt('Copy this link', u)); }
      if (a === 'save') { const hi = last.out.find(o => o[3]) || last.out[0], s = store.get('saved', []); s.unshift({ u: location.pathname + location.hash, t: def.n, l: hi[0], v: fmt(hi[1], hi[2]), d: Date.now() }); store.set('saved', s.slice(0, 50)); U.toast('Saved to My Rupya'); }
      if (a === 'csv') {
        const rows = last.tb ? [last.tb.h, ...last.tb.r.map(r => r.map(c => typeof c === 'number' ? Math.round(c) : c))] : last.out.map(o => [o[0], typeof o[1] === 'number' ? Math.round(o[1] * 100) / 100 : o[1]]);
        const csv = rows.map(r => r.map(c => /[",\n]/.test(String(c)) ? `"${String(c).replace(/"/g, '""')}"` : c).join(',')).join('\n');
        const el = D.createElement('a'); el.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); el.download = 'rupya-' + id + '.csv'; D.body.append(el); el.click(); el.remove();
      }
    });
    form.addEventListener('input', e => {
      const t = e.target;
      if (t.dataset.for) { const f = def.f.find(x => x.k === t.dataset.for), n = form.elements[f.k]; if (isLog(f)) { const lo = Math.log(Math.max(f.min, 1)), hi = Math.log(f.max), v = +t.value === 0 ? f.min : Math.exp(lo + (hi - lo) * t.value / 1000); n.value = Math.min(f.max, Math.max(f.min, nice(v))); } else n.value = t.value; sync(f); }
      else { const f = def.f.find(x => x.k === t.name); if (f) sync(f); }
      calc();
    });
    def.f.forEach(sync);
    calc();
    def.f.filter(f => f.live === 'g24' && !h.has(f.k)).forEach(f => U.live.metals().then(m => { form.elements[f.k].value = Math.round(m.g24); sync(f); const hh = $(`[data-h="${f.k}"]`, form); if (hh) hh.textContent = 'Today’s indicative 24K rate'; calc(); }).catch(() => {}));
    if (!mini) {
      const lead = LEAD[def.lead || def.c === 'tax' && 'tax' || def.c];
      const more = U.CALCS.filter(c => c[2] === def.c && c[0] !== id);
      host.insertAdjacentHTML('beforeend', (lead ? `<aside class="cx-lead"><p><b>${lead[0]}</b>${lead[1]}</p><a class="btn" href="${R + lead[2]}">Get free help</a></aside>` : '') +
        `<section class="sec" style="padding-top:26px"><div class="sec-h"><h2>More ${U.CAT[def.c][0].toLowerCase()} calculators</h2><a href="${R}calculators/index.html">All 45 calculators</a></div><div class="dir"><div class="dir-c">${more.slice(0, Math.ceil(more.length / 2)).map(c => `<a href="${c[0]}.html">${c[1]}</a>`).join('')}</div><div class="dir-c">${more.slice(Math.ceil(more.length / 2)).map(c => `<a href="${c[0]}.html">${c[1]}</a>`).join('')}</div></div></section>`);
      const st = $('.cx-sticky', host);
      if (window.IntersectionObserver) new IntersectionObserver(es => es.forEach(x => st.classList.toggle('on', !x.isIntersecting && x.boundingClientRect.top < 0 && host.getBoundingClientRect().bottom > innerHeight))).observe(hero);
    }
  }
  window.RupyaCalc = { mount, C, tax };
  $$('[data-calc]').forEach(el => mount(el, el.dataset.calc, { mini: el.hasAttribute('data-mini') }));
  $$('[data-mtabs]').forEach(t => t.addEventListener('click', e => { const b = e.target.closest('button[data-id]'); if (!b) return; $$('button', t).forEach(x => x.setAttribute('aria-pressed', x === b)); mount(D.getElementById(t.dataset.mtabs), b.dataset.id, { mini: true }); }));
})();

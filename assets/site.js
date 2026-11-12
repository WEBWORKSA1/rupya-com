/* Rupya.com shell: header, footer, theme, cookie notice, form delivery */
(() => {
  const sc = document.currentScript || document.querySelector('script[src*="assets/site.js"]');
  const R = sc.getAttribute('src').split('assets/site.js')[0];
  const $ = (q, e = document) => e.querySelector(q);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const root = document.documentElement;
  const saved = store.get('rupya-theme');
  if (saved) root.dataset.theme = saved;

  const NAV = [
    ['calculators/index.html', 'Calculators'], ['currency.html', 'Currency'], ['guides/index.html', 'Guides'],
    ['videos.html', 'Videos'], ['contest.html', 'Quiz & Prizes'], ['support.html', 'Support']
  ];
  const L = (h, t) => `<a href="${R + h}">${t}</a>`;
  const logo = `<a class="logo" href="${R}index.html" aria-label="Rupya.com home"><span class="coin">₹</span>Rupya<small>.com</small></a>`;

  const hdr = $('#hdr');
  if (hdr) {
    hdr.innerHTML = `<div class="wrap nav">${logo}<button class="burger" aria-label="Menu" aria-expanded="false">☰</button><nav aria-label="Main">${NAV.map(n => L(n[0], n[1])).join('')}<button class="theme" aria-label="Toggle dark mode">◐</button><a class="btn gold sm" href="${R}money-checkup.html">Free money check-up</a></nav></div>`;
    const nav = $('nav', hdr), bg = $('.burger', hdr);
    bg.onclick = () => bg.setAttribute('aria-expanded', nav.classList.toggle('open'));
    $('.theme', hdr).onclick = () => {
      const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme:dark)').matches;
      root.dataset.theme = dark ? 'light' : 'dark';
      store.set('rupya-theme', root.dataset.theme);
      document.dispatchEvent(new Event('rupya-theme'));
    };
    nav.querySelectorAll('a').forEach(a => {
      const seg = a.getAttribute('href').replace(R, '').split('/')[0];
      if (seg && location.pathname.includes('/' + seg.replace('index.html', ''))) a.setAttribute('aria-current', 'page');
    });
  }

  const ftr = $('#ftr');
  if (ftr) {
    ftr.innerHTML = `<div class="wrap fgrid"><div>${logo}<p style="margin-top:12px">Free rupee calculators, live exchange rates and plain-English money guides for India.</p><form class="inline" data-form="Newsletter signup"><input type="email" name="email" required placeholder="Your email" aria-label="Email address"><button class="btn gold sm">Get the weekly note</button></form></div>` +
      `<div><h4>Tools</h4>${L('calculators/sip.html', 'SIP calculator')}${L('calculators/emi.html', 'EMI calculator')}${L('calculators/income-tax.html', 'Income tax calculator')}${L('calculators/ppf.html', 'PPF calculator')}${L('currency.html', 'INR converter')}${L('calculators/index.html', 'All calculators')}</div>` +
      `<div><h4>Learn</h4>${L('guides/index.html', 'Guides')}${L('glossary.html', 'Glossary')}${L('videos.html', 'Videos')}${L('contest.html', 'Money quiz')}${L('money-checkup.html', 'Money check-up')}</div>` +
      `<div><h4>Rupya</h4>${L('about.html', 'About')}${L('contact.html', 'Contact')}${L('support.html', 'Support us')}${L('support.html#hire', 'Work with us')}<a href="https://web.works/contact">Advertise / Sponsor</a></div>` +
      `<div><h4>Legal</h4>${L('privacy.html', 'Privacy policy')}${L('terms.html', 'Terms of use')}${L('disclaimer.html', 'Disclaimer & trademarks')}</div></div>` +
      `<div class="wrap fine"><p>© ${new Date().getFullYear()} Rupya.com. Educational information only; not financial, tax, legal or investment advice. “Rupya” is used as a transliteration of the common Hindi word for rupee. This site is independent and is not affiliated with the Reserve Bank of India, the Government of India, NPCI/RuPay or any similarly named company. All other trademarks belong to their owners. ${L('disclaimer.html', 'Full disclosure')}.</p></div>`;
  }

  if (!store.get('rupya-ck')) {
    const c = document.createElement('div');
    c.className = 'cookie';
    c.innerHTML = `<p>We use cookies for preferences and, through Google AdSense, for ads and measurement. ${L('privacy.html', 'Privacy policy')}</p><button class="btn sm">OK</button>`;
    document.body.append(c);
    $('button', c).onclick = () => { store.set('rupya-ck', '1'); c.remove(); };
  }

  /* Form delivery. The inbox is stored encoded and is never rendered on a page. */
  const K = [126, 108, 105, 126, 118, 121, 114, 122, 104, 56, 71, 110, 116, 104, 112, 115, 53, 106, 118, 116];
  const inbox = () => String.fromCharCode(...K.map(c => c - 7));
  const trap = f => f.insertAdjacentHTML('beforeend', '<input name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px">');
  document.querySelectorAll('form[data-form]').forEach(trap);

  document.addEventListener('submit', async e => {
    const f = e.target;
    if (!f.matches || !f.matches('form[data-form]')) return;
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    if (d._honey) return;
    delete d._honey;
    const subject = '[Rupya.com] ' + f.dataset.form;
    const btn = f.querySelector('button:not([type=button])');
    let msg = $('.fmsg', f);
    if (!msg) { msg = document.createElement('p'); msg.className = 'fmsg'; f.append(msg); }
    if (btn) btn.disabled = true;
    msg.textContent = 'Sending…';
    try {
      const r = await fetch('https://formsubmit.co/ajax/' + inbox(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...d, _subject: subject, _template: 'table', _captcha: 'false', page: location.href })
      });
      const j = await r.json();
      if (!r.ok || String(j.success) !== 'true') throw new Error('rejected');
      f.innerHTML = '<p class="ok">✓ Thank you. We have your details and will reply by email.</p>';
      f.dispatchEvent(new CustomEvent('rupya-sent', { bubbles: true }));
    } catch (err) {
      if (btn) btn.disabled = false;
      msg.innerHTML = 'Could not send right now. <button type="button" class="link">Send it from your email app instead</button>';
      $('button', msg).onclick = () => {
        const body = Object.entries(d).map(p => p[0] + ': ' + p[1]).join('\n');
        location.href = 'mailto:' + inbox() + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      };
    }
  });

  window.Rupya = { R, store, inr: n => '₹' + Math.round(n).toLocaleString('en-IN') };
})();

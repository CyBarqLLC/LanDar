/* LanDar site: menu, sample file sheets, cost calculator, copy buttons and the 3D concept models. No dependencies. */
(function () {
  'use strict';

  var doc = document, root = doc.documentElement, body = doc.body;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- header and menu ---------- */
  var bar = doc.querySelector('.bar');
  var burger = doc.querySelector('.burger');
  var sheet = doc.getElementById('menu');
  function setMenu(open) {
    body.classList.toggle('menu-open', open);
    if (burger) burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (sheet) sheet.setAttribute('aria-hidden', open ? 'false' : 'true');
  }
  if (burger) {
    burger.addEventListener('click', function () { setMenu(!body.classList.contains('menu-open')); });
    sheet.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1000) setMenu(false); });
  }
  function onScroll() {
    if (!bar) return;
    bar.classList.toggle('is-stuck', window.scrollY > 6);
    var max = root.scrollHeight - window.innerHeight;
    bar.style.setProperty('--read', max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : '0');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* current section in the desktop nav, and the phone action bar */
  var navLinks = [].slice.call(doc.querySelectorAll('.nav a'));
  var dock = doc.querySelector('.dock');
  var hero = doc.querySelector('.hero');
  var contact = doc.getElementById('contact');
  var foot = doc.querySelector('.foot');
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) { a.setAttribute('aria-current', a.getAttribute('href') === '#' + en.target.id ? 'true' : 'false'); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    [].forEach.call(doc.querySelectorAll('main section[id]'), function (s) { spy.observe(s); });

    if (dock) {
      var seen = { hero: true, contact: false, foot: false };
      var dockIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.target === hero) seen.hero = en.isIntersecting;
          if (en.target === contact) seen.contact = en.isIntersecting;
          if (en.target === foot) seen.foot = en.isIntersecting;
        });
        dock.classList.toggle('is-on', !seen.hero && !seen.contact && !seen.foot);
      }, { threshold: 0.05 });
      [hero, contact, foot].forEach(function (el) { if (el) dockIO.observe(el); });
    }
  }

  /* ---------- sample file: one sheet at a time ---------- */
  var tabs = [].slice.call(doc.querySelectorAll('.tabs [role="tab"]'));
  if (tabs.length) {
    var show = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var panel = doc.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(t); });
      t.addEventListener('keydown', function (e) {
        var rtl = root.getAttribute('dir') === 'rtl';
        var next = e.key === (rtl ? 'ArrowLeft' : 'ArrowRight'), prev = e.key === (rtl ? 'ArrowRight' : 'ArrowLeft');
        if (!next && !prev) return;
        e.preventDefault();
        show(tabs[(i + (next ? 1 : tabs.length - 1)) % tabs.length], true);
      });
    });
    show(tabs[0]);
  }

  /* ---------- cost calculator ----------
     The first TIER square metres of built area cost RATE each, every square metre above that costs RATE_ABOVE.
     The landscape plan is priced on the garden area. The 3D model has one fixed price. */
  var area = doc.getElementById('area');
  var out = doc.getElementById('total');
  if (area && out) {
    var RATE = 1.99;        /* US dollars per square metre of built area, up to TIER */
    var TIER = 200;         /* square metres priced at RATE */
    var RATE_ABOVE = 1;     /* US dollars for each square metre above TIER */
    var LAND = 0.5;         /* US dollars per square metre of garden, for the landscape plan */
    var MODEL = 99;         /* fixed price of the 3D model */

    var land = doc.getElementById('land'), withLand = doc.getElementById('withland'), landRow = doc.getElementById('landrow');
    var with3d = doc.getElementById('with3d');
    var bill = doc.getElementById('bill'), empty = doc.getElementById('billempty'), rowsEl = doc.getElementById('billrows');
    var note = doc.getElementById('billnote'), send = doc.getElementById('calcwa');
    var base = send ? send.getAttribute('href') : '';
    var T = function (k) { return rowsEl.getAttribute('data-' + k) || ''; };
    var num = function (v) { return v.toLocaleString('en-US', { maximumFractionDigits: 2 }); };
    var fixed = function (v) { return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var amount = function (v) { return '$' + fixed(v); };
    var words = function (v) { return T('words').replace('%s', fixed(v)); };
    var read = function (el) { return el ? Math.max(0, Math.min(1000000, parseFloat(el.value) || 0)) : 0; };
    var line = function (name, sub, value) {
      var row = doc.createElement('div'); row.className = 'bill-row';
      var left = doc.createElement('div');
      var b = doc.createElement('b'); b.textContent = name; left.appendChild(b);
      var s = doc.createElement('small'); s.textContent = sub; left.appendChild(s);
      var v = doc.createElement('span'); v.className = 'ltr'; v.textContent = amount(value);
      row.appendChild(left); row.appendChild(v);
      rowsEl.appendChild(row);
    };
    var per = function (metres, rate) { return T('sub').replace('%a', num(metres)).replace('%r', words(rate)); };

    var calc = function () {
      var v = read(area);
      var hasLand = withLand && withLand.checked, garden = hasLand ? read(land) : 0, extra = with3d && with3d.checked;
      if (landRow) landRow.hidden = !hasLand;
      if (!(v > 0)) { bill.hidden = true; empty.hidden = false; if (send) send.setAttribute('href', base); return; }
      var first = Math.min(v, TIER), rest = Math.max(0, v - TIER);
      var design = first * RATE + rest * RATE_ABOVE;
      var sum = design + garden * LAND + (extra ? MODEL : 0);
      while (rowsEl.firstChild) rowsEl.removeChild(rowsEl.firstChild);
      if (rest > 0) {
        line(T('first'), per(first, RATE), first * RATE);
        line(T('rest'), per(rest, RATE_ABOVE), rest * RATE_ABOVE);
      } else {
        line(T('design'), per(first, RATE), first * RATE);
      }
      if (garden > 0) line(T('land'), per(garden, LAND), garden * LAND);
      if (extra) line(T('model'), T('fixed'), MODEL);
      out.textContent = amount(sum);
      var text = T('avg').replace('%s', words(design / v));
      if (rest > 0) text += ' ' + T('save').replace('%s', words(v * RATE - design));
      note.textContent = text;
      if (send) {
        var msg = T('msg').replace('%a', num(v)) + (garden > 0 ? T('msg-land').replace('%l', num(garden)) : '') + (extra ? T('msg-3d') : '') + T('msg-end').replace('%t', words(sum));
        send.setAttribute('href', base + '?text=' + encodeURIComponent(msg));
      }
      empty.hidden = true; bill.hidden = false;
    };

    [area, land].forEach(function (el) { if (el) el.addEventListener('input', calc); });
    [withLand, with3d].forEach(function (el) { if (el) el.addEventListener('change', calc); });
    if (withLand) withLand.addEventListener('change', function () { if (withLand.checked && land && !land.value) land.focus(); });
    [].forEach.call(doc.querySelectorAll('.stepper'), function (btn) {
      btn.addEventListener('click', function () {
        var step = parseFloat(btn.getAttribute('data-step')) || 0;
        var cur = read(area);
        area.value = String(Math.max(0, cur + step));
        calc();
      });
    });
    [].forEach.call(doc.querySelectorAll('.presets [data-area]'), function (btn) {
      btn.addEventListener('click', function () { area.value = btn.getAttribute('data-area'); calc(); });
    });
    calc();
  }

  /* ---------- copy to clipboard ---------- */
  [].forEach.call(doc.querySelectorAll('[data-copy]'), function (btn) {
    var label = btn.querySelector('.handle');
    var idle = label ? label.textContent : '';
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var done = function () {
        if (!label) return;
        label.textContent = btn.getAttribute('data-done') || 'Copied';
        label.classList.add('copied');
        setTimeout(function () { label.textContent = idle; label.classList.remove('copied'); }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
    });
  });

  var top = doc.querySelector('[data-top]');
  if (top) top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
  var year = doc.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- 3D concept models ----------
     Each model is a handful of boxes: [x, y, z, width, depth, height, material].
     x runs across the plot, y runs from the street to the back, z is height. Units are metres.
     The view is drawn at a fixed 30 degree tilt, which gives the same 1:2 slope as the LanDar symbol. */
  var MODELS = {
    stepped: {
      plot: [26, 20], angle: -0.62,
      boxes: [
        [4, 6, 0, 18, 11, 3.1, 'stone'],
        [7, 9, 3.1, 15, 8, 3.1, 'wall'],
        [11, 12, 6.2, 11, 5, 3.0, 'wall'],
        [5.5, 5.82, 0.45, 15, 0.18, 2.3, 'glass'],
        [8.5, 8.82, 3.5, 12, 0.18, 2.3, 'glass'],
        [12.5, 11.82, 6.6, 8, 0.18, 2.2, 'glass'],
        [3.82, 8, 0.45, 0.18, 7, 2.3, 'glass'],
        [6.82, 10.5, 3.5, 0.18, 5, 2.3, 'glass'],
        [22, 8, 0.45, 0.18, 7, 2.3, 'glass'],
        [5, 1.6, 0, 8, 3, 0.16, 'water'],
        [14.5, 1.6, 0, 6.5, 3, 0.1, 'slab']
      ]
    },
    courtyard: {
      plot: [26, 20], angle: -0.5,
      boxes: [
        [4, 11, 0, 18, 7, 3.3, 'wall'],
        [16, 4, 0, 6, 7, 3.3, 'stone'],
        [4, 11.6, 3.3, 10, 6.4, 3.1, 'wall'],
        [4, 5, 0, 12, 6, 0.25, 'slab'],
        [5.5, 6, 0.25, 8.5, 3.2, 0.14, 'water'],
        [5, 10.82, 0.35, 10, 0.18, 2.6, 'glass'],
        [15.82, 5, 0.35, 0.18, 5, 2.6, 'glass'],
        [17.2, 3.82, 0.6, 3.6, 0.18, 2.1, 'glass'],
        [5, 11.42, 3.7, 8, 0.18, 2.3, 'glass'],
        [22, 12.5, 0.6, 0.18, 4, 2.1, 'glass'],
        [3.82, 13, 3.7, 0.18, 4, 2.3, 'glass']
      ]
    },
    terrace: {
      plot: [22, 18], angle: -0.7,
      boxes: [
        [5, 7, 0, 12, 8, 3.2, 'stone'],
        [3.5, 5, 3.2, 10.5, 9, 3.1, 'wall'],
        [5, 4.4, 0, 12, 2.6, 0.2, 'slab'],
        [6, 6.82, 0.35, 6, 0.18, 2.5, 'glass'],
        [4.5, 4.82, 3.7, 8.5, 0.18, 2.3, 'glass'],
        [14, 6, 3.7, 0.18, 4, 2.3, 'glass'],
        [14.2, 7, 3.2, 2.8, 0.12, 1.0, 'glass'],
        [16.88, 7, 3.2, 0.12, 8, 1.0, 'glass'],
        [17, 9, 0.5, 0.18, 4, 2.2, 'glass'],
        [3.32, 7, 3.7, 0.18, 5, 2.3, 'glass']
      ]
    }
  };
  var MAT = { wall: [255, 255, 255], stone: [221, 218, 213], slab: [238, 235, 230], glass: [18, 50, 85], water: [164, 186, 200] };
  var INK = [13, 30, 56];
  var SE = 0.5, CE = Math.sqrt(3) / 2;            /* sin and cos of the 30 degree tilt */
  var NS = 'http://www.w3.org/2000/svg';

  function tone(mat, k) {
    var c = MAT[mat];
    return 'rgb(' + Math.round(c[0] + (INK[0] - c[0]) * k) + ',' + Math.round(c[1] + (INK[1] - c[1]) * k) + ',' + Math.round(c[2] + (INK[2] - c[2]) * k) + ')';
  }

  function Viewer(el) {
    var def = MODELS[el.getAttribute('data-model')];
    if (!def) return null;
    var self = this;
    this.el = el;
    this.angle = def.angle;
    this.cx = def.plot[0] / 2; this.cy = def.plot[1] / 2;
    this.boxes = def.boxes.map(function (b) {
      return { min: [b[0], b[1], b[2]], max: [b[0] + b[3], b[1] + b[4], b[2] + b[5]], mat: b[6], faces: [] };
    });
    this.plot = def.plot;
    /* every model is framed the same way, so the cards line up and the homes keep their relative size */
    var zmax = 9.4;
    var R = 17;
    var topY = -(zmax * CE + R * SE) - 0.6, h = zmax * CE + 2 * R * SE + 1.2;
    var svg = doc.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', [-R, topY, 2 * R, h].join(' '));
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', el.getAttribute('data-label') || '');
    this.ground = doc.createElementNS(NS, 'polygon');
    this.ground.setAttribute('fill', 'none');
    this.ground.setAttribute('stroke', 'rgba(13,30,56,.4)');
    this.ground.setAttribute('stroke-width', '1');
    this.ground.setAttribute('vector-effect', 'non-scaling-stroke');
    this.g = doc.createElementNS(NS, 'g');
    this.g.setAttribute('stroke', 'rgba(13,30,56,.6)');
    this.g.setAttribute('stroke-width', '1');
    this.g.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(this.ground); svg.appendChild(this.g);
    this.boxes.forEach(function (b) {
      for (var i = 0; i < 5; i++) {
        var p = doc.createElementNS(NS, 'polygon');
        p.setAttribute('vector-effect', 'non-scaling-stroke');
        b.faces.push(p);
      }
    });
    el.appendChild(svg);
    this.visible = true; this.hold = 0; this.dirty = true;

    /* drag to turn */
    var startX = 0, startA = 0, dragging = false;
    el.addEventListener('pointerdown', function (e) {
      dragging = true; startX = e.clientX; startA = self.angle; self.hold = Infinity;
      if (el.setPointerCapture) el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      self.angle = startA - (e.clientX - startX) * 0.009; self.dirty = true;
    });
    var end = function () { if (dragging) { dragging = false; self.hold = 2.5; } };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        self.angle += (e.key === 'ArrowLeft' ? 0.18 : -0.18); self.hold = 4; self.dirty = true; e.preventDefault();
      }
    });
  }

  Viewer.prototype.project = function (x, y, z, ca, sa) {
    var dx = x - this.cx, dy = y - this.cy;
    var xr = dx * ca - dy * sa, yr = dx * sa + dy * ca;
    return (Math.round(xr * 100) / 100) + ',' + (Math.round((-z * CE - yr * SE) * 100) / 100);
  };

  Viewer.prototype.draw = function () {
    var a = this.angle, ca = Math.cos(a), sa = Math.sin(a), self = this;
    /* direction from the model towards the eye, in model coordinates */
    var v = [-CE * sa, -CE * ca, SE];
    var bs = this.boxes, n = bs.length, i, j, k;

    /* order the boxes back to front: a box goes first when a flat plane separates it from the other on the far side */
    var after = [], deg = [];
    for (i = 0; i < n; i++) { after.push([]); deg.push(0); }
    for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) {
      var r = 0;
      for (k = 0; k < 3 && !r; k++) {
        if (bs[i].max[k] <= bs[j].min[k] + 1e-6) r = v[k] > 1e-6 ? -1 : (v[k] < -1e-6 ? 1 : 0);
        else if (bs[j].max[k] <= bs[i].min[k] + 1e-6) r = v[k] > 1e-6 ? 1 : (v[k] < -1e-6 ? -1 : 0);
      }
      if (r < 0) { after[i].push(j); deg[j]++; } else if (r > 0) { after[j].push(i); deg[i]++; }
    }
    var order = [], queue = [], used = [];
    for (i = 0; i < n; i++) if (!deg[i]) queue.push(i);
    while (queue.length) {
      i = queue.shift(); order.push(i); used[i] = true;
      after[i].forEach(function (t) { if (--deg[t] === 0) queue.push(t); });
    }
    for (i = 0; i < n; i++) if (!used[i]) order.push(i);

    var P = function (x, y, z) { return self.project(x, y, z, ca, sa); };
    var pw = this.plot[0], pd = this.plot[1];
    this.ground.setAttribute('points', [P(0, 0, 0), P(pw, 0, 0), P(pw, pd, 0), P(0, pd, 0)].join(' '));

    var g = this.g;
    while (g.firstChild) g.removeChild(g.firstChild);
    /* light comes from the left of the screen: faces turned to the right are a little darker */
    var shade = function (nx, ny) { return 0.035 + 0.12 * ((nx * ca - ny * sa) + 1) / 2; };
    order.forEach(function (idx) {
      var b = bs[idx], m = b.min, M = b.max, f = b.faces, glass = b.mat === 'glass';
      var put = function (el, pts, kk) {
        el.setAttribute('points', pts.join(' '));
        el.setAttribute('fill', tone(b.mat, glass ? kk * 2.2 : kk));
        g.appendChild(el);
      };
      if (v[0] < 0) put(f[1], [P(m[0], m[1], m[2]), P(m[0], M[1], m[2]), P(m[0], M[1], M[2]), P(m[0], m[1], M[2])], shade(-1, 0));
      else put(f[2], [P(M[0], m[1], m[2]), P(M[0], M[1], m[2]), P(M[0], M[1], M[2]), P(M[0], m[1], M[2])], shade(1, 0));
      if (v[1] < 0) put(f[3], [P(m[0], m[1], m[2]), P(M[0], m[1], m[2]), P(M[0], m[1], M[2]), P(m[0], m[1], M[2])], shade(0, -1));
      else put(f[4], [P(m[0], M[1], m[2]), P(M[0], M[1], m[2]), P(M[0], M[1], M[2]), P(m[0], M[1], M[2])], shade(0, 1));
      put(f[0], [P(m[0], m[1], M[2]), P(M[0], m[1], M[2]), P(M[0], M[1], M[2]), P(m[0], M[1], M[2])], 0);
    });
    this.dirty = false;
  };

  var viewers = [];
  [].forEach.call(doc.querySelectorAll('.viewer[data-model]'), function (el) {
    var vw = new Viewer(el);
    if (vw && vw.el) { viewers.push(vw); vw.draw(); }
  });
  if (viewers.length) {
    if ('IntersectionObserver' in window) {
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          viewers.forEach(function (vw) { if (vw.el === en.target) vw.visible = en.isIntersecting; });
        });
      }, { rootMargin: '80px' });
      viewers.forEach(function (vw) { vio.observe(vw.el); });
    }
    var last = 0;
    var tick = function (t) {
      var dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
      viewers.forEach(function (vw) {
        if (!vw.visible) return;
        if (vw.hold > 0) { if (vw.hold !== Infinity) vw.hold -= dt; }
        else if (!reduce) { vw.angle -= dt * 0.16; vw.dirty = true; }
        if (vw.dirty) vw.draw();
      });
      window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);
  }
})();

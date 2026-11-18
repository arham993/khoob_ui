/* khoob — site behaviour: motion system, cart, search, shop, product gallery */
(() => {
  "use strict";
  const D = window.KHOOB || { P: [] };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const money = n => "₹" + n.toLocaleString("en-IN");
  const off = p => Math.round((1 - p.p / p.o) * 100);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;
  const prod = id => D.P.find(p => p.id === +id);
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ------------------------------------------------------------------ *
   * Page transition (5-column curtain)
   * ------------------------------------------------------------------ */
  const fromCurtain = root.classList.contains("cv-cover");
  function enterPage() {
    if (fromCurtain) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        root.classList.add("cv-reveal");
        root.classList.remove("cv-cover");
        setTimeout(() => { root.classList.remove("cv-reveal"); }, 1200);
        setTimeout(ready, 450);
      }));
    } else ready();
  }
  document.addEventListener("click", e => {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== "_self" || a.hasAttribute("download")) return;
    if (a.protocol !== location.protocol || a.host !== location.host) return;
    if (a.pathname === location.pathname && (a.hash || a.search === location.search)) return;
    if (reduce) return;
    e.preventDefault();
    closeAll();
    try { sessionStorage.setItem("kh_nav", "1"); } catch (err) {}
    root.classList.add("cv-leave");
    setTimeout(() => { location.href = a.href; }, 780);
  });
  addEventListener("pageshow", e => { if (e.persisted) { root.classList.remove("cv-leave", "cv-cover"); } });

  /* ------------------------------------------------------------------ *
   * Text splitting + reveal observer
   * ------------------------------------------------------------------ */
  function split(el) {
    let i = 0;
    const walk = node => {
      Array.from(node.childNodes).forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(t => {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.append(" "); return; }
            const w = document.createElement("span"); w.className = "w";
            const s = document.createElement("span"); s.style.setProperty("--i", i++); s.textContent = t;
            w.append(s); frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
      });
    };
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    walk(el);
  }
  $$("[data-split]").forEach(split);

  const countUp = el => {
    const to = parseFloat(el.dataset.count), suf = el.dataset.suffix || "", dur = 1600, t0 = performance.now();
    const f = t => { const k = clamp((t - t0) / dur, 0, 1); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 4))) + suf; if (k < 1) requestAnimationFrame(f); };
    reduce ? (el.textContent = to + suf) : requestAnimationFrame(f);
  };
  function observe() {
    const io = new IntersectionObserver(es => es.forEach(x => {
      if (!x.isIntersecting) return;
      x.target.classList.add("in");
      $$("[data-count]", x.target).forEach(countUp);
      if (x.target.matches("[data-count]")) countUp(x.target);
      io.unobserve(x.target);
    }), { threshold: .14, rootMargin: "0px 0px -6% 0px" });
    $$("[data-r],[data-split],.ri,.wm,.stat,[data-count]").forEach(el => io.observe(el));
  }

  /* ------------------------------------------------------------------ *
   * Toast, drawer, menus, search
   * ------------------------------------------------------------------ */
  const toastEl = $(".toast"); let toastT;
  function toast(msg, link) {
    if (!toastEl) return;
    toastEl.innerHTML = "<span></span>" + (link ? `<a href="${link[1]}">${link[0]}</a>` : "");
    toastEl.firstChild.textContent = msg;
    toastEl.classList.add("on"); clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove("on"), 3200);
  }
  const drawer = $(".drawer"), scrim = $(".scrim"), mnav = $(".mnav"), srch = $(".srch");
  function openDrawer() { if (!drawer) return; closeAll(true); drawer.classList.add("on"); scrim.classList.add("on"); drawer.setAttribute("aria-hidden", "false"); renderCart(); }
  function closeAll(keepScrim) {
    drawer && drawer.classList.remove("on"); drawer && drawer.setAttribute("aria-hidden", "true");
    mnav && mnav.classList.remove("on"); srch && srch.classList.remove("on");
    if (!keepScrim) scrim && scrim.classList.remove("on");
    $$("[data-menu]").forEach(b => b.setAttribute("aria-expanded", "false"));
  }
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-cart],[data-close],[data-menu],[data-search]");
    if (t) {
      if (t.matches("[data-cart]")) { e.preventDefault(); openDrawer(); }
      else if (t.matches("[data-menu]")) { const on = !mnav.classList.contains("on"); closeAll(); mnav.classList.toggle("on", on); t.setAttribute("aria-expanded", on); }
      else if (t.matches("[data-search]")) { closeAll(); srch.classList.add("on"); setTimeout(() => $("input", srch).focus(), 250); renderSearch(""); }
      else closeAll();
    } else if (e.target === srch) closeAll();
  });
  addEventListener("keydown", e => {
    if (e.key === "Escape") closeAll();
    if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName) && srch) { e.preventDefault(); $("[data-search]").click(); }
  });
  function renderSearch(q) {
    const box = $(".sres"); if (!box) return;
    q = q.trim().toLowerCase();
    const list = D.P.filter(p => !q || (p.n + " " + p.c + " " + p.d).toLowerCase().includes(q));
    box.innerHTML = list.length ? list.map((p, i) => `<a href="${p.url}" style="--i:${i}"><img src="${D.img}${p.im[0]}.jpg" alt=""><span><b style="color:var(--ink);font-weight:500">${p.n}</b><small>${p.c} · ${p.cap}</small></span><b>${money(p.p)}</b></a>`).join("") : `<div class="sempty">Nothing matches “${q.replace(/[<>&]/g, "")}”. Try “sunscreen” or “kajal”.</div>`;
  }
  const sin = $(".sp input"); sin && sin.addEventListener("input", () => renderSearch(sin.value));
  $(".sp form") && $(".sp form").addEventListener("submit", e => { e.preventDefault(); const f = $(".sres a"); if (f) f.click(); });

  /* ------------------------------------------------------------------ *
   * Cart
   * ------------------------------------------------------------------ */
  let cart = store.get("kh_cart", []).filter(l => prod(l.id));
  const totals = () => {
    const items = cart.map(l => ({ ...prod(l.id), q: l.q }));
    const n = items.reduce((a, b) => a + b.q, 0), sub = items.reduce((a, b) => a + b.p * b.q, 0), disc = n >= 3 ? Math.round(sub * .2) : 0;
    return { items, n, sub, disc, tot: sub - disc };
  };
  const bundleMsg = n => n >= 3 ? "20% bundle discount unlocked." : `Add ${3 - n} more item${3 - n > 1 ? "s" : ""} to save 20%.`;
  function lineHTML(i, idx) {
    return `<div class="line" style="--i:${idx}"><a href="${i.url}"><img src="${D.img}${i.im[0]}.jpg" alt="${i.n}"></a><div><a class="t" href="${i.url}">${i.n}</a><div class="qty"><button data-q="${i.id}" data-d="-1" aria-label="Decrease">−</button><output>${i.q}</output><button data-q="${i.id}" data-d="1" aria-label="Increase">+</button></div></div><div class="p">${money(i.p * i.q)}<button class="rm" data-rm="${i.id}">Remove</button></div></div>`;
  }
  function sumHTML(t) {
    return `<div><span>Subtotal</span><span>${money(t.sub)}</span></div>${t.disc ? `<div class="disc"><span>Bundle discount (20%)</span><span>−${money(t.disc)}</span></div>` : ""}<div class="tot"><span>Total</span><span>${money(t.tot)}</span></div>`;
  }
  let lastN = null;
  function renderCart() {
    store.set("kh_cart", cart);
    const t = totals();
    $$(".cnt").forEach(c => { c.textContent = t.n; if (lastN !== null && lastN !== t.n) { c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump"); } });
    lastN = t.n;
    const lines = $(".drawer .lines");
    if (lines) {
      lines.innerHTML = t.items.length ? t.items.map(lineHTML).join("") : `<div class="empty"><div class="big">Your bag is empty</div><p>Add a little sunshine to it.</p><a class="btn sm" href="${D.root}shop.html">Shop now <i>→</i></a></div>`;
      $(".drawer .free b").style.width = Math.min(100, t.n / 3 * 100) + "%";
      $(".drawer .free-t").textContent = bundleMsg(t.n);
      $(".drawer .sum").innerHTML = sumHTML(t) + `<a class="btn navy block" href="${D.root}cart.html" style="${t.n ? "" : "pointer-events:none;opacity:.45"}">Checkout <i>→</i></a>`;
    }
    const cp = $("[data-cartpage]");
    if (cp && !cp.dataset.done) {
      $("#cartlines").innerHTML = t.items.length ? t.items.map(lineHTML).join("") : "";
      $$("#cartlines .line").forEach(l => { l.style.opacity = 1; });
      $("#cartsum").innerHTML = sumHTML(t);
      $("#cartfree").style.width = Math.min(100, t.n / 3 * 100) + "%"; $("#cartfreet").textContent = bundleMsg(t.n);
      $("#cartfull").hidden = !t.items.length; $("#cartempty").hidden = !!t.items.length;
    }
    const h = $("[data-hint]");
    if (h) { $("b.hm", h).textContent = bundleMsg(t.n); $(".free b", h).style.width = Math.min(100, t.n / 3 * 100) + "%"; }
  }
  function add(id, q = 1, src, silent) {
    const l = cart.find(x => x.id === +id);
    l ? l.q += q : cart.push({ id: +id, q });
    $(".hd") && $(".hd").classList.remove("hide");
    if (src && !reduce) fly(src);
    renderCart();
    if (!silent) toast(prod(id).n + " added to your bag", ["View bag", "#"]);
    const a = toastEl && $("a", toastEl); if (a) a.addEventListener("click", e => { e.preventDefault(); openDrawer(); });
  }
  function fly(src) {
    const target = $(".hd [data-cart]"); if (!target || !src) return;
    const a = src.getBoundingClientRect(), b = target.getBoundingClientRect();
    const f = document.createElement("img"); f.className = "fly"; f.src = src.currentSrc || src.src; f.alt = "";
    Object.assign(f.style, { left: a.left + a.width / 2 - 36 + "px", top: a.top + a.height / 2 - 36 + "px", width: "72px", height: "72px" });
    document.body.append(f);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    f.animate([
      { transform: "translate(0,0) scale(.6)", opacity: .2 },
      { transform: "translate(0,0) scale(1)", opacity: 1, offset: .15 },
      { transform: `translate(${dx * .35}px,${dy * .35 - 90}px) scale(.9)`, opacity: 1, offset: .55 },
      { transform: `translate(${dx}px,${dy}px) scale(.18)`, opacity: .4 }
    ], { duration: 950, easing: "cubic-bezier(.55,0,.25,1)" }).onfinish = () => f.remove();
  }
  document.addEventListener("click", e => {
    const q = e.target.closest("[data-q]"), rm = e.target.closest("[data-rm]"), ad = e.target.closest("[data-add]");
    if (q) { const l = cart.find(x => x.id === +q.dataset.q); l.q += +q.dataset.d; if (l.q < 1) cart = cart.filter(x => x !== l); renderCart(); }
    else if (rm) { cart = cart.filter(x => x.id !== +rm.dataset.rm); renderCart(); }
    else if (ad && !ad.hasAttribute("data-pdp")) {
      e.preventDefault(); const card = ad.closest(".card");
      add(ad.dataset.add, 1, card && $(".im img", card));
    }
  });

  /* ------------------------------------------------------------------ *
   * Magnetic buttons + custom cursor
   * ------------------------------------------------------------------ */
  if (fine && !reduce) {
    $$(".mag").forEach(el => {
      el.addEventListener("pointermove", e => {
        const r = el.getBoundingClientRect();
        el.style.transition = "translate .15s"; el.style.translate = `${(e.clientX - r.left - r.width / 2) * .22}px ${(e.clientY - r.top - r.height / 2) * .32}px`;
      });
      el.addEventListener("pointerleave", () => { el.style.transition = "translate .8s cubic-bezier(.22,1,.36,1)"; el.style.translate = "0 0"; });
    });
    const cur = $(".cur"); let cx = -100, cy = -100, tx = -100, ty = -100;
    addEventListener("pointermove", e => { tx = e.clientX; ty = e.clientY; if (cx === -100) { cx = tx; cy = ty; } }, { passive: true });
    document.addEventListener("pointerover", e => {
      if (!cur) return;
      const c = e.target.closest("[data-cursor]");
      cur.classList.toggle("big", !!c); cur.textContent = c ? c.dataset.cursor : "";
      cur.classList.toggle("link", !c && !!e.target.closest("a,button,input,textarea,select,label,summary"));
    });
    document.addEventListener("pointerleave", () => cur && cur.classList.add("off"));
    document.addEventListener("pointerenter", () => cur && cur.classList.remove("off"));
    window.__cur = () => { cx = lerp(cx, tx, .22); cy = lerp(cy, ty, .22); if (cur) cur.style.transform = `translate(${cx}px,${cy}px)`; };
  }

  /* ------------------------------------------------------------------ *
   * Shared animation loop: progress, header, parallax, marquee, hero tilt
   * ------------------------------------------------------------------ */
  const hd = $(".hd"), prog = $(".progress");
  const mqs = $$(".mq").map(el => ({ el, tr: $(".mq-track", el), x: 0, dir: -1 }));
  if (mqs.length && !reduce) root.classList.add("mqjs");
  const par = $$("[data-speed]");
  const depthEls = $$("[data-depth]"); let mx = 0, my = 0, smx = 0, smy = 0;
  addEventListener("pointermove", e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
  let lastY = scrollY, vel = 0, ticking = false;
  const ritual = $(".ritual");
  function loop() {
    const y = scrollY, dy = y - lastY; lastY = y;
    vel = lerp(vel, dy, .12);
    if (prog) prog.style.transform = `scaleX(${clamp(y / Math.max(1, document.documentElement.scrollHeight - innerHeight), 0, 1)})`;
    if (hd && !(drawer && drawer.classList.contains("on")) && !(mnav && mnav.classList.contains("on"))) {
      if (y > 260 && dy > 4) hd.classList.add("hide"); else if (dy < -4 || y < 120) hd.classList.remove("hide");
    }
    if (!reduce) {
      par.forEach(el => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) return;
        el.style.translate = `0 ${((r.top + r.height / 2) - innerHeight / 2) * parseFloat(el.dataset.speed)}px`;
      });
      mqs.forEach(m => {
        const w = m.tr.scrollWidth / 2; if (!w) return;
        if (Math.abs(vel) > .5) m.dir = vel > 0 ? -1 : 1;
        m.x += m.dir * (.7 + Math.min(Math.abs(vel), 40) * .45) * (m.el.dataset.rev ? -1 : 1);
        if (m.x <= -w) m.x += w; if (m.x > 0) m.x -= w;
        m.tr.style.transform = `translateX(${m.x}px) skewX(${clamp(-vel * .25, -8, 8)}deg)`;
      });
      smx = lerp(smx, mx, .06); smy = lerp(smy, my, .06);
      depthEls.forEach(el => { const d = parseFloat(el.dataset.depth); el.style.translate = `${smx * d}px ${smy * d}px`; });
      window.__cur && window.__cur();
    }
    if (ritual) ritualTick();
    requestAnimationFrame(loop);
  }

  /* ------------------------------------------------------------------ *
   * Hero slider (clip-path wipe)
   * ------------------------------------------------------------------ */
  const hero = $("[data-hero]");
  if (hero) {
    const sls = $$(".sl", hero), dots = $$(".hero-ctl button"); let hi = 0, ht;
    const dur = 6000;
    const show = i => {
      if (i === hi && sls[i].classList.contains("on")) return;
      sls.forEach(s => s.classList.remove("prev"));
      sls[hi].classList.remove("on"); sls[hi].classList.add("prev");
      sls[i].classList.add("on");
      dots.forEach((d, k) => { d.classList.remove("on", "done"); if (k < i) d.classList.add("done"); });
      void dots[i].offsetWidth; dots[i].classList.add("on");
      hi = i; clearTimeout(ht);
      if (!reduce) ht = setTimeout(() => show((hi + 1) % sls.length), dur);
    };
    dots.forEach((d, k) => d.addEventListener("click", () => show(k)));
    hero.style.setProperty("--dur", dur + "ms");
    sls[0].classList.add("on"); dots[0].classList.add("on");
    if (!reduce) ht = setTimeout(() => show(1), dur);
    document.addEventListener("visibilitychange", () => { if (document.hidden) clearTimeout(ht); else show(hi === sls.length - 1 ? 0 : hi + 1); });
  }

  /* ------------------------------------------------------------------ *
   * Ritual: sticky scroll story
   * ------------------------------------------------------------------ */
  let rIdx = -1;
  function ritualTick() {
    const r = ritual.getBoundingClientRect(), total = r.height - innerHeight;
    const p = clamp(-r.top / total, 0, .9999);
    const bar = $(".rbar b", ritual); if (bar) bar.style.transform = `scaleX(${clamp(-r.top / total, 0, 1)})`;
    const steps = $$(".rstep", ritual), sls = $$(".rarch .sl", ritual);
    const i = Math.min(steps.length - 1, Math.floor(p * steps.length));
    if (i === rIdx) return;
    sls.forEach(s => s.classList.remove("prev"));
    if (rIdx > -1) { sls[rIdx].classList.remove("on"); sls[rIdx].classList.add("prev"); }
    sls[i].classList.add("on");
    steps.forEach((s, k) => s.classList.toggle("on", k === i));
    $$(".rnum b", ritual).forEach(b => b.style.transform = `translateY(${-i * 100}%)`);
    rIdx = i;
  }

  /* ------------------------------------------------------------------ *
   * Shop page: filter + sort
   * ------------------------------------------------------------------ */
  const shop = $("[data-shop]");
  if (shop) {
    const cards = $$(".card", shop), chips = $$(".chip"), sel = $("#sort"), empty = $(".shop-empty"), count = $("#count");
    const params = new URLSearchParams(location.search);
    let cat = params.get("cat") || "All", q = (params.get("q") || "").toLowerCase();
    if (!chips.some(c => c.dataset.cat === cat)) cat = "All";
    const apply = animate => {
      const key = sel.value;
      const sorted = [...cards].sort((a, b) => key === "low" ? a.dataset.price - b.dataset.price : key === "high" ? b.dataset.price - a.dataset.price : key === "off" ? b.dataset.off - a.dataset.off : a.dataset.id - b.dataset.id);
      let n = 0;
      sorted.forEach(c => {
        shop.append(c);
        const ok = (cat === "All" || c.dataset.cat === cat) && (!q || c.dataset.name.includes(q));
        c.classList.toggle("gone", !ok);
        c.classList.remove("pop");
        if (ok) { if (animate) { void c.offsetWidth; c.style.setProperty("--i", n); c.classList.add("pop"); } n++; }
      });
      chips.forEach(c => c.classList.toggle("on", c.dataset.cat === cat));
      empty.classList.toggle("on", !n);
      count.textContent = n + (n === 1 ? " product" : " products");
      const t = $("#shoptitle"); if (t) t.dataset.cat = cat;
    };
    chips.forEach(c => c.addEventListener("click", () => { cat = c.dataset.cat; q = ""; const u = new URL(location); cat === "All" ? u.searchParams.delete("cat") : u.searchParams.set("cat", cat); u.searchParams.delete("q"); history.replaceState(null, "", u); apply(true); }));
    sel.addEventListener("change", () => apply(true));
    $("[data-clear]", empty).addEventListener("click", () => { cat = "All"; q = ""; apply(true); });
    apply(false);
  }

  /* ------------------------------------------------------------------ *
   * Product page
   * ------------------------------------------------------------------ */
  const gal = $("[data-gal]");
  if (gal) {
    const items = $$(".gi", gal), ths = $$(".th", gal), stage = $(".stage", gal), cnt = $(".gcount", gal);
    let cur = 0;
    const go = (n, dir) => {
      n = (n + items.length) % items.length; if (n === cur) return;
      dir = dir || (n > cur ? 1 : -1);
      items.forEach(i => i.classList.remove("prev"));
      items[cur].classList.remove("on"); items[cur].classList.add("prev");
      items[n].style.setProperty("--cp", dir > 0 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)");
      void items[n].offsetWidth; items[n].classList.add("on");
      ths.forEach((t, k) => { t.classList.toggle("on", k === n); t.setAttribute("aria-current", k === n); });
      cur = n; cnt.textContent = String(n + 1).padStart(2, "0") + " / " + String(items.length).padStart(2, "0");
    };
    items[0].classList.add("on");
    ths.forEach((t, k) => t.addEventListener("click", () => go(k)));
    $("[data-prev]", gal).addEventListener("click", () => go(cur - 1, -1));
    $("[data-next]", gal).addEventListener("click", () => go(cur + 1, 1));
    gal.addEventListener("keydown", e => { if (e.key === "ArrowRight") go(cur + 1, 1); if (e.key === "ArrowLeft") go(cur - 1, -1); });
    let sx = null;
    stage.addEventListener("pointerdown", e => { sx = e.clientX; });
    stage.addEventListener("pointerup", e => { if (sx !== null && e.pointerType !== "mouse" && Math.abs(e.clientX - sx) > 40) go(cur + (e.clientX < sx ? 1 : -1), e.clientX < sx ? 1 : -1); sx = null; });
    if (fine) {
      stage.addEventListener("pointerenter", () => stage.classList.add("zoom"));
      stage.addEventListener("pointerleave", () => stage.classList.remove("zoom"));
      stage.addEventListener("pointermove", e => { const r = stage.getBoundingClientRect(); stage.style.setProperty("--zx", (e.clientX - r.left) / r.width * 100 + "%"); stage.style.setProperty("--zy", (e.clientY - r.top) / r.height * 100 + "%"); });
    }
  }
  const buy = $("[data-buy]");
  if (buy) {
    const id = +buy.dataset.buy, out = $("output", buy); let q = 1;
    $$("[data-step]", buy).forEach(b => b.addEventListener("click", () => { q = clamp(q + +b.dataset.step, 1, 10); out.textContent = q; }));
    $("[data-pdp='add']").addEventListener("click", () => add(id, q, $(".gi.on img")));
    $("[data-pdp='now']").addEventListener("click", e => { e.preventDefault(); add(id, q, null, true); sessionStorage.setItem("kh_nav", "1"); root.classList.add("cv-leave"); setTimeout(() => location.href = D.root + "cart.html", 780); });
    const sbar = $(".sbar");
    if (sbar) {
      new IntersectionObserver(([e]) => sbar.classList.toggle("on", !e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 }).observe(buy);
      $("[data-sbar-add]").addEventListener("click", () => add(id, 1, $("img", sbar)));
    }
  }
  $$(".acc-h").forEach(h => h.addEventListener("click", () => {
    const it = h.parentElement, on = !it.classList.contains("open"); it.classList.toggle("open", on); h.setAttribute("aria-expanded", on);
  }));

  /* ------------------------------------------------------------------ *
   * Promise cards: radial wipe from pointer entry point
   * ------------------------------------------------------------------ */
  $$(".pc").forEach(c => c.addEventListener("pointerenter", e => {
    const r = c.getBoundingClientRect(); c.style.setProperty("--mx", (e.clientX - r.left) / r.width * 100 + "%"); c.style.setProperty("--my", (e.clientY - r.top) / r.height * 100 + "%");
  }));

  /* ------------------------------------------------------------------ *
   * Forms
   * ------------------------------------------------------------------ */
  $$("[data-mailto]").forEach(f => f.addEventListener("submit", e => {
    e.preventDefault(); const fd = new FormData(f);
    location.href = `mailto:${f.dataset.mailto}?subject=${encodeURIComponent("Message from " + fd.get("n"))}&body=${encodeURIComponent(fd.get("m") + "\n\n" + fd.get("n") + " (" + fd.get("e") + ")")}`;
    toast("Opening your email app…");
  }));
  $$("[data-toast-form]").forEach(f => f.addEventListener("submit", e => { e.preventDefault(); toast(f.dataset.toastForm); f.reset(); }));
  const co = $("#checkout");
  if (co) co.addEventListener("submit", e => {
    e.preventDefault();
    const fd = new FormData(co), id = "KH" + Date.now().toString().slice(-6), name = String(fd.get("n")).split(" ")[0];
    const cp = $("[data-cartpage]"); cp.dataset.done = 1;
    cp.innerHTML = `<div class="done"><div class="ok"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><h2 class="h-lg">Thank you, <em></em></h2><p class="lead" style="margin:0"></p><a class="btn navy" href="${D.root}shop.html">Keep shopping <i>→</i></a></div>`;
    $("em", cp).textContent = name; $(".lead", cp).textContent = `Order ${id} is noted. A confirmation will go to ${fd.get("e")}.`;
    cart = []; renderCart(); scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */
  function ready() {
    document.body.classList.add("ready");
    observe();
  }
  renderCart();
  requestAnimationFrame(loop);
  if (document.readyState === "complete") enterPage(); else addEventListener("load", enterPage);
  setTimeout(() => { if (!document.body.classList.contains("ready")) enterPage(); }, 2500);
})();

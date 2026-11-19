// Generates the static multi-page site. Run: node tools/build.js
const fs = require("fs"), path = require("path");
const { defs: DEFS } = require("./mughal.js");
const OUT = path.join(__dirname, "..");
const IMG = "assets/img/";

/* ------------------------------ data ------------------------------ */
const P = [
  { id: 1, slug: "ultra-light-sunscreen-spf-50", n: "Ultra Light Sunscreen SPF 50+", c: "Sun care", p: 399, o: 449, cap: "50 g",
    im: ["s1", "s2", "s3", "sw"], d: "A water based, broad spectrum SPF 50+ sunscreen made for everyday protection and comfort.",
    b: ["Broad spectrum (PA++++)", "Skin brightening, water based", "Quick absorption, no white cast", "For all skin types"],
    hl: [["50", "+", "SPF protection", 1], ["PA++++", "", "Broad spectrum", 0], ["0", "", "White cast", 1], ["50 g", "", "In every tube", 0]],
    story: ["Everyday protection that <em>feels like nothing</em>", "Water based and quick absorbing, it sits comfortably under the rest of your morning routine. Broad spectrum SPF 50+ with no white cast, made for all skin types."] },
  { id: 2, slug: "deep-black-kajal", n: "Deep Black Kajal", c: "Eyes", p: 200, o: 225, cap: "3.5 g",
    im: ["kp1", "k1", "k2", "k3", "kp2"], d: "Deep black long-lasting kajal designed for smooth, comfortable everyday wear.",
    b: ["8 hours long lasting", "Water-proof and smudge-proof", "Vegan", "Smooth, comfortable wear"],
    hl: [["8", " hrs", "Long lasting wear", 1], ["Water-proof", "", "And smudge-proof", 0], ["Vegan", "", "Formula", 0], ["3.5 g", "", "In every kajal", 0]],
    story: ["Deep black, <em>8 hours</em> strong", "A deep black kajal designed for smooth, comfortable everyday wear. Water-proof, smudge-proof and vegan, so it keeps up with your whole day."] },
  { id: 3, slug: "the-everyday-duo", n: "The Everyday Duo", c: "Duos", p: 539, o: 674, cap: "Sunscreen + Kajal",
    im: ["duo1", "s2", "kp2"], d: "Your daily sun protection and your deep black kajal, together for less.",
    b: ["Ultra Light Sunscreen SPF 50+", "Deep Black Kajal", "Save more than buying separately"],
    hl: [["50", "+", "SPF in the sunscreen", 1], ["8", " hrs", "Kajal wear time", 1], ["2", "", "Essentials in one set", 1], ["Save ₹135", "", "Versus buying separately", 0]],
    story: ["Your daily ritual, <em>in a duo</em>", "Protection for your skin and definition for your eyes, paired together for less. Two everyday essentials, one simple routine."] },
  { id: 4, slug: "sunscreen-duo", n: "Sunscreen Duo", c: "Duos", p: 719, o: 898, cap: "2 × 50 g",
    im: ["duo2", "s1", "s3"], d: "Two tubes of Ultra Light Sunscreen SPF 50+, so you are never out of protection.",
    b: ["2 × Ultra Light Sunscreen", "Broad spectrum (PA++++)", "No white cast"],
    hl: [["2", "", "Tubes of sunscreen", 1], ["50", "+", "SPF in every tube", 1], ["PA++++", "", "Broad spectrum", 0], ["Save ₹179", "", "Versus buying separately", 0]],
    story: ["Never run out of <em>protection</em>", "Two tubes of Ultra Light Sunscreen SPF 50+, one for home and one for your bag. Water based, quick absorbing and no white cast."] },
];
P.forEach(p => { p.url = `product-${p.slug}.html`; });
const off = p => Math.round((1 - p.p / p.o) * 100);
const money = n => "₹" + n.toLocaleString("en-IN");
const CATS = ["All", "Sun care", "Eyes", "Duos"];
const Q = [
  ["100% Transparent Formulas", "Clearly listed ingredients make each formula feel honest, safe, and true to you.", "eye"],
  ["Conscious Beauty Promise", "Beauty that feels aligned with who you are and what you value.", "heart"],
  ["Daily Ritual Care", "Simple steps that make conscious beauty feel natural every morning.", "sun"],
  ["Only Verified Ingredients", "Every ingredient is checked and clearly listed before it goes into a formula.", "check"],
  ["Cruelty Free Care", "Made with kindness and care, without animal testing or compromise.", "leaf"],
  ["Belief-Aligned Beauty", "Formulas crafted with respect for the values you live by every day.", "moon"],
];
const POSTS = [
  ["Clean Formulation", "Alcohol in Skincare: Which Types Matter (and Which Don’t)", "03 Nov 2026", "s3", "alcohol-in-skincare-which-types-matter-and-which-dont"],
  ["Ingredients", "Animal-Derived Ingredients Hiding in Your Beauty Products", "19 Oct 2026", "k1", "animal-derived-ingredients-hiding-in-your-beauty-products"],
  ["SPF Guide", "How to Choose a Sunscreen That Doesn’t Leave a White Cast", "16 Aug 2026", "sw", "how-to-choose-a-sunscreen-that-doesnt-leave-a-white-cast"],
];

/* ------------------------------ icons ------------------------------ */
const ic = {
  bag: '<svg viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6zM9 8a3 3 0 0 1 6 0"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
  menu: '<svg viewBox="0 0 24 24"><path d="M4 8h16M4 16h16"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19"/></svg>',
  arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  prev: '<svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.2 4.5 4.5 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/></svg>',
  sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>',
  leaf: '<svg viewBox="0 0 24 24"><path d="M5 19c0-9 5-14 15-14 0 10-5 15-14 15"/><path d="M5 19c3-4 6-6.5 10-8"/></svg>',
  moon: '<svg viewBox="0 0 24 24"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>',
  pin: '<svg viewBox="0 0 24 24"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  mail: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M4 7.5l8 6 8-6"/></svg>',
  ig: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.6"/><circle cx="17" cy="7" r=".6"/></svg>',
  fb: '<svg viewBox="0 0 24 24"><path d="M14 8.5h2.5V5H14c-2.2 0-3.5 1.4-3.5 3.6V11H8v3.5h2.5V20H14v-5.5h2.3l.5-3.5H14V9.2c0-.5.2-.7.7-.7z"/></svg>',
  in: '<svg viewBox="0 0 24 24"><path d="M6.5 9.5v8M6.5 6v.1M11 17.5v-8M11 12.5c0-2 1.3-3 3-3s3 1 3 3v5"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path d="M12 3l7 3v5.5c0 4.5-3 8-7 9.5-4-1.5-7-5-7-9.5V6z"/><path d="M9 12l2.2 2.2L15.5 10"/></svg>',
};
const link = (href, t, cls = "", extra = "") => `<a class="btn ${cls}" href="${href}" ${extra}>${t} <i>→</i></a>`;

/* ------------------------------ components ------------------------------ */
const NAV = [["shop", "shop.html", "Shop"], ["suncare", "shop.html?cat=Sun%20care", "Sun care"], ["eyes", "shop.html?cat=Eyes", "Eyes"], ["promise", "our-promise.html", "Our promise"], ["journal", "journal.html", "Journal"]];
const MOB = [["Home", "index.html"], ["Shop", "shop.html"], ["Sun care", "shop.html?cat=Sun%20care"], ["Eyes", "shop.html?cat=Eyes"], ["Duos", "shop.html?cat=Duos"], ["Our promise", "our-promise.html"], ["Journal", "journal.html"], ["Contact", "contact.html"]];

const head = (title, desc, extra = "") => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${title}</title><meta name="description" content="${desc}">
<meta property="og:title" content="${title}"><meta property="og:description" content="${desc}"><meta property="og:type" content="website">
<meta name="theme-color" content="#414042">
<link rel="icon" type="image/png" href="assets/img/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Parkinsans:wght@400;500;600;700&family=Poppins:wght@400;500;600&display=swap">
<link rel="stylesheet" href="assets/css/site.css"><link rel="stylesheet" href="assets/css/mughal-assets.css"><link rel="stylesheet" href="assets/css/mughal.css">
<script>(function(){var d=document.documentElement;d.classList.add("js");try{if(sessionStorage.getItem("kh_nav")){d.classList.add("cv-cover");sessionStorage.removeItem("kh_nav")}}catch(e){}setTimeout(function(){d.classList.remove("cv-cover")},4000)})()</script>
<noscript><style>.js [data-r]{opacity:1!important;transform:none!important}.w>span{transform:none!important}.ri img{clip-path:none!important;transform:none!important}.wm span{transform:none!important}</style></noscript>
${extra}</head>`;

const header = active => `<a class="sr" href="#main">Skip to content</a>
<div class="cv" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><b><img src="assets/img/logo-white.png" alt=""></b></div>
<div class="progress" aria-hidden="true"></div><div class="cur" aria-hidden="true"></div>
<header class="hd"><nav aria-label="Main"><ul>${NAV.map(([k, h, t]) => `<li><a href="${h}"${k === active ? ' class="on" aria-current="page"' : ""}>${t}</a></li>`).join("")}</ul>
<button class="ib burger" data-menu aria-label="Menu" aria-expanded="false">${ic.menu}</button></nav>
<a class="logo" href="index.html" aria-label="khoob home"><img src="assets/img/logo-white.png" alt="khoob" width="208" height="140"></a>
<div class="rt"><button class="ib" data-search aria-label="Search products">${ic.search}</button><button class="ib" data-cart aria-label="Open bag">${ic.bag}<span class="cnt">0</span></button></div></header>
<div class="mnav" aria-label="Menu"><div>${MOB.map(([t, h], i) => `<a class="big" href="${h}"><span style="--i:${i}">${t}</span></a>`).join("")}</div>
<div class="mf"><small>Halal beauty & personal care,<br>made in India.</small><small><a href="mailto:contactus@boujieconsumer.com">contactus@boujieconsumer.com</a></small></div></div>
<div class="srch" role="dialog" aria-label="Search"><div class="sp"><form>${ic.search}<input type="search" placeholder="Search sunscreen, kajal, duos…" aria-label="Search products" autocomplete="off"><button type="button" class="xb" data-close aria-label="Close search">${ic.x}</button></form><div class="sres"></div><div class="chipsrow"><span class="muted">Browse:</span><a href="shop.html?cat=Sun%20care">Sun care</a><a href="shop.html?cat=Eyes">Eyes</a><a href="shop.html?cat=Duos">Duos</a></div></div></div>`;

const footer = `<div class="arcade" aria-hidden="true"></div><footer class="ft"><div class="rugband dk" aria-hidden="true"></div><div class="wrap">
<div class="ft-top"><h2 class="h-lg" data-split>Join the <em>khoob</em> circle</h2>
<div><form class="nl" data-toast-form="Thanks, you’re on the list"><input required type="email" placeholder="Email address" aria-label="Email address"><button class="btn sm">Subscribe <i>→</i></button></form><p class="ft-note">New launches, routines and members-only offers. Unsubscribe anytime.</p></div></div>
<div class="fcols"><div><div class="logo"><img src="assets/img/logo-white.png" alt="khoob" width="208" height="140"></div><p>Thoughtfully made beauty and personal care for everyday routines and conscious choices.</p><p>DLF Phase II, Gurugram, Haryana<br><a href="mailto:contactus@boujieconsumer.com" style="display:inline;background:none">contactus@boujieconsumer.com</a></p></div>
<div><h4>Quick links</h4><a href="index.html">Home</a><a href="shop.html">Shop</a><a href="our-promise.html">The khoob promise</a><a href="journal.html">Journal</a></div>
<div><h4>Customer support</h4><a href="contact.html">Contact</a><a href="https://shopkhoob.com/pages/contact#khoob-grievance" target="_blank" rel="noopener">Grievance redressal</a><a href="https://shopkhoob.com/pages/shipping-policy" target="_blank" rel="noopener">Shipping policy</a><a href="https://shopkhoob.com/pages/returns-refunds" target="_blank" rel="noopener">Returns &amp; refunds</a></div>
<div><h4>Follow</h4><div class="soc"><a href="https://www.instagram.com/itskhoob" target="_blank" rel="noopener" aria-label="Instagram">${ic.ig}</a><a href="https://www.facebook.com/khoobtm" target="_blank" rel="noopener" aria-label="Facebook">${ic.fb}</a><a href="http://linkedin.com/company/khoob%E2%84%A2/" target="_blank" rel="noopener" aria-label="LinkedIn">${ic.in}</a></div></div></div>
</div><div class="wm" aria-hidden="true">${"khoob".split("").map((l, i) => `<span style="--i:${i}">${l}</span>`).join("")}</div>
<div class="wrap legal"><span>© 2026 khoob. All rights reserved.</span><span>True to you. True to your beliefs.</span></div></footer>
<div class="scrim" data-close></div>
<aside class="drawer" aria-label="Bag" aria-hidden="true"><div class="dh"><h3>Your bag</h3><button class="xb" data-close aria-label="Close bag">${ic.x}</button></div><div class="free"><b></b></div><p class="free-t"></p><div class="lines"></div><div class="sum"></div></aside>
<div class="toast" role="status" aria-live="polite"></div>
<script src="assets/js/data.js"></script><script src="assets/js/site.js" defer></script></body></html>`;

const page = (o, body) => head(o.title, o.desc, o.extra || "") + `<body>` + DEFS + header(o.active) + `<main id="main">${body}</main>` + footer;

const card = (p, i = 0) => `<article class="card" data-id="${p.id}" data-cat="${p.c}" data-price="${p.p}" data-off="${off(p)}" data-name="${p.n.toLowerCase()}" data-r style="--d:${(i % 4) * .09}s">
<a class="im" href="${p.url}" data-cursor="View" aria-label="${p.n}"><span class="badge">${off(p)}% off</span><img src="${IMG}${p.im[0]}.jpg" alt="${p.n}" loading="lazy"><img src="${IMG}${p.im[1]}.jpg" alt="" loading="lazy"></a>
<button class="qa" data-add="${p.id}" aria-label="Add ${p.n} to bag"><span>Add to bag</span><i>+</i></button>
<div class="meta"><div><small>${p.c} · ${p.cap}</small><a class="nm" href="${p.url}">${p.n}</a></div><div class="price"><b>${money(p.p)}</b><s>${money(p.o)}</s></div></div></article>`;

const posts = (cls = "") => `<div class="posts ${cls}">${POSTS.map((p, i) => `<a class="post" data-r style="--d:${i * .12}s" href="https://shopkhoob.com/blogs/care/${p[4]}" target="_blank" rel="noopener"><div class="pi ri"><img src="${IMG}${p[3]}.jpg" alt="" loading="lazy"></div><span class="tag">${p[0]}</span><h3><span>${p[1]}</span></h3><small>${p[2]}</small></a>`).join("")}</div>`;

const pgrid = `<div class="pgrid">${Q.map((q, i) => `<div class="pc" data-r style="--d:${(i % 3) * .1}s"><span class="no">0${i + 1}</span><div class="ic">${ic[q[2]]}</div><div><h3>${q[0]}</h3><p>${q[1]}</p></div></div>`).join("")}</div>`;

const mq = (items, cls = "", attr = "") => { const g = items.map(t => `<span${t[1] ? ' class="o"' : ""}>${t[0]}</span>`).join(""); return `<div class="mq ${cls}" ${attr} aria-hidden="true"><div class="mq-track">${g}${g}</div></div>`; };

const pghead = (eyebrow, h1, lead, crumbs) => `<section class="pgh"><div class="blob a" data-speed="-.06" aria-hidden="true"></div><div class="wrap" style="position:relative;z-index:2">${crumbs ? `<div class="crumb">${crumbs}</div>` : ""}<span class="eyebrow" style="margin-top:22px">${eyebrow}</span><h1 class="h-xl" data-split>${h1}</h1><p class="lead" data-r style="--d:.25s">${lead}</p></div></section><div class="rugband" aria-hidden="true"></div>`;

/* ------------------------------ pages ------------------------------ */
const pages = {};

// HOME
const heroSlides = [
  { img: "s1", t: "Sun care", n: P[0].n, u: P[0].url }, { img: "kp1", t: "Eyes", n: P[1].n, u: P[1].url }, { img: "duo1", t: "Duos", n: P[2].n, u: P[2].url }];
pages["index.html"] = page({ title: "khoob | Halal Beauty & Personal Care", desc: "Halal beauty and personal care, made in India. Ultra Light Sunscreen SPF 50+, Deep Black Kajal and everyday duos that are true to you and true to your beliefs.", active: "home" }, `
<section class="hero" aria-label="Welcome">
<div class="blob a" data-speed="-.05" aria-hidden="true"></div><div class="blob b" data-speed=".08" aria-hidden="true"></div><div class="blob c" data-speed="-.1" aria-hidden="true"></div>
<div class="wrap hero-grid"><div>
<span class="eyebrow" data-r>Halal beauty &amp; personal care</span>
<h1 class="h-xl" data-split style="--d:.1s">True to you.<br><em>True to your beliefs.</em></h1>
<p class="lead" data-r style="--d:.5s">Simple routines, honest ingredients, and everyday care that feels right for you.</p>
<div class="hero-cta" data-r style="--d:.65s">${link("shop.html", "Shop now", "navy mag")}${link("our-promise.html", "Our promise", "ghost mag")}</div>
<div class="hero-note" data-r style="--d:.8s"><b>Bundle any 3</b><span>and save 20% on your everyday essentials.</span></div></div>
<div class="hero-art" data-r="scale" style="--d:.25s" data-hero>
<div class="frame"><div class="arch">${heroSlides.map((s, i) => `<div class="sl"><img src="${IMG}${s.img}.jpg" alt="${s.n}" ${i ? "" : 'fetchpriority="high"'}><div class="cap"><div><small>${s.t}</small><b>${s.n}</b></div><a class="go" href="${s.u}" aria-label="View ${s.n}">${ic.arrow}</a></div></div>`).join("")}</div></div>
<div class="hero-ctl">${heroSlides.map((s, i) => `<button aria-label="Show slide ${i + 1}"><b></b></button>`).join("")}</div>
<div class="fl f1" data-depth="26"><div><b>SPF 50+</b>Broad spectrum</div></div>
<div class="fl f2" data-depth="-20"><div><b>8 hrs</b>Long-lasting kajal</div></div>
<div class="seal" data-depth="14" aria-hidden="true"><svg viewBox="0 0 128 128"><circle cx="64" cy="64" r="64"/><path id="sc" d="M64,64 m-45,0 a45,45 0 1,1 90,0 a45,45 0 1,1 -90,0" fill="none"/><text><textPath href="#sc">Halal beauty • Made in India • </textPath></text></svg><div class="core"><span>k</span></div></div>
</div></div><div class="scrollcue" aria-hidden="true"></div></section>
<div class="rugband" aria-hidden="true"></div>${mq([["Bundle any three and save 20%"], ["Halal beauty, made in India"], ["Cruelty free care"], ["No white cast"], ["Vegan kajal"]], "band")}

<section class="sec"><div class="wrap"><div class="shead"><div><span class="eyebrow" data-r>The essentials</span><h2 class="h-lg" data-split>Shop the <em>essentials</em></h2></div>${link("shop.html", "Shop all", "navy sm mag")}</div>
<div class="grid">${P.map(card).join("")}</div></div></section>

<section class="ritual" aria-label="Your everyday ritual"><div class="ritual-in wrap">
<div class="rstage"><div class="frame"><div class="rarch">${["s2", "kp1", "duo1"].map(i => `<div class="sl"><img src="${IMG}${i}.jpg" alt="" loading="lazy"></div>`).join("")}</div></div>
<div class="rnum" aria-hidden="true"><span><b>01</b><b>02</b><b>03</b></span></div></div>
<div class="rtext"><span class="eyebrow hm">Your everyday ritual</span><h2 class="h-lg" data-split>Three steps, <em>zero fuss</em></h2>
<div class="rsteps">
<div class="rstep"><span class="n">01</span><h3>Protect</h3><div class="b"><div><p>Ultra Light Sunscreen SPF 50+. Water based and quick absorbing, with broad spectrum PA++++ protection and no white cast.</p>${link(P[0].url, "Shop sunscreen", "sm")}</div></div></div>
<div class="rstep"><span class="n">02</span><h3>Define</h3><div class="b"><div><p>Deep Black Kajal. Long lasting for 8 hours, water-proof, smudge-proof and vegan, with smooth, comfortable wear.</p>${link(P[1].url, "Shop kajal", "sm")}</div></div></div>
<div class="rstep"><span class="n">03</span><h3>Save</h3><div class="b"><div><p>Pair your favourites in a duo, or bundle any three, and the savings add up automatically.</p>${link("shop.html?cat=Duos", "Shop duos", "sm")}</div></div></div>
</div><div class="rbar" aria-hidden="true"><b></b></div></div></div></section>

<div class="arcade s on-blush" aria-hidden="true"></div><section class="stats sec"><div class="deco-ring" style="width:520px;height:520px;right:-160px;top:-180px" aria-hidden="true"></div><div class="deco-ring" style="width:320px;height:320px;left:-100px;bottom:-120px;animation-direction:reverse" aria-hidden="true"></div>
<div class="wrap" style="position:relative"><span class="eyebrow" data-r style="color:var(--gold)">By the numbers</span><h2 class="h-lg" data-split style="margin-top:16px">Safe for your skin,<br><em>safe for your beliefs</em></h2>
<p class="lead" data-r style="margin-top:18px">Clearly listed ingredients make each formula feel honest, safe, and true to you.</p>
<div class="sgrid"><div class="stat"><b data-count="50" data-suffix="+">0+</b><span>SPF in every tube of Ultra Light Sunscreen.</span></div><div class="stat" style="transition-delay:.1s"><b>PA++++</b><span>Broad spectrum protection on a water based formula.</span></div><div class="stat"><b data-count="8" data-suffix=" hrs">0 hrs</b><span>Long-lasting wear from the Deep Black Kajal.</span></div><div class="stat"><b data-count="0">0</b><span>White cast. Quick absorbing and water based.</span></div></div></div></section>

<section class="sec"><div class="wrap"><div class="shead"><div><span class="eyebrow" data-r>The khoob promise</span><h2 class="h-lg" data-split>Care designed to <em>feel true to you</em></h2></div>${link("our-promise.html", "Read our promise", "navy sm mag")}</div>${pgrid}</div></section>

<section class="wrap"><div class="bnd rug"><div class="pct" data-speed=".05" aria-hidden="true">20%</div>
<div style="position:relative"><span class="eyebrow" style="color:var(--navy)">Get 20% off when you bundle</span><h2 class="h-lg" data-split>Better together, <em>better value</em></h2><p data-r>Bundle your favourites and enjoy extra savings on everyday essentials.</p>${link("shop.html", "Build a bundle", "navy mag")}</div>
<div class="stack" aria-hidden="true"><div class="ri" style="--d:.1s"><img src="${IMG}s3.jpg" alt="" loading="lazy"></div><div class="ri" style="--d:.3s"><img src="${IMG}kp2.jpg" alt="" loading="lazy"></div></div></div></section>

<section class="sec"><div class="wrap"><div class="shead"><div><span class="eyebrow" data-r>The journal</span><h2 class="h-lg" data-split>Knowledge for <em>conscious care</em></h2></div>${link("journal.html", "View more", "navy sm mag")}</div>${posts()}</div></section>
${mq([["True to you"], ["True to your beliefs", 1]], "", 'data-rev="1"')}`);

// SHOP
pages["shop.html"] = page({ title: "Shop all | khoob", desc: "Shop khoob halal beauty: Ultra Light Sunscreen SPF 50+, Deep Black Kajal and money-saving duos.", active: "shop" },
  pghead("The collection", "Shop <em>all</em>", "Simple routines and honest ingredients, made in India.", `<a href="index.html">Home</a><i>/</i><span>Shop</span>`) + `
<section class="wrap" style="padding-bottom:40px"><div class="bar"><div class="chips" role="group" aria-label="Filter by category">${CATS.map(c => `<button class="chip" data-cat="${c}">${c}</button>`).join("")}</div>
<div class="sortw"><span id="count" class="muted">${P.length} products</span><label class="sr" for="sort">Sort</label><select id="sort"><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="off">Biggest saving</option></select></div></div>
<div class="grid" data-shop>${P.map(card).join("")}</div>
<div class="shop-empty"><p class="h-md" style="margin-bottom:18px">Nothing here yet.</p><button class="btn sm" data-clear>Show everything <i>→</i></button></div></section>
<section class="wrap sec" style="padding-top:60px"><div class="bnd rug"><div class="pct" data-speed=".05" aria-hidden="true">20%</div><div style="position:relative"><span class="eyebrow" style="color:var(--navy)">Bundle &amp; save</span><h2 class="h-lg" data-split>Any three, <em>20% off</em></h2><p data-r>Add three or more items to your bag and the discount is applied automatically at checkout.</p></div></div></section>`);

// PRODUCT pages
P.forEach((p, idx) => {
  const others = P.filter(x => x.id !== p.id);
  const hl = p.hl.map(h => `<div data-r style="--d:${.08 * 1}s"><b${h[3] ? ` data-count="${h[0]}" data-suffix="${h[1]}"` : ""}>${h[3] ? "0" + h[1] : h[0] + h[1]}</b><span>${h[2]}</span></div>`).join("");
  const ld = `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "Product", name: p.n, description: p.d, brand: { "@type": "Brand", name: "khoob" }, offers: { "@type": "Offer", priceCurrency: "INR", price: p.p, availability: "https://schema.org/InStock" } })}</script>`;
  pages[p.url] = page({ title: `${p.n} | khoob`, desc: p.d, active: p.c === "Sun care" ? "suncare" : p.c === "Eyes" ? "eyes" : "shop", extra: ld }, `
<section class="wrap"><div class="pp">
<div class="gal" data-gal data-r="scale"><div class="thumbs" role="group" aria-label="Product images">${p.im.map((m, i) => `<button class="th${i ? "" : " on"}" aria-label="Show image ${i + 1}"><img src="${IMG}${m}.jpg" alt=""></button>`).join("")}</div>
<div class="stage" tabindex="0" aria-label="${p.n} gallery. Use arrow keys to change image."><span class="badge">${off(p)}% off</span>${p.im.map((m, i) => `<div class="gi"><img src="${IMG}${m}.jpg" alt="${p.n}, view ${i + 1}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} draggable="false"></div>`).join("")}
<div class="gcount" aria-hidden="true">01 / ${String(p.im.length).padStart(2, "0")}</div><div class="gnav"><button data-prev aria-label="Previous image">${ic.prev}</button><button data-next aria-label="Next image">${ic.arrow}</button></div></div></div>
<div class="pinfo"><div class="crumb" data-r><a href="index.html">Home</a><i>/</i><a href="shop.html">Shop</a><i>/</i><a href="shop.html?cat=${encodeURIComponent(p.c)}">${p.c}</a></div>
<span class="eyebrow" style="margin:22px 0 14px" data-r style="--d:.05s">${p.c} · ${p.cap}</span>
<h1 data-split style="--d:.1s">${p.n}</h1>
<div class="prow" data-r style="--d:.3s"><span class="now">${money(p.p)}</span><s>${money(p.o)}</s><span class="badge gold">${off(p)}% off</span><span class="save">You save ${money(p.o - p.p)}</span></div>
<p class="desc" data-r style="--d:.35s">${p.d}</p>
<ul class="perks">${p.b.map((b, i) => `<li data-r style="--d:${.4 + i * .08}s"><i>${ic.check}</i>${b}</li>`).join("")}</ul>
<div class="buy" data-buy="${p.id}" data-r style="--d:.5s"><div class="qty" role="group" aria-label="Quantity"><button data-step="-1" aria-label="Decrease quantity">−</button><output>1</output><button data-step="1" aria-label="Increase quantity">+</button></div>
<button class="btn navy main mag" data-pdp="add">Add to bag <i>+</i></button></div>
<div class="buy2"><a class="btn ghost block" href="cart.html" data-pdp="now">Buy it now <i>→</i></a></div>
<div class="hint" data-hint data-r><div><b class="hm"></b> Bundle any three items for 20% off.</div><div class="free"><b></b></div></div>
<div class="assure" data-r><div>${ic.shield}Halal-conscious<br>formulas</div><div>${ic.leaf}Cruelty free<br>care</div><div>${ic.pin}Made<br>in India</div></div>
<div class="acc" data-r>
<div class="acc-i open"><button class="acc-h" aria-expanded="true">Product details<i></i></button><div class="acc-b"><div><ul><li>Size: ${p.cap}</li>${p.b.map(b => `<li>${b}</li>`).join("")}</ul></div></div></div>
<div class="acc-i"><button class="acc-h" aria-expanded="false">Shipping &amp; returns<i></i></button><div class="acc-b"><div><p>Read our <a href="https://shopkhoob.com/pages/shipping-policy" target="_blank" rel="noopener">shipping policy</a> and <a href="https://shopkhoob.com/pages/returns-refunds" target="_blank" rel="noopener">returns &amp; refunds</a> for the full details.</p></div></div></div>
<div class="acc-i"><button class="acc-h" aria-expanded="false">The khoob promise<i></i></button><div class="acc-b"><div><p>Beauty that feels aligned with who you are and what you value. Clearly listed ingredients, cruelty free care and formulas crafted with respect for the values you live by every day.</p></div></div></div>
</div></div></div></section>

<section class="wrap"><div class="hls rug dk">${hl}</div></section>

<section class="sec wrap"><div class="story"><div class="frame"><div class="arch ri" style="--d:.1s"><img src="${IMG}${p.im[1]}.jpg" alt="" loading="lazy"></div></div>
<div><span class="eyebrow" data-r>Why you’ll love it</span><h2 class="h-lg" data-split>${p.story[0]}</h2><p data-r>${p.story[1]}</p><ul class="ticks" data-r>${p.b.map(b => `<li>${b}</li>`).join("")}</ul>${link("our-promise.html", "Our promise", "navy sm mag")}</div></div></section>

<section class="wrap" style="padding-bottom:20px"><div class="shead"><div><span class="eyebrow" data-r>Complete the routine</span><h2 class="h-lg" data-split>You may <em>also like</em></h2></div>${link("shop.html", "Shop all", "navy sm mag")}</div><div class="grid g3">${others.map(card).join("")}</div></section>

<div class="sbar" aria-hidden="false"><img src="${IMG}${p.im[0]}.jpg" alt=""><div class="n">${p.n}<small>${money(p.p)} <s>${money(p.o)}</s></small></div><button class="btn sm" data-sbar-add>Add to bag <i>+</i></button></div>`);
});

// PROMISE
pages["our-promise.html"] = page({ title: "The khoob promise | khoob", desc: "Halal beauty and personal care that is true to you and true to your beliefs.", active: "promise" },
  pghead("Our promise", "The khoob <em>promise</em>", "Halal beauty and personal care that is true to you and true to your beliefs.", `<a href="index.html">Home</a><i>/</i><span>Our promise</span>`) + `
<section class="wrap" style="padding-bottom:30px">${pgrid}</section>
<section class="sec wrap"><div class="split"><div class="frame"><div class="arch ri"><img src="${IMG}k2.jpg" alt="Khoob kajal on a dark silk backdrop" loading="lazy"></div></div>
<div><span class="eyebrow" data-r>Beauty that feels right</span><h2 class="h-lg" data-split>Honest ingredients, <em>everyday care</em></h2><p data-r>Clearly listed ingredients make each formula feel honest, safe, and true to you. We keep routines simple so conscious beauty can feel natural every morning.</p>
<ul class="ticks" data-r><li>100% transparent formulas</li><li>Only verified ingredients</li><li>Cruelty free care</li><li>Formulas crafted with respect for your beliefs</li></ul>${link("shop.html", "Shop the range", "navy mag")}</div></div></section>
<div class="arcade" aria-hidden="true"></div><section class="stats sec" ><div class="wrap" style="text-align:center"><h2 class="h-lg" data-split>Safe for your skin,<br><em>safe for your beliefs</em></h2><div class="sgrid" style="text-align:left"><div class="stat"><b data-count="50" data-suffix="+">0+</b><span>SPF in every tube.</span></div><div class="stat"><b>PA++++</b><span>Broad spectrum protection.</span></div><div class="stat"><b data-count="8" data-suffix=" hrs">0 hrs</b><span>Long-lasting kajal wear.</span></div><div class="stat"><b data-count="0">0</b><span>White cast.</span></div></div></div></section>
<section class="sec wrap"><div class="cta"><span class="eyebrow">Ready when you are</span><h2 class="h-lg" data-split>Start your <em>everyday ritual</em></h2>${link("shop.html", "Shop now", "navy mag")}</div></section>`);

// JOURNAL
pages["journal.html"] = page({ title: "Journal | khoob", desc: "Knowledge for conscious care: clean formulation, ingredients and SPF guides from khoob.", active: "journal" },
  pghead("The journal", "Knowledge for <em>conscious care</em>", "Guides on ingredients, clean formulation and choosing the right sunscreen.", `<a href="index.html">Home</a><i>/</i><span>Journal</span>`) + `<section class="wrap" style="padding-bottom:30px">${posts("feature")}</section>`);

// CONTACT
pages["contact.html"] = page({ title: "Contact | khoob", desc: "Get in touch with the khoob team.", active: "contact" },
  pghead("Say hello", "Get in <em>touch</em>", "Questions about an order, an ingredient or a routine? We would love to hear from you.", `<a href="index.html">Home</a><i>/</i><span>Contact</span>`) + `
<section class="wrap" style="padding-bottom:30px"><div class="cgrid"><form class="form" data-mailto="contactus@boujieconsumer.com" data-r>
<div class="two"><div class="fld"><input id="n" name="n" required placeholder=" " autocomplete="name"><label for="n">Name</label></div><div class="fld"><input id="e" name="e" type="email" required placeholder=" " autocomplete="email"><label for="e">Email</label></div></div>
<div class="fld"><textarea id="m" name="m" required placeholder=" " rows="5"></textarea><label for="m">How can we help?</label></div>
<div><button class="btn navy mag">Send message <i>→</i></button></div><p class="note">This opens your email app with your message ready to send.</p></form>
<div class="cinfo"><div class="c" data-r="right"><i>${ic.mail}</i><div><b>Email</b><a href="mailto:contactus@boujieconsumer.com">contactus@boujieconsumer.com</a></div></div>
<div class="c" data-r="right" style="--d:.1s"><i>${ic.pin}</i><div><b>Visit</b>DLF Phase II, Gurugram, Haryana</div></div>
<div class="c" data-r="right" style="--d:.2s"><i>${ic.ig}</i><div><b>Follow along</b><a href="https://www.instagram.com/itskhoob" target="_blank" rel="noopener">@itskhoob</a> on Instagram</div></div></div></div></section>`);

// CART
pages["cart.html"] = page({ title: "Your bag | khoob", desc: "Review your bag and check out.", active: "" },
  pghead("Almost there", "Your <em>bag</em>", "Review your picks, then tell us where to send them.", `<a href="index.html">Home</a><i>/</i><span>Bag</span>`).replace("h-xl", "h-lg") + `
<section class="wrap" style="padding-bottom:20px" data-cartpage>
<div id="cartempty" class="empty" hidden><div class="big">Your bag is empty</div><p>Add a little sunshine to it.</p>${link("shop.html", "Shop now", "navy sm")}</div>
<div class="co" id="cartfull" hidden><div><div class="free"><b id="cartfree"></b></div><p class="free-t" id="cartfreet"></p><div class="cl" id="cartlines"></div></div>
<div class="box rug"><h3>Order summary</h3><div class="sum" id="cartsum" style="border:0;padding:0"></div>
<form id="checkout" class="form" style="margin-top:22px"><div class="fld"><input id="cn" name="n" required placeholder=" " autocomplete="name"><label for="cn">Full name</label></div><div class="fld"><input id="ce" name="e" type="email" required placeholder=" " autocomplete="email"><label for="ce">Email</label></div><div class="fld"><input id="ca" name="a" required placeholder=" " autocomplete="street-address"><label for="ca">Address</label></div>
<div class="two"><div class="fld"><input id="cc" name="c" required placeholder=" " autocomplete="address-level2"><label for="cc">City</label></div><div class="fld"><input id="cp" name="p" required pattern="[0-9]{6}" inputmode="numeric" placeholder=" " autocomplete="postal-code"><label for="cp">PIN code</label></div></div>
<p class="note">Online payment is not connected yet, so this places a demo order only.</p><button class="btn navy block">Place order <i>→</i></button></form></div></div></section>`);

/* ------------------------------ write ------------------------------ */
Object.entries(pages).forEach(([f, h]) => fs.writeFileSync(path.join(OUT, f), h));
fs.writeFileSync(path.join(OUT, "assets/js/data.js"), "window.KHOOB=" + JSON.stringify({ root: "", img: IMG.replace(/^/, ""), P: P.map(({ id, n, c, p, o, cap, im, d, url }) => ({ id, n, c, p, o, cap, im, d, url })) }) + ";");
console.log("Built", Object.keys(pages).length, "pages");

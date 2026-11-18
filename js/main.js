/* VELIDI.AI — interações e animações
 * GSAP 3.13 (ScrollTrigger, SplitText, CustomEase) + Lenis.
 * Tudo o que é conteúdo funciona sem as bibliotecas; elas só acrescentam movimento. */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const WA = "5519984216068";
  const hasGSAP = !!(window.gsap && window.ScrollTrigger && window.SplitText && window.CustomEase);

  /* =========================================================
   * Partes sem dependência (funcionam mesmo se o CDN falhar)
   * ========================================================= */

  /* ---- copiar e-mail ---- */
  $$("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const text = btn.dataset.copy;
      const done = () => { btn.textContent = "Copiado"; btn.classList.add("is-done"); setTimeout(() => { btn.textContent = "Copiar"; btn.classList.remove("is-done"); }, 1800); };
      const fallback = () => {
        const el = $("#emailText");
        const r = document.createRange(); r.selectNodeContents(el);
        const s = getSelection(); s.removeAllRanges(); s.addRange(r);
        btn.textContent = "Selecionado";
        setTimeout(() => { btn.textContent = "Copiar"; }, 1800);
      };
      try { navigator.clipboard.writeText(text).then(done, fallback); } catch (e) { fallback(); }
    });
  });

  /* ---- privacidade ---- */
  const privacy = $("#privacy");
  $$("[data-open-privacy]").forEach((b) => b.addEventListener("click", () => {
    if (privacy.showModal) privacy.showModal(); else privacy.setAttribute("open", "");
  }));
  $("[data-close-privacy]").addEventListener("click", () => privacy.close ? privacy.close() : privacy.removeAttribute("open"));
  privacy.addEventListener("click", (e) => { if (e.target === privacy) privacy.close(); });

  /* ---- formulário de briefing → WhatsApp ---- */
  const form = $("#brief");
  const filled = $("#briefFilled");
  const errBox = $("#briefError");
  const fallbackLink = $("#waFallback");
  const countFilled = () => {
    const names = ["nome", "empresa", "tipo", "ideia", "objetivo", "atual", "prazo", "cidade"];
    const data = new FormData(form);
    filled.textContent = names.filter((n) => String(data.get(n) || "").trim()).length;
  };
  form.addEventListener("input", countFilled);
  form.addEventListener("change", countFilled);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const v = (k) => String(d.get(k) || "").trim();
    const missing = [];
    $$(".field", form).forEach((f) => f.classList.remove("is-invalid"));
    if (!v("nome")) { missing.push("seu nome"); $("#f-nome").closest(".field").classList.add("is-invalid"); }
    if (!v("tipo")) { missing.push("o tipo de projeto"); $(".choices").closest(".field").classList.add("is-invalid"); }
    if (!v("ideia")) { missing.push("sua ideia"); $("#f-ideia").closest(".field").classList.add("is-invalid"); }
    if (missing.length) {
      errBox.textContent = "Preencha " + missing.join(", ").replace(/, ([^,]*)$/, " e $1") + " para montar a mensagem.";
      errBox.hidden = false;
      const first = $(".is-invalid input, .is-invalid textarea", form);
      if (first) first.focus();
      return;
    }
    errBox.hidden = true;
    const lines = [
      `Olá, Raul! Vim pelo portfólio da VELIDI.AI.`,
      ``,
      `*Nome:* ${v("nome")}`,
      v("empresa") ? `*Empresa/projeto:* ${v("empresa")}` : null,
      `*Preciso de:* ${v("tipo")}`,
      `*Ideia:* ${v("ideia")}`,
      v("objetivo") ? `*Objetivo:* ${v("objetivo")}` : null,
      v("atual") ? `*Site/sistema atual:* ${v("atual")}` : null,
      v("prazo") ? `*Prazo:* ${v("prazo")}` : null,
      v("cidade") ? `*Cidade:* ${v("cidade")}` : null,
    ].filter((l) => l !== null);
    const url = `https://wa.me/${WA}?text=${encodeURIComponent(lines.join("\n"))}`;
    fallbackLink.href = url;
    fallbackLink.hidden = false;
    fallbackLink.click();
  });

  /* ---- menu mobile ---- */
  const burger = $("#burger");
  const menu = $("#menu");
  let menuOpen = false;
  const setMenu = (open) => {
    menuOpen = open;
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    if (open) {
      menu.hidden = false;
      document.body.style.overflow = "hidden";
      window.__lenis && window.__lenis.stop();
      if (hasGSAP && !reduce) {
        gsap.fromTo(menu, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.7, ease: "power4.inOut" });
        gsap.fromTo($$(".menu__nav a", menu), { yPercent: 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.8, ease: "power4.out", stagger: 0.05, delay: 0.25 });
      }
    } else {
      document.body.style.overflow = "";
      window.__lenis && window.__lenis.start();
      if (hasGSAP && !reduce) gsap.to(menu, { clipPath: "inset(0 0 100% 0)", duration: 0.55, ease: "power4.inOut", onComplete: () => { menu.hidden = true; } });
      else menu.hidden = true;
    }
  };
  burger.addEventListener("click", () => setMenu(!menuOpen));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && menuOpen) { setMenu(false); burger.focus(); } });

  /* ---- âncoras (com rolagem suave quando disponível) ---- */
  const headerH = () => $("#header").offsetHeight;
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      if (menuOpen) setMenu(false);
      const offset = id === "#inicio" ? 0 : -headerH() + 1;
      if (window.__lenis) window.__lenis.scrollTo(target, { offset, duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) });
      else window.scrollTo({ top: target.getBoundingClientRect().top + scrollY + offset, behavior: reduce ? "auto" : "smooth" });
      if (target.hasAttribute("tabindex") === false) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  });

  /* ---- VELIDI.AI: TechText (React Bits, port em JS puro) com as cores do site ---- */
  if (window.TechText && window.ResizeObserver) {
    const GOLD = [[0, "#FFF3C9"], [0.18, "#F3DC8B"], [0.52, "#D4AF37"], [1, "#8C6C16"]];
    $$("[data-techtext]").forEach((el) => {
      const host = el.parentElement;
      const ai = $(".tt-ai", host);
      const isHero = el.dataset.techtext === "hero";
      const fontPx = () => parseFloat(getComputedStyle(host).fontSize) || 150;
      host.classList.add("is-tech");
      const t = TechText(el, {
        text: "VELIDI",
        fontFamily: "Archivo",
        fontWeight: 800,
        fontStretch: "125%",
        fontSize: fontPx(),
        letterSpacing: -0.045,
        color: "#D4AF37",
        accentColor: "#8B5CF6",
        gradient: GOLD,
        reveal: "area",
        dashLength: 4,
        dashGap: 2,
        specks: 0,
        intro: "type",
        introDuration: 1.4,
        clickKick: true,
        guides: false,
        reach: 240,
        softness: 0.85,
        lineStyle: "solid",
        strokeWidth: 1,
        speed: 0.8,
        selection: false,
        labels: false,
        autoStart: !isHero || !hasGSAP || reduce,   // no topo, a intro espera o loader
        onLayout: (v) => {
          if (!ai) return;
          ai.style.left = `${el.offsetLeft + v.right + v.size * 0.03}px`;
          ai.style.top = `${el.offsetTop + v.top + v.size * 0.03}px`;
          ai.style.fontSize = `${v.size * 0.22}px`;
        },
      });
      let rz = 0;
      addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => t.set({ fontSize: fontPx() }), 150); });
      if (isHero) window.__heroTT = t;
    });
  }

  /* ---- projetos: leque de celulares (Card Spread) ---- */
  if (window.CardSpread && $("#spread")) {
    const cards = $$("#spread .spread__card");
    const info = $(".spread-info__body");
    if (matchMedia("(hover: none)").matches) $(".projetos__hint").textContent = "— toque nos celulares";
    const fill = (i) => {
      const c = cards[i];
      $("#projIdx").textContent = `${String(i + 1).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")}`;
      $("#projCat").textContent = c.dataset.cat;
      $("#projName").textContent = c.dataset.name;
      $("#projDesc").textContent = c.dataset.desc;
      const cta = $("#projCta");
      cta.href = c.href;
      cta.firstElementChild.textContent = c.dataset.cta;
      info.classList.remove("is-swap"); void info.offsetWidth; info.classList.add("is-swap");
    };
    const spread = CardSpread($("#spread"), {
      arc: 88, radius: 480, cardWidth: 172, cardHeight: 352, lift: 34, push: 3.6, pushReach: 3, restOpacity: 1,
      stiffness: 150, damping: 16, mass: 1, stagger: 0.06, fit: true, maxScale: 1, restSpread: 0.55,
      overflow: () => (innerWidth < 640 ? 1.55 : innerWidth < 1024 ? 1.15 : 1),
      onActive: (i) => { cur = i; fill(i); },
    });
    let cur = 0;
    const go = (d) => spread.select((cur + d + cards.length) % cards.length);
    $("#projPrev").addEventListener("click", () => go(-1));
    $("#projNext").addEventListener("click", () => go(1));
  }

  /* ---- serviços: pastas FolderFloat (React Bits, port em JS puro) ---- */
  if (window.FolderFloat) {
    $$("[data-folder]").forEach((el) => {
      let cfg;
      try { cfg = JSON.parse(el.dataset.folder); } catch (e) { return; }
      const cell = el.closest(".svc-one");
      const capK = $("#svcK"), capT = $("#svcT");
      const capDefault = [capK.textContent, capT.textContent];
      const caption = (k, t) => { capK.textContent = k; capT.textContent = t; };
      const isTouch = matchMedia("(hover: none)").matches;
      const api = FolderFloat(el, {
        items: cfg.items,
        label: cfg.label,
        sublabel: isTouch ? "6 serviços · toque para abrir" : "6 serviços · passe o mouse",
        trigger: "hover",
        closeOnSelect: true,
        physics: true,
        drift: 0.5,
        onOpenChange: (open) => {
          cell && cell.classList.toggle("is-open", open);
          if (open) caption("Escolha um serviço", isTouch ? "Toque em uma nota para conversar sobre ela no WhatsApp." : "Passe o mouse sobre uma nota para ver a descrição. Clique para conversar no WhatsApp.");
          else caption(...capDefault);
        },
        folderColor: "#26262A",
        frontColor: "#1C1C1E",
        paperColor: "#D4AF37",
        itemColor: "#F4F1EA",
        itemTextColor: "#0A0A0A",
        labelColor: "#F3DC8B",
        width: innerWidth < 640 ? 260 : 320,
        height: innerWidth < 640 ? 190 : 236,
        radius: 18,
        spread: 320,
        lift: 34,
        tilt: 8,
        flapAngle: 34,
        restAngle: 16,
        openDuration: 520,
        stagger: 45,
        bounce: 0.3,
      });
      // reserva acima da pasta a altura que a nuvem de notas ocupa
      const room = () => { const r = el.style.getPropertyValue("--ff-room"); if (r && cell) cell.style.setProperty("--room", r.trim()); };
      room();
      // a nota sob o mouse (ou com foco) mostra a descrição do serviço abaixo da pasta
      $$(".folder-float__item", el).forEach((pill, i) => {
        const it = cfg.items[i];
        const show = () => caption(it.accent ? "WhatsApp" : String(i + 1).padStart(2, "0") + " · " + it.label, it.desc);
        pill.addEventListener("pointerenter", show);
        pill.addEventListener("focus", show);
      });
      document.fonts && document.fonts.ready.then(() => { api.relayout(); room(); });
      addEventListener("resize", () => setTimeout(room, 200));
    });
  }

  /* ---- logo animado no topo: para quando a aba some ou se o usuário pede menos movimento ---- */
  const mark = $(".brand__mark video");
  if (mark) {
    if (reduce) mark.pause();
    else document.addEventListener("visibilitychange", () => { if (document.hidden) mark.pause(); else { const p = mark.play(); if (p) p.catch(() => {}); } });
  }

  /* ---- globo (canvas): pontos sobre uma esfera, girando ---- */
  const initGlobe = () => {
    const cv = $("#globe");
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const N = 1100;
    const pts = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const t = golden * i;
      pts.push([Math.cos(t) * r, y, Math.sin(t) * r, Math.random() < 0.08]);
    }
    // arcos: pares de pontos ligados por curvas (rotas "sem fronteiras")
    const arcs = [];
    for (let i = 0; i < 14; i++) arcs.push([pts[(Math.random() * N) | 0], pts[(Math.random() * N) | 0], Math.random()]);
    let w = 0, h = 0, dpr = 1, running = false, rot = 0, raf = 0;
    const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; };
    const tilt = 0.38;
    const project = (p, R) => {
      const cr = Math.cos(rot), sr = Math.sin(rot);
      let x = p[0] * cr - p[2] * sr, z = p[0] * sr + p[2] * cr, y = p[1];
      const ct = Math.cos(tilt), st = Math.sin(tilt);
      const y2 = y * ct - z * st; z = y * st + z * ct;
      return [w / 2 + x * R, h / 2 + y2 * R, z];
    };
    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const R = Math.min(w, h) * 0.36;
      // halo
      const g = ctx.createRadialGradient(w / 2, h / 2, R * 0.6, w / 2, h / 2, R * 1.4);
      g.addColorStop(0, "rgba(124,58,237,0.10)"); g.addColorStop(1, "rgba(124,58,237,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      for (const p of pts) {
        const [x, y, z] = project(p, R);
        const a = (z + 1) / 2;
        if (z < -0.15) { ctx.fillStyle = `rgba(139,92,246,${0.12 * a + 0.03})`; ctx.fillRect(x, y, 1.2, 1.2); continue; }
        ctx.fillStyle = p[3] ? `rgba(243,220,139,${0.35 + a * 0.65})` : `rgba(212,175,55,${0.12 + a * 0.5})`;
        const s = p[3] ? 2.2 : 1.4;
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
      }
      ctx.lineWidth = 1;
      for (const [a, b, ph] of arcs) {
        const A = project(a, R), B = project(b, R);
        if (A[2] < 0 || B[2] < 0) continue;
        const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
        const dx = mx - w / 2, dy = my - h / 2, len = Math.hypot(dx, dy) || 1;
        const lift = R * 0.35;
        const cx = mx + (dx / len) * lift, cy = my + (dy / len) * lift;
        const grd = ctx.createLinearGradient(A[0], A[1], B[0], B[1]);
        grd.addColorStop(0, "rgba(139,92,246,0.0)"); grd.addColorStop(0.5, "rgba(212,175,55,0.55)"); grd.addColorStop(1, "rgba(139,92,246,0.0)");
        ctx.strokeStyle = grd;
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.quadraticCurveTo(cx, cy, B[0], B[1]); ctx.stroke();
        const t = (performance.now() / 2600 + ph) % 1;
        const qx = (1 - t) * (1 - t) * A[0] + 2 * (1 - t) * t * cx + t * t * B[0];
        const qy = (1 - t) * (1 - t) * A[1] + 2 * (1 - t) * t * cy + t * t * B[1];
        ctx.fillStyle = "rgba(255,244,210,0.95)"; ctx.beginPath(); ctx.arc(qx, qy, 1.8, 0, Math.PI * 2); ctx.fill();
      }
    };
    const loop = () => { rot += 0.0016; draw(); if (running) raf = requestAnimationFrame(loop); };
    size(); draw();
    addEventListener("resize", () => { size(); draw(); });
    if (reduce) return;
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !running) { running = true; loop(); }
      else if (!en.isIntersecting) { running = false; cancelAnimationFrame(raf); }
    }).observe(cv);
  };
  initGlobe();

  /* ---- FAQ sem GSAP (reserva) ---- */
  const faqItems = $$("[data-faq]");
  const faqFallback = () => {
    faqItems.forEach((item) => {
      const a = $(".faq__a", item);
      $(".faq__q", item).addEventListener("click", () => {
        const open = !item.classList.contains("is-open");
        faqItems.forEach((o) => { o.classList.remove("is-open"); $(".faq__q", o).setAttribute("aria-expanded", "false"); Object.assign($(".faq__a", o).style, { height: "0px", visibility: "hidden", opacity: "0" }); });
        if (open) { item.classList.add("is-open"); $(".faq__q", item).setAttribute("aria-expanded", "true"); Object.assign(a.style, { height: "auto", visibility: "visible", opacity: "1" }); }
      });
    });
  };

  if (!hasGSAP) {
    root.classList.add("no-loader");
    faqFallback();
    $("#loader") && $("#loader").remove();
    return;
  }

  /* =========================================================
   * Movimento (GSAP)
   * ========================================================= */
  // espera as fontes (o SplitText mede as linhas) — no máximo 2,5 s
  const fontsReady = document.fonts ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]) : Promise.resolve();
  fontsReady.then(startMotion);

  function startMotion() {
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
  CustomEase.create("velidi", "0.2, 0.7, 0.2, 1");
  const EASE = "velidi";
  try { history.scrollRestoration = "manual"; } catch (e) {}

  /* ---- rolagem suave ---- */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    window.__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    ScrollTrigger.addEventListener("refresh", () => lenis.resize());
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---- gatilho "entrou/saiu" que se corrige sozinho ---- */
  const arm = (trigger, start, onIn, onOut) => {
    let isIn = false;
    const enter = () => { if (!isIn) { isIn = true; onIn(); } };
    const leave = () => { if (isIn) { isIn = false; onOut && onOut(); } };
    ScrollTrigger.create({ trigger, start, onEnter: enter, onLeaveBack: leave, onRefresh: (self) => { if (self.scroll() >= self.start) enter(); else leave(); } });
  };

  /* ---- text reveal (palavra por palavra ou bloco, saindo do blur) ---- */
  const reveal = (targets, { delay = 0 } = {}) => {
    const tl = gsap.timeline({ paused: true });
    let at = delay;
    [...targets].forEach((el) => {
      if ((el.dataset.reveal || "words") === "words") {
        const split = SplitText.create(el, { type: "words", wordsClass: "wd" });
        gsap.set(split.words, { autoAlpha: 0, y: "0.45em", filter: "blur(10px)" });
        tl.to(split.words, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 1, ease: EASE, stagger: 0.07, clearProps: "filter" }, at);
        at += 0.15 + split.words.length * 0.05;
      } else {
        gsap.set(el, { autoAlpha: 0, y: 28, filter: "blur(6px)" });
        tl.to(el, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.9, ease: EASE, clearProps: "filter" }, at);
        at += 0.14;
      }
    });
    return { play: () => tl.timeScale(1).play(), reverse: () => tl.timeScale(1.8).reverse() };
  };

  if (reduce) {
    faqSetup(false);
    formAndNavOnly();
    root.classList.add("no-loader");
    $("#loader") && $("#loader").remove();
    return;
  }

  /* ---------- LOADER + ENTRADA DO HERO ---------- */
  const loader = $("#loader");
  let seen = false;
  try { seen = sessionStorage.getItem("velidi-intro") === "1"; } catch (e) {}

  const heroLetters = $$(".hero__word .hw");
  const heroBits = $$("[data-hero]");
  const heroPhoto = $(".hero__photo img");
  const heroTags = $$(".hero__tags .tag");
  const leadSplit = SplitText.create($(".hero__lead"), { type: "lines", linesClass: "ln", mask: "lines" });

  gsap.set(heroLetters, { yPercent: 70, autoAlpha: 0, rotateX: -60, filter: "blur(12px)", transformOrigin: "50% 100%" });
  gsap.set(".hero__word .tt-ai", { autoAlpha: 0, y: 12 });
  gsap.set(heroPhoto, { scale: 1.14, autoAlpha: 0, filter: "blur(16px)" });
  gsap.set(heroTags, { autoAlpha: 0, scale: 0.6 });
  gsap.set(heroBits, { autoAlpha: 0, y: 24 });
  gsap.set(leadSplit.lines, { yPercent: 110 });
  gsap.set(".hero__lead", { autoAlpha: 1, y: 0 });
  gsap.set(".chapters", { yPercent: 100, autoAlpha: 0 });

  const heroIntro = () => {
    const tl = gsap.timeline({ defaults: { ease: EASE } });
    tl.to(heroPhoto, { scale: 1, autoAlpha: 1, filter: "blur(0px)", duration: 1.8, clearProps: "filter" }, 0)
      .to(heroLetters, { yPercent: 0, autoAlpha: 1, rotateX: 0, filter: "blur(0px)", duration: 1.4, stagger: 0.07, clearProps: "filter" }, 0.15)
      .call(() => window.__heroTT && window.__heroTT.play(), null, 0.15)   // TechText: intro "type"
      .to(".hero__word .tt-ai", { autoAlpha: 1, y: 0, duration: 0.8 }, 1.45)
      .to(leadSplit.lines, { yPercent: 0, duration: 1.2, stagger: 0.12 }, 0.55)
      .to(heroBits.filter((b) => b.dataset.hero !== "lead"), { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08 }, 0.7)
      .to(heroTags, { autoAlpha: 1, scale: 1, duration: 0.9, stagger: 0.07, ease: "back.out(1.8)" }, 0.9)
      .to(".chapters", { yPercent: 0, autoAlpha: 1, duration: 0.9 }, 1.1);
    return tl;
  };

  if (seen) {
    loader.remove();
    heroIntro();
  } else {
    lenis && lenis.stop();
    const count = $("#loaderCount");
    const prog = { v: 0 };
    const ltl = gsap.timeline({
      onComplete: () => { loader.remove(); lenis && lenis.start(); try { sessionStorage.setItem("velidi-intro", "1"); } catch (e) {} },
    });
    ltl.fromTo(".loader__word span", { yPercent: 105 }, { yPercent: 0, duration: 0.9, ease: EASE, stagger: 0.05, immediateRender: true }, 0)
      .to(".loader__bar i", { scaleX: 1, duration: 1.5, ease: "power2.inOut" }, 0.1)
      .to(prog, { v: 100, duration: 1.5, ease: "power2.inOut", onUpdate: () => { count.textContent = String(Math.round(prog.v)).padStart(3, "0"); } }, 0.1)
      .to(".loader__word span", { yPercent: -105, duration: 0.6, ease: "power3.in", stagger: 0.03 }, 1.75)
      .to(".loader__meta, .loader__bar", { autoAlpha: 0, duration: 0.4 }, 1.75)
      .to(loader, { clipPath: "inset(0 0 100% 0)", duration: 0.9, ease: "power4.inOut" }, 2.1)
      .add(heroIntro(), 2.35);
  }

  /* ---------- HERO: parallax de rolagem e de mouse ---------- */
  const hero = $(".hero");
  gsap.timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 } })
    .to(".hero__photo", { yPercent: 14, ease: "none" }, 0)
    .to(".hero__word", { yPercent: -38, ease: "none" }, 0)
    .to(".hero__tags", { yPercent: -18, autoAlpha: 0.2, ease: "none" }, 0)
    .to(".hero__foot", { yPercent: -30, autoAlpha: 0, ease: "none" }, 0)
    .to(".hero__glow--violet", { scale: 1.25, autoAlpha: 0.4, ease: "none" }, 0);

  if (fine) {
    const photoX = gsap.quickTo(".hero__photo", "x", { duration: 1.2, ease: "power3" });
    const photoY = gsap.quickTo(".hero__photo", "y", { duration: 1.2, ease: "power3" });
    const tags = heroTags.map((t) => ({ el: t, d: parseFloat(t.dataset.depth) || 0.5, x: 0, y: 0 }));
    let tx = 0, ty = 0;
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      photoX(tx * -18); photoY(ty * -12);
    });
    hero.addEventListener("pointerleave", () => { tx = 0; ty = 0; photoX(0); photoY(0); });
    gsap.ticker.add(() => {
      tags.forEach((t) => {
        t.x += (tx * 60 * t.d - t.x) * 0.06;
        t.y += (ty * 40 * t.d - t.y) * 0.06;
        t.el.style.translate = `${t.x.toFixed(2)}px ${t.y.toFixed(2)}px`;
      });
    });
  }

  /* ---------- MARQUEE: laço infinito que acelera com a rolagem ---------- */
  const loops = $$(".marquee__row").map((row) => {
    const track = $(".marquee__track", row);
    row.appendChild(track.cloneNode(true));
    const dir = parseFloat(row.dataset.dir) || 1;
    const tween = gsap.fromTo(row, { xPercent: dir > 0 ? 0 : -50 }, { xPercent: dir > 0 ? -50 : 0, duration: dir > 0 ? 38 : 30, ease: "none", repeat: -1 });
    return tween;
  });
  let velTimer;
  ScrollTrigger.create({
    trigger: ".marquee", start: "top bottom", end: "bottom top",
    onUpdate: (self) => {
      const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 300, 5);
      const dir = self.direction;
      loops.forEach((t) => gsap.to(t, { timeScale: boost * dir, duration: 0.25, overwrite: true }));
      clearTimeout(velTimer);
      velTimer = setTimeout(() => loops.forEach((t) => gsap.to(t, { timeScale: dir, duration: 1.2, overwrite: true })), 120);
    },
  });

  /* ---------- títulos e blocos com reveal ---------- */
  $$("section").forEach((sec) => {
    const els = $$("[data-reveal]", sec);
    if (!els.length) return;
    const r = reveal(els);
    arm(sec, "top 72%", r.play, r.reverse);
  });

  /* ---------- texto que acende palavra por palavra (scrub) ---------- */
  $$(".scrub-text").forEach((el) => {
    const split = SplitText.create(el, { type: "words", wordsClass: "wd" });
    gsap.set(split.words, { opacity: 0.14 });
    gsap.to(split.words, { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 45%", scrub: 0.4 } });
  });

  /* ---------- sobre: logo em movimento com recorte e parallax ---------- */
  gsap.set(".tools__list li", { autoAlpha: 0, y: 14 });
  arm(".tools", "top 85%",
    () => gsap.to(".tools__list li", { autoAlpha: 1, y: 0, duration: 0.7, ease: EASE, stagger: 0.05 }),
    () => gsap.to(".tools__list li", { autoAlpha: 0, y: 14, duration: 0.3, stagger: 0.02 }));

  /* ---------- serviços: a pasta sobe e a legenda aparece ---------- */
  $$("[data-svc]").forEach((item) => {
    const bits = [$(".svc-one__folder", item), $(".svc-one__caption", item)];
    gsap.set(bits, { autoAlpha: 0, y: 50 });
    const tl = gsap.timeline({ paused: true }).to(bits, { autoAlpha: 1, y: 0, duration: 1.1, ease: EASE, stagger: 0.12, clearProps: "transform" });
    arm(item, "top 80%", () => tl.timeScale(1).play(), () => tl.timeScale(2).reverse());
  });

  /* ---------- projetos ---------- */
  const titleWords = SplitText.create($$(".projetos__title .line"), { type: "words", wordsClass: "wd" });
  gsap.set(titleWords.words, { yPercent: 110 });
  gsap.set(".projetos__count, .projetos__head .chap-head__num", { autoAlpha: 0, y: 16 });
  const projHead = gsap.timeline({ paused: true })
    .to(".projetos__head .chap-head__num", { autoAlpha: 1, y: 0, duration: 0.8, ease: EASE }, 0)
    .to(titleWords.words, { yPercent: 0, duration: 1.1, ease: EASE, stagger: 0.1 }, 0.05)
    .to(".projetos__count", { autoAlpha: 1, y: 0, duration: 0.8, ease: EASE }, 0.4);
  arm(".projetos", "top 70%", () => projHead.timeScale(1).play(), () => projHead.timeScale(2).reverse());

  // painel de informações e fim da seção entram depois do leque
  gsap.set(".spread-info, .projetos__end", { autoAlpha: 0, y: 30 });
  arm(".spread", "top 70%",
    () => gsap.to(".spread-info, .projetos__end", { autoAlpha: 1, y: 0, duration: 1, ease: EASE, stagger: 0.15, delay: 0.4 }),
    () => gsap.to(".spread-info, .projetos__end", { autoAlpha: 0, y: 30, duration: 0.4 }));

  /* ---------- processo: fio de luz que acende os nós ---------- */
  (() => {
    const list = $(".tl__list"), rail = $(".tl__rail", list);
    const rows = $$("[data-row]", list);
    rows.forEach((row) => {
      const bits = $$(".tl__n, .tl__name, .tl__desc", row);
      gsap.set(bits, { autoAlpha: 0, y: 18, filter: "blur(8px)" });
      const tl = gsap.timeline({ paused: true }).to(bits, { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.9, ease: EASE, stagger: 0.08, clearProps: "filter" });
      arm(row, "top 92%", () => tl.timeScale(1).play(), () => tl.timeScale(1.8).reverse());
    });
    const nodeYs = () => rows.map((r) => { const n = $(".tl__n", r); return r.offsetTop + n.offsetTop + n.offsetHeight / 2; });
    const prog = { p: 0 };
    let ys = nodeYs();
    const apply = () => {
      const pos = ys[0] + prog.p * (ys[ys.length - 1] - ys[0]);
      rail.style.setProperty("--p", prog.p.toFixed(4));
      rail.classList.toggle("is-live", prog.p > 0.002 && prog.p < 0.998);
      rows.forEach((r, i) => r.classList.toggle("is-on", pos >= ys[i] - 1));
    };
    gsap.to(prog, {
      p: 1, ease: "none", onUpdate: apply,
      scrollTrigger: {
        trigger: list, scrub: 0.5, invalidateOnRefresh: true,
        start: () => {
          ys = nodeYs();
          list.style.setProperty("--rail-bot", (list.offsetHeight - ys[ys.length - 1]) + "px");
          rail.style.setProperty("--rail-top", ys[0] + "px");
          return `top+=${ys[0]} 58%`;
        },
        end: () => `top+=${ys[ys.length - 1]} 58%`,
        onRefresh: apply,
      },
    });
  })();

  /* ---------- contato: formulário entra ---------- */
  gsap.set(".brief", { autoAlpha: 0, y: 60 });
  arm(".brief", "top 88%", () => gsap.to(".brief", { autoAlpha: 1, y: 0, duration: 1.1, ease: EASE }), () => gsap.to(".brief", { autoAlpha: 0, y: 60, duration: 0.4 }));

  /* ---------- FAQ ---------- */
  faqSetup(true);

  /* ---------- rodapé: a palavra se enche de ouro ---------- */
  gsap.fromTo(".footer__word span.footer__fallback", { "--fill": "0%" }, { "--fill": "100%", ease: "none", scrollTrigger: { trigger: ".footer__word", start: "top 95%", end: "bottom 85%", scrub: 0.5 } });
  gsap.from(".footer__word", { yPercent: 30, ease: "none", scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true } });

  formAndNavOnly();

  /* ---------- botões magnéticos ---------- */
  if (fine) {
    $$(".btn").forEach((b) => {
      const xTo = gsap.quickTo(b, "x", { duration: 0.6, ease: "power3" });
      const yTo = gsap.quickTo(b, "y", { duration: 0.6, ease: "power3" });
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.22);
        yTo((e.clientY - r.top - r.height / 2) * 0.3);
      });
      b.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- cursor ---------- */
  if (fine) {
    const cur = $(".cursor"), dot = $(".cursor__dot"), ring = $(".cursor__ring"), label = $(".cursor__label");
    const dx = gsap.quickTo(dot, "x", { duration: 0.08 }), dy = gsap.quickTo(dot, "y", { duration: 0.08 });
    const rx = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" }), ry = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
    addEventListener("pointermove", (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); cur.classList.remove("is-hidden"); }, { passive: true });
    document.addEventListener("pointerleave", () => cur.classList.add("is-hidden"));
    document.addEventListener("pointerover", (e) => {
      const t = e.target.closest("[data-cursor]");
      if (t) { label.textContent = t.dataset.cursor; cur.classList.add("is-hover"); }
    });
    document.addEventListener("pointerout", (e) => {
      const t = e.target.closest("[data-cursor]");
      if (t && !t.contains(e.relatedTarget)) cur.classList.remove("is-hover");
    });
  }

  addEventListener("load", () => ScrollTrigger.refresh());
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());

  /* =========================================================
   * Funções usadas acima (declaradas no fim para leitura)
   * ========================================================= */
  function faqSetup(animated) {
    let refreshTimer = 0;
    const refreshLater = () => { clearTimeout(refreshTimer); refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 150); };
    const setOpen = (item, open) => {
      const a = $(".faq__a", item);
      item.classList.toggle("is-open", open);
      $(".faq__q", item).setAttribute("aria-expanded", String(open));
      gsap.killTweensOf(a);
      gsap.to(a, { height: open ? "auto" : 0, autoAlpha: open ? 1 : 0, duration: animated ? (open ? 0.7 : 0.5) : 0, ease: open ? "power3.out" : "power3.inOut", onComplete: refreshLater });
    };
    faqItems.forEach((item) => {
      gsap.set($(".faq__a", item), { height: 0, autoAlpha: 0 });
      $(".faq__q", item).addEventListener("click", () => {
        const open = !item.classList.contains("is-open");
        faqItems.forEach((o) => { if (o !== item && o.classList.contains("is-open")) setOpen(o, false); });
        setOpen(item, open);
      });
    });
    if (!animated) return;
    gsap.set(faqItems, { autoAlpha: 0, y: 34 });
    arm(".faq__list", "top 86%",
      () => gsap.to(faqItems, { autoAlpha: 1, y: 0, duration: 0.9, ease: EASE, stagger: 0.07 }),
      () => gsap.to(faqItems, { autoAlpha: 0, y: 34, duration: 0.4, ease: "power2.in", stagger: 0.02 }));
  }

  /* header que some/volta, capítulos ativos, barra de progresso */
  function formAndNavOnly() {
    const header = $("#header");
    const bar = $(".topbar-progress i");
    const chapters = $(".chapters");
    let lastY = scrollY;
    const onScroll = () => {
      const y = scrollY;
      header.classList.toggle("is-scrolled", y > 40);
      if (!menuOpen) header.classList.toggle("is-hidden", y > lastY && y > 400);
      lastY = y;
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    };
    if (lenis) lenis.on("scroll", onScroll); else addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const links = $$(".chapters a");
    const navLinks = $$(".nav a");
    $$("[data-chapter]").forEach((sec) => {
      const id = sec.dataset.chapter;
      const link = links.find((l) => l.dataset.ch === id);
      const nav = navLinks.find((l) => l.dataset.nav === id);
      const setActive = (on) => {
        if (!on) return;
        links.forEach((l) => l.classList.toggle("is-active", l === link));
        navLinks.forEach((l) => l.classList.toggle("is-active", l === nav));
      };
      ScrollTrigger.create({
        trigger: sec, start: "top 55%", end: "bottom 55%",
        onToggle: (self) => setActive(self.isActive),
        onUpdate: (self) => link && link.style.setProperty("--p", self.progress.toFixed(3)),
        onLeave: () => link && link.style.setProperty("--p", 1),
        onLeaveBack: () => link && link.style.setProperty("--p", 0),
        onRefresh: (self) => { if (link) link.style.setProperty("--p", self.progress.toFixed(3)); if (self.isActive) setActive(true); },
      });
    });
    ScrollTrigger.create({ trigger: ".footer", start: "top 80%", onEnter: () => chapters.classList.add("is-away"), onLeaveBack: () => chapters.classList.remove("is-away") });
  }
  } /* fim de startMotion */
})();

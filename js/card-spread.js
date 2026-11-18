/* CardSpread — leque de cards que se abre no hover. Implementação própria em JavaScript puro,
 * seguindo o comportamento e as props documentadas do "Card Spread" (React Bits Pro):
 * arc, radius, cardWidth, cardHeight, lift, push, pushReach, restOpacity, stiffness, damping, mass, stagger, fit, maxScale.
 * Extras: restSpread (quanto o leque fica aberto em repouso), onActive(i) e navegação por teclado/toque.
 *
 *   CardSpread(raiz, opções) — a raiz contém .spread__stage com os cards (.spread__card) dentro. */
(() => {
  "use strict";

  const DEFAULTS = {
    arc: 88, radius: 440, cardWidth: 168, cardHeight: 252, lift: 26, push: 3.6, pushReach: 3, restOpacity: 1,
    stiffness: 150, damping: 16, mass: 1, stagger: 0.06, fit: true, maxScale: 1, interactive: true,
    restSpread: 0.55, onActive: null,
  };

  function CardSpread(root, options) {
    const o = Object.assign({}, DEFAULTS, options);
    const stage = root.querySelector(".spread__stage");
    const cards = [...stage.querySelectorAll(".spread__card")];
    const n = cards.length;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = matchMedia("(hover: none)").matches;

    const base = cards.map((_, i) => (n === 1 ? 0 : -o.arc / 2 + (i * o.arc) / (n - 1)));
    const st = cards.map(() => ({ a: 0, va: 0, l: 0, vl: 0 }));   // ângulo e elevação de cada card, com velocidade
    let hovering = false, active = -1, shown = false, raf = 0, last = 0, pivot = { x: 0, y: 0 }, pointerFocus = false;

    /* ---------- geometria: o leque pendurado num círculo invisível ---------- */
    const geometry = () => {
      const w = o.cardWidth, h = o.cardHeight, R = o.radius, L = o.lift;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      const maxA = o.arc / 2 + o.push * 1.2;
      [-maxA, -maxA / 2, 0, maxA / 2, maxA].forEach((deg) => {
        const t = (deg * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t);
        [[-w / 2, -R - h / 2 - L], [w / 2, -R - h / 2 - L], [-w / 2, -R + h / 2], [w / 2, -R + h / 2]].forEach(([x, y]) => {
          const X = x * c - y * s, Y = x * s + y * c;
          minX = Math.min(minX, X); maxX = Math.max(maxX, X); minY = Math.min(minY, Y); maxY = Math.max(maxY, Y);
        });
      });
      const W = Math.ceil(maxX - minX + 24), H = Math.ceil(maxY - minY + 24);
      pivot = { x: -minX + 12, y: -minY + 12 };
      stage.style.width = W + "px";
      stage.style.height = H + "px";
      cards.forEach((c) => {
        c.style.width = w + "px";
        c.style.height = h + "px";
        c.style.left = pivot.x - w / 2 + "px";
        c.style.top = pivot.y - R - h / 2 + "px";
        c.style.transformOrigin = `50% ${h / 2 + R}px`;
      });
      const over = typeof o.overflow === "function" ? o.overflow() : o.overflow || 1;   // >1 deixa as pontas do leque passarem da largura
      const scale = o.fit ? Math.min(o.maxScale, (root.clientWidth * over) / W) : 1;
      stage.style.transform = `scale(${scale})`;
      root.style.height = Math.ceil(H * scale) + "px";
    };

    /* ---------- alvos ---------- */
    const targets = () => {
      const open = touch || hovering || active >= 0 ? 1 : o.restSpread;
      return cards.map((_, i) => {
        let a = shown ? base[i] * open : 0, l = 0;
        if (active >= 0) {
          const d = i - active;
          if (d === 0) l = o.lift;
          else if (Math.abs(d) <= o.pushReach) a += Math.sign(d) * o.push * ((o.pushReach - Math.abs(d) + 1) / o.pushReach);
        }
        return { a, l };
      });
    };

    const render = () => {
      cards.forEach((c, i) => {
        c.style.transform = `rotate(${st[i].a.toFixed(3)}deg) translateY(${(-st[i].l).toFixed(2)}px)`;
        c.style.zIndex = i === active ? 100 : i + 1;
        c.classList.toggle("is-active", i === active);
        c.style.opacity = shown ? (active >= 0 && i !== active ? o.restOpacity : 1) : 0;
      });
    };

    /* ---------- molas (stiffness, damping, mass) ---------- */
    const step = (now) => {
      const dt = Math.min(1 / 30, last ? (now - last) / 1000 : 1 / 60);
      last = now;
      const t = targets();
      let moving = false;
      const sub = 4, h = dt / sub;
      for (let k = 0; k < sub; k++) {
        st.forEach((s, i) => {
          const fa = -o.stiffness * (s.a - t[i].a) - o.damping * s.va;
          s.va += (fa / o.mass) * h; s.a += s.va * h;
          const fl = -o.stiffness * (s.l - t[i].l) - o.damping * s.vl;
          s.vl += (fl / o.mass) * h; s.l += s.vl * h;
        });
      }
      st.forEach((s, i) => { if (Math.abs(s.a - t[i].a) > 0.01 || Math.abs(s.va) > 0.01 || Math.abs(s.l - t[i].l) > 0.05 || Math.abs(s.vl) > 0.05) moving = true; });
      render();
      if (moving) raf = requestAnimationFrame(step); else { raf = 0; last = 0; }
    };
    const kick = () => {
      if (reduce) { const t = targets(); st.forEach((s, i) => { s.a = t[i].a; s.l = t[i].l; }); render(); return; }
      if (!raf) raf = requestAnimationFrame(step);
    };

    const setActive = (i) => {
      if (i === active) return;
      active = i;
      if (i >= 0 && o.onActive) o.onActive(i);
      kick();
    };

    /* ---------- entrada em cascata ---------- */
    cards.forEach((c, i) => { c.style.transitionDelay = `${(i * o.stagger).toFixed(2)}s`; });
    const show = () => {
      if (shown) return;
      shown = true;
      kick();
      setTimeout(() => cards.forEach((c) => { c.style.transitionDelay = "0s"; }), (n * o.stagger + 0.6) * 1000);
    };
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e], obs) => { if (e.isIntersecting) { show(); obs.disconnect(); } }, { threshold: 0.2 }).observe(root);
    } else show();

    /* ---------- interação ---------- */
    if (o.interactive) {
      root.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") { hovering = true; kick(); } });
      root.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") { hovering = false; active = -1; kick(); } });
      cards.forEach((c, i) => {
        c.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") setActive(i); });
        // foco só pelo teclado ativa o card; no toque/clique quem decide é o handler de click
        c.addEventListener("pointerdown", () => { pointerFocus = true; setTimeout(() => { pointerFocus = false; }, 400); });
        c.addEventListener("focus", () => { if (!pointerFocus) setActive(i); });
        // no toque: o 1º toque escolhe o celular, o 2º abre o projeto
        c.addEventListener("click", (e) => { if (touch && active !== i) { e.preventDefault(); setActive(i); } });
      });
      root.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        const next = Math.max(0, Math.min(n - 1, (active < 0 ? 0 : active) + (e.key === "ArrowRight" ? 1 : -1)));
        cards[next].focus();
      });
    }

    geometry();
    render();
    let rz = 0;
    addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(geometry, 120); });

    return {
      select: (i) => { setActive(((i % n) + n) % n); },
      get active() { return active; },
      count: n,
    };
  }

  window.CardSpread = CardSpread;
})();

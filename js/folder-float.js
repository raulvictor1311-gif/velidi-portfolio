/* FolderFloat — port em JavaScript puro do componente React Bits "FolderFloat" (variante JS-CSS).
 * Mesma lógica do original: layout das notas, abertura com mola, física com Matter.js (arrastar/soltar),
 * deriva suave, Esc para fechar. Diferenças: sem React; itens podem ser links ({ label, href });
 * no toque, a pasta abre/fecha com um toque e fecha ao tocar fora.
 *
 *   FolderFloat(elemento, { items, label, sublabel, trigger, closeOnSelect, physics, drift, onSelect, onOpenChange,
 *                            folderColor, frontColor, paperColor, itemColor, itemTextColor, labelColor,
 *                            width, height, radius, spread, lift, tilt, flapAngle, restAngle,
 *                            openDuration, stagger, bounce })
 * Requer window.Matter (matter-js 0.20) para a física; sem ele, as notas só flutuam em CSS. */
(() => {
  "use strict";

  const PAD = 28, CHAR = 6.8, GAP = 12, ROW = 52, DRAG_MIN = 4, ZONE_PAD = 8;

  const jitter = (i) => { const x = Math.sin(i * 12.9898 + 4.1414) * 43758.5453; return x - Math.floor(x); };

  const layout = (list, spread, lift, tilt, sizes) => {
    const rows = [];
    let row = [], width = 0;
    list.forEach((item, i) => {
      const pw = sizes[i]?.w ?? PAD + item.label.length * CHAR;
      if (row.length && width + GAP + pw > spread * 2) { rows.push({ items: row, width }); row = []; width = 0; }
      row.push({ i, pw });
      width += (row.length > 1 ? GAP : 0) + pw;
    });
    if (row.length) rows.push({ items: row, width });
    const pos = [];
    rows.forEach((r, ri) => {
      let x = -r.width / 2;
      const shift = (ri % 2 ? 1 : -1) * Math.min(16, spread * 0.1);
      r.items.forEach(({ i, pw }) => {
        const j = jitter(i);
        pos[i] = { x: x + pw / 2 + shift + (j - 0.5) * 6, y: -lift - ri * ROW - j * 6, r: tilt * (j * 2 - 1) };
        x += pw + GAP;
      });
    });
    return { pos, rows: rows.length };
  };

  const DEFAULTS = {
    items: [], label: "", sublabel: "", trigger: "hover", defaultOpen: false, closeOnSelect: true, physics: true, drift: 0.5,
    onSelect: null, onOpenChange: null,
    folderColor: "#3f3f46", frontColor: "#52525b", paperColor: "#f5f5f5", itemColor: "#f5f5f5", itemTextColor: "#18181b", labelColor: "#f5f5f5",
    width: 200, height: 148, radius: 14, spread: 180, lift: 26, tilt: 8, flapAngle: 34, restAngle: 16,
    openDuration: 520, stagger: 45, bounce: 0.3,
  };

  function FolderFloat(root, options) {
    const o = Object.assign({}, DEFAULTS, options);
    const M = window.Matter;
    const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
    const list = o.items.map((it) => (typeof it === "string" ? { label: it, value: it } : { value: it.label, ...it }));
    const n = list.length;
    const sub = o.sublabel || `${n} ${n === 1 ? "nota" : "notas"}`;

    let open = false, sizes = [], pos = [], spread = o.spread;
    let liveTimer = 0, popTimer = 0, lastPointer = "mouse", dragMoved = false;
    const w = { engine: null, bodies: [], sizes: [], raf: 0, last: 0, t0: 0, drag: null, zone: null, live: false };

    /* ---------- DOM ---------- */
    root.classList.add("folder-float");
    root.dataset.trigger = o.trigger;
    if (o.physics) root.dataset.physics = "";
    const vars = {
      "--ff-w": `${o.width}px`, "--ff-h": `${o.height}px`, "--ff-r": `${o.radius}px`,
      "--ff-back": o.folderColor, "--ff-front": o.frontColor, "--ff-paper": o.paperColor,
      "--ff-item": o.itemColor, "--ff-item-ink": o.itemTextColor, "--ff-label": o.labelColor,
      "--ff-lift": `${o.lift}px`, "--ff-angle": `${o.flapAngle}deg`, "--ff-rest": `${o.restAngle}deg`,
      "--ff-open": `${o.openDuration}ms`, "--ff-close": `${Math.round(o.openDuration * 0.6)}ms`, "--ff-stagger": `${o.stagger}ms`,
      "--ff-n": n, "--ff-spring": `cubic-bezier(0.34, ${(1 + o.bounce * 1.9).toFixed(2)}, 0.64, 1)`,
    };
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));

    const anchor = document.createElement("div");
    anchor.className = "folder-float__items";
    const pills = list.map((item, i) => {
      const el = document.createElement(item.href ? "a" : "button");
      el.className = "folder-float__item" + (item.accent ? " folder-float__item--accent" : "");
      if (item.href) { el.href = item.href; el.target = "_blank"; el.rel = "noopener"; } else el.type = "button";
      el.tabIndex = -1;
      el.setAttribute("aria-hidden", "true");
      el.style.setProperty("--i", i);
      const s = document.createElement("span");
      s.className = "folder-float__drift";
      s.textContent = item.label;
      el.appendChild(s);
      anchor.appendChild(el);
      return el;
    });

    const folder = document.createElement("div");
    folder.className = "folder-float__folder";
    folder.innerHTML =
      '<span class="folder-float__back" aria-hidden="true"></span>' +
      '<span class="folder-float__paper" aria-hidden="true"></span>' +
      '<span class="folder-float__front" aria-hidden="true"><span class="folder-float__label"></span><span class="folder-float__sub"></span></span>' +
      '<button type="button" class="folder-float__trigger" aria-expanded="false"></button>';
    folder.querySelector(".folder-float__label").textContent = o.label;
    folder.querySelector(".folder-float__sub").textContent = sub;
    const trigger = folder.querySelector(".folder-float__trigger");
    trigger.setAttribute("aria-label", `${o.label}, ${sub}`);
    root.append(anchor, folder);

    /* ---------- posições ---------- */
    const place = () => {
      const res = layout(list, spread, o.lift, o.tilt, sizes);
      pos = res.pos;
      root.style.setProperty("--ff-spread", `${spread}px`);
      root.style.setProperty("--ff-room", `${o.lift + res.rows * ROW + 12}px`);
      if (w.live) return;
      pills.forEach((el, i) => {
        el.style.setProperty("--x", `${pos[i].x.toFixed(1)}px`);
        el.style.setProperty("--y", `${pos[i].y.toFixed(1)}px`);
        el.style.setProperty("--r", `${pos[i].r.toFixed(2)}deg`);
      });
    };
    const measure = () => {
      const next = pills.map((el) => ({ w: el.offsetWidth, h: el.offsetHeight }));
      if (next.some((s) => !s.w)) return;
      sizes = next;
      place();
    };
    const fitSpread = () => {
      // no celular, a nuvem de notas não passa da largura da tela
      const max = Math.max(110, Math.floor(innerWidth / 2) - 20);
      const next = Math.min(o.spread, max);
      if (next !== spread) { spread = next; place(); }
    };
    place();
    fitSpread();
    measure();
    document.fonts?.ready.then(measure);
    let rz = 0;
    addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { fitSpread(); measure(); }, 150); });

    /* ---------- física (Matter.js) ---------- */
    const stopPhysics = () => {
      clearTimeout(liveTimer);
      cancelAnimationFrame(w.raf);
      w.raf = 0;
      if (w.engine && M) {
        w.bodies.forEach((b, i) => {
          pills[i].style.setProperty("--x", `${b.position.x.toFixed(1)}px`);
          pills[i].style.setProperty("--y", `${(b.position.y - w.sizes[i].h / 2).toFixed(1)}px`);
        });
        M.Composite.clear(w.engine.world, false, true);
        M.Engine.clear(w.engine);
        w.engine = null;
      }
      w.bodies = [];
      w.drag = null;
      w.live = false;
      delete root.dataset.live;
      // ao fechar, as notas voltam para a posição de layout
      place();
    };

    const startPhysics = () => {
      if (w.engine || !M) return;
      const { Bodies, Body, Composite, Engine } = M;
      const engine = Engine.create({ gravity: { x: 0, y: 0 } });
      engine.enableSleeping = false;
      w.engine = engine;
      w.sizes = pills.map((el) => ({ w: el.offsetWidth, h: el.offsetHeight }));
      const ys = pos.map((p) => p.y);
      const zone = { left: -spread - ZONE_PAD, right: spread + ZONE_PAD, top: Math.min(...ys) - ZONE_PAD, bottom: -o.lift + Math.max(...w.sizes.map((s) => s.h)) };
      w.zone = zone;
      w.bodies = pills.map((el, i) => {
        const { w: bw, h: bh } = w.sizes[i];
        const b = Bodies.rectangle(pos[i].x, pos[i].y + bh / 2, bw, bh, { chamfer: { radius: Math.min(bh / 2 - 1, 16) }, restitution: 0.55, friction: 0, frictionAir: 0.08, inertia: Infinity });
        b.plugin = { phase: jitter(i) * Math.PI * 2 };
        return b;
      });
      const T = 80;
      const walls = [
        Bodies.rectangle((zone.left + zone.right) / 2, zone.top - T / 2, zone.right - zone.left + 2 * T, T, { isStatic: true }),
        Bodies.rectangle((zone.left + zone.right) / 2, zone.bottom + T / 2, zone.right - zone.left + 2 * T, T, { isStatic: true }),
        Bodies.rectangle(zone.left - T / 2, (zone.top + zone.bottom) / 2, T, zone.bottom - zone.top + 2 * T, { isStatic: true }),
        Bodies.rectangle(zone.right + T / 2, (zone.top + zone.bottom) / 2, T, zone.bottom - zone.top + 2 * T, { isStatic: true }),
      ];
      Composite.add(engine.world, [...w.bodies, ...walls]);
      w.live = true;
      w.last = 0;
      w.t0 = performance.now();
      root.dataset.live = "";
      const tick = (now) => {
        if (!w.engine) return;
        const dt = w.last ? Math.min(32, now - w.last) : 16;
        w.last = now;
        const t = (now - w.t0) / 1000;
        const k = o.drift * 0.00005 * Math.min(1, t / 2);
        w.bodies.forEach((b, i) => {
          if (w.drag && w.drag.i === i) return;
          const ph = b.plugin.phase;
          Body.applyForce(b, b.position, { x: Math.sin(t * 0.9 + ph) * k * b.mass, y: Math.cos(t * 1.3 + ph * 1.7) * k * b.mass });
        });
        Engine.update(w.engine, dt);
        w.bodies.forEach((b, i) => {
          pills[i].style.setProperty("--x", `${b.position.x.toFixed(1)}px`);
          pills[i].style.setProperty("--y", `${(b.position.y - w.sizes[i].h / 2).toFixed(1)}px`);
        });
        w.raf = requestAnimationFrame(tick);
      };
      w.raf = requestAnimationFrame(tick);
    };

    /* ---------- abrir / fechar ---------- */
    const set = (next) => {
      if (next === open) return;
      open = next;
      if (open) root.dataset.open = ""; else delete root.dataset.open;
      trigger.setAttribute("aria-expanded", String(open));
      pills.forEach((el) => { el.tabIndex = open ? 0 : -1; el.setAttribute("aria-hidden", String(!open)); });
      clearTimeout(liveTimer);
      if (!open) stopPhysics();
      else if (o.physics && M && !reduce()) liveTimer = setTimeout(startPhysics, o.openDuration + (n - 1) * o.stagger + 80);
      o.onOpenChange && o.onOpenChange(open);
    };

    const pick = (item, i) => {
      o.onSelect && o.onSelect(item.value, i, item);
      clearTimeout(popTimer);
      pills[i].dataset.pop = "";
      popTimer = setTimeout(() => delete pills[i].dataset.pop, 320);
      if (o.closeOnSelect) setTimeout(() => set(false), item.href ? 120 : 0);
    };

    /* ---------- ponteiro ---------- */
    const pointerAt = (e) => { const r = anchor.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    pills.forEach((el, i) => {
      el.addEventListener("pointerdown", (e) => {
        if (!w.live || e.button !== 0) return;
        const b = w.bodies[i];
        if (!b) return;
        const p = pointerAt(e);
        w.drag = { i, id: e.pointerId, dx: b.position.x - p.x, dy: b.position.y - p.y, sx: e.clientX, sy: e.clientY, moved: false };
        try { el.setPointerCapture(e.pointerId); } catch (_) {}
      });
      el.addEventListener("pointermove", (e) => {
        const d = w.drag;
        if (!d || d.i !== i || d.id !== e.pointerId) return;
        if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) >= DRAG_MIN) { d.moved = true; el.dataset.drag = ""; }
        if (!d.moved) return;
        e.preventDefault();
        const b = w.bodies[i];
        const { w: bw, h: bh } = w.sizes[i];
        const z = w.zone;
        const p = pointerAt(e);
        const x = Math.min(z.right - bw / 2, Math.max(z.left + bw / 2, p.x + d.dx));
        const y = Math.min(z.bottom - bh / 2, Math.max(z.top + bh / 2, p.y + d.dy));
        M.Body.setVelocity(b, { x: (x - b.position.x) * 0.6, y: (y - b.position.y) * 0.6 });
        M.Body.setPosition(b, { x, y });
      });
      const up = (e) => {
        const d = w.drag;
        if (!d || d.i !== i || d.id !== e.pointerId) return;
        w.drag = null;
        dragMoved = d.moved;
        delete el.dataset.drag;
        try { el.releasePointerCapture(e.pointerId); } catch (_) {}
      };
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
      el.addEventListener("dragstart", (e) => e.preventDefault());
      el.addEventListener("click", (e) => {
        if (dragMoved) { dragMoved = false; e.preventDefault(); return; }   // foi um arraste, não um clique
        pick(list[i], i);
      });
    });

    root.addEventListener("pointerenter", (e) => { lastPointer = e.pointerType; if (o.trigger === "hover" && e.pointerType === "mouse") set(true); });
    root.addEventListener("pointerleave", (e) => { if (o.trigger === "hover" && e.pointerType === "mouse" && !w.drag) set(false); });
    trigger.addEventListener("pointerdown", (e) => { lastPointer = e.pointerType; });
    trigger.addEventListener("click", () => {
      // com o mouse a pasta já abriu no hover; o clique não deve fechá-la
      if (o.trigger === "hover" && lastPointer === "mouse" && open) return;
      set(!open);
    });
    root.addEventListener("keydown", (e) => { if (e.key === "Escape" && open) { e.stopPropagation(); set(false); trigger.focus(); } });
    document.addEventListener("pointerdown", (e) => { if (open && !root.contains(e.target)) set(false); });

    if (o.defaultOpen) set(true);
    return { open: () => set(true), close: () => set(false), toggle: () => set(!open), relayout: measure };
  }

  window.FolderFloat = FolderFloat;
})();

/* Komodo & Ko. — home page scroll story.
   Scroll progress (0 to 1) through the pinned stage drives four beats: hero, camera
   push into Padar with the promise statement, landscape with hotspots, and the
   Komodo dragon. Performance rules: only transform and opacity change per frame
   (no blur filters), layout is measured once per resize (never per frame), styles
   are only written when they change, and the loop sleeps when nothing is moving. */
(function () {
  "use strict";
  var story = document.getElementById("story");
  if (!story) return;
  function q(s) { return story.querySelector(s); }
  function qa(s) { return Array.prototype.slice.call(story.querySelectorAll(s)); }

  var cam = q(".cam"), plate = q(".plate"), shade = q(".shade"), fog = q(".fog"), night = q(".night");
  var camF = q(".camF"), plateF = q(".plateF"), veil = q(".veil"), veilB = q(".veil-b");
  var L0 = q(".L0"), L1 = q(".L1"), L2 = q(".L2"), L3 = q(".L3"), L4 = q(".L4");
  var heroCopy = q(".hero-copy"), hud = q(".hud"), cap = q(".caption"), hint = q(".hint");
  var vWords = qa(".vision h2 .w"), vChip = q(".vision .label"), vP = q(".vision p");
  var aWords = qa(".acct .w"), spots = qa(".spot");
  var dragon = q(".dragon"), dcard = q(".dcard"), stCopy = q(".st-copy"), num = q("[data-num]");
  var bar = q(".prog i");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

  function clamp(v, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return Math.min(b, Math.max(a, v)); }
  function seg(p, a, b) { return clamp((p - a) / (b - a)); }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  /* write a style only when it actually changes */
  function set(el, prop, val) {
    var key = "_" + prop;
    if (el[key] !== val) { el[key] = val; el.style[prop] = val; }
  }
  function op(el, v) { set(el, "opacity", v <= 0.001 ? "0" : v >= 0.999 ? "1" : v.toFixed(3)); }
  function vis(el, on) { set(el, "visibility", on ? "visible" : "hidden"); }
  function tr(x, y, s) {
    return "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)" + (s === undefined ? "" : " scale(" + s.toFixed(4) + ")");
  }

  /* Geometry, measured on load and resize only */
  var G = null, storyTop = 0, total = 1;
  function geo() {
    var pw = plate.offsetWidth, ph = plate.offsetHeight, pt = plate.offsetTop;
    var iw = plate.naturalWidth || 2400, ih = plate.naturalHeight || 1600;
    var k = Math.max(pw / iw, ph / ih), dw = iw * k, dh = ih * k, ox = (pw - dw) / 2;
    function map(fx, fy) { return [ox + fx * dw, pt + fy * dh]; }
    var v = map(0.5, 0.6);
    cam.style.transformOrigin = camF.style.transformOrigin = v[0] + "px " + v[1] + "px";
    plateF.style.setProperty("--mw", dw + "px");
    plateF.style.setProperty("--mh", dh + "px");
    plateF.style.setProperty("--mx", ox + "px");
    G = { W: innerWidth, H: innerHeight, cl: cam.offsetLeft, ct: cam.offsetTop, map: map, vx: v[0], vy: v[1] };
    if (hud) {
      var hp = map(0.52, 0.60);
      hud.style.left = (G.cl + hp[0]).toFixed(0) + "px";
      hud.style.top = (G.ct + hp[1]).toFixed(0) + "px";
    }
    layoutHero();
    spots.forEach(function (s) {
      var m = map(parseFloat(s.getAttribute("data-x")), parseFloat(s.getAttribute("data-y")));
      s._x = m[0]; s._y = m[1];
    });
    storyTop = story.getBoundingClientRect().top + window.pageYOffset;
    total = Math.max(1, story.offsetHeight - innerHeight);
    wake();
  }
  /* Place the one-line headline so the main peak overlaps the lower part of its letters */
  function layoutHero() {
    var h1 = heroCopy.querySelector("h1"), line = h1.querySelector(".ln span");
    if (innerWidth < 961) { heroCopy.style.top = ""; h1.style.fontSize = ""; return; }
    var fs = Math.min(104, innerWidth * 0.064);
    h1.style.fontSize = fs + "px";
    var w = line.offsetWidth, max = innerWidth * 0.88;
    if (w > max) { fs = fs * max / w; h1.style.fontSize = fs + "px"; }
    var peakY = G.ct + G.map(0.82, 0.305)[1];
    var navH = document.querySelector(".nav").offsetHeight;
    var top = peakY + fs * 0.36 - heroCopy.offsetHeight;
    heroCopy.style.top = Math.max(navH + 12, top).toFixed(0) + "px";
  }

  spots.forEach(function (s) {
    s.addEventListener("click", function () {
      var on = !s.classList.contains("on");
      spots.forEach(function (o) { o.classList.remove("on"); });
      s.classList.toggle("on", on);
    });
  });

  /* The loop only runs while something is still moving */
  var sp = 0, sx = 0, sy = 0, mx = 0, my = 0, last = 0, running = false, lastNum = -1;
  function progress() { return clamp((window.pageYOffset - storyTop) / total); }
  function wake() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }
  addEventListener("scroll", wake, { passive: true });
  if (finePointer && !reduce) {
    addEventListener("pointermove", function (e) { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; wake(); }, { passive: true });
  }

  function frame(now) {
    var dt = Math.min(48, now - last); last = now;
    var p = progress();
    /* follow the scroll closely; just enough easing to smooth out mouse-wheel steps */
    if (reduce) sp = p;
    else { sp += (p - sp) * (1 - Math.pow(0.7, dt / 16.7)); if (Math.abs(p - sp) < 0.0003) sp = p; }
    sx += (mx - sx) * 0.08; sy += (my - sy) * 0.08;
    var settled = sp === p && Math.abs(mx - sx) < 0.002 && Math.abs(my - sy) < 0.002;

    var inView = window.pageYOffset < storyTop + total + G.H;
    if (inView) render();
    if (settled || !inView) { running = false; return; }
    requestAnimationFrame(frame);
  }

  function render() {
    var W = G.W, H = G.H;

    /* Camera push into the island */
    var vp = ease(seg(sp, 0.03, 0.6));
    var s = 1 + vp * 0.85;
    var tx = -sx * 14 + (W * 0.5 - (G.cl + G.vx)) * vp * 0.6;
    var ty = -sy * 10 + (H * 0.55 - (G.ct + G.vy)) * vp * 0.8;
    var camT = tr(tx, ty, s);
    set(cam, "transform", camT);

    /* Hero: headline lifts and fades as the camera moves in */
    var h = seg(sp, 0.01, 0.09);
    set(heroCopy, "transform", tr(-sx * 8, -h * 90 - sy * 5, 1 + h * 0.08));
    op(heroCopy, 1 - h);
    if (hud) { set(hud, "transform", tr(sx * 20, sy * 14 - h * 40)); op(hud, 1 - seg(sp, 0.01, 0.06)); }
    var c = 1 - seg(sp, 0.005, 0.04);
    op(cap, c); op(hint, c);
    vis(L0, h < 1); vis(L1, h < 1);
    op(veil, 1 - h); op(veilB, c);
    vis(camF, h < 1);
    if (h < 1) set(camF, "transform", camT);

    /* Promise statement: words rise into place */
    var vIn = seg(sp, 0.1, 0.2), vOut = seg(sp, 0.29, 0.37);
    var vOn = vIn > 0 && vOut < 1;
    vis(L2, vOn);
    if (vOn) {
      vWords.forEach(function (w, i) {
        var k = ease(clamp(vIn * 1.6 - i * 0.07));
        set(w, "transform", tr(0, (1 - k) * 26 - vOut * 50));
        op(w, k * (1 - vOut));
      });
      var cp = clamp(vIn * 2 - 0.6) * (1 - vOut);
      op(vChip, cp); op(vP, cp);
      set(vChip, "transform", tr(0, -vOut * 40)); set(vP, "transform", tr(0, -vOut * 40));
    }
    op(shade, clamp(vIn * 1.5) * (1 - vOut));

    /* Soft mist behind the paragraph */
    var fg = ease(seg(sp, 0.35, 0.44)) * (1 - seg(sp, 0.6, 0.66));
    vis(fog, fg > 0);
    if (fg > 0) { op(fog, fg); set(fog, "transform", "translate3d(" + ((fg - 1) * 18).toFixed(2) + "vw,0,0)"); }

    /* Paragraph + hotspots */
    var aIn = seg(sp, 0.38, 0.48), aOut = seg(sp, 0.58, 0.64);
    var aOn = aIn > 0 && aOut < 1;
    vis(L3, aOn);
    if (aOn) {
      var n = aWords.length;
      aWords.forEach(function (w, i) { op(w, (0.12 + 0.88 * clamp(aIn * 2.2 - (i / n) * 1.2)) * (1 - aOut)); });
    }
    spots.forEach(function (sEl, i) {
      var k = aOn ? seg(sp, 0.43 + i * 0.02, 0.47 + i * 0.02) * (1 - aOut) : 0;
      var X = G.cl + G.vx + (sEl._x - G.vx) * s + tx;
      var Y = G.ct + G.vy + (sEl._y - G.vy) * s + ty;
      var on = k > 0.01 && X > 8 && X < W - 40 && Y > 60 && Y < H - 40;
      vis(sEl, on);
      if (on) set(sEl, "transform", tr(X - 12, Y - 12, k));
    });

    /* Station: Komodo dragon */
    var nIn = ease(seg(sp, 0.62, 0.72));
    op(night, nIn); vis(night, nIn > 0); vis(L4, nIn > 0);
    if (nIn > 0) {
      var dIn = ease(seg(sp, 0.66, 0.78));
      op(dragon, dIn);
      set(dragon, "transform", tr(sx * -10, (1 - dIn) * 70 + sy * -8, 0.95 + 0.05 * dIn));
      var cIn = ease(seg(sp, 0.72, 0.84));
      op(dcard, cIn);
      set(dcard, "transform", tr(sx * -8, (1 - cIn) * 44));
      var nv = Math.round(3 * seg(sp, 0.74, 0.86));
      if (nv !== lastNum) { num.textContent = nv; lastNum = nv; }
      var sIn = ease(seg(sp, 0.68, 0.8));
      op(stCopy, sIn);
      set(stCopy, "transform", tr(0, (1 - sIn) * 28));
    }

    set(bar, "transform", "scaleX(" + sp.toFixed(3) + ")");
  }

  geo();
  addEventListener("resize", geo);
  addEventListener("load", geo);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(geo);
  if (!plate.complete) plate.addEventListener("load", geo);
})();

// The authors' medal in 3-D, as the simulator's own (template/js/author.js, medal(): copied whole, its helpers too),
// for the opening's check: S2S_MEDAL3D(host, a, q, who, date) makes it in host (it spins in, then turns front, back,
// front), and returns { set, stop }.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";
const AU_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Inter, Arial, sans-serif';
const title = (window.S2S_PAPER && window.S2S_PAPER.title) || "";
  const ACC = ["#0a4a28", "#19a85a", "#a6f7c4"], QUAL = ["#112761", "#2f6ee8", "#bcd5ff"], MARK = "#ff5a0a";
  const SEG = { a: [[[32, 32], [26, 30], [20, 28], [20, 22]], [[20, 22], [20, 9.5], [44, 9.5], [44, 21]]], q: [[[32, 32], [38, 34], [44, 36], [44, 42]], [[44, 42], [44, 54.5], [20, 54.5], [20, 43]]] };
  function sample(segs, n = 120) {
    const pts = []; segs.forEach((s, si) => { for (let i = si ? 1 : 0; i <= n; i++) { const t = i / n, u = 1 - t; pts.push([0, 1].map((d) => u * u * u * s[0][d] + 3 * u * u * t * s[1][d] + 3 * u * t * t * s[2][d] + t * t * t * s[3][d])); } });
    const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { pts, L, len: L[L.length - 1] };
  }
  const PATHS = { a: sample(SEG.a), q: sample(SEG.q) };
  const at = (P, f) => { const d = f * P.len; let i = P.L.findIndex((v) => v >= d); if (i < 1) i = 1; const k = (d - P.L[i - 1]) / ((P.L[i] - P.L[i - 1]) || 1), p0 = P.pts[i - 1], p1 = P.pts[i], tx = p1[0] - p0[0], ty = p1[1] - p0[1], tl = Math.hypot(tx, ty) || 1; return { x: p0[0] + tx * k, y: p0[1] + ty * k, tx: tx / tl, ty: ty / tl }; };
  const upto = (P, f) => { const d = f * P.len, out = []; for (let i = 0; i < P.pts.length && P.L[i] <= d; i++) out.push(P.pts[i]); const e = at(P, f); out.push([e.x, e.y]); return out; };
  const op = (v) => v ? 0.3 + 0.7 * (Math.min(5, Math.max(1, v)) - 1) / 4 : 0, frac = (v) => v ? Math.min(5, Math.max(0, v)) / 5 : 0;
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const ramp = (c, t) => { const [a, b, d] = c.map(hex), s = t < .5 ? t / .5 : (t - .5) / .5, p = t < .5 ? a : b, q = t < .5 ? b : d; return p.map((v, i) => v + (q[i] - v) * s); };
  const shade = (c, t) => ramp(c, (Math.min(9, Math.floor(t * 10 + 1e-6)) + .5) / 10); // one shade for each half point
  const rgb = (c) => `rgb(${c.map((v) => Math.round(v * 255)).join(",")})`;
  const squircle = (n = 160, r = 1, e = 4.2) => { const p = []; for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2, c = Math.cos(t), s = Math.sin(t); p.push([r * Math.sign(c) * Math.pow(Math.abs(c), 2 / e), r * Math.sign(s) * Math.pow(Math.abs(s), 2 / e)]); } return p; };
  function medal(host) {
    let renderer, scene, cam, grp, dyn, backCv, backTex, target = null, lastFlip = 0, ease = .12, rotY = -0.45, rotX = 0.1, vY = 0, vX = 0, dragging = false, moved = 0, last = null, spinIn = 1;
    const HALF = 1.25, DEPTH = .16, FZ = DEPTH / 2 + .07, R = .11, SC = 1 / 31, LIFT = .13, reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const v3 = (p, z = FZ + R * .55) => new THREE.Vector3((p[0] - 32) * SC, -(p[1] - 32) * SC + LIFT, z);
    const SRGB = THREE.SRGBColorSpace;
    const faceGeo = (r, z, flip) => { const g = new THREE.ShapeGeometry(new THREE.Shape(squircle(160, r).map(([x, y]) => new THREE.Vector2(x, y))), 64), P = g.attributes.position, uv = g.attributes.uv;
      for (let i = 0; i < P.count; i++) uv.setXY(i, (P.getX(i) / r + 1) / 2, (P.getY(i) / r + 1) / 2); g.translate(0, 0, z); if (flip) g.rotateY(Math.PI); return g; };
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1)); renderer.outputColorSpace = SRGB; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; host.append(renderer.domElement);
    scene = new THREE.Scene(); cam = new THREE.PerspectiveCamera(28, 1, .1, 50); cam.position.set(0, 0, 7);
    const env = new THREE.Scene(); env.add(new THREE.Mesh(new THREE.BoxGeometry(12, 12, 12), new THREE.MeshBasicMaterial({ color: 0x1d2026, side: THREE.BackSide })));
    [[0, 5.5, 0, 8, 2, 3.6], [-5.5, 1, 2, 1.4, 6, 3], [5.5, -1, 1, 1.4, 5, 1.6], [0, 0, 5.8, 6, 2.4, 1.1], [0, -5.5, 0, 6, 2, .5], [3, 3, 4, 1, 1, 4]].forEach(([x, y, z, w, h, i]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(i, i, i), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m); });
    const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(env, .03).texture;
    const key = new THREE.DirectionalLight(0xffffff, .8 * Math.PI); key.position.set(-2, 3, 4); scene.add(key);
    grp = new THREE.Group(); scene.add(grp);
    // the rim, one smooth grid swept round the rounded square
    const HZ = DEPTH / 2 + .09, WB = .1, NO = 320, NP = 40, out = squircle(NO, HALF), pos = [], idx = [];
    const nrm = out.map((p, i) => { const a = out[(i + NO - 1) % NO], b = out[(i + 1) % NO], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dy / l, -dx / l]; });
    for (let i = 0; i < NO; i++) for (let j = 0; j <= NP; j++) { const ph = -Math.PI / 2 + Math.PI * j / NP, c = Math.cos(ph), s = Math.sin(ph), ro = WB * Math.pow(Math.max(0, c), .6), z = HZ * Math.sign(s) * Math.pow(Math.abs(s), .6); pos.push(out[i][0] + nrm[i][0] * ro, out[i][1] + nrm[i][1] * ro, z); }
    for (let i = 0; i < NO; i++) { const i2 = (i + 1) % NO; for (let j = 0; j < NP; j++) { const a = i * (NP + 1) + j, b = i2 * (NP + 1) + j; idx.push(a, b, a + 1, b, b + 1, a + 1); } }
    const rim = new THREE.BufferGeometry(); rim.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); rim.setIndex(idx); rim.computeVertexNormals();
    const silver = new THREE.MeshPhysicalMaterial({ color: 0xe6e9ee, metalness: 1, roughness: .16, clearcoat: .4, side: THREE.DoubleSide }); grp.add(new THREE.Mesh(rim, silver));
    const cap = new THREE.ShapeGeometry(new THREE.Shape(out.map(([x, y]) => new THREE.Vector2(x, y))), 1), capF = cap.clone(), capB = cap.clone();
    capF.translate(0, 0, HZ - .001); capB.rotateY(Math.PI); capB.translate(0, 0, -HZ + .001); grp.add(new THREE.Mesh(capF, silver)); grp.add(new THREE.Mesh(capB, silver));
    // the enamel faces; the name engraved under the S
    const enamelBg = (fx) => { const g = fx.createRadialGradient(380, 300, 40, 512, 512, 760); g.addColorStop(0, "#3d434e"); g.addColorStop(.55, "#1f2228"); g.addColorStop(1, "#0d0f12"); fx.fillStyle = g; fx.fillRect(0, 0, 1024, 1024); };
    const fc = document.createElement("canvas"); fc.width = fc.height = 1024; const fx = fc.getContext("2d"); enamelBg(fx);
    fx.strokeStyle = "rgba(255,255,255,.035)"; fx.lineWidth = 2; for (let r = 30; r < 720; r += 14) { fx.beginPath(); fx.arc(512, 512, r, 0, Math.PI * 2); fx.stroke(); }
    fx.textAlign = "center"; fx.font = `600 50px ${AU_FONT}`; if ("letterSpacing" in fx) fx.letterSpacing = "12px"; fx.fillStyle = "rgba(0,0,0,.55)"; fx.fillText("AUTHOR CERTIFICATION", 518, 925); fx.fillStyle = "#c9ced6"; fx.fillText("AUTHOR CERTIFICATION", 512, 920);
    const ft = new THREE.CanvasTexture(fc); ft.colorSpace = SRGB;
    grp.add(new THREE.Mesh(faceGeo(HALF * .9, DEPTH / 2 + .092), new THREE.MeshPhysicalMaterial({ map: ft, metalness: .2, roughness: .45, clearcoat: 1, clearcoatRoughness: .06 })));
    backCv = document.createElement("canvas"); backCv.width = backCv.height = 1024; backTex = new THREE.CanvasTexture(backCv); backTex.colorSpace = SRGB; backTex.anisotropy = 8;
    grp.add(new THREE.Mesh(faceGeo(HALF * .9, DEPTH / 2 + .092, true), new THREE.MeshPhysicalMaterial({ map: backTex, metalness: .2, roughness: .45, clearcoat: 1, clearcoatRoughness: .06 })));
    // the S in relief: the silver channel the scores grow along
    const track = new THREE.MeshPhysicalMaterial({ color: 0x8b919b, metalness: 1, roughness: .28 });
    ["a", "q"].forEach((m) => { const c = new THREE.CatmullRomCurve3(PATHS[m].pts.filter((_, i) => i % 3 === 0 || i === PATHS[m].pts.length - 1).map((p) => v3(p))); grp.add(new THREE.Mesh(new THREE.TubeGeometry(c, 220, R, 28, false), track)); });
    [PATHS.a.pts[PATHS.a.pts.length - 1], PATHS.q.pts[PATHS.q.pts.length - 1]].forEach((p) => { const s = new THREE.Mesh(new THREE.SphereGeometry(R, 28, 14), track); s.position.copy(v3(p)); grp.add(s); });
    dyn = new THREE.Group(); grp.add(dyn);
    const cv = renderer.domElement; cv.style.touchAction = "none"; cv.style.cursor = "grab"; cv.tabIndex = 0; cv.setAttribute("role", "img");
    const flip = () => { vY = 0; ease = .12; lastFlip = performance.now() + 4000; target = Math.round((rotY + Math.PI) / Math.PI) * Math.PI; };
    cv.addEventListener("pointerdown", (e) => { dragging = true; target = null; ease = .12; lastFlip = performance.now() + 4000; moved = 0; last = [e.clientX, e.clientY, performance.now()]; cv.setPointerCapture(e.pointerId); cv.style.cursor = "grabbing"; });
    cv.addEventListener("pointermove", (e) => { if (!dragging) return; const dx = e.clientX - last[0], dy = e.clientY - last[1], dt = Math.max(8, performance.now() - last[2]);
      rotY += dx * .011; rotX = Math.max(-.7, Math.min(.7, rotX + dy * .006)); vY = dx * .011 / dt * 16; vX = dy * .006 / dt * 16; moved += Math.abs(dx) + Math.abs(dy); last = [e.clientX, e.clientY, performance.now()]; });
    const up = () => { if (!dragging) return; dragging = false; cv.style.cursor = "grab"; if (moved < 5) flip(); };
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
    cv.addEventListener("keydown", (e) => { e.stopPropagation(); if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } if (e.key === "ArrowLeft") vY -= .08; if (e.key === "ArrowRight") vY += .08; });
    const size = () => { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); };
    new ResizeObserver(size).observe(host); size();
    let alive = true;
    const loop = (t) => {
      if (!alive) return;
      if (!dragging) {
        if (target !== null) { rotY += (target - rotY) * ease; if (Math.abs(target - rotY) < .002) { rotY = target; target = null; } }
        else if (Math.abs(vY) > .0005) { rotY += vY; vY *= .955; }
        else if (!reduce) { const side = Math.cos(rotY) < 0 ? Math.PI : 0, rest = Math.round((rotY - side) / (2 * Math.PI)) * 2 * Math.PI + side;
          if (!lastFlip) lastFlip = t;
          if (t - lastFlip > 6500) { lastFlip = t; ease = .035; target = rest + Math.PI; } // left alone: the front, then the back, then the front again
          else rotY += (rest + Math.sin(t / 1500) * .3 - rotY) * .02; }
        rotX += (Math.sin(t / 2100) * .09 + .04 - rotX) * .03 + vX * .2; vX *= .9;
      }
      if (spinIn > 0 && !reduce) spinIn = Math.max(0, spinIn - .011);
      grp.rotation.y = rotY + (reduce ? 0 : Math.pow(spinIn, 2) * Math.PI * 4); grp.rotation.x = rotX;
      renderer.render(scene, cam); requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    const back = (a, q, who, date) => {
      const x = backCv.getContext("2d"), W = 1024; enamelBg(x); x.textAlign = "center";
      const T = (s, y, px, w, c, ls = 0) => { x.font = `${w} ${px}px ${AU_FONT}`; x.fillStyle = c; if ("letterSpacing" in x) x.letterSpacing = ls + "px"; x.fillText(s, W / 2, y); };
      T("SENSE2SIM", 175, 46, 600, "#9aa1ad", 14); T("Author certified", 265, 78, 600, "#f1f3f6");
      const lines = [""]; x.font = "500 46px Inter, system-ui, sans-serif"; if ("letterSpacing" in x) x.letterSpacing = "0px";
      title.split(" ").forEach((w) => { const l = lines[lines.length - 1]; if (x.measureText(l + " " + w).width > 700 && l) lines.push(w); else lines[lines.length - 1] = (l + " " + w).trim(); });
      lines.slice(0, 3).forEach((l, i) => T(l, 350 + i * 58, 46, 500, "#c9ced6"));
      x.fillStyle = "rgba(255,255,255,.16)"; x.fillRect(200, 500, 624, 3);
      const col = (cx, lab, v, c) => { x.font = "600 38px Inter, system-ui, sans-serif"; if ("letterSpacing" in x) x.letterSpacing = "7px"; x.fillStyle = c; x.fillText(lab, cx, 585); x.font = `600 170px ${AU_FONT}`; if ("letterSpacing" in x) x.letterSpacing = "0px"; x.fillText(v ? v.toFixed(1) : "–", cx, 750); };
      col(W * .32, "ACCURATE", a, "#4fd486"); col(W * .68, "QUALITY", q, "#86adff");
      T(who, 850, 54, 600, "#f1f3f6"); T(date, 915, 40, 500, "#9aa1ad"); backTex.needsUpdate = true;
    };
    const set = (a, q, who, date) => {
      cv.setAttribute("aria-label", `Author medal: Accurate ${a ? a.toFixed(1) : "not rated"}, Quality ${q ? q.toFixed(1) : "not rated"} out of 5. Drag to turn it; press it to see the back.`);
      back(a, q, who, date);
      while (dyn.children.length) { const c = dyn.children.pop(); c.geometry.dispose(); c.material.dispose(); }
      [["a", a, ACC], ["q", q, QUAL]].forEach(([m, v, col]) => { const f = frac(v); if (f < .01) return;
        const pts = upto(PATHS[m], f), sparse = pts.filter((_, i) => i % 2 === 0 || i === pts.length - 1), N = Math.max(16, Math.round(240 * f)), RS = 28;
        const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sparse.map((p) => v3(p))), N, R * 1.025, RS, false), cols = new Float32Array(geo.attributes.position.count * 3);
        for (let i = 0; i <= N; i++) { const c = shade(col, Math.max(0, f * i / N - 1e-4)).map((u) => Math.pow(u, 2.2)); for (let j = 0; j <= RS; j++) cols.set(c, (i * (RS + 1) + j) * 3); }
        geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
        dyn.add(new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ vertexColors: true, metalness: .1, roughness: .3, clearcoat: 1, clearcoatRoughness: .05, transparent: true, opacity: op(v), depthWrite: op(v) > .95 })));
        const end = at(PATHS[m], Math.max(.004, f - .002)), mc = new THREE.Color(MARK);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(R * 1.06, .026, 16, 48), new THREE.MeshPhysicalMaterial({ color: mc, metalness: 0, roughness: .3, clearcoat: 1, clearcoatRoughness: .05, emissive: mc, emissiveIntensity: .45, toneMapped: false }));
        ring.position.copy(v3([end.x, end.y])); ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(end.tx, -end.ty, 0)); dyn.add(ring);
      });
      const hub = new THREE.Mesh(new THREE.SphereGeometry(R * 1.08, 28, 14), new THREE.MeshPhysicalMaterial({ color: 0xf2f4f7, metalness: 1, roughness: .1 })); hub.position.copy(v3([32, 32])); dyn.add(hub);
    };
    // closed: its WebGL context given back at once (a browser keeps about sixteen: left to the collector, a certificate
    // opened many times would take the page's own scene's)
    return { set, stop() { alive = false; pm.dispose(); renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) {} renderer.domElement.remove(); } };
  }
window.S2S_MEDAL3D = (host, a, q, who, date) => { const M = medal(host); if (M) M.set(a, q, who, date); return M; };
window.dispatchEvent(new Event("s2s-medal3d"));

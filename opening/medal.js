/* The authors' medal, as the simulator's own (template/js/author.js, flat): an S in two strokes on a silver squircle,
   the upper stroke growing with Accurate, the lower with Quality, each to its score (a shade for each half point, an
   orange mark where it stops). S2S_MEDAL(canvas, a, q) draws it growing from nothing over about two seconds; call it
   again to play it again. */
(function () {
  var ACC = ["#0a4a28", "#19a85a", "#a6f7c4"], QUAL = ["#112761", "#2f6ee8", "#bcd5ff"], MARK = "#ff5a0a";
  var SEG = { a: [[[32, 32], [26, 30], [20, 28], [20, 22]], [[20, 22], [20, 9.5], [44, 9.5], [44, 21]]], q: [[[32, 32], [38, 34], [44, 36], [44, 42]], [[44, 42], [44, 54.5], [20, 54.5], [20, 43]]] };
  function sample(segs, n) {
    n = n || 120; var pts = [];
    segs.forEach(function (s, si) { for (var i = si ? 1 : 0; i <= n; i++) { var t = i / n, u = 1 - t; pts.push([0, 1].map(function (d) { return u * u * u * s[0][d] + 3 * u * u * t * s[1][d] + 3 * u * t * t * s[2][d] + t * t * t * s[3][d]; })); } });
    var L = [0]; for (var i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts: pts, L: L, len: L[L.length - 1] };
  }
  var PATHS = { a: sample(SEG.a), q: sample(SEG.q) };
  function at(P, f) { var d = f * P.len, i = P.L.findIndex(function (v) { return v >= d; }); if (i < 1) i = 1; var k = (d - P.L[i - 1]) / ((P.L[i] - P.L[i - 1]) || 1), p0 = P.pts[i - 1], p1 = P.pts[i], tx = p1[0] - p0[0], ty = p1[1] - p0[1], tl = Math.hypot(tx, ty) || 1; return { x: p0[0] + tx * k, y: p0[1] + ty * k, tx: tx / tl, ty: ty / tl }; }
  function upto(P, f) { var d = f * P.len, out = []; for (var i = 0; i < P.pts.length && P.L[i] <= d; i++) out.push(P.pts[i]); var e = at(P, f); out.push([e.x, e.y]); return out; }
  var op = function (v) { return v ? 0.3 + 0.7 * (Math.min(5, Math.max(1, v)) - 1) / 4 : 0; }, frac = function (v) { return v ? Math.min(5, Math.max(0, v)) / 5 : 0; };
  var hex = function (h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16) / 255; }); };
  function ramp(c, t) { var x = c.map(hex), s = t < 0.5 ? t / 0.5 : (t - 0.5) / 0.5, p = t < 0.5 ? x[0] : x[1], q = t < 0.5 ? x[1] : x[2]; return p.map(function (v, i) { return v + (q[i] - v) * s; }); }
  function shade(c, t) { return ramp(c, (Math.min(9, Math.floor(t * 10 + 1e-6)) + 0.5) / 10); }
  function rgb(c) { return "rgb(" + c.map(function (v) { return Math.round(v * 255); }).join(",") + ")"; }
  function squircle(n, r, e) { e = e || 4.2; var p = []; for (var i = 0; i < n; i++) { var t = i / n * Math.PI * 2, c = Math.cos(t), s = Math.sin(t); p.push([r * Math.sign(c) * Math.pow(Math.abs(c), 2 / e), r * Math.sign(s) * Math.pow(Math.abs(s), 2 / e)]); } return p; }
  function draw(cv, a, q, tilt) {
    var x = cv.getContext("2d"), s = cv.width, h = s / 2;
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, s, s);
    // a slow turn: the medal is drawn narrower as it turns, its light moving across it
    x.translate(h, h); x.scale(Math.max(0.08, Math.abs(Math.cos(tilt))), 1); x.translate(-h, -h);
    function sq(r) { x.beginPath(); squircle(96, r).forEach(function (p, i) { if (i) x.lineTo(h + p[0] * h, h + p[1] * h); else x.moveTo(h + p[0] * h, h + p[1] * h); }); x.closePath(); }
    var sh = 0.5 + 0.5 * Math.sin(tilt);
    sq(0.98); var g = x.createLinearGradient(0, 0, s, s); g.addColorStop(0, "#f4f6f9"); g.addColorStop(Math.min(0.95, Math.max(0.05, sh)), "#9aa1ab"); g.addColorStop(1, "#e3e6eb"); x.fillStyle = g; x.fill();
    sq(0.86); g = x.createRadialGradient(h * 0.7, h * 0.55, 0, h, h, h); g.addColorStop(0, "#3a3f49"); g.addColorStop(1, "#14161b"); x.fillStyle = g; x.fill();
    var k = s / 64 * 0.56; x.save(); x.translate(h, h - s * 0.045); x.scale(k, k); x.translate(-32, -32); x.lineCap = "round"; x.lineJoin = "round";
    ["a", "q"].forEach(function (m) { x.beginPath(); PATHS[m].pts.forEach(function (p, i) { if (i) x.lineTo(p[0], p[1]); else x.moveTo(p[0], p[1]); }); x.strokeStyle = "#5d636e"; x.lineWidth = 8.5; x.stroke(); });
    [["a", a, ACC], ["q", q, QUAL]].forEach(function (z) { var f = frac(z[1]); if (!f) return; var pts = upto(PATHS[z[0]], f), n = pts.length;
      x.globalAlpha = op(z[1]); for (var i = 1; i < n; i++) { x.beginPath(); x.moveTo(pts[i - 1][0], pts[i - 1][1]); x.lineTo(pts[i][0], pts[i][1]); x.strokeStyle = rgb(shade(z[2], f * (i - 0.5) / n)); x.lineWidth = 8.5; x.stroke(); } x.globalAlpha = 1;
      var e = at(PATHS[z[0]], Math.max(0.004, f - 0.002)); x.beginPath(); x.moveTo(e.x + e.ty * 4.6, e.y - e.tx * 4.6); x.lineTo(e.x - e.ty * 4.6, e.y + e.tx * 4.6); x.strokeStyle = MARK; x.lineWidth = 1.6; x.lineCap = "butt"; x.stroke(); x.lineCap = "round"; });
    x.restore();
    x.textAlign = "center"; x.font = "600 " + (s * 0.05) + "px -apple-system, Helvetica, Arial, sans-serif"; if ("letterSpacing" in x) x.letterSpacing = s * 0.01 + "px"; x.fillStyle = "#c9ced6"; x.fillText("AUTHOR CERTIFICATION", h, s * 0.87);
  }
  var run = null;
  window.S2S_MEDAL = function (cv, a, q, nums) {
    if (run) cancelAnimationFrame(run.raf);
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches, t0 = performance.now(), R = { raf: 0 }; run = R;
    (function tick(now) {
      var u = reduce ? 1 : Math.min(1, (now - t0) / 2200), e = 1 - Math.pow(1 - u, 3);
      var tilt = reduce ? 0 : u < 1 ? (1 - e) * Math.PI * 2 : Math.sin((now - t0) / 1800) * 0.35;
      draw(cv, a * e, q * e, tilt);
      if (nums) nums.forEach(function (n) { n.el.textContent = (n.v * e).toFixed(1); });
      if (run === R && document.body.contains(cv)) R.raf = requestAnimationFrame(tick);
    })(t0);
  };
  window.S2S_MEDAL_STOP = function () { if (run) cancelAnimationFrame(run.raf); run = null; };
})();

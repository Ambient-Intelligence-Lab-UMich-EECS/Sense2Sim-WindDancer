/* Sense2Sim opening: the 3D assets (the owner, 2026-11-22: “open缺少一页介绍3D assets…基本就是universe里的论文出现的
   object组成 然后用他们构成world 所以放这两个之间”). The things that the papers of the Sensing Universe sense with, or
   sense, made as 3D assets; the Sensing World is built from them. intro.js moves the papers' particles from the stars to
   these shapes, then on to the World.
   S2S_ASSETS.names: the labels, in slot order. S2S_ASSETS.build(count, R): a Float32Array of count × 4 (x, y, z in the
   shape's own units, about -1..1, y up; the slot). Points lie on the surfaces, more of them on the edges (a scan's look).
   This file holds every device word of the opening (tools/check.mjs allows it: the World's things, any paper's). */
(function () {
  "use strict";
  var TAU = Math.PI * 2;
  var NAMES = ["Phone", "Smartwatch", "Smart speaker", "Wi-Fi router", "Camera", "Laptop", "Smart ring", "VR headset", "Earbuds", "Car", "Drone", "Smart glasses"];

  // each shape: a list of parts [weight, sampler(R) → [x, y, z]]
  function boxS(cx, cy, cz, w, h, d) { // a box's faces
    var A = [w * h, w * h, h * d, h * d, w * d, w * d], T = A.reduce(function (a, b) { return a + b; }, 0);
    return [T, function (R) { var r = R() * T, f = 0; while (r > A[f] && f < 5) { r -= A[f]; f++; } var u = R() - 0.5, v = R() - 0.5;
      if (f < 2) return [cx + u * w, cy + v * h, cz + (f ? 0.5 : -0.5) * d]; if (f < 4) return [cx + (f === 3 ? 0.5 : -0.5) * w, cy + u * h, cz + v * d]; return [cx + u * w, cy + (f === 5 ? 0.5 : -0.5) * h, cz + v * d]; }];
  }
  function boxE(cx, cy, cz, w, h, d) { // a box's twelve edges
    var L = 4 * (w + h + d);
    return [L, function (R) { var e = Math.floor(R() * 12), t = R() - 0.5, s1 = e & 1 ? 0.5 : -0.5, s2 = e & 2 ? 0.5 : -0.5;
      if (e < 4) return [cx + t * w, cy + s1 * h, cz + s2 * d]; if (e < 8) return [cx + s1 * w, cy + t * h, cz + s2 * d]; return [cx + s1 * w, cy + s2 * h, cz + t * d]; }];
  }
  function cylS(cx, cy, cz, r, h, caps) { // upright: its side, and its caps
    var A = TAU * r * h + (caps ? 2 * Math.PI * r * r : 0);
    return [A, function (R) { var a = R() * TAU; if (caps && R() < (2 * Math.PI * r * r) / A) { var q = Math.sqrt(R()) * r; return [cx + q * Math.cos(a), cy + (R() < 0.5 ? -0.5 : 0.5) * h, cz + q * Math.sin(a)]; }
      return [cx + r * Math.cos(a), cy + (R() - 0.5) * h, cz + r * Math.sin(a)]; }];
  }
  function cylZ(cx, cy, cz, r, l) { return [TAU * r * l + TAU * r, function (R) { var a = R() * TAU, e = R() < 0.25; return [cx + r * Math.cos(a), cy + r * Math.sin(a), cz + (e ? (R() < 0.5 ? 0 : l) : R() * l)]; }]; } // along z, its rims
  function ring(cx, cy, cz, r, axis) { return [TAU * r, function (R) { var a = R() * TAU, c = r * Math.cos(a), s = r * Math.sin(a); return axis === "y" ? [cx + c, cy, cz + s] : axis === "x" ? [cx, cy + c, cz + s] : [cx + c, cy + s, cz]; }]; }
  function torus(cx, cy, cz, Rr, r, axis) { return [TAU * Rr * TAU * r, function (R) { var a = R() * TAU, b = R() * TAU, q = Rr + r * Math.cos(b), z = r * Math.sin(b), c = q * Math.cos(a), s = q * Math.sin(a);
    return axis === "y" ? [cx + c, cy + z, cz + s] : axis === "x" ? [cx + z, cy + c, cz + s] : [cx + c, cy + s, cz + z]; }]; }
  function sphere(cx, cy, cz, r, sy) { return [4 * Math.PI * r * r, function (R) { var u = R() * 2 - 1, a = R() * TAU, q = Math.sqrt(1 - u * u); return [cx + r * q * Math.cos(a), cy + r * u * (sy || 1), cz + r * q * Math.sin(a)]; }]; }
  function line(a, b) { var L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); return [L, function (R) { var t = R(); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }]; }
  function turned(part, rx, ry) { // a part turned about x, then y
    var cx = Math.cos(rx || 0), sx = Math.sin(rx || 0), cy = Math.cos(ry || 0), sy = Math.sin(ry || 0);
    return [part[0], function (R) { var p = part[1](R), y = p[1] * cx - p[2] * sx, z = p[1] * sx + p[2] * cx; return [p[0] * cy + z * sy, y, -p[0] * sy + z * cy]; }];
  }
  function moved(part, dx, dy, dz) { return [part[0], function (R) { var p = part[1](R); return [p[0] + dx, p[1] + dy, p[2] + dz]; }]; }
  function edges(k, part) { return [part[0] * k, part[1]]; } // edges weigh more: drawn brighter by more points

  var SHAPES = [
    // a phone: the slab, its screen's frame, the lens
    [boxS(0, 0, 0, 0.92, 1.86, 0.12), edges(3, boxE(0, 0, 0, 0.92, 1.86, 0.12)), edges(2.5, boxE(0, 0.02, 0.062, 0.8, 1.6, 0)), edges(3, ring(-0.27, 0.75, -0.065, 0.09, "z"))],
    // a smartwatch: the case, the face, the band, the crown
    [boxS(0, 0, 0, 0.78, 0.9, 0.24), edges(3, boxE(0, 0, 0, 0.78, 0.9, 0.24)), edges(2, boxE(0, 0, 0.125, 0.64, 0.74, 0)), boxS(0, 0.78, -0.05, 0.56, 0.68, 0.06), boxS(0, -0.78, -0.05, 0.56, 0.68, 0.06), edges(3, cylZ(0.42, 0.12, -0.06, 0.06, 0.12))],
    // a smart speaker: the column, the ring of light on top, the cloth's rings
    [cylS(0, 0, 0, 0.55, 1.4, true), edges(4, ring(0, 0.7, 0, 0.42, "y")), edges(2, ring(0, -0.7, 0, 0.55, "y")), edges(1.4, ring(0, 0.3, 0, 0.555, "y")), edges(1.4, ring(0, -0.1, 0, 0.555, "y")), edges(1.4, ring(0, -0.4, 0, 0.555, "y"))],
    // a Wi-Fi router: the body, three antennas, its waves
    [boxS(0, -0.45, 0, 1.6, 0.24, 1.0), edges(3, boxE(0, -0.45, 0, 1.6, 0.24, 1.0)), edges(7, cylS(-0.6, 0.25, -0.42, 0.05, 1.15)), edges(7, cylS(0, 0.25, -0.42, 0.05, 1.15)), edges(7, cylS(0.6, 0.25, -0.42, 0.05, 1.15)),
      edges(2, ring(0, -0.32, 0.505, 0.03, "z")), edges(2, ring(0.18, -0.32, 0.505, 0.03, "z")), edges(2, ring(-0.18, -0.32, 0.505, 0.03, "z"))],
    // a camera: the body, the lens, its rings, the mount
    [boxS(0, 0.1, -0.1, 1.2, 0.78, 0.8), edges(3, boxE(0, 0.1, -0.1, 1.2, 0.78, 0.8)), edges(2, cylZ(0, 0.1, 0.3, 0.3, 0.42)), edges(3, ring(0, 0.1, 0.72, 0.22, "z")), edges(3, ring(0, 0.1, 0.72, 0.12, "z")), cylS(0, -0.55, -0.1, 0.1, 0.55), edges(2, ring(0, -0.82, -0.1, 0.24, "y"))],
    // a laptop: the base, the keys' field, the screen opened back
    [boxS(0, -0.5, 0.1, 1.9, 0.07, 1.25), edges(3, boxE(0, -0.5, 0.1, 1.9, 0.07, 1.25)), edges(1.5, boxE(0, -0.46, 0.0, 1.5, 0, 0.55)), edges(1.5, boxE(0, -0.46, 0.5, 0.6, 0, 0.3)),
      moved(turned(boxS(0, 0.6, 0, 1.9, 1.2, 0.05), -0.28, 0), 0, -0.53, -0.5), edges(3, moved(turned(boxE(0, 0.6, 0, 1.9, 1.2, 0.05), -0.28, 0), 0, -0.53, -0.5))],
    // a smart ring: the band, its sensor's bump
    [torus(0, 0, 0, 0.62, 0.15, "z"), edges(2, ring(0, 0, 0.16, 0.62, "z")), edges(2, ring(0, 0, -0.16, 0.62, "z")), sphere(0, -0.76, 0, 0.13, 0.7)],
    // a VR headset: the visor, its face, the strap
    [boxS(0, 0, 0.25, 1.5, 0.82, 0.62), edges(3, boxE(0, 0, 0.25, 1.5, 0.82, 0.62)), edges(2.5, ring(-0.36, 0, 0.57, 0.17, "z")), edges(2.5, ring(0.36, 0, 0.57, 0.17, "z")), edges(1.6, turned(torus(0, 0, -0.35, 0.78, 0.035, "y"), 0, 0))],
    // earbuds: two heads, two stems, the case's lid
    [sphere(-0.45, 0.35, 0, 0.27), sphere(0.45, 0.35, 0, 0.27), edges(2, cylS(-0.45, -0.25, 0, 0.08, 0.8, true)), edges(2, cylS(0.45, -0.25, 0, 0.08, 0.8, true)), edges(2.5, ring(-0.45, 0.35, 0.22, 0.12, "z")), edges(2.5, ring(0.45, 0.35, 0.22, 0.12, "z"))],
    // a car: the body, the cabin, four wheels
    [boxS(0, -0.35, 0, 2.0, 0.42, 0.9), edges(3, boxE(0, -0.35, 0, 2.0, 0.42, 0.9)), boxS(-0.1, 0.06, 0, 1.1, 0.4, 0.82), edges(3, boxE(-0.1, 0.06, 0, 1.1, 0.4, 0.82)),
      edges(9, torus(-0.62, -0.58, 0.47, 0.2, 0.06, "z")), edges(9, torus(0.62, -0.58, 0.47, 0.2, 0.06, "z")), edges(9, torus(-0.62, -0.58, -0.47, 0.2, 0.06, "z")), edges(9, torus(0.62, -0.58, -0.47, 0.2, 0.06, "z"))],
    // a drone: the body, four arms, four rotors
    [boxS(0, 0, 0, 0.5, 0.18, 0.5), edges(3, boxE(0, 0, 0, 0.5, 0.18, 0.5)), edges(2, line([0, 0, 0], [0.72, 0.05, 0.72])), edges(2, line([0, 0, 0], [-0.72, 0.05, 0.72])), edges(2, line([0, 0, 0], [0.72, 0.05, -0.72])), edges(2, line([0, 0, 0], [-0.72, 0.05, -0.72])),
      edges(3, ring(0.72, 0.1, 0.72, 0.36, "y")), edges(3, ring(-0.72, 0.1, 0.72, 0.36, "y")), edges(3, ring(0.72, 0.1, -0.72, 0.36, "y")), edges(3, ring(-0.72, 0.1, -0.72, 0.36, "y")), cylS(0, -0.2, 0, 0.12, 0.2)],
    // smart glasses: two lenses, the bridge, the temples, the camera at the hinge
    [edges(3, torus(-0.45, 0, 0.3, 0.3, 0.04, "z")), edges(3, torus(0.45, 0, 0.3, 0.3, 0.04, "z")), edges(2, line([-0.16, 0.08, 0.3], [0.16, 0.08, 0.3])), edges(2, line([-0.76, 0.05, 0.3], [-0.8, 0.05, -0.75])), edges(2, line([0.76, 0.05, 0.3], [0.8, 0.05, -0.75])),
      edges(0.35, moved(turned(cylS(0, 0, 0, 0.26, 0.01, true), Math.PI / 2, 0), -0.45, 0, 0.3)), edges(0.35, moved(turned(cylS(0, 0, 0, 0.26, 0.01, true), Math.PI / 2, 0), 0.45, 0, 0.3)), edges(3, ring(0.8, 0.12, 0.32, 0.06, "z"))]
  ];

  function build(count, R) {
    var out = new Float32Array(count * 4), n = SHAPES.length;
    for (var s = 0; s < n; s++) {
      var parts = SHAPES[s], T = parts.reduce(function (a, p) { return a + p[0]; }, 0), from = Math.floor((s * count) / n), to = Math.floor(((s + 1) * count) / n);
      // the shape's size: fitted to -1..1 by its farthest point
      var pts = [], far = 0.0001;
      for (var o = from; o < to; o++) { var r = R() * T, k = 0; while (k < parts.length - 1 && r > parts[k][0]) { r -= parts[k][0]; k++; } var p = parts[k][1](R); pts.push(p); far = Math.max(far, Math.abs(p[0]), Math.abs(p[1]), Math.abs(p[2])); }
      pts.forEach(function (p, j) { var o = (from + j) * 4; out[o] = p[0] / far; out[o + 1] = p[1] / far; out[o + 2] = p[2] / far; out[o + 3] = s; });
    }
    return out;
  }
  window.S2S_ASSETS = { names: NAMES, count: SHAPES.length, build: build };
})();

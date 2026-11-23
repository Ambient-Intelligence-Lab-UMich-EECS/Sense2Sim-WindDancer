// The opening's way in (the owner, 2026-11-22: “每次进去都要加载一会儿，让人感觉是从其他页面跳转到现在的第一页的…一定要保证
// 一进去就是这一页”; then “不能照抄…我们第一个是论文，你要想匹配合理的动画”). The first thing drawn is a paper being written: its
// title, its authors, two columns of lines and a figure's curve draw in while the page loads; once the opening's scene
// is ready (intro.js calls S2S_ENTRANCE.ready()), the sheet grows toward the reader and fades, and the opening's own
// first papers are there behind it. Learnt from the Sensing Universe's pages: drawn before anything else, shown at least
// MIN_MS so it never flashes, never longer than CAP_MS, gone at once if anything fails.
// One classic script, first in <head>, no library, no picture, no network. Not in the kit's own browsers
// (navigator.webdriver) nor with ?entrance=0: their stills are of the page itself.
(function () {
  "use strict";
  if (window.S2S_ENTRANCE) return;
  var none = { open: false, entered: 0, progress: function () {}, ready: function () {} };
  if (/[?&]entrance=0(&|$)/.test(location.search) || navigator.webdriver) { window.S2S_ENTRANCE = none; return; }
  var MIN_MS = 900, CAP_MS = 15000, EXIT_MS = 650, t0 = Date.now();
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var css = [
    "#s2s-enter{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;background:#000;transition:opacity " + EXIT_MS + "ms ease, visibility 0s linear " + EXIT_MS + "ms}",
    "#s2s-enter.out{opacity:0;visibility:hidden}",
    "#s2s-enter .sheet{width:min(34vw,340px);aspect-ratio:8.5/11;background:#f6f5f0;border-radius:3px;box-shadow:0 30px 80px rgba(0,0,0,.6),0 0 60px rgba(107,152,255,.18);transform:translateY(-6vh) rotate(-1.2deg);animation:s2sIn .7s cubic-bezier(.2,.8,.2,1) both;transition:transform " + EXIT_MS + "ms cubic-bezier(.6,0,.4,1)}",
    "#s2s-enter.out .sheet{transform:translateY(-6vh) scale(2.4) rotate(0deg)}",
    "#s2s-enter svg{display:block;width:100%;height:100%}",
    "#s2s-enter .ln{stroke:#3a3d45;stroke-width:5;stroke-linecap:round;stroke-dasharray:var(--l);stroke-dashoffset:var(--l);animation:s2sDraw .5s ease-out forwards;animation-delay:var(--d)}",
    "#s2s-enter .tl{stroke:#16181d;stroke-width:11}",
    "#s2s-enter .au{stroke:#8a8d96;stroke-width:5}",
    "#s2s-enter .fig{fill:none;stroke:#6b98ff;stroke-width:4;stroke-dasharray:900;stroke-dashoffset:900;animation:s2sDraw 1.4s ease-in-out forwards;animation-delay:.9s}",
    "#s2s-enter .box{fill:rgba(107,152,255,.08);stroke:rgba(107,152,255,.5);stroke-width:2;opacity:0;animation:s2sFade .4s ease forwards;animation-delay:.8s}",
    "#s2s-enter .s2s-ecap{position:absolute;left:0;right:0;bottom:9vh;text-align:center;font:600 clamp(15px,1.4vw,20px)/1.4 system-ui,sans-serif;letter-spacing:.02em;color:#c9ccd4}",
    "#s2s-enter .s2s-ecap b{display:block;font-size:clamp(26px,2.6vw,38px);letter-spacing:-.02em;background:linear-gradient(90deg,#d9f272,#6b98ff,#c7a2ff,#ff8a5b);-webkit-background-clip:text;background-clip:text;color:transparent}",
    "#s2s-enter .s2s-ebar{width:min(240px,50vw);height:3px;margin:12px auto 0;border-radius:2px;background:rgba(255,255,255,.12);overflow:hidden}",
    "#s2s-enter .s2s-ebar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#d9f272,#6b98ff);transition:width .4s ease}",
    "@keyframes s2sIn{from{opacity:0;transform:translateY(0) rotate(-4deg) scale(.92)}}",
    "@keyframes s2sDraw{to{stroke-dashoffset:0}}",
    "@keyframes s2sFade{to{opacity:1}}",
    "@media (prefers-reduced-motion: reduce){#s2s-enter .sheet,#s2s-enter .ln,#s2s-enter .fig,#s2s-enter .box{animation:none;stroke-dashoffset:0;opacity:1}}"
  ].join("\n");
  // the sheet: a conference paper's first page, drawn line by line (title, authors, two columns, a figure in the right one)
  function sheet() {
    var out = [];
    function line(x1, y, x2, cls, delay) { var l = Math.round(x2 - x1); out.push('<line class="ln ' + (cls || "") + '" x1="' + x1 + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '" style="--l:' + l + ";--d:" + delay.toFixed(2) + 's"/>'); }
    line(170, 120, 680, "tl", 0.15); line(250, 160, 600, "tl", 0.3);
    line(200, 215, 330, "au", 0.45); line(370, 215, 490, "au", 0.5); line(530, 215, 650, "au", 0.55);
    for (var c = 0; c < 2; c++) {
      var x0 = c ? 460 : 90, x1 = c ? 760 : 390;
      for (var r = 0; r < 26; r++) {
        var y = 290 + r * 28;
        if (c === 1 && y > 280 && y < 560) continue; // the figure's place
        var end = r % 7 === 6 ? x0 + (x1 - x0) * 0.55 : x1;
        line(x0, y, end, "", 0.55 + c * 0.25 + r * 0.035);
      }
    }
    out.push('<rect class="box" x="460" y="290" width="300" height="250" rx="6"/>');
    out.push('<path class="fig" d="M478 440 C 510 360, 540 360, 565 430 S 615 520, 645 420 S 700 340, 742 410"/>');
    return '<svg viewBox="0 0 850 1100" aria-hidden="true">' + out.join("") + "</svg>";
  }
  var el = null, bar = null, state = { open: true, entered: 0 }, leaving = false;
  function mount() {
    if (el) return;
    var host = document.body || document.documentElement; if (!host) return;
    var st = document.createElement("style"); st.textContent = css; (document.head || document.documentElement).appendChild(st);
    el = document.createElement("div"); el.id = "s2s-enter"; el.setAttribute("role", "status"); el.setAttribute("aria-label", "Opening the simulation");
    el.innerHTML = '<div class="sheet">' + sheet() + '</div><div class="s2s-ecap"><b>Sense2Sim</b>Opening the paper as a live model<div class="s2s-ebar"><i></i></div></div>';
    host.appendChild(el); bar = el.querySelector(".s2s-ebar i");
  }
  function leave() {
    if (leaving) return; leaving = true;
    var wait = reduce ? 0 : Math.max(0, MIN_MS - (Date.now() - t0));
    setTimeout(function () {
      state.open = false; state.entered = Date.now() - t0;
      if (!el) return;
      if (bar) bar.style.width = "100%";
      el.classList.add("out");
      setTimeout(function () { if (el && el.parentNode) el.parentNode.removeChild(el); try { window.dispatchEvent(new Event("s2s-entered")); } catch (e) {} }, EXIT_MS + 50);
    }, wait);
  }
  try { mount(); } catch (e) { window.S2S_ENTRANCE = none; return; }
  if (!el) document.addEventListener("DOMContentLoaded", function () { try { mount(); } catch (e) {} });
  // how far the page is: a slow climb to 85% until it is ready, so the reader sees it move
  var p = 0, tick = setInterval(function () { if (leaving) return clearInterval(tick); p = Math.min(0.85, p + (0.85 - p) * 0.08); if (bar) bar.style.width = (p * 100).toFixed(1) + "%"; }, 120);
  setTimeout(leave, CAP_MS);
  window.S2S_ENTRANCE = {
    get open() { return state.open; }, get entered() { return state.entered; },
    progress: function (f) { if (bar && !leaving) bar.style.width = Math.max(p, Math.min(1, +f || 0)) * 100 + "%"; },
    ready: leave
  };
  window.addEventListener("error", leave);
})();

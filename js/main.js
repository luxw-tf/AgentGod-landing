/* ==========================================================================
   AGENTGOD — Behaviour
   No dependencies, no build step. Everything degrades gracefully.
   ========================================================================== */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------------
     Asset slots
     Every .slot holds an <img> pointing at a file you may not have added yet.
     If the file is missing, the slot falls back to a labelled frame showing
     the intended dimensions — so the layout never collapses.
     ---------------------------------------------------------------------- */

  function initSlots() {
    var slots = document.querySelectorAll(".slot");

    Array.prototype.forEach.call(slots, function (slot) {
      var img = slot.querySelector("img");

      if (!img || !img.getAttribute("src")) {
        slot.classList.add("is-empty");
        return;
      }

      var markEmpty = function () { slot.classList.add("is-empty"); };
      var markReady = function () { slot.classList.remove("is-empty"); };

      if (img.complete) {
        if (img.naturalWidth === 0) markEmpty();
      } else {
        img.addEventListener("error", markEmpty);
        img.addEventListener("load", markReady);
        // Assume empty until proven otherwise, so the label shows immediately.
        slot.classList.add("is-empty");
      }
    });
  }

  /* ------------------------------------------------------------------------
     Hero video
     The edit leads: it plays once, then dissolves to the still underneath.
     Built here rather than in the HTML so it is never requested at all when
     the visitor has asked for less motion, and so the handoff can be timed.

     The iframe is cross-origin, so there is no `ended` event to listen for —
     the handoff runs off the asset duration instead, which is why the exact
     length is carried on the element as data-video-duration.
     ---------------------------------------------------------------------- */

  function initHeroVideo() {
    var host = document.querySelector("[data-video]");
    if (!host || host.querySelector("iframe")) return;

    // An AMV edit is a lot of motion. Leave the still in place instead.
    if (reduced) return;

    var id = host.getAttribute("data-video");
    if (!id) return;

    var FADE_OUT = 1800; // must match the .hero__video transition in main.css
    var STARTUP  = 700;  // allowance for buffering before playback truly starts
    var MARGIN   = 150;  // land the dissolve just short of the final frame

    var duration = parseInt(host.getAttribute("data-video-duration"), 10) || 10000;

    // player.mux.com honours autoplay / muted / nohotkeys as query params, but
    // NOT controls — it is dropped server-side. `loop` is deliberately absent:
    // the edit plays once. `poster=` is empty because our own still is already
    // sitting behind it.
    var frame = document.createElement("iframe");
    frame.src = "https://player.mux.com/" + id +
      "?autoplay=muted&muted=true&nohotkeys=true&poster=";
    frame.title = "AgentGod title sequence";
    frame.tabIndex = -1;
    frame.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
    frame.setAttribute("aria-hidden", "true");

    frame.addEventListener("load", function () {
      host.classList.add("is-playing");

      setTimeout(function () {
        host.classList.remove("is-playing");

        // Drop the player once it is invisible. Stops decoding, and means the
        // control bar that appears on `ended` is never revealed by the still.
        setTimeout(function () {
          if (frame.parentNode) frame.parentNode.removeChild(frame);
        }, FADE_OUT + 200);
      }, Math.max(0, STARTUP + duration - FADE_OUT - MARGIN));
    });

    host.appendChild(frame);
  }

  /* ------------------------------------------------------------------------
     Nav — background on scroll, mobile drawer
     ---------------------------------------------------------------------- */

  function initNav() {
    var nav = document.querySelector(".nav");
    var toggle = document.querySelector(".nav__toggle");
    var links = document.querySelector(".nav__links");
    if (!nav) return;

    var onScroll = function () {
      nav.classList.toggle("is-stuck", window.scrollY > 12);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (!toggle || !links) return;

    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      links.classList.toggle("is-open", open);
    };

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
  }

  /* ------------------------------------------------------------------------
     Scroll reveal — slow fade + rise, staggered per group
     ---------------------------------------------------------------------- */

  function initReveal() {
    var targets = document.querySelectorAll("[data-reveal]");
    if (!targets.length) return;

    if (reduced || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(targets, function (el) {
        el.classList.add("is-in");
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;

        var el = entry.target;
        var stagger = parseInt(el.getAttribute("data-reveal"), 10);
        if (!isNaN(stagger)) el.style.setProperty("--reveal-delay", stagger * 90 + "ms");

        el.classList.add("is-in");
        observer.unobserve(el);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });

    Array.prototype.forEach.call(targets, function (el) { observer.observe(el); });
  }

  /* ------------------------------------------------------------------------
     Terminal — types out a session log once it scrolls into view
     ---------------------------------------------------------------------- */

  var SCRIPTS = {
    summon: [
      { tone: "dim",     text: "agentgod init --objective \"map the competitive landscape\"" },
      { tone: "default", text: "objective parsed. decomposing into 5 tracks." },
      { tone: "create",  text: "spawn  scout.01     tools: web, archive" },
      { tone: "create",  text: "spawn  scout.02     tools: web, filings" },
      { tone: "create",  text: "spawn  analyst.01   tools: python, tabular" },
      { tone: "create",  text: "spawn  analyst.02   tools: python, tabular" },
      { tone: "create",  text: "spawn  editor.01    tools: draft, cite" },
      { tone: "default", text: "5 agents live. executing in parallel." },
      { tone: "dim",     text: "..." },
      { tone: "default", text: "objective satisfied in 4m 12s. artifact written." },
      { tone: "destroy", text: "terminate 5/5 — context released. no residue." }
    ],
    lifecycle: [
      { tone: "dim",     text: "watch agentgod --trace" },
      { tone: "create",  text: "[00.0s]  summon      plan accepted, 5 agents provisioned" },
      { tone: "default", text: "[00.4s]  delegate    tools bound, scopes sealed" },
      { tone: "default", text: "[01.1s]  execute     scout.01 → 34 sources retrieved" },
      { tone: "default", text: "[01.9s]  execute     analyst.02 → model converged" },
      { tone: "default", text: "[03.2s]  execute     editor.01 → draft assembled" },
      { tone: "default", text: "[04.0s]  verify      claims checked against sources" },
      { tone: "destroy", text: "[04.2s]  dissolve    5 agents terminated" },
      { tone: "dim",     text: "[04.2s]  exit 0      1 artifact, 0 agents remaining" }
    ]
  };

  function typeTerminal(host, lines) {
    var i = 0;

    var nextLine = function () {
      if (i >= lines.length) {
        var cursor = document.createElement("span");
        cursor.className = "terminal__cursor";
        host.appendChild(cursor);
        return;
      }

      var spec = lines[i++];
      var row = document.createElement("div");
      row.className = "terminal__line";
      row.setAttribute("data-tone", spec.tone);

      var caret = document.createElement("span");
      caret.className = "caret";
      caret.textContent = ">";

      var body = document.createElement("span");

      row.appendChild(caret);
      row.appendChild(body);
      host.appendChild(row);

      var chars = spec.text.split("");
      var c = 0;

      var typeChar = function () {
        body.textContent += chars[c++];
        if (c < chars.length) {
          setTimeout(typeChar, 8);
        } else {
          setTimeout(nextLine, spec.tone === "dim" ? 280 : 160);
        }
      };

      typeChar();
    };

    nextLine();
  }

  function initTerminals() {
    var hosts = document.querySelectorAll("[data-terminal]");
    if (!hosts.length) return;

    Array.prototype.forEach.call(hosts, function (host) {
      var lines = SCRIPTS[host.getAttribute("data-terminal")];
      if (!lines) return;

      var render = function () {
        host.textContent = "";
        lines.forEach(function (spec) {
          var row = document.createElement("div");
          row.className = "terminal__line";
          row.setAttribute("data-tone", spec.tone);
          row.innerHTML = '<span class="caret">&gt;</span><span></span>';
          row.lastChild.textContent = spec.text;
          host.appendChild(row);
        });
      };

      if (reduced || !("IntersectionObserver" in window)) {
        render();
        return;
      }

      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          observer.disconnect();
          host.textContent = "";
          typeTerminal(host, lines);
        });
      }, { threshold: 0.35 });

      observer.observe(host);
    });
  }

  /* ------------------------------------------------------------------------
     Docs sidebar — highlight the section currently in view
     ---------------------------------------------------------------------- */

  function initDocsSpy() {
    var links = document.querySelectorAll(".docs__group a[href^='#']");
    if (!links.length || !("IntersectionObserver" in window)) return;

    var byId = {};
    var sections = [];

    Array.prototype.forEach.call(links, function (link) {
      var id = link.getAttribute("href").slice(1);
      var section = document.getElementById(id);
      if (!section) return;
      byId[id] = link;
      sections.push(section);
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        Array.prototype.forEach.call(links, function (l) { l.classList.remove("is-active"); });
        var active = byId[entry.target.id];
        if (active) active.classList.add("is-active");
      });
    }, { rootMargin: "-20% 0px -70% 0px" });

    sections.forEach(function (s) { observer.observe(s); });
  }

  /* ------------------------------------------------------------------------
     Background audio — 0826.mp3
     Continuous loop background music with no controls. Plays on load and
     falls back to first user interaction if browser autoplay policy blocks it.
     ---------------------------------------------------------------------- */

  function initAudio() {
    var audio = new Audio("assets/0826.mp3");
    audio.loop = true;
    audio.preload = "auto";

    var played = false;
    var startPlay = function () {
      if (played) return;
      var promise = audio.play();
      if (promise !== undefined) {
        promise.then(function () {
          played = true;
          removeHandlers();
        }).catch(function () {
          // Autoplay policy prevented immediate playback; waiting for first interaction
        });
      }
    };

    var onInteract = function () {
      startPlay();
    };

    var events = ["click", "touchstart", "pointerdown", "keydown", "scroll"];
    var removeHandlers = function () {
      events.forEach(function (ev) {
        window.removeEventListener(ev, onInteract, true);
        document.removeEventListener(ev, onInteract, true);
      });
    };

    events.forEach(function (ev) {
      window.addEventListener(ev, onInteract, { capture: true, passive: true });
      document.addEventListener(ev, onInteract, { capture: true, passive: true });
    });

    startPlay();
  }

  /* ------------------------------------------------------------------------
     Footer year
     ---------------------------------------------------------------------- */

  function initYear() {
    var slots = document.querySelectorAll("[data-year]");
    var year = String(new Date().getFullYear());
    Array.prototype.forEach.call(slots, function (el) { el.textContent = year; });
  }

  /* ---------------------------------------------------------------------- */

  function boot() {
    initSlots();
    initNav();
    initReveal();
    initTerminals();
    initDocsSpy();
    initYear();
    initAudio();

    // Started immediately, not on window.load — waiting would put the edit
    // behind every image on the page, and the edit is the thing that leads.
    initHeroVideo();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

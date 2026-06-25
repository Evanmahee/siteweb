import { renderAvisSlides, cardsPerSlide } from "./avis-data.js";

export function initAvisToggles() {
  var section = document.querySelector("#temoignages");
  if (!section) return;

  if (!section.dataset.avisDelegated) {
    section.dataset.avisDelegated = "1";
    section.addEventListener("click", function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var btn = t.closest(".avis__toggle");
      if (!btn || !section.contains(btn) || btn.hidden) return;
      e.preventDefault();
      var card = btn.closest(".avis__card");
      if (!card || !section.contains(card)) return;
      var on = card.classList.toggle("avis__card--expanded");
      btn.setAttribute("aria-expanded", on ? "true" : "false");
      btn.textContent = on ? "Cacher" : "Voir plus";
    });
  }

  function measureOne(card) {
    var text = card.querySelector(".avis__text");
    var btn = card.querySelector(".avis__toggle");
    if (!text || !btn) return;

    var wasExpanded = card.classList.contains("avis__card--expanded");
    card.classList.remove("avis__card--clamp", "avis__card--expanded");
    btn.setAttribute("aria-expanded", "false");
    btn.textContent = "Voir plus";

    card.classList.add("avis__card--clamp");
    var overflow = text.scrollHeight - text.clientHeight > 2;

    if (overflow) {
      btn.hidden = false;
      if (wasExpanded) {
        card.classList.add("avis__card--expanded");
        btn.setAttribute("aria-expanded", "true");
        btn.textContent = "Cacher";
      }
    } else {
      card.classList.remove("avis__card--clamp");
      btn.hidden = true;
    }
  }

  section.querySelectorAll(".avis__card").forEach(measureOne);
}

function updateNavButtons(root, slideCount) {
  var prev = root.querySelector("[data-avis-prev]");
  var next = root.querySelector("[data-avis-next]");
  var show = slideCount > 1;
  if (prev) prev.hidden = !show;
  if (next) next.hidden = !show;
}

function fixSlideCloneIds(slideEl, suffix) {
  slideEl.removeAttribute("id");
  slideEl.querySelectorAll(".avis__card").forEach(function (card) {
    var p = card.querySelector(".avis__text");
    var btn = card.querySelector(".avis__toggle");
    if (p && p.id) {
      var nid = p.id + suffix;
      p.id = nid;
      if (btn) btn.setAttribute("aria-controls", nid);
    }
  });
}

export function initAvisCarousel(avisPayload) {
  var root = document.querySelector("[data-avis-carousel]");
  if (!root) return;

  var track = root.querySelector("[data-avis-track]");
  if (!track) return;

  var prevBtn = root.querySelector("[data-avis-prev]");
  var nextBtn = root.querySelector("[data-avis-next]");
  var chunkSize = cardsPerSlide();

  function teardownCarousel() {
    track.querySelectorAll(".avis__slide--clone").forEach(function (el) {
      el.remove();
    });
    track.classList.remove("avis__track--jump");
    track.style.removeProperty("--avis-n");
    track.style.removeProperty("--avis-i");

    var st = root._avisCarouselState;
    if (!st) return;

    if (st.timerId !== null) {
      window.clearInterval(st.timerId);
      st.timerId = null;
    }
    if (st.onVis) document.removeEventListener("visibilitychange", st.onVis);
    if (st.onEnter) root.removeEventListener("mouseenter", st.onEnter);
    if (st.onLeave) root.removeEventListener("mouseleave", st.onLeave);
    if (st.onFocusIn) root.removeEventListener("focusin", st.onFocusIn);
    if (st.onFocusOut) root.removeEventListener("focusout", st.onFocusOut);
    root._avisCarouselState = null;
  }

  function mountCarousel() {
    if (avisPayload && avisPayload.reviews && avisPayload.reviews.length) {
      renderAvisSlides(track, avisPayload.reviews, chunkSize);
    }

    var originals = Array.prototype.slice.call(
      track.querySelectorAll(":scope > .avis__slide:not(.avis__slide--clone)")
    );
    var slideCount = originals.length;
    updateNavButtons(root, slideCount);

    if (slideCount < 1) {
      teardownCarousel();
      return;
    }

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    teardownCarousel();
    root.setAttribute("aria-roledescription", "carrousel");

    var slides;
    var n;
    var i;
    var intervalMs = 6500;
    var userPause = false;

    if (!reduceMotion && slideCount > 1) {
      var cloneLast = originals[originals.length - 1].cloneNode(true);
      cloneLast.classList.add("avis__slide--clone");
      fixSlideCloneIds(cloneLast, "-c-last");
      var cloneFirst = originals[0].cloneNode(true);
      cloneFirst.classList.add("avis__slide--clone");
      fixSlideCloneIds(cloneFirst, "-c-first");
      track.insertBefore(cloneLast, originals[0]);
      track.appendChild(cloneFirst);
      slides = track.querySelectorAll(":scope > .avis__slide");
      n = slides.length;
      i = 1;
    } else {
      slides = originals;
      n = slides.length;
      i = 0;
    }

    function apply() {
      track.style.setProperty("--avis-n", String(n));
      track.style.setProperty("--avis-i", String(i));
      slides.forEach(function (slide, idx) {
        var hidden = idx !== i;
        slide.setAttribute("aria-hidden", hidden ? "true" : "false");
        if ("inert" in slide) slide.inert = hidden;
      });
    }

    function afterSlideChange() {
      window.requestAnimationFrame(function () {
        initAvisToggles();
      });
    }

    function step(delta) {
      if (n <= 1 || reduceMotion) return;

      if (delta > 0 && i === n - 1) {
        track.classList.add("avis__track--jump");
        i = 1;
        apply();
        void track.offsetHeight;
        track.classList.remove("avis__track--jump");
        afterSlideChange();
        return;
      }

      if (delta < 0 && i === 1) {
        track.classList.add("avis__track--jump");
        i = n - 2;
        apply();
        void track.offsetHeight;
        track.classList.remove("avis__track--jump");
        afterSlideChange();
        return;
      }

      i = (i + delta + n) % n;
      apply();
      afterSlideChange();
    }

    function tick() {
      if (document.hidden || userPause || reduceMotion || n <= 1) return;
      step(1);
    }

    var st = {
      timerId: null,
      onVis: null,
      onEnter: null,
      onLeave: null,
      onFocusIn: null,
      onFocusOut: null,
      step: step,
    };

    function stopTimer() {
      if (st.timerId !== null) {
        window.clearInterval(st.timerId);
        st.timerId = null;
      }
    }

    function syncTimer() {
      stopTimer();
      if (reduceMotion || document.hidden || userPause || n <= 1) return;
      st.timerId = window.setInterval(tick, intervalMs);
    }

    st.onEnter = function () {
      userPause = true;
      syncTimer();
    };
    st.onLeave = function () {
      userPause = false;
      syncTimer();
    };
    st.onFocusIn = function () {
      userPause = true;
      syncTimer();
    };
    st.onFocusOut = function (e) {
      var rel = e.relatedTarget;
      if (!rel || !root.contains(rel)) {
        userPause = false;
        syncTimer();
      }
    };
    st.onVis = function () {
      syncTimer();
    };

    root.addEventListener("mouseenter", st.onEnter);
    root.addEventListener("mouseleave", st.onLeave);
    root.addEventListener("focusin", st.onFocusIn);
    root.addEventListener("focusout", st.onFocusOut);
    document.addEventListener("visibilitychange", st.onVis);

    root._avisCarouselState = st;
    apply();
    syncTimer();
  }

  function remount() {
    var newChunk = cardsPerSlide();
    if (newChunk !== chunkSize) {
      chunkSize = newChunk;
      teardownCarousel();
    }
    mountCarousel();
    initAvisToggles();
  }

  if (!root._avisNavBound) {
    root._avisNavBound = true;
    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        var st = root._avisCarouselState;
        if (st && st.step) st.step(-1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        var st = root._avisCarouselState;
        if (st && st.step) st.step(1);
      });
    }
  }

  if (!root._avisResizeBound) {
    root._avisResizeBound = true;
    window.addEventListener("resize", remount, { passive: true });
  }

  remount();
}

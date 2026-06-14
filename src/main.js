(function () {
  "use strict";

  const header = document.querySelector(".site-header");
  const year = String(new Date().getFullYear());
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = year;
  });

  /* Nav background on scroll */
  function updateHeaderScroll() {
    if (!header) return;
    const scrolled = window.scrollY > 24;
    header.classList.toggle("is-scrolled", scrolled);
  }

  updateHeaderScroll();
  window.addEventListener("scroll", updateHeaderScroll, { passive: true });

  /* Mobile menu */
  function setMenuOpen(nav, open) {
    if (!nav) return;
    var toggle = nav.querySelector(".nav__toggle");
    var menu = nav.querySelector(".nav__menu");
    if (!toggle || !menu) return;
    if (open) {
      document.querySelectorAll(".nav.is-open").forEach(function (n) {
        if (n !== nav) {
          n.classList.remove("is-open");
          var ot = n.querySelector(".nav__toggle");
          if (ot) {
            ot.setAttribute("aria-expanded", "false");
            ot.setAttribute("aria-label", "Ouvrir le menu");
          }
        }
      });
    }
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    document.body.style.overflow = document.querySelector(".nav.is-open") ? "hidden" : "";
  }

  function closeAllMenus() {
    document.querySelectorAll(".nav.is-open").forEach(function (nav) {
      setMenuOpen(nav, false);
    });
  }

  document.querySelectorAll(".nav").forEach(function (nav) {
    var toggle = nav.querySelector(".nav__toggle");
    var menu = nav.querySelector(".nav__menu");
    if (!toggle || !menu) return;
    toggle.addEventListener(
      "click",
      function (e) {
        e.preventDefault();
        setMenuOpen(nav, !nav.classList.contains("is-open"));
      },
      true
    );
    var closeDrawer = nav.querySelector(".nav__drawer-close");
    if (closeDrawer) {
      closeDrawer.addEventListener(
        "click",
        function (e) {
          e.preventDefault();
          setMenuOpen(nav, false);
        },
        true
      );
    }
    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMenuOpen(nav, false);
      });
    });
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 900) {
      closeAllMenus();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    closeAllMenus();
  });

  /* Mobile / tablette : fermer le menu en cliquant hors de la barre (ex. hero sous le tiroir demi-hauteur) */
  document.addEventListener(
    "click",
    function (e) {
      if (window.innerWidth > 900) return;
      if (!document.querySelector(".nav.is-open")) return;
      var t = e.target;
      if (!t || !t.closest) return;
      if (!t.closest(".nav.is-open")) {
        closeAllMenus();
      }
    },
    false
  );

  /* IntersectionObserver — fadeUp */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function revealAllNow() {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  if (!reduceMotion) {
    var revealEls = document.querySelectorAll(".reveal");
    if (revealEls.length) {
      if (typeof IntersectionObserver === "undefined") {
        revealAllNow();
      } else {
        try {
          var io = new IntersectionObserver(
            function (entries) {
              entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                  entry.target.classList.add("is-visible");
                  io.unobserve(entry.target);
                }
              });
            },
            {
              root: null,
              /* 0 : déclenche dès qu’un pixel est visible — les blocs très hauts (ex. formules)
                 ne atteignent pas toujours 12 % de ratio d’intersection selon les navigateurs. */
              threshold: 0,
              rootMargin: "0px 0px -24px 0px",
            }
          );

          revealEls.forEach(function (el) {
            io.observe(el);
          });
        } catch (err) {
          revealAllNow();
        }
      }
    }
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* Contact : champ « Précise si Autre » + envoi (démo navigateur) */
  var contactForm = document.getElementById("contact-form");
  if (contactForm) {
    var sourceAutreRow = contactForm.querySelector(".contact-dark__field-source-autre");
    function syncSourceAutreField() {
      if (!sourceAutreRow) return;
      var checked = contactForm.querySelector('input[name="source"]:checked');
      var show = checked && checked.value === "autre";
      sourceAutreRow.toggleAttribute("hidden", !show);
      if (!show) {
        var inp = sourceAutreRow.querySelector("input");
        if (inp) inp.value = "";
      }
    }
    contactForm.querySelectorAll('input[name="source"]').forEach(function (r) {
      r.addEventListener("change", syncSourceAutreField);
    });
    contactForm.addEventListener("reset", syncSourceAutreField);
    syncSourceAutreField();

    var submitBtn = contactForm.querySelector(".contact-dark__submit");
    var feedbackEl = document.getElementById("contact-form-feedback");
    var submitDefaultHtml = submitBtn ? submitBtn.innerHTML.trim() : "Envoyer le formulaire";
    var reduceMotion =
      typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var demoSendMs = reduceMotion ? 400 : 900;
    var successHoldMs = reduceMotion ? 2200 : 3800;

    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!submitBtn || submitBtn.classList.contains("is-sending")) return;

      submitBtn.classList.remove("is-success");
      submitBtn.classList.add("is-sending");
      submitBtn.disabled = true;
      submitBtn.setAttribute("aria-busy", "true");
      submitBtn.innerHTML =
        '<span class="contact-dark__submit-spinner" aria-hidden="true"></span>' +
        '<span class="contact-dark__submit-label">Envoi en cours…</span>';

      if (feedbackEl) {
        feedbackEl.setAttribute("hidden", "");
        feedbackEl.textContent = "";
      }

      window.setTimeout(function () {
        submitBtn.classList.remove("is-sending");
        submitBtn.classList.add("is-success");
        submitBtn.removeAttribute("aria-busy");
        submitBtn.innerHTML =
          '<span class="contact-dark__submit-check" aria-hidden="true">✓</span>' +
          '<span class="contact-dark__submit-label">Message envoyé</span>';

        if (feedbackEl) {
          feedbackEl.textContent =
            "Merci ! Ton message a bien été pris en compte. (Version démo : relie ce formulaire à ton backend ou à un outil pour recevoir les demandes.)";
          feedbackEl.removeAttribute("hidden");
        }

        window.setTimeout(function () {
          submitBtn.classList.remove("is-success");
          submitBtn.disabled = false;
          submitBtn.innerHTML = submitDefaultHtml;
          if (feedbackEl) {
            feedbackEl.setAttribute("hidden", "");
            feedbackEl.textContent = "";
          }
          contactForm.reset();
          syncSourceAutreField();
        }, successHoldMs);
      }, demoSendMs);
    });
  }

  /* Témoignages — aperçu + Voir plus / Cacher (délégation : un seul listener, fiable après resize/fonts) */
  function initAvisToggles() {
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

  /** Carrousel témoignages infini : avance toujours dans le même sens (LTR, panneau suivant depuis la droite) */
  function initAvisCarousel() {
    var root = document.querySelector("[data-avis-carousel]");
    if (!root) return;

    var track = root.querySelector("[data-avis-track]");
    if (!track) return;

    var originals = Array.prototype.slice.call(track.querySelectorAll(":scope > .avis__slide"));
    if (originals.length < 2) return;

    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    var slides;
    var n;
    var i;
    var timerId = null;
    var intervalMs = 6500;
    var userPause = false;

    if (!reduceMotion) {
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
        if ("inert" in slide) {
          slide.inert = hidden;
        }
      });
    }

    function afterSlideChange() {
      window.requestAnimationFrame(function () {
        initAvisToggles();
      });
    }

    function tick() {
      if (document.hidden || userPause || reduceMotion) return;

      if (!reduceMotion && i === n - 1) {
        track.classList.add("avis__track--jump");
        i = 1;
        apply();
        void track.offsetHeight;
        track.classList.remove("avis__track--jump");
        afterSlideChange();
        return;
      }

      i = (i + 1) % n;
      apply();
      afterSlideChange();
    }

    function stopTimer() {
      if (timerId !== null) {
        window.clearInterval(timerId);
        timerId = null;
      }
    }

    function syncTimer() {
      stopTimer();
      if (reduceMotion || document.hidden || userPause) return;
      timerId = window.setInterval(tick, intervalMs);
    }

    apply();
    syncTimer();

    root.addEventListener("mouseenter", function () {
      userPause = true;
      syncTimer();
    });
    root.addEventListener("mouseleave", function () {
      userPause = false;
      syncTimer();
    });

    root.addEventListener("focusin", function () {
      userPause = true;
      syncTimer();
    });
    root.addEventListener("focusout", function (e) {
      var rel = e.relatedTarget;
      if (!rel || !root.contains(rel)) {
        userPause = false;
        syncTimer();
      }
    });

    document.addEventListener("visibilitychange", function () {
      syncTimer();
    });
  }

  initAvisToggles();
  initAvisCarousel();
  window.addEventListener("resize", initAvisToggles, { passive: true });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(initAvisToggles);
  }

  /*
   * Accueil — formules : variables CSS pour le sticky des cartes (nav + hauteur du bandeau).
   * Le titre « Mes services » reste visible via position: sticky sur .formules__head-anchor
   * (parent .formules__stack-main dans index.html) — pas d’écoute scroll / fixed.
   */
  (function initFormulesLayoutMetrics() {
    if (typeof window === "undefined" || !document.body.classList.contains("page-home")) {
      return;
    }

    var grid = document.getElementById("formules-grid");
    if (!grid) return;
    var head = grid.querySelector(".formules__head-anchor .formules__text-block");
    if (!head) return;

    var GAP = 16;
    var resizeTimer = 0;

    function getNavBottom() {
      var nav = document.querySelector(".hero-im__nav.hero-im__nav--above-stage");
      if (nav) {
        return Math.round(nav.getBoundingClientRect().bottom);
      }
      return 96;
    }

    function applyMetrics() {
      grid.style.setProperty("--formules-nav-under-live", getNavBottom() + GAP + "px");
      var nh = Math.round(head.offsetHeight);
      if (nh > 0) {
        grid.style.setProperty("--formules-pin-head-h", nh + "px");
      }
    }

    function onResize() {
      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }
      resizeTimer = window.setTimeout(function () {
        resizeTimer = 0;
        applyMetrics();
      }, 120);
    }

    function kick() {
      applyMetrics();
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(applyMetrics);
      });
    }

    kick();
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("load", kick);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(kick);
    }
  })();
})();

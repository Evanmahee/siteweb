import { loadAndRenderAvis } from "./avis-data.js";
import { initAvisCarousel, initAvisToggles } from "./avis-carousel.js";
import { sendContactEmail } from "./contact-email.js";

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

  /* Accueil : masquer la carte hero fixe dès que le footer entre dans le viewport (évite flash au scroll élastique sur le footer). */
  (function initPageHomeFooterHeroLayer() {
    if (typeof window === "undefined" || !document.body.classList.contains("page-home")) {
      return;
    }
    var footer = document.querySelector("main + footer.footer--nc");
    if (!footer) return;

    function sync() {
      var ft = footer.getBoundingClientRect().top;
      var hide = ft < window.innerHeight - 2;
      document.body.classList.toggle("page-home-hide-hero-stage", hide);
    }

    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", sync, { passive: true });
    }
  })();

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

  /* Contact : champ « Précise si Autre » + envoi EmailJS */
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

    var submitBtn = contactForm.querySelector(".form-wizard__submit") || contactForm.querySelector(".contact-dark__submit");
    var feedbackEl = document.getElementById("contact-form-feedback");
    var submitDefaultHtml = submitBtn ? submitBtn.innerHTML.trim() : "Envoyer ma fiche →";
    var reduceMotion =
      typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var successHoldMs = reduceMotion ? 2200 : 3800;

    function resetSubmitButton() {
      if (!submitBtn) return;
      submitBtn.classList.remove("is-sending", "is-success");
      submitBtn.disabled = false;
      submitBtn.removeAttribute("aria-busy");
      submitBtn.innerHTML = submitDefaultHtml;
    }

    function showSubmitSuccess() {
      if (!submitBtn) return;
      submitBtn.classList.remove("is-sending");
      submitBtn.classList.add("is-success");
      submitBtn.removeAttribute("aria-busy");
      submitBtn.innerHTML =
        '<span class="contact-dark__submit-check" aria-hidden="true">✓</span>' +
        '<span class="contact-dark__submit-label">Fiche envoyée</span>';

      if (feedbackEl) {
        feedbackEl.textContent =
          "Merci ! Ta fiche a bien été envoyée. Je te réponds sous 24–48h.";
        feedbackEl.removeAttribute("hidden");
      }

      window.setTimeout(function () {
        resetSubmitButton();
        if (feedbackEl) {
          feedbackEl.setAttribute("hidden", "");
          feedbackEl.textContent = "";
        }
        contactForm.reset();
        syncSourceAutreField();
        if (window.contactWizard && typeof window.contactWizard.setStep === "function") {
          window.contactWizard.setStep(1);
        }
      }, successHoldMs);
    }

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

      sendContactEmail(contactForm)
        .then(function () {
          showSubmitSuccess();
        })
        .catch(function (error) {
          console.error("Erreur EmailJS:", error);
          resetSubmitButton();
          if (feedbackEl) {
            feedbackEl.textContent =
              "L'envoi a échoué. Réessaie dans un instant ou écris à contact@nefelie.fr.";
            feedbackEl.removeAttribute("hidden");
          }
        });
    });
  }

  async function bootAvisSection() {
    if (!document.querySelector("#temoignages")) return;
    var data = await loadAndRenderAvis();
    initAvisCarousel(data);
    window.addEventListener("resize", initAvisToggles, { passive: true });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(initAvisToggles);
    }
  }

  bootAvisSection();

  /*
   * Accueil — formules (modèle Relay) :
   * une unité sticky (titre + scène) ; les cartes 2→5 glissent par-dessus ;
   * en fin de piste, titre + pile remontent ensemble.
   */
  (function initFormulesStack() {
    if (typeof window === "undefined" || !document.body.classList.contains("page-home")) {
      return;
    }

    var grid = document.getElementById("formules-grid");
    if (!grid) return;
    var track = grid.querySelector("[data-formules-track]");
    var stage = grid.querySelector("[data-formules-stage]");
    var slides = grid.querySelectorAll(".formules-stack__slot--slide");
    if (!track || !stage || !slides.length) return;

    var GAP = 16;
    var raf = 0;

    function getNavBottom() {
      var nav = document.querySelector(".hero-im__nav.hero-im__nav--above-stage");
      if (nav) {
        return Math.round(nav.getBoundingClientRect().bottom);
      }
      return 96;
    }

    function slideProgress(p, start, end) {
      if (p <= start) return 0;
      if (p >= end) return 1;
      return (p - start) / (end - start);
    }

    function clearDesktopStyles() {
      grid.style.removeProperty("--formules-nav-under-live");
      for (var i = 0; i < slides.length; i++) {
        slides[i].style.removeProperty("transform");
      }
      var slots = stage.querySelectorAll(".formules-stack__slot");
      for (var s = 0; s < slots.length; s++) {
        var card = slots[s].querySelector(".formule-card--split");
        if (card) card.style.removeProperty("min-height");
      }
    }

    function sync() {
      var mobile =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(max-width: 900px)").matches;
      var reduceMotion =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (mobile || reduceMotion) {
        clearDesktopStyles();
        return;
      }

      var navBottom = getNavBottom() + GAP;
      grid.style.setProperty("--formules-nav-under-live", navBottom + "px");

      var slots = stage.querySelectorAll(".formules-stack__slot");
      var cards = [];
      for (var c = 0; c < slots.length; c++) {
        var card = slots[c].querySelector(".formule-card--split");
        if (card) cards.push(card);
      }
      for (var h = 0; h < cards.length; h++) {
        cards[h].style.minHeight = "0px";
      }
      var maxH = 0;
      for (var m = 0; m < cards.length; m++) {
        maxH = Math.max(maxH, cards[m].offsetHeight);
      }
      if (maxH > 0) {
        grid.style.setProperty("--formule-card-stack-h", maxH + "px");
        for (var n = 0; n < cards.length; n++) {
          cards[n].style.minHeight = maxH + "px";
        }
      }

      var trackRect = track.getBoundingClientRect();
      var trackTop = window.scrollY + trackRect.top;
      var stickStart = trackTop - navBottom;
      var stickEnd = trackTop + track.offsetHeight - window.innerHeight;
      var range = Math.max(1, stickEnd - stickStart);
      var p = Math.min(1, Math.max(0, (window.scrollY - stickStart) / range));

      /* 4 slides successifs, hold final pour libérer l’unité sticky d’un bloc */
      var windows = [
        [0, 0.18],
        [0.2, 0.38],
        [0.4, 0.58],
        [0.6, 0.78],
      ];
      for (var i = 0; i < slides.length; i++) {
        var win = windows[i] || [0.8, 0.95];
        var t = slideProgress(p, win[0], win[1]);
        slides[i].style.transform = "translateY(" + ((1 - t) * 108).toFixed(2) + "%)";
      }
    }

    function onScrollOrResize() {
      if (raf) return;
      raf = window.requestAnimationFrame(function () {
        raf = 0;
        sync();
      });
    }

    sync();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    window.addEventListener("load", sync);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", onScrollOrResize, { passive: true });
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(sync);
    }
    if (typeof ResizeObserver === "function") {
      var ro = new ResizeObserver(onScrollOrResize);
      ro.observe(track);
      var head = grid.querySelector(".formules__text-block");
      if (head) ro.observe(head);
    }
  })();
})();

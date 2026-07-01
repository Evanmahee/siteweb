import { loadAndRenderAvis } from "./avis-data.js";
import { initAvisCarousel, initAvisToggles } from "./avis-carousel.js";

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

    var submitBtn = contactForm.querySelector(".form-wizard__submit") || contactForm.querySelector(".contact-dark__submit");
    var feedbackEl = document.getElementById("contact-form-feedback");
    var submitDefaultHtml = submitBtn ? submitBtn.innerHTML.trim() : "Envoyer ma fiche →";
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
          '<span class="contact-dark__submit-label">Fiche envoyée</span>';

        if (feedbackEl) {
          feedbackEl.textContent =
            "Merci ! Ta fiche a bien été prise en compte. (Version démo : relie ce formulaire à ton backend ou à un outil pour recevoir les demandes.)";
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
    /* Mobile : barre d’URL / visual viewport — recalcul bandeau + pin pour les cartes sticky #formules */
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", onResize, { passive: true });
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(kick);
    }
  })();
})();

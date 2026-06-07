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

  /* Formulaire de contact — démonstration côté navigateur uniquement */
  var form = document.querySelector(".contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var original = btn ? btn.textContent : "";
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Envoi en cours…";
      }
      window.setTimeout(function () {
        if (btn) {
          btn.disabled = false;
          btn.textContent = original;
        }
        alert(
          "Merci pour ton message. Version démo : connecte ce formulaire à ton serveur ou à un service tiers (formulaire hébergé, automatisation, etc.) pour recevoir les demandes par email."
        );
        form.reset();
      }, 650);
    });
  }

  /* Témoignages — aperçu + Voir plus / Cacher */
  function initAvisToggles() {
    var section = document.querySelector("#temoignages");
    if (!section) return;

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

    section.querySelectorAll(".avis__card").forEach(function (card) {
      var btn = card.querySelector(".avis__toggle");
      if (!btn || card.dataset.avisToggleBound) return;
      card.dataset.avisToggleBound = "1";
      btn.addEventListener("click", function () {
        var on = card.classList.toggle("avis__card--expanded");
        btn.setAttribute("aria-expanded", on ? "true" : "false");
        btn.textContent = on ? "Cacher" : "Voir plus";
      });
    });

    section.querySelectorAll(".avis__card").forEach(measureOne);
  }

  initAvisToggles();
  window.addEventListener("resize", initAvisToggles, { passive: true });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(initAvisToggles);
  }
})();

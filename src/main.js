(function () {
  "use strict";

  const header = document.querySelector(".site-header");
  const nav =
    document.querySelector(".site-header .nav") || document.querySelector(".hero--immersive .nav");
  const toggle =
    document.querySelector(".site-header .nav__toggle") ||
    document.querySelector(".hero--immersive .nav__toggle");
  const menu = document.querySelector("#nav-menu");
  const heroNavCta = document.querySelector(".hero--immersive .hero-im__nav");
  const stickyCtaBar = document.querySelector("#sticky-cta-home");
  const year = String(new Date().getFullYear());
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = year;
  });

  function syncStickyCtaReserve() {
    if (!stickyCtaBar || !document.body.classList.contains("has-sticky-cta-bar")) {
      document.documentElement.style.removeProperty("--sticky-cta-bar-reserve");
      return;
    }
    var h = stickyCtaBar.getBoundingClientRect().height;
    document.documentElement.style.setProperty("--sticky-cta-bar-reserve", Math.ceil(h + 8) + "px");
  }

  function setStickyCtaVisible(on) {
    if (!stickyCtaBar) return;
    stickyCtaBar.classList.toggle("is-visible", on);
    document.body.classList.toggle("has-sticky-cta-bar", on);
    stickyCtaBar.setAttribute("aria-hidden", on ? "false" : "true");
    stickyCtaBar.querySelectorAll("a[href], button:not([disabled])").forEach(function (el) {
      if (on) el.removeAttribute("tabindex");
      else el.setAttribute("tabindex", "-1");
    });
    if (on) {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(syncStickyCtaReserve);
      });
    } else {
      document.documentElement.style.removeProperty("--sticky-cta-bar-reserve");
    }
  }

  function updateStickyCtaFromHeroNav() {
    if (!heroNavCta || !stickyCtaBar) return;
    if (nav && nav.classList.contains("is-open")) {
      setStickyCtaVisible(false);
      return;
    }
    var r = heroNavCta.getBoundingClientRect();
    var inView = r.bottom > 0 && r.top < window.innerHeight;
    setStickyCtaVisible(!inView);
  }

  /* Nav background on scroll */
  function updateHeaderScroll() {
    if (!header) return;
    const scrolled = window.scrollY > 24;
    header.classList.toggle("is-scrolled", scrolled);
  }

  updateHeaderScroll();
  window.addEventListener("scroll", updateHeaderScroll, { passive: true });

  /* Mobile menu */
  function setMenuOpen(open) {
    if (!toggle || !nav || !menu) return;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    document.body.style.overflow = open ? "hidden" : "";
    if (heroNavCta && stickyCtaBar) {
      window.requestAnimationFrame(updateStickyCtaFromHeroNav);
    }
  }

  if (heroNavCta && stickyCtaBar) {
    var ctaIo = new IntersectionObserver(
      function () {
        updateStickyCtaFromHeroNav();
      },
      { threshold: 0, rootMargin: "0px" }
    );
    ctaIo.observe(heroNavCta);
    updateStickyCtaFromHeroNav();
    window.addEventListener("resize", syncStickyCtaReserve, { passive: true });
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setMenuOpen(!nav.classList.contains("is-open"));
    });

    menu?.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setMenuOpen(false);
      });
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) {
        setMenuOpen(false);
      }
    });
  }

  /* IntersectionObserver — fadeUp */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reduceMotion) {
    var revealEls = document.querySelectorAll(".reveal");
    if (revealEls.length) {
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
          threshold: 0.12,
          rootMargin: "0px 0px -40px 0px",
        }
      );

      revealEls.forEach(function (el) {
        if (el.classList.contains("formule-card--autre-slot")) return;
        io.observe(el);
      });
    }
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) {
      if (el.classList.contains("formule-card--autre-slot")) return;
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

  /* Formules — type de suivi (contrôle segmenté + grilles par mode) */
  var formulesSegments = document.querySelectorAll(".formules__segment");
  var formulesTitleEl = document.querySelector("#formules-title");
  var formulesIntroEl = document.querySelector("#formules-intro");
  var formulesNoteEl = document.querySelector("#formules-note");

  var bulletsDureeStandard = [
    "Bilans hebdomadaires",
    "Plan perso *",
    "Suivi nutritionnel",
    "Ajustements via bilans",
    "Analyse de vidéos",
    "WhatsApp 7j/7",
    "Contenus partagés",
  ];

  var bulletsDistancielSingle = [
    "Bilans à distance, ajustements du programme",
    "Plan perso * (application)",
    "Suivi nutritionnel",
    "Analyse de vidéos",
    "Adaptation selon tes retours",
    "WhatsApp 5j/7 ou 7j/7 selon formule",
    "Contenus d’accompagnement",
    "Séances à la carte, cartes 5 ou 10",
    "Bilan Inbody inclus selon l’offre",
  ];

  function formulesRenderList(ul, items) {
    if (!ul) return;
    ul.innerHTML = "";
    items.forEach(function (entry) {
      var li = document.createElement("li");
      if (entry && typeof entry === "object" && entry.heading) {
        li.className = "formule-card__list-heading";
        var strong = document.createElement("strong");
        strong.textContent = entry.heading;
        li.appendChild(strong);
      } else if (entry && typeof entry === "object" && entry.kv) {
        li.className = "formule-card__list-item--kv";
        var title = document.createElement("strong");
        title.className = "formule-card__list-kv-title";
        title.textContent = entry.kv;
        li.appendChild(title);
        if (entry.text) {
          var desc = document.createElement("span");
          desc.className = "formule-card__list-kv-desc";
          desc.textContent = entry.text;
          li.appendChild(desc);
        }
      } else {
        li.textContent = typeof entry === "string" ? entry : entry.text;
      }
      ul.appendChild(li);
    });
  }

  function formulesApplyMode(mode) {
    var block = formulesCopy[mode];
    if (!block || !formulesTitleEl || !formulesIntroEl) return;

    formulesTitleEl.textContent = block.title;
    formulesIntroEl.textContent = block.intro;
    if (formulesNoteEl) {
      var n = block.note != null ? String(block.note) : "";
      formulesNoteEl.textContent = n;
      if (!n.trim()) {
        formulesNoteEl.setAttribute("hidden", "");
      } else {
        formulesNoteEl.removeAttribute("hidden");
      }
    }

    var grid = document.querySelector("#formules-grid");
    var articles = document.querySelectorAll("#formules-grid .formule-card");

    if (grid) {
      grid.classList.toggle("formules__grid--single", block.cards.length === 1);
      grid.classList.toggle("formules__grid--cols-2", block.cards.length === 2);
      grid.setAttribute("data-formules-mode", mode);
    }

    var featIx = block.featuredIndex;
    var hasFeat = typeof featIx === "number" && featIx >= 0;

    articles.forEach(function (article, i) {
      article.classList.toggle("formule-card--autre-slot", mode === "autre" && i === 1);

      if (i >= block.cards.length) {
        article.hidden = true;
        article.classList.remove("formule-card--featured", "formule-card--gold-head");
        article.removeAttribute("aria-label");
        var b = article.querySelector(".formule-card__badge");
        if (b) b.setAttribute("hidden", "");
        return;
      }

      article.hidden = false;
      var card = block.cards[i];
      var dur = article.querySelector(".formule-card__duration");
      var tag = article.querySelector(".formule-card__tagline");
      var priceEl = article.querySelector(".formule-card__price");
      var list = article.querySelector(".formule-card__list");
      var badge = article.querySelector(".formule-card__badge");

      if (dur) {
        dur.textContent = card.duration;
        dur.classList.toggle("formule-card__duration--caps", !!card.titleCaps);
      }
      if (tag) tag.textContent = card.tagline;
      if (priceEl) {
        if (card.price) {
          priceEl.textContent = card.price;
          priceEl.removeAttribute("hidden");
        } else {
          priceEl.textContent = "";
          priceEl.setAttribute("hidden", "");
        }
      }
      formulesRenderList(list, card.items);

      article.classList.toggle("formule-card--gold-head", !!block.goldHeaders);
      var isFeat = hasFeat && i === featIx;
      article.classList.toggle("formule-card--featured", isFeat);
      if (isFeat) article.setAttribute("aria-label", "Formule recommandée : " + card.duration);
      else article.removeAttribute("aria-label");

      if (badge) {
        if (isFeat) badge.removeAttribute("hidden");
        else badge.setAttribute("hidden", "");
      }
    });

    if (grid) {
      var bilanSlot = grid.querySelector(".formule-card--autre-slot");
      if (bilanSlot) {
        if (mode === "autre") {
          bilanSlot.classList.add("is-visible");
        } else {
          bilanSlot.classList.remove("is-visible");
        }
      }
    }
  }

  if (formulesSegments.length && formulesTitleEl && formulesIntroEl) {
    var cardsSuiviDual = [
      {
        duration: "Suivi en distanciel",
        tagline: "3, 6 ou 12 mois · options à la carte",
        items: bulletsDistancielSingle.slice(),
      },
      {
        duration: "Suivi en présentiel",
        tagline: "3, 6 ou 12 mois",
        items: bulletsDureeStandard.slice(),
      },
    ];

    var formulesCopy = {
      distance: {
        title: "Mes accompagnements",
        intro:
          "Un coaching qui s’adapte à ta vie — en salle ou à distance, au rythme qu’il te faut.",
        note:
          "* Bilan sans engagement avant lancement. Présentiel : volume, fréquence et priorités ajustés au premier bilan.",
        featuredIndex: null,
        goldHeaders: false,
        cards: cardsSuiviDual,
      },
      autre: {
        title: "Programme et bilan",
        intro:
          "Un programme à suivre en autonomie en salle (12 semaines minimum, avec adaptations), ou un bilan d’environ une heure en présentiel à l’Appart Fitness Vannes Ouest pour cadrer ton objectif.",
        note: "Le bilan * est proposé en présentiel uniquement à l’Appart Fitness Vannes Ouest.",
        featuredIndex: null,
        goldHeaders: true,
        cards: [
          {
            duration: "Programme",
            tagline: "SANS SUIVI",
            price: "99 €",
            titleCaps: true,
            items: [
              "Programme à suivre sur minimum 12 semaines en salle de sport (avec adaptations)",
              "Option (non compris) : séance à l’unité, carte de séances",
            ],
          },
          {
            duration: "*Bilan",
            tagline: "En présentiel seulement à l’Appart Fitness Vannes Ouest",
            price: "30 €",
            titleCaps: false,
            items: [
              { kv: "Entretien personnalisé :", text: "Évaluation des besoins, attentes" },
              {
                kv: "Objectifs adaptés :",
                text: "Identification de vos objectifs sur court, moyen et long terme.",
              },
              { kv: "Durée :", text: "Environ 1h" },
              {
                kv: "Pourquoi le faire ?",
                text: "Introduire le coaching, présentations personnelles et présentation de l’offre de coaching personnalisée.",
              },
            ],
          },
        ],
      },
    };

    formulesSegments.forEach(function (seg) {
      seg.addEventListener("click", function () {
        var mode = seg.getAttribute("data-mode");
        if (!formulesCopy[mode]) return;

        formulesSegments.forEach(function (s) {
          var on = s === seg;
          s.classList.toggle("is-selected", on);
          s.setAttribute("aria-checked", on ? "true" : "false");
        });

        formulesApplyMode(mode);
      });
    });

    var initial = document.querySelector(".formules__segment.is-selected");
    if (initial && initial.getAttribute("data-mode")) {
      formulesApplyMode(initial.getAttribute("data-mode"));
    }
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

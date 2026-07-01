/**
 * Formulaire contact — navigation multi-étapes + échelles 0–10 générées.
 */
(function () {
  "use strict";

  var TOTAL_STEPS = 6;
  var STEP_NAMES = [
    "Tes coordonnées",
    "Objectifs & pratique",
    "Santé & mode de vie",
    "Ton alimentation",
    "Ton rapport à toi",
    "Orientation",
  ];

  var SCALES = [
  {
    name: "activite_hors_sport",
    label: "Activité en dehors du sport (0 = sédentaire, 10 = très actif)",
    left: "Sédentaire",
    right: "Très actif(ve)",
  },
  {
    name: "estime_amour_propre",
    label: "Estime de toi sur ton amour propre (0 à 10)",
    left: "Très bas",
    right: "Excellent",
  },
  {
    name: "estime_image_corporelle",
    label: "Estime de toi sur ton image corporelle (0 à 10)",
    left: "Très bas",
    right: "Excellent",
  },
  {
    name: "confiance",
    label: "Confiance en toi (0 à 10)",
    left: "Très bas",
    right: "Excellent",
  },
  {
    name: "responsabilite_resultats",
    label: "Je suis le/la 1er(e) responsable de mes résultats (0 à 10)",
    left: "Pas du tout d'accord",
    right: "Totalement d'accord",
  },
  {
    name: "engagement",
    label: "Niveau d'engagement envers cet objectif maintenant (0 à 10)",
    left: "Faible",
    right: "Total",
  },
  { name: "vie_travail", label: "Travail", left: "", right: "" },
  { name: "vie_famille", label: "Famille", left: "", right: "" },
  { name: "vie_epanouissement", label: "Épanouissement personnel", left: "", right: "" },
  { name: "vie_sociale", label: "Vie sociale", left: "", right: "" },
  ];

  function buildScale(scale) {
    var wrap = document.createElement("div");
    wrap.className = "contact-scale";
    var labelId = "label-scale-" + scale.name;
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-labelledby", labelId);

    var title = document.createElement("p");
    title.id = labelId;
    title.className = "contact-dark__block-title";
    title.textContent = scale.label;
    wrap.appendChild(title);

    var nums = document.createElement("div");
    nums.className = "contact-scale__nums";
    nums.setAttribute("role", "radiogroup");
    nums.setAttribute("aria-labelledby", labelId);

    for (var n = 0; n <= 10; n++) {
      var id = scale.name + "-" + n;
      var pill = document.createElement("div");
      pill.className = "contact-scale__btn";

      var input = document.createElement("input");
      input.type = "radio";
      input.className = "contact-scale__input";
      input.name = scale.name;
      input.id = id;
      input.value = String(n);

      var lbl = document.createElement("label");
      lbl.className = "contact-scale__label";
      lbl.setAttribute("for", id);
      lbl.textContent = String(n);

      pill.appendChild(input);
      pill.appendChild(lbl);
      nums.appendChild(pill);
    }
    wrap.appendChild(nums);

    if (scale.left || scale.right) {
      var hints = document.createElement("div");
      hints.className = "contact-scale__hints";
      var spanL = document.createElement("span");
      spanL.textContent = scale.left;
      var spanR = document.createElement("span");
      spanR.textContent = scale.right;
      hints.appendChild(spanL);
      hints.appendChild(spanR);
      wrap.appendChild(hints);
    }

    return wrap;
  }

  function mountScales(form) {
    form.querySelectorAll("[data-scale]").forEach(function (host) {
      var key = host.getAttribute("data-scale");
      var scale = SCALES.find(function (s) {
        return s.name === key;
      });
      if (!scale) return;
      host.appendChild(buildScale(scale));
    });
  }

  function updateProgress(form, step) {
    var dots = form.querySelectorAll(".form-wizard__dot");
    var lines = form.querySelectorAll(".form-wizard__line");
    var counter = form.querySelector(".form-wizard__counter");
    var stepName = form.querySelector(".form-wizard__step-name");

    dots.forEach(function (dot, i) {
      var num = i + 1;
      dot.classList.remove("is-done", "is-active");
      if (num < step) dot.classList.add("is-done");
      if (num === step) dot.classList.add("is-active");
    });

    lines.forEach(function (line, i) {
      line.classList.toggle("is-done", i + 1 < step);
    });

    if (counter) counter.textContent = "Étape " + step + " / " + TOTAL_STEPS;
    if (stepName) stepName.textContent = STEP_NAMES[step - 1] || "";
  }

  function scrollFormToTop(form) {
    var target = form.querySelector(".form-wizard__progress") || form;
    var header = document.querySelector(".site-header");
    var offset = (header ? header.getBoundingClientRect().height : 0) + 16;
    var top = window.scrollY + target.getBoundingClientRect().top - offset;
    var reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({
      top: Math.max(0, top),
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  function showStep(form, step) {
    form.querySelectorAll(".form-wizard__step").forEach(function (panel) {
      var panelStep = Number(panel.getAttribute("data-step"));
      var active = panelStep === step;
      panel.toggleAttribute("hidden", !active);
      panel.classList.toggle("is-active", active);
    });

    var backBtn = form.querySelector(".form-wizard__back");
    var nextBtn = form.querySelector(".form-wizard__next");
    var submitBtn = form.querySelector(".form-wizard__submit");

    if (backBtn) backBtn.hidden = step <= 1;
    if (nextBtn) nextBtn.hidden = step >= TOTAL_STEPS;
    if (submitBtn) submitBtn.hidden = step < TOTAL_STEPS;

    updateProgress(form, step);
    form.dataset.currentStep = String(step);

    if (step === 3) {
      syncCyclesVisibility(form);
    }

    var firstFocus = form.querySelector('.form-wizard__step[data-step="' + step + '"] input, .form-wizard__step[data-step="' + step + '"] select, .form-wizard__step[data-step="' + step + '"] textarea');
    if (firstFocus && typeof firstFocus.focus === "function") {
      try {
        firstFocus.focus({ preventScroll: true });
      } catch (err) {
        firstFocus.focus();
      }
    }

    var card = form.closest(".contact-dark__card");
    if (card) {
      window.requestAnimationFrame(function () {
        scrollFormToTop(form);
      });
    }
  }

  function syncCyclesVisibility(form) {
    var genre = form.querySelector("#genre");
    var block = form.querySelector(".form-wizard__cycles-block");
    if (!genre || !block) return;

    var hide = genre.value === "homme";
    block.toggleAttribute("hidden", hide);

    if (hide) {
      block.querySelectorAll("input, textarea, select").forEach(function (el) {
        if (el.type === "radio" || el.type === "checkbox") {
          el.checked = false;
        } else {
          el.value = "";
        }
      });
    }
  }

  function validateCheckboxGroups(panel) {
    var groups = panel.querySelectorAll("[data-required-group]");
    for (var g = 0; g < groups.length; g++) {
      var group = groups[g];
      if (group.closest("[hidden]")) continue;

      var name = group.getAttribute("data-required-group");
      if (!name) continue;

      var boxes = panel.querySelectorAll('input[name="' + name + '"]');
      if (!boxes.length) continue;

      var checked = false;
      for (var i = 0; i < boxes.length; i++) {
        if (boxes[i].checked) {
          checked = true;
          break;
        }
      }

      if (!checked) {
        var first = boxes[0];
        first.setCustomValidity("Sélectionne au moins une option.");
        first.reportValidity();
        first.focus();
        return false;
      }
    }

    return true;
  }

  function clearCheckboxGroupValidity(form) {
    form.querySelectorAll("[data-required-group] input").forEach(function (input) {
      input.setCustomValidity("");
    });
  }

  function validateStep(form, step) {
    var panel = form.querySelector('.form-wizard__step[data-step="' + step + '"]');
    if (!panel) return true;

    clearCheckboxGroupValidity(form);

    var fields = panel.querySelectorAll("input, select, textarea");
    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      if (field.closest("[hidden]")) continue;
      if (!field.willValidate) continue;
      if (!field.checkValidity()) {
        field.reportValidity();
        field.focus();
        return false;
      }
    }

    return validateCheckboxGroups(panel);
  }

  function initContactWizard() {
    var form = document.getElementById("contact-form");
    if (!form || !form.classList.contains("form-wizard")) return;

    mountScales(form);
    syncCyclesVisibility(form);

    var genreSelect = form.querySelector("#genre");
    if (genreSelect) {
      genreSelect.addEventListener("change", function () {
        syncCyclesVisibility(form);
      });
    }

    var currentStep = 1;
    showStep(form, currentStep);

    var backBtn = form.querySelector(".form-wizard__back");
    var nextBtn = form.querySelector(".form-wizard__next");

    if (backBtn) {
      backBtn.addEventListener("click", function () {
        if (currentStep > 1) {
          currentStep -= 1;
          showStep(form, currentStep);
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        if (!validateStep(form, currentStep)) return;
        if (currentStep < TOTAL_STEPS) {
          currentStep += 1;
          showStep(form, currentStep);
        }
      });
    }

    form.querySelectorAll("[data-required-group] input").forEach(function (input) {
      input.addEventListener("change", function () {
        clearCheckboxGroupValidity(form);
      });
    });

    form.addEventListener(
      "submit",
      function (e) {
        if (!validateStep(form, currentStep)) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      },
      true
    );

    form.addEventListener("reset", function () {
      window.setTimeout(function () {
        currentStep = 1;
        syncCyclesVisibility(form);
        showStep(form, currentStep);
      }, 0);
    });

    return { getStep: function () { return currentStep; }, setStep: function (s) { currentStep = s; showStep(form, currentStep); } };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initContactWizard);
  } else {
    initContactWizard();
  }
})();

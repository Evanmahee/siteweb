/**
 * Envoi du formulaire contact via l'API Resend (/api/send-email).
 */

function fieldValue(form, name) {
  var field = form.elements[name];
  if (!field) return "";

  if (typeof RadioNodeList !== "undefined" && field instanceof RadioNodeList) {
    var checked = form.querySelector('input[name="' + name + '"]:checked');
    return checked ? checked.value : "";
  }

  return String(field.value || "").trim();
}

function checkboxValues(form, name) {
  return Array.from(form.querySelectorAll('input[name="' + name + '"]:checked'))
    .map(function (el) {
      return el.value;
    })
    .join(", ");
}

/** Collecte tous les champs du formulaire pour l'API. */
export function collectContactFormData(form) {
  return {
    prenom: fieldValue(form, "prenom"),
    nom: fieldValue(form, "nom"),
    email: fieldValue(form, "email"),
    telephone: fieldValue(form, "telephone"),
    age: fieldValue(form, "age"),
    genre: fieldValue(form, "genre"),
    taille_cm: fieldValue(form, "taille_cm"),
    poids_kg: fieldValue(form, "poids_kg"),
    metier: fieldValue(form, "metier"),
    jours_travail: fieldValue(form, "jours_travail"),
    source: fieldValue(form, "source"),
    source_autre_detail: fieldValue(form, "source_autre_detail"),
    objectif_principal: fieldValue(form, "objectif_principal"),
    objectifs_detail: fieldValue(form, "objectifs_detail"),
    niveau_muscu: fieldValue(form, "niveau_muscu"),
    annees_muscu: fieldValue(form, "annees_muscu"),
    autres_sports: fieldValue(form, "autres_sports"),
    seances_semaine: fieldValue(form, "seances_semaine"),
    moment_entrainement: fieldValue(form, "moment_entrainement"),
    moments_impossibles: fieldValue(form, "moments_impossibles"),
    cardio: fieldValue(form, "cardio"),
    pathologies: fieldValue(form, "pathologies"),
    antecedents_familiaux: fieldValue(form, "antecedents_familiaux"),
    activite_hors_sport: fieldValue(form, "activite_hors_sport"),
    extremites_froides: fieldValue(form, "extremites_froides"),
    perte_cheveux: fieldValue(form, "perte_cheveux"),
    reglee: fieldValue(form, "reglee"),
    duree_cycles: fieldValue(form, "duree_cycles"),
    spm: fieldValue(form, "spm"),
    contraception: fieldValue(form, "contraception"),
    alimentation_journee: fieldValue(form, "alimentation_journee"),
    repas_plusieurs: fieldValue(form, "repas_plusieurs"),
    appetit: fieldValue(form, "appetit"),
    aliments_indispensables: fieldValue(form, "aliments_indispensables"),
    aliments_detestes: fieldValue(form, "aliments_detestes"),
    digestif: checkboxValues(form, "digestif[]"),
    eau_litres: fieldValue(form, "eau_litres"),
    complements: fieldValue(form, "complements"),
    suivi_passe: fieldValue(form, "suivi_passe"),
    estime_amour_propre: fieldValue(form, "estime_amour_propre"),
    estime_image_corporelle: fieldValue(form, "estime_image_corporelle"),
    confiance: fieldValue(form, "confiance"),
    responsabilite_resultats: fieldValue(form, "responsabilite_resultats"),
    engagement: fieldValue(form, "engagement"),
    soutien_entourage: fieldValue(form, "soutien_entourage"),
    vie_travail: fieldValue(form, "vie_travail"),
    vie_famille: fieldValue(form, "vie_famille"),
    vie_epanouissement: fieldValue(form, "vie_epanouissement"),
    vie_sociale: fieldValue(form, "vie_sociale"),
    type_accompagnement: checkboxValues(form, "type_accompagnement[]"),
    budget_mensuel: fieldValue(form, "budget_mensuel"),
    message: fieldValue(form, "message"),
  };
}

export function sendContactEmail(form) {
  return fetch("/api/send-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(collectContactFormData(form)),
  }).then(function (res) {
    return res.json().then(function (body) {
      if (!res.ok) {
        throw new Error(body && body.error ? body.error : "Erreur lors de l'envoi.");
      }
      return body;
    });
  });
}

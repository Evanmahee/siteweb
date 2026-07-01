import { Resend } from "resend";

const FROM = process.env.RESEND_FROM || "contact@nefeliecoaching.com";
const TO = process.env.RESEND_TO || "contact@nefeliecoaching.com";

const FIELD_LABELS = {
  prenom: "Prénom",
  nom: "Nom",
  email: "E-mail",
  telephone: "Téléphone",
  age: "Âge",
  genre: "Genre",
  taille_cm: "Taille (cm)",
  poids_kg: "Poids (kg)",
  metier: "Métier",
  jours_travail: "Jours travaillés / semaine",
  source: "Où m'a-t-on trouvée",
  source_autre_detail: "Précision source",
  objectif_principal: "Objectif principal",
  objectifs_detail: "Détail des objectifs",
  niveau_muscu: "Niveau musculation",
  annees_muscu: "Années d'expérience muscu",
  autres_sports: "Autres sports",
  seances_semaine: "Séances / semaine souhaitées",
  moment_entrainement: "Moment préféré",
  moments_impossibles: "Moments impossibles",
  cardio: "Cardio",
  pathologies: "Pathologies / blessures / allergies",
  antecedents_familiaux: "Antécédents familiaux",
  activite_hors_sport: "Activité hors sport (0–10)",
  extremites_froides: "Extrémités froides",
  perte_cheveux: "Pertes de cheveux",
  reglee: "Réglée",
  duree_cycles: "Durée des cycles",
  spm: "SPM",
  contraception: "Contraception",
  alimentation_journee: "Alimentation (journée type)",
  repas_plusieurs: "Plusieurs repas / jour",
  appetit: "Appétit",
  aliments_indispensables: "Aliments indispensables",
  aliments_detestes: "Aliments détestés",
  digestif: "Soucis digestifs",
  eau_litres: "Eau / jour",
  complements: "Compléments alimentaires",
  suivi_passe: "Suivi coach / diététicien(ne)",
  estime_amour_propre: "Estime — amour propre (0–10)",
  estime_image_corporelle: "Estime — image corporelle (0–10)",
  confiance: "Confiance (0–10)",
  responsabilite_resultats: "Responsabilité résultats (0–10)",
  engagement: "Engagement (0–10)",
  soutien_entourage: "Soutien entourage",
  vie_travail: "Vie — travail (0–10)",
  vie_famille: "Vie — famille (0–10)",
  vie_epanouissement: "Vie — épanouissement (0–10)",
  vie_sociale: "Vie — sociale (0–10)",
  type_accompagnement: "Type d'accompagnement",
  budget_mensuel: "Budget mensuel",
  message: "Message libre",
};

function sendJson(res, status, data) {
  if (typeof res.status === "function" && typeof res.json === "function") {
    res.status(status).json(data);
    return;
  }
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fieldRow(label, value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return (
    "<tr>" +
    '<td style="padding:6px 12px 6px 0;vertical-align:top;font-weight:600;color:#333;white-space:nowrap;">' +
    escapeHtml(label) +
    "</td>" +
    '<td style="padding:6px 0;color:#111;">' +
    escapeHtml(text).replace(/\n/g, "<br>") +
    "</td>" +
    "</tr>"
  );
}

function buildEmailHtml(data) {
  const rows = Object.keys(FIELD_LABELS)
    .map(function (key) {
      return fieldRow(FIELD_LABELS[key], data[key]);
    })
    .filter(Boolean)
    .join("");

  return (
    "<div style=\"font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#111;\">" +
    "<h2 style=\"margin:0 0 16px;font-size:20px;\">Nouvelle fiche contact</h2>" +
    "<table style=\"border-collapse:collapse;width:100%;max-width:640px;\">" +
    rows +
    "</table>" +
    "</div>"
  );
}

async function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (req.method !== "POST") return null;

  return new Promise(function (resolve, reject) {
    var raw = "";
    req.on("data", function (chunk) {
      raw += chunk;
    });
    req.on("end", function () {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (_err) {
        reject(new Error("JSON invalide"));
      }
    });
    req.on("error", reject);
  });
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    sendJson(res, 500, { error: "Configuration serveur manquante (RESEND_API_KEY)." });
    return;
  }

  let data;
  try {
    data = await parseBody(req);
  } catch (_err) {
    sendJson(res, 400, { error: "Corps de requête invalide." });
    return;
  }

  if (!data || typeof data !== "object") {
    sendJson(res, 400, { error: "Données manquantes." });
    return;
  }

  const prenom = String(data.prenom || "").trim();
  const nom = String(data.nom || "").trim();
  const email = String(data.email || "").trim();

  if (!prenom || !nom || !email) {
    sendJson(res, 400, { error: "Prénom, nom et e-mail sont requis." });
    return;
  }

  if (!isValidEmail(email)) {
    sendJson(res, 400, { error: "Adresse e-mail invalide." });
    return;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: FROM,
      to: TO,
      replyTo: email,
      subject: "Nouveau contact — " + prenom + " " + nom,
      html: buildEmailHtml(data),
    });

    sendJson(res, 200, { success: true });
  } catch (err) {
    console.error("Resend send failed:", err);
    sendJson(res, 500, { error: "Impossible d'envoyer l'e-mail." });
  }
}

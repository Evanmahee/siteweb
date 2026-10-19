import { Resend } from "resend";
import { createHash } from "node:crypto";
import { contactRateLimited } from "../server/contact-rate-limit.js";


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
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
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

const MAX_BODY_BYTES = 64 * 1024;
async function parseBody(req) {
  if (Number(req.headers["content-length"]) > MAX_BODY_BYTES) {
    throw Object.assign(new Error("Payload too large"), { status: 413 });
  }
  if (req.body !== undefined) {
    const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(raw) > MAX_BODY_BYTES) throw Object.assign(new Error("Payload too large"), { status: 413 });
    return typeof req.body === "string" ? JSON.parse(raw) : req.body;
  }
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += Buffer.byteLength(chunk);
    if (bytes > MAX_BODY_BYTES) throw Object.assign(new Error("Payload too large"), { status: 413 });
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export default async function handler(req, res) {
  res.setHeader("Allow", "POST");
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const contentType = req.headers["content-type"] || "";
  if (contentType.split(";")[0].trim().toLowerCase() !== "application/json") {
    return sendJson(res, 415, { error: "Le format JSON est requis." });
  }
  // Browsers cannot submit JSON cross-origin without a preflight (OPTIONS is rejected).
  const origin = req.headers.origin;
  if (req.headers["sec-fetch-site"] === "cross-site") {
    return sendJson(res, 403, { error: "Origine non autorisée." });
  }
  if (origin) {
    try {
      if (new URL(origin).host !== req.headers.host) {
        return sendJson(res, 403, { error: "Origine non autorisée." });
      }
    } catch { return sendJson(res, 403, { error: "Origine non autorisée." }); }
  }
  try {
    if (await contactRateLimited(req)) {
      res.setHeader("Retry-After", "900");
      return sendJson(res, 429, { error: "Trop de tentatives. Réessaie dans 15 minutes." });
    }
  } catch {
    return sendJson(res, 503, { error: "L’envoi est momentanément indisponible. Merci de réessayer plus tard." });
  }

  let data;
  try {
    data = await parseBody(req);
  } catch (_err) {
    sendJson(res, _err.status === 413 ? 413 : 400, { error: "Corps de requête invalide ou trop volumineux." });
    return;
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    sendJson(res, 400, { error: "Données manquantes." });
    return;
  }

  if (typeof data.website !== "undefined" && typeof data.website !== "string") {
    return sendJson(res, 400, { error: "Données invalides." });
  }
  if (data.website) return sendJson(res, 200, { success: true }); // Honeypot: no email is sent.
  const requestId = data.requestId;
  if (requestId !== undefined && (typeof requestId !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(requestId))) {
    return sendJson(res, 400, { error: "Identifiant de demande invalide." });
  }
  const clean = {};
  for (const key of Object.keys(FIELD_LABELS)) {
    const value = data[key] ?? "";
    if (typeof value !== "string" || value.length > 5000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) {
      return sendJson(res, 400, { error: "Un champ contient une valeur invalide ou trop longue." });
    }
    clean[key] = value.trim();
  }
  data = clean;
  const prenom = String(data.prenom || "").trim();
  const nom = String(data.nom || "").trim();
  const email = String(data.email || "").trim();

  if (!prenom || !nom || !email) {
    sendJson(res, 400, { error: "Prénom, nom et e-mail sont requis." });
    return;
  }

  if (prenom.length > 100 || nom.length > 100 || /[\r\n]/.test(prenom + nom) || email.length > 254 || !isValidEmail(email)) {
    sendJson(res, 400, { error: "Prénom, nom ou adresse e-mail invalide." });
    return;
  }

  const choices = data.type_accompagnement.split(",").map(value => value.trim()).filter(Boolean);
  if (!choices.length || choices.some(value => !["distanciel", "presentiel", "complet", "carte"].includes(value)) ||
      !["moins-150", "150-350", "350+"].includes(data.budget_mensuel)) {
    return sendJson(res, 400, { error: "Sélectionne un accompagnement et un budget." });
  }
  for (const [field, min, max] of [["age",12,120],["taille_cm",120,230],["poids_kg",30,250]]) {
    if (data[field] && (!Number.isFinite(Number(data[field])) || Number(data[field]) < min || Number(data[field]) > max)) {
      return sendJson(res, 400, { error: "Une valeur numérique est hors limites." });
    }
  }
  const FROM = process.env.RESEND_FROM || "contact@nefeliecoaching.com";
  const TO = process.env.RESEND_TO || "contact@nefeliecoaching.com";
  if (!process.env.RESEND_API_KEY) {
    return sendJson(res, 503, { error: "L’envoi est momentanément indisponible. Merci de réessayer plus tard." });
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: FROM,
      to: TO,
      replyTo: email,
      subject: "Nouveau contact — " + prenom + " " + nom,
      html: buildEmailHtml(data),
    }, {
      signal: AbortSignal.timeout(15000),
      ...(requestId ? { idempotencyKey: "contact/" + createHash("sha256").update(requestId + JSON.stringify(data) + FROM + TO).digest("hex") } : {}),
    });

    if (result.error || !result.data?.id) throw new Error("Provider rejected email");
    sendJson(res, 200, { success: true });
  } catch (err) {
    console.error("Resend send failed"); // Do not log contact or health data.
    sendJson(res, 500, { error: "Impossible d'envoyer l'e-mail." });
  }
}

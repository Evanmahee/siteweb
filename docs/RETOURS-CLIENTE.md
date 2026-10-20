# Retours cliente — suivi du 20 octobre 2026

## Appliqué en local, non publié
- Expérience : 11+ ; personnes coachées : 100+.
- Programmes : 300+ selon l’estimation évoquée ; confirmer le comptage des programmes successifs.
- Ancien total de 10 000 heures retiré : aucun nouveau total inventé.
- Mentions 3 / 6 / 12 mois supprimées des offres et de la FAQ. Modalités à définir lors de l’échange.
- Présentiel décrit comme séances individuelles en salle à Vannes.
- Alimentation explicitement incluse dans le suivi à distance.
- Onglets alimentation et micro-nutrition regroupés. Suivi premium renommé temporairement suivi complet.
- Détails des offres agrandis sur mobile.
- Avis et compteurs de l’accueil alimentés par /api/reviews en priorité, avec cache local de secours.
- Vidéo WhatsApp et logos officiels intégrés le 20 octobre, sans modifier le texte du hero.

## Informations nécessaires avant finalisation
1. Modalités réelles de chaque suivi : engagement, durée, renouvellement, fréquence, prix. Les tarifs actuellement connus (programme 99 €, bilan 50 €) sont conservés, ainsi que les 12 semaines minimum du programme autonome : confirmer s’ils restent valables.
2. Offre « become » : orthographe confirmée le 20 octobre ; promesse, prestations, public, prix et durée. Remplace-t-elle le suivi complet ou s’ajoute-t-elle aux cinq offres ? Le nom est associé provisoirement au suivi complet existant ; aucune prestation supplémentaire n’est inventée.
3. Vidéo WhatsApp et deux logos reçus et intégrés le 20 octobre. Cadrage mobile à valider ensemble. Éventuels rushs courts par prestation.
4. Photos à conserver/remplacer et éventuels portraits préférés, notamment photo smoothie.
5. Confirmer 300+ programmes et définir un éventuel total fiable d’heures de coaching.
6. Accès Google : clé Places et Place ID de la bonne fiche, à renseigner en variables serveur dans Vercel et/ou secrets GitHub. Ne jamais coller de clé dans le chat. Le total annoncé de 30 avis n’a pas été vérifié en direct. Sans configuration, le cache garde le dernier nombre disponible.
7. Son poste local : URL du dépôt utilisé, branche, dossier ouvert et URL/port affichés par Vite. Sans ces éléments, impossible de confirmer pourquoi elle retrouve l’ancienne version. Voir MODIFIER-LES-TEXTES.md.
8. Autonomie souhaitée : modifier les textes dans Cursor avec preview, ou véritable éditeur visuel connecté ? L’ajout d’un CMS demande un choix d’accès et de publication. Aucun éditeur public non protégé n’est ajouté.
9. Teinte marron éventuelle : référence à valider. Palette actuelle conservée.
10. Titres et descriptions définitifs à fournir par la cliente.

## Hébergement : points déjà ouverts
- Redis partagé à configurer pour activer la limite anti-spam distribuée.
- Envoi réel Resend et domaine expéditeur à valider en production.

Les changements locaux ne remplacent pas le site publié avant un nouveau push et un déploiement réussi.

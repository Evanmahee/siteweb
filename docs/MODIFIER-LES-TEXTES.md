# Retrouver la bonne version et modifier les textes

Le dépôt de ce projet est https://github.com/Evanmahee/siteweb, branche `main`.

## Sur le poste de la cliente
1. Ouvrir le dossier correspondant à ce dépôt dans Cursor.
2. Dans le terminal intégré, vérifier le dossier avec `pwd`, le dépôt avec `git remote -v` et la branche avec `git branch --show-current`.
3. Vérifier `git status`. S’il existe du travail local, le sauvegarder avant toute synchronisation ; ne pas faire de reset forcé.
4. Récupérer la dernière version publiée avec `git pull --ff-only origin main`. Si Git signale une divergence, conserver les modifications et demander de l’aide.
5. Lancer `npm install`, puis `npm run dev`.
6. Ouvrir précisément l’adresse affichée dans ce terminal. Un ancien serveur peut encore tourner sur un autre port ; ne pas réutiliser aveuglément un ancien onglet.

Les nouvelles modifications de contenu préparées ici ne sont pas encore sur GitHub tant qu’elles n’ont pas été poussées.

## Modifier les textes
- Accueil, offres et FAQ : `index.html`.
 - Formulaire : uniquement dans `index.html`, section `#contact`.
- Pour trouver un texte : recherche globale dans Cursor, puis remplacement du texte visible entre les balises. Éviter de modifier les `id`, `name`, `data-*` ou les attributs des champs.
- La preview se met à jour à l’enregistrement. Une modification locale n’est pas automatiquement publiée sur Vercel.
- Les avis viennent de l’API Google ou de son cache : ne pas réécrire les témoignages pour modifier leur sens.

Cette procédure permet d’éditer le code avec une preview. Elle ne constitue pas un éditeur visuel de type WordPress ; ce besoin reste à définir ensemble.

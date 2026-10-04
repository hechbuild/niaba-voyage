# Niaba Voyage

Site Niaba Voyage déployé sur Cloudflare Pages, avec Supabase pour l’authentification/CRM et une fonction Cloudflare Pages pour la recherche de vols Amadeus.

## Cloudflare Pages
- Framework preset : None
- Build command : laisser vide
- Build output directory : /
- Production branch : main
- API vols : `functions/api/flights.js`

## Variables d’environnement Cloudflare
Configurer dans Cloudflare Pages > Settings > Environment variables :

- `AMADEUS_CLIENT_ID`
- `AMADEUS_CLIENT_SECRET`
- `AMADEUS_ENV` : `test` ou `production`
- `AMADEUS_BASE_URL` : optionnel
- `FLIGHT_MARKUP_RATE` : marge décimale, par exemple `0.40` pour 40 %

Les secrets Amadeus ne doivent jamais être placés dans le JavaScript public.

## Supabase
Le schéma Supabase est versionné dans `supabase/migrations/`.

Les migrations de sécurité empêchent notamment :
- la modification du rôle d’un profil par un utilisateur non administrateur ;
- les soumissions CRM excessivement longues ;
- les répétitions immédiates d’un même lead ;
- l’accès public direct aux tables privées ;
- l’exposition directe de la table des affiliés pour le suivi des références.

## Contact
- WhatsApp : +228 91 81 34 48
- Email : niaba.voyage@gmail.com
- Adresse : 12 BP 203 Baguida, Lomé – Togo

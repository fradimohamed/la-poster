# La Poster

Boutique statique d'affiches musicales, développée en HTML, CSS et JavaScript. Les pages et images restent dans le dépôt. Supabase fournit l'authentification, le catalogue partagé, les commandes et l'accès administrateur.

## Pages

- `index.html` : accueil
- `produits.html` : catalogue, recherche, filtres, tri et panier
- `produit-vedette.html` : poster à la une
- `panier.html`, `checkout.html`, `confirmation.html` : commande de démonstration
- `inscription.html`, `connexion.html`, `verification.html`, `reinitialiser.html`, `compte.html` : compte client
- `admin.html` : statut des commandes et gestion du catalogue, réservé au rôle administrateur
- `contact.html`, `a-propos.html` : informations et contact

## Connexion Supabase

1. Remplacez l'URL et la clé publishable dans `supabase-client.js`.
2. Dans un nouveau projet Supabase, exécutez `supabase-setup.sql`, puis `supabase-orders.sql`.
3. Attribuez le rôle administrateur manuellement avec `supabase-admin.sql`.
4. Consultez [SUPABASE.md](SUPABASE.md) pour les réglages Auth, le diagnostic, les limites de démonstration et la publication Vercel.

Le paiement n'est pas réel. La livraison est à confirmer et n'est pas incluse dans le total provisoire.

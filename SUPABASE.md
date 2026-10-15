# Supabase et publication Vercel — La Poster

Le site reste un site statique HTML/CSS/JS. Ce dépôt contient le client et les écrans, mais **n'est connecté à aucun projet Supabase tant que `supabase-client.js` n'a pas reçu l'URL et la clé publishable**. Aucun accès distant ni test d'authentification/commande n'a été exécuté dans cette session.

## 1. Créer et configurer Supabase

1. Créez un nouveau projet Supabase dédié au projet universitaire. Les scripts ci-dessous sont destinés à ce nouveau schéma `public`. Si votre projet contient déjà des tables, arrêtez-vous et faites auditer leur schéma avant de lancer `supabase-setup.sql`.
2. Dans les paramètres API du projet, copiez **Project URL** et la **publishable key**. Remplacez les deux valeurs de `supabase-client.js`.
3. La clé publishable est destinée au navigateur ; elle n'est pas un secret. **Ne collez jamais une clé `secret` ou `service_role` dans le site.** La sécurité dépend des grants et des politiques RLS configurés dans `supabase-setup.sql`.
4. Dans le SQL Editor du projet neuf, exécutez `supabase-setup.sql`, puis `supabase-orders.sql`, dans cet ordre. Le premier crée le catalogue (20 TND par produit), les rôles et leurs politiques; le second crée les commandes, leurs politiques et la RPC atomique `create_demo_order`. Ils ne suppriment pas de table.
5. Dans Authentication > URL Configuration, ajoutez les URLs de redirection utilisées en développement et l'URL HTTPS Vercel du site. L'inscription revient vers `connexion.html`; la réinitialisation utilise `reinitialiser.html`.
6. Dans Authentication, vérifiez la méthode e-mail, la confirmation d'adresse et la configuration d'envoi d'e-mails. Le comportement et la délivrabilité dépendent de ces paramètres.
7. Créez votre utilisateur depuis la page d'inscription du site. Dans Authentication > Users, copiez son UUID. Remplacez `VOTRE-UUID-AUTH` dans `supabase-admin.sql` et exécutez ce script **manuellement** dans SQL Editor pour lui attribuer le rôle admin. Ne donnez jamais au navigateur une permission de modifier `user_roles`.
8. Après l'installation, exécutez `supabase-orders.sql` pour examiner les permissions. La réponse RLS dépend de l'identité PostgreSQL exécutant le diagnostic ; validez aussi les accès dans le navigateur avec un utilisateur anonyme, un client, puis l'administrateur.

Les comptes utilisent Supabase Auth. Les données d'accès ne sont pas enregistrées dans `localStorage`. Le panier non sensible reste local dans `la-poster-cart-v1`. Les anciennes clés locales de compte/commande de l'ancien prototype ne sont ni lues ni importées.

## 2. Commandes et limites

`create_demo_order` ignore les prix envoyés par le navigateur et relit les prix/états du catalogue. Elle valide les quantités et l'adresse, fabrique un instantané des articles, refuse les totaux incohérents et utilise un identifiant de tentative unique par utilisateur pour éviter les doublons après un nouvel essai réseau. Les commandes ne peuvent pas être créées par insertion directe du client ; RLS ne permet la lecture qu'au propriétaire ou à un administrateur. L'interface admin change le statut et permet de créer/modifier/masquer les produits.

Les calculs sont en millimes entiers (20 TND = 20 000 millimes). Aucun moyen de paiement réel n'est intégré et aucun champ bancaire n'existe. La livraison est **provisoirement configurée à zéro dans la RPC**, mais affichée « à confirmer » ; ce n'est ni un tarif gratuit annoncé ni un montant final. Définissez un tarif avant de transformer la démonstration en boutique réelle.

Les images du catalogue sont des chemins du dépôt, par exemple `images/poster-1.jpg.jpg`. Les nouvelles images que vous chargez par l'administration doivent déjà exister dans le dépôt, ou être une URL publique HTTPS. Les chemins de fichiers du disque `C:\...` ne fonctionneront pas après publication.

## 3. Vercel

1. Publiez le dépôt sur GitHub depuis GitHub Desktop, puis importez ce dépôt dans Vercel.
2. Dans les réglages de projet Vercel : **Framework Preset: Other**, **Build Command: vide**, **Output Directory: `.`** (racine du dépôt), **Install Command: vide**. Le projet n'a ni compilation ni installation de dépendances.
3. Déployez. Dans Supabase URL Configuration, ajoutez l'URL HTTPS exacte du site publiée, ainsi que les URLs de prévisualisation nécessaires. Testez les liens d'e-mail sur le domaine HTTPS final.
4. Ouvrez `/`, inscrivez un nouvel utilisateur test, confirmez l'e-mail, connectez-vous, ajoutez des posters, puis testez une commande de démonstration et consultez-la dans le compte/admin.

Le site doit être servi par HTTP/HTTPS (localhost ou Vercel), pas en ouvrant directement le fichier `index.html` en `file://`. La bibliothèque Supabase est chargée via CDN.

## Contrôles à faire avant usage réel

- Vérifier les politiques/grants avec trois identités client distinctes (anonyme, client A, client B) et un admin ; le SQL Editor sous `postgres` ne reproduit pas les contraintes client RLS.
- Vérifier confirmation/réinitialisation d'e-mail et les URLs autorisées.
- Définir livraison, conditions de vente, confidentialité, retours, inventaire et un véritable prestataire de paiement si nécessaire.
- Ne jamais traiter le choix « carte — simulation » comme une transaction réelle.

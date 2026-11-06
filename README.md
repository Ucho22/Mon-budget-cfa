# Mon Budget — Version 2 (personnelle)

## Nouveautés
- Quatre comptes : espèces, Wave, Orange Money et banque.
- Soldes de départ configurables.
- Revenus, dépenses et provisions associés à un compte.
- Transferts entre comptes : débit du compte source et crédit du compte destinataire, sans fausser revenus/dépenses.
- Solde réel estimé de chaque compte et disponible global après provisions.
- Budgets mensuels, alertes, graphiques, objectifs d'épargne, export JSON et cache hors-ligne.

## Mise en route
L'application nécessite un serveur HTTP pour activer le mode PWA. Dans ce dossier :
`python -m http.server 8000`
Puis ouvrir `http://localhost:8000`.

Pour l'installer sur téléphone, publier les fichiers sur un hébergement HTTPS. Android : menu du navigateur > Installer. iPhone : Safari > Partager > Sur l'écran d'accueil.

## Première configuration
1. Ouvrir « Gérer les comptes ».
2. Saisir le solde actuel de chaque portefeuille (espèces, Wave, Orange Money, banque).
3. Enregistrer ensuite chaque revenu et dépense dans le compte concerné.
4. Utiliser « Transfert » pour déplacer de l'argent entre ses propres comptes.
5. Définir ses enveloppes et ses provisions.

## Calculs
- Solde d'un compte = solde de départ + revenus − dépenses + transferts reçus − transferts envoyés.
- Disponible = somme des soldes des comptes − provisions cumulées enregistrées.
- Les transferts ne sont ni des revenus ni des dépenses.
- Une provision est une affectation budgétaire : elle réduit le disponible, mais ne retire pas physiquement l'argent d'un compte.

## Données et sécurité
Les données restent dans le stockage local du navigateur sur cet appareil. Pas de connexion aux comptes Wave, Orange Money ou bancaires, pas de synchronisation cloud. Le bouton d'export produit une sauvegarde JSON. Conserve-la en lieu sûr. Si tu effaces les données du navigateur ou changes d'appareil, restaure manuellement depuis une sauvegarde (la restauration intégrée n'est pas encore proposée).

# Tests HTTP - API SaaS Hub

Ce dossier contient des fichiers de test HTTP complètement mockés pour tester tous les endpoints de l'application.

## 📋 Fichiers disponibles

- **`auth.http`** - Tests pour l'authentification (register, login, refresh, profile)
- **`organizations.http`** - Tests pour la gestion des organisations et des utilisateurs

## 🚀 Utilisation

### Option 1: REST Client (Extension VS Code)

1. Installer l'extension **REST Client** dans VS Code
2. Ouvrir un fichier `.http`
3. Cliquer sur "Send Request" au-dessus de chaque requête
4. Voir la réponse dans le panneau à droite

### Option 2: IntelliJ IDEA / WebStorm

1. Les fichiers `.http` sont nativement supportés
2. Cliquer sur l'icône ▶️ à côté de chaque requête
3. Voir la réponse dans l'éditeur

### Option 3: Postman / Insomnia

1. Copier les requêtes HTTP depuis les fichiers
2. Importer dans votre outil préféré
3. Remplacer les variables mockées par de vraies valeurs

## 🔧 Configuration

### Variables d'environnement

Les fichiers utilisent des variables mockées définies en haut de chaque fichier :

```http
@baseUrl = http://localhost:3000/api
@mockEmail = test@example.com
@mockPassword = Password123!
@mockAccessToken = your-token-here
```

### Remplacer les tokens mockés

**Important** : Pour tester les endpoints authentifiés, vous devez :

1. D'abord vous connecter avec `POST /api/auth/login`
2. Copier le `accessToken` de la réponse
3. Remplacer `{{mockAccessToken}}` dans les fichiers

### Workflow recommandé

1. **S'inscrire ou se connecter** :
   ```http
   POST {{baseUrl}}/auth/register
   # ou
   POST {{baseUrl}}/auth/login
   ```

2. **Récupérer le token** de la réponse

3. **Mettre à jour les variables** dans le fichier :
   ```http
   @mockAccessToken = <votre-vrai-token>
   ```

4. **Tester les autres endpoints** avec le token

## 📝 Exemples de tests

### Tests d'authentification

- ✅ Inscription avec succès
- ✅ Connexion avec succès
- ✅ Rafraîchissement du token
- ✅ Récupération du profil
- ❌ Tests d'erreurs (email existant, mot de passe incorrect, etc.)

### Tests d'organisations

- ✅ Création d'organisation
- ✅ Liste des organisations
- ✅ Récupération par ID/slug
- ✅ Mise à jour
- ✅ Suppression
- ✅ Gestion des membres (ajout, suppression, changement de rôle)
- ❌ Tests d'erreurs (slug existant, utilisateur non membre, etc.)

## 🎯 Workflows complets

Chaque fichier contient des workflows complets en fin de fichier qui montrent comment enchaîner plusieurs requêtes :

### Workflow Authentification

1. Register → obtenir tokens
2. Login → obtenir tokens
3. Get Profile → utiliser le token

### Workflow Organisations

1. Create Organization → obtenir l'ID
2. Get My Organizations → lister
3. Add Users → ajouter des membres
4. Get Users → voir les membres
5. Update User Role → changer le rôle

## ⚠️ Notes importantes

1. **Port par défaut** : Les tests utilisent `http://localhost:3000/api`
   - Changez `@baseUrl` si votre serveur tourne sur un autre port

2. **Tokens expirés** : Les tokens JWT expirent après 24h par défaut
   - Utilisez `/auth/refresh` pour obtenir un nouveau token

3. **Données mockées** : Les IDs et tokens dans les fichiers sont des exemples
   - Remplacez-les par de vraies valeurs après vos premières requêtes

4. **Base de données** : Assurez-vous que votre base de données MySQL est démarrée
   - Les requêtes créent de vraies données si `synchronize: true` dans la config

## 🐛 Debugging

Si vous rencontrez des erreurs :

1. **401 Unauthorized** : Vérifiez que votre token est valide
2. **404 Not Found** : Vérifiez que l'ID/slug existe
3. **409 Conflict** : L'entité existe déjà (email, slug, etc.)
4. **400 Bad Request** : Vérifiez le format des données (validation)

## 📚 Structure des réponses

Les réponses sont documentées dans chaque fichier avec des commentaires `### Réponse attendue:`.

Consultez les commentaires dans les fichiers pour voir les formats de réponse attendus.


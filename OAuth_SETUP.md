# Configuration OAuth2 pour SaaS Hub

Ce guide vous explique comment configurer l'authentification OAuth2 avec Google, GitHub et Microsoft.

## 📋 Variables d'environnement requises

Les variables suivantes doivent être configurées dans votre fichier `.env` :

### Google OAuth
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL` (défaut: `http://localhost:3000/api/auth/google/callback`)

### GitHub OAuth
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_CALLBACK_URL` (défaut: `http://localhost:3000/api/auth/github/callback`)

### Microsoft OAuth
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- `MICROSOFT_CALLBACK_URL` (défaut: `http://localhost:3000/api/auth/microsoft/callback`)

## 🔧 Configuration des providers

### 1. Google OAuth

1. Allez sur la [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API Google+ pour votre projet
4. Créez des identifiants OAuth 2.0 :
   - Type d'application : Application Web
   - URI de redirection autorisés : `http://localhost:3000/api/auth/google/callback` (ou votre URL de production)
5. Copiez le **Client ID** et le **Client secret**
6. Ajoutez-les dans votre fichier `.env` :
   ```env
   GOOGLE_CLIENT_ID=votre-google-client-id
   GOOGLE_CLIENT_SECRET=votre-google-client-secret
   ```

**Documentation** : https://developers.google.com/identity/protocols/oauth2

### 2. GitHub OAuth

1. Allez dans [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/developers)
2. Cliquez sur "New OAuth App"
3. Remplissez le formulaire :
   - **Application name** : SaaS Hub
   - **Homepage URL** : `http://localhost:4200`
   - **Authorization callback URL** : `http://localhost:3000/api/auth/github/callback`
4. Cliquez sur "Register application"
5. Copiez le **Client ID** et créez un **Client secret**
6. Ajoutez-les dans votre fichier `.env` :
   ```env
   GITHUB_CLIENT_ID=votre-github-client-id
   GITHUB_CLIENT_SECRET=votre-github-client-secret
   ```

**Documentation** : https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps

### 3. Microsoft OAuth

1. Allez sur le [Azure Portal](https://portal.azure.com/)
2. Allez dans **Azure Active Directory > App registrations > New registration**
3. Remplissez le formulaire :
   - **Name** : SaaS Hub
   - **Supported account types** : Accounts in any organizational directory and personal Microsoft accounts
   - **Redirect URI** : `http://localhost:3000/api/auth/microsoft/callback`
4. Cliquez sur "Register"
5. Dans la page **Overview**, copiez le **Application (client) ID**
6. Allez dans **Certificates & secrets** et créez un **Client secret**
7. Ajoutez-les dans votre fichier `.env` :
   ```env
   MICROSOFT_CLIENT_ID=votre-microsoft-client-id
   MICROSOFT_CLIENT_SECRET=votre-microsoft-client-secret
   ```

**Documentation** : https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app

## 🚀 Utilisation

Une fois les variables configurées :

1. Redémarrez votre application backend
2. Allez sur la page de login (`http://localhost:4200/login`)
3. Cliquez sur le bouton du provider OAuth souhaité
4. Autorisez l'application à accéder à vos informations
5. Vous serez redirigé vers le dashboard

## ✅ Vérification

Pour vérifier que tout fonctionne :

1. Vérifiez que les routes OAuth sont disponibles :
   - `GET /api/auth/google`
   - `GET /api/auth/github`
   - `GET /api/auth/microsoft`

2. Vérifiez que les callbacks redirigent correctement vers le frontend

3. Testez l'authentification complète avec un compte de test

## 🔒 Sécurité

⚠️ **Important** :
- Ne commitez jamais vos secrets dans le repository Git
- Utilisez des variables d'environnement différentes pour le développement et la production
- En production, utilisez HTTPS pour toutes les URL de callback
- Régénérez les secrets en cas de fuite

## 🐛 Dépannage

### Erreur "redirect_uri_mismatch"
- Vérifiez que l'URL de callback dans `.env` correspond exactement à celle configurée dans le provider OAuth
- Vérifiez que vous utilisez `http://localhost` (pas `127.0.0.1`)

### Erreur "invalid_client"
- Vérifiez que les variables `CLIENT_ID` et `CLIENT_SECRET` sont correctement copiées
- Assurez-vous qu'il n'y a pas d'espaces avant/après les valeurs dans `.env`

### Erreur "access_denied"
- L'utilisateur a annulé l'authentification
- Vérifiez les permissions demandées dans les scopes OAuth

## 📝 Notes

- Les utilisateurs créés via OAuth n'ont pas de mot de passe et ne peuvent pas utiliser la connexion par email/password
- Les utilisateurs existants peuvent lier leur compte OAuth en se connectant via OAuth
- L'avatar de l'utilisateur est automatiquement récupéré depuis le provider (si disponible)


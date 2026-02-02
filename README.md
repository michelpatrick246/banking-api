# 🏦 Banking API

API backend bancaire développée avec **NestJS**, **Prisma** et **PostgreSQL (Neon)**.
Elle permet de gérer des **comptes bancaires**, des **transactions** (dépôt, retrait, transfert) et une **authentification JWT sécurisée**.

---

## 🚀 Fonctionnalités

- 🔐 Authentification & autorisation (JWT)
- 👤 Gestion des utilisateurs
- 🏦 Gestion des comptes bancaires
  - Création de comptes
  - Activation / gel / clôture
  - Gestion du solde

- 💸 Transactions bancaires
  - Dépôt (deposit)
  - Retrait (withdraw)
  - Transfert entre comptes
  - Limites de transactions
    - Limite journalière
    - Limite mensuelle
    - Contrôle des montants cumulés
    - Prévention des abus et fraudes basiques

- 🔁 Transactions atomiques avec Prisma
- 📊 Health checks (base de données)
- 📚 Documentation API avec Swagger

---

## 🧱 Stack technique

- **Node.js**
- **NestJS**
- **TypeScript**
- **Prisma ORM**
- **PostgreSQL (Neon)**
- **JWT / Passport**
- **Swagger (OpenAPI)**

---

## ⚙️ Installation

### 1️⃣ Cloner le projet

```bash
git clone https://github.com/michelpatrick246/banking-api.git
cd banking-api
```

### 2️⃣ Installer les dépendances

```bash
npm install
```

### 3️⃣ Configurer les variables d’environnement

Créer un fichier `.env` :

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=verify-full
JWT_SECRET=super-secret-key
PORT=3000
NODE_ENV=development
```

---

## 🗄️ Prisma & Base de données

### Générer le client Prisma

```bash
npx prisma generate
```

### Appliquer les migrations

```bash
npx prisma migrate dev
```

---

## ▶️ Lancer l’application

### Mode développement

```bash
npm run start:dev
```

### Mode production

```bash
npm run build
npm run start:prod
```

---

## 📚 Documentation API (Swagger)

Une fois l’application lancée :

👉 **Swagger UI** :

```
http://localhost:3000/api/docs
```

Fonctionnalités Swagger :

- Description complète des endpoints
- Exemples de requêtes
- Authentification JWT via `Authorize`

---

## 🔐 Authentification

- Auth basée sur **JWT**
- Token à fournir via le header :

```
Authorization: Bearer <token>
```

- Protection des routes avec `JwtAuthGuard`

---

## 🧪 Health Check

Endpoint de santé :

```
GET /health
```

Vérifie :

- Connexion à la base de données (Prisma)

Compatible avec :

- Docker
- Kubernetes (readiness / liveness probes)

---

## 💸 Transactions & cohérence

- Toutes les opérations financières sont exécutées dans des **transactions Prisma**
- Garantie :
  - Atomicité
  - Rollback automatique
  - Sécurité en concurrence

Exemple :

- transfert = débit + crédit + création transaction → tout ou rien

---

## 🔒 Sécurité

- Validation des entrées avec `class-validator`
- Transformation des données avec `class-transformer`
- SSL obligatoire pour PostgreSQL (Neon)

---

## 🚀 Déploiement (recommandations)

- Dockeriser l’application
- Activer HTTPS
- Protéger Swagger en production
- Utiliser des variables d’environnement sécurisées

---

## 🛣️ Améliorations futures

- Notifications (events)
- Pagination & filtres
- Monitoring (Sentry / Prometheus)
- Tests unitaires & e2e

---

## 👨‍💻 Auteur

Projet développé dans un objectif **backend / NestJS / architecture bancaire**.

---

## 📄 Licence

MIT License

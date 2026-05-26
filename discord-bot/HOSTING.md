# Hébergement du bot Dumbys 🐝

> Guide pour passer le bot de "tourne sur mon PC" à "tourne 24h/24".

---

## Option recommandée — Railway 🚂

**Pourquoi Railway ?**
- Déploiement en 2 minutes depuis GitHub
- Variables d'env en UI (pas de SSH)
- ~$5/mois pour un bot 24/7
- Logs en temps réel dans le dashboard
- Redémarrage automatique si le bot crash

### Étapes

#### 1. Préparer le repo

Assure-toi que ces fichiers existent à la racine du dossier `discord-bot/` :

```
discord-bot/
  src/
  package.json       ← "start": "node dist/index.js"
  tsconfig.json
  .env.example       ← NE PAS commiter le .env réel
```

#### 2. Créer un compte Railway
→ https://railway.app (connecte-toi avec GitHub)

#### 3. Nouveau projet

1. **New Project** → **Deploy from GitHub repo**
2. Sélectionne ton repo Dumbys
3. Railway détecte le `package.json` automatiquement

> ⚠️ Si le bot est dans un sous-dossier `discord-bot/`, configure le **Root Directory** = `discord-bot` dans les settings du service.

#### 4. Variables d'environnement

Dans Railway → ton service → **Variables**, ajoute :

```
DISCORD_TOKEN=...
DISCORD_CLIENT_ID=...
DISCORD_GUILD_ID=...              (optionnel — retire en prod)
DISCORD_NOTIF_CHANNEL_ID=...
DISCORD_WELCOME_CHANNEL_ID=...
DISCORD_MEMBER_ROLE_ID=...
DISCORD_STAFF_CHANNEL_ID=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

#### 5. Build & start commands

Dans **Settings** → **Deploy** :
- **Build Command** : `npm run build`
- **Start Command** : `npm run start`

#### 6. Deploy 🚀

Clique **Deploy** — Railway build le TypeScript et lance le bot.  
Dans les logs tu verras :
```
🐝 Dumbeez Bot prêt — connecté en tant que Dumbys#1234
✅ Slash commands enregistrées
```

---

## Option budget — Hetzner VPS (~€3.29/mois)

Si tu veux plus de contrôle ou héberger d'autres choses en même temps.

### Étapes rapides

```bash
# 1. Se connecter au VPS
ssh root@ton-ip

# 2. Installer Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 3. Installer PM2 (gestionnaire de process)
npm install -g pm2

# 4. Cloner le repo
git clone https://github.com/ton-repo/dumbys.git
cd dumbys/discord-bot

# 5. Créer le .env
cp .env.example .env
nano .env   # remplis les valeurs

# 6. Installer & build
npm install
npm run build

# 7. Lancer avec PM2 (redémarre auto au crash + au reboot)
pm2 start dist/index.js --name dumbys-bot
pm2 startup   # pour démarrer au boot du serveur
pm2 save
```

**Commandes utiles PM2 :**
```bash
pm2 logs dumbys-bot      # voir les logs
pm2 restart dumbys-bot   # redémarrer
pm2 status               # état des process
```

---

## Option gratuite — Fly.io (avec limitations)

Fly.io offre 3 machines partagées gratuitement, mais la mise en place est plus complexe (Docker obligatoire).

### Dockerfile minimal

Crée `discord-bot/Dockerfile` :

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["node", "dist/index.js"]
```

```bash
# Installer flyctl
curl -L https://fly.io/install.sh | sh

# Login & deploy
fly auth login
fly launch --name dumbys-bot
fly secrets set DISCORD_TOKEN=xxx SUPABASE_URL=xxx ...
fly deploy
```

---

## ⚠️ Points d'attention avant de déployer

1. **Ne jamais commiter le `.env`** — vérifie que `.gitignore` contient `.env`
2. **Service Role Key Supabase** — c'est une clé admin, garde-la secrète
3. **`DISCORD_GUILD_ID`** — retire-la en production pour que les slash commands soient globales (mais ça prend ~1h à se propager)
4. **Realtime Supabase** — le bot maintient une connexion WebSocket permanente, il DOIT tourner 24/7 pour ne rien rater

---

## Recommandation finale

| Priorité | Choix | Prix | Complexité |
|----------|-------|------|------------|
| 🥇 Facile & rapide | **Railway** | ~$5/mois | ⭐ |
| 🥈 Pas cher & flexible | **Hetzner VPS** | ~€3.29/mois | ⭐⭐⭐ |
| 🥉 Gratuit mais complexe | **Fly.io** | Gratuit | ⭐⭐⭐⭐ |

**→ Pour démarrer : Railway. Point.**

# bomberman-web-client

Jeu Bomberman multijoueur jouable uniquement en ligne. Un compte est nécessaire pour jouer.

**Stack :** JavaScript, Node.js (Express + WebSocket `ws`), MongoDB (Mongoose), HTML/CSS/JS natif côté client (Canvas 2D, aucune librairie front).

## Prérequis

- [Node.js](https://nodejs.org/) 20 ou supérieur (vérifier avec `node -v`)
- [Docker](https://www.docker.com/) et Docker Compose (pour MongoDB)
- [Git](https://git-scm.com/)

## Installation

0. **Mettez vous dans le dossier bomberman**

    ```bash
    cd bomberman
    ```

1. **Installer les dépendances**

   ```bash
   npm install
   ```

2. **Configurer les variables d'environnement**

   ```bash
   cp .env.exemple .env
   ```

   Puis ouvrir `.env` et renseigner les valeurs :

   | Variable     | Description                               | Exemple                               |
   |--------------|-------------------------------------------|---------------------------------------|
   | `PORT`       | Port du serveur                           | `3000`                                |
   | `MONGO_URI`  | URI de connexion MongoDB                  | `mongodb://localhost:27017/bomberman` |
   | `JWT_SECRET` | Secret de signature des tokens (long, aléatoire) | `une-longue-chaine-aleatoire`  |
   | `NODE_ENV`   | Environnement                             | `development`                         |

   > Pour générer un secret : `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

3. **Lancer MongoDB**

   ```bash
   docker compose up -d
   ```

4. **Lancer le serveur**

   ```bash
   npm run dev
   ```

5. **Ouvrir le jeu** : [http://localhost:3000](http://localhost:3000)

Pour tester le multijoueur en local, ouvrir deux navigateurs (ou une fenêtre privée) avec deux comptes différents.

## Scripts disponibles

| Commande         | Description                                  |
|------------------|----------------------------------------------|
| `npm run dev`    | Lance le serveur avec rechargement automatique (nodemon) |
| `npm start`      | Lance le serveur en mode production          |
| `npm test`       | Lance les tests (Jest)                       |

## Structure du projet

```
bomberman/
├── client/        # Front : pages HTML, CSS, JS natif, assets
│   ├── js/game/   # Rendu Canvas, gestion des entrées, état du jeu
│   └── js/ui/     # Gestion des écrans (login, lobby, HUD)
├── server/        # Back : Express, WebSocket, logique de jeu
│   ├── game/      # Boucle de jeu, rooms, entités (joueurs, bombes...)
│   ├── models/    # Schémas Mongoose (User, Match)
│   ├── routes/    # Routes HTTP (auth, profil, classement)
│   └── ws/        # Serveur WebSocket et handlers de messages
├── shared/        # Constantes et types de messages communs client/serveur
├── tests/         # Tests unitaires
└── docker-compose.yml
```

## Architecture en bref

- Le **serveur est autoritaire** : il détient l'état réel de la partie. Les clients envoient uniquement leurs intentions (déplacement, pose de bombe).
- L'**authentification** passe par l'API HTTP (inscription/connexion, mot de passe hashé avec bcrypt, JWT en cookie `httpOnly`). Le token est aussi vérifié à la connexion WebSocket.
- L'état des parties en cours reste **en mémoire** ; MongoDB ne stocke que les comptes, les statistiques et l'historique des matchs.

## Problèmes courants

- **`ECONNREFUSED` vers MongoDB** : vérifier que le conteneur tourne (`docker compose ps`) et que `MONGO_URI` est correct.
- **Port déjà utilisé** : changer `PORT` dans `.env`, ou libérer le port 3000.
- **Erreur après un `git pull`** : relancer `npm install`, de nouvelles dépendances ont pu être ajoutées.
- **Repartir d'une base vide** : `docker compose down -v` supprime aussi les données MongoDB.

## Contribuer

- Créer une branche par fonctionnalité (`feature/nom-de-la-feature`)
- Ne jamais commiter le fichier `.env`
- Lancer `npm test` avant d'ouvrir une pull request
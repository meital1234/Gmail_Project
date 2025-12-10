# 🚀 Setup – Environment (Docker + Frontend + Build/Compile)

This guide explains how to bring up the **entire system** (server + DB + web client) **using Docker Compose**.

---

## 📌 Components & Ports

| Component | Purpose | Default Port | How to access |
|---|---|---:|---|
| **bloom filter server** | C++ Bloom Filter TCP server (single persistent socket) | **8080** | tcp: //localhost:8080 |
| **server API** | Node.js REST endpoints for users, mails, labels, blacklist | **3000** | http://localhost:3000 |
| **client** | React Web application for Login/Register, Inbox, Compose, Edit/Delete mails| **3001** | http://localhost:3001 |
| **mongo** | MongoDB database connection for the API | **27017** | mongodb: //localhost:27017  |
| **android** | Android app  | – | via Android Studio / emulator |

---

## 🛠️ Prerequisites
- Docker Desktop (or Docker Engine) + Docker Compose
- Git (to clone the repository)

Verify:
```bash
docker --version
docker compose version
```
---

## 📁 Clone the Repository 
```bash
git clone https://github.com/myemenachem/the_best_Gmail_EVER
cd the_best_Gmail_EVER
```
---

## 🔐 Environment Variables
This project expects two `.env` files:  
```
the_best_Gmail_EVER/
├─ src/web_server/
│  └─ .env        # API env (Mongo URL, port, JWT secret)
├─ src/frontend/
│  └─ .env        # Web client env (API base URL, dev port)
└─ docker-compose.yml
```

**`web_server/.env` (Node/Express API)**
```env
# Mongo connection:
MONGODB_URI=mongodb://mongo:27017/thebestgmail

# API port (Frontend ↔ Backend):
REACT_APP_API_URL=http://web:3000

# JWT signing secret  
JWT_SECRET=replace_me_with_a_long_random_string
```

**`frontend/.env` (React web client)**
```env
# API base URL the browser should call:
REACT_APP_API_URL=http://localhost:3000

# React dev server port (when running client locally)
PORT=3001
```

**Notes**
- Keep secrets out of Git. Prefer committing `*.env.example` and creating local `.env` files:
  ```bash
  cp src/web_server/.env.example src/web_server/.env
  cp src/frontend/.env.example  src/frontend/.env
  ```
- Android **emulator** calls the API at **`http://10.0.2.2:3000`**


---
## 🧱 What gets compiled during Docker build?
- **server image** (Node): typically runs `npm ci` (or `npm install`) to install deps.  
- **client image** (React): runs `npm ci` and **`npm run build`** to generate the production bundle.  
- **mongo**: official image (no compile).

> The above steps are defined in the Dockerfiles.  
When you run a compose **build**, code is compiled and bundled inside the images.

---

## ▶️ Docker - Build & Run  
1) **Build clean images to compile everything fresh:**
```bash
docker-compose build --no-cache
```

2) **Start Containers in background:**
```bash
docker-compose up -d
```

**suggestion:** You can also use a single command to build & start containers at once:
```bash
docker compose up --build -d
```

3) **Check Status & Logs**
```bash
docker compose ps
docker compose logs -f server
docker compose logs -f mongo
```
<img width="1050" height="289" alt="36 - docker is up" src="https://github.com/user-attachments/assets/7799c022-542b-4847-aa0d-44e426019103" />

---

## 🌍 Open the Apps (Web + Android)

- **Web Client (React)** — http://localhost:3001  
  You should see the Login/Register UI.  

- **Android Client (emulator)**  
  Base API URL: `http://10.0.2.2:3000`  
  Steps: Open Android Studio → start an emulator → launch the app → Register/Login → Inbox.  

- **Server API (Node/Express)** — http://localhost:3000  
  Hitting `/` may return **404** (expected). Use API routes during flows.

- **MongoDB**  
  Internal (Compose): `mongo:27017`  
  External (host): `mongodb://localhost:27017`

---

## ⏹ Stop / Clean Up

1) **Stop containers**
```bash
docker-compose down
```
2) **Remove containers + networks + volumes (⚠ deletes DB data)**
```bash
docker-compose down -v
```
3) **Optional: prune dangling images/volumes**
```bash
docker system prune -f
docker volume prune -f
```
<img width="1086" height="181" alt="37 - docker down" src="https://github.com/user-attachments/assets/7cbdda91-3758-468d-bd15-df0db3610a36" />
---

## ❗ Common Pitfalls

- **Ports in use:** Change mapping in `docker-compose.yml` or stop other apps using 3000/3001/27017.  
- **Android cannot reach API:** Use `10.0.2.2` (not `localhost`) from the emulator.  
- **JWT/Secrets:** Don’t commit real secrets; use local `.env` files.  
- **Mongo host**: Server must use the container name **`mongo`** for internal DNS (`mongodb://mongo:27017/...`).

---

[⬅ Back to Home](Home.md) | [➡ Frontend Access](Frontend.md)

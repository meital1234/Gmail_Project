#  Exercise 5 - The Best Gmail Ever (Android Integration)

## 📚 About
This exercise is the fifth part of a multi-phase project building a Gmail-like mail system. In this part, we create the full environment with **Docker Compose** and demonstrating the core flows (Register/Login + Create/Edit/Delete mails) with **Web** and **Android** clients integrated into the same backend.

---

## 🏗️ Architecture

### System Overview
```
┌──────────────────────┐      HTTP/REST       ┌───────────────────┐        CRUD        ┌───────────────────┐
│ React Web Client     │  ─────────────────▶  │  Express API      │  ───────────────▶  │   MongoDB         │
│ (Port 3001)          │  ◀────────────────   │  (Port 3000)      │  ◀───────────────  │   (Port 27017)    │
└──────────────────────┘                      └───────────────────┘                    └───────────────────┘
         ▲
         │ HTTP/REST (emulator uses http://10.0.2.2:3000)
         │
┌──────────────────────┐
│ Android App          │
└──────────────────────┘
```
**Notes**
- Android emulator must hit **`http://10.0.2.2:3000`** to reach the API on the host machine.
- Docker Compose brings everything up together: `docker compose up -d --build`.
---

## 🧩 Components

- **React Web (3001)** — Register/Login, Inbox, Compose, Edit, Delete; client‑side token handling.  
- **Android App** — integrated into the project, pointing to the same API; base URL set to **`http://10.0.2.2:3000`**.  
- **Express API (3000)** — JWT auth, Users, Mails endpoints; validation and error handling.  
- **MongoDB (27017)** — Persists users, mails, labels; accessed by the API service.  
- **Docker Compose** — Single command bring‑up of all services (server + Mongo + web client) with Docker Compose, consistent local environment.
---

## ▶️ How to Run
Make sure you have **Docker** and **Docker Compose** installed.

### Build all components (backend + frontend):
```bash
docker-compose build
```

Start services:
```bash
docker-compose up  -d
```

Check services:
```bash
# Frontend Android app 

```

 Cleanup
```bash
docker-compose down
``` 

**Access Points**
- Web (Android): http://localhost:3001  
- Server API (Node): http://localhost:3000  
- MongoDB: mongodb: //localhost:27017

---
## 🖥️ Web + 📱 Android
**Web** — open http://localhost:3001 and use **Register** / **Login**.  
**Android** — run on an emulator and set base URL to:  
```
http://10.0.2.2:3000
```
This maps the emulator to the host’s `localhost` where the server runs via Docker.

---

## 🔧 Troubleshooting (short)
- **Android can’t reach API** → use `http://10.0.2.2:3000` (not `localhost`).  
- **Ports busy (3000/3001/27017)** → change mappings in `docker-compose.yml` or stop the conflicting app.  
- **Server errors** → `docker compose logs -f server`.  
- **Reset DB** → `docker compose down -v` (⚠ deletes volumes).

---

## 📸 Screenshots
> The following screenshots illustrate key parts of the Ex5 implementation- Login, registration, inbox, sending and managing emails, theme switching, and search results
> ### Login page with form validation
<img width="360" height="" alt="image" src="images/readme/01_android_login.jpg" />

> ### Login page with invalid validation
<img width="360" height="" alt="image" src="images/readme/14_android_invalid_credentials.jpg" />

> ### Registration page
<img width="360" height="" alt="image" src="images/readme/02_android_registration.jpg" />

> ### Email compose screen & successful email send
<img width="360" height="" alt="image" src="images/readme/03_android_compose.jpg" />
<img width="360" height="" alt="image" src="images/readme/04_android_send_success.jpg" />

> ### Adding label functiolaity & using it
<img width="360" height="" alt="image" src="images/readme/16_android_add_label.jpg" />
<img width="360" height="" alt="image" src="images/readme/17_android_add_label_success.jpg" />
<img width="360" height="" alt="image" src="images/readme/18_android_choose_label.jpg" />
<img width="360" height="" alt="image" src="images/readme/19_android_using_label.jpg" />

> ### Theme switching between light and dark modes
<img width="360" height="" alt="image" src="images/readme/20_android_darkmode.jpg" />

---
Built with ❤️
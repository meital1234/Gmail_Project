# 🏗️ Architecture & API Overview

This section gives a high-level look at the **architecture** & the **core API** used by the Web & Android clients.

---

## 🧩 Architecture (Layers)
- **Clients (Web/Android)** → UI & UX, call the REST API
- **Server (Node.js / Express)** → Controllers → Services → Models (Mongo driver/Mongoose)
- **MongoDB** → persistence (users, mails, labels...)

### System Overview
```
┌──────────────────────┐      HTTP/REST       ┌───────────────────┐        CRUD        ┌───────────────────┐
│ React Web Client     │  ─────────────────▶  │  Express API     │  ───────────────▶  │   MongoDB         │
│ (Port 3001)          │  ◀────────────────   │  (Port 3000)     │  ◀───────────────  │   (Port 27017)    │
└──────────────────────┘                      └───────────────────┘                    └───────────────────┘
         ▲
         │ HTTP/REST (emulator uses http://10.0.2.2:3000)
         │
┌──────────────────────┐
│ Android App          │
└──────────────────────┘
```

**Notes**
- Android emulator must reach the API via **`http://10.0.2.2:3000`**.
- Docker Compose exposes React on **3001**, API on **3000**, and MongoDB on **27017**.

---
## 📡 Core API (index)
- Register: **POST** `/api/users` → `201` (or `400` on validation errors)
- Login: **POST** `/api/tokens` → `200` with `{ token, expiresIn }`
- Create mail: **POST** `/api/mails` → `201 {id,isSpam:false}` or `200 {id,isSpam:true}`
- Edit draft: **PATCH** `/api/mails/{id}` → `204`
- Delete: **DELETE** `/api/mails/{id}` → `204`
- List mails: **GET** `/api/mails` → `200`
- Get by id: **GET** `/api/mails/{id}` → `200` / `404`

For details and examples, see **[Auth](Auth.md)** and **[Mails](Mails.md)**.

## 🔖 Labels (optional endpoints)
If labels are exposed via API, routes in the code include:
- `GET /api/labels` — list labels → `[{ "id": "...","name": "..." }]`
- `POST /api/labels` — create label → `201 Created` or `409 Conflict` if duplicate
- `POST /api/mails/{mailId}/labels/{labelId}` — add label to a mail → `200 OK`
- `DELETE /api/mails/{mailId}/labels/{labelId}` — remove label from a mail → `200 OK`

---

[⬅ Mail Operations](Mails.md)

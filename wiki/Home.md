# 📖 Bloomly - The Best Gmail Ever – Wiki

Welcome! This wiki walks you through running the **entire system end‑to‑end** and using it as a user:
- Bring up the environment with **Docker Compose**
- Access the **Web frontend** and the **Android app**
- **Create a user** and **log in**
- **Create / Edit / Delete mails** from the clients (Web & Android) and via API
- Understand the **main status codes** and what they mean
- Get a quick overview of the **architecture and API**

---

## 🔧 Technology Tools

- **Frontend**: JavaScript, CSS
- **Backend**: JavaScript, C++
- **Mobile**: Java, XML (Android)
- **Deployment**: Docker, CMakeFile

---

## 📚 Table of Contents
1. [🚀 Setup – Bring Up the System](Setup.md)
2. [🖥️ Frontend Access – Web & Android](Frontend.md)
3. [Inbox Overview](Inbox.md)
4. [🔐 Register & Login – UI & API](Auth.md)
5. [✉️ Mail Operations – UI & API](Mails.md)
6. [🏗️ Architecture & API Overview](API.md)

---

## 🌱 Bloom Filter Logic

The Bloom Filter server runs as a C++ TCP service on port 8080.
It maintains a bit array and multiple hash functions to efficiently check whether a URL is blacklisted.

Add URL → the URL is hashed and the corresponding bits are set.  
Check URL → if all bits are set, the URL is possibly blacklisted (false positives possible, but never false negatives). When a URL is identified as a potential blacklisted URL, it is searched in the blacklist to return a result (wether it's a false positive or a true positive).  
Delete URL → remove from the external list, update Bloom filter state on disk.  

The Node.js API (server on port 3000) connects to this TCP server via a single persistent socket, sending commands (GET/POST/DELETE) and parsing responses.   
Clients (web / Android) never talk to 8080 directly — they always go through the API.

---

## ✅ End-2-End Flow (at a glance)
1) Start the stack: `docker compose up -d`  
2) Open Web at **http://localhost:3001** (login/register)  
3) Create a user (UI or API)  
4) Log in (UI or API)  
5) **Compose / Edit / Delete mails** in Web or Android (or via API)  
6) Android: use **http://10.0.2.2:3000** as the API base when running on emulator

---

[➡ Go to Setup](Setup.md)

# Exercise 4 – Gmail-like Frontend (Advanced Programming Systems)

## 📋 Content
- [About](#-about)
- [Architecture](#-architecture)
- [How to Run](#-how-to-run)
- [Screenshots](#-screenshots)

## 📚 About
This exercise is the fourth part of a multi-phase project building a Gmail-like mail system. In this part, we create a **React-based web application** with **HTML, CSS, JavaScript** that interacts dynamically with the server from Exercise 3.

The goal is to provide a user-friendly **frontend client** with a Gmail-inspired design and functionality, allowing users to register, login, view and manage emails, and filter spam using a blacklist.

### Key Features
- 🔐 **User Registration & Login** – JWT-based authentication 
- 📧 **Inbox & Mail Management** – View, send, edit, and delete emails  
- 🏷️ **Labels** – Manage email labels  
- 🚫 **Spam Filtering** – Blacklist support through the backend server
- 📄 **Drafts** – Manage draft emails
- 🎨 **Theme Switching** – Light / Dark mode
   

## 🏗️ Architecture

### System Overview
```
┌─────────────────┐    HTTP/REST    ┌─────────────────┐    TCP Socket    ┌─────────────────┐
│ React Frontend  │ ◄─────────────► │  Express API    │ ◄──────────────► │  Bloom Server   │
│   (Port 3001)   │                 │   (Port 3000)   │                  │   (Port 8080)   │
└─────────────────┘                 └─────────────────┘                  └─────────────────┘
```

### Components

#### 🎨 React Frontend
- Developed using **React**, **HTML**, **CSS**, **JavaScript**
- Communicates with the backend (Ex3) via REST API
- Fully dynamic – no hardcoded data
- State management with `useState`, page navigation with `React Router`
- JWT token management (stored client-side)
- Responsive design, Gmail-inspired layout 

#### 🌐 Express API + Bloom Server
- Same backend from Exercise 3
- REST API provides full mail and user management
- Communicates with multithreaded Bloom Filter server over TCP

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
# Frontend React app (Port 3001)
http://localhost:3001
```

 Cleanup
```bash
docker-compose down
``` 

## 📸 Screenshots

> The following screenshots illustrate key parts of the Ex4 implementation- Login, registration, inbox, sending and managing emails, theme switching, and search results
> ### Login page with form validation
<img width="1469" height="717" alt="image" src="https://github.com/user-attachments/assets/7ee755f7-8267-47b1-9735-5831b1c03a71" />

> ### Registration page with form validation
<img width="1469" height="717" alt="image" src="https://github.com/user-attachments/assets/e2e212f4-957c-4e05-9a95-b8493372cc26" />

> ###  Registration with profile picture upload and validation
<img width="1469" height="717" alt="image" src="https://github.com/user-attachments/assets/eb1fbfff-a5a0-4cf1-aeab-18a13ed83941" />

> ###  Inbox view after login
<img width="1469" height="717" alt="image" src="https://github.com/user-attachments/assets/0da0fc84-3070-43a3-ac31-568790a776c6" />

> ### Email compose screen and successful email send
<img width="1469" height="717" alt="image" src="https://github.com/user-attachments/assets/0a0bb6b8-dca9-4ffa-b31a-34cd70ccd726" />
<img width="1469" height="717" alt="image" src="https://github.com/user-attachments/assets/a7fdfed1-0526-4fc0-864a-b033d7d40a8b" />

> ###  Inbox view showing emails with labels (Draft, spam .. )
<img width="1469" height="717" alt="image" src="https://github.com/user-attachments/assets/098b5923-5b8a-4e75-9995-616ba440a70c" />

> ### Theme switching between light and dark modes
<img width="1469" height="717" alt="image" src="https://github.com/user-attachments/assets/4e6dc810-3470-4234-af6c-5506b8967f78" />

> ### Search functionality and results
<img width="1469" height="717" alt="image" src="https://github.com/user-attachments/assets/601804b7-12de-4bae-8cae-7becd3f20b19" />

---  

Built with ❤️

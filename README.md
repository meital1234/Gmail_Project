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
Example screenshot here

> ### Attempting to access protected pages when not logged in
Example screenshot here

> ###  Registration with profile picture upload and validation
Example screenshot here

> ###  Inbox view after login
Example screenshot here

> ### Email compose screen and successful email send
Example screenshot here

> ###  Inbox view showing emails with labels (Draft, spam .. )
Example screenshot here

> ### Theme switching between light and dark modes
Example screenshot here

> ### Search functionality and results
Example screenshot here

---  

Built with ❤️

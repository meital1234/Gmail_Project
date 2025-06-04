# Exercise 3 – Gmail-like Web Server (Advanced Programming Systems)

## 📋 Content
- [About](#-about)
- [Architecture](#-architecture)
- [How to Run](#-how-to-run)
- [API Documentation](#-api-documentation)
- [Comparison with Ex2](#-comparison-with-ex2)
- [Screenshots](#-screenshots)

## 📚 About
This exercise is the third part of a multi-phase project building a Gmail-like mail system. In this part, we create a **Node.js + Express** web server using the **MVC architecture**, supporting **multi-threaded communication** with a backend C++ server (from Exercise 2). The REST API supports user authentication, mail management, label operations, and blacklist filtering.

### Key Features
- 🔐 **User Management** - Registration, authentication with tokens (not validated yet at this stage) 
- 📧 **Mail System** - Send, retrieve, update, delete, and search emails  
- 🏷️ **Label Management** - Organize emails with custom labels  
- 🚫 **Blacklist Management** - URL filtering via Bloom Filter with persistence   
- 🏗️ **SOLID Principles** - Clean, maintainable architecture  

## 🏗️ Architecture

### System Overview
```
┌─────────────────┐    HTTP/REST    ┌─────────────────┐    TCP Socket    ┌─────────────────┐
│   Client Apps   │ ◄─────────────► │  Express API    │ ◄──────────────► │  Bloom Server   │
│                 │                 │   (Port 3000)   │                  │   (Port 8080)   │
└─────────────────┘                 └─────────────────┘                  └─────────────────┘
                                            │                                      │
                                            ▼                                      ▼
                                    ┌─────────────────┐                  ┌─────────────────┐
                                    │  In-Memory Data │                  │ Persistent Data │
                                    │ • Users         │                  │ • Bit Array     │
                                    │ • Mails         │                  │ • blacklist.txt │
                                    │ • Labels        │                  └─────────────────┘
                                    └─────────────────┘
```

### Components

#### 🔧 Bloom Server (C++)
- **Unchanged from Ex2** - Proven, stable TCP server  
- **Port:** 8080  
- **Capabilities:**
  - Initialize bit array with configurable size and hash functions  
  - Add URLs to blacklist (`POST <URL>` → `201 Created`)  
  - Check URL blacklist status (`GET <URL>` → `200 OK` + `true/false`)  
  - Remove URLs from blacklist (`DELETE <URL>` → `204 No Content`)  
  - Error handling (`400 Bad Request`, `404 Not Found`)  
- **Persistence:** Binary bit array + `blacklist.txt` under `data/` directory  

#### 🌐 Express API (Node.js)
- **Port:** 3000  
- **Architecture:** RESTful API with layered design  
- **Communication:** Persistent TCP client for Bloom Filter integration  
- **Data Storage:** In-memory models (reset on restart)  
- **Error Handling:** Comprehensive HTTP status codes with JSON responses  

## ▶️ How to Run
Make sure you have **Docker** and **Docker Compose** installed.

Build the everything:
```bash
docker-compose build
```

start all services in detached mode
```bash
docker-compose up  -d
```

(Optional) some checkings
```bash
# Check running containers
docker-compose ps

# Check Bloom server logs
docker-compose logs -f bloom-server

# Check Express API logs
docker-compose logs -f express-api
```

 Cleanup
```bash
# Stop and remove containers
docker-compose down
```

## 📖 API Documentation
### Authentication
All protected endpoints require:
```
Authorization: <token>
```

### 1. User Management

#### Register
```http
POST /api/users
Content-Type: application/json

{
  "email": "noa123@gmail.com",
  "password": "Pass5678",
  "phone_number": "0501238910",
  "birthDate": "2001-01-01",
  "gender": "female"
}
```
201 Created on success

#### Login
```bash
POST /api/tokens
Content-Type: application/json

{
    "email": "meital123@gmail.com",
    "password": "Pass1234"
}
```
200 OK → { "token": "<user_id>" }

### 2. Mail Management

#### Send Mail
```bash
POST /api/mails
Authorization: Bearer <token>
Content-Type: application/json

{
  "to": ["recipient1@example.com", "recipient2@example.com"],
  "subject": "Important Message",
  "body": "This is the email content."
}
```
201 Created on success

#### Get All Mails
```bash
GET /api/mails
Authorization: Bearer <token>
```
200 OK → mails where subject/body contains <query>

#### Update Mail
```bash
PUT /api/mails/<id>
Authorization: Bearer <token>
Content-Type: application/json

{
  "subject": "Updated Subject",
  "body": "Updated content",
  "labels": ["label_id_1", "label_id_2"]
}
```
204 No Content on success.

#### Delete Mail
```bash
DELETE /api/mails/<id>
Authorization: Bearer <token>
```

### 3. Label Management
#### Create Label
```bash
POST /api/labels
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Work"
}
```
201 Created → Location: /api/labels/<id>

#### Get All Labels
```bash
GET /api/labels
Authorization: Bearer <token>
```
200 OK → list of labels.

#### Update Label
```bash
PUT /api/labels/<id>
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Label Name"
}
```
204 No Content on success.

#### Delete Label
```bash
DELETE /api/labels/<id>
Authorization: Bearer <token>
```
204 No Content on success.

### 4. Blacklist Management

#### Initialize Bloom Filter
```bash
POST /api/config
Authorization: Bearer <token>
Content-Type: application/json

{
  "bitArraySize": 1024,
  "hashFuncs": ["1", "2", "3"]
}
```
200 OK → { "message": "Config line sent to TCP server" }

#### Add URL to Blacklist
```bash
POST /api/blacklist
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "malicious-site.com"
}
```
201 Created on success.

#### Check URL Status
```bash
GET /api/blacklist/<url>
Authorization: Bearer <token>
```
200 OK → { "blacklisted": true/false }

#### Remove URL from Blacklist
```bash
DELETE /api/blacklist/<url>
Authorization: Bearer <token>
```
204 No Content on success

## 📊 Comparison with Ex2

| Aspect               | Ex2                    | Ex3                                             |
|----------------------|------------------------|-------------------------------------------------|
| **Interface**        | CLI commands           | REST API endpoints                              |
| **Communication**    | Direct TCP interaction | Persistent TCP client wrapper                   |
| **Data Management**  | File-based only        | In-memory models + file persistence             |
| **Features**         | URL blacklisting       | Full email platform + blacklisting              |
| **Authentication**   | None                   | JWT-based token system                          |
| **Error Handling**   | TCP status codes       | HTTP status codes + JSON responses               |
| **Testing**          | C++ unit tests only    | Multi-language test suite                       |
| **Deployment**       | Manual setup           | Docker Compose automation                        |
| **Scalability**      | Single-user CLI        | Multi-user web application                      |

### Development Guidelines
- Follow SOLID principles  
- Write tests for new features  
- Update documentation for API changes  
- Use conventional commit messages  

---  

## 📸 Screenshots

> The following screenshots illustrate key parts of the Ex3 implementation, including architecture setup, Docker Compose behavior, and example API usage.
> ### First user created, responded HTTP
<img width="420" alt="image" src="![צילום מסך 2025-06-03 120803](https://github.com/user-attachments/assets/b4393335-3f34-444d-bbd1-add6a227af73)" />
> ### Second user created, responded HTTP
<img width="420" alt="image" src="![צילום מסך 2025-06-03 121228](https://github.com/user-attachments/assets/fe834b69-99fd-45c2-a878-83bf2764a06d)" />
> ### Auth token retrieved successfully, HTTP 201
<img width="420" alt="image" src="![צילום מסך 2025-06-03 121517](https://github.com/user-attachments/assets/395d329a-41ab-4abd-a732-645b1ad7d150)" />
> ###  Login with wrong password, HTTP 401
<img width="420" alt="image" src="![צילום מסך 2025-06-03 121708](https://github.com/user-attachments/assets/ff98c998-51fa-44aa-89e7-914e9bddf1d8)" />
> ### Password missing error, returned HTTP 400P
<img width="420" alt="image" src="![צילום מסך 2025-06-03 121847](https://github.com/user-attachments/assets/1ba1fb38-f498-4fdb-8796-706fb3c64cca)" />
> ###  Fetched user ID=1, returned HTTP 201
<img width="420" alt="image" src="![צילום מסך 2025-06-03 122005](https://github.com/user-attachments/assets/484a4c27-0fdf-481f-a04f-fe600e243305)" />
> ### Fetched user ID=2, returned HTTP 201
<img width="420" alt="image" src="![צילום מסך 2025-06-03 122152](https://github.com/user-attachments/assets/ef61ad30-4dec-485d-b38b-2a0820bea52b)" />
> ###  Requested non-existent user, HTTP 404
<img width="420" alt="image" src="![צילום מסך 2025-06-03 122252](https://github.com/user-attachments/assets/75896f42-1c75-4b4a-8290-ebb1bde7cdc1)" />
> ### Add URL before config, server error
<img width="420" alt="image" src="![צילום מסך 2025-06-03 122512](https://github.com/user-attachments/assets/1ec7fbf4-2346-4e51-af7b-9ce6443ed311)" />
> ### Bloom filter configured successfully, HTTP 201
<img width="420" alt="image" src="![צילום מסך 2025-06-03 122609](https://github.com/user-attachments/assets/35650ad3-9fc2-44a0-ad68-d33b7e80fdfe)" />
> ### URL added to blacklist, HTTP 201
<img width="420" alt="image" src="![צילום מסך 2025-06-03 122644](https://github.com/user-attachments/assets/2189f145-3db4-4da0-9d5f-7cdaef05f737)" />
> ### URL deletion succeeded, returned HTTP 204
<img width="420" alt="image" src="![צילום מסך 2025-06-03 123007](https://github.com/user-attachments/assets/1ddf55ad-d511-4f13-8500-f1a6cedc0b9a)" />
> ### Tried deleting missing URL, HTTP 404
<img width="420" alt="image" src="![צילום מסך 2025-06-03 123035](https://github.com/user-attachments/assets/e14398c9-0463-428e-9ef4-6f44e9f2a728)" />

---  

Built with ❤️  

---


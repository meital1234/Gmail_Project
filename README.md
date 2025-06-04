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
- 🏷️ **Labels** - Categorize emails with user-defined labels  
- 🚫 **Blacklist Filtering** - Bloom Filter integration for unsafe URLs
- 📄 **Drafts** – Support for private editable mail drafts
- 🚀 **Multithreading Support** – Concurrent TCP handling using thread pool on the C++ server   

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
- TCP server reused from Exercise 2
- Enhanced to support **multithreaded handling** of simultaneous client connections
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
- Follows MVC pattern with modular structure
- Maintains a persistent TCP client to the C++ server
- Stores runtime data in memory
- Communicates via JSON and returns standard HTTP status codes 

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
Communicate with the web sever using curl HTTP commands sent to http://localhost:3000/

 Cleanup
```bash
# Stop and remove containers
docker-compose down
```

## 📖 API Documentation
### Blacklist Management
> ⚠️ Important: To enable the ability to send emails, you must first initialize the Bloom Filter configuration. Without this step, the system will not be able to validate URLs and will reject mail submissions that include links.
Example command:
```
curl -i -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{"bitArraySize":8,"hashFuncs":["1","2"]}'
```
  
### Authentication header
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
Authorization: <token>
Content-Type: application/json

{
  "to": "recipient@example.com",
  "subject": "Important Message",
  "body": "This is the email content."
}
```
201 Created on success

#### Get All Mails
```bash
GET /api/mails
Authorization: <token>
```
200 OK → all mails where the sender/recipients (and the mails are not in drafts) is corresponding with the token

#### Update Mail
```bash
PUT /api/mails/<id>
Authorization: <token>
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
Authorization: <token>
```

### 3. Label Management
#### Create Label
```bash
POST /api/labels
Authorization: <token>
Content-Type: application/json

{
  "name": "Work"
}
```
201 Created → Location: /api/labels/<id>

#### Get All Labels
```bash
GET /api/labels
Authorization: <token>
```
200 OK → list of labels of the asking user.

#### Update Label
```bash
PUT /api/labels/<id>
Authorization: <token>
Content-Type: application/json

{
  "name": "Updated Label Name"
}
```
204 No Content on success.

#### Delete Label
```bash
DELETE /api/labels/<id>
Authorization: <token>
```
204 No Content on success.

### 4. Blacklist Management

#### Initialize Bloom Filter
```bash
POST /api/config
Authorization: <token>
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
Authorization: <token>
Content-Type: application/json

{
  "url": "malicious-site.com"
}
```
201 Created on success.

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
| **Error Handling**   | TCP status codes       | HTTP status codes + JSON responses               |
| **Scalability**      | Single-user CLI        | Multi-user web application                      |
 
---  

## 📸 Screenshots

> The following screenshots illustrate key parts of the Ex3 implementation, including architecture setup, Docker Compose behavior, and example API usage.
> ### Sent BloomFilter configuration line, two users created and signed in as the first user (token)
<img width="654" alt="image" src="https://github.com/user-attachments/assets/6d5ee0dc-b1ee-4d7d-91bb-2887a0adb627" />

> ###  Tried logging in with wrong password and missing password, got fitting HTTP responses
<img width="654" alt="image" src="https://github.com/user-attachments/assets/e1c6d323-030a-4e58-83ab-a5e35be533ad" />

> ###  Fetched the two users, returned HTTP 201
<img width="654" alt="image" src="https://github.com/user-attachments/assets/1ac37e6c-2c28-46e3-a76f-de625ea66a48" />

> ### URL added two new urls to the blacklist, deleted one of them
<img width="654" alt="image" src="https://github.com/user-attachments/assets/5cd31848-766d-4494-aff8-5c4df80a0c79" />

> ### Attempted to send mail with blacklisted link, got an error and succeeded after changing to the deleted link (from the blacklist)
<img width="654" alt="image" src="https://github.com/user-attachments/assets/3812b444-b982-4c12-93fe-73a13499c6b8" />
<img width="654" alt="image" src="https://github.com/user-attachments/assets/76e4a78e-95d1-4dd4-ae86-1b4148d2af11" />

> ### Sent mail with Draft label, edited it and then tried to GET it from the reciever, got denied. Only the sender can see his drafts
<img width="654" alt="image" src="https://github.com/user-attachments/assets/5abbd752-cd5c-4af2-9dc5-26756a4aca8d" />

> ### Tried and failed editing and deleting a sent mail
<img width="654" alt="image" src="https://github.com/user-attachments/assets/b7f6aadc-ed62-41d6-9f34-a3a7de0b3ade" />



---  

Built with ❤️

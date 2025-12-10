# 🔐 Register & Login – UI & API

**Create a user** and log in via the **UI** (Web/Android) or via the **API** (`curl`).  
All flows assume the stack is running with **Docker Compose**:  
API on `http://localhost:3000` | Web on `http://localhost:3001`

<img width="75%" height="" alt="1 - empty login" src="https://github.com/user-attachments/assets/f91dd6e1-ea24-4a0a-bca0-d034dbb1b5fa" /> <img width="19%" height="" alt="image" src="https://github.com/user-attachments/assets/5d1587f7-04f0-49f8-8bef-05455c5e469c" />
---
## 🌐 Open Bloomly
- **Web**: http://localhost:3001  
- **Android**: Launch app in emulator & Ensure API base URL is http://10.0.2.2:3000  

---

## 📝 Registration (UI)
1. Click **Sign up** (or navigate to `/register`).
2. Fill the form:
   - **Email** *(unique)*
   - **Password** *(≥ 8 chars, includes uppercase, lowercase, digit)*
   - **First name**
   - **Last name** *(optional)*
   - **Phone number**
   - **Gender**
   - **Birth date** *(must be at least 10 years old)*
   - **Image** *(optional)*
3. Submit → on success you’ll be prompted to **Login**.

<img width="49%" height="1032" alt="4 - must be 10 to sign up" src="https://github.com/user-attachments/assets/82fa8730-bafd-4c00-b376-3aa13066f03d" /> <img width="49%" height="1032" alt="5 - cannot leave empty fields" src="https://github.com/user-attachments/assets/12c303cb-b442-4a5c-b514-aead8e0e9d23" />
<img width="49%" height="1032" alt="6 - mail must be Bloomly" src="https://github.com/user-attachments/assets/5ac29158-2ee2-48d3-9cf7-c7c94e3b6003" /> <img width="49%" height="1032" alt="7 - password must answer requirements" src="https://github.com/user-attachments/assets/38d30714-bdde-4591-b269-4048fc0a2025" />
  
---
## 📝 Registration (API)

### Create User
**POST** `/api/users`  
Headers: `Content-Type: application/json`  
Request JSON:
```json
{
  "email": "user@bloomly.com",
  "password": "User!12345",
  "first_name": "User",
  "last_name": "Example",
  "phone_number": "0500000000",
  "birthDate": "2000-01-01",
  "gender": "female",
  "image": "http://...optional-profile.jpg"
}
```
**Responses:**
- **Expected:** `201 Created` with payload:
```json
{ "id": "<mongoId>", "email": "user@bloomly.com" }
```
- `400 Bad Request` — validation error (missing/invalid fields) with `{ "error": "message" }`
---
## 🔑 Login (UI)
1. Enter Valid Email & password
2. Submit by Clicking **Sign up**
   
<img width="70%" height="1020" alt="2 - invalid login with no cradentials" src="https://github.com/user-attachments/assets/9a4af4af-e2ee-468f-9aa1-0015ce413e58" />

---
## 🔑 Login (API)

### Login
**POST** `/api/tokens`  
Headers: `Content-Type: application/json`  
Request JSON:
```json
{ "email": "user@bloomly.com", "password": "User!12345" }
```
**Responses:**
- **Expected:** `200 OK` with **payload**:
```json
{ "token": "<JWT>", "expiresIn": "24h" }
```
- `400 Bad Request` — missing credentials
- `401 Unauthorized` — invalid credentials

### Use the token for authorized endpoints (example)
```json
{
  "request": {
    "method": "GET",
    "url": "http://localhost:3000/api/mails",
    "headers": {
      "Authorization": "Bearer <YOUR_JWT>"
    }
  },
  "expected_response": {
    "status": 200,
    "body": [
      {
        "id": 1012,
        "from": "user@bloomly.com",
        "to": "friend@bloomly.com",
        "subject": "Hello",
        "content": "Hi there!",
        "dateSent": "2025-08-31T12:00:00.000Z",
        "labels": [
          { "id": "66b1f...", "name": "inbox" },
          { "id": "66b1f...", "name": "work" }
        ]
      }
    ]
  }
}
```

---

[⬅ Frontend Access](Frontend.md) | [➡ Mail Operations](Mails.md)

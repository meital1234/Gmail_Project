
# ✉️ Mail Operations – UI & API (Create / Edit / Delete)

**Create**, **Edit**, and **Delete** mails via the **UI** (Web/Android) or via the **API** (`curl`).  
Get **list of mails** that belongs to logged user or a **mail by its ID**.   
All flows assume the stack is running with **Docker Compose**:  
API on `http://localhost:3000` | Web on `http://localhost:3001`

---

## 🌐 Web (React)

### Create (Compose)
1. Click **Compose**
2. Fill **To**, **Subject**, **Content** (**Labels** are Optional)
3. Click **Send**  
- **Expected:** mail appears in **Inbox/Sent**

<img width="70%" height="1032" alt="29 - composing an email with label i made" src="https://github.com/user-attachments/assets/c61948b6-184b-4a2c-8e55-6ae0cd36e33c" />

### Edit **Draft**
1. Open a **draft** that you created  
2. Click **Edit** → change **Subject/Content/Labels** → **Save**  
- **Expected:** changes saved

<img width="70%" height="1032" alt="30 - editing a draft" src="https://github.com/user-attachments/assets/6f149665-4575-44fa-8987-6fca2c34783b" />

### Delete
1. Select a mail → **Delete** (confirm)  
- **Expected:**  If **draft** and you are the sender → deleted permanently.  
Otherwise → hidden for this user (soft-delete).

<img width="70%" height="1032" alt="25 - deleting whatsup" src="https://github.com/user-attachments/assets/1bfc49b2-b89a-4530-bb7a-f513f39dc32c" />

---

## 📱 Android

### Create (Compose)
1. Open **Compose**  
2. Fill **To**, **Subject**, **Content** (+ Labels if used)
3. Tap **Send**
- **Expected:** mail appears in **Inbox/Sent**
<img width="20%" height="1032" alt="compose" src="https://github.com/user-attachments/assets/c86073c9-9ff3-4218-ab84-f0a13db297c8" />
<img width="20%" height="1032" alt="sent" src="https://github.com/user-attachments/assets/05939b9f-7a2f-4311-a46b-87bd0e19770a" />

### Edit **Draft**
1. Open a **draft** you sent
2. Tap **Edit** → modify → **Save**  
- **Expected:** updated UI

<img width="20%" height="1032" alt="sent" src="https://github.com/user-attachments/assets/f933b9de-379e-4310-966c-fc3c3dfda75d" />
<img width="20%" height="1032" alt="sent" src="https://github.com/user-attachments/assets/df0e4b66-3b18-42d3-864d-9cd94a2d4acf" />
<img width="20%" height="1032" alt="sent" src="https://github.com/user-attachments/assets/e5cb65cb-842a-41c4-91fe-362d40c45424" />

### Delete
1. Open menu → **Delete** (confirm)  
- **Expected:** same semantics as above (hard delete for drafts; soft-delete otherwise)  

<img width="20%" height="1032" alt="sent" src="https://github.com/user-attachments/assets/dbd096d0-4442-4b65-bbf3-7b9faac0397e" />
<img width="20%" height="1032" alt="sent" src="https://github.com/user-attachments/assets/e3d5e391-5827-4948-93b8-21253de977b0" />

---

## 📡 API
All endpoints require `Authorization: Bearer <JWT>`  

### Create Mail  
**POST** `/api/mails`  
Request JSON:
```json
{
  "toEmail": "friend@bloomly.com",
  "subject": "Hello",
  "content": "Hi there!",
  "labels": ["inbox", "starred"]
}
```
**Responses:**
- **Expected:** `201 Created` — `{"id": 1013, "isSpam": false}`
- `200 OK` — `{"id": 1013, "isSpam": true}` — spam detected
- `400 Bad Request` — validation/unknown labels

**curl (201 expected):**
```bash
curl -i -X POST http://localhost:3000/api/mails
    -H "Authorization: Bearer <YOUR_JWT>"
    -H "Content-Type: application/json"
    -d '{
    "toEmail": "friend@bloomly.com", "subject": "Hello", "content": "Hi there!", "labels": ["inbox","starred"] }'
```

---

### Edit **Draft**
**PATCH** `/api/mails/{id}`  
Headers: `Authorization: Bearer <JWT>`, `Content-Type: application/json`  
Request JSON (any subset to update):
```json
{
  "toEmail": "friend@bloomly.com",
  "subject": "Updated subject",
  "content": "Updated body",
  "labels": ["drafts", "starred"]
}
```
**Responses:**
- **Expected:** `204 No Content` — updated successfully
- `400 Bad Request` — nothing to update / invalid labels / malicious links
- `403 Forbidden` — not sender / not a draft
- `404 Not Found` — mail not found  


**curl (204 expected):**
```bash
curl -i -X PATCH http://localhost:3000/api/mails/MAIL_ID \
  -H "Authorization: Bearer <YOUR_JWT>" \
  -H "Content-Type: application/json" \
  -d '{ "subject": "Updated subject", "content": "Updated body", "labels": ["drafts","work"] }'
```
---

### Delete Mail
**DELETE** `/api/mails/{id}`  
Headers: `Authorization: Bearer <JWT>`  

**Responses:**
- **Expected:** `204 No Content` — deleted (or hidden for non-drafts)
- `403 Forbidden` — not sender (for draft delete) / unauthorized
- `404 Not Found` — mail not found
- `500 Internal Server Error` — could not hide mail (non-draft soft-delete)

**curl (204 expected):**
```bash
curl -i -X DELETE http://localhost:3000/api/mails/MAIL_ID \
  -H "Authorization: Bearer <YOUR_JWT>"
```
---

### List of Mails  
**GET** `/api/mails`  
Headers: `Authorization: Bearer <JWT>`  
Response JSON:
```json
[
  {
    "id": 1012,
    "from": "user@bloomly.com",
    "to": "friend@bloomly.com",
    "subject": "Hello",
    "content": "Hi there!",
    "dateSent": "2025-08-25T12:00:00.000Z",
    "labels": [
      { "id": "66b1f...", "name": "inbox" },
      { "id": "66b1f...", "name": "starred" }
    ]
  }
]
```
**Responses:**
- **Expected:** `200 OK` — array of mails
- `401 Unauthorized` — missing/invalid token

**curl (200 expected):**
```bash
curl -i http://localhost:3000/api/mails \
  -H "Authorization: Bearer <YOUR_JWT>"
```

---

### Get Mail by ID  
**GET** `/api/mails/{id}`  
Headers: `Authorization: Bearer <JWT>`  
Response JSON:
```json
{
  "id": 1012,
  "from": "user@bloomly.com",
  "to": "friend@bloomly.com",
  "subject": "Hello",
  "content": "Hi there!",
  "dateSent": "2025-08-25T12:00:00.000Z",
  "labels": [
    { "id": "66b1f...", "name": "inbox" },
    { "id": "66b1f...", "name": "starred" }
  ]
}
```
**Responses:**
- **Expected:**`200 OK` — the mail JSON (same shape as above)
- `400 Bad Request` — invalid id (non-numeric)
- `403 Forbidden` — mail is a draft and caller is not the sender
- `404 Not Found` — mail not found

**curl (200 expected):**
```bash
curl -i http://localhost:3000/api/mails/1012 \
  -H "Authorization: Bearer <YOUR_JWT>"
```
---

[⬅ Register & Login](Auth.md) | [➡ Architecture & API](API.md)

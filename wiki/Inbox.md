# 📥 Inbox – Overview (Web & Android)

This page explains the **Inbox home screen** for Bloomly across Web (React) and Android (emulator).  
Runtime context: API `http://localhost:3000`, Web `http://localhost:3001`, Android emulator base URL `http://10.0.2.2:3000`.

---

## 🧭 Web Layout
```
┌────────────────────────────────────────────────────────────────────────────────┐
│ Top Bar:                          [Search]          [Dark Mode]  [User Avatar] │
├─────────────── Sidebar ───────────────┬─────────────── Message List ───────────┤
│ • Compose                             │ • Mail item                            │
│ • Inbox (count)                       │ • Mail item                            │
│ • sent                                │ • Mail item                            │
│ • Starred                             │                                        │
│ • Important                           │                                        │
│ • drafts                              │                                        │
│ • spam                                │                                        │
│ • <Your custom labels>  +             │                                        │
└───────────────────────────────────────┴────────────────────────────────────────┘
```
<img width="70%" height="1032" alt="8 - inbox" src="https://github.com/user-attachments/assets/a0325b06-4f73-4537-813a-cac68f838e38" />

---
## 📚 Sidebar (folders & labels) 

**Built-in**: Inbox, Sent, Starred, Important, Drafts, Spam  
**Custom labels**: User-defined labels appear & filter the list.  
Actions: **Compose**, click any label/folder to update the list.

<img width="68%" height="1032" alt="23 - the mail became a draft" src="https://github.com/user-attachments/assets/5003d172-336e-449c-a60c-d1593d94269c" />
<img width="19%" height="1032" alt="23 - the mail became a draft" src="https://github.com/user-attachments/assets/f87b90ad-58ab-46e4-b1a9-32933a8bcf22" />

---
## ⬆️ Top Bar (dark mode, search, avatar)

**Dark Mode Toggle** – Switches Light/Dark and persists your choice.  
<img width="70%" height="1032" alt="28 - inbox in darkmode" src="https://github.com/user-attachments/assets/12901903-ecfd-4187-acbf-bbe05a3d771a" />

**Search** – Free-text across subject/content (and label/sender filters if implemented).  
<img width="70%" height="1032" alt="27 - using search to filter mails" src="https://github.com/user-attachments/assets/b88bce9f-6af4-4173-bce6-92c937e8826b" />

**User Avatar** – Small menu with email + **Logout** (and optional: Profile/Settings).  
<img width="70%" height="1032" alt="17 - upper bar options" src="https://github.com/user-attachments/assets/f10ad571-94b1-44f4-968c-5715f66d43ea" />

---
## 📨 Message list  
Rows show: sender, subject, timestamp, unread styling, and labels.  
Optional quick actions (Web): open, star, delete, label.  
<img width="70%" height="1032" alt="16 - my inbox with two mails " src="https://github.com/user-attachments/assets/3eded7af-2aa0-4945-8ff2-e740ee39437e" />

---
## 🏷️ Labels – add / manage
Bloomly includes the following built-in labels:
- **Inbox**: Emails you've received
- **Sent**: Emails you've sent to others (or yourself)
- **starred**: Emails you've marked by hand - It’s your personal “follow-up/bookmark”
- **Important**: Emails you've want to prioritize
- **Draft**: Emails you've started but haven't sent
- **Spam**: Emails identified as potentially unwanted

You can Add/remove labels from list in side bar (except the built-in labels)  
Web: context/Label menu │  Android: overflow → Add label → choose.

<img width="68%" height="" alt="adding built in label react" src="https://github.com/user-attachments/assets/d50ed6f3-d871-40a0-ada0-732c63ac298c" />
<img width="19%" height="" alt="sdding built in label android" src="https://github.com/user-attachments/assets/ded05f38-f425-471e-9555-131c609d34ae" />

---
## ✉️ Compose / Draft / Send
Sidebar **Compose** (Web) or FAB/Compose (Android). Fill To/Subject/Content; labels optional.  
Drafts are editable by the sender; sent mails move to **Sent** and appear in the receiver’s **Inbox**.

See **[Mail Operations](Mails.md)** for exact API/UI flows.

---
## 🗑️ Delete behavior
- Draft + sender → hard delete
- Non-draft → soft delete (hidden for this user).  
See **[Mail Operations](Mails.md)** → Delete.

---

## 🤝 Web vs Android – UX differences
| Area | Web (React) | Android |
|---|---|---|
| Compose entry | Sidebar “Compose” | Toolbar/FAB “Compose” |
| Theme | Top bar dark mode | Toolbar dark mode (screenshot available) |
| Search | Inline input | Toolbar search icon → field |
| Labeling | Chips + menu; multi-select | Add label flow → confirm; chips on items |
| Nav | Sidebar (folders/labels) | Drawer/overflow menus |

---

## 🔎 Troubleshooting (Inbox)
- No items: ensure you’re logged in and API is up.  
- Search returns nothing: try a simpler query.  
- Dark mode not remembered: verify persistence (e.g., local storage).  
- Labels missing: create them via UI or use `GET /api/labels`.

---

[⬅ Frontend Access](Frontend.md) · [➡ Mail Operations](Mails.md) · [Architecture & API](API.md)

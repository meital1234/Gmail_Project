# 🖥️ Frontend Access – Web & Android
 how to **access the system** from the **Web** and **Android (emulator)** when running with **Docker Compose**.
---
## 🌐 Web (React)
- URL: **http://localhost:3001** (served by the `client` container)
- The web app calls the API at **http://localhost:3000** (from your browser).

<img width="70%" height="1020" alt="1 - empty login" src="https://github.com/user-attachments/assets/08aafbc9-5475-4d3f-a643-8dc67449560c" />

---
## 📱 Android (Emulator)
- Open **Android Studio**, start an emulator, and launch the app.
- **API base URL (emulator)** must be **`http://10.0.2.2:3000`** (maps to the host’s `localhost`).  
- Use **Login / Register** and then view the **Inbox**.

<img width="25%" height="" alt="login" src="https://github.com/user-attachments/assets/7f74b6a0-05c6-426f-85fc-3246841c519e" />
<img width="25%" height="" alt="registration" src="https://github.com/user-attachments/assets/16581376-f60b-4fbd-815d-54d4fbaa890a" />

- If the web app doesn’t load, run `docker compose ps` and `docker compose logs -f client` / `server`.  
- If Android can’t reach the API, verify the API is up on `http://localhost:3000` and use `10.0.2.2` inside the emulator.

---
[⬅ Setup](Setup.md) | [➡ Register & Login](Auth.md)

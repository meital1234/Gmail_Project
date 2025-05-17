# URL Bloom Filter Project - Ex2

## 📚 About
This project extends our original URL Bloom Filter into a **TCP-based client-server system**.
The server manages all Bloom filter logic, while the client sends commands via socket connections.
The Bloom Filter is used to quickly determine if a URL is blacklisted, with potential false positives but no false negatives.

This version was rebuilt using **Test Driven Development (TDD)** and clean **SOLID-based** C++ design.
Jira link - https://myemenahem.atlassian.net/jira/software/projects/BGE/summary

---

## 🛠️ How It Works
### Server:
- The server receives an initial config line from the client: `[bit array size] [list of hash functions]`
- Then the server listens for user commands:
  - `POST [URL]` → Add URL to blacklist → returns `201 Created`
  - `GET [URL]` → Check if URL is blacklisted → returns `200 Ok \n\n [bloomfilter URL status]`
  - `DELETE [URL]` → Remove URL from blacklist → returns `204 No Content`

The output is sent back from the server to the client via socket, accordingly.
For any command that isn't able to be executed → server returns `404 Not Found`, and for any invalid command → server returns `400 Bad Request`

The Bloom filter state and blacklist are automatically saved to files under data/ and reloaded on restart.

### Client:
- Takes **server IP** and port as arguments
- Connects once, then waits for user input
- Sends input to server and prints back the result
The client is 'dumb': doesn't know if a command is valid — just send the input to the server and print the result.

---

## ▶️ How to Run
Make sure you have **Docker** and **Docker Compose** installed.

Build the everything:
```bash
docker-compose build
```
Builds all three containers (Client, Server and Tests) on docker.

Run the app:
```bash
docker-compose run client
```
(Because the client is dependant on the server, running the client makes sure that the server is running as well).
Start the client.py program with the relevant arguments:
```bash
python client.py 172.17.0.1 8080
```
Please notice - after starting the client program, the first line of input should be the configuration line. meaning, `[bit array size] [list of hash functions]`.

Run the unit tests:
```bash
docker-compose run --rm test
```
---

## 💬 Example Usage
```
8 1 2
POST www.thebest.com
201 Created
POST www.projectever.com
201 Created
GET www.thebest.com
200 Ok

true true
DELETE www.projectever.com
204 No Content
GET www.projectever.com
200 Ok

true false
```
```
8 3 5 2
hello
400 Bad Request
DELETE www.mye.com
404 Not Found
GET www.meital.com
200 Ok

false
POST www.noa.com
201 Created
```
---

## 🔧 Refactoring & Design Improvements
As part of the transition from Ex1 to Ex2, we significantly refactored the project to improve maintainability, scalability, and testability. These improvements followed key **SOLID principles** and were driven using **Test-Driven Development (TDD)**.

### ✅ Summary of SOLID Refactoring – Before & After

| Before | After |
|--------|-------|
| All command logic (`ADD`, `CHECK`, `DELETE`) was embedded directly in `CLIHandler`, leading to tight coupling and duplicated code. | Logic was refactored into dedicated classes (`AddCommand`, `CheckCommand`, `DeleteCommand`), each implementing a shared `ICommand` interface — following the **Single Responsibility Principle (SRP)**. |
| Adding a new command required editing the `CLIHandler` class itself. | We introduced a `commandMap` and `registerCommands()` method to support adding new commands without changing existing logic — in line with the **Open/Closed Principle (OCP)**. |
| `CLIHandler` directly depended on concrete command implementations. | Now `CLIHandler` only communicates via the `ICommand` abstraction — applying the **Dependency Inversion Principle (DIP)**. |
| Tests were integration-heavy, tightly coupled to multiple components. | We switched to **unit testing** for each command and internal module, following **TDD** practices to drive the design. |
| `CLIHandler` was responsible for CLI logic, command parsing, file I/O, and Bloom Filter updates. | Each responsibility is now separated: command logic is handled by specific classes, and input parsing remains clean — supporting the **Separation of Concerns** and **SRP**. |
---
## 🖼️ Screenshots
### Program Start and Config Input
<img width="420" alt="image" src="https://github.com/user-attachments/assets/0a033c24-0d59-4590-93ff-87ae9dc286fd" />

### Adding a URL
<img width="420" alt="image" src="https://github.com/user-attachments/assets/82afbfad-6064-458f-b977-2deb67da335a" />

### Checking a URL
<img width="420" alt="image" src="https://github.com/user-attachments/assets/55f6fbae-ca69-4df2-b3d1-6660c90a825d" />

### Deleting a URL
<img width="420" alt="image" src="https://github.com/user-attachments/assets/25314a4b-0e05-4960-8426-49fc381130d4" />

### Running tests on docker
<img width="630" alt="image" src="https://github.com/user-attachments/assets/755fef0c-cff2-489b-924e-b7fb9f5766c0" />
<img width="630" alt="image" src="https://github.com/user-attachments/assets/d7077133-7aed-41ed-9f0d-8cc5f5b11042" />


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

## 🖼️ Screenshots
### Program Start and Config Input
<img width="490" alt="image" src="https://github.com/user-attachments/assets/12551e8c-f6dc-4078-bd10-e688414be39c" />

### Adding a URL
<img width="490" alt="image" src="https://github.com/user-attachments/assets/2a122beb-6729-4297-b2dc-7e8712f844cf" />

### Checking a URL
<img width="490" alt="image" src="https://github.com/user-attachments/assets/e2b1684a-a39c-4c0e-915c-8d2186cf8a46" />

* When checking if 'aa' is in bloomfilter it returns false because aaa is not in a valid url format

### Running tests on docker
<img width="727" alt="image" src="https://github.com/user-attachments/assets/ed0dbaaa-cc5d-401e-bbb5-f6b7133e2eba" />
<img width="727" alt="image" src="https://github.com/user-attachments/assets/739a41a3-346a-4527-8403-804f337fe5e1" />
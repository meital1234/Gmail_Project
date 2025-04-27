# URL Bloom Filter Project

## 📚 About
This project is a simple URL filtering system using a **Bloom filter** — a fast and memory-efficient data structure.  
It helps check if a URL is blacklisted without saving all URLs individually.

We built it using **Test Driven Development (TDD)** and clean **SOLID-based** C++ design.
Jira link - https://myemenahem.atlassian.net/jira/software/projects/BGE/summary

---

## 🛠️ How It Works
- The program reads an initial config line: `[bit array size] [list of hash functions]`
- Then:
  - `1 [URL]` → Add URL to blacklist
  - `2 [URL]` → Check if URL is blacklisted

The Bloom filter is **saved automatically** to a file and **reloaded** on program restart.  
False positives can happen, but false negatives cannot.

---

## ▶️ How to Run
Make sure you have **Docker** and **Docker Compose** installed.

Build the images:
```bash
docker-compose build
```

Run the app:
```bash
docker-compose run --rm app
```

Run the unit tests:
```bash
docker-compose run --rm test
```

---

## 💬 Example Usage
```
a
8 1 2
2 www.example.com0
false
x
1 www.example.com0
2 www.example.com0
true true
2 www.example.com1
false
2 www.example.com11
true false
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


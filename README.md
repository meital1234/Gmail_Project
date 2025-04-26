# URL Bloom Filter Project

## 📚 About
This project is a simple URL filtering system using a **Bloom filter** — a fast and memory-efficient data structure.  
It helps check if a URL is blacklisted without saving all URLs individually.

We built it using **Test Driven Development (TDD)** and clean **SOLID-based** C++ design.

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

### Adding a URL

### Checking a URL

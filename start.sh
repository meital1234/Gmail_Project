#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "=== Building and starting Docker Compose ==="
docker-compose down --remove-orphans
docker-compose build
docker-compose up -d

echo ""
echo "=== Waiting for server to start ==="
sleep 2

echo ""
echo "=== Running client interaction ==="
# Interactive session to send commands to server
docker-compose exec client /bin/bash -c "
    echo '[Client] Sending config line...'
    echo '8 1 2' | nc server 8080

    echo '[Client] Sending POST url.com...'
    echo 'POST url.com' | nc server 8080

    echo '[Client] Sending GET url.com...'
    echo 'GET url.com' | nc server 8080

    echo '[Client] Sending DELETE url.com...'
    echo 'DELETE url.com' | nc server 8080
"

echo ""
echo "=== Checking if blacklist file was created ==="
docker-compose exec server ls -l /app/data/

echo ""
echo "=== Showing blacklist contents ==="
docker-compose exec server cat /app/data/blacklist_urls.txt || echo "[Server] blacklist_urls.txt not found"

echo ""
echo "=== Showing BloomFilter file ==="
docker-compose exec server ls -l /app/data/bloomfilter.dat || echo "[Server] bloomfilter.dat not found"

echo ""
echo "=== Done ==="

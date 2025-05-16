import socket
import sys

def main():
    if len(sys.argv) != 3:
        print("Usage: python client.py <server_ip> <port>")
        return

    dest_ip = sys.argv[1]
    dest_port = int(sys.argv[2])

    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((dest_ip, dest_port))
    print(f"[Client] Connected to {dest_ip}:{dest_port}")

    try:
        while True:
            msg = input("[Client] > ").strip()
            if not msg:
                continue

            # Send user input to server
            msg = msg.encode('utf-8', errors='ignore').decode('utf-8')
            s.sendall((msg + '\n').encode('utf-8'))
            print(f"[Client] Sent: {msg}")

            # Receive server response
            response = s.recv(4096)
            if not response:
                print("[Client] Server closed connection.")
                break

            # Decode and print response from server
            print(f"[Client] Received HTTP response:\n{response.decode().strip()}")

    except KeyboardInterrupt:
        print("\n[Client] Exiting.")
    finally:
        s.close()

if __name__ == "__main__":
    main()

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
    # print(f"[Client] Connected to {dest_ip}:{dest_port}")

    try:
        while True:
            msg = input().strip()
            if not msg:
                continue

            # Sending the command with a '\n'.
            s.sendall((msg + '\n').encode('utf-8'))

            # Make sure we always read something or at least timeout - happens at config line input
            s.settimeout(2.0)

            try:
                data = s.recv(4096)
                if not data:
                    continue
                else:
                    print(data.decode('utf-8'), end='')
            except socket.timeout:
                continue

    # Allow termination if the user presses Ctrl+C.
    # except KeyboardInterrupt:
        # print("\nExiting client.") 
    finally:
        s.close() # Closes the connection.

if __name__ == "__main__":
    main()

import socket
import sys

def main():
    if len(sys.argv) < 4:
        print("Usage: python client.py <server_ip> <port>")
        return

    dest_ip = sys.argv[1]
    dest_port = int(sys.argv[2])
    
    # join the rest of the arguments to form the configuration line
    config_line = ' '.join(sys.argv[3:])

    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((dest_ip, dest_port))
    # print(f"[Client] Connected to {dest_ip}:{dest_port}")

    try:
        # Send the configuration line first (with \n at the end)
        s.sendall((config_line + '\n').encode('utf-8'))

        s.settimeout(2.0)
        try:
            data = s.recv(4096)
            if data:
                print(data.decode('utf-8'), end='')
        except socket.timeout:
            pass

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

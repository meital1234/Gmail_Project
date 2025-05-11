import socket # Allows creation and management of TCP communications.
import sys # access arguments sent to the command line (sys.argv).

def main():
    # port + ip : analazing arguments.
    if len(sys.argv) != 3: #Checking if the user entered the two required arguments.
        print("Usage: python client.py <server_ip> <port>") # If not – displays instructions and exits.
        return

    # Saves the IP address and port number entered as arguments.
    dest_ip = sys.argv[1]
    dest_port = int(sys.argv[2])

    # creating socket TCP.
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((dest_ip, dest_port)) # Connects to the server at the data address and port.

    try:
        while True:
            msg = input()  # geting user input.
            if not msg.strip(): # prevents sending empty lines or lines that are all spaces.
                continue 

            # Sending the command with a '\n'.
            s.sendall((msg + '\n').encode('utf-8'))

            # reciving output.
            data = s.recv(4096)
            print(data.decode('utf-8'), end='') # Prints to the screen.

    # Allow termination if the user presses Ctrl+C.
    except KeyboardInterrupt:
        print("\nExiting client.") 
    finally:
        s.close() # Closes the connection.

# If someone writes other code that includes: import client,
# then __name__ will not be "__main__" – but simply "client". Therefore main() will not be automatically executed.
# This allows this code to be used within other code without it running on its own.
if __name__ == "__main__":
    main()

# Let friends connect over the internet

The control website and server are designed to run on your own PC. These are the steps to make the game reachable by friends outside your home network.

## 1. Start the game server

Run `START_VELVET_NORTH_WINDOWS.bat`, open the control site, and click **Start game server**. Confirm the game opens at `http://127.0.0.1:8787/`.

## 2. Give the PC a stable local address

The control page lists your PC's local network addresses (usually something like `192.168.1.25`). In your router settings, reserve that address for this PC using DHCP reservation, so it does not change.

## 3. Allow the game port through Windows Firewall

Run `ALLOW_GAME_PORT_WINDOWS.bat` and approve the administrator prompt. This adds an inbound TCP rule for port `8787` only. To undo it later, run `REMOVE_GAME_PORT_WINDOWS.bat`.

## 4. Configure your router

In your router's Port Forwarding section, add a TCP rule:

- External port: `8787`
- Internal port: `8787`
- Destination device/IP: the reserved local address of your PC

Router menus differ by brand. Do not forward port `8788`: that is the private management website and must remain local-only.

## 5. Share your public address

Find your public IPv4 address from your router's internet/WAN status page. Friends can then open `http://YOUR-PUBLIC-IP:8787/` while your PC and game server are running. Do not share the local `192.168...` address with friends outside your Wi-Fi.

## Security and availability notes

- This basic setup uses HTTP on port 8787. It is suitable for a controlled test with people you trust, but it does not encrypt traffic. Do not reuse passwords from other services for private blackjack rooms.
- For a permanent public address and encrypted HTTPS/WSS, you need a domain name pointing to your home connection and a TLS reverse proxy (for example, Caddy) configured on ports 80/443. That is a separate setup step; this package does not pretend to create a trusted public certificate automatically.
- Some internet providers use carrier-grade NAT or block inbound connections. If router forwarding does not work even when configured correctly, ask your ISP whether you have a public IPv4 address. You may need a public IP service from your ISP.
- Your PC must remain awake, connected to the internet, and running the game server. Disable sleep while hosting.
- Never expose port 8788. It is intentionally bound to `127.0.0.1` and is the owner control panel.

## Test from outside your Wi-Fi

Do not rely only on testing from the same home network; some routers do not support NAT loopback. Ask a friend on mobile data to open the public address. If the site opens but the room directory does not, check Windows Firewall and port forwarding for TCP 8787.

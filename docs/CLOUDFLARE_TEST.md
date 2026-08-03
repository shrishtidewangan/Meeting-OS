# Temporary Live Testing via Cloudflare Tunnel

This gives MeetingOS a real, public URL for testing purposes by
tunneling your own locally-running app through Cloudflare. This is
temporary — it only works while your computer stays on, connected,
and all the processes below stay running. It is NOT a substitute for
real hosting; see docs/DEPLOYMENT.md (or SETUP.md) for a durable
alternative if you need this to work unattended for multiple days.

## One-Time Setup

### 1. Install cloudflared

    winget install --id Cloudflare.cloudflared

If `cloudflared` is not recognized in a NEW terminal afterward, find
the actual install location and add it to your PATH manually:

    Get-ChildItem -Path "C:\Program Files (x86)" -Filter "cloudflared.exe" -Recurse

    [Environment]::SetEnvironmentVariable("PATH", $env:PATH + ";C:\Program Files (x86)\cloudflared", "User")

Then open a brand new terminal and confirm:

    cloudflared --version

### 2. Cap MongoDB's memory usage (prevents out-of-memory crashes)

MongoDB's WiredTiger engine defaults to claiming ~50% of total system
RAM, which can crash it on a machine also running dev servers, tunnels,
a browser, and an editor at once.

Open (as Administrator) and edit:

    C:\Program Files\MongoDB\Server\<version>\bin\mongod.cfg

Add under the `storage:` section:

    storage:
      dbPath: <existing path, unchanged>
      wiredTiger:
        engineConfig:
          cacheSizeGB: 0.5

Indentation must exactly match the existing file's style (2 spaces per
level). Restart the service afterward (see step 4 below).

### 3. Allow Cloudflare's tunnel domains in Vite

In `apps/web/vite.config.ts`, add `allowedHosts` under `server`:

    server: {
      port: 5173,
      allowedHosts: [".trycloudflare.com"]
    }

The leading dot allows any subdomain, so this survives tunnel URL
changes without needing to edit this file again.

## Every Time You Want to Run This

### 1. Start MongoDB (as Administrator PowerShell)

    Start-Service MongoDB
    Get-Service -Name MongoDB

Confirm `Status: Running`.

### 2. Start both app servers

    pnpm dev

Confirm you see "Connected to MongoDB" and both ports (3001, 5173)
listening with no `EADDRINUSE` errors. If you get a port-in-use error,
an old process from previous testing is likely still running — find
and stop it:

    Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess
    Stop-Process -Id <the_id_shown> -Force

### 3. Start the backend tunnel (new terminal)

    cloudflared tunnel --url http://localhost:3001

Wait for the "CONNECTIVITY PRE-CHECKS ... healthy" summary, then copy
the printed URL (e.g. `https://random-words.trycloudflare.com`).

### 4. Start the frontend tunnel (another new terminal)

    cloudflared tunnel --url http://localhost:5173

Same as above — copy this second, different URL.

### 5. Wire the two URLs together

Open `.env`, set:

    WEB_ORIGIN=<your frontend tunnel URL from step 4>

Stop the terminal running `pnpm dev` (Ctrl+C), then restart it with
the backend URL injected:

    $env:VITE_API_URL = "<your backend tunnel URL from step 3>"
    pnpm dev

### 6. Test it

Open the frontend tunnel URL in your browser and sign in. If it fails,
open dev tools (F12) → Console tab and check for errors.

## Keeping It Alive

- Do not close any of the 3 running terminals (app servers + 2
  tunnels), and do not let MongoDB's service stop.
- Every random tunnel URL is different EVERY time you restart a
  tunnel — quick tunnels do not keep a stable address. If any tunnel
  restarts for any reason, you must repeat step 5 with the new URL.
- If your laptop sleeps, loses network briefly, or a terminal crashes,
  expect to redo steps 3-5 with fresh URLs.
- Periodically check MongoDB hasn't stopped, especially if someone
  reports the app is down:

      Get-Service -Name MongoDB

## Troubleshooting Reference (issues actually hit and fixed)

| Symptom | Cause | Fix |
|---|---|---|
| `cloudflared` not recognized | PATH not updated in this terminal | New terminal, or manually append to PATH (see step 1) |
| `EADDRINUSE: address already in use :::3001` | Old process still running | Find and kill it (see step 2) |
| Browser shows "Blocked request... allowedHosts" | Vite blocks unknown hosts by default | Add `allowedHosts: [".trycloudflare.com"]` (see setup step 3) |
| `connect ECONNREFUSED ::1:27017` | MongoDB service stopped | `Start-Service MongoDB` as Administrator |
| `Start-Service`/`Restart-Service` fails with "Cannot open service" | PowerShell window not actually elevated | Close it, right-click PowerShell → "Run as administrator" explicitly |
| MongoDB log shows `"out of memory."` and repeated crashes | WiredTiger cache too large for available RAM | Cap `cacheSizeGB` in mongod.cfg (see setup step 2) |
| Tunnel log shows `wsasendto: unreachable network`, then auto-recovers | Brief WiFi/network blip | Normal — cloudflared reconnects on its own within a few seconds |
| Tunnel log shows the same error repeating for hours with no recovery | The underlying app (not just the network) actually crashed | Check the app's own logs (e.g. MongoDB) for the real root cause, not just the tunnel |
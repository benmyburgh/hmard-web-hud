# HMARD Web HUD

600x600 Meta Ray-Ban Display Web App prototype for HMARD.

## Local Test

Serve the folder over HTTP:

```powershell
cd C:\Users\bhmyb\Documents\MRBD\web-hud
python -m http.server 4173
```

Open:

```text
http://localhost:4173
```

## Glasses Test

The glasses need a public HTTPS URL. You do not need to buy a domain.

Free options:

- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages

Upload/deploy this `web-hud` folder and use the generated `https://...` URL in Meta AI App Connections > Web Apps.

## Controls

- `DEMO`: resets the simulated HUD run.
- `CENTER`: cages the simulated HUD and restarts pitch/roll motion from zero.
- `ALERT`: cycles HMARD cue overlays.
- Space/Enter: cycle alerts.

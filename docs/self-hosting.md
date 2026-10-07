[← Previous Page](security.md) · [Back to README](../README.md) · [Next Page →](contributing.md)

# Self-Hosting

Deploy audit-n8n to your own infrastructure. The app is a stateless Next.js application with no database, no server-side secrets, and no required environment variables.

## Quick Start (Docker)

The recommended way to self-host is via the published Docker image.

```bash
# Pull and run (defaults to port 3000)
docker run -d \
  --name audit-n8n \
  -p 3000:3000 \
  --restart unless-stopped \
  yanji2510/audit-n8n:latest
```

Open `http://your-host:3000` — the app is ready. No configuration needed.

## Docker Compose

For production with a reverse proxy or orchestration, use `docker-compose.yml`:

```yaml
# docker-compose.yml
services:
  audit-n8n:
    image: yanji2510/audit-n8n:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

```bash
docker compose up -d
```

## Build Your Own Image

If you prefer to build locally (e.g., for air-gapped environments or custom tags):

```bash
# Using the Makefile (multi-stage build, ~100MB final image)
make docker-build

# Or manually
docker build -t audit-n8n:local .
docker run -d -p 3000:3000 --restart unless-stopped audit-n8n:local
```

The `Dockerfile` uses a three-stage build:
1. **deps** — installs production dependencies only (`npm ci`)
2. **builder** — compiles Next.js with `output: 'standalone'`
3. **runner** — copies only the standalone output, runs as non-root user (UID 1001)

## Reverse Proxy (nginx / Traefik / Caddy)

The container listens on **port 3000** inside the container. Terminate TLS at the proxy.

### nginx Example

```nginx
server {
    listen 443 ssl http2;
    server_name audit.yourdomain.com;

    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }
}
```

### Traefik (Docker labels)

```yaml
services:
  audit-n8n:
    image: yanji2510/audit-n8n:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.audit-n8n.rule=Host(`audit.yourdomain.com`)"
      - "traefik.http.routers.audit-n8n.tls=true"
      - "traefik.http.services.audit-n8n.loadbalancer.server.port=3000"
    networks:
      - traefik-net

networks:
  traefik-net:
    external: true
```

### Caddy (Caddyfile)

```caddyfile
audit.yourdomain.com {
    reverse_proxy localhost:3000
}
```

## Environment Variables

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `NODE_ENV` | `production` | No | Sets Next.js mode |
| `PORT` | `3000` | No | Internal port (container) |
| `HOSTNAME` | `0.0.0.0` | No | Bind address |
| `NEXT_TELEMETRY_DISABLED` | `1` | No | Disables Next.js telemetry |

**No API keys, no database URLs, no secrets.** The app is designed to run with zero server-side configuration. Users supply their AI keys per-request from the browser (stored in `sessionStorage` only).

## Health Checks

The Next.js standalone server responds to `GET /` with the UI. For a lightweight health endpoint, add a route or rely on the proxy's TCP/HTTP check against `/`.

```yaml
# docker-compose.yml with healthcheck
services:
  audit-n8n:
    image: yanji2510/audit-n8n:latest
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
```

## Kubernetes (Basic)

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: audit-n8n
spec:
  replicas: 2
  selector:
    matchLabels:
      app: audit-n8n
  template:
    metadata:
      labels:
        app: audit-n8n
    spec:
      containers:
        - name: audit-n8n
          image: yanji2510/audit-n8n:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 30
---
apiVersion: v1
kind: Service
metadata:
  name: audit-n8n
spec:
  selector:
    app: audit-n8n
  ports:
    - port: 80
      targetPort: 3000
```

## Updating

```bash
# Pull latest image
docker pull yanji2510/audit-n8n:latest

# Recreate container (docker-compose handles this)
docker compose up -d --force-recreate

# Or manually
docker stop audit-n8n && docker rm audit-n8n
docker run -d --name audit-n8n -p 3000:3000 --restart unless-stopped yanji2510/audit-n8n:latest
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Port 3000 already in use | Another service on host | Change host port: `-p 8080:3000` |
| `ECONNREFUSED` from proxy | Container not ready | Add healthcheck; increase `start_period` |
| Blank page / JS errors | Proxy not forwarding headers | Ensure `X-Forwarded-Proto`, `Host`, `Upgrade` headers passed |
| Large workflow upload fails | Proxy body size limit | Increase `client_max_body_size` (nginx) or equivalent |
| Theme not persisting | `sessionStorage` cleared on domain change | Use consistent domain; avoid IP-only access |

## Security Notes

- **No server-side secrets** — the container never stores API keys. See [Security](security.md).
- **Non-root user** — the runner stage runs as `nextjs` (UID 1001).
- **Minimal attack surface** — final image is ~100MB (Alpine + Node.js + standalone Next.js).
- **Read-only filesystem** — consider adding `readOnlyRootFilesystem: true` in K8s; the app writes nothing to disk.

## See Also

- [Getting Started](getting-started.md) — local development setup
- [Security](security.md) — no server-side secrets, patch safety, key handling
- [Architecture](architecture.md) — layered structure and why the app is stateless
- [Contributing](contributing.md) — guidelines for code, rules, and quality gates
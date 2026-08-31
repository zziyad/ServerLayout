# SSL/HTTPS Setup Guide

## Overview

This guide will help you set up HTTPS for:
- Main app: `https://ts-int.digital`
- PgAdmin: `https://pgadmin.ts-int.digital`

## Prerequisites

1. Domain `ts-int.digital` must point to your server's IP
2. Subdomain `pgadmin.ts-int.digital` must point to your server's IP
3. Ports 80 and 443 must be open and accessible

## Step 1: Start Services

```bash
cd /home/zi/app/api-server
sudo docker-compose up -d
```

## Step 2: Get SSL Certificates

### Option A: Get certificates for both domains at once

```bash
sudo docker exec -it certbot-ts certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d ts-int.digital \
  -d pgadmin.ts-int.digital
```

### Option B: Get certificates separately

**For main domain:**
```bash
sudo docker exec -it certbot-ts certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d ts-int.digital
```

**For pgadmin subdomain:**
```bash
sudo docker exec -it certbot-ts certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d pgadmin.ts-int.digital
```

## Step 3: Reload Nginx

After certificates are obtained, reload nginx:

```bash
sudo docker exec nginx-ts nginx -s reload
```

Or restart the container:

```bash
sudo docker-compose restart nginx
```

## Step 4: Verify HTTPS

- Main app: `https://ts-int.digital`
- PgAdmin: `https://pgadmin.ts-int.digital`

Both should automatically redirect from HTTP to HTTPS.

## Automatic Certificate Renewal

The `certbot` container is configured to automatically renew certificates every 12 hours. Certificates are valid for 90 days, so this ensures they're always renewed in time.

## Troubleshooting

### Certificate not found error

If nginx shows "certificate not found", check:

```bash
# Check if certificates exist
sudo docker exec nginx-ts ls -la /etc/letsencrypt/live/

# Check nginx error logs
sudo docker logs nginx-ts | grep -i error
```

### Domain not resolving

Verify DNS:
```bash
dig ts-int.digital
dig pgadmin.ts-int.digital
```

Both should return your server's IP address.

### Port 80 blocked

Let's Encrypt needs port 80 open for validation. Check firewall:

```bash
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Test certificate renewal

```bash
sudo docker exec -it certbot-ts certbot renew --dry-run
```

## Manual Certificate Renewal

If automatic renewal fails, renew manually:

```bash
sudo docker exec -it certbot-ts certbot renew
sudo docker exec nginx-ts nginx -s reload
```

## Security Notes

- Certificates are stored in Docker volume `certbot-conf`
- Private keys are never exposed outside the container
- HSTS (HTTP Strict Transport Security) is enabled
- Modern TLS protocols only (TLSv1.2 and TLSv1.3)

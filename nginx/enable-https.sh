#!/bin/bash
# Script to enable HTTPS for ts-int.digital and pgadmin.ts-int.digital

set -e

echo "Step 1: Getting SSL certificates..."
sudo docker exec -it certbot-ts certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@ts-int.digital \
  --agree-tos \
  --no-eff-email \
  -d ts-int.digital \
  -d pgadmin.ts-int.digital

echo ""
echo "Step 2: Uncommenting HTTPS blocks in nginx config..."
cd /home/zi/app/api-server

# Uncomment HTTPS server block for main domain
sed -i 's/^# server {$/server {/' nginx/conf.d/default.conf
sed -i 's/^#     listen 443 ssl;$/    listen 443 ssl;/' nginx/conf.d/default.conf
sed -i 's/^#     listen \[::\]:443 ssl;$/    listen [::]:443 ssl;/' nginx/conf.d/default.conf
sed -i 's/^#     http2 on;$/    http2 on;/' nginx/conf.d/default.conf
sed -i 's/^#     server_name ts-int.digital;$/    server_name ts-int.digital;/' nginx/conf.d/default.conf
sed -i 's/^#     ssl_certificate/    ssl_certificate/' nginx/conf.d/default.conf
sed -i 's/^#     ssl_certificate_key/    ssl_certificate_key/' nginx/conf.d/default.conf
sed -i 's/^#     ssl_protocols/    ssl_protocols/' nginx/conf.d/default.conf
sed -i 's/^#     ssl_ciphers/    ssl_ciphers/' nginx/conf.d/default.conf
sed -i 's/^#     ssl_prefer_server_ciphers/    ssl_prefer_server_ciphers/' nginx/conf.d/default.conf
sed -i 's/^#     ssl_session_cache/    ssl_session_cache/' nginx/conf.d/default.conf
sed -i 's/^#     ssl_session_timeout/    ssl_session_timeout/' nginx/conf.d/default.conf
sed -i 's/^#     ssl_session_tickets/    ssl_session_tickets/' nginx/conf.d/default.conf
sed -i 's/^#     ssl_stapling/    ssl_stapling/' nginx/conf.d/default.conf
sed -i 's/^#     ssl_trusted_certificate/    ssl_trusted_certificate/' nginx/conf.d/default.conf
sed -i 's/^#     resolver/    resolver/' nginx/conf.d/default.conf
sed -i 's/^#     resolver_timeout/    resolver_timeout/' nginx/conf.d/default.conf
sed -i 's/^#     add_header/    add_header/' nginx/conf.d/default.conf
sed -i 's/^#     access_log/    access_log/' nginx/conf.d/default.conf
sed -i 's/^#     error_log/    error_log/' nginx/conf.d/default.conf
sed -i 's/^#     client_max_body_size/    client_max_body_size/' nginx/conf.d/default.conf
sed -i 's/^#     proxy_connect_timeout/    proxy_connect_timeout/' nginx/conf.d/default.conf
sed -i 's/^#     proxy_send_timeout/    proxy_send_timeout/' nginx/conf.d/default.conf
sed -i 's/^#     proxy_read_timeout/    proxy_read_timeout/' nginx/conf.d/default.conf
sed -i 's/^#     location/    location/' nginx/conf.d/default.conf
sed -i 's/^#         proxy_pass/        proxy_pass/' nginx/conf.d/default.conf
sed -i 's/^#         proxy_http_version/        proxy_http_version/' nginx/conf.d/default.conf
sed -i 's/^#         proxy_set_header/        proxy_set_header/' nginx/conf.d/default.conf
sed -i 's/^#         proxy_read_timeout/        proxy_read_timeout/' nginx/conf.d/default.conf
sed -i 's/^#         proxy_send_timeout/        proxy_send_timeout/' nginx/conf.d/default.conf
sed -i 's/^#         proxy_buffering/        proxy_buffering/' nginx/conf.d/default.conf
sed -i 's/^#         limit_req/        limit_req/' nginx/conf.d/default.conf
sed -i 's/^#         add_header Access-Control/        add_header Access-Control/' nginx/conf.d/default.conf
sed -i 's/^#         if (\$request_method/        if ($request_method/' nginx/conf.d/default.conf
sed -i 's/^#             add_header/            add_header/' nginx/conf.d/default.conf
sed -i 's/^#             return/            return/' nginx/conf.d/default.conf
sed -i 's/^#         }/        }/' nginx/conf.d/default.conf
sed -i 's/^# }/}/' nginx/conf.d/default.conf

# Uncomment HTTPS redirects
sed -i 's/^    # location \/ {$/    location \/ {/' nginx/conf.d/default.conf
sed -i 's/^    #     return 301 https:\/\/\$server_name\$request_uri;$/        return 301 https:\/\/$server_name$request_uri;/' nginx/conf.d/default.conf
sed -i 's/^    # }$/    }/' nginx/conf.d/default.conf

echo ""
echo "Step 3: Testing nginx configuration..."
sudo docker exec nginx-ts nginx -t

echo ""
echo "Step 4: Reloading nginx..."
sudo docker exec nginx-ts nginx -s reload

echo ""
echo "✅ HTTPS enabled! Your sites should now redirect to HTTPS:"
echo "   - https://ts-int.digital"
echo "   - https://pgadmin.ts-int.digital"

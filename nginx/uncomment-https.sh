#!/bin/bash
# Simple script to uncomment HTTPS blocks in nginx config

cd /home/zi/app/api-server/nginx/conf.d

# Uncomment HTTPS server blocks (remove # from lines starting with #)
sed -i 's/^# server {$/server {/' default.conf
sed -i 's/^#     /    /' default.conf
sed -i 's/^#         /        /' default.conf
sed -i 's/^#             /            /' default.conf

# Uncomment HTTPS redirects
sed -i 's/^    # location \/ {$/    location \/ {/' default.conf
sed -i 's/^    #     return 301/        return 301/' default.conf
sed -i 's/^    # }$/    }/' default.conf

echo "✅ HTTPS blocks uncommented!"
echo "Now test nginx config: sudo docker exec nginx-ts nginx -t"
echo "Then reload: sudo docker exec nginx-ts nginx -s reload"

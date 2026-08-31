#!/bin/sh
set -e

# This script is designed to run inside Docker container, not on host
# Check if we're in a container (rough check)
if [ ! -f /.dockerenv ] && [ ! -d /usr/server ]; then
    echo "Error: This script is designed to run inside a Docker container." >&2
    echo "Rebuild your container with: docker compose build --no-cache api-auth" >&2
    exit 1
fi

# Get user UID/GID from environment or use defaults
USER_UID=${USER_UID:-1000}
USER_GID=${USER_GID:-1000}

# Debug output (can be removed later)
echo "Entrypoint: Fixing permissions for UID=${USER_UID} GID=${USER_GID}" >&2

# Create log directory if it doesn't exist (as root)
mkdir -p /usr/server/log

# Fix permissions for log directory (mounted volume)
# Must run as root to chown the volume
# Try multiple times in case volume is still mounting
for i in 1 2 3; do
    if chown -R ${USER_UID}:${USER_GID} /usr/server/log 2>/dev/null; then
        break
    fi
    sleep 0.1
done

# Set permissions
chmod -R 777 /usr/server/log 2>/dev/null || chmod -R 755 /usr/server/log 2>/dev/null || true

# Create a test file to verify write permissions
if touch /usr/server/log/.write_test 2>/dev/null; then
    rm -f /usr/server/log/.write_test
    echo "Entrypoint: Log directory permissions fixed successfully" >&2
else
    echo "Warning: Log directory may not be writable" >&2
    ls -ld /usr/server/log >&2 || true
    # Try one more time with more permissive permissions
    chmod -R 777 /usr/server/log 2>/dev/null || true
fi

# Switch to non-root user (nodejs) and run the application
# su-exec syntax: su-exec user command [args...]
if command -v su-exec >/dev/null 2>&1; then
    exec su-exec nodejs "$@"
else
    echo "Error: su-exec not found. This script must run inside the Docker container." >&2
    exit 1
fi


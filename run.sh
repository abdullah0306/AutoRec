#!/bin/bash
# filepath: /home/ubuntu/autorec/autorec-fe/run.sh

# Set environment variables if needed
export NODE_ENV=production
# Add other environment variables if needed
# export NEXT_PUBLIC_API_URL=http://localhost:8000

# Go to the frontend directory
cd /home/ubuntu/autorec/autorec-fe

# Set NODE_OPTIONS if you need to adjust memory or other settings
export NODE_OPTIONS="--max-old-space-size=2048"

# Load Node.js version using fnm if installed
if command -v fnm &> /dev/null; then
  eval "$(fnm env --use-on-cd)"
fi

# Install dependencies if needed (uncomment if you want this to run each time)
# npm install --production

# Build the application if needed (uncomment if you want to rebuild each startup)
# npm run build

# Start the Next.js application
exec npm run start
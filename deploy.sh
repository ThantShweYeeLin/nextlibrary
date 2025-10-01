#!/bin/bash

# Deployment script for VM with /booklib subpath

echo "🚀 Building Next.js application for VM deployment..."

# Set environment variables for subpath deployment
export NEXT_PUBLIC_BASE_PATH=/booklib
export NODE_ENV=production

# Build the application
echo "📦 Building application..."
pnpm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "�️  Files created in .next/standalone/nextlibrary/ for deployment:"
    ls -la .next/standalone/nextlibrary/
    echo ""
    echo "📋 Instructions for VM deployment:"
    echo ""
    echo "1. Copy these files to your VM:"
    echo "   rsync -avz .next/standalone/nextlibrary/ azureuser@your-vm:/home/azureuser/booklib/"
    echo ""
    echo "2. On your VM, create/update .env.local with your MongoDB URI:"
    echo "   echo 'MONGODB_URI=your_mongodb_connection_string' > /home/azureuser/booklib/.env.local"
    echo ""
    echo "3. On your VM, stop any existing process and start the new one:"
    echo "   pkill -f 'node.*server.js'"
    echo "   cd /home/azureuser/booklib"
    echo "   NEXT_PUBLIC_BASE_PATH=/booklib PORT=3003 nohup node server.js > app.log 2>&1 &"
    echo ""
    echo "4. Test the deployment:"
    echo "   curl http://localhost:3003/booklib/"
    echo "   curl http://your-vm-domain/booklib/"
    echo ""
    echo "🌐 Your application should be available at:"
    echo "   http://wad-6632067.eastus2.cloudapp.azure.com/booklib/"
    echo ""
    echo "📁 Complete deployment command for your VM:"
    echo "cd ~/booklib && pkill -f 'node.*server.js' && NEXT_PUBLIC_BASE_PATH=/booklib PORT=3003 nohup node server.js > app.log 2>&1 &"
else
    echo "❌ Build failed!"
    exit 1
fi
# 🔧 IMMEDIATE FIX for VM Deployment

## Problem Identified
Your app is returning 404 because it wasn't built with the correct base path configuration.

## ⚡ Quick Fix Commands

Run these commands on your VM to fix the issue immediately:

### 1. Stop Current Process
```bash
cd ~/booklib
pkill -f "node.*server.js" || pkill -f "next" || pm2 stop all
```

### 2. Rebuild with Correct Base Path
```bash
export NEXT_PUBLIC_BASE_PATH=/booklib
export NODE_ENV=production
npm run build
```

### 3. Start with Standalone Server
```bash
NEXT_PUBLIC_BASE_PATH=/booklib PORT=3003 nohup node .next/standalone/nextlibrary/server.js > app.log 2>&1 &
```

### 4. Test the Fix
```bash
curl http://localhost:3003/booklib/
curl http://wad-6632067.eastus2.cloudapp.azure.com/booklib/
```

## 📋 Complete Fix Script

Copy and paste this entire block into your VM terminal:

```bash
#!/bin/bash
cd ~/booklib

# Stop any existing processes
pkill -f "node.*server.js" 2>/dev/null
pkill -f "next" 2>/dev/null
pm2 stop all 2>/dev/null

# Set environment variables
export NEXT_PUBLIC_BASE_PATH=/booklib
export NODE_ENV=production

# Rebuild application
echo "🔨 Rebuilding with correct base path..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Start the standalone server
    echo "🚀 Starting server..."
    NEXT_PUBLIC_BASE_PATH=/booklib PORT=3003 nohup node .next/standalone/nextlibrary/server.js > app.log 2>&1 &
    
    echo "⏳ Waiting for server to start..."
    sleep 3
    
    # Test the deployment
    echo "🧪 Testing deployment..."
    if curl -s http://localhost:3003/booklib/ | grep -q "Book Library"; then
        echo "✅ Success! Application is running correctly."
        echo "🌐 Your app is now available at:"
        echo "   http://wad-6632067.eastus2.cloudapp.azure.com/booklib/"
    else
        echo "❌ Something went wrong. Check app.log for errors:"
        tail app.log
    fi
else
    echo "❌ Build failed! Check for errors above."
fi
```

## 🔍 Troubleshooting

### Check Application Logs
```bash
cd ~/booklib
tail -f app.log
```

### Check if Process is Running
```bash
ps aux | grep node
netstat -tulpn | grep :3003
```

### Manual Testing
```bash
# Test local connection
curl -v http://localhost:3003/booklib/

# Test external connection
curl -v http://wad-6632067.eastus2.cloudapp.azure.com/booklib/
```

## 🌟 Expected Results

After running the fix, you should see:
- ✅ `http://wad-6632067.eastus2.cloudapp.azure.com/booklib/` - Shows the book library
- ✅ `http://wad-6632067.eastus2.cloudapp.azure.com/booklib/books` - Shows books list
- ✅ `http://wad-6632067.eastus2.cloudapp.azure.com/booklib/api/books` - Returns API data

## 🔄 For Future Deployments

Always remember to:
1. Set `NEXT_PUBLIC_BASE_PATH=/booklib` before building
2. Use the standalone server: `node .next/standalone/nextlibrary/server.js`
3. Include the base path environment variable when starting

## 📞 Verification Commands

Run these to confirm everything is working:

```bash
# 1. Check if server is running
curl -I http://localhost:3003/booklib/

# 2. Check if API works
curl http://localhost:3003/booklib/api/books

# 3. Check external access
curl -I http://wad-6632067.eastus2.cloudapp.azure.com/booklib/
```

The key fix is ensuring `NEXT_PUBLIC_BASE_PATH=/booklib` is set during both build and runtime!
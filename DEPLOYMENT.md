# Deployment Guide for VM with Subpath

## Overview
This guide explains how to deploy the Next.js Book Library application on a VM with a subpath like `vm-name/booklib`.

## Local Development
For local development, use the standard commands:
```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm start        # Production server
```

## VM Deployment with Subpath

### Method 1: Using Environment Variables (Recommended)

1. **Set environment variables before building:**
```bash
export NEXT_PUBLIC_BASE_PATH=/booklib
export NEXT_PUBLIC_ASSET_PREFIX=/booklib
```

2. **Build and start:**
```bash
pnpm build
pnpm start
```

### Method 2: Using Pre-configured Scripts

Use the VM-specific scripts that automatically set the correct paths:
```bash
pnpm run build:vm    # Build for VM deployment
pnpm run start:vm    # Start with VM configuration
```

### Method 3: Manual Environment File

1. **Update `.env.production`:**
```bash
NEXT_PUBLIC_BASE_PATH=/booklib
NEXT_PUBLIC_ASSET_PREFIX=/booklib
```

2. **Build and deploy:**
```bash
NODE_ENV=production pnpm build
NODE_ENV=production pnpm start
```

## Nginx Configuration

For serving the app through Nginx with a subpath, use this configuration:

```nginx
server {
    listen 80;
    server_name your-vm-name;

    location /booklib {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Handle API routes
        location /booklib/api {
            proxy_pass http://localhost:3003/api;
        }
    }
}
```

## Apache Configuration

For Apache with mod_proxy:

```apache
<VirtualHost *:80>
    ServerName your-vm-name
    
    ProxyPreserveHost On
    ProxyRequests Off
    
    ProxyPass /booklib http://localhost:3003
    ProxyPassReverse /booklib http://localhost:3003
    
    # Handle API routes
    ProxyPass /booklib/api http://localhost:3003/api
    ProxyPassReverse /booklib/api http://localhost:3003/api
</VirtualHost>
```

## Customizing the Subpath

To deploy with a different subpath (e.g., `/library` instead of `/booklib`):

1. **Update the environment variables:**
```bash
NEXT_PUBLIC_BASE_PATH=/library
NEXT_PUBLIC_ASSET_PREFIX=/library
```

2. **Update the package.json scripts:**
```json
"build:vm": "NEXT_PUBLIC_BASE_PATH=/library NEXT_PUBLIC_ASSET_PREFIX=/library next build",
"start:vm": "NEXT_PUBLIC_BASE_PATH=/library NEXT_PUBLIC_ASSET_PREFIX=/library next start -p 3003"
```

3. **Update your web server configuration** to use the new path.

## Testing the Deployment

After deployment, verify these URLs work correctly:
- `http://vm-name/booklib/` - Main application
- `http://vm-name/booklib/books` - Books list
- `http://vm-name/booklib/books/new` - Add new book
- `http://vm-name/booklib/api/books` - API endpoint

## Troubleshooting

### Common Issues:

1. **404 errors on page refresh:**
   - Ensure your web server is configured to handle client-side routing
   - Add fallback rules to serve `index.html` for non-API routes

2. **API routes not working:**
   - Verify the proxy configuration includes API routes
   - Check that `/booklib/api/*` routes are correctly forwarded

3. **Static assets not loading:**
   - Verify `NEXT_PUBLIC_ASSET_PREFIX` is set correctly
   - Check web server static file handling

4. **CSS/JS not loading:**
   - Ensure the asset prefix matches your deployment path
   - Check browser network tab for 404s

### Debug Mode:

For debugging, you can check the generated paths by adding this to any page:
```javascript
console.log('Base Path:', process.env.NEXT_PUBLIC_BASE_PATH);
console.log('Current URL:', window.location.href);
```

## Production Checklist

- [ ] Environment variables set correctly
- [ ] MongoDB connection string updated
- [ ] Web server configuration updated
- [ ] Application built with correct paths
- [ ] All routes tested (pages and API)
- [ ] Static assets loading correctly
- [ ] Navigation working between pages

## Performance Considerations

1. **Enable compression** in your web server
2. **Set up caching** for static assets
3. **Configure proper headers** for API responses
4. **Monitor application logs** for errors

## Security Notes

1. Ensure MongoDB credentials are secure
2. Use HTTPS in production
3. Set proper CORS headers if needed
4. Keep dependencies updated
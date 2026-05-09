# SETUP GUIDE FOR MULTI-DEVICE DEPLOYMENT

## Backend Setup

1. **Find your machine IP:**
   ```bash
   hostname -I        # Linux
   ipconfig          # Windows
   ifconfig          # macOS
   ```

2. **Update Backend .env file:**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database?retryWrites=true&w=majority
   PORT=3000
   ```

3. **Start Backend:**
   ```bash
   cd Backend
   npm run dev
   ```

## Frontend Setup

### Option 1: For Same Machine (Localhost)
```bash
# Frontend/.env.local
VITE_API_BASE_URL=http://localhost:3000
```

### Option 2: For Network Access (Different Devices)
```bash
# Frontend/.env.local
# Replace YOUR_MACHINE_IP with your actual IP (e.g., 192.168.1.100)
VITE_API_BASE_URL=http://YOUR_MACHINE_IP:3000
```

### Option 3: For Production
```bash
# Frontend/.env.production
VITE_API_BASE_URL=https://yourdomain.com
```

## Running Frontend

```bash
cd Frontend

# Development Mode (Hot Reload)
npm run dev

# Production Build
npm run build

# Preview Build
npm preview
```

## Access from Different Devices

After starting both servers:

1. **Same Machine:**
   - Backend: http://localhost:3000
   - Frontend: http://localhost:5173

2. **Different Machine on Same Network:**
   - Backend: http://YOUR_MACHINE_IP:3000
   - Frontend: http://YOUR_MACHINE_IP:5173

3. **Internet Access:**
   - Deploy to cloud platform (Vercel, Heroku, etc.)
   - Use domain name for both backend and frontend
   - Ensure MongoDB Atlas allows access from external IPs

## Troubleshooting

- **"Failed to delete document" / Cannot connect to API:**
  - Check if backend is running on port 3000
  - Verify the IP address in .env is correct
  - Check firewall settings on backend machine
  - Ensure both machines are on the same network

- **CORS Errors:**
  - Backend already has CORS enabled
  - If issues persist, check Backend/src/server.js middleware

- **PDF Upload Issues:**
  - Backend/uploads directory must exist and be writable
  - Check permissions: `chmod 755 Backend/uploads`

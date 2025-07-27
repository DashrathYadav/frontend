# Frontend API Configuration

## Backend API URL Configuration

The frontend is now configured to make requests to the backend API running on `http://localhost:5268/`.

### Configuration Files Updated:

1. **vite.config.ts**: Updated proxy configuration to forward `/api` requests to `http://localhost:5268`
2. **src/services/api.ts**: Updated base URL to use `http://localhost:5268/api/v1`
3. **.env**: Added environment variable `VITE_API_BASE_URL=http://localhost:5268/api/v1`
4. **.env.development**: Development-specific environment configuration

### How it works:

- The frontend uses axios to make HTTP requests to the backend
- All API calls go through the `/api` routes which are proxied by Vite to the backend
- The backend API base URL is configurable via the `VITE_API_BASE_URL` environment variable
- CORS is already configured on the backend to allow requests from `http://localhost:5173`

### To run the frontend:

```bash
cd frontend/rental-management-ui
npm install
npm run dev
```

The frontend will start on `http://localhost:5173` and proxy API requests to `http://localhost:5268`.

### Available API Endpoints:

The frontend can now communicate with the following backend APIs:

- `/api/v1/property/*` - Property management
- `/api/v1/room/*` - Room management
- `/api/v1/tenant/*` - Tenant management
- `/api/v1/owner/*` - Owner management
- `/api/v1/lookups/*` - Lookup data (property types, currencies, etc.)
- `/api/v1/renttrack/*` - Rent tracking
- `/api/v1/address/*` - Address management

### Environment Variables:

- `VITE_API_BASE_URL`: The base URL for the backend API (default: `http://localhost:5268/api/v1`)

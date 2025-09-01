# Environment Configuration Guide

This guide explains the simplified environment configuration setup for the Rental Management UI.

## 📁 Current Structure

```
rental-management-ui/
├── .env              # ✅ Single source of truth (ignored by git)
└── ENV_SETUP.md      # 📖 This documentation
```

## 🔧 Setup Instructions

### Direct .env Configuration

1. **Use the existing .env file:**
   - The `.env` file is your single source of truth
   - Add your actual API keys and configuration directly here
   - This file is ignored by git for security

2. **Configure for your environment:**
   - For local API development:
     ```
     VITE_API_BASE_URL=http://localhost:5268/api/v1
     ```
   - For staging/production, use the appropriate API endpoint

### For Production Deployment

1. **Update API URL:**
   ```bash
   # In .env file, set production API endpoint
   VITE_API_BASE_URL=http://rentwiz-api-env.eba-qfm3a33m.ap-south-1.elasticbeanstalk.com/api/v1
   ```

2. **Set production flags:**
   ```bash
   VITE_APP_ENV=production
   VITE_DEBUG_MODE=false
   VITE_DEV_TOOLS=false
   ```

## 🌐 Available Environment Variables

### Required Variables
- `VITE_API_BASE_URL` - API base URL (required by the application)

### Application Configuration
- `VITE_APP_ENV` - Environment (development/staging/production)
- `VITE_APP_NAME` - Application display name
- `VITE_APP_VERSION` - Application version

### Feature Flags
- `VITE_DEBUG_MODE` - Enable/disable debug mode
- `VITE_DEV_TOOLS` - Enable/disable development tools

### Security Configuration
- `VITE_JWT_EXPIRY` - JWT token expiration (minutes)
- `VITE_MAX_FILE_SIZE` - Maximum file upload size (MB)

## 🔐 Security Notes

- ⚠️ **Never commit `.env` files** - They are ignored by git for security
- 🔒 **Keep sensitive data secure** - Never expose API keys or secrets in frontend code
- 📝 **Document new variables** - Update this guide when adding new environment variables

## 🚀 Available API Endpoints

### Development/Staging
```
https://dyjaht9foou5g.cloudfront.net/api/v1
```

### Production
```
http://rentwiz-api-env.eba-qfm3a33m.ap-south-1.elasticbeanstalk.com/api/v1
```

### Local Development
```
http://localhost:5268/api/v1
```

## 🔄 Migration from Old Setup

The previous setup had multiple redundant files:
- ❌ `.env.development` (removed)
- ❌ `.env.production` (removed)
- ❌ `.env.example` (removed - not needed)
- ✅ `.env` (single source of truth)

All environment-specific configurations are now managed in a single `.env` file.

## 🛠️ Troubleshooting

### Issue: API calls failing
- **Check**: Ensure `VITE_API_BASE_URL` is correctly set
- **Check**: Remove trailing slashes from URLs
- **Check**: Verify the API server is running

### Issue: Environment variables not loading
- **Check**: All variable names must start with `VITE_`
- **Check**: Restart the development server after changing `.env`
- **Check**: Variables are not enclosed in quotes unless needed

### Issue: 404 errors
- **Check**: API base URL path includes `/api/v1`
- **Check**: No extra slashes in the URL construction

## 📝 Example .env Configuration

```bash
# Your single source of truth for environment variables
VITE_API_BASE_URL=https://dyjaht9foou5g.cloudfront.net/api/v1
VITE_APP_ENV=development
VITE_DEBUG_MODE=true
VITE_DEV_TOOLS=true
```

---

*Last updated: [Current Date]*
*For questions, contact the development team.*
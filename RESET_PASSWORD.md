# Password Reset Instructions

If a user has forgotten their password, you can reset it using one of these methods:

## Method 1: Admin API Endpoint (Recommended)

1. **Set the admin key** in your Render environment variables:
   - Go to your Render dashboard
   - Navigate to your backend service
   - Go to Environment variables
   - Add: `ADMIN_RESET_KEY` = (choose a secure random string, e.g., generate one at https://www.random.org/strings/)

2. **Reset the password** by making a POST request to:
   ```
   POST https://your-backend-url.onrender.com/api/auth/admin/reset-password
   Content-Type: application/json
   
   {
     "email": "user@example.com",
     "newPassword": "newpassword123",
     "adminKey": "your-admin-key-here"
   }
   ```

   You can use curl, Postman, or any HTTP client:
   ```bash
   curl -X POST https://your-backend-url.onrender.com/api/auth/admin/reset-password \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user@example.com",
       "newPassword": "newpassword123",
       "adminKey": "your-admin-key-here"
     }'
   ```

3. **Tell the user** their new password so they can log in and change it.

## Method 2: Local Script (If you have database access)

If you have access to the database file, you can run:

```bash
cd backend
node reset-password.js user@example.com newpassword123
```

**Note:** This only works if you have the database file locally. For Render deployments, use Method 1.

## Security Notes

- The admin key should be a strong, random string
- Only share the new password through a secure channel
- Consider removing the admin endpoint after use, or restrict it by IP
- For production, consider implementing a proper password reset flow with email verification


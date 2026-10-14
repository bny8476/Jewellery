# Complete Setup Guide - Pawnshop Management System

This guide will walk you through setting up the pawnshop management system from scratch.

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher) installed
- **npm** or **yarn** package manager
- **Supabase account** (free tier works)
- **Git** (optional, for version control)

## 🚀 Step-by-Step Setup

### Step 1: Install Dependencies

```bash
# Navigate to project directory
cd pawnshop-main

# Install all dependencies
npm install
```

This will install all required packages including:
- React and related libraries
- Supabase client
- TailwindCSS
- react-toastify (for notifications)
- And other dependencies

### Step 2: Set Up Supabase Project

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Sign up or log in
   - Click "New Project"
   - Fill in project details (name, database password, region)
   - Wait for project to be created (takes ~2 minutes)

2. **Get Your Supabase Credentials**
   - Go to Project Settings → API
   - Copy the following:
     - **Project URL** (looks like: `https://xxxxx.supabase.co`)
     - **anon/public key** (under Project API keys)

3. **Set Up Environment Variables**
   - Create a `.env` file in the root directory:
   ```bash
   # .env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
   
   **⚠️ Important**: Never commit the `.env` file to git. It's already in `.gitignore`.

### Step 3: Set Up Database Schema

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

2. **Run the Main Schema Script**
   - Open the file: `supabase/pawnshop-schema.sql`
   - Copy the entire contents
   - Paste into the Supabase SQL Editor
   - Click "Run" or press `Ctrl+Enter` (or `Cmd+Enter` on Mac)
   - Wait for execution to complete

3. **Apply RLS Policy Fixes** (IMPORTANT for security!)
   - Open the file: `supabase/migrations/fix-rls-policies.sql`
   - Copy the entire contents
   - Paste into a new query in SQL Editor
   - Click "Run"
   - This restricts database access to authenticated users only

### Step 4: Create Admin User

1. **Go to Authentication Section**
   - In Supabase dashboard, click "Authentication" → "Users"
   - Click "Add user" → "Create new user"

2. **Create Admin Account**
   - Enter email (e.g., `admin@pawnshop.com`)
   - Enter password (use a strong password)
   - Uncheck "Auto Confirm User" (optional, but recommended)
   - Click "Create user"

3. **Note Your Credentials**
   - Save the email and password securely
   - You'll need these to log into the admin panel

### Step 5: Run Database Setup Script (Optional)

If you want to set up the database using the Node.js script instead of SQL Editor:

1. **Set Environment Variables** (for database connection)
   ```bash
   # Windows PowerShell
   $env:DB_PASSWORD="your_database_password"
   $env:DB_HOST="db.xxxxx.supabase.co"
   
   # Linux/Mac
   export DB_PASSWORD="your_database_password"
   export DB_HOST="db.xxxxx.supabase.co"
   ```

2. **Run the Setup Script**
   ```bash
   node setup-pawnshop-db.cjs
   ```

   **Note**: You can find your database host in Supabase Dashboard → Settings → Database → Connection string.

### Step 6: Start Development Server

```bash
npm run dev
```

The application will start on `http://localhost:5173` (or another port if 5173 is busy).

### Step 7: Access the Application

1. **Public Pages**
   - Home: `http://localhost:5173/`
   - Jewelry: `http://localhost:5173/jewelry`
   - Pawn: `http://localhost:5173/pawn`
   - Login (customer): `http://localhost:5173/login`

2. **Admin Panel** (Protected)
   - Admin Login: `http://localhost:5173/admin/login`
   - Admin Dashboard: `http://localhost:5173/admin`
   - Use the admin credentials you created in Step 4

## 🔐 Security Checklist

- [ ] ✅ Environment variables set in `.env` file
- [ ] ✅ `.env` file is NOT committed to git (check `.gitignore`)
- [ ] ✅ Database schema created in Supabase
- [ ] ✅ RLS policies updated (fix-rls-policies.sql run)
- [ ] ✅ Admin user created in Supabase Auth
- [ ] ✅ Hardcoded credentials removed from setup scripts
- [ ] ✅ All sensitive data uses environment variables

## 🧪 Testing Your Setup

1. **Test Database Connection**
   - Go to admin login page
   - Try logging in with your admin credentials
   - If it works, database connection is working

2. **Test Authentication**
   - Try accessing `/admin` directly (should redirect to login)
   - Login with correct credentials (should access admin panel)
   - Click logout (should return to login)

3. **Test Toast Notifications**
   - In admin panel, try updating metal rates
   - Try adding/editing a customer
   - You should see toast notifications

4. **Test Error Handling**
   - Try accessing a non-existent route
   - Error boundary should catch React errors

## 🐛 Troubleshooting

### Issue: "Please click Connect to Supabase"
**Solution**: Check that your `.env` file exists and has correct values. Restart the dev server.

### Issue: "Invalid login credentials"
**Solution**: 
- Verify user exists in Supabase Auth → Users
- Check email and password are correct
- Make sure user email is confirmed (check in Supabase dashboard)

### Issue: "Failed to fetch" or Database Errors
**Solution**:
- Check Supabase project is active (not paused)
- Verify RLS policies are set correctly
- Check browser console for detailed error messages
- Verify your Supabase URL and anon key are correct

### Issue: Tables Not Found
**Solution**:
- Run the schema SQL script again in Supabase SQL Editor
- Check for any SQL errors in the editor
- Verify tables exist in Supabase Table Editor

### Issue: Toast Notifications Not Working
**Solution**:
- Run `npm install react-toastify`
- Restart the dev server
- Check browser console for errors

### Issue: Build Errors
**Solution**:
- Delete `node_modules` folder
- Delete `package-lock.json`
- Run `npm install` again
- Check TypeScript errors: `npm run lint`

## 📝 Environment Variables Reference

### Required Variables

```env
# Supabase Configuration (Required)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Optional Variables

```env
# Stripe (for payments - optional)
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key

# Environment
NODE_ENV=development

# Database Setup Script (only if using setup-pawnshop-db.cjs)
DB_PASSWORD=your_database_password
DB_HOST=db.xxxxx.supabase.co
DB_USER=postgres
DB_NAME=postgres
```

## 🎯 Next Steps After Setup

1. **Customize Master Data**
   - Add your company information
   - Set up loan types
   - Configure schemes and interest rates
   - Add jewellery types

2. **Update Metal Rates**
   - Go to Admin → Dashboard
   - Click "Edit Rates"
   - Update gold and silver rates

3. **Create Test Data**
   - Add some customers
   - Create test pledges
   - Test the full workflow

4. **Review Security**
   - Verify RLS policies are working
   - Test that unauthenticated users can't access data
   - Review user permissions

## 📚 Additional Resources

- **Supabase Docs**: https://supabase.com/docs
- **React Router Docs**: https://reactrouter.com/
- **TailwindCSS Docs**: https://tailwindcss.com/docs
- **Project Analysis**: See `PROJECT_ANALYSIS_AND_IMPROVEMENTS.md`
- **Critical Fixes**: See `CRITICAL_FIXES_APPLIED.md`

## 🆘 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review browser console for errors
3. Check Supabase logs (Dashboard → Logs)
4. Review the project analysis document
5. Check Supabase documentation

---

**Setup Complete!** 🎉

You should now have a fully functional pawnshop management system with:
- ✅ Secure authentication
- ✅ Protected admin routes
- ✅ Database set up
- ✅ Error handling
- ✅ Toast notifications
- ✅ Modern UI

Happy coding! 🚀


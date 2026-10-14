-- Run this in the Supabase SQL Editor to manually verify your admin account
-- This bypasses the need for the verification email

UPDATE auth.users
SET email_confirmed_at = now(),
    updated_at = now(),
    confirmed_at = now()
WHERE email = '2002dineshmurugan@gmail.com';

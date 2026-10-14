# 🔑 How to Get Free Gold/Silver API Key

## Quick Setup (5 minutes)

### Option 1: GoldAPI.io (Recommended) ⭐

**Free Tier:** 100 requests/month

1. **Sign Up**
   - Go to: https://www.goldapi.io/
   - Click "Get Free API Key"
   - Sign up with email (no credit card required)

2. **Get Your API Key**
   - After signup, you'll see your API key on the dashboard
   - Copy the API key (looks like: `goldapi-xxxxxxxxxxxxx`)

3. **Add to Your Project**
   - Open `.env` file in your project
   - Add: `VITE_GOLD_API_KEY=your-api-key-here`
   - Save the file
   - Restart dev server: `npm run dev`

4. **Verify It's Working**
   - Open browser console (F12)
   - Look for: `✅ Live rates fetched from API`
   - Prices will update every 5 minutes

---

### Option 2: Metals.dev

**Free Tier:** 100 requests/month

1. Visit: https://metals.dev/
2. Sign up for free account
3. Get API key from dashboard
4. Update `.env`: `VITE_GOLD_API_KEY=your-metals-dev-key`

**Note:** You'll need to modify the API endpoint in `RateContext.tsx` to:
```typescript
const response = await fetch(`https://api.metals.dev/v1/latest?api_key=${API_KEY}&currency=INR&unit=g`);
```

---

### Option 3: MetalpriceAPI.com

**Free Tier:** 50 requests/month

1. Visit: https://metalpriceapi.com/
2. Sign up for free
3. Get API key
4. Update `.env`: `VITE_GOLD_API_KEY=your-metalpriceapi-key`

**Note:** Modify endpoint in `RateContext.tsx`:
```typescript
const response = await fetch(`https://api.metalpriceapi.com/v1/latest?api_key=${API_KEY}&base=INR&currencies=XAU,XAG`);
```

---

## Without API Key

If you don't add an API key, the app will:
- ✅ Still work perfectly
- ✅ Use realistic simulated prices
- ✅ Update prices every 5 minutes
- ⚠️ Prices won't reflect actual market rates

---

## Rate Limits & Usage

With **100 requests/month** and **5-minute refresh**:
- 12 requests/hour × 24 hours = 288 requests/day
- **Solution:** Auto-refresh is set to 5 minutes
- This uses ~288 requests/day if running 24/7
- For production, increase interval to 15-30 minutes

**Recommended Intervals:**
- Development: 5 minutes (current)
- Production: 15-30 minutes
- Low traffic: 1 hour

To change interval, edit `RateContext.tsx`:
```typescript
const interval = setInterval(() => {
    fetchLiveRates();
}, 900000); // 15 minutes = 900000ms
```

---

## Troubleshooting

### "No API key found" in console
- Check `.env` file has `VITE_GOLD_API_KEY=your-key`
- Restart dev server after adding key
- Make sure no spaces around `=`

### "API Error: 401"
- API key is invalid
- Check you copied the full key
- Verify key is active on provider dashboard

### "API Error: 429"
- Rate limit exceeded
- Wait for next month or upgrade plan
- App will use last fetched rates

### Prices not updating
- Check browser console for errors
- Verify API key is correct
- Check internet connection
- Provider might be down (rare)

---

## Cost Comparison

| Provider | Free Tier | Paid Plans |
|----------|-----------|------------|
| GoldAPI.io | 100/month | $10/month (10,000 req) |
| Metals.dev | 100/month | $15/month (5,000 req) |
| MetalpriceAPI | 50/month | $12/month (unlimited) |

**Recommendation:** Start with GoldAPI.io free tier, upgrade if needed.

---

## Security Note

⚠️ **Never commit your API key to Git!**

The `.env` file is already in `.gitignore`, so your key is safe.

For production deployment (Vercel, Netlify, etc.):
1. Add environment variable in hosting dashboard
2. Use the same name: `VITE_GOLD_API_KEY`
3. Paste your API key value

---

## Next Steps

1. Get free API key from GoldAPI.io
2. Add to `.env` file
3. Restart server
4. Watch console for success message
5. Enjoy real-time market prices! 🎉

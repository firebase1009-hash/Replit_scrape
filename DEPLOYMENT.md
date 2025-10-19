# Vercel Deployment Guide

## Prerequisites
1. Install Vercel CLI: `npm i -g vercel`
2. Login to Vercel: `vercel login`

## Deployment Steps

1. **Deploy to Vercel:**
   ```bash
   vercel
   ```

2. **For production deployment:**
   ```bash
   vercel --prod
   ```

## Important Notes

- The app is configured to work with Vercel's serverless environment
- Puppeteer will automatically download Chrome in the Vercel environment
- The function timeout is set to 30 seconds (Vercel's maximum for hobby plan)
- Chrome path detection works for both local development (Windows) and Vercel (Linux)

## Environment Variables

No additional environment variables are required. The app will automatically detect the environment and configure Puppeteer accordingly.

## API Endpoints

- `GET /` - API documentation
- `GET /api/health` - Health check
- `GET /api/scrape?limit=20` - Scrape videos (limit 1-100)

# Video Scraper API

## Overview
This is a REST API that scrapes video data from batibot.org using Puppeteer. The API accepts a configurable limit parameter to control how many videos to scrape.

## Recent Changes
- **2025-10-19**: Initial project setup
  - Created Express API server with Puppeteer integration
  - Added `/api/scrape` endpoint with limit parameter (1-100)
  - Configured for Replit deployment (autoscale)
  - Set up workflow to run on port 5000

## API Endpoints

### GET /api/scrape
Scrapes videos from batibot.org with configurable limit.

**Query Parameters:**
- `limit` (optional): Number of videos to scrape (default: 20, max: 100)

**Example:**
```
GET /api/scrape?limit=10
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "limit": 10,
  "videos": [...]
}
```

### GET /api/health
Health check endpoint to verify the API is running.

### GET /
Root endpoint with API documentation.

## Project Architecture
- **server.js**: Main Express server with Puppeteer scraper
- **Dependencies**: Express (web server), Puppeteer (web scraping)
- **Deployment**: Autoscale deployment on Replit
- **Port**: 5000

## Technical Details
- Puppeteer runs in headless mode with sandbox disabled for Replit environment
- Scraper extracts video URL, thumbnail, and title from the source
- Only returns videos with all three fields present
- Limit validation: 1-100 videos per request

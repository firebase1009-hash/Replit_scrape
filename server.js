const express = require('express');
const puppeteer = require('puppeteer');
const { exec } = require('child_process');
const { promisify } = require('util');

const app = express();
const PORT = process.env.PORT || 5000;

// Get Chrome path for Puppeteer
function getChromePath() {
    const os = require('os');
    const path = require('path');
    
    if (process.platform === 'win32') {
        // Windows local development
        return path.join(os.homedir(), '.cache', 'puppeteer', 'chrome', 'win64-141.0.7390.78', 'chrome-win64', 'chrome.exe');
    } else {
        // Linux/Unix (Vercel, etc.) - let Puppeteer handle the path automatically
        // or try to find the installed Chrome
        try {
            const { execSync } = require('child_process');
            const chromePath = execSync('which google-chrome-stable || which google-chrome || which chromium-browser || which chromium', { encoding: 'utf8' }).trim();
            return chromePath;
        } catch (error) {
            // Let Puppeteer use its bundled Chrome
            return null;
        }
    }
}

// Video scraper function with dynamic limit
async function scrapeVideos(limit = 20) {
    let browser;
    
    try {
        const chromePath = getChromePath();
        const launchOptions = {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--single-process'
            ]
        };
        
        if (chromePath) {
            launchOptions.executablePath = chromePath;
            console.log('Using Chrome at:', chromePath);
        } else {
            console.log('Using default Puppeteer Chrome');
        }
        
        browser = await puppeteer.launch(launchOptions);

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const url = `https://batibot.org/load_more_random.php?start=0&limit=${limit}`;
        console.log('Navigating to:', url);
        
        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        // Wait for content to load
        await page.evaluate(() => {
            return new Promise(resolve => setTimeout(resolve, 3000));
        });

        // Extract video data
        const videoData = await page.evaluate(() => {
            const videos = [];

            // Look for video elements
            const videoElements = document.querySelectorAll('video, iframe');
            videoElements.forEach(video => {
                // Get title from multiple possible sources
                let title = video.getAttribute('title') || 
                           video.getAttribute('alt') ||
                           video.getAttribute('data-title') ||
                           video.closest('div')?.getAttribute('data-title') ||
                           video.closest('article')?.querySelector('h1, h2, h3, h4, h5, h6')?.innerText?.trim() ||
                           video.closest('div')?.querySelector('h1, h2, h3, h4, h5, h6')?.innerText?.trim();

                const videoUrl = video.src || video.getAttribute('src');
                const thumbnail = video.poster || video.getAttribute('poster');

                // Only add if ALL three fields are not empty
                if (videoUrl && thumbnail && title) {
                    videos.push({
                        type: video.tagName,
                        videoUrl: videoUrl,
                        thumbnail: thumbnail,
                        title: title
                    });
                }
            });

            // Look for containers with video data
            const containers = document.querySelectorAll('div, article, section');
            containers.forEach(container => {
                const videoUrl = container.getAttribute('data-video-url') || 
                               container.getAttribute('data-video') ||
                               container.querySelector('a')?.href;
                
                const thumbnail = container.getAttribute('data-thumbnail') ||
                                container.getAttribute('data-poster') ||
                                container.querySelector('img')?.src;

                // Enhanced title extraction from containers
                let title = container.getAttribute('data-title') ||
                          container.getAttribute('title') ||
                          container.getAttribute('aria-label') ||
                          container.querySelector('h1, h2, h3, h4, h5, h6')?.innerText?.trim() ||
                          container.querySelector('[class*="title"], [class*="name"], [class*="heading"]')?.innerText?.trim() ||
                          container.querySelector('img')?.getAttribute('alt') ||
                          container.querySelector('a')?.getAttribute('title');

                // Only add if ALL three fields are not empty
                if (videoUrl && thumbnail && title) {
                    videos.push({
                        type: 'container',
                        videoUrl: videoUrl,
                        thumbnail: thumbnail,
                        title: title
                    });
                }
            });

            return videos;
        });

        const filteredVideos = videoData.filter(item => item.videoUrl && item.thumbnail && item.title);
        return filteredVideos;

    } catch (error) {
        console.error('Error during scraping:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// API endpoint
app.get('/api/scrape', async (req, res) => {
    try {
        // Get limit from query parameter, default to 20
        const rawLimit = req.query.limit;
        const limit = rawLimit === undefined ? 20 : Number(rawLimit);
        
        // Validate limit
        if (!Number.isFinite(limit) || !Number.isInteger(limit) || limit < 1 || limit > 100) {
            return res.status(400).json({
                error: 'Limit must be an integer between 1 and 100'
            });
        }

        console.log(`Scraping with limit: ${limit}`);
        const videos = await scrapeVideos(limit);
        
        res.json({
            success: true,
            count: videos.length,
            limit: limit,
            videos: videos
        });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to scrape videos',
            message: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Video scraper API is running' });
});

// Root endpoint with usage instructions
app.get('/', (req, res) => {
    res.json({
        message: 'Video Scraper API',
        endpoints: {
            '/api/scrape': 'GET - Scrape videos (accepts ?limit parameter, default: 20, max: 100)',
            '/api/health': 'GET - Health check'
        },
        example: '/api/scrape?limit=10'
    });
});

// Only start server if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Video Scraper API running on port ${PORT}`);
        console.log(`Usage: /api/scrape?limit=20`);
    });
}

// Export for Vercel
module.exports = app;

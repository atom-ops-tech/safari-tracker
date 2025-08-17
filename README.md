# Safari Wildlife Tracker

## Quick Start

### 1. Frontend (The App)
- Save the HTML file to your phone/computer
- Open it in Chrome (or any modern browser)
- On first launch, you'll see a setup screen:
  - **Name**: Your name for tracking
  - **Server URL**: Your server address (if using collaborative mode)
  - **Password**: The password you set on the server
  - Click "Use Offline Only" if you don't have a server

### 2. Sharing with Family (URL Parameters)

You can share pre-configured links with your family to avoid manual setup:

```
https://your-domain.com/safari-tracker.html?server=your-server.com&password=safari2024&name=Sam
```

**URL Parameters:**
- `server` - Your server URL
- `password` - The shared family password
- `name` - Pre-fill the person's name (optional)

**Easy Sharing:**
1. Set up your tracker first
2. Click "Share Link" button
3. Send the copied link to family members
4. They open the link and just enter their name!

### 3. Backend Server (For Collaborative Tracking)

#### Option A: Quick Deploy on a VPS (DigitalOcean, Linode, AWS, etc.)
```bash
# SSH into your server
ssh user@your-server.com

# Create a directory
mkdir safari-tracker
cd safari-tracker

# Create the server file
nano safari-server.js
# (paste the server code)

# Run with environment variables
SAFARI_PASSWORD=yourpassword PORT=3000 node safari-server.js

# Or use PM2 to keep it running
npm install -g pm2
SAFARI_PASSWORD=yourpassword pm2 start safari-server.js
pm2 save
pm2 startup
```

#### Option B: Deploy on Render.com (Free tier available)
1. Create account on render.com
2. New > Web Service
3. Connect GitHub repo or paste code
4. Set environment variables:
   - `SAFARI_PASSWORD` = your-password
   - `PORT` = 3000
5. Deploy!

#### Option C: Run Locally for Testing
```bash
# On your computer
node safari-server.js
# Server runs on http://localhost:3000
```

## How It Works

### Offline Mode
- All data saved in browser localStorage
- Works without internet
- Data persists until you clear browser cache
- Use "Download Backup" to save your data as a file

### Online/Collaborative Mode
- Each device works offline first
- When online, automatically syncs to server
- See everyone's sightings in real-time
- Server stores all data in `safari-data.json`

### Key Features
- **Quick Entry**: Tap animal buttons to log sightings
- **Custom Animals**: Add any animal with custom emojis
- **Edit/Delete**: Fix mistakes easily (instant delete, no confirmations)
- **Auto-sync**: Silent background sync every 15 seconds
- **Visual Feedback**: Toast notifications instead of popups
- **Force Sync**: Manual sync button if needed
- **URL Sharing**: Send pre-configured links to family
- **Backup/Restore**: Download and restore complete backups
- **Export**: CSV format for analysis in Excel/Google Sheets

## Security Notes
- The password is sent as a header, not stored anywhere
- Use HTTPS in production (add SSL certificate to your server)
- Change the default password in the server code

## Data Analysis
Export your data as CSV and analyze:
- Total sightings per animal
- Sightings by time of day
- Daily trends
- Most common animals
- Rare sightings

## Troubleshooting

**No annoying popups?**
- Correct! The app uses toast notifications at the bottom
- Sync happens silently in the background
- Look for status indicators instead of alerts

**Can't connect to server?**
- Check server is running
- Verify URL (include http:// or https://)
- Check password matches
- Ensure server firewall allows port 3000

**Data not syncing?**
- Check status indicator (top of app)
- Shows "Online (X pending)" if waiting to sync
- Try "Force Sync" button if needed
- Verify server is accessible

**Lost data?**
- Check browser didn't clear localStorage
- Restore from backup if you have one
- Check server's safari-data.json file

## Server API Endpoints
- `GET /health` - Check if server is running
- `GET /sightings` - Get all sightings
- `POST /sync` - Sync local sightings
- `GET /export` - Download CSV
- `GET /stats` - Get statistics

All endpoints except `/health` require `X-Password` header.
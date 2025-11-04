# Reading Helper - Auto Scroll

A Chrome extension that automatically scrolls webpages with customizable speed and direction. Perfect for reading long articles or PDFs hands-free.

## Features

- **Auto Scroll** - Automatically scrolls webpages up or down
- **Customizable Speed** - Adjust scroll speed from 10 to 200 pixels per second
- **Direction Control** - Scroll down or up through content
- **Real-time Updates** - Change speed and direction while scrolling
- **Smart Stopping** - Automatically stops at the top or bottom of the page

## Quick Start

```bash
npm install
```

## Chrome Extension (Webpack)

```bash
npm run build:extension    # Build extension
npm run dev:extension       # Watch mode for development
```

### Installation

1. Run `npm run build:extension`
2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" → select the `dist-extension` folder

Build output: `dist-extension` folder

### Usage

1. Navigate to any webpage
2. Click the extension icon in the toolbar
3. Adjust the scroll speed using the slider
4. Choose scroll direction (Down or Up)
5. Click "Start Scrolling" to begin
6. Click "Stop Scrolling" to pause

### Icon Optimization

Generate icons from a source image:

```bash
npm run generate-icons
```

This command generates all required icon sizes (16x16, 32x32, 48x48, 128x128) from `icons/icon.png`.

For best performance, optimize your icons:
- Recommended sizes: 16x16, 32x32, 48x48, 128x128 pixels
- Use PNG format with compression
- Keep file size under 50KB per icon
- Tools: [TinyPNG](https://tinypng.com/), [ImageOptim](https://imageoptim.com/)

The manifest expects:
- `icons/icon16.png`
- `icons/icon32.png`
- `icons/icon48.png`
- `icons/icon128.png`

## Features Details

### Scroll Speed
- Range: 10-200 pixels per second
- Adjustable via slider in real-time
- Smooth scrolling using `requestAnimationFrame`

### Scroll Direction
- **Down**: Scrolls from top to bottom (default)
- **Up**: Scrolls from bottom to top
- Automatically stops at page boundaries

### Controls
- Start/Stop button to control scrolling
- Real-time speed adjustment
- Direction switching while scrolling
- Visual status indicator

## Project Structure

- **Chrome extension**: Uses Webpack, builds to `dist-extension/`
- **Content script**: Injected into all pages for scrolling functionality
- **Popup UI**: React-based interface for controlling scroll settings

## Tech Stack

- **Extension**: Webpack + React + Tailwind CSS
- **Content Script**: Vanilla JavaScript with `requestAnimationFrame` for smooth scrolling
- **Popup**: React with Tailwind CSS for styling

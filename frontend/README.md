# Hooklog Frontend

Modern, minimal frontend for the Hooklog webhook capture and replay API.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Axios** - HTTP client
- **Lucide React** - Icons
- **date-fns** - Date formatting

## Development

```bash
# Install dependencies
npm install

# Start dev server (runs on http://localhost:5173)
npm run dev
```

The dev server is configured to proxy API requests to `http://localhost:3000`.

## Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

The built files will be in the `dist/` directory, which the backend will serve in production mode.

## Features

- **Authentication** - Login and register pages
- **Dashboard** - Overview of streams and recent events
- **Stream Management** - Create and manage webhook streams
- **Event Browser** - View captured webhook events with filtering
- **Event Details** - Inspect event headers, body, and metadata
- **Replay** - Replay events to target URLs with SSRF protection

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable components
│   ├── contexts/       # React contexts (Auth)
│   ├── lib/           # Utilities (API client)
│   ├── pages/         # Page components
│   ├── App.tsx        # Main app component
│   ├── main.tsx       # Entry point
│   └── index.css      # Global styles
├── index.html
└── package.json
```

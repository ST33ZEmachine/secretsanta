# Secret Santa App

A modern Secret Santa gift exchange management application built with React and Node.js.

## Features

- 🎁 Create and manage Secret Santa groups
- 👥 Invite participants via shareable links
- 📝 Wishlist management with recommendations
- 🎲 Automatic assignment generation
- 🔒 Secure authentication
- 📧 Email notifications (optional)

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: SQLite
- **Authentication**: JWT

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd secretsanta
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

4. Set up environment variables:
   ```bash
   cd ../backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. Build the backend:
   ```bash
   cd backend
   npm run build
   ```

6. Start the backend server:
   ```bash
   npm start
   # Or for development:
   npm run dev
   ```

7. Start the frontend (in a new terminal):
   ```bash
   cd frontend
   npm run dev
   ```

8. Open your browser to `http://localhost:5173`

## Development

### Backend

- Development server: `npm run dev` (uses nodemon)
- Build: `npm run build`
- Start: `npm start`

### Frontend

- Development server: `npm run dev`
- Build: `npm run build`
- Preview production build: `npm run preview`
- Tests: `npm test` or `npm run test:smoke`

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

Quick deployment options:
- **Vercel** (frontend) + **Railway** (backend) - Recommended
- **Render** (full stack)
- **DigitalOcean App Platform**

## Environment Variables

See `backend/.env.example` for required environment variables.

## License

ISC


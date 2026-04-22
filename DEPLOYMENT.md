# Deployment Guide

This project is deployed as two services:

- `frontend` -> Vercel
- `backend` -> Render

## Frontend on Vercel

- Create a new Vercel project.
- Set the root directory to `frontend`.
- Add this environment variable:

```env
NEXT_PUBLIC_API_URL=https://your-backend-service.onrender.com/api
```

- Build command: `npm run build`
- Install command: `npm install`
- Framework preset: Next.js

## Backend on Render

- Create a new Render Web Service.
- Set the root directory to `backend`.
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/`

Add these environment variables:

```env
DB_URL=mongodb+srv://username:password@cluster.mongodb.net/finance-app
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=https://your-frontend-app.vercel.app
CLIENT_URLS=https://your-frontend-app.vercel.app,https://your-preview-app.vercel.app
```

## Notes

- The frontend proxies browser requests through `/api`, then forwards them to `NEXT_PUBLIC_API_URL`. This avoids browser-side CORS issues with Render.
- The backend still uses `CLIENT_URL` and optional `CLIENT_URLS` for direct access, so set them to your deployed Vercel URL(s) or final custom domain.
- The Python file in `backend/ml` is not part of the live API path, so the backend can stay a standard Node service on Render.

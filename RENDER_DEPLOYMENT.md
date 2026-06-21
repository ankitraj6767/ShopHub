# Deploy ShopHub Backend on Render

This repo is a monorepo. Deploy only the `backend/` folder as a Render Web Service.

## Required Values

Create or collect these before deploying:

| Variable | Value |
| --- | --- |
| `MONGO_URI` | MongoDB Atlas connection string |
| `FRONTEND_URL` | Production frontend URL, for example `https://shop-hub-dusky.vercel.app` |
| `JWT_ACCESS_SECRET` | Let Render generate it from `render.yaml`, or set your own long secret |
| `JWT_REFRESH_SECRET` | Let Render generate it from `render.yaml`, or set your own long secret |

Optional production features:

| Feature | Variables |
| --- | --- |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Razorpay | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` |
| Cloudinary uploads | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| Email via SMTP | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_NAME`, `SMTP_FROM_EMAIL` |
| Email via Resend | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |

Use Cloudinary in production if product images need to persist. Render's normal service filesystem should not be treated as permanent upload storage.

## Option A: Deploy With `render.yaml`

1. Push this repo to GitHub.
2. Open Render Dashboard.
3. Choose **New > Blueprint**.
4. Connect the GitHub repo that contains this `render.yaml`.
5. Render will create the `shophub-backend` web service.
6. Fill the prompted values:
   - `MONGO_URI`
   - `FRONTEND_URL`
7. Deploy.
8. After deploy, open:

```text
https://<your-render-service>.onrender.com/api/health
```

The response should include:

```json
{
  "success": true,
  "message": "API is running"
}
```

## Option B: Manual Render Web Service

Use these exact settings:

| Setting | Value |
| --- | --- |
| Service type | Web Service |
| Runtime / Language | Node |
| Root Directory | `backend` |
| Build Command | `npm ci --omit=dev` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

Add these required environment variables:

```env
NODE_ENV=production
COOKIE_SECURE=true
MONGO_URI=<your MongoDB Atlas URI>
JWT_ACCESS_SECRET=<long random secret>
JWT_REFRESH_SECRET=<another long random secret>
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
FRONTEND_URL=<your deployed frontend URL>
```

## Connect the Frontend

After Render gives you the backend URL, set this in your frontend hosting provider:

```env
VITE_API_URL=https://<your-render-service>.onrender.com/api
```

Then redeploy the frontend. Without this value, the current frontend production fallback can still point to the old Railway backend.

## MongoDB Atlas Checklist

1. Create a database user with a strong password.
2. Use that user in `MONGO_URI`.
3. Ensure Atlas network access allows connections from Render. For the simplest starter setup, allow access from anywhere and rely on the database username/password. For stricter production setups, use a paid static outbound IP setup and allowlist only that IP.

## Quick Verification

Run these checks after deployment:

```bash
curl https://<your-render-service>.onrender.com/
curl https://<your-render-service>.onrender.com/api/health
```

The root endpoint should return `ShopHub API Server`, and the health endpoint should return `API is running`.

# AI Background Removal SaaS

This repo contains a React (Vite) frontend and a Node.js Express backend for an AI background removal SaaS.

## Structure

- `frontend/` — React app with Clerk auth
- `backend/` — Express API with MongoDB, Cloudinary, and Clipdrop

## Step 1

Install dependencies in both folders and then continue with the next step.

## Demo: Remove the background from an image

1. Start the backend:
   - `cd backend`
   - `npm install`
   - `npm run start`

2. Start the frontend:
   - `cd frontend`
   - `npm install`
   - `npm run dev`

3. Open the frontend in your browser (usually `http://localhost:5173`).

4. Use the app UI:
   - Click **Choose an image to remove the background**.
   - Select a photo from your computer.
   - The app displays the original image preview.
   - Click **Remove Background**.
   - Wait for the server to process the image.
   - The processed image with the background removed appears side-by-side.
   - Click **Download Result** to save the final PNG.

## Example screenshot (UI flow)

- Original image shown on the left
- Processed image shown on the right once the background is removed
- Download button available below the result image
- Recent removals appear in the history section for quick reuse

> This is a demo of how the app works without changing any existing code.

## API Demo

If you want to test the backend directly, send a POST request to `/remove-background` with a base64 image data URI and an email address.

Example request body:

```json
{
  "imageBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
  "email": "user@example.com"
}
```

The endpoint responds with the processed image URL:

```json
{
  "url": "https://res.cloudinary.com/your-cloud-name/image/upload/v.../removed-background.png"
}
```

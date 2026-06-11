import app from './app.js';

// Local dev server — `npm run dev` (hot reload) or `npm run start`. Reviewers
// run this to drive the real agent locally (with their own OPENAI_API_KEY in
// .env), or just leave the key unset and the site's chat falls back to its
// built-in demo replies.
const port = process.env.PORT ?? 3000;
app.listen(port, () => {
  console.log(`HNavas agent backend listening on http://localhost:${port}`);
});

module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const url = process.env.SUPABASE_URL || "https://xdvslpecgqcsulaewrlh.supabase.co";
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_UuKgGv01W1JO7K3hw0dOng_KtXgMe56";
  if (!url || !publishableKey) return res.status(503).json({ error: 'Supabase is not configured. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in Vercel.' });
  return res.status(200).json({ url, publishableKey });
};

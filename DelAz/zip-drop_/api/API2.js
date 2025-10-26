export default (req, res) => {
  const user = req.headers['x-vercel-user-email'];
  res.json({ user: user ? { email: user } : null });
};
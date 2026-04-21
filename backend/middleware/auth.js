// Middleware: require logged-in user
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  res.status(401).json({ error: "Not authenticated", redirect: "/login" });
};

module.exports = { isAuthenticated };

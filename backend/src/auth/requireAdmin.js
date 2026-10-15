export default function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Akses ini hanya untuk admin." });
  }
  next();
}

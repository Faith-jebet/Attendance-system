const restrictNetwork = (req, res, next) => {
  let clientIP =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress;

  console.log("Network Check:");
  console.log("  Raw IP:", clientIP);
  console.log("  Route:", req.path);

  // Normalize IPv6 → IPv4
  clientIP = clientIP.replace("::ffff:", "");

  // BLOCK localhost completely (IMPORTANT)
  if (clientIP === "127.0.0.1" || clientIP === "::1") {
    return res.status(403).json({
      message: "Login not allowed from localhost"
    });
  }

  // Allow only school Wi-Fi
  if (clientIP.startsWith("41.81.")) {
    console.log(" Access GRANTED - School Wi-Fi");
    return next();
  }

  console.log(" Access DENIED - Not school network");

  return res.status(403).json({
    message: "Login allowed only on school Wi-Fi"
  });
};

module.exports = restrictNetwork;

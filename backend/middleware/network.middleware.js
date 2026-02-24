const restrictNetwork = (req, res, next) => {
  let clientIP =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress;

  console.log("Network Check:");
  console.log("  Raw IP:", clientIP);
  console.log("  Route:", req.path);

  // Normalize IPv6 → IPv4
  clientIP = clientIP.replace("::ffff:", "").trim();

  // Block localhost
  if (clientIP === "127.0.0.1" || clientIP === "::1") {
    return res.status(403).json({
      message: "Login not allowed from localhost"
    });
  }

  // Allow school Wi-Fi public IP
  if (clientIP.startsWith("41.89.240.")) {
    console.log("Access GRANTED - School Wi-Fi (public)");
    return next();
  }

  // Allow local network (same machine or same LAN as server)
  if (clientIP.startsWith("192.168.179.")) {
    console.log("Access GRANTED - Local network");
    return next();
  }

  console.log("Access DENIED - Not school network:", clientIP);
  return res.status(403).json({
    message: "Login allowed only on school Wi-Fi"
  });
};

module.exports = restrictNetwork;
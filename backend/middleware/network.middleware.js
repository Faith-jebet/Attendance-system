const restrictNetwork = (req, res, next) => {
  let clientIP =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress;

  console.log("Network Check:");
  console.log("  Raw IP:", clientIP);
  console.log("  Route:", req.path);

  clientIP = clientIP.replace("::ffff:", "").trim();

  // Allow localhost
  if (clientIP === "127.0.0.1" || clientIP === "::1") {
    console.log("Access GRANTED - Localhost");
    return next();
  }

  // Allow school Wi-Fi public IP
  if (clientIP.startsWith("41.89.240.")) {
    console.log("Access GRANTED - School Wi-Fi (public)");
    return next();
  }

  // Allow any local network
  if (clientIP.startsWith("192.168.")) {
    console.log("Access GRANTED - Local network");
    return next();
  }

  console.log("Access DENIED - Not school network:", clientIP);
  return res.status(403).json({
    message: "Login allowed only on school Wi-Fi"
  });
};

module.exports = restrictNetwork;
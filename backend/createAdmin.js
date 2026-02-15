const bcrypt = require("bcryptjs");
const db = require("./config/db");

async function createAdmin() {
  const email = "admin@company.com";
  const password = await bcrypt.hash("admin123", 10);

  db.query(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    ["System Admin", email, password, "ADMIN"],
    (err, result) => {
      if(err) return console.error("Insert error:", err);
      console.log("Admin created successfully!");
      process.exit();
    }
  );
}

createAdmin();

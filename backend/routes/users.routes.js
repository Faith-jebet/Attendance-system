const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");
const userController = require("../controllers/user.controller");

// GET all users (ADMIN only)
router.get("/", auth, role("ADMIN"), userController.getAllUsers);

module.exports = router;

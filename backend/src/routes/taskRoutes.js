const router = require("express").Router();
const auth = require("../middleware/auth");
const {
  createTask,
  listTasks,
  getTask,
  runTask,
} = require("../controllers/taskController");

router.use(auth);

router.post("/", createTask);
router.get("/", listTasks);
router.get("/:id", getTask);
router.post("/:id/run", runTask);

module.exports = router;

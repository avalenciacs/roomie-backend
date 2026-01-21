require("dotenv").config();

const express = require("express");
const { connectDB } = require("./db");

const app = express();
app.use(express.json());

require("./config")(app);

// Ensure DB is connected for every request (serverless friendly)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (e) {
    next(e);
  }
});

// Routes
const indexRoutes = require("./routes/index.routes");
app.use("/api", indexRoutes);

const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);

const flatRoutes = require("./routes/flat.routes");
app.use("/api/flats", flatRoutes);

const expenseRoutes = require("./routes/expense.routes");
app.use("/api", expenseRoutes);

const balanceRoutes = require("./routes/balance.routes");
app.use("/api", balanceRoutes);

const taskRoutes = require("./routes/task.routes");
app.use("/api", taskRoutes);

const dashboardRoutes = require("./routes/dashboard.routes");
app.use("/api", dashboardRoutes);

const invitationsRoutes = require("./routes/invitations.routes");
app.use("/api/invitations", invitationsRoutes);

app.use("/api", require("./routes/testEmail.routes"));

const uploadsRoutes = require("./routes/uploads.routes");
app.use("/api/uploads", uploadsRoutes);

require("./error-handling")(app);

module.exports = app;

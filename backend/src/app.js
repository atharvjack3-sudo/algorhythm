
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import './cron.js';

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import problemRoutes from "./routes/problem.route.js";
import submissionRoutes from "./routes/submission.route.js";
import listRoutes from "./routes/lists.route.js";
import discussionRoutes from "./routes/discussion.route.js";
import contestRoutes from "./routes/contests.route.js";
import blogRoutes from "./routes/blog.route.js";
import playgroundRoutes from "./routes/playground.route.js";

const app = express();




app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api", userRoutes);
app.use("/api", problemRoutes);
app.use("/api", submissionRoutes);
app.use("/api", listRoutes);
app.use("/api", discussionRoutes);
app.use("/api", contestRoutes);
app.use("/api", blogRoutes);
app.use("/api", playgroundRoutes);


export default app;

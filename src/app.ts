import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import meetingsRoutes from "./routes/meetings.routes";

const app: Express = express();

app.use(cors({
    origin: ["http://localhost:4200", "https://polyvideo-1ca6f.web.app/"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
}));

app.use(express.json({ type: "application/json" }));
app.use(cookieParser());

app.use("/auth", authRoutes);
app.use("/meetings", meetingsRoutes);

export default app;
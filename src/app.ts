import express, { Express, Request, Response } from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import { authMiddleware } from "./middlewares/auth.middleware";

const app: Express = express();
app.use(express.json());

app.use(cookieParser());

app.use("/auth", authRoutes);

app.get("/protected", authMiddleware, (request: Request, response: Response) => {
    response.json({ message: `Hello user ${request.body.user?.id}` })
});

export default app;
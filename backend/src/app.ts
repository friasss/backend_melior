import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import passport from "passport";
import { env } from "./config/env";
import { configurePassport } from "./config/passport";
import routes from "./routes";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();

// ─── Security ───
app.use(helmet());
const allowedOrigins = [
  env.CLIENT_URL,
  env.FRONTEND_URL,
  /\.vercel\.app$/,
  "http://localhost:5173",
  "http://localhost:5174",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = allowedOrigins.some((o) =>
        typeof o === "string" ? o === origin : o.test(origin)
      );
      callback(allowed ? null : new Error("Not allowed by CORS"), allowed);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Parsing ───
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Passport OAuth ───
configurePassport();
app.use(passport.initialize());

// ─── Logging ───
if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// ─── Health check ───
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Melior API is running",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───
app.use("/api", routes);

// ─── 404 ───
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Endpoint no encontrado" });
});

// ─── Global Error Handler ───
app.use(errorHandler);

export default app;

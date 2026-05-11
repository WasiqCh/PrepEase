import rateLimit from "express-rate-limit";

const isDev = process.env.NODE_ENV !== "production";

const apiLimiter = isDev
  ? (_req, _res, next) => next()
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        message: "Too many requests, please try again later.",
      },
    });

export default apiLimiter;

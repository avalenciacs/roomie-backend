// We reuse this import in order to have access to the `body` property in requests
const express = require("express");

// Responsible for the messages you see in the terminal as requests are coming in
// https://www.npmjs.com/package/morgan
const logger = require("morgan");

// Needed when we deal with cookies (we will when dealing with authentication)
// https://www.npmjs.com/package/cookie-parser
const cookieParser = require("cookie-parser");

// Needed to accept requests from 'the outside'. CORS stands for cross origin resource sharing
const cors = require("cors");

// Allowed origins (prod + dev)
const allowedOrigins = [
  process.env.ORIGIN,          // e.g. https://roomie-home.vercel.app
  process.env.CLIENT_URL,      // optional (same as ORIGIN)
  "http://localhost:5173"      // Vite dev
].filter(Boolean);

module.exports = (app) => {
  // Trust proxy (useful on Vercel / proxies)
  app.set("trust proxy", 1);

  // CORS
  app.use(
    cors({
      origin: (origin, cb) => {
        // Allow requests with no origin (Postman, server-to-server)
        if (!origin) return cb(null, true);

        if (allowedOrigins.includes(origin)) return cb(null, true);

        return cb(new Error(`CORS blocked: ${origin}`));
      },
      credentials: true,
    })
  );

  // In development environment the app logs
  app.use(logger("dev"));

  // To have access to `body` property in the request
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
};
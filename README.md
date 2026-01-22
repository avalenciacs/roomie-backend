

# Roomie – Backend

This repository contains the **backend API** for the Roomie application.

It provides authentication, flat management, expenses, tasks, balances and email invitations.

The backend is built with Node.js and Express, using MongoDB Atlas as the database and deployed on Vercel.

---

## 👤 Author

**Anderson Valencia Castaño**  
Web Development Student – Ironhack

---

## 🚀 Tech Stack

- Node.js
- Express.js
- MongoDB Atlas + Mongoose
- JWT Authentication
- Nodemailer (email invitations)
- Cloudinary (image uploads)
- Vercel (deployment)

---

## 📁 Project Structure
```
ROOMIE-BACKEND/
│
├── api/ # Vercel serverless entry (if used)
├── config/ # Environment & external services config
├── db/ # MongoDB connection
├── error-handling/ # Error middleware
├── middleware/ # Auth & role middleware
├── models/ # Mongoose schemas
├── routes/ # Express routes
├── utils/ # Helpers (mailer, tokens, etc.)
│
├── app.js # Express app configuration
├── server.js # Server entry point
└── vercel.json # Vercel config

```
---

## 🔐 Authentication

- JWT-based authentication
- Protected routes using middleware
- Token sent via `Authorization: Bearer <token>`

---

## 📬 Email Invitations

- Invitations are sent using **Nodemailer**
- Gmail SMTP with App Password
- Invitation links redirect to frontend `/invite/:token`

---

## 🌐 Environment Variables

Create a `.env` file:

```env
MONGODB_URI=your_mongodb_atlas_uri
TOKEN_SECRET=your_secret

CLIENT_URL=https://roomie-home.vercel.app
ORIGIN=https://roomie-home.vercel.app

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=roomie.flat@gmail.com
SMTP_PASS=your_app_password
MAIL_FROM=Roomie <roomie.flat@gmail.com>

INVITE_TTL_HOURS=48

CLOUDINARY_CLOUD_NAME=xxxx
CLOUDINARY_API_KEY=xxxx
CLOUDINARY_API_SECRET=xxxx
```
▶️ Run Locally
npm install
npm run dev
📌 API Features
User authentication (signup / login)

Flat CRUD operations

Member management

Expense tracking and splitting

Task management

Balance calculation

Email-based invitation system

🧪 Notes
Designed for clarity and maintainability

Optimized for serverless deployment on Vercel

Suitable for live demos (Ironhack presentations)

📄 License
This project was developed for educational purposes as part of the Ironhack Web Development Bootcamp.


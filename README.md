📦 Backend – Roomie API
🏠 Roomie Backend

Backend REST API for Roomie, a shared-flat management application where users can manage members, expenses, tasks, balances and invitations.

Built with Node.js, Express, and MongoDB Atlas, deployed on Vercel.

🚀 Features

JWT authentication (signup, login, verify)

Flats management (create, edit, delete)

Members & invitations by email

Shared expenses with balances

Tasks management (assign, progress, complete)

Email invitations (Nodemailer + Gmail SMTP)

File uploads with Cloudinary

Optimized aggregated endpoints

🧱 Tech Stack

Node.js

Express

MongoDB + Mongoose

JWT Authentication

Nodemailer

Cloudinary

Vercel

📁 Project Structure
backend/
│── app.js
│── db/
│   └── index.js
│── routes/
│   ├── auth.routes.js
│   ├── flat.routes.js
│   ├── expense.routes.js
│   ├── task.routes.js
│   ├── invitations.routes.js
│── controllers/
│── models/
│── middleware/
│── config/

🔐 Environment Variables

Create a .env file:

PORT=5005
ORIGIN=http://localhost:5173
CLIENT_URL=http://localhost:5173

MONGODB_URI=your_mongodb_atlas_uri
TOKEN_SECRET=your_jwt_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
MAIL_FROM=Roomie <your_email@gmail.com>

CLOUDINARY_CLOUD_NAME=xxxx
CLOUDINARY_API_KEY=xxxx
CLOUDINARY_API_SECRET=xxxx

▶️ Running Locally
npm install
npm run dev


Backend will run on:

http://localhost:5005

🌐 Deployment

Deployed on Vercel

MongoDB hosted on MongoDB Atlas

Environment variables configured in Vercel dashboard

🧠 Design Notes

MongoDB connection is reused to avoid cold-start overhead

Heavy queries optimized using countDocuments and aggregated endpoints

Secure routes protected with JWT middleware

📌 Author

Roomie – Ironhack Web Development Bootcamp
Backend project

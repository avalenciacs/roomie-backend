📱 ROOMIE – Frontend
# Roomie – Frontend

Roomie is a web application that helps people living in shared flats manage **members, expenses, tasks and balances** in a simple and visual way.

This repository contains the **frontend** of the Roomie project, built with React and deployed on Vercel.

🔗 Live demo: https://roomie-home.vercel.app

---

## 👤 Author

**Anderson Valencia Castaño**  
Web Development Student – Ironhack

---

## 🚀 Tech Stack

- React (Vite)
- React Router DOM
- Axios
- Tailwind CSS
- Context API
- Vercel (deployment)

---

## 📁 Project Structure


```
src/
│
├── api/ # Axios configuration
├── assets/ # Static assets
├── components/ # Reusable UI components
│ ├── ui/ # Base UI elements
│ ├── ExpenseForm.jsx
│ ├── TaskForm.jsx
│ ├── FlatDashboard.jsx
│ ├── FlatTopNav.jsx
│ ├── Header.jsx
│ ├── IsPrivate.jsx
│ └── ResponsiveLayout.jsx
│
├── constants/ # Categories, enums, helpers
├── context/ # Auth & Toast contexts
├── pages/ # Application pages
│
├── App.jsx
├── main.jsx
└── index.css

```
---

## 🔐 Authentication

- Token-based authentication (JWT)
- Tokens are stored in `localStorage`
- Protected routes handled with `IsPrivate`

---

## 🌐 Environment Variables

Create a `.env` file in the root:

```env
VITE_API_URL=https://your-backend-url.vercel.app

▶️ Run Locally
npm install
npm run dev

📌 Features

Flat management

Member invitations via email

Shared expenses with categories and receipts

Task assignment and tracking

Automatic balance calculation

Responsive mobile-first design

🧪 Notes

No code is shown in slides during presentations (demo-first approach).

Optimized for clarity and usability rather than feature overload.

📄 License

This project was created for educational purposes as part of the Ironhack Web Development Bootcamp.

# Profferio

**Profferio** is a full-stack user management system with role-based access and multi-project support.  
Admins can manage users via a modern dashboard, while each user is restricted to the project they are assigned to.

---

## 🔧 Tech Stack

- **Frontend:** React + Material UI
- **Backend:** Node.js + Express
- **Database:** MongoDB Atlas (Cloud)
- **Authentication:** JWT (token-based)
- **UI Components:** MUI DataGrid, Dialogs, Forms
- **Tools:** VS Code, GitHub, Postman

---

## ✨ Key Features

### 🔐 Authentication
- Login with `username` & `password`
- Token-based authentication with JWT
- Role-based redirection (admin → `/admin`, users → `/alterlife` or `/other`)

### 🛡️ Access Control
- `admin`: access to full admin dashboard
- `manager`, `user`: access only to their assigned project
- Unauthorized access redirects to login

### 🧑‍💼 Admin Dashboard
- View all users in a searchable table
- Create new users via modal form
- Edit: full name, username, email, password, role, project
- Delete users with confirmation popup
- Instant feedback with snackbars
- Logout button in top right corner

---

## 📁 Project Structure


👨‍💻 Author
Made with ❤️ by Akis Barliakos
Feel free to fork, use, and contribute.
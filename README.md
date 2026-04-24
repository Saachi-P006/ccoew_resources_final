# 🎓 CCOEW Resource Portal

A full-stack web application built for college students and teachers to share, discover, and manage academic resources — all in one place.

---

## 🌐 Live Screenshots

### 🏠 Home Page
![Home](screenshots/Screenshot%202026-04-24%20122718.png)

### 📚 Learn — Department & Subject Browser
![Learn](screenshots/Screenshot%202026-04-24%20123106.png)

### 📂 Subject Resources (PYQ / Notes / Tutorials)
![Subject](screenshots/Screenshot%202026-04-24%20123202.png)

### 🎯 Opportunities Section (Card Flip)
![Opportunities](screenshots/Screenshot%202026-04-24%20123230.png)

### 🔗 Quick Links
![Quick Links](screenshots/Screenshot%202026-04-24%20123302.png)

### 🗺️ Roadmaps Scrapbook
![Roadmaps](screenshots/Screenshot%202026-04-24%20123330.png)

### 🎥 Top Learning Resources
![Learning Resources](screenshots/Screenshot%202026-04-24%20123508.png)

### 👨‍🏫 Teacher Dashboard
![Teacher](screenshots/Screenshot%202026-04-24%20123601.png)

### 🛡️ Admin Panel
![Admin](screenshots/Screenshot%202026-04-24%20123814.png)

---

## ✨ Features

### 👩‍🎓 For Students
- Browse resources by **Department → Year → Semester → Subject**
- Access **PYQs, Notes, and Tutorials** for each subject
- Submit resources (YouTube links, PDFs, PPTs, images) for admin approval
- Submit YouTube playlists — ranked by number of clicks
- Explore **Opportunities** per year with an interactive card flip effect
- Access **Quick Links** for learning platforms, college tools & utilities
- Browse **Roadmaps** for different tech domains and languages
- View **Top Learning Resources** curated by teachers and students

### 👨‍🏫 For Teachers
- Secure login with bcrypt-hashed passwords
- Upload resources (PDF, PPTX, DOCX, JPG, PNG, YouTube links) per department/year/subject
- Add YouTube playlists directly — visible immediately without approval
- Manage and delete their own uploaded resources

### 🛡️ For Admins
- Approve or reject student-submitted resources and playlists
- Add and remove teacher accounts with credentials
- Full control over what appears on the platform

### 📬 Contact & Reviews
- Contact form connected to **Google Sheets API**
- Student testimonials/reviews section

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js |
| Backend | Flask (Python) |
| Database | MySQL |
| File Storage | Cloudinary |
| Auth | bcrypt password hashing |
| Form Submission | Google Sheets API |
| Styling | CSS / Custom Components |

---

## 🗂️ Project Structure

```
collegeres-backend/
├── backend/
│   ├── app.py            # Flask API with all routes
│   ├── database.py       # DB connection setup
│   ├── models/           # DB models
│   ├── requirements.txt
│   └── .env              # Environment variables (not committed)
├── frontend/
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── pages/        # Page-level components
│       └── assets/       # Images, GIFs
├── screenshots/          # Project screenshots
└── schema.sql            # Database schema
```

---

## 🚀 Running Locally

### Prerequisites
- Python 3.x
- Node.js
- MySQL running locally
- Cloudinary account

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:
```
DB_HOST=localhost
DB_USER=root
DB_PASS=yourpassword
DB_NAME=college_resources
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=yourpassword
```

```bash
python app.py
```
Backend runs on: `http://localhost:5000`

### Frontend Setup
```bash
cd frontend
npm install
npm start
```
Frontend runs on: `http://localhost:3000`

### Database Setup
Import the schema into your MySQL instance:
```bash
mysql -u root -p college_resources < schema.sql
```

---

## 📌 Key Highlights

- **Role-based access** — Student, Teacher, and Admin flows with different permissions
- **Approval workflow** — Student submissions go through admin review before publishing
- **Click-based ranking** — Most-clicked student playlist links bubble up automatically
- **Cloudinary integration** — File uploads (PDF, PPTX, DOCX, images) stored on cloud
- **Google Sheets API** — Contact form submissions saved to a live spreadsheet

---

## 👩‍💻 Developer

**Saachi** — CCOEW  
[GitHub](https://github.com/Saachi-P006)

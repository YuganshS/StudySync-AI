<div align="center">

# ⚡ StudySync AI
### *Next-Generation Intelligent Collaborative Learning & Academic Management Platform*

[![Next.js](https://img.shields.io/badge/Next.js-14.2.35-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.17-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare_AI-Workers_AI-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://ai.cloudflare.com/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media_Cloud-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)

<br />

<p align="center">
  <a href="#-key-features"><b>Explore Features</b></a> •
  <a href="#-architecture--tech-stack"><b>Architecture</b></a> •
  <a href="#-quick-start"><b>Quick Start</b></a> •
  <a href="#-api-reference"><b>API Matrix</b></a> •
  <a href="#-project-structure"><b>Structure</b></a>
</p>

</div>

---

## 🌟 Overview

**StudySync AI** is a comprehensive full-stack educational portal designed to bridge the gap between educators and students through modern AI, real-time materials ingestion, vector RAG search, and automated announcement dispatch.

> Built and maintained by **Yugansh**.

```
  ┌──────────────────────────────────────────────────────────────────────────┐
  │                         STUDYSYNC AI ECOSYSTEM                           │
  └──────────────────────────────────┬───────────────────────────────────────┘
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
 ╔═══════════════════════════╗               ╔═══════════════════════════╗
 ║      TEACHER PORTAL       ║               ║      STUDENT PORTAL       ║
 ╠═══════════════════════════╣               ╠═══════════════════════════╣
 ║  • Live Analytics         ║               ║  • AI Assistant / Chatbot ║
 ║  • Material Management    ║               ║  • Real-time Q&A via RAG  ║
 ║  • Multi-file Ingestion   ║               ║  • Smart Study Notes      ║
 ║  • Notice Broadcasts      ║               ║  • Direct File Downloads  ║
 ║  • Select & Batch Delete  ║               ║  • Interactive Study Hub  ║
 ╚═══════════════════════════╝               ╚═══════════════════════════╝
         │                                                       │
         └───────────────────────────┬───────────────────────────┘
                                     ▼
 ╔═══════════════════════════════════════════════════════════════════════╗
 ║                     BACKEND & AI ENGINE                               ║
 ╠═══════════════════════════════════════════════════════════════════════╣
 ║  • Cloudflare Workers AI  • ChromaDB Vector Store  • MongoDB Atlas   ║
 ║  • Cloudinary CDN Storage • PDF Parser & Ingest   • Webhook Triggers ║
 ╚═══════════════════════════════════════════════════════════════════════╝
```

---

## 🚀 Key Features

### 👨‍🏫 Teacher Portal
* **📊 Real-time Dashboard**: Overview of uploaded materials, total storage, active notices, and engagement metrics.
* **📂 Material Management**: Search, filter by subject & category, and view downloads/impressions.
* **🗑️ Batch & Single Deletion**: Interactive multi-select checkboxes with immediate live UI updates and bulk removal.
* **📤 Multi-Type Content Uploader**: Drag & drop support for PDFs, images (PNG, JPG, WebP), and rich text announcements.
* **📢 Broadcast Notices**: Create, edit, draft, publish, and dispatch announcements with automated webhook triggers.
* **⚙️ Profile & Preferences**: Configurable educator profile and notification alert preferences.

### 🎓 Student Portal & AI Chatbot
* **🤖 Intelligent RAG Chatbot**: Powered by Cloudflare Workers AI with context-aware semantic retrieval.
* **⚡ Vectorized Study Search**: Ask questions against teacher-uploaded documents and syllabi.
* **🎯 Real-Time Streaming & Clean Markdown Formatting**: High readability with responsive mobile layout.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies | Description |
|---|---|---|
| **Frontend** | `Next.js 14 (App Router)`, `React 18`, `TypeScript`, `TailwindCSS` | High-performance, SSR & Client hybrid user interface |
| **Styling & UI** | `Lucide Icons`, `Radix UI`, `Tailwind CSS`, `Framer Motion` | Modern, responsive, accessible component library |
| **Authentication** | `NextAuth.js (v4)`, `bcryptjs` | Secure session & credential-based authentication |
| **Backend API** | `Node.js`, `Express.js`, `Multer` | Microservice architecture for document ingestion & endpoints |
| **Database** | `MongoDB Atlas`, `Mongoose` | Scalable NoSQL persistence for users, notices, and documents |
| **AI & Vector** | `Cloudflare Workers AI`, `ChromaDB`, `pdf-extraction` | Embeddings, vector storage, and neural RAG generation |
| **Media Storage** | `Cloudinary CDN` | Fast, optimized global asset delivery |

---

## ⚡ Quick Start

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd study-sync
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory and in `/backend`:

```env
# Database
MONGODB_URI="your_mongodb_connection_string"
DB_NAME="StudySyncDB"
MONGODB_DB="StudySyncDB"

# Cloudflare AI
CLOUDFLARE_ACCOUNT_ID="your_cloudflare_account_id"
CLOUDFLARE_API_TOKEN="your_cloudflare_api_token"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_secure_secret"
NEXT_PUBLIC_BACKEND_URL="http://localhost:3001"
```

### 3. Install Dependencies
```bash
# Frontend
npm install

# Backend
cd backend && npm install && cd ..
```

### 4. Run Development Servers
```bash
# Terminal 1: Backend Server (Port 3001)
cd backend
npm start

# Terminal 2: Frontend App (Port 3000)
npm run dev
```

Visit **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📡 API Reference

<details>
<summary><b>View Complete Backend API Endpoints</b></summary>

<br />

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/materials` | Retrieve all uploaded materials |
| `GET` | `/materials/:id/file` | Download material file buffer |
| `DELETE` | `/materials/:id` | Delete a single material |
| `DELETE` | `/materials` | Batch delete materials (`{ ids: string[] }`) |
| `GET` | `/notices` | List notices & announcements |
| `POST` | `/notices` | Create a new notice |
| `PUT` | `/notices/:id` | Update or publish a notice |
| `DELETE` | `/notices/:id` | Delete a notice |
| `POST` | `/upload-file` | Upload & ingest study document |
| `POST` | `/chatbot` | Query the RAG AI chatbot |

</details>

---

## 📂 Project Structure

```
study-sync/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── chatbot/        # AI RAG endpoint
│   │   │   ├── ingest/         # Vector embedding ingestion
│   │   │   ├── materials/      # Material CRUD & batch delete
│   │   │   ├── notices/        # Announcements dispatch
│   │   │   └── upload-file/    # Cloudinary & MongoDB uploader
│   │   └── lib/                # Database clients
│   └── server.js               # Express API microservice
│
├── src/
│   ├── app/
│   │   ├── api/auth/           # NextAuth credentials authentication
│   │   ├── api/signup/         # User registration endpoint
│   │   ├── login/              # Login interface
│   │   ├── signup/             # Signup interface
│   │   ├── student/            # Student AI assistant page
│   │   └── teacher/            # Teacher admin dashboard
│   ├── components/
│   │   ├── auth/               # Auth UI wrappers
│   │   ├── student/            # Student chatbot component
│   │   ├── teacher/            # Dashboard, Upload, Materials, Notices, Settings
│   │   └── ui/                 # Reusable UI primitives
│   ├── lib/                    # Shared dbConnect & utility functions
│   └── models/                 # Mongoose schemas
│
└── public/
    └── assets/images/          # Logos & static assets
```

---

<div align="center">

Made with ❤️ by **Yugansh** for modern education • **StudySync AI**

</div>

# Future Blink – MERN AI Wrapper Application

Future Blink is a full-stack **MERN application** built as an assignment project.  
The application acts as a wrapper around an AI model using **OpenRouter** with the  
`google/gemini-2.0-flash-exp:free` model.

The project is structured with:
- **Frontend**: React (Vite)
- **Backend**: Node.js + Express
- **Database**: MongoDB

---

## 🔗 Live Deployments

- **Frontend (Vercel)**  
  👉 https://future-blink-phi.vercel.app/

- **Backend (Render)**  
  👉 https://future-blink-0mu1.onrender.com/

---

## 📁 Project Structure

```
root/
│
├── backend/        # Node.js + Express API
└── frontend/       # React (Vite) application
```

---

## ⚙️ Environment Variables

### Frontend (`frontend/.env`)
```env
VITE_BACKEND_URL=<backend_base_url>
```

Example:
```env
VITE_BACKEND_URL=https://future-blink-0mu1.onrender.com
```

---

### Backend (`backend/.env`)
```env
PORT=5000
OPENROUTER_API_KEY=your_openrouter_api_key
MONGODB_URI=your_mongodb_connection_string
```

---

## 🚀 Local Development Setup

### 1️⃣ Clone the Repository
```bash
git clone <your-repo-url>
cd <your-repo-name>
```

---

### 2️⃣ Backend Setup
```bash
cd backend
npm install
nodemon
```

---

### 3️⃣ Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🤖 AI Model Used

- **Provider**: OpenRouter  
- **Model**: `google/gemini-2.0-flash-exp:free`

---

## ⚠️ Important Notes

### Free AI Model Limitations
- This project uses a **free-tier AI model**
- Rate-limit errors may occur during AI requests
- These are **expected** and **not bugs**

### Render Free Tier Cold Start
- Backend runs on **Render free tier**
- First request may take up to **~50 seconds**
- This happens when the instance wakes from sleep

---

## 🛠 Tech Stack

- React, Vite
- Node.js, Express
- MongoDB
- OpenRouter
- Vercel (Frontend)
- Render (Backend)

---

## 👤 Author

**Sarthak Tiwari**

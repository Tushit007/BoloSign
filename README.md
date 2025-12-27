
# Signature Injection Engine

A full-stack prototype that allows users to place a signature on a responsive PDF viewer and deterministically burn it into the final PDF at the exact same position.

Built as part of a **Full-Stack (MERN) assignment**.

---

## 🚀 Features

### Frontend
- PDF rendering using `react-pdf`
- Drag & resize signature box
- Responsive placement using normalized coordinates
- Aspect-ratio safe signature image preview
- Works across screen sizes (desktop / mobile)

### Backend
- Node.js + Express burn-in engine
- Signature image embedded using `pdf-lib`
- Accurate browser → PDF coordinate conversion
- Aspect-ratio safe image placement
- SHA-256 audit trail (before & after signing)
- Returns signed PDF URL

---

## 🧠 Core Concept

Browsers and PDFs use different coordinate systems:

| System | Origin |
|------|------|
| Browser | Top-left |
| PDF | Bottom-left |

The frontend stores **normalized coordinates (percentages)** relative to the rendered PDF.

The backend:
1. Converts percentages into **PDF points**
2. Inverts the Y-axis
3. Embeds the image deterministically

This guarantees that the final signed PDF matches the on-screen placement exactly.

---

## 🖥️ Tech Stack

- **Frontend:** React, react-pdf
- **Backend:** Node.js, Express
- **PDF Processing:** pdf-lib
- **Deployment:** Vercel (frontend), Render (backend)

---

## 📂 Project Structure

```

signature-injection-engine/
├── client/            # React frontend
│   ├── public/
│   └── src/
│       ├── App.js
│       ├── pdfWorker.js
│       └── index.js
└── server/            # Express backend
├── index.js
└── signed/        # Generated signed PDFs

````

---

## ▶️ Running Locally

### Frontend
```bash
cd client
npm install
npm start
````

Runs at:
`http://localhost:3000`

---

### Backend

```bash
cd server
npm install
node index.js
```

Runs at:
`http://localhost:5000`

---

## 🔌 API Reference

### POST `/sign-pdf`

**Request Body**

```json
{
  "box": {
    "xPct": 0.3,
    "yPct": 0.4,
    "wPct": 0.18,
    "hPct": 0.07
  },
  "signatureImg": "data:image/png;base64,..."
}
```

**Response**

```json
{
  "success": true,
  "url": "/signed/signed-1766833457608.pdf"
}
```

---

## 🔐 Audit Trail

Before and after signing:

* The PDF is hashed using **SHA-256**
* Ensures document integrity
* Confirms that only the intended signature modification occurred

---

## 📌 Design Decisions

* Normalized coordinates ensure responsiveness
* Server-side signing guarantees deterministic output
* Aspect-ratio safe scaling prevents distortion
* Stateless backend simplifies deployment and scaling

---

## 📦 Deployment

* **Frontend:** Vercel
* **Backend:** Render
* Signed PDFs are served dynamically by the backend

---

## 🏁 Status

✔ Feature complete
✔ Backend & frontend deployed
✔ Assignment requirements satisfied

---

## 👤 Author

**Tushit Chakraborty**
Full-Stack (MERN) Assignment — 2025



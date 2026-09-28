import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

const upload = multer({ dest: "uploads/" });

// Demo database (replace with PostgreSQL)
let users = [];
let mailAccounts = [];
let files = [];
let emails = [
  {
    id: 1,
    from: "alex@example.com",
    subject: "Landing Page",
    body: "Review the HTML project."
  },
  {
    id: 2,
    from: "github@github.com",
    subject: "Pull Request",
    body: "WaterCloud PR merged."
  }
];

// ---------- USERS ----------

app.post("/api/signup", (req, res) => {
  const { email, password } = req.body;

  if (users.find(u => u.email === email))
    return res.status(400).json({ error: "User exists" });

  users.push({
    id: Date.now(),
    email,
    password,
    storage: 0
  });

  res.json({ success: true });
});

// ---------- CONNECT EMAIL ----------

app.post("/api/connect-email", (req, res) => {
  const { userEmail, provider, email } = req.body;

  mailAccounts.push({
    userEmail,
    provider,
    email
  });

  res.json({
    success: true,
    provider,
    email
  });
});

// ---------- GET EMAILS ----------

app.get("/api/emails/:user", (req, res) => {
  const account = mailAccounts.find(
    m => m.userEmail === req.params.user
  );

  if (!account)
    return res.json({
      connected: false,
      emails: []
    });

  res.json({
    connected: true,
    account,
    emails
  });
});

// ---------- FILES ----------

app.post("/api/upload", upload.single("file"), (req, res) => {
  const sizeGB = req.file.size / 1024 / 1024 / 1024;

  files.push({
    id: Date.now(),
    name: req.file.originalname,
    filename: req.file.filename,
    size: req.file.size
  });

  res.json({
    success: true,
    file: files[files.length - 1]
  });
});

app.get("/api/files", (req, res) => {
  res.json(files);
});

app.get("/api/download/:id", (req, res) => {
  const file = files.find(f => f.id == req.params.id);

  if (!file) return res.sendStatus(404);

  res.download(
    path.join("uploads", file.filename),
    file.name
  );
});

app.delete("/api/files/:id", (req, res) => {
  const index = files.findIndex(f => f.id == req.params.id);

  if (index === -1) return res.sendStatus(404);

  fs.unlinkSync(path.join("uploads", files[index].filename));

  files.splice(index, 1);

  res.json({ success: true });
});

// ---------- STORAGE ----------

app.get("/api/storage", (req, res) => {
  const used = files.reduce((a, b) => a + b.size, 0);

  const max = 2 * 1024 * 1024 * 1024 * 1024; // 2 TB

  res.json({
    used,
    max,
    syncPaused: used >= max * 0.95
  });
});

app.listen(PORT, () => {
  console.log(`WaterCloud API running on http://localhost:${PORT}`);
});

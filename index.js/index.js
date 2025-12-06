// server/index.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // accept base64 attachment

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const FEEDBACK_FILE = path.join(DATA_DIR, 'feedbacks.json');

function readFeedbacks() {
  try {
    const raw = fs.existsSync(FEEDBACK_FILE) ? fs.readFileSync(FEEDBACK_FILE) : '[]';
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function writeFeedbacks(arr) {
  fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(arr, null, 2));
}

app.post('/api/feedback', (req, res) => {
  const payload = req.body;
  const arr = readFeedbacks();
  arr.unshift(payload);
  writeFeedbacks(arr);
  res.json({ ok: true });
});

app.get('/api/feedback', (req, res) => {
  res.json(readFeedbacks());
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Feedback server listening on ${PORT}`);
});
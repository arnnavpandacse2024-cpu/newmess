const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 8080;
const DATA_FILE = path.join(__dirname, "submissions.json");

app.use(express.json());
app.use(express.static(path.join(__dirname)));

function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (e) {
    return [];
  }
}
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

app.get("/api/list", (req, res) => {
  const records = readData();
  records.sort((a,b)=>a.roll.localeCompare(b.roll,undefined,{numeric:true,sensitivity:'base'}));
  res.json({ success:true, records });
});

app.post("/api/submit", (req, res) => {
  const payload = req.body;
  if (!payload?.roll || !payload?.name) {
    return res.status(400).json({ success:false, message:"Missing required fields." });
  }
  const records = readData();
  if (records.some(r => r.roll.toLowerCase() === payload.roll.toLowerCase())) {
    return res.status(400).json({ success:false, message:"Roll number already exists." });
  }
  records.push(payload);
  writeData(records);
  return res.json({ success:true, message:"Saved", record:payload });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
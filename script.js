const pages = ["page1","page2","page3","page4"];
const allowedDays = ["Tuesday","Wednesday","Thursday","Friday","Sunday"];
const dayTimeMap = {
  Tuesday:["Night"],
  Wednesday:["Night"],
  Thursday:["Night"],
  Friday:["Night"],
  Sunday:["Day","Night"]
};
const menuByDayTime = {
  "Tuesday|Night": { veg:["Baby Corn Chilli","Aloo Gobi Masala"], nonveg:["Egg Curry"] },
  "Wednesday|Night": { veg:["Paneer Curry"], nonveg:["Chicken Curry","Chicken Chilli"] },
  "Friday|Night": { veg:["Paneer Masala"], nonveg:["Fish Curry","Fish Fry"] },
  "Sunday|Day": { veg:["Mushroom Curry"], nonveg:["Egg Curry"] },
  "Sunday|Night": { veg:["Paneer Do Pyaza"], nonveg:["Chicken Butter Masala"] }
};

let studentData = {};

const studentForm = document.getElementById("studentForm");
const dayForm = document.getElementById("dayForm");
const menuForm = document.getElementById("menuForm");
const error1 = document.getElementById("error1");
const error2 = document.getElementById("error2");
const error3 = document.getElementById("error3");

const daySelect = document.getElementById("day");
const timeSelect = document.getElementById("time");
const foodType = document.getElementById("foodType");
const menuItem = document.getElementById("menuItem");
const selectedDay = document.getElementById("selectedDay");
const selectedTime = document.getElementById("selectedTime");

const steps = ["step1dot","step2dot","step3dot","step4dot"].map(id=>document.getElementById(id));

function setActive(pageId) {
  pages.forEach(p=>document.getElementById(p).classList.remove("active"));
  document.getElementById(pageId).classList.add("active");
  const idx = pages.indexOf(pageId);
  steps.forEach((s,i)=> s.classList.toggle("active", i<=idx));
}

function showError(el, msg) { el.textContent = msg; if(msg) setTimeout(()=>{el.textContent = "";}, 4000); }

async function fetchRecordsFromBackend(){
  try {
    const r = await fetch('/api/list');
    if(!r.ok) throw new Error('No backend');
    const j = await r.json();
    return j.records || [];
  } catch(e){
    const raw = localStorage.getItem("nist_mess_records");
    return raw ? JSON.parse(raw) : [];
  }
}

async function isRollUsed(roll){
  const records = await fetchRecordsFromBackend();
  return records.some(r => r.roll.toLowerCase() === roll.toLowerCase());
}

async function saveStudent(record){
  try {
    const r = await fetch('/api/submit', {
      method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(record)
    });
    const j = await r.json();
    if(j.success) return;
  } catch(e){ }
  const records = await fetchRecordsFromBackend();
  records.push(record);
  records.sort((a,b)=>a.roll.localeCompare(b.roll, undefined, {numeric:true, sensitivity:'base'}));
  localStorage.setItem("nist_mess_records", JSON.stringify(records));
}

async function getSavedRecords(){
  return await fetchRecordsFromBackend();
}

function updateDayTime() {
  const now = new Date();
  const today = now.toLocaleDateString(undefined,{weekday:'long'});
  document.getElementById("todayDate").textContent = now.toLocaleDateString();
  document.getElementById("todayDay").textContent = today;

  daySelect.innerHTML = "";
  const hint = document.getElementById("dayHint");
  if(allowedDays.includes(today)) {
    const opt = document.createElement("option");
    opt.value = today;
    opt.textContent = `${today} (today)`;
    opt.selected = true;
    daySelect.append(opt);
    daySelect.disabled = true;
    hint.textContent = "Booking is allowed for today only. Choose the available time slot.";
    updateTimeForDay(today);
  } else {
    daySelect.disabled = true;
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = `No booking available today (${today}).`;
    daySelect.append(opt);
    timeSelect.innerHTML = "<option value=''>No time slot available</option>";
    hint.textContent = `Today is ${today}. Only Tuesday, Wednesday, Thursday, Friday, Sunday are allowed.`;
  }
}

function updateTimeForDay(day){
  timeSelect.innerHTML = "";
  if(!day){ timeSelect.innerHTML = "<option value=''>Choose day first</option>"; return; }
  const slots = dayTimeMap[day] || [];
  if(slots.length===0){ timeSelect.innerHTML = "<option value=''>No slots available</option>"; return; }
  timeSelect.innerHTML = "<option value=''>Select time</option>";
  slots.forEach(t => { const opt = document.createElement("option"); opt.value=t; opt.textContent=t; timeSelect.append(opt); });
}

function fillMenuOptions(){
  const day = studentData.day; const time = studentData.time;
  const key = `${day}|${time}`;
  const choices = menuByDayTime[key];
  if(!choices){ menuItem.innerHTML = "<option value=''>No menu found</option>"; return; }
  selectedDay.value = day; selectedTime.value = time;
  menuItem.innerHTML = "<option value=''>Choose menu item</option>";
  if(foodType.value === "veg") choices.veg.forEach(i => { const opt=document.createElement("option"); opt.value=i; opt.textContent=i; menuItem.append(opt);} );
  if(foodType.value === "nonveg") choices.nonveg.forEach(i => { const opt=document.createElement("option"); opt.value=i; opt.textContent=i; menuItem.append(opt);} );
}

function generateTokenId(){
  const rand = Math.floor(Math.random()*9000)+1000;
  const now = Date.now().toString().slice(-5);
  return `NIST-${now}-${rand}`;
}

function renderToken() {
  const tokenDate = new Date().toLocaleString();
  document.getElementById("tokenName").textContent = studentData.name;
  document.getElementById("tokenRoll").textContent = studentData.roll;
  document.getElementById("tokenMobile").textContent = studentData.mobile;
  document.getElementById("tokenHostel").textContent = studentData.hostel;
  document.getElementById("tokenRoom").textContent = studentData.room;
  document.getElementById("tokenDay").textContent = studentData.day;
  document.getElementById("tokenTime").textContent = studentData.time;
  document.getElementById("tokenFood").textContent = studentData.menuItem;
  document.getElementById("tokenId").textContent = generateTokenId();
  document.getElementById("tokenDate").textContent = tokenDate;
}

async function showMessList() {
  const records = await getSavedRecords();
  const tbody = document.querySelector("#messTable tbody");
  tbody.innerHTML = "";
  if(records.length===0){ tbody.innerHTML = '<tr><td colspan="8" style="text-align:center">No submissions yet</td></tr>'; return; }
  records.forEach(r=>{
    const tr=document.createElement("tr");
    tr.innerHTML = `<td>${r.roll}</td><td>${r.name}</td><td>${r.hostel}</td><td>${r.room}</td><td>${r.mobile}</td><td>${r.day}</td><td>${r.time}</td><td>${r.menuItem}</td>`;
    tbody.append(tr);
  });
 }

studentForm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const name = studentForm.name.value.trim();
  const roll = studentForm.roll.value.trim();
  const room = studentForm.room.value.trim();
  const hostel = studentForm.hostel.value;
  const mobile = studentForm.mobile.value.trim();
  if(!name||!roll||!room||!hostel||!mobile){ showError(error1, "Please complete all required fields."); return; }
  if(!/^\d{10}$/.test(mobile)){ showError(error1, "Enter a 10-digit mobile number."); return; }
  if(await isRollUsed(roll)){ showError(error1, "This roll number has already booked a token."); return; }
  studentData = { name, roll, room, hostel, mobile };
  setActive("page2");
});

daySelect.addEventListener("change", ()=>{ updateTimeForDay(daySelect.value); });

dayForm.addEventListener("submit", (e)=>{
  e.preventDefault();
  const day = daySelect.value;
  const time = timeSelect.value;
  if(!day || !time){ showError(error2, "Please select day and time slot."); return; }
  studentData.day = day;
  studentData.time = time;
  foodType.value = "";
  menuItem.innerHTML = "<option value=''>Choose food type first</option>";
  setActive("page3");
});

foodType.addEventListener("change", fillMenuOptions);

menuForm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const type=foodType.value;
  const item=menuItem.value;
  if(!type||!item){ showError(error3, "Choose food type and menu item."); return; }
  studentData.foodType = type;
  studentData.menuItem = item;
  const record = { ...studentData };
  await saveStudent(record);
  renderToken();
  setActive("page4");
});

document.getElementById("backTo1").addEventListener("click", ()=> setActive("page1"));
document.getElementById("backTo2").addEventListener("click", ()=> setActive("page2"));

document.getElementById("printToken").addEventListener("click", ()=> window.print());
document.getElementById("downloadToken").addEventListener("click", ()=>{
  const div = document.getElementById("tokenCard");
  const html = `<html><head><title>Mess Token</title><style>body{font-family:Arial;}</style></head><body>${div.outerHTML}</body></html>`;
  const blob = new Blob([html],{type:'text/html'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${studentData.roll || 'token'}-mess-token.html`;
  a.click();
  URL.revokeObjectURL(a.href);
});

const ADMIN_PASSWORD = "nist2026";
document.getElementById("showList").addEventListener("click", async ()=>{
  const pass = window.prompt("Enter admin password to view mess list:");
  if(pass !== ADMIN_PASSWORD){ showError(error3, "Invalid admin password."); return; }
  await showMessList();
  document.getElementById("page4").classList.remove("active");
  document.getElementById("page5").classList.add("active");
});

document.getElementById("adminPrint").addEventListener("click", ()=>{ window.print(); });

document.getElementById("backToStart").addEventListener("click", ()=>{ document.getElementById("page5").classList.remove("active"); setActive("page1"); studentForm.reset(); dayForm.reset(); menuForm.reset(); updateDayTime(); });

document.getElementById("closeTable").addEventListener("click", ()=>{ setActive("page4"); document.getElementById("page5").classList.remove("active"); });

window.addEventListener("DOMContentLoaded", ()=> {
  setActive("page1");
  updateDayTime();
});
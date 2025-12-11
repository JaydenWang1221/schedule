let registered = {};
let probabilities = {}; // legacy, unused but kept for safety
let qrScanner = null;
let selectedCollege = null;

// per-time-slot simulation data
// structure: hour -> { groups, probability, jitter, spaces }
let slotData = {};

/* INITIAL LOAD */
window.onload = () => {
    // Show college selection first
    document.getElementById("collegePage").style.display = "block";
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("menuPage").style.display = "none";
    document.getElementById("timeTablePage").style.display = "none";
};

/* COLLEGE SELECTION */
function confirmCollege() {
    const select = document.getElementById("collegeSelect");
    const value = select.value;

    if (!value) {
        alert("請先選擇學校");
        return;
    }

    selectedCollege = value;

    const loginTitle = document.getElementById("loginTitle");
    loginTitle.textContent = `Login – ${selectedCollege}`;

    document.getElementById("collegePage").style.display = "none";
    document.getElementById("loginPage").style.display = "block";
}

/* BACK BUTTONS */
function backToCollege() {
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("collegePage").style.display = "block";
}

function backToLogin() {
    document.getElementById("menuPage").style.display = "none";
    document.getElementById("loginPage").style.display = "block";
}

function backToMenu() {
    document.getElementById("timeTablePage").style.display = "none";
    document.getElementById("menuPage").style.display = "block";
}

/* LOGIN */
function enterSystem() {
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("menuPage").style.display = "block";
}

/* LOGOUT */
function logout() {
    document.getElementById("menuPage").style.display = "none";
    document.getElementById("timeTablePage").style.display = "none";

    // back to first page
    document.getElementById("collegePage").style.display = "block";
    document.getElementById("loginPage").style.display = "none";
}

/* COLOR SCHEME FOR % */
function percentColor(p) {
    // 0–19: red, 20–49: orange, 50–79: yellow, 80–100: green
    if (p >= 80) {
        return "rgb(102, 255, 178)";      // mint green
    } else if (p >= 50) {
        return "rgb(255, 241, 150)";      // soft yellow
    } else if (p >= 20) {
        return "rgb(255, 190, 120)";      // warm orange
    } else {
        return "rgb(255, 120, 120)";      // red
    }
}

/* HELPER: random integer in [min, max] */
function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* Generate or reuse slot data */
function getSlotData(hour) {
    if (slotData[hour]) return slotData[hour];

    const spaces = 6;
    let groups;

    if (hour >= 18 && hour <= 20) {
        // Peak hours ~18:00-20:00 -> heavy usage
        groups = randInt(14, 16);
    } else if (hour >= 17 && hour <= 22) {
        // Semi-busy
        groups = randInt(6, 12);
    } else {
        // Off-peak
        groups = randInt(2, 8);
    }

    // jitter factor to keep "style" per slot
    const jitter = 0.9 + Math.random() * 0.2; // 0.9–1.1

    const data = {
        groups: groups,
        probability: 0,
        jitter: jitter,
        spaces: spaces
    };

    recalcProbability(data);
    slotData[hour] = data;
    return data;
}

/* Recalculate probability for a given data object */
function recalcProbability(data) {
    // Hard rule: if groups <= spaces, 100% chance
    if (data.groups <= data.spaces) {
        data.probability = 100;
        return;
    }

    let baseProb = data.spaces / data.groups; // < 1
    if (baseProb < 0) baseProb = 0;

    let finalProb = baseProb * data.jitter;   // apply jitter only when crowded
    if (finalProb > 1) finalProb = 1;
    if (finalProb < 0) finalProb = 0;

    data.probability = Math.round(finalProb * 100);
}

/* OPEN TIMETABLE */
function goToTimeTable(sport) {
    document.getElementById("menuPage").style.display = "none";
    document.getElementById("timeTablePage").style.display = "block";
    document.getElementById("sportTitle").textContent = sport + " Time Table";

    const box = document.getElementById("tableContainer");
    box.innerHTML = "";

    // Header row
    const header = document.createElement("div");
    header.className = "time-header";

    const hTime = document.createElement("div");
    hTime.textContent = "Time";

    const hProb = document.createElement("div");
    hProb.textContent = "Possibility";

    const hGroup = document.createElement("div");
    hGroup.textContent = "Group";

    header.appendChild(hTime);
    header.appendChild(hProb);
    header.appendChild(hGroup);
    box.appendChild(header);

    // Time rows
    for (let t = 5; t <= 23; t++) {
        const data = getSlotData(t);
        const groups = data.groups;
        const val = data.probability;

        const row = document.createElement("div");
        row.className = "time-row";
        row.dataset.time = t;

        if (registered[t]) row.classList.add("registered");

        row.onclick = () => openPopup(t);

        // Time
        const timeLabel = document.createElement("div");
        timeLabel.textContent = t + ":00";

        // Probability
        const percentDiv = document.createElement("div");
        percentDiv.textContent = val + "%";
        percentDiv.style.color = percentColor(val);
        percentDiv.style.fontWeight = "bold";

        // Group number blob on the right
        const groupsDiv = document.createElement("div");
        groupsDiv.className = "group-pill";
        groupsDiv.textContent = groups;

        row.appendChild(timeLabel);
        row.appendChild(percentDiv);
        row.appendChild(groupsDiv);
        box.appendChild(row);
    }
}

/* TIME SLOT POPUP */
function openPopup(time) {
    document.getElementById("popupTime").textContent = `Time: ${time}:00`;

    const regBtn = document.getElementById("registerBtn");
    const unregBtn = document.getElementById("unregisterBtn");

    regBtn.onclick = () => register(time);
    unregBtn.onclick = () => unregister(time);

    if (registered[time]) {
        regBtn.disabled = true;
        unregBtn.disabled = false;
    } else {
        regBtn.disabled = false;
        unregBtn.disabled = true;
    }

    document.getElementById("popupBg").style.display = "flex";
}

/* CLOSE POPUP WHEN CLICKING BACKGROUND */
document.getElementById("popupBg").onclick = e => {
    if (e.target.id === "popupBg") {
        document.getElementById("popupBg").style.display = "none";
    }
};

/* DYNAMIC REGISTER / UNREGISTER
   -> change groups & probability, then re-render */
function register(time) {
    if (!registered[time]) {
        registered[time] = true;

        const data = getSlotData(time);
        data.groups += 1;
        recalcProbability(data);
    }
    refresh();
}

function unregister(time) {
    if (registered[time]) {
        registered[time] = false;

        const data = getSlotData(time);
        data.groups = Math.max(1, data.groups - 1);
        recalcProbability(data);
    }
    refresh();
}

function refresh() {
    document.getElementById("popupBg").style.display = "none";
    const sport = document.getElementById("sportTitle").textContent.replace(" Time Table", "");
    goToTimeTable(sport);
}

/* LINE POPUP */
function openLine() {
    document.getElementById("linePopupBg").style.display = "flex";
}
function copyLine() {
    navigator.clipboard.writeText(document.getElementById("lineLink").value);
    alert("Copied!");
}
document.getElementById("linePopupBg").onclick = e => {
    if (e.target.id === "linePopupBg")
        document.getElementById("linePopupBg").style.display = "none";
};

/* QR SCANNER */
function openQR() {
    document.getElementById("qrPopupBg").style.display = "flex";

    qrScanner = new Html5Qrcode("qr-reader");
    qrScanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        decoded => {
            alert("Scanned: " + decoded);
            closeQR();
        }
    );
}

function closeQR() {
    if (qrScanner) qrScanner.stop();
    document.getElementById("qrPopupBg").style.display = "none";
}

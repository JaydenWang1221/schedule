let registered = {};
let probabilities = {}; // NEW — store stable percentages
let qrScanner = null;

window.onload = () => {
    document.getElementById("loginPage").style.display = "block";
};

/* LOGIN */
function enterSystem() {
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("menuPage").style.display = "block";
}

/* LOGOUT */
function logout() {
    document.getElementById("menuPage").style.display = "none";
    document.getElementById("timeTablePage").style.display = "none";
    document.getElementById("loginPage").style.display = "block";
}

/* COLOR GRADIENT */
function percentColor(p) {
    if (p < 50) {
        let r = p / 50;
        return `rgb(255, ${80 + r * 170}, 0)`;
    } else {
        let r = (p - 50) / 50;
        return `rgb(${255 - r * 210}, 255, ${r * 80})`;
    }
}

/* OPEN TIMETABLE */
function goToTimeTable(sport) {
    document.getElementById("menuPage").style.display = "none";
    document.getElementById("timeTablePage").style.display = "block";
    document.getElementById("sportTitle").textContent = sport + " Time Table";

    const box = document.getElementById("tableContainer");
    box.innerHTML = "";

    for (let t = 5; t <= 23; t++) {

        // KEEP the same probability, do not regenerate
        if (!(t in probabilities)) {
            probabilities[t] = Math.floor(Math.random() * 100);
        }
        let val = probabilities[t];

        const row = document.createElement("div");
        row.className = "time-row";
        row.dataset.time = t;

        if (registered[t]) row.classList.add("registered");

        row.onclick = () => openPopup(t);

        let timeLabel = document.createElement("div");
        timeLabel.textContent = t + ":00";

        let percent = document.createElement("div");
        percent.textContent = val + "%";
        percent.style.color = percentColor(val);
        percent.style.fontWeight = "bold";

        row.appendChild(timeLabel);
        row.appendChild(percent);
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

function register(time) {
    registered[time] = true;
    refresh();
}

function unregister(time) {
    registered[time] = false;
    refresh();
}

function refresh() {
    document.getElementById("popupBg").style.display = "none";
    let sport = document.getElementById("sportTitle").textContent.replace(" Time Table","");
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

async function updateDashboard() {
    try {
        const res = await fetch("http://127.0.0.1:5000/api/network");
        const data = await res.json();

        document.getElementById("downloadSpeed").innerText = data.download + " KB/s";
        document.getElementById("uploadSpeed").innerText = data.upload + " KB/s";
        document.getElementById("totalDownload").innerText = data.total_download + " GB";

        // Packet Feed
        const tableBody = document.querySelector("#packet-feed tbody");
        if (tableBody) {
            tableBody.innerHTML = data.feed.map(p => `
                <tr>
                    <td>${p.time}</td>
                    <td>${p.src}</td>
                    <td>${p.dst}</td>
                    <td><span class="badge ${p.proto.toLowerCase()}">${p.proto}</span></td>
                    <td>${p.size} B</td>
                </tr>`).join('');
        }

        // Top Talkers with Progress Bars
        const talkersBody = document.querySelector("#talkers tbody");
        if (talkersBody) {
            const maxTraffic = Math.max(...data.top_talkers.map(t => t[1]), 1);
            talkersBody.innerHTML = data.top_talkers.map(t => `
                <tr>
                    <td><strong>${t[0]}</strong></td>
                    <td><div class="progress-bg"><div class="progress-fill" style="width:${(t[1]/maxTraffic)*100}%"></div></div></td>
                    <td>${Math.round(t[1]/1024)} KB</td>
                </tr>`).join('');
        }
    } catch (e) { console.error(e); }
}
document.addEventListener("DOMContentLoaded", () => setInterval(updateDashboard, 1000));
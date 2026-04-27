let throughputChart;
let protocolChart;

async function loadAnalytics() {
    try {
        const res = await fetch("http://127.0.0.1:5000/api/network");
        const data = await res.json();
        
        // This checks if we are on the Analytics page
        const isAnalytics = document.body.classList.contains('analytics-page');

        if (protocolChart) {
            // Logic: Dashboard = Packet Count | Analytics = MB Volume
            const chartData = isAnalytics ? 
                [
                    (data.protocol_volumes.TCP / 1024 / 1024).toFixed(2),
                    (data.protocol_volumes.UDP / 1024 / 1024).toFixed(2),
                    (data.protocol_volumes.ICMP / 1024 / 1024).toFixed(2),
                    (data.protocol_volumes.DNS / 1024 / 1024).toFixed(2),
                    (data.protocol_volumes.ARP / 1024 / 1024).toFixed(2),
                    (data.protocol_volumes.OTHER / 1024 / 1024).toFixed(2)
                ] : 
                [
                    data.protocols.TCP,
                    data.protocols.UDP,
                    data.protocols.ICMP,
                    data.protocols.DNS,
                    data.protocols.ARP,
                    data.protocols.OTHER
                ];
            
            protocolChart.data.datasets[0].data = chartData;
            protocolChart.update();
        }

        if (throughputChart) {
            const time = new Date().toLocaleTimeString();
            throughputChart.data.labels.push(time);
            throughputChart.data.datasets[0].data.push(data.download);
            throughputChart.data.datasets[1].data.push(data.upload);
            
            if (throughputChart.data.labels.length > 10) {
                throughputChart.data.labels.shift();
                throughputChart.data.datasets[0].data.shift();
                throughputChart.data.datasets[1].data.shift();
            }
            throughputChart.update('none');
        }
    } catch (err) { console.error("Fetch Error:", err); }
}

document.addEventListener("DOMContentLoaded", () => {
    // 1. Throughput Chart (Line)
    const tCtx = document.getElementById("throughputChart");
    if (tCtx) {
        throughputChart = new Chart(tCtx, {
            type: "line",
            data: { 
                labels: [], 
                datasets: [
                    { label: "Down (KB/s)", data: [], borderColor: "#4f46e5", backgroundColor: "rgba(79,70,229,0.1)", fill: true, tension: 0.4 },
                    { label: "Up (KB/s)", data: [], borderColor: "#22c55e", fill: false, tension: 0.4 }
                ]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                animation: false,
                scales: {
                    x: { display: true, title: { display: true, text: 'Timeline' } },
                    y: { display: true, title: { display: true, text: 'KB/s' }, beginAtZero: true }
                }
            } 
        });
    }

    // 2. Protocol Chart (Donut)
    const pCtx = document.getElementById("protocolChart");
    if (pCtx) {
        const isAnalytics = document.body.classList.contains('analytics-page');
        
        protocolChart = new Chart(pCtx, {
            type: "doughnut",
            data: {
                labels: ["TCP", "UDP", "ICMP", "DNS", "ARP", "OTHER"],
                datasets: [{ 
                    data: [0,0,0,0,0,0], 
                    backgroundColor: ["#4f46e5", "#22c55e", "#f59e0b", "#06b6d4", "#8b5cf6", "#64748b"] 
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' },
                    title: {
                        display: true,
                        text: isAnalytics ? 'Protocol Bandwidth Usage (MB)' : 'Live Protocol Traffic (Packets)',
                        font: { size: 16, weight: 'bold' }
                    }
                }
            }
        });
    }
    setInterval(loadAnalytics, 2000);
});
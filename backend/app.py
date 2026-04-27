from flask import Flask, jsonify
from flask_cors import CORS
import psutil
import time
import threading
from scapy.all import sniff, IP, TCP, UDP, ICMP

app = Flask(__name__)
CORS(app)

last_net = psutil.net_io_counters()
last_time = time.time()
packet_count = 0

# Dashboard Metric: Frequency
protocol_counts = {"TCP":0, "UDP":0, "ICMP":0, "DNS":0, "ARP":0, "OTHER":0}
# Analytics Metric: Volume
protocol_volumes = {"TCP":0, "UDP":0, "ICMP":0, "DNS":0, "ARP":0, "OTHER":0}

packet_feed = []
top_talkers = {}

def process_packet(packet):
    global packet_count
    packet_count += 1
    proto = "OTHER"
    src, dst = "?", "?"
    size = len(packet)

    if packet.haslayer('ARP'):
        proto = "ARP"
        src = packet['ARP'].psrc
        dst = packet['ARP'].pdst
    elif packet.haslayer(IP):
        src = packet[IP].src
        dst = packet[IP].dst
        if packet.haslayer(ICMP): proto = "ICMP"
        elif packet.haslayer(TCP): proto = "TCP"
        elif packet.haslayer(UDP):
            if packet.haslayer('DNS'): proto = "DNS"
            else: proto = "UDP"

    # Update Analytics Data
    protocol_counts[proto] += 1
    protocol_volumes[proto] += size
    
    if src != "?":
        top_talkers[src] = top_talkers.get(src, 0) + size

    packet_feed.insert(0, {
        "time": time.strftime("%H:%M:%S"),
        "src": src, "dst": dst, "proto": proto, "size": size
    })
    if len(packet_feed) > 12: packet_feed.pop()

def sniff_packets():
    sniff(prn=process_packet, store=False)

threading.Thread(target=sniff_packets, daemon=True).start()

@app.route("/api/network")
def network():
    global last_net, last_time
    current = psutil.net_io_counters()
    now = time.time()
    duration = now - last_time
    download = (current.bytes_recv - last_net.bytes_recv) / duration / 1024
    upload = (current.bytes_sent - last_net.bytes_sent) / duration / 1024
    last_net, last_time = current, now

    sorted_talkers = sorted(top_talkers.items(), key=lambda x:x[1], reverse=True)[:5]

    return jsonify({
        "download": round(download, 2),
        "upload": round(upload, 2),
        "total_download": round(current.bytes_recv/1024/1024/1024, 2),
        "protocols": protocol_counts,
        "protocol_volumes": protocol_volumes,
        "feed": packet_feed,
        "top_talkers": sorted_talkers
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)
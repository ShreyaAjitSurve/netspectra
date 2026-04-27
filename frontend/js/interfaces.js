const API="http://127.0.0.1:5000/api/interfaces"

let charts={}

async function loadInterfaces(){

const res=await fetch(API)
const data=await res.json()

const grid=document.getElementById("interfaceGrid")

data.forEach(iface=>{

let card=document.getElementById("iface-"+iface.name)

if(!card){

card=document.createElement("div")
card.className="card"
card.id="iface-"+iface.name

card.innerHTML=`
<h3>${iface.name}</h3>
<p>Status: ${iface.status}</p>
<p>Sent: <span id="sent-${iface.name}"></span></p>
<p>Received: <span id="recv-${iface.name}"></span></p>
<canvas id="chart-${iface.name}"></canvas>
`

grid.appendChild(card)

const ctx=document.getElementById("chart-"+iface.name)

charts[iface.name]=new Chart(ctx,{
type:"line",
data:{
labels:[],
datasets:[
{
label:"Sent",
data:[],
borderColor:"#4f46e5"
},
{
label:"Received",
data:[],
borderColor:"#22c55e"
}
]
},
options:{animation:false}
})

}

document.getElementById("sent-"+iface.name).innerText =
Math.round(iface.bytes_sent/1024/1024)+" MB"

document.getElementById("recv-"+iface.name).innerText =
Math.round(iface.bytes_recv/1024/1024)+" MB"

const chart=charts[iface.name]

const time=new Date().toLocaleTimeString()

chart.data.labels.push(time)

chart.data.datasets[0].data.push(iface.bytes_sent)
chart.data.datasets[1].data.push(iface.bytes_recv)

if(chart.data.labels.length>8){

chart.data.labels.shift()
chart.data.datasets[0].data.shift()
chart.data.datasets[1].data.shift()

}

chart.update()

})

}

setInterval(loadInterfaces,2000)
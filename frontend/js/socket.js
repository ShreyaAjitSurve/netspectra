const API = "http://127.0.0.1:5000/api/network"

async function fetchNetwork(){

const res = await fetch(API)
return await res.json()

}

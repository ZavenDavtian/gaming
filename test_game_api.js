require('dotenv').config();
async function test() {
  const API_KEY = process.env.REACT_APP_OPENCRITIC_KEY;
  const res = await fetch(`https://opencritic-api.p.rapidapi.com/game?skip=0&sort=score`, {
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': 'opencritic-api.p.rapidapi.com',
    }
  });
  console.log("Status:", res.status);
  if (!res.ok) {
    const text = await res.text();
    console.log("Body:", text);
  } else {
    const data = await res.json();
    console.log("Length:", Array.isArray(data) ? data.length : "Not array");
  }
}
test();

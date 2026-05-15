require('dotenv').config();
const API_KEY = process.env.REACT_APP_OPENCRITIC_KEY;
async function test() {
  const res = await fetch(`https://opencritic-api.p.rapidapi.com/game/hall-of-fame`, {
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': 'opencritic-api.p.rapidapi.com',
    }
  });
  console.log(res.status);
  const text = await res.text();
  console.log(text.substring(0, 100));
}
test();

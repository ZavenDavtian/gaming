const url = "https://opencritic-api.p.rapidapi.com/game/";
const keys = "8914361691mshce2120c7b65343cp1609c4jsnba1f6a8ab9fa";
const ids = [13024, 1064, 1521, 1457];

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  const statuses = [];
  for (let i = 0; i < ids.length; i++) {
    const res = await fetch(url + ids[i], {
      headers: {
        'x-rapidapi-key': keys,
        'x-rapidapi-host': 'opencritic-api.p.rapidapi.com'
      }
    });
    statuses.push(res.status);
    if (res.status === 429) {
      console.log(`Hit 429 at index ${i}`);
      break;
    }
    await sleep(1100); 
  }
  console.log(statuses);
}
run();

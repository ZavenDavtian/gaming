const url = "https://opencritic-api.p.rapidapi.com/game/13024";
const keys = "8914361691mshce2120c7b65343cp1609c4jsnba1f6a8ab9fa";

async function run() {
  const res = await fetch(url, {
    headers: {
      'x-rapidapi-key': keys,
      'x-rapidapi-host': 'opencritic-api.p.rapidapi.com'
    }
  });
  console.log(res.status);
  const text = await res.text();
  console.log(text);
  console.log(res.headers);
}
run();

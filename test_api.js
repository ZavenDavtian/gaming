const keys = "8914361691mshce2120c7b65343cp1609c4jsnba1f6a8ab9fa";
const url = "https://opencritic-api.p.rapidapi.com/game/";

async function run() {
  const ids = [13024, 1064, 1521, 1457, 17706, 15131, 5969, 7760, 18333, 6224];
  const promises = ids.map(id => 
    fetch(url + id, {
      headers: {
        'x-rapidapi-key': keys,
        'x-rapidapi-host': 'opencritic-api.p.rapidapi.com'
      }
    }).then(res => res.status)
  );
  const statuses = await Promise.all(promises);
  console.log(statuses);
}
run();

require('dotenv').config();
const { fetchGames } = require('./src/services/rawgApi.js');

async function test() {
  try {
    const res = await fetchGames({ page: 1, pageSize: 20, ordering: '-released' });
    console.log("count:", res.count);
    console.log("next:", res.next);
    console.log("results length:", res.results.length);
  } catch (err) {
    console.error(err);
  }
}

test();

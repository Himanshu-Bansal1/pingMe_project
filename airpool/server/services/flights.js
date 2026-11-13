export async function getFlightStatus(flightNo,date,db){
  const cached=db.prepare('SELECT payload_json FROM flight_cache WHERE flight_no=? AND date=?').get(flightNo,date);if(cached)return JSON.parse(cached.payload_json);
  const row=db.prepare('SELECT scheduled,estimated,status FROM flights WHERE flight_no=? AND date=?').get(flightNo,date);if(!row)return null;
  const result={...row,source:'simulated'};db.prepare('INSERT OR REPLACE INTO flight_cache VALUES(?,?,?,CURRENT_TIMESTAMP)').run(flightNo,date,JSON.stringify(result));return result;
}

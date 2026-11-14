import { db } from './db.js';
import { groupRiders } from '../services/matching.js';

// Render creates a fresh, empty SQLite database unless a persistent disk is
// attached. Seed only a genuinely new database so the first Live Pools visit
// has usable sample records and later restarts do not overwrite user changes.
export function bootstrapEmptyDatabase() {
  if (db.prepare('SELECT 1 FROM airports LIMIT 1').get()) return false;

  const now = Date.now();
  const at = minutes => new Date(now + minutes * 60_000).toISOString();
  const airport = db.prepare('INSERT INTO airports(name,code,lat,lng) VALUES(?,?,?,?)');
  airport.run('Shaheed Bhagat Singh International Airport', 'IXC', 30.6735, 76.7885);
  airport.run('Sri Guru Ram Dass Jee International Airport', 'ATQ', 31.7096, 74.7973);

  const addZone = db.prepare('INSERT INTO zones(name,lat,lng,airport_id,corridor) VALUES(?,?,?,?,?)');
  const zoneRows = [
    ['Mohali',30.7046,76.7179,1,'south'], ['Panchkula',30.6942,76.8606,1,'north'],
    ['Ludhiana',30.9010,75.8573,1,'west'], ['Amritsar',31.6340,74.8723,2,'city'],
    ['Jalandhar',31.3260,75.5762,2,'south']
  ];
  zoneRows.forEach(row => addZone.run(...row));
  const circles = db.prepare('INSERT INTO circles(name,domain) VALUES(?,?)');
  [['Chandigarh University','cuchd.in'],['Punjab University','pu.ac.in'],['TechPark Circle','airpool.demo']]
    .forEach(row => circles.run(...row));
  const rates = db.prepare('INSERT INTO fare_rates VALUES(?,?,?,?)');
  [['Sedan',18,180,60],['SUV',24,280,80],['Van',30,400,100]].forEach(row => rates.run(...row));

  const samples = [
    ['6E 214','Aman',1,1,-15,15,'cabin'], ['AI 482','Priya',1,1,35,35,'large'],
    ['UK 910','Kabir',2,1,5,50,'cabin'], ['6E 702','Meera',2,1,70,70,'none'],
    ['AI 301','Rohan',3,1,-5,-5,'large'], ['SG 121','Simran',3,1,55,55,'cabin'],
    ['6E 108','Ishaan',1,1,25,25,'cabin'], ['AI 615','Ananya',2,1,90,90,'2+ large'],
    ['UK 213','Arjun',4,2,45,45,'cabin'], ['6E 440','Navya',5,2,110,110,'none'],
    ['SG 307','Dev',4,2,15,15,'large'], ['AI 860','Tara',5,2,80,80,'cabin']
  ];
  const addFlight = db.prepare('INSERT INTO flights(flight_no,date,scheduled,estimated,status) VALUES(?,?,?,?,?)');
  const addRequest = db.prepare(`INSERT INTO requests(flight_id,zone_id,airport_id,luggage_units,luggage_type,
    gender_pref,circle_pref,ready_time,first_name) VALUES(?,?,?,?,?,?,?,?,?)`);
  const insertSamples = db.transaction(() => {
    for (const [flightNo,name,zoneId,airportId,scheduledOffset,arrivalOffset,luggage] of samples) {
      const scheduled = at(scheduledOffset), estimated = at(arrivalOffset);
      const flightId = addFlight.run(flightNo, scheduled.slice(0,10), scheduled, estimated, arrivalOffset > scheduledOffset ? 'Delayed' : 'On time').lastInsertRowid;
      const units = {none:0,cabin:1,large:2,'2+ large':4}[luggage];
      const ready = new Date(Date.parse(estimated) + (units <= 1 ? 10 : 25) * 60_000).toISOString();
      addRequest.run(flightId,zoneId,airportId,units,luggage,'any','public',ready,name);
    }
  });
  insertSamples();

  const riders = db.prepare(`SELECT r.*,z.name zone_name,z.corridor FROM requests r
    JOIN zones z ON z.id=r.zone_id WHERE r.status='active'`).all();
  const byAirport = new Map();
  for (const rider of riders) {
    if (!byAirport.has(rider.airport_id)) byAirport.set(rider.airport_id, []);
    byAirport.get(rider.airport_id).push(rider);
  }
  const addPool = db.prepare('INSERT INTO pools(airport_id,zone_group,vehicle_type,departure_time) VALUES(?,?,?,?)');
  const addMember = db.prepare('INSERT INTO pool_members(pool_id,request_id) VALUES(?,?)');
  db.transaction(() => {
    for (const [airportId, airportRiders] of byAirport) {
      for (const group of groupRiders(airportRiders)) {
        const id = addPool.run(airportId,group.key,group.vehicles.length > 1 ? 'Split cabs' : group.vehicles[0],group.departure_time).lastInsertRowid;
        for (const rider of group.riders) addMember.run(id,rider.id);
      }
    }
  })();
  return true;
}

import { db } from './db.js';
import { groupRiders } from '../services/matching.js';
db.exec('DELETE FROM pool_members; DELETE FROM pools; DELETE FROM requests; DELETE FROM flights; DELETE FROM events; DELETE FROM users; DELETE FROM circle_members; DELETE FROM circles; DELETE FROM zones; DELETE FROM airports; DELETE FROM fare_rates;');
const airport=db.prepare('INSERT INTO airports(name,code,lat,lng) VALUES(?,?,?,?)');
airport.run('Shaheed Bhagat Singh International Airport','IXC',30.6735,76.7885); airport.run('Sri Guru Ram Dass Jee International Airport','ATQ',31.7096,74.7973);
const zone=db.prepare('INSERT INTO zones(name,lat,lng,airport_id,corridor) VALUES(?,?,?,?,?)');
const zones=[['Mohali',30.7046,76.7179,1,'south'],['Panchkula',30.6942,76.8606,1,'north'],['Ludhiana',30.9010,75.8573,1,'west'],['Amritsar',31.6340,74.8723,2,'city'],['Jalandhar',31.3260,75.5762,2,'south']]; zones.forEach(z=>zone.run(...z));
['Chandigarh University','Punjab University','TechPark Circle'].forEach((n,i)=>db.prepare('INSERT INTO circles(name,domain) VALUES(?,?)').run(n,['cuchd.in','pu.ac.in','airpool.demo'][i]));
for(const [v,r,m,s] of [['Sedan',18,180,60],['SUV',24,280,80],['Van',30,400,100]])db.prepare('INSERT INTO fare_rates VALUES(?,?,?,?)').run(v,r,m,s);
const now=new Date(); const add=(mins)=>new Date(now.getTime()+mins*60000).toISOString();
const names=['Aman','Priya','Kabir','Meera','Rohan','Simran','Ishaan','Ananya','Arjun','Navya','Dev','Tara'];
const flights=[['6E 214',-15,15,'Delayed'],['AI 482',35,35,'On time'],['UK 910',5,50,'Delayed'],['6E 702',70,70,'On time'],['AI 301',-5,-5,'On time'],['SG 121',55,55,'On time'],['6E 108',25,25,'On time'],['AI 615',90,90,'On time'],['UK 213',45,45,'On time'],['6E 440',110,110,'On time'],['SG 307',15,15,'On time'],['AI 860',80,80,'On time']];
const insFlight=db.prepare('INSERT INTO flights(flight_no,date,scheduled,estimated,status) VALUES(?,?,?,?,?)'); const insReq=db.prepare('INSERT INTO requests(flight_id,zone_id,airport_id,luggage_units,luggage_type,gender_pref,circle_pref,ready_time,first_name) VALUES(?,?,?,?,?,?,?,?,?)');
const base=now.toISOString().slice(0,10);
db.transaction(()=>flights.forEach((f,i)=>{let zoneId=i<8?[1,1,2,2,3,3,1,2][i]:[4,5,4,5][i-8];let airportId=zoneId<=3?1:2;let scheduled=add(f[1]);let estimated=add(f[2]);let flightId=insFlight.run(f[0],base,scheduled,estimated,f[3]).lastInsertRowid;const luggage=['none','cabin','large','2+ large'][i%4],buffer=['none','cabin'].includes(luggage)?10:25;let ready=new Date(new Date(estimated).getTime()+buffer*60000).toISOString();insReq.run(flightId,zoneId,airportId,[0,1,2,4][i%4],luggage,i%5===0?'women':'any',i%3===0?'circle':'public',ready,names[i]);}))();
const riders=db.prepare("SELECT r.*,z.name zone_name,z.corridor FROM requests r JOIN zones z ON z.id=r.zone_id WHERE r.status='active'").all();
const byAirport=new Map();for(const r of riders){if(!byAirport.has(r.airport_id))byAirport.set(r.airport_id,[]);byAirport.get(r.airport_id).push(r);}
db.transaction(()=>{for(const [airportId,group] of byAirport)for(const pool of groupRiders(group)){const id=db.prepare('INSERT INTO pools(airport_id,zone_group,vehicle_type,departure_time) VALUES(?,?,?,?)').run(airportId,pool.key,pool.vehicles.length>1?'Split cabs':pool.vehicles[0],pool.departure_time).lastInsertRowid;for(const r of pool.riders)db.prepare('INSERT INTO pool_members(pool_id,request_id) VALUES(?,?)').run(id,r.id);}})();
console.log('Seeded AirPool demo data.');

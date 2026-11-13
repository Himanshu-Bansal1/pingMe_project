import { recommendVehicle } from './vehicles.js';
export const WINDOW_MINUTES=15, MAX_WAIT_MINUTES=45, REGROUP_GAP_MINUTES=15;
const mins=(a,b)=>(new Date(b)-new Date(a))/60000;
export function hasReadyTimeGap(riders,threshold=REGROUP_GAP_MINUTES){for(let i=0;i<riders.length;i++)for(let j=i+1;j<riders.length;j++)if(Math.abs(mins(riders[i].ready_time,riders[j].ready_time))>threshold)return true;return false;}
export function groupRiders(riders,{window=WINDOW_MINUTES,maxWait=MAX_WAIT_MINUTES}={}){
  // Keep women-only requests in a separate matching lane; a preference is never broadened.
  const lanes=new Map();for(const rider of riders){const key=rider.gender_pref==='women'?'women':'any';if(!lanes.has(key))lanes.set(key,[]);lanes.get(key).push(rider);}
  if(lanes.size>1)return [...lanes.values()].flatMap(lane=>groupRiders(lane,{window,maxWait}));
  const pending=[...riders].sort((a,b)=>a.ready_time.localeCompare(b.ready_time));const groups=[];
  while(pending.length){const first=pending.shift();const group=[first];const latest=first.ready_time;
    for(let i=0;i<pending.length;){const candidate=pending[i];const same=candidate.zone_id===first.zone_id||(candidate.corridor&&candidate.corridor===first.corridor);const diff=mins(first.ready_time,candidate.ready_time);
      if(same&&diff<=window&&diff<=maxWait){group.push(...pending.splice(i,1));}else i++;}
    groups.push({key:first.zone_name??String(first.zone_id),zone_id:first.zone_id,riders:group,departure_time:group.map(r=>r.ready_time).sort().at(-1),...recommendVehicle(group)});
  } return groups;
}

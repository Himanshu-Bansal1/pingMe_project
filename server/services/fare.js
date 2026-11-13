export function splitFare(riders,ratePerKm=18,minimum=180){
  // Each road segment is shared only by riders still on board after earlier drops.
  const sorted=[...riders].sort((a,b)=>a.distanceKm-b.distanceKm);let previous=0;const shares=sorted.map(r=>({...r,share:0,segments:[]}));
  for(let i=0;i<sorted.length;i++){const distance=Math.max(0,sorted[i].distanceKm-previous);const segment=Math.max(0,distance*ratePerKm);const onBoard=sorted.length-i;for(let j=i;j<shares.length;j++){shares[j].share+=segment/onBoard;shares[j].segments.push({km:distance,amount:segment/onBoard,riders:onBoard});}previous=sorted[i].distanceKm;}
  const total=shares.reduce((s,r)=>s+r.share,0);const floor=Math.max(0,minimum-total);if(floor){for(const r of shares)r.share+=floor/shares.length;}
  return {riders:shares.map(r=>({...r,share:Math.round(r.share*100)/100,saving:Math.round((r.distanceKm*ratePerKm+minimum-r.share)*100)/100})),total:Math.round(Math.max(total,minimum)*100)/100};
}
export function estimateFare(km,rate,minimum,night=0){return Math.round(Math.max(minimum,km*rate+night)*100)/100;}

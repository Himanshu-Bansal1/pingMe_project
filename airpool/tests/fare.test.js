import test from 'node:test';import assert from 'node:assert/strict';import {splitFare,estimateFare} from '../server/services/fare.js';
test('splits route segments among riders still onboard',()=>{const x=splitFare([{name:'A',distanceKm:10},{name:'B',distanceKm:20}],10,0);assert.equal(x.riders.find(r=>r.name==='A').share,50);assert.equal(x.riders.find(r=>r.name==='B').share,150);});
test('fare respects minimum',()=>assert.equal(estimateFare(2,18,180),180));

import test from 'node:test';import assert from 'node:assert/strict';import {recommendVehicle} from '../server/services/vehicles.js';
test('chooses smallest vehicle that meets seats and luggage capacity',()=>{assert.deepEqual(recommendVehicle([{luggage_units:1}]).vehicles,['Sedan']);assert.deepEqual(recommendVehicle(Array.from({length:5},()=>({luggage_units:1}))).vehicles,['SUV']);});

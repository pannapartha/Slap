import test from 'node:test';import assert from 'node:assert/strict';
import {atmosphereAt} from '../public/visuals.mjs';
test('altitude atmosphere is continuous across day, golden hour, dusk and space without darkening play to black',()=>{
 let previous=atmosphereAt(0);for(let i=1;i<=1000;i++){const state=atmosphereAt(i/1000);assert.ok(state.ambient>=1);assert.ok(state.night>=previous.night);assert.ok(Math.abs(state.top.r-previous.top.r)<.02);assert.ok(Math.abs(state.horizon.g-previous.horizon.g)<.02);assert.ok(Math.abs(state.power-previous.power)<.02);previous=state;}assert.equal(previous.night,1);assert.ok(previous.power>1.5);
});
test('atmosphere clamps invalid progression extremes to its synchronized endpoints',()=>{
 for(const [input,endpoint] of [[-1,0],[10,1]]){const a=atmosphereAt(input),b=atmosphereAt(endpoint);assert.ok(a.top.equals(b.top)&&a.horizon.equals(b.horizon)&&a.sun.equals(b.sun));assert.equal(a.power,b.power);assert.equal(a.ambient,b.ambient);}
});

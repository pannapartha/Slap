import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';import {GameAudio} from '../public/audio.mjs';
test('spatial audio stays in island coordinates after a visual ascent',()=>{
 const a=new GameAudio(),params=Object.fromEntries(['positionX','positionY','positionZ','forwardX','forwardY','forwardZ','upX','upY','upZ'].map(k=>[k,{value:0}]));a.context={listener:params};const camera=new THREE.PerspectiveCamera();camera.position.set(4,95,8);a.update({phase:'won',players:[]},0,camera,92);assert.equal(params.positionX.value,4);assert.equal(params.positionY.value,3);assert.equal(params.positionZ.value,8);assert.equal(params.upY.value,1);
});

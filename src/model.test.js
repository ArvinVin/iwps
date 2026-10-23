import test from 'node:test';
import assert from 'node:assert/strict';
import {CATEGORIES,normalizeSelection,seatPosition,seatCount,metrics,readLocation} from './model.js';

test('untrusted deep links resolve to bounded seats and supported views',()=>{
 const state=readLocation('?zone=missing&blk=Z&row=-10&seat=999999&view=invalid');
 assert.equal(state.selection.category,'platinum');assert.equal(state.selection.row,1);
 assert.equal(state.selection.seat,seatCount('platinum',1));assert.equal(state.selection.block,'A');assert.equal(state.view,'overview');
 assert.deepEqual(readLocation('?zone=gold&blk=B&row=4&seat=22&view=pov'),{selection:{category:'gold',block:'B',row:4,seat:22},view:'pov'});
});
test('opposite blocks are mirrored and rear rows rise and recede',()=>{
 for(const c of CATEGORIES){const a=seatPosition({category:c.id,block:'A',row:1,seat:1});const b=seatPosition({category:c.id,block:'B',row:1,seat:1});
 assert.ok(Math.abs(a.x+b.x)<1e-8);if(c.id!=='vip')assert.ok(Math.abs(a.z+b.z)<1e-8);
 const rear=seatPosition({category:c.id,block:'A',row:4,seat:1});assert.ok(Math.hypot(rear.x,rear.z)>Math.hypot(a.x,a.z));if(c.id!=='vip')assert.ok(rear.y>a.y);
 }
});
test('eye-to-court measurements include elevation and closest court edge',()=>{
 const s={category:'vip',block:'A',row:1,seat:21};const p=seatPosition(s),m=metrics(s);
 assert.equal(p.x,-8);assert.equal(p.z,0);assert.ok(Math.abs(m.height-1.35)<1e-10);
 assert.ok(Math.abs(m.distance-Math.hypot(8,1.35))<1e-8);
 assert.ok(Math.abs(m.edge-Math.hypot(3,1.35))<1e-8);
});
test('all generated seats are finite and unique across all zones',()=>{
 const coordinates=new Set();let count=0;
 for(const c of CATEGORIES)for(const block of ['A','B'])for(let row=1;row<=(c.id==='vip'?4:8);row++)for(let seat=1;seat<=seatCount(c.id,row);seat++){
 const p=seatPosition({category:c.id,block,row,seat});assert.ok([p.x,p.y,p.z].every(Number.isFinite));if(c.id!=='vip')assert.ok(Math.abs(p.x)>38.5||Math.abs(p.z)>23.5,'Tribune must stay outside main floor');const key=[p.x,p.y,p.z].map(n=>n.toFixed(4)).join(',');assert.ok(!coordinates.has(key));coordinates.add(key);count++;
 }
 assert.ok(count>10000);assert.equal(normalizeSelection({category:'vip',row:100,seat:1000}).row,4);
});
test('seats remain evenly spaced around straight sections and rounded corners',()=>{
 for(const c of CATEGORIES.filter(c=>c.id!=='vip'))for(const row of [1,8]){
 let previous=seatPosition({category:c.id,block:'A',row,seat:1});
 for(let seat=2;seat<=seatCount(c.id,row);seat++){const p=seatPosition({category:c.id,block:'A',row,seat});const gap=Math.hypot(p.x-previous.x,p.z-previous.z);assert.ok(gap>.53&&gap<.57,`${c.id} row ${row}: ${gap}`);previous=p;}
 }
});

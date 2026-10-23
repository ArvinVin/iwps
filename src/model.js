// Metres. Hall floor is supplied by the project owner; all seating parameters are estimates.
export const DIMENSIONS = { floorWidth: 77, floorDepth: 47, courtWidth: 10, courtLength: 20, rowPitch: .85, rowRise: .40, eyeHeight: 1.20, seatPitch: .55, innerX: 44, innerZ: 30.5 };
export const CATEGORIES = [
  { id:'bronze', name:'Bronze', color:'#dd9771', price:550000, start:16, side:'end', subtitle:'Panorama arena' },
  { id:'silver', name:'Silver', color:'#80b99b', price:750000, start:16, side:'side', subtitle:'Tribun sisi atas' },
  { id:'gold', name:'Gold', color:'#e6b6da', price:1250000, start:8, side:'end', subtitle:'Tribun tengah' },
  { id:'platinum', name:'Platinum', color:'#e5cb6c', price:1750000, start:8, side:'side', subtitle:'Sudut lapangan luas' },
  { id:'diamond', name:'Diamond', color:'#e57482', price:2750000, start:0, side:'end', subtitle:'Dekat baseline' },
  { id:'super-diamond', name:'Super Diamond', color:'#8d96e7', price:4500000, start:0, side:'side', subtitle:'Tribun sisi bawah' },
  { id:'vip', name:'VIP Courtside', color:'#b4ee82', price:null, start:0, side:'floor', subtitle:'Di tepi lapangan · RSVP' },
];
export const categoryById = id => CATEGORIES.find(c=>c.id===id) || CATEGORIES[3];
// Rounded rectangular bowl, with offsets along its outward normal. The entire
// 77 x 47 m floor envelope fits inside the first row, including its corners.
export function bowlPoint(offset,angle) {
 const a=DIMENSIONS.innerX,b=DIMENSIONS.innerZ,c=Math.cos(angle),s=Math.sin(angle);
 const x=a*Math.sign(c)*Math.sqrt(Math.abs(c)),z=b*Math.sign(s)*Math.sqrt(Math.abs(s));
 const nx=x**3/a**4,nz=z**3/b**4,length=Math.hypot(nx,nz);
 return {x:x+offset*nx/length,z:z+offset*nz/length};
}
const arcs=new Map();
function rowArc(category, row) {
  const c=categoryById(category);
  const key=`${c.id}-${row}`;if(arcs.has(key))return arcs.get(key);
  const r=c.start+row-1;
  const center=c.side==='end'? -Math.PI/2 : Math.PI;
  const start=center-Math.PI/4+.035, end=center+Math.PI/4-.035;
  let length=0,previous=bowlPoint(r*DIMENSIONS.rowPitch,start);const points=[{...previous,d:0}];
  for(let i=1;i<=1024;i++){const p=bowlPoint(r*DIMENSIONS.rowPitch,start+i*(end-start)/1024);length+=Math.hypot(p.x-previous.x,p.z-previous.z);points.push({...p,d:length});previous=p;}
  const arc={points,length,count:Math.floor(length/DIMENSIONS.seatPitch)};arcs.set(key,arc);return arc;
}
export function seatCount(category,row){return categoryById(category).id==='vip'?40:rowArc(category,row).count;}
export function normalizeSelection(raw={}) {
  const c=categoryById(raw.category), row=Math.min(c.id==='vip'?4:8,Math.max(1,Math.trunc(Number(raw.row))||1));
  return { category:c.id, block:raw.block==='B'?'B':'A', row, seat:Math.min(seatCount(c.id,row),Math.max(1,Math.trunc(Number(raw.seat))||1)) };
}
export function seatPosition(raw) {
  const s=normalizeSelection(raw), c=categoryById(s.category);
  if(c.id==='vip') return {x:(s.block==='A'?-1:1)*(8+(s.row-1)*.85), y:.15, z:-11+(s.seat-1)*.55, angle:s.block==='A'?Math.PI:0};
  const r=c.start+s.row-1,arc=rowArc(c.id,s.row),distance=(s.seat-.5)*arc.length/arc.count;
  let low=0,high=arc.points.length-1;while(high-low>1){const mid=(low+high)>>1;if(arc.points[mid].d<distance)low=mid;else high=mid;}
  const a=arc.points[low],b=arc.points[high],t=(distance-a.d)/(b.d-a.d),sign=s.block==='A'?1:-1;
  const p={x:(a.x+(b.x-a.x)*t)*sign,z:(a.z+(b.z-a.z)*t)*sign},angle=Math.atan2(p.z,p.x);
  return {x:p.x,y:1.4+r*.4+(r>=8?1.2:0)+(r>=16?1.2:0),z:p.z,angle};
}
export function metrics(s) {
 const p=seatPosition(s), eye=p.y+DIMENSIONS.eyeHeight;
 return {horizontal:Math.hypot(p.x,p.z),distance:Math.hypot(p.x,p.z,eye),height:eye,edge:Math.hypot(Math.max(Math.abs(p.x)-5,0),Math.max(Math.abs(p.z)-10,0),eye)};
}
export function readLocation(search) {
 const p=new URLSearchParams(search); return {selection:normalizeSelection({category:p.get('zone')||'platinum',block:p.get('blk')||'A',row:p.get('row')||4,seat:p.get('seat')||40}),view:['overview','top','pov'].includes(p.get('view'))?p.get('view'):'overview'};
}

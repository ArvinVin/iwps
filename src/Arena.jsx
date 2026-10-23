import React,{useEffect,useRef} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {CATEGORIES,seatCount,seatPosition,bowlPoint,DIMENSIONS} from './model.js';

function buildScene(scene) {
  const seats=[], pickables=[];
  const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.8,...extra});
  function box(w,h,d,x,y,z,color){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));m.position.set(x,y,z);scene.add(m);return m;}
  function label(text,x,y,z,size=3,color='#c7d0db',flat=false){
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;
    const ctx=canvas.getContext('2d');ctx.font='600 56px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,512,64);
    const tex=new THREE.CanvasTexture(canvas);
    if(flat){const m=new THREE.Mesh(new THREE.PlaneGeometry(size*8,size),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);scene.add(m);return;}
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));sprite.scale.set(size*8,size,1);sprite.position.set(x,y,z);scene.add(sprite);
  }
  const baseShape=new THREE.Shape();for(let i=0;i<=240;i++){const p=bowlPoint(24,i/240*Math.PI*2);if(i===0)baseShape.moveTo(p.x,p.z);else baseShape.lineTo(p.x,p.z);}const base=new THREE.Mesh(new THREE.ExtrudeGeometry(baseShape,{depth:1,bevelEnabled:false}),mat('#18242e'));base.rotation.x=-Math.PI/2;base.position.y=-1.2;scene.add(base);
  box(77,.3,47,0,-.2,0,'#48545a');
  box(26,.16,35,0,.02,0,'#233c3c');
  box(10,.12,20,0,.15,0,'#27675c');
  // A regulation-size padel court with transparent glass, service lines and net.
  const line='#dce5d8';
  [-5,5].forEach(x=>box(.055,.025,20,x,.22,0,line));
  [-10,-3.05,3.05,10].forEach(z=>box(10,.025,.055,0,.22,z,line));
  [-6.525,6.525].forEach(z=>box(.055,.025,6.95,0,.22,z,line));
  const glass=mat('#b3d3d2',{transparent:true,opacity:.13,side:THREE.DoubleSide,depthWrite:false});
  [-5,5].forEach(x=>{const m=new THREE.Mesh(new THREE.BoxGeometry(.04,3,20),glass);m.position.set(x,1.7,0);scene.add(m);});
  [-10,10].forEach(z=>{const m=new THREE.Mesh(new THREE.BoxGeometry(10,3,.04),glass);m.position.set(0,1.7,z);scene.add(m);});
  [-5,5].forEach(x=>{for(let z=-10;z<=10;z+=2)box(.07,3.2,.07,x,1.8,z,'#778c8d');box(.08,.07,20,x,3.4,0,'#8a9e9d');});
  [-10,10].forEach(z=>{box(10,.07,.07,0,3.4,z,'#8a9e9d');for(let x=-3;x<=3;x+=2)box(.06,3.2,.06,x,1.8,z,'#778c8d');});
  box(10,.065,.04,0,1.12,0,'#eceee7');
  const net=new THREE.Mesh(new THREE.PlaneGeometry(10,.9),new THREE.MeshBasicMaterial({color:'#bdcbc1',transparent:true,opacity:.28,side:THREE.DoubleSide}));net.position.set(0,.65,0);scene.add(net);
  for(let x=-5;x<=5;x+=.25)box(.012,.9,.012,x,.65,0,'#91a9a0');
  label('INDONESIA WORLD PADEL SHOW',0,.18,-14,1.15,'#c3d1c6',true);
  label('IWPS',0,.18,14,2,'#d4e6d4',true);
  // Human-scale silhouettes make the size of the court legible from distant seats.
  for(const [x,z] of [[-2.3,-6],[2.3,-7],[-2.3,6],[2.3,7]]){
    const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.17,.55,4,8),mat(z<0?'#d7f6a5':'#ededf0'));torso.position.set(x,1.25,z);scene.add(torso);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.14,10,8),mat('#c99f80'));head.position.set(x,1.8,z);scene.add(head);
    [-.1,.1].forEach(dx=>box(.13,.65,.14,x+dx,.57,z,'#14272d'));
  }
  // Stepped bowl. The 77 x 47 m floor and every seat share one metre-based coordinate system.
  const bandMaterial=mat('#33414c');
  for(let row=0;row<24;row++){
    const y=1.4+row*.4+(row>=8?1.2:0)+(row>=16?1.2:0);
    const points=[];
    for(let i=0;i<160;i++){
      const a=i/160*Math.PI*2,b=(i+1)/160*Math.PI*2;
      const v=(r,t,h)=>{const p=bowlPoint(row*DIMENSIONS.rowPitch+r,t);return [p.x,h,p.z];};
      const A=v(-.39,a,y),B=v(.46,a,y),C=v(.46,b,y),D=v(-.39,b,y);
      const E=v(.46,a,y-.4),F=v(.46,b,y-.4);
      points.push(...A,...B,...C,...A,...C,...D,...B,...E,...F,...B,...F,...C);
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geo.computeVertexNormals();scene.add(new THREE.Mesh(geo,bandMaterial));
  }
  for(const c of CATEGORIES) for(const block of ['A','B'])for(let row=1;row<=(c.id==='vip'?4:8);row++)for(let seat=1;seat<=seatCount(c.id,row);seat++){
    const selection={category:c.id,block,row,seat};seats.push({selection,position:seatPosition(selection),color:c.color});
  }
  const seatMat=mat('#ffffff');
  const cushions=new THREE.InstancedMesh(new THREE.BoxGeometry(.44,.13,.43),seatMat,seats.length);
  const backs=new THREE.InstancedMesh(new THREE.BoxGeometry(.44,.48,.085),seatMat,seats.length);
  const dummy=new THREE.Object3D(),color=new THREE.Color();
  seats.forEach((s,i)=>{
    const p=s.position;dummy.position.set(p.x,p.y+.42,p.z);dummy.rotation.y=Math.atan2(p.x,p.z);dummy.updateMatrix();cushions.setMatrixAt(i,dummy.matrix);
    dummy.position.x+=Math.sin(dummy.rotation.y)*.19;dummy.position.z+=Math.cos(dummy.rotation.y)*.19;dummy.position.y+=.21;dummy.updateMatrix();backs.setMatrixAt(i,dummy.matrix);
    color.set(s.color);cushions.setColorAt(i,color);backs.setColorAt(i,color);
  });
  scene.add(cushions,backs);pickables.push(cushions,backs);
  // Perimeter, vomitory openings and upper gallery.
  const rimPoints=Array.from({length:160},(_,i)=>{const p=bowlPoint(21,i/160*Math.PI*2);return new THREE.Vector3(p.x,14.8,p.z);});const rim=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rimPoints,true),240,.2,6,true),mat('#667780'));scene.add(rim);
  for(let i=0;i<32;i++){
    const a=i/32*Math.PI*2;
    const p=bowlPoint(21,a);box(.3,5,.3,p.x,12.5,p.z,'#5c6b74');
    const beam=box(.2,.2,4,p.x,15,p.z,'#859198');beam.rotation.y=-a+Math.PI/2;
    if(i%4===0){const q=bowlPoint(19,a);const portal=box(2.2,2.2,1,q.x,11.2,q.z,'#101b24');portal.rotation.y=-a+Math.PI/2;}
  }
  label('BRONZE A',0,13,-55,1.55,'#d6ab8d');label('BRONZE B',0,13,55,1.55,'#d6ab8d');
  label('SILVER A',-69,13,0,1.55,'#9fcbb4');label('SILVER B',69,13,0,1.55,'#9fcbb4');
  label('INDONESIA ARENA',0,.1,20,1.2,'#a6b4b4',true);
  // A restrained suspended scoreboard, intentionally small to retain court sightlines.
  box(4,1.6,2.5,0,19,0,'#101923');label('IWPS',0,19,1.27,.5,'#d4e6c2');
  const roof=new THREE.Group();
  const ceiling=new THREE.Mesh(new THREE.ShapeGeometry(baseShape),mat('#111d26',{side:THREE.DoubleSide}));ceiling.rotation.x=-Math.PI/2;ceiling.position.y=29;roof.add(ceiling);
  const wallVertices=[];
  for(let i=0;i<160;i++){const a=bowlPoint(23,i/160*Math.PI*2),b=bowlPoint(23,(i+1)/160*Math.PI*2);wallVertices.push(a.x,13,a.z,b.x,13,b.z,b.x,29,b.z,a.x,13,a.z,b.x,29,b.z,a.x,29,a.z);}
  const wallGeometry=new THREE.BufferGeometry();wallGeometry.setAttribute('position',new THREE.Float32BufferAttribute(wallVertices,3));wallGeometry.computeVertexNormals();roof.add(new THREE.Mesh(wallGeometry,mat('#192631',{side:THREE.DoubleSide})));
  const beams=[];for(let z=-40;z<=40;z+=8){beams.push(-57,27,z,57,27,z);for(let x=-56;x<56;x+=8)beams.push(x,27,z,x+4,25,z,x+8,27,z,x+4,25,z);}
  for(let x=-56;x<=56;x+=8)beams.push(x,27,-44,x,27,44);
  for(const x of [-1.8,1.8])for(const z of [-1,1])beams.push(x,20,z,x,27,z);
  const beamGeometry=new THREE.BufferGeometry();beamGeometry.setAttribute('position',new THREE.Float32BufferAttribute(beams,3));roof.add(new THREE.LineSegments(beamGeometry,new THREE.LineBasicMaterial({color:'#566773'})));
  roof.visible=false;scene.add(roof);
  return {seats,pickables,roof};
}

export default function Arena({selection,view,action,onSelect,onReady,onError}) {
 const mount=useRef(),engine=useRef();const selectRef=useRef(onSelect);selectRef.current=onSelect;
 useEffect(()=>{
  let renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch{onError();return;}
  const host=mount.current;renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.7));renderer.setClearColor('#0a111b');renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Arena 3D. Dalam mode POV, gunakan tombol panah untuk menoleh.');host.appendChild(renderer.domElement);
  const scene=new THREE.Scene();scene.fog=new THREE.Fog('#0a111b',450,850);
  scene.add(new THREE.HemisphereLight('#e3f0ff','#61766d',2.7));const key=new THREE.DirectionalLight('#fff1d9',3);key.position.set(30,80,35);scene.add(key);
  const fill=new THREE.DirectionalLight('#a5c9ff',1.5);fill.position.set(-50,30,-20);scene.add(fill);
  const camera=new THREE.PerspectiveCamera(44,1,.1,600);camera.position.set(111,108,126);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.maxPolarAngle=Math.PI/2-.03;controls.minDistance=30;controls.maxDistance=240;controls.target.set(0,2,0);
  const model=buildScene(scene);
  const marker=new THREE.Mesh(new THREE.SphereGeometry(.6,16,12),new THREE.MeshBasicMaterial({color:'#e5ffb3'}));scene.add(marker);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.1,.08,8,32),new THREE.MeshBasicMaterial({color:'#d7fda3'}));ring.rotation.x=Math.PI/2;scene.add(ring);
  let tween=null,currentView='overview',dirty=true,povYaw=0,povPitch=0;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  controls.addEventListener('change',()=>{dirty=true;});
  const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();dirty=true;};const observer=new ResizeObserver(resize);observer.observe(host);resize();
  engine.current={move(s,v){currentView=v;model.roof.visible=v==='pov';const p=seatPosition(s);marker.position.set(p.x,p.y+1,p.z);ring.position.set(p.x,p.y+.8,p.z);marker.visible=ring.visible=v!=='pov';
    controls.minDistance=v==='pov'?.01:25;controls.maxDistance=v==='pov'?2:500;controls.enableZoom=v!=='pov';controls.enablePan=v!=='pov';controls.maxPolarAngle=v==='pov'?Math.PI-.05:Math.PI/2-.03;
    const factor=Math.max(1,1/camera.aspect*1.1);
    const pos=v==='pov'?new THREE.Vector3(p.x,p.y+DIMENSIONS.eyeHeight,p.z):v==='top'?new THREE.Vector3(0,165*factor,.01):new THREE.Vector3(106*factor,100*factor,118*factor);
    const target=v==='pov'?pos.clone().add(new THREE.Vector3(-p.x,-pos.y,p.z*-1).normalize()):new THREE.Vector3(0,2,0);
    tween={from:camera.position.clone(),to:pos,targetFrom:controls.target.clone(),targetTo:target,start:performance.now(),duration:reduced?0:1100};controls.enabled=false;
  }, zoom(amount){if(currentView==='pov')return;const offset=camera.position.clone().sub(controls.target).multiplyScalar(amount);offset.clampLength(25,500);camera.position.copy(controls.target).add(offset);dirty=true;},};
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null;
  const pointerDown=e=>{down=[e.clientX,e.clientY];if(currentView==='pov')renderer.domElement.setPointerCapture(e.pointerId);};
  const pointerMove=e=>{if(currentView!=='pov'||!down||tween)return;povYaw-=(e.clientX-down[0])*.003;povPitch=THREE.MathUtils.clamp(povPitch-(e.clientY-down[1])*.003,-1.35,1.35);camera.rotation.set(povPitch,povYaw,0,'YXZ');down=[e.clientX,e.clientY];dirty=true;};
  const pointerUp=e=>{const start=down;down=null;if(!start||Math.hypot(e.clientX-start[0],e.clientY-start[1])>5||currentView==='pov')return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(model.pickables)[0];if(hit)selectRef.current(model.seats[hit.instanceId].selection);};
  renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointermove',pointerMove);renderer.domElement.addEventListener('pointerup',pointerUp);renderer.domElement.addEventListener('pointercancel',()=>{down=null;});
  renderer.domElement.addEventListener('keydown',e=>{if(currentView!=='pov'||tween||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();povYaw+=(e.key==='ArrowLeft'?.06:e.key==='ArrowRight'?-.06:0);povPitch=THREE.MathUtils.clamp(povPitch+(e.key==='ArrowUp'?.06:e.key==='ArrowDown'?-.06:0),-1.35,1.35);camera.rotation.set(povPitch,povYaw,0,'YXZ');dirty=true;});
  const contextLost=e=>{e.preventDefault();onError();};renderer.domElement.addEventListener('webglcontextlost',contextLost);
  renderer.setAnimationLoop(()=>{if(document.hidden)return;if(tween){const t=tween.duration?Math.min((performance.now()-tween.start)/tween.duration,1):1,k=t*t*(3-2*t);camera.position.lerpVectors(tween.from,tween.to,k);controls.target.lerpVectors(tween.targetFrom,tween.targetTo,k);camera.lookAt(controls.target);dirty=true;if(t===1){tween=null;controls.enabled=currentView!=='pov';const look=new THREE.Euler().setFromQuaternion(camera.quaternion,'YXZ');povYaw=look.y;povPitch=look.x;}}else if(currentView!=='pov')controls.update();if(dirty){renderer.render(scene,camera);dirty=false;}});
  onReady();
  return()=>{engine.current=null;observer.disconnect();renderer.setAnimationLoop(null);controls.dispose();const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});geometries.forEach(g=>g.dispose());materials.forEach(m=>{m.map?.dispose();m.dispose();});renderer.dispose();renderer.domElement.remove();};
 },[]);
 useEffect(()=>{engine.current?.move(selection,view);},[selection,view,action?.reset]);
 useEffect(()=>{if(action?.zoom)engine.current?.zoom(action.zoom.factor);},[action?.zoom]);
 return <div className="canvas-host" ref={mount} role="img" aria-label="Model 3D Indonesia Arena. Pilih kursi menggunakan formulir atau klik kursi pada arena."/>;
}

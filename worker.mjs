/* Brasília na Porrada 4.0 — deterministic combat core, 60 Hz. No dependencies. */
'use strict';
const Combat=(()=>{
const DT=1/60,GROUND=448;
const ARENA={min:-184,max:1144,maxGap:830,extension:249};
const styles=[
 {speed:214,reach:14,wind:1.02,recover:1.10,role:'Controle de distância',strong:'Maior alcance nos golpes.',weak:'Recuperação lenta ao errar.',tip:'Mantenha o rival na ponta do chute.'},
 {speed:210,reach:0,wind:.90,recover:1.16,role:'Pressão e sequências',strong:'Golpes começam mais rápido.',weak:'Erros deixam uma abertura maior.',tip:'Emende os socos só quando acertar.'},
 {speed:230,reach:1,wind:1,recover:1.13,advance:12,role:'Avanço ofensivo',strong:'Golpes no chão avançam.',weak:'Demora para recuperar de ataques.',tip:'Pressione, mas não ataque no vazio.'},
 {speed:196,reach:4,wind:1.08,recover:1.03,parry:.14,guardRegen:21,guardUse:.88,role:'Defesa e punição',strong:'Defesa perfeita mais tolerante.',weak:'Mais lento para andar e atacar.',tip:'Defenda no timing e responda com soco.'},
 {speed:258,reach:-13,wind:.95,recover:.88,role:'Mobilidade e fintas',strong:'Mais rápido; recupera cedo.',weak:'Menor alcance dos golpes.',tip:'Entre, ataque e saia do alcance rival.'},
 {speed:204,reach:-9,wind:.93,recover:.90,role:'Pressão na curta distância',strong:'Recuperação rápida na curta distância.',weak:'Curto alcance e pouca velocidade.',tip:'Aproxime-se com defesa; pressione perto.'},
 {speed:208,reach:11,wind:1.10,recover:1.13,role:'Alcance e pressão',strong:'Segundo maior alcance.',weak:'Preparação e recuperação lentas.',tip:'Faça o rival errar antes de discursar.'},
 {speed:244,reach:-7,wind:.97,recover:.93,role:'Agilidade e contra-ataque',strong:'Agilidade para punir aberturas.',weak:'Precisa chegar perto para acertar.',tip:'Interrompa golpes anunciados pelo rival.'},
 {speed:190,reach:-12,wind:1.06,recover:1.08,advance:8,role:'Pressão de perto',strong:'Avança ao golpear no chão.',weak:'Curto alcance e passo lento.',tip:'Feche a distância com guarda; pressione perto.'},
 {speed:211,reach:10,wind:1.02,recover:1.12,role:'Alcance e réplica',strong:'Bom alcance nos golpes.',weak:'Fica exposto ao errar.',tip:'Acerte a ponta do chute e puna a aproximação.'},
 {speed:198,reach:3,wind:1.09,recover:1.04,parry:.13,guardRegen:20,guardUse:.91,role:'Guarda e resposta',strong:'Defesa perfeita mais tolerante.',weak:'Golpes começam mais devagar.',tip:'Defenda no instante certo e responda de perto.'},
 {speed:221,reach:8,wind:1.05,recover:1.08,role:'Distância calculada',strong:'Alcance com mobilidade moderada.',weak:'Preparação dos golpes mais lenta.',tip:'Faça o rival errar; entre com o golpe certo.'}
];
const legacySpecialDamage=[34,36,34,40,30,38,36,32,35,35,35,35];
const specials=[
 {damage:35,wind:0.286,strike:.23,recover:.62,chase:560,hits:4,sequence:1.08,beats:[0.0, 0.238, 0.562, 1.08],weights:[4, 6, 8, 17],push:340,desc:'Papelada, réplica e encerramento da pauta · 4 impactos'},
 {damage:35,wind:0.325,strike:.24,recover:.70,chase:555,hits:5,sequence:1.05,beats:[0.0, 0.147, 0.336, 0.598, 1.05],weights:[3, 4, 5, 6, 17],push:410,desc:'Sequência crescente e finalização de peso · 5 impactos'},
 {damage:35,wind:0.312,strike:.23,recover:.64,chase:650,hits:3,sequence:1.08,beats:[0.0, 0.454, 1.08],weights:[6, 8, 21],push:560,desc:'Arrancada e explosão de ondas sonoras · 3 impactos'},
 {damage:35,wind:0.416,strike:.26,recover:.86,chase:530,hits:3,sequence:1.12,beats:[0.0, 0.47, 1.12],weights:[6, 8, 21],push:450,desc:'Preparação solene e carimbada final · 3 impactos'},
 {damage:35,wind:0.221,strike:.21,recover:.54,chase:690,hits:4,sequence:1.02,beats:[0.0, 0.224, 0.53, 1.02],weights:[4, 6, 8, 17],push:390,desc:'Réplica rápida, giro e voadora · 4 impactos'},
 {damage:35,wind:0.377,strike:.25,recover:.78,chase:550,hits:3,sequence:1.13,beats:[0.0, 0.475, 1.13],weights:[6, 8, 21],push:430,desc:'Abraço, levantamento e arremesso · 3 impactos'},
 {damage:35,wind:0.364,strike:.25,recover:.74,chase:570,hits:4,sequence:1.1,beats:[0.0, 0.242, 0.572, 1.1],weights:[4, 6, 8, 17],push:410,desc:'Voz crescente e descarga de impacto · 4 impactos'},
 {damage:35,wind:0.247,strike:.22,recover:.58,chase:665,hits:4,sequence:1.05,beats:[0.0, 0.231, 0.546, 1.05],weights:[4, 6, 8, 17],push:400,desc:'Palma, giro e finalização ascendente · 4 impactos'},
 {damage:35,wind:0.3575,strike:.24,recover:.75,chase:560,hits:3,sequence:1.12,beats:[0.0, 0.47, 1.12],weights:[6, 8, 21],push:480,desc:'Avanço pesado e encontrão de palanque · 3 impactos'},
 {damage:35,wind:0.3185,strike:.24,recover:.69,chase:610,hits:4,sequence:1.08,beats:[0.0, 0.238, 0.562, 1.08],weights:[4, 6, 8, 17],push:425,desc:'Réplica, gancho e última palavra · 4 impactos'},
 {damage:35,wind:0.39,strike:.24,recover:.79,chase:550,hits:3,sequence:1.14,beats:[0.0, 0.479, 1.14],weights:[6, 8, 21],push:450,desc:'Palma de contenção e decisão com o livro · 3 impactos'},
 {damage:35,wind:0.2795,strike:.23,recover:.64,chase:625,hits:4,sequence:1.08,beats:[0.0, 0.238, 0.562, 1.08],weights:[4, 6, 8, 17],push:420,desc:'Golpes precisos e finalização calculada · 4 impactos'}
];
const ladderDifficulty=stage=>[0,.5,1,1.5,2][Math.max(0,Math.min(4,stage))];
const aiProfile=d=>({reaction:.34-.075*d,decision:.30-.075*d,jitter:.20-.05*d,defend:.20+.24*d,combo:.12+.39*d});
const moves={
 jab:{wind:.08,active:.07,recover:.16,damage:7,reach:131,stun:.28,push:25,cost:8,pose:1,level:'mid'},
 cross:{wind:.09,active:.07,recover:.18,damage:7,reach:144,stun:.28,push:25,cost:8,pose:1,level:'mid'},
 kick:{wind:.16,active:.09,recover:.24,damage:10,reach:185,stun:.30,push:80,cost:13,break:24,pose:2,level:'mid'},
 upper:{wind:.16,active:.26,recover:.43,damage:12,reach:120,stun:.55,push:20,lift:420,cost:18,pose:1,level:'high'},
 airPunch:{wind:.08,active:.16,recover:.20,damage:7,reach:145,stun:.28,push:90,cost:8,pose:1,level:'air'},
 airKick:{wind:.12,active:.20,recover:.24,damage:9,reach:170,stun:.32,push:130,cost:11,pose:2,level:'air'},
 special:{wind:.33,active:.16,recover:.43,damage:35,reach:220,stun:.45,push:360,cost:0,pose:1,level:'mid'}
};
const comboRoutes=[['punch','punch'],['punch','punch','kick'],['punch','upper']];
const allowedCommands=['punch','kick','upper','jump','special'];

function fighter(id,x,dir){return{id,x,y:0,vy:0,vx:0,dir,attackSerial:0,airUsed:false,jumpKind:null,airMove:0,landing:0,capturedBy:null,hp:140,guard:100,stamina:100,meter:0,stun:0,down:0,inv:0,dodge:0,dodgeCD:0,parryCD:0,parry:0,block:false,action:null,buffer:null,combo:0,comboDamage:0,comboTimer:0,hitChain:0,chainTimer:0,counter:0,move:0,flash:0,trail:0,wallLock:0,charge:0,stats:{hits:0,parries:0,dodges:0,maxCombo:0,damage:0,counters:0}}}
class Match{
 constructor(a=0,b=1,{difficulty=1,seed=1,training=false,multiplayer=false,roundSeconds=60,specials=true,introSeconds=4.2,refined=false,boss=false,bossTough=false,unifiedSpecial=false,specialLock=false}={}){this.specialLock=!!specialLock;this.unifiedSpecial=!!unifiedSpecial;this.bossTough=!!bossTough;this.refined=!!refined;this.boss=!!boss&&!multiplayer&&!training;this.seed=seed>>>0;this.difficulty=Math.max(0,Math.min(2,difficulty));this.brains=[0,1].map(()=>({samples:[],sampleAt:-1,clock:.1,guard:0,move:0,feint:0,lastSerial:-1,history:[]}));this.training=training;this.multiplayer=multiplayer;this.otherInput={left:false,right:false,guard:false};this.f=[fighter(a,280,1),fighter(b,680,-1)];this.untimed=roundSeconds===0;this.specials=specials;this.time=this.untimed?0:roundSeconds;this.t=0;this.freeze=0;this.events=[];this.shots=[];this.over=false;this.winner=null;this.overtime=false;this.aiClock=.55;this.aiBlock=0;this.aiMove=0;this.input={left:false,right:false,guard:false};this.lastTap=[-9,-9];this.introDuration=introSeconds;this.intro=introSeconds;this.roundDamage=[0,0]}
 random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296}
 emit(type,data={}){this.events.push({type,...data})}
 clear(){this.input.left=this.input.right=this.input.guard=false;this.f.forEach(f=>{f.block=false;f.buffer=null;f.charge=0})}
 command(i,key){if(!allowedCommands.includes(key))return false;if(!this.specials&&key==='special')return false;if(this.over||this.intro>0)return false;const f=this.f[i];if(f.capturedBy!==null||this.specialLock&&f.specialLocked)return false;if(f.landing>0){if(f.landing<=.12)f.buffer={key,ttl:.16};return false}if(key==='jump'){if(f.y===0&&!f.action&&f.stun<=0&&!f.down&&!f.dodge&&f.stamina>=8){f.vy=820;f.y=.01;f.airUsed=false;f.jumpKind='empty';f.stamina-=8;f.block=false;f.airMove=(this.multiplayer||i===0?(+(i===0?this.input:this.otherInput).right)-(+(i===0?this.input:this.otherInput).left):f.dir)*285;f.vx=0;this.emit('jump',{i});return true}return false}

 if(!allowedCommands.includes(key))return false;
 if(f.stun>0||f.down>0)return false;
 if(f.y>0){if(f.airUsed||key==='upper'||key==='special')return false;return this.begin(i,key==='punch'?'airPunch':'airKick',[key]);}
 if(f.action){
  const ac=f.action;if(ac.name==='special'||key==='special')return false;
  const route=[...(ac.route||[]),key],can=ac.connected&&comboRoutes.some(r=>route.length<=r.length&&route.every((v,n)=>r[n]===v));
  if(can&&ac.t>=ac.m.wind+ac.m.active){const name=key==='punch'?(ac.name==='upper'?'jab':'cross'):key;return this.begin(i,name,route)}
  if(can||ac.total-ac.t<=.12)f.buffer={key,ttl:.14};return false;
 }
 let name=key==='punch'?'jab':key;if(!moves[name])return false;

 return this.begin(i,name,[key]);}

 begin(i,name,route=[]){if(name==='special'&&!this.specials)return false;const f=this.f[i];let m={...moves[name]};const st=styles[f.id];if(name!=='special'){m.wind*=st.wind;m.recover*=st.recover;}if(name==='special'){if(f.meter<100)return false;f.meter=0;m={...m,...specials[f.id],damage:this.unifiedSpecial?35:legacySpecialDamage[f.id],active:.16,reach:122,stun:1.1,pose:f.id===1||f.id===4?2:1,grab:false};this.emit('special',{i,id:f.id})}
 if(f.stamina<m.cost){this.emit('tired',{i});return false}f.stamina-=m.cost;f.attackSerial++;if(name==='airPunch'||name==='airKick'){f.airUsed=true;f.jumpKind='attack'}if(name==='upper'){f.airUsed=true;f.jumpKind='upper';f.airMove=f.dir*75;}if(st.advance&&f.y===0&&name!=='special'){const gap=Math.abs(f.x-this.f[1-i].x);f.x+=f.dir*Math.min(st.advance,Math.max(0,gap-65));}f.block=false;f.charge=0;f.buffer=null;f.action={name,route,m,t:0,total:m.wind+m.active+m.recover,hit:false,hit2:false,connected:false,spawned:false,phase:name==='special'?'intro':null,phaseTime:0};return true}
 setBlock(i,v){const f=this.f[i];if(f.capturedBy!==null||this.specialLock&&f.specialLocked){f.block=false;return;}if(v&&!f.block&&(f.y===0||this.f[1-i].action?.name==='special')&&!f.action&&f.landing<=0&&f.stun<=0&&!f.down&&(!f.dodge||this.f[1-i].action?.name==='special')&&f.guard>4){f.block=true;if(f.parryCD<=0){f.parry=styles[f.id].parry||.115;f.parryCD=.55}}else if(!v)f.block=false}
 ai(dt){this.controlAI(1,dt)}
 controlAI(i,dt=DT){if(this.boss&&i===1)return this.controlBoss(i,dt);if(this.training||this.over||this.intro>0)return;const f=this.f[i],op=this.f[1-i],d=this.difficulty,profile=aiProfile(d),s=this.brains[i],input=i===0?this.input:this.otherInput;
 // Only observable fighter state enters this delayed perception queue. Never inspect opponent input.
 if(s.sampleAt!==this.t){s.sampleAt=this.t;const a=op.action;s.samples.push({at:this.t,x:op.x,y:op.y,hp:op.hp,block:op.block,action:a?{name:a.name,t:a.t,wind:a.m.wind,active:a.m.active,total:a.total,serial:op.attackSerial}:null})}
 while(s.samples.length>1&&s.samples[1].at<=this.t-profile.reaction)s.samples.shift();const seen=s.samples[0];if(!seen||seen.at>this.t-profile.reaction){input.left=input.right=input.guard=false;f.move=0;return}
 const a=seen.action,dist=Math.abs(seen.x-f.x),dir=seen.x>=f.x?1:-1,reach=131+styles[f.id].reach;
 if(a&&a.serial!==s.lastSerial){s.lastSerial=a.serial;s.history.push(a.name);if(s.history.length>5)s.history.shift()}
 s.clock-=dt;s.guard=Math.max(0,s.guard-dt);s.feint=Math.max(0,s.feint-dt);let move=s.move;input.guard=s.guard>0;this.setBlock(i,input.guard);
 if(s.clock<=0){s.clock=profile.decision+this.random()*profile.jitter;s.move=dist>reach-8?dir:dist<80?-dir:0;const r=this.random();
 if(f.capturedBy!==null||f.stun>0||f.down>0){s.move=0}
 else if(f.stamina<26){s.move=-dir;if(dist<230&&r<.3+d*.2)s.guard=.18}
 else if(f.y>0){s.move=0;if(!f.airUsed&&dist<180&&r<.35+d*.25)this.command(i,r<.45?'punch':'kick')}
 else if(f.action){if(f.action.connected&&f.action.name==='jab'&&r<profile.combo)this.command(i,'punch');else if(d>=.75&&f.action.connected&&f.action.name==='cross'&&r<profile.combo)this.command(i,'kick');s.move=0}
 else if(a&&dist<250&&(a.name==='special'||a.t<a.wind+a.active)&&r<profile.defend){s.guard=.22+this.random()*.14;s.move=0;this.emit('aiDecision',{i,kind:'defend',observedAt:seen.at});}
 else if(d>=1.5&&s.history.length>=3&&s.history.slice(-3).every(n=>n===s.history.at(-1))&&dist<190&&r<.32){s.guard=.20;s.move=-dir;this.emit('aiDecision',{i,kind:'adapt',observedAt:seen.at});}
 else if(d>=.5&&a&&a.name!=='special'&&a.t>=a.wind+a.active&&dist<190+styles[f.id].reach){this.command(i,dist<reach?'punch':'kick');this.emit('aiDecision',{i,kind:'punish',observedAt:seen.at});}
 else if(d<.5&&r<.18){s.move=0;s.clock+=.18}
 else if(f.meter>=100&&this.specials&&dist<310&&r<.22+d*.12&&!seen.block){this.command(i,'special')}
 else if(seen.y>35&&dist<145+styles[f.id].reach&&d>=.5){this.command(i,'upper')}
 else if(d>=1.5&&dist>170&&dist<270&&r<.20){s.feint=.20;s.move=-dir;this.emit('aiDecision',{i,kind:'feint',observedAt:seen.at})}
 else if(dist<reach+(d<.5?12:0)){this.command(i,r<.45?'punch':r<.65?'punch':r<.85?'kick':'kick')}
 else if(dist<190+styles[f.id].reach&&r<.65){this.command(i,'kick')}
 else if(dist>180&&dist<300&&r>.88&&d>=.5){this.command(i,'jump')}
 if(f.guard<22){s.guard=0;s.move=-dir}if((f.x<ARENA.min+25&&s.move<0)||(f.x>ARENA.max-25&&s.move>0))s.move=dir;
 }
 move=s.feint>0?-dir:s.move;input.left=move<0;input.right=move>0;input.guard=s.guard>0;f.move=move;this.setBlock(i,input.guard);
 }
 controlBossTough(i,dt){
 if(this.training||this.over||this.intro>0)return;
 const f=this.f[i],op=this.f[1-i],s=this.brains[i],input=this.otherInput,st=styles[f.id];
 const reaction=.15; // delayed observable state; never read player commands
 if(s.sampleAt!==this.t){s.sampleAt=this.t;const a=op.action;s.samples.push({at:this.t,x:op.x,y:op.y,block:op.block,stun:op.stun,down:op.down,guard:op.guard,action:a?{name:a.name,t:a.t,wind:a.m.wind,active:a.m.active,total:a.total,serial:op.attackSerial,connected:a.connected,phase:a.phase}:null})}
 while(s.samples.length>1&&s.samples[1].at<=this.t-reaction)s.samples.shift();const seen=s.samples[0];if(!seen||seen.at>this.t-reaction){input.left=input.right=input.guard=false;f.move=0;return}
 if(!s.phase&&f.hp<=60){s.phase=1;this.emit('bossPhase',{i,id:f.id})}
 const a=seen.action,dist=Math.abs(seen.x-f.x),dir=seen.x>=f.x?1:-1,reach=131+st.reach,phase=!!s.phase;
 if(a&&a.serial!==s.lastSerial){s.lastSerial=a.serial;s.history.push(a.name);if(s.history.length>6)s.history.shift()}
 const repeated=s.history.length>=3&&s.history.slice(-3).every(n=>n===s.history.at(-1));
 s.clock-=dt;s.guard=Math.max(0,s.guard-dt);s.feint=Math.max(0,s.feint-dt);
 if(s.clock<=0){s.clock=(phase?.07:.10)+this.random()*.045;const r=this.random();let kind='position';
 const target=reach-18-(phase?8:0);s.move=dist>target?dir:dist<72?-dir:0;
 if(f.capturedBy!==null||f.stun>0||f.down>0){s.move=0;s.guard=0}
 else if(f.y>0){s.move=0;if(!f.airUsed&&dist<180&&r<.85)this.command(i,r<.4?'punch':'kick');kind='aerial'}
 else if(f.action){s.move=0;if(f.action.connected&&r<(phase?.98:.94)){if(f.action.name==='jab')this.command(i,'punch');else if(f.action.name==='cross')this.command(i,'kick')}kind='combo'}
 else if(f.stamina<24||f.guard<16){s.move=-dir;s.guard=f.guard>20&&a&&dist<230?.16:0;kind='recover'}
 else if(a&&(a.name==='special'&&a.phase!=='recover'||a.t<a.wind+a.active&&dist<235)&&r<Math.min(.90,(phase?.86:.80)+(repeated?.04:0))){s.guard=.19+this.random()*.10;s.move=0;kind='defend'}
 else if(seen.y>35&&dist<reach&&r<.9){s.guard=0;this.command(i,'upper');kind='anti-air'}
 else if(f.meter>=100&&this.specials&&!seen.block&&!seen.down&&((a&&a.t>=a.wind+a.active&&a.total-a.t>.23)||seen.stun>.15||dist>210&&dist<370&&r<(phase?.40:.22))){s.guard=0;this.command(i,'special');kind='special-opening'}
 else if(a&&a.name!=='special'&&a.t>=a.wind+a.active&&dist<190+st.reach){s.guard=0;this.command(i,dist<reach?'punch':'kick');kind='punish'}
 else if(seen.block&&dist<180+st.reach&&r<(phase?.65:.50)){s.guard=0;this.command(i,'kick');kind='break-pressure'}
 else if(dist>185&&dist<260&&!seen.block&&r<.09){s.guard=0;this.command(i,'jump');kind='jump'}
 else if(dist<reach){s.guard=0;this.command(i,r<.55?'punch':r<.8?'punch':'kick');kind='pressure'}
 else if(dist<190+st.reach&&r<(f.id===0||f.id===6?.9:.76)){s.guard=0;this.command(i,'kick');kind='reach'}
 else if(!phase&&dist>195&&dist<245&&a&&r<.08){s.feint=.12;s.move=-dir;kind='bait'}
 if((f.x<ARENA.min+30&&s.move<0)||(f.x>ARENA.max-30&&s.move>0)){s.move=dir;s.feint=0}
 this.emit('aiDecision',{i,kind:'boss-'+kind,observedAt:seen.at});
 }
 const move=s.feint>0?-dir:s.move;input.left=move<0;input.right=move>0;input.guard=s.guard>0;f.move=move;this.setBlock(i,input.guard);
 }
 controlBoss(i,dt){
 if(this.bossTough)return this.controlBossTough(i,dt);
 if(this.training||this.over||this.intro>0)return;
 const f=this.f[i],op=this.f[1-i],s=this.brains[i],input=this.otherInput;
 // These are choices, not stat multipliers. Observation is delayed by at least 220 ms.
 const profiles=[{range:166,guard:.72,combo:.70,bait:.20},{range:100,guard:.62,combo:.94,bait:.08},{range:122,guard:.63,combo:.83,bait:.26},{range:142,guard:.82,combo:.73,bait:.12},{range:127,guard:.67,combo:.76,bait:.34},{range:94,guard:.69,combo:.89,bait:.09},{range:169,guard:.71,combo:.72,bait:.16},{range:120,guard:.73,combo:.80,bait:.29}];
 const p=profiles[f.id]||profiles[f.id%8],reaction=.22;
 if(s.sampleAt!==this.t){s.sampleAt=this.t;const a=op.action;s.samples.push({at:this.t,x:op.x,y:op.y,hp:op.hp,block:op.block,stun:op.stun,down:op.down,action:a?{name:a.name,t:a.t,wind:a.m.wind,active:a.m.active,total:a.total,serial:op.attackSerial,connected:a.connected,phase:a.phase}:null})}
 while(s.samples.length>1&&s.samples[1].at<=this.t-reaction)s.samples.shift();const seen=s.samples[0];
 if(!seen||seen.at>this.t-reaction){input.left=input.right=input.guard=false;f.move=0;return}
 const a=seen.action,dist=Math.abs(seen.x-f.x),dir=seen.x>=f.x?1:-1,reach=131+styles[f.id].reach;
 if(a&&a.serial!==s.lastSerial){s.lastSerial=a.serial;s.history.push(a.name);if(s.history.length>6)s.history.shift()}
 if(!s.phase&&f.hp<=60){s.phase=1;this.emit('bossPhase',{i,id:f.id})}
 const repeated=s.history.length>=3&&s.history.slice(-3).every(n=>n===s.history.at(-1));
 const range=p.range-(s.phase?12:0);s.clock-=dt;s.guard=Math.max(0,s.guard-dt);s.feint=Math.max(0,s.feint-dt);
 if(s.clock<=0){s.clock=.13+this.random()*.14;const r=this.random();let kind='position';s.move=dist>range+12?dir:dist<range-24?-dir:0;
 if(f.capturedBy!==null||f.stun>0||f.down>0){s.move=0;s.guard=0}
 else if(f.y>0){s.move=0;if(!f.airUsed&&dist<180&&r<.85)this.command(i,r<.4?'punch':'kick');kind='aerial'}
 else if(f.action){s.move=0;if(f.action.connected&&r<p.combo){if(f.action.name==='jab')this.command(i,'punch');else if(f.action.name==='cross')this.command(i,'kick')}kind='combo'}
 else if(f.stamina<30||f.guard<20){s.move=-dir;s.guard=f.guard>=20&&a&&dist<230?.22:0;kind='recover'}
 else if(r<.10){s.guard=0;s.move=0;s.clock+=.13;kind='hesitate'}
 else if(a&&(a.name==='special'&&a.phase!=='recover'||a.t<a.wind+a.active&&dist<240)&&r<p.guard){s.guard=.25+this.random()*.15;s.move=0;kind='defend'}
 else if(repeated&&dist<210&&r<.58){s.guard=.24;s.move=-dir;kind='adapt'}
 else if(f.meter>=100&&this.specials&&!seen.block&&dist<260&&(seen.stun>.18||a&&a.name!=='special'&&a.total-a.t>.28&&a.t>=a.wind+a.active)&&r<.74){s.guard=0;this.command(i,'special');kind='special-opening'}
 else if(a&&a.name!=='special'&&a.t>=a.wind+a.active&&!a.connected&&dist<190+styles[f.id].reach){s.guard=0;this.command(i,dist<reach?'punch':'kick');kind='punish'}
 else if(f.id===7&&a&&a.t<a.wind&&dist<reach&&r<.65){s.guard=0;this.command(i,'punch');kind='interrupt'}
 else if(seen.y>35&&dist<reach&&r<.8){s.guard=0;this.command(i,'upper');kind='anti-air'}
 else if(dist>140&&dist<255&&r<p.bait){s.feint=.16+this.random()*.12;s.move=-dir;kind='bait'}
 else if(dist>185&&dist<260&&!seen.block&&r<.09){s.guard=0;this.command(i,'jump');kind='jump'}
 else if(dist<reach){s.guard=0;this.command(i,seen.block&&r>.55?'kick':r<.78?'punch':'kick');kind='pressure'}
 else if(dist<190+styles[f.id].reach&&r<((f.id===0||f.id===6)?.84:.53)){s.guard=0;this.command(i,'kick');kind='reach'}
 else if((f.id===1||f.id===2||f.id===5)&&dist<230){s.move=dir;kind='close'}
 if((f.x<ARENA.min+30&&s.move<0)||(f.x>ARENA.max-30&&s.move>0)){s.move=dir;s.feint=0}
 this.emit('aiDecision',{i,kind:'boss-'+kind,observedAt:seen.at});
 }
 let move=s.feint>0?-dir:s.move;if((f.x<ARENA.min+15&&move<0)||(f.x>ARENA.max-15&&move>0))move=dir;
 input.left=move<0;input.right=move>0;input.guard=s.guard>0;f.move=move;this.setBlock(i,input.guard);
 }
 damage(i,j,m,name,scale=1){const a=this.f[i],b=this.f[j];if(name!=='special'&&b.juggleFollowUsed&&b.y>0)return false;if(name!=='special'&&(b.inv>0||b.down>0)){this.emit('evade',{i:j});return false}if(b.counter>0&&!(this.unifiedSpecial&&name==='special')){b.counter=0;b.action=null;a.action=null;a.hp=Math.max(0,a.hp-29);a.stun=.5;a.vx=-a.dir*370;b.stats.damage+=29;this.roundDamage[j]+=29;this.freeze=.085;this.emit('counter',{i:j,x:a.x,y:a.y});return false}
 if(b.block&&!m.grab){if(b.parry>0){b.parry=0;a.action=null;a.stun=.52;a.vx=-a.dir*160;b.meter=Math.min(100,b.meter+15);b.stamina=Math.min(100,b.stamina+15);b.stats.parries++;this.freeze=.09;this.emit('parry',{i:j,x:b.x,y:b.y});return false}b.guard=Math.max(0,b.guard-(m.break||m.damage*1.6)*(styles[b.id].guardUse||1));b.vx=a.dir*80;b.stamina=Math.max(0,b.stamina-3);a.meter=Math.min(100,a.meter+(name==='special'?0:1));this.freeze=.025;this.emit('block',{i:j,x:b.x,y:b.y});if(b.guard<=0){b.block=false;b.stun=.85;b.action=null;this.emit('guardbreak',{i:j})}return false}
 let counter=!!b.action&&(b.action.name==='special'||b.action.t<b.action.m.wind),chain=b.stun>0&&a.comboTimer>0;if(!m.follow){a.combo=chain?a.combo+1:1;a.comboDamage=chain?a.comboDamage:0;}let scaling=Math.max(.70,1-(a.combo-1)*.10);let dmg=Math.min(b.hp,m.fixedDamage??Math.round(m.damage*scaling*scale*(counter?1.20:1)));if(counter&&!m.follow)a.stats.counters++;const armored=this.unifiedSpecial&&b.action?.name==='special'&&(b.action.phase!=='recover'||b.action.phaseTime===0);if(b.action?.name==='special'&&!this.unifiedSpecial)this.emit('specialInterrupted',{i:j,by:i});b.hp=Math.max(0,b.hp-dmg);a.comboDamage+=dmg;a.comboTimer=1.1;a.stats.hits++;a.stats.damage+=dmg;a.stats.maxCombo=Math.max(a.stats.maxCombo,a.combo);this.roundDamage[i]+=dmg;if(!armored||b.hp<=0){b.action=null;b.buffer=null;b.counter=0;b.block=false;b.stun=m.stun;b.vx=a.dir*m.push;b.vy=m.lift||b.vy;if(m.lift)b.y=Math.max(b.y,1)}else this.emit('specialArmor',{i:j});if(this.specialLock&&name==='special'){b.specialLocked=true;b.buffer=null;b.dodge=0;b.inv=0;b.parry=0;b.counter=0;b.charge=0;}b.flash=.12;if(name!=='special'){a.meter=Math.min(100,a.meter+9);b.meter=Math.min(100,b.meter+5)}else if(!m.follow)b.meter=Math.min(100,b.meter+8);if(a.action)a.action.connected=true;
 if(name!=='special'&&a.combo>=3){b.down=.45;b.stun=.6;b.vy=230;b.y=Math.max(b.y,1);b.vx=a.dir*300;}if(name==='upper'&&!b.block)b.juggled=true;else if(name!=='special'&&b.juggled&&b.y>0){b.juggleFollowUsed=true;b.down=.5;b.vy=Math.min(b.vy,-80);}
 if((!armored||b.hp<=0)&&(name==='heavy'||name==='finisher'||name==='special'&&m.final!==false)){b.down=name==='special'?1.08:.42;b.stun=name==='special'?1.12:.62;b.vy=name==='special'?460:250;b.y=Math.max(b.y,1)}this.freeze=name==='jab'?.045:name==='special'?(m.final===false?.055:.1):.075;this.emit('hit',{i,j,x:b.x,y:b.y,damage:dmg,combo:a.combo,total:a.comboDamage,counter,heavy:!['jab','cross','airPunch'].includes(name),name,follow:!!m.follow});return true}
 advanceSpecial(i,dt,intents){const f=this.f[i],o=this.f[1-i],a=f.action,m=a.m;a.t+=dt;a.phaseTime+=dt;f.dir=o.x>=f.x?1:-1;f.vx=0;
 if(a.phase==='intro'){if(a.phaseTime>=m.wind){a.phase='chase';a.phaseTime=0}}
 else if(a.phase==='chase'){let gap=Math.abs(f.x-o.x);let speed=m.chase*(this.specialLock?2:1);if(f.id===1)speed*=.85+.3*Math.abs(Math.sin(a.phaseTime*9));if(f.id===2)speed*=Math.min(1.2,.75+a.phaseTime*.65);if(f.id===3)speed*=.65+.35*Math.abs(Math.sin(a.phaseTime*10));if(f.id===4)speed*=.5+.8*Math.abs(Math.sin(a.phaseTime*15));if(f.id===5)speed*=.85+.2*Math.sin(a.phaseTime*7);if(f.id===6)speed*=.8+.25*Math.abs(Math.sin(a.phaseTime*12));if(f.id===8)speed*=.9+.15*Math.abs(Math.sin(a.phaseTime*12));if(f.id===9)speed*=.9+.15*Math.abs(Math.sin(a.phaseTime*17));if(f.id===10)speed*=.85+.2*Math.min(1,a.phaseTime);if(f.id===11)speed*=1.02;if(f.id===7)speed*=.8+.3*Math.abs(Math.sin(a.phaseTime*18));if(gap>105)f.x+=f.dir*Math.min(speed*dt,gap-102);f.y+=(o.y-f.y)*Math.min(1,dt*15);f.vy=0;if(Math.abs(f.x-o.x)<=112){a.phase='strike';a.phaseTime=0;this.emit('specialStrike',{i,id:f.id})}}
 else if(a.phase==='strike'){// Follow the target through jumps and evasive movement; guard is checked at the first impact.
 let gap=Math.abs(f.x-o.x);if(gap>105)f.x+=f.dir*Math.min(900*(this.specialLock?2:1)*dt,gap-102);f.y+=(o.y-f.y)*Math.min(1,dt*20);f.vy=0;
 if(a.phaseTime>=m.strike&&Math.abs(f.x-o.x)<=125&&!a.hit){a.hit=true;intents.push({i,j:1-i,m,name:'special',ref:a});a.phase='recover';a.phaseTime=0}}
 else if(a.phase==='sequence'){f.vx=0;o.vx=0;o.vy=0;o.stun=Math.max(o.stun,.12);if(a.phaseTime>=a.nextPart){const n=a.part++,last=n===a.parts.length-1;this.damage(i,1-i,{...m,fixedDamage:a.parts[n],follow:true,final:last,push:last?m.push:0,stun:last?1.1:.2},'special');this.emit('specialBeat',{i,id:f.id,n:n+1,total:a.parts.length,x:o.x,y:o.y});if(last){o.capturedBy=null;a.phase='recover';a.phaseTime=0;this.emit('specialImpact',{i,id:f.id,x:o.x,y:o.y})}else a.nextPart=m.beats?.[a.part]??a.nextPart+m.sequence/(a.parts.length-1)}}
 else if(a.phase==='recover'&&a.phaseTime>=m.recover){f.action=null;f.vy=0}}
 step(dt=DT){if(this.over)return;if(this.intro>0){this.intro=Math.max(0,this.intro-dt);return}if(this.freeze>0){this.freeze-=dt;return}this.t+=dt;if(!this.training&&!this.untimed&&!this.f.some(f=>f.action?.name==='special'))this.time=Math.max(0,this.time-dt);if(this.multiplayer){this.f[1].move=(+this.otherInput.right)-(+this.otherInput.left);this.setBlock(1,this.otherInput.guard)}else this.ai(dt);const p=this.f[0];p.move=(+this.input.right)-(+this.input.left);this.setBlock(0,this.input.guard);let intents=[];const previousX=this.f.map(f=>f.x);
 for(let i=0;i<2;i++){const f=this.f[i],o=this.f[1-i];for(const k of ['stun','down','inv','dodge','dodgeCD','parryCD','parry','counter','flash','wallLock','landing','comboTimer','chainTimer'])f[k]=Math.max(0,f[k]-dt);if(this.specialLock&&f.specialLocked&&f.capturedBy===null&&f.down<=0&&f.stun<=0&&f.y<=0){f.specialLocked=false;}if(f.comboTimer<=0){f.combo=0;f.comboDamage=0}if(f.buffer){f.buffer.ttl-=dt;if(f.buffer.ttl<=0)f.buffer=null;else if(!f.action&&f.stun<=0&&!f.down&&!f.dodge){let key=f.buffer.key;f.buffer=null;this.command(i,key)}else if(f.action?.connected&&f.action.t>=f.action.m.wind+f.action.m.active){const key=f.buffer.key;f.buffer=null;this.command(i,key)}}
 if(!f.action&&f.stun<=0&&f.dodge<=0){if(f.y===0)f.dir=o.x>=f.x?1:-1;f.stamina=Math.min(100,f.stamina+(f.block?8:23)*dt)}if(f.block){f.guard=Math.max(0,f.guard-7*dt);if(f.guard<=0){f.block=false;f.stun=.6;this.emit('guardbreak',{i})}}else f.guard=Math.min(100,f.guard+(styles[f.id].guardRegen||18)*dt);
 if(f.stun>0||f.down>0)f.block=false;
 if(f.y>0||f.vy>0){f.y+=f.vy*dt;f.vy-=(f.vy>0?1900:2400)*dt;if(f.y<=0){f.y=0;f.vy=0;f.airMove=0;if(f.jumpKind){f.landing=f.jumpKind==='upper'?.26:f.jumpKind==='attack'?.13:.045;if(f.action&&['upper','airPunch','airKick'].includes(f.action.name))f.action=null;}f.jumpKind=null;f.airUsed=false;if(f.stun<=0&&!f.down)f.dir=o.x>=f.x?1:-1;f.juggled=false;f.juggleFollowUsed=false;this.emit('land',{i,x:f.x});if(f.down<=0&&f.stun<=0)f.vx*=.3}}
 if(f.y>0&&f.stun<=0&&!f.down&&f.capturedBy===null&&f.action?.name!=='special')f.x+=f.airMove*dt;
 if(f.y===0&&f.landing<=0&&!f.action&&f.stun<=0&&!f.block&&!f.dodge&&!f.down&&!(this.specialLock&&f.specialLocked)){f.x+=f.move*styles[f.id].speed*(f.y>0?.7:1)*dt}f.x+=f.vx*dt;if(f.dodge<=0)f.vx*=Math.exp(-8*dt);
 const ac=f.action;if(ac?.name==='special'){this.advanceSpecial(i,dt,intents)}else if(ac){ac.t+=dt;const m=ac.m;if(ac.name==='upper'&&!ac.launched&&ac.t>=m.wind){ac.launched=true;f.vy=650;f.y=.01;this.emit('jump',{i})}if(ac.name==='airKick'&&f.vy>0)ac.t=Math.min(ac.t,m.wind);if(ac.t>=m.wind&&ac.t<m.wind+m.active&&!ac.hit){const dy=o.y-f.y,vertical=ac.name==='upper'?dy>-90&&dy<185:ac.name==='airKick'?dy>-175&&dy<100:Math.abs(dy)<100;const forward=(o.x-f.x)*f.dir>=-24;const activeDirection=ac.name!=='upper'||f.vy>0;const descending=ac.name!=='airKick'||f.vy<=0;if(Math.abs(f.x-o.x)<=m.reach+styles[f.id].reach&&vertical&&forward&&activeDirection&&descending){ac.hit=true;intents.push({i,j:1-i,m,name:ac.name})}}
 if(ac.t>=m.wind+m.active&&!ac.checked){ac.checked=true;if(!ac.hit){ac.total+=['kick','heavy','upper','finisher'].includes(ac.name)?.12:.035;this.emit('whiff',{i,name:ac.name})}}
 if(ac.t>=ac.total&&!(ac.name==='upper'&&f.y>0)){f.action=null;f.counter=0}}
 if(f.x<ARENA.min||f.x>ARENA.max){f.x=Math.max(ARENA.min,Math.min(ARENA.max,f.x));if(Math.abs(f.vx)>230&&f.stun>0&&f.wallLock<=0){f.vx=-f.vx*.55;f.wallLock=1;this.emit('wall',{i,x:f.x})}else f.vx=0}
 }
 let [a,b]=this.f;if(Math.abs(a.x-b.x)<62&&Math.abs(a.y-b.y)<115){let d=a.x<=b.x?1:-1,over=(62-Math.abs(a.x-b.x))/2;a.x-=d*over;b.x+=d*over;a.x=Math.max(ARENA.min,Math.min(ARENA.max,a.x));b.x=Math.max(ARENA.min,Math.min(ARENA.max,b.x))}
 // Keep both fighters on screen without pulling an idle opponent.
 const gap=Math.abs(a.x-b.x);if(gap>ARENA.maxGap){const dir=a.x<=b.x?1:-1,excess=gap-ARENA.maxGap,oa=Math.max(0,(previousX[0]-a.x)*dir),ob=Math.max(0,(b.x-previousX[1])*dir),sum=oa+ob;a.x+=dir*excess*(sum?oa/sum:.5);b.x-=dir*excess*(sum?ob/sum:.5);}
 for(const shot of this.shots){shot.x+=shot.vx*dt;shot.ttl-=dt;let b=this.f[1-shot.i];if(Math.abs(shot.x-b.x)<50&&Math.abs(b.y-shot.y+95)<100){shot.ttl=0;intents.push({i:shot.i,j:1-shot.i,m:shot.m,name:'special'})}}this.shots=this.shots.filter(s=>s.ttl>0&&s.x>ARENA.min-65&&s.x<ARENA.max+65);
 // Legacy interruptions remain replay-compatible. New supers absorb hitstun but take damage.
 for(const h of intents.filter(h=>h.name!=='special'))this.damage(h.i,h.j,h.m,h.name);
 const supers=intents.filter(h=>h.name==='special'&&this.f[h.i].action===h.ref&&(!this.unifiedSpecial||this.f[h.i].hp>0&&this.f[h.j].hp>0));
 if(this.unifiedSpecial&&supers.length&&supers.some(h=>{const o=this.f[h.j];return o.hp>0&&o.action?.name==='special'&&(o.action.phase!=='recover'||o.action.phaseTime===0)})){
 // Two committed supers trade their full damage. No player-index advantage or zero-damage cancellation.
 for(const f of this.f){f.action=null;f.block=false;f.parry=0;f.counter=0;f.capturedBy=null}
 for(let i=0;i<2;i++){const sp=specials[this.f[i].id];this.damage(i,1-i,{...sp,fixedDamage:35,stun:1.1,final:true,push:sp.push},'special');this.emit('specialImpact',{i,id:this.f[i].id,x:this.f[1-i].x,y:this.f[1-i].y})}this.emit('specialTrade');
 }else if(supers.length===2){for(const f of this.f){f.action=null;f.stun=.35;f.vx=-f.dir*180}this.freeze=.12;this.emit('specialClash')}
 else for(const h of supers){const f=this.f[h.i],o=this.f[h.j],ac=h.ref,m=h.m;const chain=o.stun>0&&f.comboTimer>0,nextCombo=chain?f.combo+1:1,counter=!!o.action&&(o.action.name==='special'||o.action.t<o.action.m.wind);const total=Math.min(o.hp,this.unifiedSpecial?35:Math.round(m.damage*Math.max(.48,1-(nextCombo-1)*.12)*(counter?(styles[f.id].counter||1.15):1)));const parts=Array.from({length:m.hits},(_,n)=>Math.floor(total*(m.weights?.[n]??35/m.hits)/35));parts[parts.length-1]+=total-parts.reduce((a,b)=>a+b,0);
 if(this.damage(h.i,h.j,{...m,fixedDamage:parts[0],final:m.hits===1,push:m.hits===1?m.push:0,stun:m.hits===1?1.1:m.sequence+.15},'special')){this.emit('specialBeat',{i:h.i,id:f.id,n:1,total:m.hits,x:o.x,y:o.y});ac.connected=true;if(m.hits>1){o.capturedBy=h.i;ac.phase='sequence';ac.phaseTime=0;ac.parts=parts;ac.part=1;ac.nextPart=m.beats?.[1]??m.sequence/(m.hits-1)}else this.emit('specialImpact',{i:h.i,id:f.id,x:o.x,y:o.y})}
 else if(f.action===ac){ac.phase='recover';ac.phaseTime=0;this.emit('specialBlocked',{i:h.i})}}
 if(this.training){for(const f of this.f)if(f.hp<=0){f.hp=140;f.stun=.5;f.inv=.6}return}
 if(a.hp<=0||b.hp<=0){this.over=true;this.winner=a.hp===b.hp?-1:a.hp>b.hp?0:1;this.emit('ko',{winner:this.winner})}else if(this.overtime&&a.hp!==b.hp&&!this.f.some(f=>f.capturedBy!==null)){this.over=true;this.winner=a.hp>b.hp?0:1;this.emit('ko',{winner:this.winner})}else if(!this.untimed&&this.time<=0){if(a.hp===b.hp&&!this.overtime){this.overtime=true;this.time=15;this.emit('overtime')}else{this.over=true;this.winner=a.hp===b.hp?-1:a.hp>b.hp?0:1;this.emit('ko',{winner:this.winner})}}
 }
}
return{ARENA,Match,moves,styles,specials,ladderDifficulty,aiProfile,DT,GROUND,version:'8.9.7'};})();
if(typeof module!=='undefined')module.exports=Combat;

const VERSION='8.9.7',DIR='__public_directory_62';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const validName=(s,min=2,max=20)=>typeof s==='string'&&s.trim().length>=min&&s.trim().length<=max&&/^[\p{L}\p{N} _.'!?-]+$/u.test(s.trim());
const validSettings=s=>s&&validName(s.name,3,32)&&[0,30,45,60].includes(s.seconds)&&typeof s.specials==='boolean'&&['public','private'].includes(s.visibility);
export class DuelRoom{
 constructor(ctx,env){this.ctx=ctx;this.env=env;this.players=[null,null];this.phase='waiting';this.round=1;this.wins=[0,0];this.timer=null;this.expires=Date.now()+15*60000;this.match=null;this.frame=0;this.wait=0;this.last=0;this.acc=0;this.stage=0;this.closed=false;this.settings=null;this.code='';this.hostTicket='';this.lastListing=0;ctx.blockConcurrencyWhile(async()=>{const s=await ctx.storage.get('room');if(s){Object.assign(this,s);if(Date.now()>this.expires)this.closed=true}})}
 directory(path,body){const obj=this.env.ROOMS.get(this.env.ROOMS.idFromName(DIR));return obj.fetch('https://internal/directory/'+path,{method:'POST',body:JSON.stringify(body)})}
 async directoryFetch(request,path){
 const now=Date.now();
 if(path==='list'){const rows=await this.ctx.storage.list({prefix:'r:'}),rooms=[];for(const [k,r] of rows){if(r.expires<now){await this.ctx.storage.delete(k);continue}rooms.push(r)}return json({rooms:rooms.sort((a,b)=>b.created-a.created).slice(0,100),version:VERSION})}
 const d=await request.json();
 if(path==='publish'){if(!/^[A-F0-9]{8}$/.test(d.code))return json({},400);if(!d.room)await this.ctx.storage.delete('r:'+d.code);else await this.ctx.storage.put('r:'+d.code,d.room);return json({ok:true})}
 if(path==='create'){const id=typeof d.requestId==='string'&&/^[a-f0-9-]{36}$/i.test(d.requestId)?d.requestId:null;const key=id?'request:'+d.client+':'+id:null;this.creating??=new Map();if(key&&this.creating.has(key))return (await this.creating.get(key)).clone();const job=this.createRoom(d,now,key);if(key)this.creating.set(key,job);try{return (await job).clone()}finally{if(key)this.creating.delete(key)}}return json({},404)}
 async createRoom(d,now,requestKey){if(requestKey){const saved=await this.ctx.storage.get(requestKey);if(saved&&saved.expires>now)return json(saved.result)}
 if(!validSettings(d.settings))return json({message:'Confira nome, tempo, especial e privacidade da sala.'},400);
 const key='limit:'+d.client,rate=await this.ctx.storage.get(key)||{at:now,n:0};if(now-rate.at>600000){rate.at=now;rate.n=0}if(rate.n>=12)return json({message:'Muitas salas criadas. Aguarde alguns minutos.'},429);rate.n++;await this.ctx.storage.put(key,rate);await this.ctx.storage.setAlarm(now+900000);
 let result;for(let i=0;i<3;i++){const code=[...crypto.getRandomValues(new Uint8Array(4))].map(n=>n.toString(16).padStart(2,'0')).join('').toUpperCase(),ticket=crypto.randomUUID();const obj=this.env.ROOMS.get(this.env.ROOMS.idFromName(code));const r=await obj.fetch('https://internal/init',{method:'POST',body:JSON.stringify({code,hostTicket:ticket,settings:{...d.settings,name:d.settings.name.trim()}})});if(r.ok){result={code,hostTicket:ticket,settings:d.settings};break}}if(result&&requestKey)await this.ctx.storage.put(requestKey,{result,expires:now+900000});return result?json(result):json({message:'Não foi possível criar a sala. Tente novamente.'},503)}
 async alarm(){const now=Date.now();for(const prefix of ['limit:','r:','request:']){const rows=await this.ctx.storage.list({prefix});for(const [k,v] of rows)if(prefix==='limit:'?now-v.at>600000:v.expires<now)await this.ctx.storage.delete(k)}}
 async fetch(request){const u=new URL(request.url);if(u.pathname.startsWith('/directory/'))return this.directoryFetch(request,u.pathname.split('/').pop());
 if(u.pathname==='/init'){if(this.settings)return json({},409);const d=await request.json();if(!validSettings(d.settings))return json({},400);this.code=d.code;this.settings=d.settings;this.hostTicket=d.hostTicket;await this.ctx.storage.put('room',{code:this.code,settings:this.settings,hostTicket:this.hostTicket,expires:this.expires});return json({ok:true})}
 this.sweep(Date.now());if(!this.settings||this.closed||Date.now()>this.expires)return json({message:'Sala não encontrada ou expirada.'},404);
 if(u.pathname==='/info')return json({code:this.code,settings:this.settings,phase:this.phase,available:this.phase==='waiting'&&!this.players[1]&&!!this.players[0]?.hello&&(this.players[0].connected||Date.now()<this.players[0].graceUntil)});
 if(request.headers.get('Upgrade')?.toLowerCase()!=='websocket')return new Response('WebSocket required',{status:426});
 const token=u.searchParams.get('resume');let player=token?this.players.find(p=>p?.resumeToken===token):null;if(token&&!player)return json({message:'Retorno expirado.'},403);if(this.phase!=='waiting')return json({message:'Duelo já iniciado.'},409);
 if(!player){const host=u.searchParams.get('host')===this.hostTicket,seat=host?0:1;if(this.players[seat])return json({message:'Sala cheia.'},409);if(!host&&(!this.players[0]?.hello||(!this.players[0].connected&&Date.now()>this.players[0].graceUntil)))return json({message:'O criador ainda não está disponível.'},409);player={seat,ws:null,fighter:0,name:'Jogador',hello:false,ready:false,inputs:{left:false,right:false,guard:false},count:0,window:Date.now(),lastSeq:-1,lastSeen:Date.now(),resumeToken:crypto.randomUUID(),connected:false,suspended:false,graceUntil:0};this.players[seat]=player}
 const pair=new WebSocketPair(),[client,ws]=Object.values(pair);ws.accept();const old=player.ws;Object.assign(player,{ws,connected:true,suspended:false,graceUntil:0,lastSeen:Date.now(),lastSeq:-1});if(old)try{old.close(1000,'Conexão restaurada')}catch{}
 ws.addEventListener('message',e=>{if(player.ws===ws)this.message(player,e.data)});ws.addEventListener('close',()=>this.disconnect(player,ws));ws.addEventListener('error',()=>this.disconnect(player,ws));this.send(player,{type:'seat',seat:player.seat,resumeToken:player.resumeToken});this.broadcastLobby();this.startTimer();return new Response(null,{status:101,webSocket:client})}
 send(p,d){if(!p?.connected||!p.ws)return;try{p.ws.send(JSON.stringify(d))}catch{this.disconnect(p)}}broadcast(d){for(const p of [...this.players])this.send(p,d)}
 listing(){if(!this.settings)return;const host=this.players[0],room=this.settings.visibility==='public'&&this.phase==='waiting'&&!this.closed&&host?.hello&&(host.connected||Date.now()<host.graceUntil)&&!this.players[1]?{code:this.code,settings:this.settings,host:host.name,fighter:host.fighter,created:this.expires-900000,expires:Math.min(this.expires,Date.now()+150000)}:null;this.listingQueue=(this.listingQueue||Promise.resolve()).catch(()=>{}).then(async()=>{try{const r=await this.directory('publish',{code:this.code,room});if(!r.ok)throw Error('directory');if(room)this.send(this.players[0],{type:'listing',ok:true})}catch{if(room)this.send(this.players[0],{type:'listing',ok:false});this.lastListing=Date.now()}});this.ctx.waitUntil(this.listingQueue);this.lastListing=Date.now()}
 broadcastLobby(){this.broadcast({type:'lobby',settings:this.settings,code:this.code,players:this.players.map(p=>p?{name:p.name,fighter:p.fighter,ready:p.ready,connected:p.connected,away:p.suspended,hello:p.hello}:null),phase:this.phase});this.listing()}
 message(p,raw){if(typeof raw!=='string'||raw.length>1500){p.ws.close(1008,'Mensagem inválida');return}const now=Date.now();p.lastSeen=now;if(now-p.window>=1000){p.window=now;p.count=0}if(++p.count>160){p.ws.close(1008,'Limite de comandos');return}let d;try{d=JSON.parse(raw)}catch{return}if(!d||typeof d!=='object')return;
 if(d.type==='leave'){this.remove(p);return}if(d.type==='ping'){this.send(p,{type:'pong',time:d.time});return}
 if(['suspend','resume'].includes(d.type)&&this.phase==='waiting'){p.suspended=d.type==='suspend';if(p.suspended&&this.settings.visibility==='private'&&p.seat===1)p.ready=false;this.broadcastLobby();return}
 if(d.type==='hello'&&this.phase==='waiting'){if(d.protocol!==VERSION){this.send(p,{type:'error',message:'Atualize o jogo para a versão 8.9.7 e entre novamente.'});return}if(!Number.isInteger(d.fighter)||d.fighter<0||d.fighter>=Combat.styles.length||!validName(d.name))return;p.fighter=d.fighter;p.name=d.name.trim();p.hello=true;p.ready=p.seat===0||this.settings.visibility==='public';this.broadcastLobby();return}
 if(d.type==='ready'&&this.phase==='waiting'&&p.hello&&!p.suspended){p.ready=true;this.broadcastLobby();return}
 if(d.type==='start'&&p.seat===0&&this.phase==='waiting'){if(this.players.every(x=>x?.ready&&x.hello&&x.connected&&!x.suspended))this.begin();else this.send(p,{type:'error',message:'Aguarde os dois jogadores estarem prontos.'});return}
 if(d.type==='rematch'&&this.phase==='finished'){p.ready=true;this.broadcastLobby();if(this.players.every(x=>x?.ready&&x.connected))this.begin();return}
 if(d.type!=='input'||this.phase!=='fight'||!Number.isSafeInteger(d.seq)||d.seq<=p.lastSeq)return;p.lastSeq=d.seq;if(!d.keys||!['left','right','guard'].every(k=>typeof d.keys[k]==='boolean'))return;Object.assign(p.inputs,{left:d.keys.left,right:d.keys.right,guard:d.keys.guard});Object.assign(p.seat===0?this.match.input:this.match.otherInput,p.inputs);if(['punch','kick','upper','jump','special'].includes(d.command))this.match.command(p.seat,d.command)}
 begin(){this.matchId=crypto.randomUUID();this.presentationShown=false;this.round=1;this.wins=[0,0];this.stage=crypto.getRandomValues(new Uint32Array(1))[0]%8;this.expires=Date.now()+6*3600000;for(const p of this.players){p.ready=false;p.inputs={left:false,right:false,guard:false}}this.newRound();this.listing();this.startTimer()}
 newRound(){this.match=new Combat.Match(this.players[0].fighter,this.players[1].fighter,{seed:crypto.getRandomValues(new Uint32Array(1))[0],multiplayer:true,refined:true,unifiedSpecial:true,specialLock:true,roundSeconds:this.settings.seconds,specials:this.settings.specials,introSeconds:this.presentationShown?0:4.2});this.presentationShown=true;this.phase='fight';this.frame=0;this.wait=0;this.players.forEach(p=>p.inputs={left:false,right:false,guard:false});this.broadcast({type:'start',settings:this.settings,stage:this.stage,round:this.round,wins:this.wins,players:this.players.map(p=>({fighter:p.fighter,name:p.name})),snapshot:this.snapshot()})}
 snapshot(){const m=this.match;return{specialLock:m.specialLock,unifiedSpecial:m.unifiedSpecial,f:m.f,time:m.time,untimed:m.untimed,specials:m.specials,introDuration:m.introDuration,t:m.t,freeze:m.freeze,shots:m.shots,over:m.over,winner:m.winner,overtime:m.overtime,intro:m.intro,roundDamage:m.roundDamage,seed:m.seed,input:m.input,otherInput:m.otherInput}}
 startTimer(){if(this.timer)return;this.last=Date.now();this.acc=0;this.timer=setInterval(()=>this.tick(),1000/60)}stopTimer(){if(this.timer)clearInterval(this.timer);this.timer=null}
 tick(){const now=Date.now();this.sweep(now);if(this.closed)return;if(now>this.expires){this.end('A sala expirou.');return}if(this.phase==='waiting'&&now-this.lastListing>15000)this.listing();this.acc+=Math.min(.1,(now-this.last)/1000);this.last=now;if(['waiting','finished'].includes(this.phase)){this.acc=0;return}let steps=0;while(this.acc>=Combat.DT&&steps++<6){this.acc-=Combat.DT;if(this.phase==='round'){this.wait-=Combat.DT;if(this.wait<=0){if(Math.max(...this.wins)>=2){this.phase='finished';this.players.forEach(p=>p.ready=false);this.broadcast({type:'result',matchId:this.matchId,winner:this.wins[0]===2?0:1,wins:this.wins});return}if(this.match.winner>=0)this.round++;this.newRound()}continue}if(this.phase!=='fight')continue;this.match.step();this.frame++;if(this.match.over){const w=this.match.winner;if(w>=0)this.wins[w]++;this.phase='round';this.wait=Math.max(...this.wins)>=2?3.9:1.5;this.broadcast({type:'snapshot',snapshot:this.snapshot(),events:this.match.events,round:this.round,wins:this.wins,phase:this.phase});this.match.events=[];break}if(this.frame%2===0){this.broadcast({type:'snapshot',snapshot:this.snapshot(),events:this.match.events,round:this.round,wins:this.wins,phase:this.phase});this.match.events=[]}}}
 sweep(now){for(const p of [...this.players]){if(!p)continue;if(!p.connected){if(this.phase==='waiting'&&now>p.graceUntil)this.remove(p);continue}const limit=this.phase==='waiting'?(p.suspended?120000:60000):15000;if(now-p.lastSeen>limit){const ws=p.ws;this.disconnect(p,ws);try{ws.close(1000,'Conexão inativa')}catch{}}}}
 disconnect(p,ws=p.ws){if(!p||!this.players.includes(p)||!p.connected||p.ws!==ws)return;if(this.phase==='waiting'){Object.assign(p,{connected:false,ws:null,suspended:false,graceUntil:Date.now()+120000});this.broadcastLobby();return}this.end('O adversário saiu ou perdeu a conexão. O duelo foi encerrado.')}
 remove(p){if(!this.players.includes(p))return;if(p.seat===0||this.phase!=='waiting'){this.end('O criador ou o adversário saiu. A sala foi encerrada.');return}this.players[1]=null;p.connected=false;try{p.ws?.close(1000,'Saída da sala')}catch{}this.broadcastLobby()}
 end(message){if(this.closed)return;this.closed=true;this.phase='closed';this.stopTimer();this.listing();this.ctx.waitUntil(this.ctx.storage.put('room',{code:this.code,settings:this.settings,hostTicket:this.hostTicket,expires:0}));for(const p of this.players)if(p)try{p.ws?.send(JSON.stringify({type:'ended',message}));p.ws?.close(1000,'Duelo encerrado')}catch{}this.players=[null,null]}
}
export default{async fetch(request,env){const u=new URL(request.url);if(u.pathname==='/health')return json({ok:true,version:VERSION,release:'8.9.7'});const directory=()=>env.ROOMS.get(env.ROOMS.idFromName(DIR));
 if(u.pathname==='/rooms'&&request.method==='GET')return directory().fetch('https://internal/directory/list');
 if(u.pathname==='/rooms'&&request.method==='POST'){let raw=await request.text();if(raw.length>2048)return json({message:'Dados inválidos.'},413);let settings;try{settings=JSON.parse(raw)}catch{return json({},400)}if(!validSettings(settings))return json({message:'Configurações inválidas.'},400);const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(request.headers.get('CF-Connecting-IP')||'local'));const requestId=settings.requestId;settings={name:settings.name,seconds:settings.seconds,specials:settings.specials,visibility:settings.visibility};const client=[...new Uint8Array(hash)].map(n=>n.toString(16).padStart(2,'0')).join('');return directory().fetch('https://internal/directory/create',{method:'POST',body:JSON.stringify({settings,client,requestId})})}
 const info=u.pathname.match(/^\/rooms\/([A-F0-9]{8})$/),room=u.pathname.match(/^\/room\/([A-F0-9]{8})$/);if(!info&&!room)return json({},404);const code=(info||room)[1],obj=env.ROOMS.get(env.ROOMS.idFromName(code));return info?obj.fetch('https://internal/info'):obj.fetch(request)}};

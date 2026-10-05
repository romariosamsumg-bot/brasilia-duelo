/* Brasília na Porrada 4.0 — deterministic combat core, 60 Hz. No dependencies. */
'use strict';
const Combat=(()=>{
const DT=1/60,GROUND=448;
const styles=[{speed:218,reach:8},{speed:204,reach:0},{speed:226,reach:2},{speed:212,reach:5},{speed:250,reach:-7},{speed:208,reach:3},{speed:214,reach:7},{speed:239,reach:-3}];
const moves={
 jab:{wind:.09,active:.085,recover:.17,damage:7,reach:131,stun:.24,push:70,cost:7,pose:1,level:'mid'},
 cross:{wind:.11,active:.085,recover:.21,damage:9,reach:144,stun:.27,push:80,cost:9,pose:1,level:'mid'},
 kick:{wind:.21,active:.11,recover:.27,damage:14,reach:190,stun:.32,push:225,cost:15,pose:2,level:'mid'},
 finisher:{wind:.16,active:.1,recover:.32,damage:17,reach:185,stun:.38,push:360,cost:19,pose:2,level:'mid'},
 upper:{wind:.2,active:.13,recover:.39,damage:17,reach:143,stun:.4,push:125,lift:550,cost:20,pose:1,level:'high'},
 air:{wind:.1,active:.15,recover:.23,damage:12,reach:172,stun:.28,push:155,cost:11,pose:2,level:'air'},
 heavy:{wind:.39,active:.14,recover:.44,damage:25,reach:183,stun:.45,push:420,cost:24,pose:2,break:53,level:'mid'},
 special:{wind:.33,active:.16,recover:.43,damage:27,reach:220,stun:.45,push:360,cost:0,pose:1,level:'mid'}
};
function fighter(id,x,dir){return{id,x,y:0,vy:0,vx:0,dir,hp:140,guard:100,stamina:100,meter:0,stun:0,down:0,inv:0,dodge:0,dodgeCD:0,parryCD:0,parry:0,block:false,action:null,buffer:null,combo:0,comboDamage:0,comboTimer:0,hitChain:0,chainTimer:0,counter:0,move:0,flash:0,trail:0,wallLock:0,charge:0,stats:{hits:0,parries:0,dodges:0,maxCombo:0,damage:0,counters:0}}}
class Match{
 constructor(a=0,b=1,{difficulty=1,seed=1,training=false,multiplayer=false}={}){this.seed=seed>>>0;this.difficulty=difficulty;this.training=training;this.multiplayer=multiplayer;this.otherInput={left:false,right:false,guard:false};this.f=[fighter(a,280,1),fighter(b,680,-1)];this.time=60;this.t=0;this.freeze=0;this.events=[];this.shots=[];this.over=false;this.winner=null;this.overtime=false;this.aiClock=.55;this.aiBlock=0;this.aiMove=0;this.input={left:false,right:false,guard:false};this.lastTap=[-9,-9];this.intro=1.5;this.roundDamage=[0,0]}
 random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296}
 emit(type,data={}){this.events.push({type,...data})}
 clear(){this.input.left=this.input.right=this.input.guard=false;this.f.forEach(f=>{f.block=false;f.buffer=null;f.charge=0})}
 command(i,key){if(this.over||this.intro>0)return false;const f=this.f[i];if(key==='jump'){if(f.y===0&&!f.action&&f.stun<=0&&!f.down&&!f.dodge&&f.stamina>=8){f.vy=690;f.stamina-=8;f.block=false;f.vx=(this.multiplayer||i===0?(+(i===0?this.input:this.otherInput).right)-(+(i===0?this.input:this.otherInput).left):f.dir)*170;this.emit('jump',{i});return true}return false}
 if(key==='dodge'){if(f.y===0&&f.stun<=0&&!f.down&&!f.action&&f.dodgeCD<=0&&f.stamina>=28){let d=this.multiplayer||i===0?((+(i===0?this.input:this.otherInput).right)-(+(i===0?this.input:this.otherInput).left))||-f.dir:-f.dir;f.dodge=.24;f.inv=.19;f.vx=d*640;f.stamina-=28;f.dodgeCD=.78;f.block=false;this.emit('dodge',{i});return true}return false}
 if(key==='burst'){if(f.meter>=100&&(f.stun>0||f.down>0)){f.meter=0;f.stun=0;f.down=0;f.inv=.38;const o=this.f[1-i];if(Math.abs(f.x-o.x)<230){o.vx=f.dir*520;o.stun=.32;o.action=null}this.emit('burst',{i});return true}return false}

 if(f.stun>0||f.down>0||f.dodge>0){f.buffer={key,ttl:.14};return false}
 if(f.action){const ac=f.action;if(ac.connected&&ac.t>=ac.m.wind+ac.m.active&&ac.t<ac.total&&ac.name==='jab'&&key==='punch')return this.begin(i,'cross');if(ac.connected&&ac.t>=ac.m.wind+ac.m.active&&ac.name==='cross'&&key==='kick')return this.begin(i,'finisher');if(ac.connected&&ac.t>=ac.m.wind+ac.m.active&&key==='special')return this.begin(i,'special');f.buffer={key,ttl:.16};return false}
 let name=key==='punch'?'jab':key==='kick'?'kick':key==='upper'?'upper':key==='heavy'?'heavy':key==='special'?'special':null;if(!name)return false;if(f.y>6&&name!=='special')name='air';if(f.y>6&&name==='special')return false;return this.begin(i,name)}
 begin(i,name){const f=this.f[i];let m={...moves[name]};if(name==='special'){if(f.meter<100)return false;f.meter=0;m={...m,wind:.42,active:.16,recover:.48,damage:34,reach:122,stun:1.1,push:410,pose:f.id===1||f.id===4?2:1,grab:false};this.emit('special',{i,id:f.id})}
 if(f.stamina<m.cost){this.emit('tired',{i});return false}f.stamina-=m.cost;f.block=false;f.charge=0;f.buffer=null;f.action={name,m,t:0,total:m.wind+m.active+m.recover,hit:false,hit2:false,connected:false,spawned:false,phase:name==='special'?'intro':null,phaseTime:0};return true}
 setBlock(i,v){const f=this.f[i];if(v&&!f.block&&(f.y===0||this.f[1-i].action?.name==='special')&&!f.action&&f.stun<=0&&!f.down&&(!f.dodge||this.f[1-i].action?.name==='special')&&f.guard>4){f.block=true;if(f.parryCD<=0){f.parry=.115;f.parryCD=.4}}else if(!v)f.block=false}
 ai(dt){if(this.training)return;const f=this.f[1],p=this.f[0],dist=Math.abs(f.x-p.x);this.aiClock-=dt;this.aiBlock-=dt;this.setBlock(1,this.aiBlock>0);let dir=dist>170?f.dir:dist<100?-f.dir:0;if(this.aiMove!==0&&this.aiClock>0)dir=this.aiMove;if(p.counter>0)dir=-f.dir;f.move=dir;
 if(this.aiClock<=0){this.aiMove=0;this.aiClock=.16+this.random()*(.32-this.difficulty*.06);let r=this.random();if(f.stun>0&&f.meter>=100&&f.hp<60&&r<.22)this.command(1,'burst');else if(p.action&&p.action.t>.07&&dist<240&&r<[.22,.48,.68][this.difficulty]){if(p.action.m.grab||p.action.name==='heavy'&&r<.2)this.command(1,'dodge');else{this.aiBlock=.22+this.random()*.22;this.setBlock(1,true)}}else if(f.meter>=100&&dist<250&&r<.35)this.command(1,'special');else if(p.y>35&&dist<165)this.command(1,'upper');else if(dist<145){if(f.action?.name==='jab')this.command(1,'punch');else if(f.action?.name==='cross')this.command(1,'kick');else this.command(1,r<.65?'punch':r<.85?'kick':'heavy')}else if(dist<190&&r<.6)this.command(1,'kick');else if(dist<260&&r>.82)this.command(1,'jump');else if(dist<185&&r>.64){this.aiMove=-f.dir;this.aiBlock=.18}}}
 damage(i,j,m,name,scale=1){const a=this.f[i],b=this.f[j];if(name!=='special'&&(b.inv>0||b.down>0)){this.emit('evade',{i:j});return false}if(b.counter>0){b.counter=0;b.action=null;a.action=null;a.hp=Math.max(0,a.hp-29);a.stun=.5;a.vx=-a.dir*370;b.stats.damage+=29;this.roundDamage[j]+=29;this.freeze=.085;this.emit('counter',{i:j,x:a.x,y:a.y});return false}
 if(b.block&&!m.grab){if(b.parry>0){b.parry=0;a.action=null;a.stun=.52;a.vx=-a.dir*160;b.meter=Math.min(100,b.meter+30);b.stamina=Math.min(100,b.stamina+15);b.stats.parries++;this.freeze=.09;this.emit('parry',{i:j,x:b.x,y:b.y});return false}b.guard=Math.max(0,b.guard-(m.break||m.damage*1.6));b.vx=a.dir*80;b.stamina=Math.max(0,b.stamina-3);a.meter=Math.min(100,a.meter+3);this.freeze=.025;this.emit('block',{i:j,x:b.x,y:b.y});if(b.guard<=0){b.block=false;b.stun=.85;b.action=null;this.emit('guardbreak',{i:j})}return false}
 let counter=!!b.action&&(b.action.name==='special'||b.action.t<b.action.m.wind),chain=b.stun>0&&a.comboTimer>0;a.combo=chain?a.combo+1:1;a.comboDamage=chain?a.comboDamage:0;let scaling=Math.max(.48,1-(a.combo-1)*.12);let dmg=Math.min(b.hp,Math.round(m.damage*scaling*scale*(counter?1.15:1)));if(counter)a.stats.counters++;if(b.action?.name==='special')this.emit('specialInterrupted',{i:j,by:i});b.hp=Math.max(0,b.hp-dmg);a.comboDamage+=dmg;a.comboTimer=1.1;a.stats.hits++;a.stats.damage+=dmg;a.stats.maxCombo=Math.max(a.stats.maxCombo,a.combo);this.roundDamage[i]+=dmg;b.action=null;b.buffer=null;b.counter=0;b.block=false;b.stun=m.stun;b.flash=.12;b.vx=a.dir*m.push;b.vy=m.lift||b.vy;if(m.lift)b.y=Math.max(b.y,1);a.meter=Math.min(100,a.meter+9);b.meter=Math.min(100,b.meter+6);if(a.action)a.action.connected=true;
 if(name==='heavy'||name==='finisher'||name==='special'){b.down=name==='special'?1.08:.42;b.stun=name==='special'?1.12:.62;b.vy=name==='special'?460:250;b.y=Math.max(b.y,1)}this.freeze=name==='jab'?.045:name==='special'?.1:.075;this.emit('hit',{i,j,x:b.x,y:b.y,damage:dmg,combo:a.combo,total:a.comboDamage,counter,heavy:!['jab','cross','air'].includes(name),name});return true}
 advanceSpecial(i,dt,intents){const f=this.f[i],o=this.f[1-i],a=f.action,m=a.m;a.t+=dt;a.phaseTime+=dt;f.dir=o.x>=f.x?1:-1;f.vx=0;
 if(a.phase==='intro'){if(a.phaseTime>=.42){a.phase='chase';a.phaseTime=0}}
 else if(a.phase==='chase'){let gap=Math.abs(f.x-o.x);let speed=[580,555,640,560,690,590,575,660][f.id];if(f.id===1)speed*=.85+.3*Math.abs(Math.sin(a.phaseTime*9));if(f.id===2)speed*=Math.min(1.2,.75+a.phaseTime*.65);if(f.id===3)speed*=.65+.35*Math.abs(Math.sin(a.phaseTime*10));if(f.id===4)speed*=.5+.8*Math.abs(Math.sin(a.phaseTime*15));if(f.id===5)speed*=.85+.2*Math.sin(a.phaseTime*7);if(f.id===6)speed*=.8+.25*Math.abs(Math.sin(a.phaseTime*12));if(f.id===7)speed*=.8+.3*Math.abs(Math.sin(a.phaseTime*18));if(gap>105)f.x+=f.dir*Math.min(speed*dt,gap-102);f.y+=(o.y-f.y)*Math.min(1,dt*15);f.vy=0;if(Math.abs(f.x-o.x)<=112){a.phase='strike';a.phaseTime=0;this.emit('specialStrike',{i,id:f.id})}}
 else if(a.phase==='strike'){// Follow the target through jumps and evasive movement; only guard or a hit interrupts.
 let gap=Math.abs(f.x-o.x);if(gap>105)f.x+=f.dir*Math.min(900*dt,gap-102);f.y+=(o.y-f.y)*Math.min(1,dt*20);f.vy=0;
 if(a.phaseTime>=.2&&Math.abs(f.x-o.x)<=125&&!a.hit){a.hit=true;intents.push({i,j:1-i,m,name:'special',ref:a});a.phase='recover';a.phaseTime=0}}
 else if(a.phase==='recover'&&a.phaseTime>=.46){f.action=null;f.vy=0}}
 step(dt=DT){if(this.over)return;if(this.intro>0){this.intro=Math.max(0,this.intro-dt);return}if(this.freeze>0){this.freeze-=dt;return}this.t+=dt;if(!this.training&&!this.f.some(f=>f.action?.name==='special'))this.time=Math.max(0,this.time-dt);if(this.multiplayer){this.f[1].move=(+this.otherInput.right)-(+this.otherInput.left);this.setBlock(1,this.otherInput.guard)}else this.ai(dt);const p=this.f[0];p.move=(+this.input.right)-(+this.input.left);this.setBlock(0,this.input.guard);let intents=[];
 for(let i=0;i<2;i++){const f=this.f[i],o=this.f[1-i];for(const k of ['stun','down','inv','dodge','dodgeCD','parryCD','parry','counter','flash','wallLock','comboTimer','chainTimer'])f[k]=Math.max(0,f[k]-dt);if(f.comboTimer<=0){f.combo=0;f.comboDamage=0}if(f.buffer){f.buffer.ttl-=dt;if(f.buffer.ttl<=0)f.buffer=null;else if(!f.action&&f.stun<=0&&!f.down&&!f.dodge){let key=f.buffer.key;f.buffer=null;this.command(i,key)}else if(f.action?.connected&&f.action.t>=f.action.m.wind+f.action.m.active&&((f.action.name==='jab'&&f.buffer.key==='punch')||(f.action.name==='cross'&&f.buffer.key==='kick')||f.buffer.key==='special')){let key=f.buffer.key;f.buffer=null;this.command(i,key)}}
 if(!f.action&&f.stun<=0&&f.dodge<=0){f.dir=o.x>=f.x?1:-1;f.stamina=Math.min(100,f.stamina+(f.block?8:23)*dt)}if(f.block){f.guard=Math.max(0,f.guard-7*dt);if(f.guard<=0){f.block=false;f.stun=.6;this.emit('guardbreak',{i})}}else f.guard=Math.min(100,f.guard+18*dt);
 if(f.stun>0||f.down>0)f.block=false;
 if(f.y>0||f.vy>0){f.y+=f.vy*dt;f.vy-=1850*dt;if(f.y<=0){f.y=0;f.vy=0;this.emit('land',{i,x:f.x});if(f.down<=0&&f.stun<=0)f.vx*=.3}}
 if(!f.action&&f.stun<=0&&!f.block&&!f.dodge&&!f.down){f.x+=f.move*styles[f.id].speed*(f.y>0?.7:1)*dt}f.x+=f.vx*dt;if(f.dodge<=0)f.vx*=Math.exp(-8*dt);
 const ac=f.action;if(ac?.name==='special'){this.advanceSpecial(i,dt,intents)}else if(ac){ac.t+=dt;let m=ac.m;if(ac.name==='special'&&f.id===2&&ac.t<m.wind)f.x+=f.dir*440*dt;if(ac.name==='special'&&f.id===4&&ac.t<m.wind){f.inv=ac.t<.15?.06:0;f.x+=f.dir*(ac.t<.14?-340:630)*dt}if(ac.t>=m.wind&&ac.t<m.wind+m.active&&!ac.hit){if(ac.name==='special'&&f.id===0){if(!ac.spawned){ac.spawned=true;this.shots.push({i,x:f.x+f.dir*45,y:95,vx:f.dir*520,ttl:1.4,m:{...m,reach:55}})}}else if(!(ac.name==='special'&&f.id===3)){const vertical=Math.abs(f.y-o.y)<(ac.name==='upper'?180:100);if(Math.abs(f.x-o.x)<=m.reach+styles[f.id].reach&&vertical){ac.hit=true;intents.push({i,j:1-i,m,name:ac.name})}}}
 if(ac.name==='special'&&f.id===1&&ac.t>=m.wind+.23&&!ac.hit2){ac.hit2=true;if(Math.abs(f.x-o.x)<m.reach&&Math.abs(f.y-o.y)<100)intents.push({i,j:1-i,m,name:ac.name})}
 if(ac.t>=ac.total){f.action=null;f.counter=0}}
 if(f.x<65||f.x>895){f.x=Math.max(65,Math.min(895,f.x));if(Math.abs(f.vx)>230&&f.stun>0&&f.wallLock<=0){f.vx=-f.vx*.55;f.wallLock=1;this.emit('wall',{i,x:f.x})}else f.vx=0}
 }
 let [a,b]=this.f;if(Math.abs(a.x-b.x)<62&&Math.abs(a.y-b.y)<115){let d=a.x<=b.x?1:-1,over=(62-Math.abs(a.x-b.x))/2;a.x-=d*over;b.x+=d*over;a.x=Math.max(65,Math.min(895,a.x));b.x=Math.max(65,Math.min(895,b.x))}
 for(const shot of this.shots){shot.x+=shot.vx*dt;shot.ttl-=dt;let b=this.f[1-shot.i];if(Math.abs(shot.x-b.x)<50&&Math.abs(b.y-shot.y+95)<100){shot.ttl=0;intents.push({i:shot.i,j:1-shot.i,m:shot.m,name:'special'})}}this.shots=this.shots.filter(s=>s.ttl>0&&s.x>0&&s.x<960);
 // A landed normal attack interrupts a super, including on its impact frame.
 for(const h of intents.filter(h=>h.name!=='special'))this.damage(h.i,h.j,h.m,h.name);
 const supers=intents.filter(h=>h.name==='special'&&this.f[h.i].action===h.ref);
 if(supers.length===2){for(const f of this.f){f.action=null;f.stun=.35;f.vx=-f.dir*180}this.freeze=.12;this.emit('specialClash')}
 else for(const h of supers){if(this.damage(h.i,h.j,h.m,h.name)){this.emit('specialImpact',{i:h.i,id:this.f[h.i].id,x:this.f[h.j].x,y:this.f[h.j].y})}}
 if(this.training){for(const f of this.f)if(f.hp<=0){f.hp=140;f.stun=.5;f.inv=.6}return}
 if(a.hp<=0||b.hp<=0){this.over=true;this.winner=a.hp===b.hp?-1:a.hp>b.hp?0:1;this.emit('ko',{winner:this.winner})}else if(this.overtime&&a.hp!==b.hp){this.over=true;this.winner=a.hp>b.hp?0:1;this.emit('ko',{winner:this.winner})}else if(this.time<=0){if(a.hp===b.hp&&!this.overtime){this.overtime=true;this.time=15;this.emit('overtime')}else{this.over=true;this.winner=a.hp===b.hp?-1:a.hp>b.hp?0:1;this.emit('ko',{winner:this.winner})}}
 }
}
return{Match,moves,styles,DT,GROUND};})();
if(typeof module!=='undefined')module.exports=Combat;

// One authoritative room per invite. No scores supplied by a browser are trusted.
export class DuelRoom {
 constructor(ctx,env){this.ctx=ctx;this.env=env;this.players=[];this.phase='waiting';this.round=1;this.wins=[0,0];this.timer=null;this.expires=Date.now()+15*60*1000;this.match=null;this.frame=0;this.wait=0;this.last=0;this.acc=0;this.stage=0;this.result=null;this.closed=false;}
 async fetch(request){const u=new URL(request.url);if(request.headers.get('Upgrade')?.toLowerCase()!=='websocket')return new Response('WebSocket required',{status:426});
 this.sweep(Date.now());if(this.closed||Date.now()>this.expires)return new Response('Sala expirada. Crie um novo convite.',{status:410});
 const token=u.searchParams.get('resume');let player=token?this.players.find(p=>p.resumeToken===token):null;
 if(token&&!player)return new Response('Convite de retorno expirado.',{status:403});
 if(player&&this.phase!=='waiting')return new Response('Duelo já iniciado.',{status:409});
 if(!player&&this.players.length>=2)return new Response('Sala cheia.',{status:409});
 const pair=new WebSocketPair(),[client,ws]=Object.values(pair);ws.accept();
 if(!player){player={ws:null,fighter:0,name:'Jogador',ready:false,inputs:{left:false,right:false,guard:false},count:0,window:Date.now(),lastSeq:-1,lastSeen:Date.now(),resumeToken:crypto.randomUUID(),connected:false,suspended:false,graceUntil:0};this.players.push(player)}
 const old=player.ws;player.ws=ws;player.connected=true;player.suspended=false;player.graceUntil=0;player.lastSeen=Date.now();player.lastSeq=-1;player.ready=false;if(old)try{old.close(1000,'Conexão restaurada')}catch{}
 ws.addEventListener('message',event=>{if(player.ws===ws)this.message(player,event.data)});ws.addEventListener('close',()=>this.disconnect(player,ws));ws.addEventListener('error',()=>this.disconnect(player,ws));
 ws.send(JSON.stringify({type:'seat',seat:this.players.indexOf(player),resumeToken:player.resumeToken}));this.broadcastLobby();this.startTimer();return new Response(null,{status:101,webSocket:client});}
 send(player,data){if(!player.connected||!player.ws)return;try{player.ws.send(JSON.stringify(data))}catch{this.disconnect(player)}}
 broadcast(data){for(const player of [...this.players])this.send(player,data)}
 broadcastLobby(){this.broadcast({type:'lobby',players:this.players.map(p=>({name:p.name,fighter:p.fighter,ready:p.ready,connected:p.connected,away:p.suspended})),phase:this.phase})}
 message(p,raw){if(typeof raw!=='string'||raw.length>1024){p.ws.close(1008,'Mensagem inválida');return}const now=Date.now();p.lastSeen=now;if(now-p.window>=1000){p.window=now;p.count=0}if(++p.count>160){p.ws.close(1008,'Limite de comandos');return}let d;try{d=JSON.parse(raw)}catch{return}if(!d||typeof d!=='object')return;
 if(d.type==='leave'){this.remove(p);return}
 if(d.type==='suspend'&&this.phase==='waiting'){p.suspended=true;p.backgroundUntil=now+120000;p.ready=false;this.broadcastLobby();return}
 if(d.type==='resume'&&this.phase==='waiting'){p.suspended=false;p.ready=false;this.broadcastLobby();return}
 if(d.type==='ping'){this.send(p,{type:'pong',time:d.time});return}
 if(d.type==='hello'&&this.phase==='waiting'){if(!Number.isInteger(d.fighter)||d.fighter<0||d.fighter>=Combat.styles.length)return;const name=typeof d.name==='string'?d.name.trim().normalize('NFC'):'';if(name.length<2||name.length>20||! /^[\p{L}\p{N} _.'-]+$/u.test(name)){this.send(p,{type:'error',message:'Nome: use de 2 a 20 letras, números ou espaços.'});return}p.fighter=d.fighter;p.name=name;p.hello=true;this.broadcastLobby();return}
 if(d.type==='ready'&&this.phase==='waiting'&&p.hello&&!p.suspended){p.ready=true;this.broadcastLobby();if(this.players.length===2&&this.players.every(x=>x.ready&&x.hello&&x.connected&&!x.suspended))this.begin();return}
 if(d.type==='rematch'&&this.phase==='finished'){p.ready=true;this.broadcastLobby();if(this.players.length===2&&this.players.every(x=>x.ready))this.begin();return}
 if(d.type!=='input'||this.phase!=='fight'||!Number.isSafeInteger(d.seq)||d.seq<=p.lastSeq)return;p.lastSeq=d.seq;
 if(!d.keys||typeof d.keys!=='object'||!['left','right','guard'].every(k=>typeof d.keys[k]==='boolean'))return;
 Object.assign(p.inputs,{left:d.keys.left,right:d.keys.right,guard:d.keys.guard});const seat=this.players.indexOf(p);Object.assign(seat===0?this.match.input:this.match.otherInput,p.inputs);
 if(typeof d.command==='string'&&['punch','kick','heavy','upper','jump','dodge','special'].includes(d.command))this.match.command(seat,d.command);
 }
 begin(){this.round=1;this.wins=[0,0];this.stage=crypto.getRandomValues(new Uint32Array(1))[0]%6;this.result=null;this.expires=Date.now()+20*60*1000;for(const p of this.players){p.ready=false;for(const k in p.inputs)p.inputs[k]=false}this.newRound();this.startTimer()}
 newRound(){this.match=new Combat.Match(this.players[0].fighter,this.players[1].fighter,{seed:crypto.getRandomValues(new Uint32Array(1))[0],multiplayer:true});this.phase='fight';this.frame=0;this.wait=0;for(const p of this.players)for(const k in p.inputs)p.inputs[k]=false;this.broadcast({type:'start',stage:this.stage,round:this.round,wins:this.wins,players:this.players.map(p=>({fighter:p.fighter,name:p.name})),snapshot:this.snapshot()})}
 snapshot(){const m=this.match;return{f:m.f,time:m.time,t:m.t,freeze:m.freeze,shots:m.shots,over:m.over,winner:m.winner,overtime:m.overtime,intro:m.intro,roundDamage:m.roundDamage,seed:m.seed,input:m.input,otherInput:m.otherInput}}
 startTimer(){if(this.timer)return;this.last=Date.now();this.acc=0;this.timer=setInterval(()=>this.tick(),1000/60)}
 stopTimer(){if(this.timer)clearInterval(this.timer);this.timer=null}
 tick(){const now=Date.now();this.sweep(now);if(this.closed)return;if(now>this.expires){this.end('A sala expirou. Crie um novo convite.');return}this.acc+=Math.min(.1,(now-this.last)/1000);this.last=now;if(this.phase==='waiting'||this.phase==='finished'){this.acc=0;return;}let steps=0;while(this.acc>=Combat.DT&&steps++<6){this.acc-=Combat.DT;if(this.phase==='round'){this.wait-=Combat.DT;if(this.wait<=0){if(Math.max(...this.wins)>=2){this.phase='finished';this.players.forEach(p=>p.ready=false);this.result=this.wins[0]===2?0:1;this.broadcast({type:'result',winner:this.result,wins:this.wins});return}if(this.match.winner>=0)this.round++;this.newRound()}continue}
 if(this.phase!=='fight')continue;this.match.step();this.frame++;if(this.match.over){const w=this.match.winner;if(w>=0)this.wins[w]++;this.phase='round';this.wait=3.9;this.broadcast({type:'snapshot',snapshot:this.snapshot(),events:this.match.events,round:this.round,wins:this.wins,phase:this.phase});this.match.events=[];break}
 if(this.frame%2===0){this.broadcast({type:'snapshot',snapshot:this.snapshot(),events:this.match.events,round:this.round,wins:this.wins,phase:this.phase});this.match.events=[]}}
 }
 sweep(now){for(const p of [...this.players]){if(!p.connected){if(this.phase==='waiting'&&now>p.graceUntil)this.remove(p);continue}const limit=this.phase==='waiting'?(p.suspended?120000:60000):15000;if(now-p.lastSeen>limit){const socket=p.ws;this.disconnect(p,socket);try{socket.close(1000,'Conexão inativa')}catch{}}}}
 disconnect(p,socket=p.ws){if(!this.players.includes(p)||!p.connected||p.ws!==socket)return;if(this.phase==='waiting'){p.connected=false;p.ws=null;p.suspended=false;p.graceUntil=Date.now()+120000;p.ready=false;for(const k in p.inputs)p.inputs[k]=false;this.players.forEach(x=>x.ready=false);this.broadcastLobby();return}this.end('O adversário saiu ou perdeu a conexão. O duelo foi encerrado.');}
 remove(p){if(!this.players.includes(p))return;if(this.phase!=='waiting'){this.end('O adversário saiu da sala. O duelo foi encerrado.');return}const socket=p.ws;this.players=this.players.filter(x=>x!==p);p.connected=false;p.ws=null;try{socket?.close(1000,'Saída da sala')}catch{}this.players.forEach((x,i)=>{x.ready=false;this.send(x,{type:'seat',seat:i,resumeToken:x.resumeToken})});this.broadcastLobby();if(!this.players.length){this.closed=true;this.stopTimer()}}
 end(message){if(this.closed)return;this.closed=true;this.phase='closed';this.stopTimer();const players=[...this.players];this.players=[];for(const p of players){try{p.ws?.send(JSON.stringify({type:'ended',message}));p.ws?.close(1000,'Duelo encerrado')}catch{}}}
}
export default {async fetch(request,env){const u=new URL(request.url);if(u.pathname==='/health')return Response.json({ok:true,version:'6.1'});const m=u.pathname.match(/^\/room\/([A-F0-9]{8})$/);if(!m)return new Response('Not found',{status:404});const id=env.ROOMS.idFromName(m[1]);return env.ROOMS.get(id).fetch(request)}};

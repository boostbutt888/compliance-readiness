/* ===================== ISO 27001 control detail ===================== */
const PRACTICE_OF={};PRACTICES.forEach(p=>p.c.forEach(c=>PRACTICE_OF[c]=p.id));
const DEV_CTL=["8.4","8.25","8.27","8.28","8.29","8.30","8.31","8.33"];
const PREM_CTL=["7.1","7.2","7.3","7.4","7.5","7.6","7.11","7.12"];
function applicability(id,p){
  const dev=p.dev,noPrem=p.work==="remote"&&p.hosting==="cloud";
  if(dev==="none"&&DEV_CTL.includes(id))return{app:false,why:"No software development in scope."};
  if(dev==="inhouse"&&id==="8.30")return{app:false,why:"All development is done in-house."};
  if(dev==="outsourced"&&id==="8.4")return{app:true,why:"Applies to source code held by your developer."};
  if(noPrem&&PREM_CTL.includes(id))return{app:false,why:"No company premises or servers. Physical security sits with the cloud provider; keep their certificates on file."};
  if(p.hosting==="cloud"&&id==="7.6")return{app:false,why:"No server room or secure area under company control."};
  if(p.work==="office"&&id==="6.7")return{app:false,why:"Remote working is not permitted."};
  if(id==="8.11"&&dev==="none"&&!(p.data||[]).length)return{app:false,why:"No personal or sensitive data used for testing or analytics."};
  if(id==="8.26"&&dev==="none")return{app:true,why:"Applies to software and SaaS you buy."};
  return{app:true,why:""};
}
const EXCLUDABLE={"6.7":"Staff never work remotely","7.6":"Systems are cloud-only","8.11":"No development and no personal data","8.30":"All development is in-house"};
DEV_CTL.forEach(c=>{if(!EXCLUDABLE[c])EXCLUDABLE[c]="No software development"});
PREM_CTL.forEach(c=>{if(!EXCLUDABLE[c])EXCLUDABLE[c]="Fully remote and cloud-only"});
function statusOf(id,a){let pid=PRACTICE_OF[id];if(pid==="P18"&&a.profile.dev==="none")pid="P5";return a.answers[pid]||"no"}
function iso27(a){
  const p=a.profile;
  const rows=CONTROLS.map(([id,name])=>{const ap=applicability(id,p);const st=ap.app?statusOf(id,a):"excluded";return{id,name,theme:THEMES[id.split(".")[0]],app:ap.app,why:ap.why,st}});
  const app=rows.filter(r=>r.app);
  const score=app.reduce((s,r)=>s+(r.st==="yes"?1:r.st==="partly"?.5:0),0);
  const themes=Object.values(THEMES).map(t=>{const tr=app.filter(r=>r.theme===t);const y=tr.filter(r=>r.st==="yes").length,pa=tr.filter(r=>r.st==="partly").length;return{n:t,count:tr.length,y,pa,no:tr.length-y-pa,pct:tr.length?Math.round((y+pa*.5)/tr.length*100):0}});
  return{rows,app,readiness:app.length?Math.round(score/app.length*100):0,themes};
}

/* ===================== Scoring engine ===================== */
const SIZE_F=[0.8,1,1.2,1.5,1.8];
const SCALE=[1,1,1.5,2.5,4];
const GAP_DAYS={S:1,M:2,L:4};
const EFFORT={S:"Small, under 2 weeks",M:"Medium, 2–6 weeks",L:"Large, over 6 weeks"};
const SENSITIVE=["nric","card","health","children"];
const TOOLS={
 P4:{label:"MFA and identity management",f:(h,s)=>[0,h*60]},
 P12:{label:"Device management and endpoint protection",f:(h,s)=>[h*100,h*200]},
 P13:{label:"Vulnerability scanning",f:(h,s)=>[1500*s,6000*s]},
 P14:{label:"Log management or managed detection",f:(h,s)=>[3000*s,12000*s]},
 P7:{label:"Backup and recovery tooling",f:(h,s)=>[1000*s,5000*s]},
 P15:{label:"Firewall and web filtering",f:(h,s)=>[1500*s,8000*s]},
 P11:{label:"Awareness training platform",f:(h,s)=>[h*15,h*40]},
 P18:{label:"Penetration test and code scanning",f:(h,s)=>[8000,25000]},
 P17:{label:"Office access control and CCTV",f:(h,s)=>[1000*s,6000*s]},
 R3:{label:"Disaster recovery site or failover",f:(h,s)=>[3000*s,20000*s]},
 S2:{label:"Service desk and ticketing tool",f:(h,s)=>[h*60,h*180]},
 E6:{label:"Energy sub-metering",f:(h,s)=>[2000*s,12000*s]}
};
const sizeIx=p=>SIZE_IX[p.size]??1;
const DEPTH={ce:.5,ct:.8,nist:.3,pdpa:.8,gdpr:.8,ecovadis:.6,im8:.8,health:.8};
const depth=f=>DEPTH[f.id]??1;
const val=s=>s==="yes"?1:s==="partly"?.5:0;
function fwPractices(f,p){const out=[];f.domains.forEach(d=>d.ps.forEach(id=>{const x=P_BY_ID[id];if(x&&(!x.show||x.show(p))&&!out.includes(id))out.push(id)}));return out}
function screenAll(p){return FRAMEWORKS.map(f=>({f,...(f.screen(p)||{lvl:null,why:[]})}))}
function selected(a){return (a.fw||[]).map(id=>FW_BY_ID[id]).filter(Boolean)}
function levelOf(a,f){if(((a.intake||{}).asked||[]).includes(f.id))return "requested";const s=f.screen(a.profile)||{};return s.lvl||"optional"}
const isMust=l=>l==="required"||l==="requested";
function practiceIds(a){const ids=new Set();selected(a).forEach(f=>fwPractices(f,a.profile).forEach(id=>ids.add(id)));return PRACTICES.filter(x=>ids.has(x.id)).map(x=>x.id)}
function boost(id,p){
  const sens=(p.data||[]).some(d=>SENSITIVE.includes(d));let b=0;
  if(sens&&["P4","P8","P12","P20","Q3","H1"].includes(id))b++;
  if((p.suppliers==="many"||p.it==="msp")&&id==="P5")b++;
  if((p.dev==="inhouse"||p.dev==="both")&&id==="P18")b++;
  if(p.hosting!=="cloud"&&["P7","P15"].includes(id))b++;
  if(p.it==="none"&&["P2","P13"].includes(id))b++;
  if(p.availability==="critical"&&["R1","R3","R4"].includes(id))b++;
  if(p.esgAsk==="required"&&["E4","E12"].includes(id))b++;
  return b;
}
function gapOf(id,a,reqIds){
  const x=P_BY_ID[id],p=a.profile,si=sizeIx(p),st=a.answers[id]||"no";
  let s=(x.w+boost(id,p))*(st==="no"?1:.6);if(reqIds&&reqIds.has(id))s+=.6;
  const days=Math.max(1,Math.round(GAP_DAYS[x.e]*(st==="no"?1:.5)*SIZE_F[si]*2)/2);
  const fws=selected(a).filter(f=>fwPractices(f,p).includes(id)).map(f=>f.id);
  return{...x,st,sc:s,pr:s>=2.4?"High":s>=1.5?"Medium":"Low",days,fws};
}
function toolCost(g,p){const t=TOOLS[g.id];if(!t)return null;const si=sizeIx(p);const[lo,hi]=t.f(HEAD[si],SCALE[si]);const k=g.st==="no"?1:.5;return{id:g.id,label:t.label,lo:lo*k,hi:hi*k}}
function fwResult(f,a){
  const p=a.profile,si=sizeIx(p),rate=Number(cfg.rate)||1200;
  const ids=fwPractices(f,p);
  const doms=f.domains.map(d=>{const ps=d.ps.filter(id=>ids.includes(id));const y=ps.filter(id=>a.answers[id]==="yes").length,pa=ps.filter(id=>a.answers[id]==="partly").length;return{n:d.n,ps,count:ps.length,y,pa,no:ps.length-y-pa,pct:ps.length?Math.round(ps.reduce((s,id)=>s+val(a.answers[id]),0)/ps.length*100):0}}).filter(d=>d.count);
  let readiness=ids.length?Math.round(ids.reduce((s,id)=>s+val(a.answers[id]),0)/ids.length*100):0;
  let iso=null;if(f.id==="iso27001"){iso=iso27(a);readiness=iso.readiness}
  const gaps=ids.filter(id=>(a.answers[id]||"no")!=="yes").map(id=>gapOf(id,a)).sort((x,y)=>y.sc-x.sc);
  const sizeAdd=[0,0,1,2,3][si];
  const months=Math.max(f.months[0],Math.min(f.months[0]+f.months[1]+3,Math.round(f.months[0]+(1-readiness/100)*f.months[1]+sizeAdd*(f.months[1]>=5?1:.5))));
  const days=Math.round((f.base[si]+gaps.reduce((s,g)=>s+g.days*depth(f),0))*2)/2;
  const ext=f.ext?f.ext(si,p):null;
  const recur=f.recur?f.recur(si,p):null;
  return{f,ids,doms,readiness,iso,gaps,months,days,fees:{lo:days*rate*.9,hi:days*rate*1.15},ext,recur,level:levelOf(a,f),answered:ids.filter(id=>a.answers[id]).length};
}
function portfolio(a){
  const p=a.profile,rate=Number(cfg.rate)||1200;
  const res=selected(a).map(f=>fwResult(f,a));
  const ids=practiceIds(a);
  const reqIds=new Set();res.filter(r=>isMust(r.level)).forEach(r=>r.ids.forEach(id=>reqIds.add(id)));
  const gaps=ids.filter(id=>(a.answers[id]||"no")!=="yes").map(id=>gapOf(id,a,reqIds)).sort((x,y)=>y.sc-x.sc);
  const baseDays=res.reduce((s,r)=>s+r.f.base[sizeIx(p)],0);
  const days=Math.round((baseDays+gaps.reduce((s,g)=>s+g.days*Math.max(...g.fws.map(id=>depth(FW_BY_ID[id]))),0))*2)/2;
  const standalone=res.reduce((s,r)=>s+r.days,0);
  const consult={lo:days*rate*.9,hi:days*rate*1.15};
  const ext={lo:res.reduce((s,r)=>s+(r.ext?r.ext.lo:0),0),hi:res.reduce((s,r)=>s+(r.ext?r.ext.hi:0),0)};
  const tools=gaps.map(g=>toolCost(g,p)).filter(Boolean);
  const toolSum={lo:tools.reduce((s,t)=>s+t.lo,0),hi:tools.reduce((s,t)=>s+t.hi,0)};
  const year1={lo:consult.lo+ext.lo+toolSum.lo,hi:consult.hi+ext.hi+toolSum.hi};
  const ms=res.map(r=>r.months).sort((x,y)=>y-x);
  const months=ms.length?Math.min(24,Math.round(ms[0]+ms.slice(1).reduce((s,m)=>s+m,0)*.25)):0;
  const readiness=ids.length?Math.round(ids.reduce((s,id)=>s+val(a.answers[id]),0)/ids.length*100):0;
  const shared=ids.filter(id=>res.filter(r=>r.ids.includes(id)).length>1);
  return{res,ids,gaps,days,baseDays,standalone,saved:Math.max(0,standalone-days),consult,ext,tools,toolSum,year1,months,readiness,shared,rate,clientDays:Math.round(days*1.5),answered:ids.filter(id=>a.answers[id]).length};
}
function waves(pf){
  const names={1:"Must-haves: legal, contract and requested",2:"Quick wins and baselines",3:"Core certifications",4:"Add-on management systems"};
  const out=[];[1,2,3,4].forEach(w=>{const rs=pf.res.filter(r=>(isMust(r.level)&&r.f.wave>1?1:r.f.wave)===w);if(rs.length)out.push({w,name:names[w],rs})});
  let start=1;return out.map(o=>{const m=Math.max(...o.rs.map(r=>r.months));const s=start;start+=Math.max(1,Math.round(m*.5));return{...o,from:s,to:s+m-1}});
}

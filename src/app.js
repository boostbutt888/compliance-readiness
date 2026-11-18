/* ===================== State and storage ===================== */
const clone=o=>JSON.parse(JSON.stringify(o));
const newId=()=>"a"+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const NOW=Date.now();
const EXAMPLE={id:"example",example:true,created:NOW,updated:NOW,path:"guided",intake:{goals:["customers","law","esg"],budget:"50-150",deadline:"12",lead:"parttime"},fw:["pdpa","im8","ce","iso27001","iso22301","ghg","ecovadis"],
 profile:{...PROFILE_DEFAULT,name:"Harbourline Logistics Pte Ltd",industry:"Logistics",size:"51–200",status:"sub",customers:["mnc","gov"],markets:["asean"],regulated:[],driver:"tender",work:"hybrid",hosting:"cloud",dev:"outsourced",services:[],availability:"sla",ai:"use",it:"msp",suppliers:"many",data:["pii","nric","fin"],payments:"none",footprint:["office","logistics"],esgAsk:"some",certs:[]},
 answers:{P1:"partly",P21:"no",P2:"yes",P3:"partly",P4:"partly",P5:"no",P6:"no",P7:"yes",P8:"partly",P9:"no",P10:"yes",P11:"partly",P12:"yes",P13:"partly",P14:"no",P15:"yes",P16:"partly",P17:"yes",P18:"no",P19:"partly",P20:"no",
  Q1:"partly",Q2:"no",Q3:"no",Q5:"no",Q6:"partly",G1:"partly",G2:"no",R1:"no",R2:"partly",R3:"no",R4:"partly",CL3:"partly",A2:"no",
  E1:"no",E4:"partly",E5:"no",E6:"partly",E7:"yes",E8:"no",E10:"no",E11:"partly",E12:"no"}};
const blankAssessment=()=>({id:newId(),created:Date.now(),updated:Date.now(),profile:clone(PROFILE_DEFAULT),answers:{},fw:null,path:"guided",intake:{}});
function norm(a){
  if(!a)return a;
  a.profile={...PROFILE_DEFAULT,...(a.profile||{})};
  ["customers","markets","regulated","services","data","footprint","certs"].forEach(k=>{if(!Array.isArray(a.profile[k]))a.profile[k]=[]});
  if(a.profile.driver==="tender"||a.profile.driver==="reg"||a.profile.driver==="internal"||a.profile.driver==="investor");else a.profile.driver="tender";
  if(a.fw===undefined)a.fw=["iso27001"];        // assessments made before the multi-framework version
  a.answers=a.answers||{};
  if(!PATHS[a.path])a.path="full";
  a.intake=a.intake||{};
  return a;
}
function defaultFw(p){return screenAll(p).filter(s=>s.lvl==="required"||s.lvl==="recommended").map(s=>s.f.id)}

let items=[];
let mode="local", col=null;
let exampleWork=clone(EXAMPLE);
/* Contact details shown on the website and used for "Email Parang". Fill these in. */
const SITE_CONTACT={email:"",phone:""};
/* On the website (not inside Claude) downloads save real files and email buttons open the visitor's mail app */
const ON_SITE=!(window.claude&&window.claude.use);
const CFG_DEFAULT={firm:"Parang",email:SITE_CONTACT.email,phone:SITE_CONTACT.phone,rate:1200,response:"within 1 working day",showCost:true};
let cfg=(()=>{try{return {...CFG_DEFAULT,...JSON.parse(localStorage.getItem("iso27k-cfg")||"{}")}}catch(e){return {...CFG_DEFAULT}}})();
let isConsultant=false, leadsRemote=[], leadsMode="local", deskTab="leads", curLead=null, leadSent={};
let view="home", cur=null, step="profile", repTab="overview", soaFilter="all", soaTheme="all", libTab="frameworks", libQ="", libFam="all", pendingDelete=null;

const LS_KEY="iso27k-app-v1";
function readLocal(){try{const r=localStorage.getItem(LS_KEY);return r?JSON.parse(r):[]}catch(e){return null}}
function writeLocal(){try{localStorage.setItem(LS_KEY,JSON.stringify(items));return true}catch(e){return false}}
const localStart=readLocal();
items=(Array.isArray(localStart)?localStart:[]).map(norm);

function setSave(text,c){const el=document.getElementById("savestate");el.textContent=text;el.style.setProperty("--c",c)}
function idleSaveState(){
  if(mode==="db")setSave("Saved to your account","var(--good)");
  else if(localStart===null)setSave("Not saved: storage blocked","var(--bad)");
  else setSave("Saved on this device","var(--warn)");
}
idleSaveState();
let saveTimer=null,chain=Promise.resolve();
function touch(){
  if(!cur||cur.example)return;
  cur.updated=Date.now();
  const i=items.findIndex(x=>x.id===cur.id);if(i<0)items.push(cur);else items[i]=cur;
  setSave("Saving…","var(--warn)");
  clearTimeout(saveTimer);saveTimer=setTimeout(persist,600);
}
function persist(){
  const a=clone(cur);
  if(mode==="db"){
    chain=chain.then(()=>col.doc(a.id).set(a)).then(idleSaveState,e=>{if(e&&e.code==="invalid_argument"){mode="local";writeLocal()?idleSaveState():setSave("Not saved: storage blocked","var(--bad)");return}setSave(e&&e.code==="quota_exceeded"?"Storage full: delete old assessments":"Not saved: retrying on next change","var(--bad)")});
  }else{writeLocal()?idleSaveState():setSave("Not saved: storage blocked","var(--bad)")}
}
function removeItem(id){
  items=items.filter(x=>x.id!==id);
  if(mode==="db")chain=chain.then(()=>col.doc(id).delete()).catch(()=>setSave("Delete failed","var(--bad)"));
  else writeLocal();
}

/* Account storage, roles, firm settings and leads, when this view offers them */
let DB=null, UID=null;
(async()=>{
  try{
    if(location.protocol==="file:"){isConsultant=true;showDesk();return}
    if(!window.claude||!window.claude.use)return;
    const [db,user]=await Promise.all([window.claude.use("db"),window.claude.use("user")]);
    if(user){try{isConsultant=(await user.isOwner())||(await user.canEdit())}catch(e){}}
    if(isConsultant)showDesk();
    if(!db)return;
    DB=db;
    db.doc("config/firm").onSnapshot(d=>{if(d.exists){cfg={...CFG_DEFAULT,...d.data()};if(view==="assess"&&step==="report")renderReport();if(view==="desk")renderDesk()}},()=>{});
    if(isConsultant){
      db.collection("leads").onSnapshot(snap=>{
        const out=[];snap.docs.forEach(d=>{const subs=(d.data()||{}).subs||{};Object.keys(subs).forEach(k=>out.push(normLead({...clone(subs[k]),_doc:d.id,_key:k})))});
        leadsRemote=out;leadsMode="db";if(view==="desk")renderDesk();
      },()=>{});
    }
    if(!user)return;
    const uid=await user.id();if(!uid)return;
    UID=uid;
    col=db.collection("data/users/"+uid);
    let first=true;
    col.onSnapshot(async snap=>{
      const remote=snap.docs.map(d=>norm(clone(d.data())));
      if(first){
        first=false;mode="db";
        const toMove=items.filter(x=>!remote.some(r=>r.id===x.id));
        for(const x of toMove){try{await col.doc(x.id).set(clone(x));remote.push(x)}catch(e){mode="local";idleSaveState();return}}
        if(toMove.length){try{localStorage.removeItem(LS_KEY)}catch(e){}}
        idleSaveState();
      }
      items=remote.map(r=>cur&&r.id===cur.id?cur:r);
      if(cur&&!cur.example&&!items.some(x=>x.id===cur.id))items.push(cur);
      if(view==="home")renderHome();
    },()=>{mode="local";idleSaveState()});
  }catch(e){}
})();
function showDesk(){const b=document.getElementById("nav-desk");if(b)b.hidden=false;if(view==="assess"&&step==="report")renderReport()}

/* ===================== Helpers ===================== */
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const cap=s=>s==="partly"?"Partly":s==="yes"?"Yes":s==="no"?"No":"Excluded";
const fmtDate=t=>new Date(t).toLocaleDateString("en-SG",{day:"numeric",month:"short",year:"numeric"});
const short=q=>{const t=q.replace(/^(A |An )/,"").replace(/,.*$/,"");return t.charAt(0).toUpperCase()+t.slice(1)};
const nameOf=a=>a.profile.name||"Untitled assessment";
const money=(n,step=500)=>"S$"+(Math.round(n/step)*step).toLocaleString("en-SG");
const range=(r,step=1000)=>r.hi<=0?"—":`${money(r.lo,step)}–${money(r.hi,step).replace("S$","")}`;
const fwChips=ids=>ids.map(id=>`<span class="fwchip">${esc(FW_BY_ID[id].short)}</span>`).join("");
const lvlPill=l=>l?`<span class="pill L-${l}">${LEVELS[l]}</span>`:"";
const bar=(pct)=>`<span class="mini"><span>${pct}%</span><span class="track"><i style="width:${pct}%"></i></span></span>`;

/* ===================== Who gets paid ===================== */
const payPill=(k,who)=>k==="parang"?`<span class="pay P-us">Parang</span>`:`<span class="pay P-them">${esc(who||"Third party")}</span>`;
function payBlock(pf){
  const third=pf.res.filter(r=>r.ext&&r.ext.hi>0);
  return `<section class="card paycard"><h2>Who you pay</h2>
   <p style="margin:0;max-width:70ch">Only consulting goes to Parang. Audits, certificates, ratings and tools are paid by you, directly, to independent providers. The figures below are typical for those providers. Rules for certification bodies stop them from consulting for the companies they certify, so they are always a separate firm.</p>
   <div class="payrows">
     <div class="payrow us"><div class="ph">${payPill("parang")}<strong>Competitive fixed fee</strong></div><span>Consulting: gap fixes, policies, risk assessment, internal audit and audit support. The first 30-minute review is free. After that we agree a fixed fee sized to your scope and budget, with no obligation. Our team is led by industry veterans who have done this work on the ground, and we steer you away from work and purchases you don't need.</span></div>
     ${third.map(r=>`<div class="payrow"><div class="ph">${payPill("third",r.ext.who)}<strong>${range(r.ext)}</strong></div><span><b>${esc(r.f.short)}</b>: ${esc(r.ext.label)}. ${esc(r.ext.how||"")}</span></div>`).join("")}
     ${pf.toolSum.hi>0?`<div class="payrow"><div class="ph">${payPill("third",TOOL_WHO)}<strong>${range(pf.toolSum)}</strong></div><span>Tools some gaps need, such as device management or log monitoring. You choose and buy them; we help you compare options.</span></div>`:""}
   </div></section>`;
}

/* ===================== Icons ===================== */
const FAM_IC={"Cybersecurity":["shield","blue"],"Privacy":["lock","purple"],"Resilience and availability":["cycle","orange"],"AI and cloud":["cloud","teal"],"Sector":["building","indigo"],"Sustainability":["leaf","green"]};
const PATH_IC={guided:["compass","teal"],request:["stopwatch","orange"],direct:["target","rose"],full:["checklist","blue"]};
const tile=(n,c,cls="")=>`<span class="tile ${cls} c-${c}" aria-hidden="true"><svg class="ic"><use href="#i-${n}"/></svg></span>`;
const famTile=(fm,cls="")=>{const [n,c]=FAM_IC[fm]||["shield","blue"];return tile(n,c,cls)};

/* ===================== Navigation ===================== */
function setNav(){
  $("#nav-home").setAttribute("aria-current",view==="home"||view==="assess"?"page":"false");
  $("#nav-library").setAttribute("aria-current",view==="library"?"page":"false");
  $("#nav-desk").setAttribute("aria-current",view==="desk"||view==="brief"?"page":"false");
}
function go(v,opts={}){
  if(view==="assess"){if(step==="profile")readProfile();if(["goals","request"].includes(step))readIntake()}
  view=v;if(opts.step)step=opts.step;
  setNav();
  ({home:renderHome,assess:renderAssess,library:renderLibrary,desk:renderDesk,brief:renderBrief,start:renderChooser})[v]();
  if(!opts.keepScroll)window.scrollTo({top:0});
}

/* ===================== Home ===================== */
function renderHome(){
  const saved=[...items].sort((x,y)=>y.updated-x.updated);
  const row=(a)=>{const pf=portfolio(a);const high=pf.gaps.filter(g=>g.pr==="High").length;
    const confirm=pendingDelete===a.id?`<div class="confirm" data-stop><span>Delete <strong>${esc(nameOf(a))}</strong>? This can't be undone.</span><button class="btn small danger" type="button" data-del-yes="${a.id}">Delete</button><button class="btn small plain" type="button" data-del-no>Cancel</button></div>`:"";
    return `<div class="row" role="button" tabindex="0" data-open="${a.id}">
      <span class="who"><strong>${esc(nameOf(a))}${a.example?'<span class="tag">Example</span>':""}</strong><span class="meta">${esc(a.profile.industry)} · ${esc(a.profile.size)} staff · ${a.example?"Sample data":"Updated "+fmtDate(a.updated)}</span><span class="chips">${fwChips(a.fw||[])||'<span class="meta">No frameworks chosen yet</span>'}</span></span>
      ${bar(pf.readiness)}
      <span class="meta hi">${high} high-priority gap${high===1?"":"s"}<br>${pf.answered}/${pf.ids.length} answered</span>
      <span class="rowact">${a.example?`<button class="btn small plain" type="button" data-copy="example">Make a copy</button>`:`<button class="btn small plain" type="button" data-del="${a.id}" aria-label="Delete ${esc(nameOf(a))}">Delete</button>`}</span>
      ${confirm}</div>`};
  $("#view").innerHTML=`
   <div class="pagehead"><div><span class="eyebrow">Your assessments</span><h1>Compliance readiness</h1>
     <p>Profile a business once. See which of ${FRAMEWORKS.length} cybersecurity, privacy, resilience, AI, sector and sustainability frameworks apply, how ready it is for each, and what it takes to get there.</p></div>
     <button class="btn" type="button" id="newBtn"><span aria-hidden="true">+</span> New assessment</button></div>
   <div class="list">
     ${saved.length?saved.map(row).join(""):`<div class="empty">No saved assessments yet. Start a new one, or open the example below to see a finished report.</div>`}
   </div>
   <h2 style="margin:24px 0 10px;font-size:1.05rem">Example</h2>
   <div class="list">${row(exampleWork)}</div>
   <div class="how">
     <div>${tile("building","indigo")}<b>1 · Business</b><strong>22 questions</strong><span class="meta">Customers, regulators, data, technology and footprint.</span></div>
     <div>${tile("checklist","blue")}<b>2 · Frameworks</b><strong>${FRAMEWORKS.length} checked</strong><span class="meta">Each one marked required, recommended or optional, with the reason.</span></div>
     <div>${tile("gauge","green")}<b>3 · Practices</b><strong>Answer once</strong><span class="meta">Each answer counts towards every framework that shares it.</span></div>
     <div>${tile("ranked","orange")}<b>4 · Report</b><strong>Per framework and combined</strong><span class="meta">Readiness, ranked gaps, cost, timeline and a roadmap.</span></div>
   </div>`;
  $("#newBtn").addEventListener("click",()=>{pathPick="new";go("start")});
}
function openItem(id){
  cur=id==="example"?exampleWork:items.find(x=>x.id===id);if(!cur)return;norm(cur);
  const st=PATHS[cur.path].steps.map(x=>x[0]);
  step=cur.example||Object.keys(cur.answers).length||cur.skipCheck?"report":cur.fw?"practice":st[0];
  repTab="overview";go("assess");
}
function copyExample(){
  if(view==="assess"&&step==="profile")readProfile();
  const s=view==="assess"?step:"report";
  cur=clone(exampleWork);cur.id=newId();delete cur.example;cur.created=cur.updated=Date.now();cur.profile.name=cur.profile.name+" (copy)";
  items.push(cur);touch();view="none";go("assess",{step:PATHS[cur.path].steps.some(x=>x[0]===s)?s:"report"});
}

/* ===================== Assessment workspace ===================== */
const stepsOf=a=>PATHS[a.path||"full"].steps;
const nextOf=k=>{const st=stepsOf(cur);const i=st.findIndex(x=>x[0]===k);return st[i+1]?st[i+1][0]:null};
const prevOf=k=>{const st=stepsOf(cur);const i=st.findIndex(x=>x[0]===k);return i>0?st[i-1][0]:null};
const selStepOf=a=>({guided:"plan",request:"feasibility",direct:"choose",full:"frameworks"})[a.path||"full"];
function renderAssess(){
  const a=cur,st=stepsOf(a);
  if(!st.some(x=>x[0]===step))step=st[0][0];
  $("#view").innerHTML=`
   <div class="wshead"><div class="crumb"><button class="linkbtn" type="button" data-nav="home">← All assessments</button>${a.example?"":`<span class="meta">·</span><button class="linkbtn" type="button" data-change-path>Change approach</button>`}</div>
     <span class="eyebrow routeline">${tile(PATH_IC[a.path][0],PATH_IC[a.path][1],"sm")}${esc(PATHS[a.path].name)} route · ${esc(PATHS[a.path].title)}</span>
     <h1 id="wsTitle">${esc(nameOf(a))}</h1><span class="meta" id="wsMeta"></span></div>
   ${a.example?`<div class="banner"><span><strong>This is the example.</strong> Changes here aren't saved. Make a copy to keep your edits.</span><button class="btn small" type="button" data-copy="example">Make a copy</button></div>`:""}
   <div class="steps" style="grid-template-columns:repeat(${st.length},minmax(0,1fr))" role="tablist" aria-label="Steps">
     ${st.map(([k,l],i)=>`<button role="tab" type="button" data-step="${k}" aria-selected="${step===k}"><span class="n">${i+1}</span>${l}</button>`).join("")}
   </div>
   <div id="stepview"></div>`;
  updateMeta();renderStep();
}
function renderStep(){({profile:renderProfile,frameworks:renderFrameworks,practice:renderPractice,report:renderReport,goals:renderGoals,plan:renderPlan,request:renderRequest,feasibility:renderFeasibility,choose:renderChoose})[step]()}
function updateMeta(){const m=$("#wsMeta");if(!m)return;const t=$("#wsTitle");if(t)t.textContent=nameOf(cur);if(!cur.fw||!cur.fw.length){m.textContent="No frameworks chosen yet";return}const pf=portfolio(cur);m.textContent=`${cur.fw.length} framework${cur.fw.length===1?"":"s"} · ${cur.skipCheck?"self-check skipped":pf.readiness+"% ready overall · "+pf.answered+" of "+pf.ids.length+" practices answered"}${cur.example?"":" · Updated "+fmtDate(cur.updated)}`}
function ensureFw(){
  if(cur.fw)return;
  if(cur.path==="guided")cur.fw=planTiers(cur).start.map(c=>c.f.id);
  else if(cur.path==="request"){const asked=(cur.intake.asked||[]).filter(id=>FW_BY_ID[id]);cur.fw=asked.length?asked:defaultFw(cur.profile)}
  else if(cur.path==="direct")cur.fw=[];
  else cur.fw=defaultFw(cur.profile);
  touch();
}
function setStep(s){
  if(step==="profile")readProfile();
  if(["goals","request"].includes(step))readIntake();
  const order=stepsOf(cur).map(x=>x[0]);
  if(order.indexOf(s)>order.indexOf(selStepOf(cur)))ensureFw();
  step=s;document.querySelectorAll(".steps button").forEach(b=>b.setAttribute("aria-selected",b.dataset.step===s));renderStep();updateMeta();window.scrollTo({top:0})
}

function profileQs(a){
  if(a.path!=="direct")return PROFILE_Q.map(q=>q.id);
  const need=new Set(CORE_Q);(a.fw||[]).forEach(id=>(PROFILE_NEEDS[id]||[]).forEach(k=>need.add(k)));return PROFILE_Q.map(q=>q.id).filter(id=>need.has(id));
}
const SEC_OF=(()=>{let sec="";const m={};PROFILE_Q.forEach(q=>{if(q.sec)sec=q.sec;m[q.id]=sec});return m})();
function renderProfile(){
  const p=cur.profile,vis=profileQs(cur);let lastSec="";
  const html=PROFILE_Q.filter(q=>vis.includes(q.id)).map(q=>{const secH=SEC_OF[q.id]!==lastSec?(lastSec=SEC_OF[q.id]):"";
    let inner="";
    if(q.type==="text")inner=`<input type="text" id="f-${q.id}" value="${esc(p[q.id])}" placeholder="e.g. Acme Pte Ltd" autocomplete="organization">`;
    else if(q.type==="select")inner=`<select id="f-${q.id}">${q.opts.map(o=>`<option ${p[q.id]===o?"selected":""}>${esc(o)}</option>`).join("")}</select>`;
    else{const multi=q.type==="check";
      inner=`<div class="opts">${q.opts.map((o,i)=>{const[v,l]=Array.isArray(o)?o:[o,o];const on=multi?(p[q.id]||[]).includes(v):p[q.id]===v;
        return `<label class="opt"><input type="${multi?"checkbox":"radio"}" name="f-${q.id}" id="f-${q.id}-${i}" value="${esc(v)}" ${on?"checked":""}>${esc(l)}</label>`}).join("")}</div>`}
    const lbl=q.type==="text"||q.type==="select"?`<label class="lbl" for="f-${q.id}">${esc(q.label)}</label>`:`<span class="lbl" id="f-${q.id}-l">${esc(q.label)}</span>`;
    return `${secH?`<h2 class="secHead">${esc(secH)}</h2>`:""}<div class="q"${q.type==="check"||q.type==="radio"?` role="group" aria-labelledby="f-${q.id}-l"`:""}>${lbl}${q.help?`<div class="help">${esc(q.help)}</div>`:""}${inner}</div>`;
  }).join("");
  $("#stepview").innerHTML=`<div class="panel"><div class="grid2">${html}</div>
   <div class="nav">${prevOf("profile")?`<button class="btn ghost" data-step="${prevOf("profile")}" type="button">Back</button>`:`<span class="meta">These answers decide which frameworks apply and which practices you'll be asked about.</span>`}<button class="btn" data-step="${nextOf("profile")}" type="button" id="profNext">Next: ${({frameworks:"see frameworks",plan:"see your plan",feasibility:"check the deadline",practice:"self-check"})[nextOf("profile")]}</button></div></div>`;
  $("#stepview").querySelectorAll("input,select").forEach(el=>el.addEventListener("input",()=>{readProfile();touch();updateMeta()}));
}
function readProfile(){
  if(!cur||!document.getElementById("f-name"))return;
  const p=cur.profile;
  PROFILE_Q.forEach(q=>{
    if(q.type==="text"||q.type==="select"){const el=$("#f-"+q.id);if(el)p[q.id]=q.type==="text"?el.value.trim():el.value}
    else if(q.type==="radio"){const el=document.querySelector(`input[name="f-${q.id}"]:checked`);if(el)p[q.id]=el.value}
    else if(document.querySelector(`input[name="f-${q.id}"]`))p[q.id]=[...document.querySelectorAll(`input[name="f-${q.id}"]:checked`)].map(e=>e.value);
  });
}

function renderFrameworks(){
  if(!cur.fw){cur.fw=defaultFw(cur.profile);touch()}
  const p=cur.profile,sc=screenAll(p),sel=new Set(cur.fw||[]);
  const card=s=>{const f=s.f,on=sel.has(f.id);
    return `<label class="fwcard${on?" on":""}"><input type="checkbox" data-fw="${f.id}" id="fw-${f.id}" ${on?"checked":""}>
      <span class="fwtop"><strong>${esc(f.short)}</strong>${lvlPill(s.lvl)}</span>
      <span class="meta">${esc(f.kind)} · ${esc(f.name)}</span>
      ${s.why&&s.why.length?`<ul class="why">${s.why.map(w=>`<li>${esc(w)}</li>`).join("")}</ul>`:`<span class="meta">${esc(f.who)}</span>`}</label>`};
  const fam=FAMILIES.map(fm=>{const list=sc.filter(s=>s.f.fam===fm).sort((x,y)=>lvlRank(x.lvl)-lvlRank(y.lvl));
    return `<section class="fwfam"><h2 class="famh">${famTile(fm)}${esc(fm)}</h2><div class="fwgrid">${list.map(card).join("")}</div></section>`}).join("");
  const req=sc.filter(s=>s.lvl==="required").length,rec=sc.filter(s=>s.lvl==="recommended").length;
  $("#stepview").innerHTML=`<div class="panel">
    <div class="summarybar"><span><strong>${req}</strong> required · <strong>${rec}</strong> recommended for this business. Tick the ones to assess.</span>
      <span class="exports"><button class="btn small plain" type="button" id="fwDefault">Select required and recommended</button><span class="meta" id="fwCount">${sel.size} selected</span></span></div>
    ${fam}
    <div class="nav"><button class="btn ghost" data-step="profile" type="button">Back</button><button class="btn" data-step="practice" type="button" id="fwNext">Next: rate practices</button></div></div>`;
  $("#stepview").querySelectorAll("input[data-fw]").forEach(el=>el.addEventListener("change",()=>{
    const ids=[...document.querySelectorAll("input[data-fw]:checked")].map(e=>e.dataset.fw);
    cur.fw=FRAMEWORKS.map(f=>f.id).filter(id=>ids.includes(id));touch();updateMeta();
    el.closest(".fwcard").classList.toggle("on",el.checked);$("#fwCount").textContent=`${cur.fw.length} selected`;
  }));
  $("#fwDefault").addEventListener("click",()=>{cur.fw=defaultFw(p);touch();renderFrameworks();updateMeta()});
}
const lvlRank=l=>({requested:0,required:0,recommended:1,optional:2})[l]??3;

function renderPractice(){
  const a=cur,p=a.profile,ids=practiceIds(a);
  if(!ids.length){$("#stepview").innerHTML=`<div class="panel"><section class="card"><h2>No frameworks selected</h2><p class="meta" style="margin:0">Choose at least one framework to see the practices to rate.</p><div><button class="btn" data-step="${selStepOf(a)}" type="button">Choose frameworks</button></div></section></div>`;return}
  const sel=selected(a);
  const groups=AREAS.map(ar=>{const list=ids.filter(id=>P_BY_ID[id].area===ar);if(!list.length)return"";
    return `<h2 class="secHead">${esc(ar)} <span class="meta">${list.length}</span></h2>`+list.map(id=>{const x=P_BY_ID[id],v=a.answers[id];
      const fws=sel.filter(f=>fwPractices(f,p).includes(id)).map(f=>f.id);
      return `<div class="q" role="radiogroup" aria-labelledby="l-${id}"><div class="lbl" id="l-${id}">${esc(x.q)}</div>${x.help?`<div class="help">${esc(x.help)}</div>`:""}
       <div class="tri">${[["yes","Yes","y"],["partly","Partly","p"],["no","No","x"]].map(([vv,l,k])=>`<label class="${k}"><input type="radio" name="a-${id}" id="a-${id}-${vv}" value="${vv}" ${v===vv?"checked":""}>${l}</label>`).join("")}</div>
       <div class="ctrls"><span class="meta">Counts for</span>${fwChips(fws)}</div></div>`}).join("")}).join("");
  const n=ids.filter(id=>a.answers[id]).length;
  $("#stepview").innerHTML=`<div class="panel">
   <div class="progress"><span id="progTxt">${n} of ${ids.length} answered</span><span class="track"><i id="progBar" style="width:${n/ids.length*100}%"></i></span></div>
   <div class="meta">Unanswered practices count as No. Be strict: "Yes" means an auditor or assessor could see evidence today.</div>
   ${a.path==="direct"?`<div class="note"><span>In a hurry? Skip the self-check and request a quote. Estimates will assume you're partly there on every practice.</span> <button class="btn small plain" type="button" id="skipCheck">Skip and request a quote</button></div>`:""}
   <div class="grid2">${groups}</div>
   <div class="nav"><button class="btn ghost" data-step="${prevOf("practice")}" type="button">Back</button><button class="btn" data-step="report" type="button">See report</button></div></div>`;
  if($("#skipCheck"))$("#skipCheck").addEventListener("click",()=>{cur.skipCheck=true;touch();setStep("report")});
  $("#stepview").querySelectorAll('input[type=radio]').forEach(el=>el.addEventListener("change",e=>{
    cur.answers[e.target.name.slice(2)]=e.target.value;if(cur.skipCheck)cur.skipCheck=false;touch();updateMeta();
    const m=ids.filter(id=>cur.answers[id]).length;$("#progTxt").textContent=`${m} of ${ids.length} answered`;$("#progBar").style.width=(m/ids.length*100)+"%";
  }));
}

/* ===================== Report ===================== */
const PURPOSE={"Technology / SaaS":"develop, host and support its software services","Financial services":"deliver its financial products and services","Healthcare":"provide healthcare services and manage patient information","Education":"deliver education services and manage student information","Logistics":"plan, track and deliver freight and logistics services","Retail / F&B":"run its retail and food operations, including online orders and payments","Hospitality":"run its hospitality operations and guest services","Professional services":"deliver advisory and professional services to clients","Manufacturing":"design, produce and ship its products","Construction / Real estate":"deliver its construction and property services","Government vendor":"deliver contracted services to government agencies"};
function scopeText(p){
  const loc=p.work==="remote"?"staff working remotely in Singapore":p.work==="office"?"its Singapore office":"its Singapore office and staff working remotely";
  const host=p.hosting==="cloud"?"cloud-hosted systems":p.hosting==="hybrid"?"cloud-hosted systems and company-operated servers":"company-operated servers";
  const dev=p.dev==="none"?"":p.dev==="inhouse"?", and the in-house software development process":p.dev==="outsourced"?", and the management of outsourced software development":", and in-house and outsourced software development";
  return `The information security management system of ${esc(p.name||"the company")} covers the people, processes and information used to ${PURPOSE[p.industry]||"deliver its services"}. It covers ${loc}, ${host}${dev}, in line with the Statement of Applicability.`;
}
const CLAUSES=[["4.3","ISMS scope defined and approved",()=>"partly","Draft below; needs management sign-off"],["5.2","Information security policy",a=>a.answers.P1],["5.3","Roles, responsibilities and authorities",a=>a.answers.P2],["6.1.2","Risk assessment",a=>a.answers.P21],["6.1.3","Statement of Applicability",()=>"partly","Draft generated below; needs review"],["6.2","Security objectives and plans",a=>a.answers.P1==="yes"&&a.answers.P21==="yes"?"yes":"partly"],["7.2–7.3","Competence and awareness",a=>a.answers.P11],["9.2","Internal audit",a=>a.answers.P9],["9.3","Management review",a=>a.answers.P21==="yes"?"partly":"no"],["10.2","Nonconformity and corrective action",a=>a.answers.P9==="yes"?"partly":"no"]];
function obligations(a){
  const p=a.profile,o=[],d=p.data||[],certs=p.certs||[],sel=new Set(a.fw||[]);
  if(d.some(x=>["pii","nric","health","children","fin"].includes(x))||has(p,"customers","consumers"))o.push(["PDPA (Singapore)","You handle personal data: you need a DPO, consent and purpose rules, and must notify PDPC of notifiable breaches within 3 calendar days of assessing them."]);
  if(d.includes("nric"))o.push(["PDPC NRIC advisory","Collect NRIC numbers only where law requires it or identity must be verified to a high degree."]);
  if(p.payments==="direct"||d.includes("card"))o.push(["PCI DSS","Handling card data brings PCI DSS into scope through your acquirer and card scheme rules."]);
  if(has(p,"markets","eu"))o.push(["EU GDPR","Applies when you offer goods or services to people in the EU or monitor them, even from Singapore."]);
  if(has(p,"regulated","mas"))o.push(["MAS technology risk","Notify MAS within 1 hour of discovering a relevant incident and send a root-cause report within 14 days. Critical systems should have no more than 4 hours of unscheduled downtime in 12 months."]);
  if(has(p,"regulated","moh"))o.push(["Healthcare Services Act","Licensed healthcare providers have cybersecurity and data requirements under the HCSA."]);
  if(!certs.includes("ct")&&isGov(p))o.push(["CSA Cyber Trust mark","Increasingly asked for in government tenders; ISO 27001 work covers most of it."]);
  if(!certs.includes("ce")&&!certs.includes("ct"))o.push(["CSA Cyber Essentials mark","Entry-level mark for SMEs. Eligible SMEs can get up to 70% co-funding for cyber consultancy through CSA's CISO-as-a-Service scheme."]);
  if(p.status==="listed")o.push(["SGX climate reporting","Scope 1 and 2 mandatory from FY2025; Scope 3 from FY2026 for STI constituents. Other ISSB disclosures from FY2025 (STI), FY2028 (S$1 billion market cap and above) or FY2030 (others). External limited assurance from FY2029."]);
  if(p.status==="sub")o.push(["Group climate reporting","Listed and large groups report under ISSB-based rules and will ask subsidiaries and suppliers for Scope 1–3 data."]);
  if(has(p,"footprint","euexport"))o.push(["EU CBAM","The definitive period began on 1 January 2026. EU importers of cement, iron and steel, aluminium, fertilisers, hydrogen and electricity must report embedded emissions, so they will ask you for data."]);
  if(has(p,"footprint","energy"))o.push(["Energy Conservation Act","Businesses using 54 TJ of energy a year or more must register with NEA, appoint an energy manager and report energy use and improvement plans."]);
  if(has(p,"footprint","energy")||has(p,"footprint","factory"))o.push(["Carbon tax","Applies to facilities emitting 25,000 tCO2e a year or more, at S$45 per tonne for 2026–2027. Large customers may pass costs and data requests down to you."]);
  if(["Manufacturing","Retail / F&B"].includes(p.industry)||has(p,"footprint","factory"))o.push(["NEA mandatory packaging reporting","Producers of packaged goods, importers and retailers with turnover above S$10 million must report packaging data and reduction plans."]);
  return o;
}
function roadmap27(r){
  const g=r.gaps,M=r.months;
  const foundation=g.filter(x=>["P1","P21","P2","P3"].includes(x.id));
  const high=g.filter(x=>x.pr==="High"&&!foundation.includes(x)&&x.id!=="P9");
  const rest=g.filter(x=>!foundation.includes(x)&&!high.includes(x)&&x.id!=="P9");
  const a=Math.max(1,Math.round(M*.2)),b=Math.max(a+1,Math.round(M*.55)),c=Math.max(b+1,M-2);
  const li=l=>l.length?l.map(x=>`<li>${esc(short(x.q))}</li>`).join(""):"<li>Already in place</li>";
  return [["Set up the ISMS",`Months 1–${a}`,li(foundation)+"<li>Approve scope and Statement of Applicability</li>"],
    ["Close high-priority gaps",`Months ${a+1}–${b}`,li(high)],
    ["Close remaining gaps, build evidence",`Months ${b+1}–${c}`,li(rest)+"<li>Run controls for at least 3 months so records exist</li>"],
    ["Audit",`Months ${c+1}–${M}`,"<li>Internal audit and management review</li><li>Stage 1 audit (documents)</li><li>Stage 2 audit (evidence) and certificate</li>"]];
}
function soaRows(rows){return rows.map(x=>`<tr><td class="id">A.${x.id}</td><td>${esc(x.name)}${x.why?`<span class="why">${esc(x.why)}</span>`:""}</td><td>${x.app?"Yes":"No"}</td><td><span class="pill ${cap(x.st)}">${cap(x.st)}</span></td></tr>`).join("")}
function domainBars(doms){return `<div class="bars">${doms.map(t=>`<div class="bar"><span class="name">${esc(t.n)} <span class="muted">(${t.count})</span></span>
   <span class="track" role="img" aria-label="${esc(t.n)}: ${t.y} in place, ${t.pa} partly, ${t.no} missing"><i style="width:${t.count?t.y/t.count*100:0}%;background:var(--good)"></i><i style="width:${t.count?t.pa/t.count*100:0}%;background:var(--warn)"></i><i style="width:${t.count?t.no/t.count*100:0}%;background:var(--bad);opacity:.55"></i></span>
   <span class="pct">${t.pct}%</span></div>`).join("")}</div>
   <div class="legend"><span style="--c:var(--good)">In place</span><span style="--c:var(--warn)">Partly</span><span style="--c:var(--bad)">Missing</span></div>`}
function gapList(gaps,showFw){return gaps.map(g=>`<div class="gap"><span class="pill ${g.pr}">${g.pr}</span><div class="body"><strong>${esc(g.q)}</strong>
   <span class="meta">Currently: ${cap(g.st)} · Effort: ${EFFORT[g.e]}${g.c&&g.c.length?" · ISO 27001 "+g.c.length+" control"+(g.c.length===1?"":"s"):""}</span>
   ${showFw&&g.fws.length?`<div class="ctrls"><span class="meta">Closes gaps in</span>${fwChips(g.fws)}</div>`:""}</div></div>`).join("")||`<p class="muted">No gaps.</p>`}

function overviewBody(a,pf,interactive){
  const rows=pf.res.map(r=>`<tr${interactive?` class="click" data-rtab="${r.f.id}" tabindex="0"`:""}><td><strong>${esc(r.f.short)}</strong><span class="why">${esc(r.f.kind)}</span></td><td>${lvlPill(r.level)}</td><td style="min-width:120px">${bar(r.readiness)}</td><td class="num">${r.gaps.length}</td><td class="num">~${r.months} mo</td><td class="num">${r.ext&&r.ext.hi>0?range(r.ext):"—"}</td></tr>`).join("");
  const w=waves(pf);
  const multi=pf.gaps.filter(g=>g.fws.length>1).length;
  return `${situationCard(a,pf)}
   <div class="tiles">
     <div class="tile lead"><span class="v">${a.skipCheck?"—":pf.readiness+"%"}</span><span class="k">${a.skipCheck?"Readiness not checked":"Overall readiness"}</span></div>
     <div class="tile"><span class="v">${pf.res.length}</span><span class="k">Frameworks assessed</span></div>
     <div class="tile"><span class="v">${pf.gaps.length}</span><span class="k">Unique gaps (${pf.gaps.filter(g=>g.pr==="High").length} high)</span></div>
     <div class="tile"><span class="v">~${pf.months}<span style="font-size:1rem;font-weight:600"> mo</span></span><span class="k">To complete all (indicative)</span></div>
   </div>
   <section class="card"><h2>Frameworks at a glance</h2>${interactive?'<p class="meta" style="margin:0">Select a row for the detail.</p>':""}
     <div class="tablewrap"><table><thead><tr><th>Framework</th><th>Status</th><th>Readiness</th><th class="num">Gaps</th><th class="num">Time</th><th class="num">Audit fees, paid to them</th></tr></thead><tbody>${rows}</tbody></table></div>
     <p class="meta" style="margin:0">Audit fees go directly to the independent certification body, auditor or assessor, not to Parang. Parang's consulting is quoted separately as a competitive fixed fee after the free review.</p></section>
   ${payBlock(pf)}
   <section class="card"><h2>Answer once, use many times</h2>
     <p style="margin:0">${pf.shared.length} of your ${pf.ids.length} practices count towards more than one framework, and ${multi} of the gaps close several at once. Running the frameworks as one programme cuts about <strong>${pf.standalone?Math.round(pf.saved/pf.standalone*100):0}% of the effort</strong> compared with separate projects, and that saving is reflected in our fee.</p></section>
   <section class="card"><h2>Suggested order</h2><div class="phases">${w.map(x=>`<div class="phase"><span class="when">Months ${x.from}–${x.to}</span><h3>${esc(x.name)}</h3><ul>${x.rs.map(r=>`<li>${esc(r.f.short)}</li>`).join("")}</ul></div>`).join("")}</div></section>
   <section class="card"><h2>Gaps to close, ranked</h2><p class="meta" style="margin:0">Ranked by impact, raised where a required framework depends on them. Each shows which frameworks it moves forward.</p><div>${interactive&&pf.gaps.length>10?`${gapList(pf.gaps.slice(0,10),true)}<details class="more"><summary>Show the other ${pf.gaps.length-10} gaps</summary>${gapList(pf.gaps.slice(10),true)}</details>`:gapList(pf.gaps,true)}</div></section>
   ${obligations(a).length?`<section class="card"><h2>Other obligations flagged</h2><div class="oblig">${obligations(a).map(([t,d])=>`<div><strong>${t}</strong><span class="muted" style="font-size:.93rem">${d}</span></div>`).join("")}</div></section>`:""}
   ${engagementBlock(pf,a)}`;
}
function situationCard(a,pf){
  const it=a.intake||{},dl=deadlineMonths(it.deadline),B=budgetMax(it.budget),notes=[];
  if(a.skipCheck)notes.push(`<div class="note">You skipped the self-check, so these figures assume you're partly there on every practice. <button class="linkbtn" type="button" data-step="practice">Do the self-check</button> for sharper numbers.</div>`);
  if(B!==Infinity){const bl=(BUDGETS.find(b=>b[0]===it.budget)||[])[1];notes.push(`<div class="note">Your budget: ${esc(bl)}. We'll shape the plan around it in the free review, phasing the work if needed so you start with what matters most.</div>`)}
  if(it.lead==="none")notes.push(`<div class="note warn">No internal lead yet. Plan for about ${commitment(pf)} hours a week from someone inside the business.</div>`);
  const rows=dl!==Infinity?pf.res.map(r=>{const fz=feas(r.f,r.months,dl);return `<tr><td><strong>${esc(r.f.short)}</strong></td><td><span class="feas F-${fz.st}">${FEAS_LABEL[fz.st]}</span></td><td class="num">~${r.months} mo</td><td>${fz.st==="ok"?"On track if you start now":esc((INTERIM[r.f.id]||["Discuss a narrower first scope"])[0])}</td></tr>`}).join(""):"";
  if(!notes.length&&!rows)return"";
  return `<section class="card"><h2>Your situation</h2>${notes.join("")}
   ${rows?`<h3>Against your deadline of ${dl} month${dl===1?"":"s"}</h3><div class="tablewrap"><table><thead><tr><th>Framework</th><th>Fit</th><th class="num">Needed</th><th>If time is short</th></tr></thead><tbody>${rows}</tbody></table></div>`:""}</section>`;
}
function fwBody(a,r,interactive){
  const f=r.f,sv=f.screen(a.profile)||{};
  let extra="";
  if(f.id==="iso27001"&&r.iso){
    const clauses=CLAUSES.map(([n,t,fn,note])=>{const s=fn(a)||"no";return `<div class="clause"><span class="mono">${n}</span><span class="t">${t}${note?`<br><span class="meta">${note}</span>`:""}</span><span class="pill ${cap(s)}">${cap(s)}</span></div>`}).join("");
    const rm=roadmap27({gaps:r.gaps,months:r.months}).map(([t,w,l])=>`<div class="phase"><span class="when">${w}</span><h3>${t}</h3><ul>${l}</ul></div>`).join("");
    extra=`<section class="card"><h2>Mandatory ISMS clauses</h2><p class="meta" style="margin:0">Clauses 4–10 cannot be excluded. Auditors check these first.</p><div class="clauses">${clauses}</div></section>
     <section class="card"><h2>Road to certification</h2><div class="phases">${rm}</div></section>
     <section class="card"><h2>Draft ISMS scope</h2><p class="scope">${scopeText(a.profile)}</p></section>
     <section class="card">${interactive?`<h2>Statement of Applicability</h2><div class="filters" id="soaF">${[["all","All"],["gaps","Gaps"],["done","In place"],["excluded","Excluded"]].map(([v,l])=>`<button class="chip" data-f="${v}" aria-pressed="${soaFilter===v}" type="button">${l}</button>`).join("")}<span style="width:8px"></span>${[["all","All themes"],...Object.values(THEMES).map(t=>[t,t])].map(([v,l])=>`<button class="chip" data-t="${v}" aria-pressed="${soaTheme===v}" type="button">${l}</button>`).join("")}</div>`:`<h2>Statement of Applicability</h2>`}
       <div class="tablewrap"><table><thead><tr><th>Control</th><th>Title and justification</th><th>Applies</th><th>Status</th></tr></thead><tbody id="soaBody">${interactive?"":soaRows(r.iso.rows)}</tbody></table></div></section>`;
  }
  const cost=`<div class="tablewrap"><table class="cost"><thead><tr><th>Item</th><th>Paid to</th><th class="num">Low</th><th class="num">High</th></tr></thead><tbody>
     <tr><td>Consulting</td><td>${payPill("parang")}</td><td colspan="2">${esc(PARANG_PITCH)}</td></tr>
     ${r.ext&&r.ext.hi>0?`<tr><td>${esc(r.ext.label)}</td><td>${payPill("third",r.ext.who)}</td><td class="num">${money(r.ext.lo)}</td><td class="num">${money(r.ext.hi)}</td></tr>`:r.ext?`<tr><td>${esc(r.ext.label)}</td><td>${payPill("third",r.ext.who)}</td><td class="num" colspan="2">not yet required</td></tr>`:`<tr><td>No external audit or certificate</td><td>—</td><td class="num">—</td><td class="num">—</td></tr>`}
     ${r.recur?`<tr class="sub"><td>${esc(r.recur.label)}</td><td>${payPill("third",r.recur.who)}</td><td class="num">${money(r.recur.lo)}/yr</td><td class="num">${money(r.recur.hi)}/yr</td></tr>`:""}
   </tbody></table></div>
   ${r.ext&&r.ext.how?`<p class="meta" style="margin:0"><strong>About ${esc(r.ext.who.charAt(0).toLowerCase()+r.ext.who.slice(1))}:</strong> ${esc(r.ext.how)}</p>`:""}`;
  return `
   <div class="fwhead"><div><span class="eyebrow">${esc(f.fam)} · ${esc(f.kind)}</span><h2 class="big">${esc(f.name)}</h2><span class="meta">${esc(f.issuer)}</span></div>${lvlPill(r.level)}</div>
   <section class="card"><p style="margin:0">${esc(f.what)}</p>${sv.why&&sv.why.length?`<div><strong>Why it applies to you</strong><ul class="why">${sv.why.map(w=>`<li>${esc(w)}</li>`).join("")}</ul></div>`:""}</section>
   <div class="tiles">
     <div class="tile lead"><span class="v">${r.readiness}%</span><span class="k">Readiness</span></div>
     <div class="tile"><span class="v">${r.gaps.length}</span><span class="k">Gaps (${r.gaps.filter(g=>g.pr==="High").length} high)</span></div>
     <div class="tile"><span class="v">~${r.months}<span style="font-size:1rem;font-weight:600"> mo</span></span><span class="k">To complete, on its own</span></div>
     <div class="tile"><span class="v">${r.ext&&r.ext.hi>0?range(r.ext):"None"}</span><span class="k">${r.ext&&r.ext.hi>0?"Audit fees, paid to the auditor":"No external audit fee"}</span></div>
   </div>
   <section class="card">${expectBlock(f,r)}</section>
   <section class="card"><h2>Readiness by ${f.id==="iso27001"?"Annex A theme":"requirement area"}</h2>${domainBars(f.id==="iso27001"&&r.iso?r.iso.themes:r.doms)}</section>
   <section class="card"><h2>Gaps</h2><div>${gapList(r.gaps,false)}</div></section>
   <section class="card"><h2>Indicative cost</h2>${cost}</section>
   ${extra}`;
}
function renderReport(){
  if(!cur.fw||!cur.fw.length){$("#stepview").innerHTML=`<div class="panel"><section class="card"><h2>No frameworks selected</h2><p class="meta" style="margin:0">Choose at least one framework to see a report.</p><div><button class="btn" data-step="${selStepOf(cur)}" type="button">Choose frameworks</button></div></section></div>`;return}
  const a=effA(cur);const pf=portfolio(a);
  if(repTab!=="overview"&&!a.fw.includes(repTab))repTab="overview";
  const firm=cfg.firm||"our consultants";
  const costLine=cfg.showCost?`For a ${esc(a.profile.size)}-staff ${esc(a.profile.industry.toLowerCase())} business at your readiness, the ${pf.res.length} framework${pf.res.length===1?"":"s"} you chose typically take about <strong>${pf.months} months</strong>. ${pf.ext.hi>0?` Independent audit and certification fees are typically <strong>${range(pf.ext)}</strong>, paid directly to them`:""}${pf.toolSum.hi>0?`${pf.ext.hi>0?", plus":" Tools typically cost"} about <strong>${range(pf.toolSum)}</strong> for tools from vendors you choose`:""}${pf.ext.hi>0||pf.toolSum.hi>0?".":""} Parang's own fee is competitive and agreed with you after a free review. Our team is led by industry veterans who clear the roadblocks, so you don't spend time and money on work you don't need.`:`For a business like yours, the frameworks you chose typically take about <strong>${pf.months} months</strong>.`;
  const funds=[...new Set(pf.res.map(r=>r.f.fund).filter(Boolean))];
  const tabs=[["overview","Overview"],...pf.res.map(r=>[r.f.id,r.f.short])];
  const body=repTab==="overview"?overviewBody(a,pf,true):fwBody(a,pf.res.find(r=>r.f.id===repTab),true);
  $("#stepview").innerHTML=`<div class="panel">
   <section class="cta" aria-labelledby="ctaH">
     <div class="cta-text"><span class="eyebrow">Next step</span><h2 id="ctaH">${pf.gaps.length?`Close your ${pf.gaps.length} gap${pf.gaps.length===1?"":"s"} with an expert`:"Get audit-ready with an expert"}</h2>
     <p>${costLine}</p>${funds.length?`<p class="meta">${funds.map(k=>esc(FUNDING[k])).join(" ")}</p>`:""}<p class="meta">Indicative only. A consultant will confirm scope, cost and timeline after a free 30-minute review of your answers.</p></div>
     <div class="cta-act"><a class="btn" href="#contact" id="ctaBtn">Talk to a consultant</a>${isConsultant?`<button class="btn ghost" type="button" id="previewBrief">Consultant brief</button>`:""}</div>
   </section>
   <div class="exports">${ON_SITE?`<a class="btn plain" id="mailSummary" href="${esc(mailtoHref("",`Compliance readiness: ${nameOf(a)}`,summaryText(a,pf)))}">Email a summary</a>`:""}<button class="btn plain" type="button" id="dlReport">Download report</button><button class="btn plain" type="button" id="dlGaps">Download gap register (.csv)</button>${a.fw.includes("iso27001")?`<button class="btn plain" type="button" id="dlCsv">Download ISO 27001 SoA (.csv)</button>`:""}<span class="toast" id="toast" aria-live="polite"></span></div>
   <div class="tabs" role="tablist" aria-label="Report sections" id="repTabs">${tabs.map(([k,l])=>`<button role="tab" type="button" data-rtab="${k}" aria-selected="${repTab===k}">${esc(l)}</button>`).join("")}</div>
   <div id="repBody" class="panel">${body}</div>
   ${contactCard(cur)}
   <div class="nav"><button class="btn ghost" data-step="practice" type="button">Back to practices</button><button class="btn ghost" data-step="${selStepOf(cur)}" type="button">Change frameworks</button></div></div>`;
  wireReportBody(a,pf);
  $("#dlCsv")&&$("#dlCsv").addEventListener("click",()=>{const r=iso27(a);offer(fileBase(a)+" - ISO 27001 Statement of Applicability.csv",soaCsv(r),soaCsv(r))});
  $("#dlGaps").addEventListener("click",()=>{const c=gapCsv(a,pf);offer(fileBase(a)+" - gap register.csv",c,c)});
  $("#dlReport").addEventListener("click",()=>offer(fileBase(a)+" - compliance readiness report.html",reportFile(a,pf),null));
  $("#ctaBtn").addEventListener("click",ev=>{ev.preventDefault();const c=$("#contact");c.scrollIntoView({behavior:"smooth",block:"start"});const f=$("#c-name");if(f)setTimeout(()=>f.focus({preventScroll:true}),350)});
  if($("#previewBrief"))$("#previewBrief").addEventListener("click",()=>{curLead={id:"preview",preview:true,submitted:Date.now(),company:nameOf(a),profile:clone(cur.profile),answers:clone(cur.answers),fw:clone(cur.fw),path:cur.path,intake:clone(cur.intake),skipCheck:!!cur.skipCheck,contact:{name:"",role:"",email:"",phone:"",timing:"",pref:"",note:""},status:"new"};go("brief")});
  wireContact(cur);
}
function wireReportBody(a,pf){
  if(repTab==="iso27001"){
    const r=iso27(effA(a));
    const draw=()=>{const rows=r.rows.filter(x=>(soaTheme==="all"||x.theme===soaTheme)&&(soaFilter==="all"||(soaFilter==="gaps"&&x.app&&x.st!=="yes")||(soaFilter==="done"&&x.st==="yes")||(soaFilter==="excluded"&&!x.app)));
      $("#soaBody").innerHTML=soaRows(rows)||`<tr><td colspan="4" class="muted">No controls match this filter.</td></tr>`};
    draw();
    $("#soaF").addEventListener("click",ev=>{const b=ev.target.closest("button");if(!b)return;if(b.dataset.f)soaFilter=b.dataset.f;if(b.dataset.t)soaTheme=b.dataset.t;
      $("#soaF").querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x.dataset.f?x.dataset.f===soaFilter:x.dataset.t===soaTheme));draw()});
  }
}
function setRepTab(k){
  repTab=k;const a=effA(cur),pf=portfolio(a);
  document.querySelectorAll("#repTabs button").forEach(b=>b.setAttribute("aria-selected",b.dataset.rtab===k));
  $("#repBody").innerHTML=k==="overview"?overviewBody(a,pf,true):fwBody(a,pf.res.find(r=>r.f.id===k),true);
  wireReportBody(a,pf);
  $("#repTabs").scrollIntoView({block:"start",behavior:"smooth"});
}
const fileBase=a=>(a.profile.name||"Assessment").replace(/[\\/:*?"<>|]+/g," ").trim().slice(0,80);
const csvq=s=>`"${String(s).replace(/"/g,'""')}"`;
function soaCsv(r){return ["Control,Title,Theme,Applicable,Justification,Status",...r.rows.map(x=>[`A.${x.id}`,csvq(x.name),x.theme,x.app?"Yes":"No",csvq(x.app?(x.why||"Required to treat identified risks"):x.why),cap(x.st)].join(","))].join("\n")}
function gapCsv(a,pf){return ["Priority,Practice,Area,Current status,Effort,Frameworks",...pf.gaps.map(g=>[g.pr,csvq(g.q),csvq(g.area),cap(g.st),csvq(EFFORT[g.e]),csvq(g.fws.map(id=>FW_BY_ID[id].short).join("; "))].join(","))].join("\n")}
function exportShell(title,inner){
  const css=document.querySelector("style").textContent;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@75..100,500..800&family=Source+Sans+3:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>${css}body{margin:0}@media print{section.card,.tile{break-inside:avoid}.fwsec{break-before:page}}</style></head><body><main class="wrap"><div class="panel">${inner}</div></main></body></html>`;
}
function reportFile(a,pf){
  return exportShell(nameOf(a)+" – compliance readiness report",`
<div class="wshead"><span class="eyebrow">Compliance readiness report</span><h1>${esc(nameOf(a))}</h1><span class="meta">${esc(a.profile.industry)} · ${esc(a.profile.size)} staff · Generated ${fmtDate(Date.now())}</span></div>
${overviewBody(a,pf,false)}
${pf.res.map(r=>`<div class="fwsec panel">${fwBody(a,r,false)}</div>`).join("")}
<p class="meta">Indicative self-assessment. Readiness scores, costs and timelines are estimates and do not replace an audit or legal advice.</p>`);
}
async function offer(filename,data,clipFallback){
  const t=$("#toast");t.className="toast";t.textContent="";
  let dl=null;try{dl=window.claude&&window.claude.use?await window.claude.use("downloads"):null}catch(e){}
  if(dl){
    try{await dl.save({filename,data});t.textContent="Downloaded"}
    catch(e){if(e&&e.code==="declined")return;if(e&&e.code==="rate_limited"){t.textContent="A download is already waiting for you";return}
      t.className="toast err";t.textContent="Download isn't available here"}
    return;
  }
  if(ON_SITE&&saveFile(filename,data)){t.textContent="Downloaded";return}
  if(clipFallback){try{await navigator.clipboard.writeText(clipFallback);t.textContent="Downloads aren't available here, so the CSV was copied instead";return}catch(e){}}
  t.className="toast err";t.textContent="Downloads aren't available in this view";
}
function saveFile(filename,data){
  try{
    const csv=/\.csv$/i.test(filename);
    const blob=new Blob([csv?"\ufeff"+data:data],{type:csv?"text/csv;charset=utf-8":"text/html;charset=utf-8"});
    const url=URL.createObjectURL(blob);const link=document.createElement("a");
    link.href=url;link.download=filename;link.style.display="none";document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),5000);return true;
  }catch(e){return false}
}
/* Email: opens the visitor's own mail app with the message filled in */
function mailtoHref(to,subject,body){return `mailto:${encodeURIComponent(to||"").replace(/%40/g,"@")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.replace(/\n/g,"\r\n"))}`}
function siteLink(){try{if(!/^https?:/.test(location.protocol))return"";return location.origin+location.pathname.replace(/check\.html$/,"")}catch(e){return""}}
function summaryText(a,pf){
  const lines=[`${nameOf(a)}: compliance readiness summary`,`${a.profile.industry}, ${a.profile.size} staff`,"",
    `Overall readiness: ${a.skipCheck?"not checked":pf.readiness+"%"}. About ${pf.months} months to complete all chosen frameworks.`,"","Frameworks:"];
  pf.res.forEach(r=>lines.push(`- ${r.f.short} (${LEVELS[r.level]||r.level}): ${a.skipCheck?"":r.readiness+"% ready, "}about ${r.months} months${r.ext&&r.ext.hi>0?`, audit fees ${range(r.ext)}`:""}`));
  lines.push("","Top gaps to close:");
  pf.gaps.slice(0,4).forEach((g,i)=>lines.push(`${i+1}. ${short(g.q)} (${g.pr})`));
  lines.push("","Estimates are indicative. The full report can be downloaded from the check.");
  const link=siteLink();if(link)lines.push("",`Readiness check by Parang: ${link}`);
  return lines.join("\n");
}

/* ===================== Contact form (prospect) ===================== */
const TIMING=[["3m","Within 3 months"],["6m","Within 6 months"],["12m","Within 12 months"],["explore","Just exploring"]];
function timingDefault(a){const d=deadlineMonths((a.intake||{}).deadline);return d<=3?"3m":d<=6?"6m":d<=12?"12m":d===Infinity&&!(a.intake||{}).deadline?"6m":"explore"}
function contactCard(a){
  const firm=cfg.firm||"our consultants";
  const sent=leadSent[a.id];
  const contactLine=(cfg.email||cfg.phone)?`<p class="meta" style="margin:0">Or reach ${esc(firm)} directly: ${cfg.email?`<span class="sel">${esc(cfg.email)}</span>`:""}${cfg.email&&cfg.phone?" · ":""}${cfg.phone?`<span class="sel">${esc(cfg.phone)}</span>`:""}</p>`:"";
  if(sent)return `<section class="card" id="contact">${sentHtml(a,sent)}</section>`;
  return `<section class="card" id="contact"><div><span class="eyebrow">Free 30-minute review</span><h2>Talk to a consultant</h2></div>
   <p class="meta" style="margin:0;max-width:62ch">Share this assessment with ${esc(firm)}. A consultant will review your answers, confirm what each framework needs, and give you a firm quote. No obligation.</p>
   <form id="leadForm" novalidate class="form">
     <div class="grid2">
       <div class="field"><label for="c-name">Your name *</label><input type="text" id="c-name" autocomplete="name" required></div>
       <div class="field"><label for="c-role">Role</label><input type="text" id="c-role" placeholder="e.g. Operations Director" autocomplete="organization-title"></div>
       <div class="field"><label for="c-email">Work email *</label><input type="email" id="c-email" autocomplete="email" required></div>
       <div class="field"><label for="c-phone">Mobile</label><input type="tel" id="c-phone" autocomplete="tel" placeholder="+65"></div>
     </div>
     <div class="field"><span class="flabel" id="c-timing-l">When do you need to be compliant or certified?</span><div class="opts" role="radiogroup" aria-labelledby="c-timing-l">${TIMING.map(([v,l],i)=>`<label class="opt"><input type="radio" name="c-timing" id="c-timing-${i}" value="${v}" ${v===timingDefault(a)?"checked":""}>${l}</label>`).join("")}</div></div>
     <div class="field"><span class="flabel" id="c-pref-l">Best way to reach you</span><div class="opts" role="radiogroup" aria-labelledby="c-pref-l">${["Email","Phone call","WhatsApp"].map((l,i)=>`<label class="opt"><input type="radio" name="c-pref" id="c-pref-${i}" value="${l}" ${i===0?"checked":""}>${l}</label>`).join("")}</div></div>
     <div class="field"><label for="c-note">Anything we should know?</label><textarea id="c-note" rows="3" placeholder="e.g. A customer tender closes in March and asks for ISO 27001 and carbon data."></textarea></div>
     <label class="consent"><input type="checkbox" id="c-consent" required> I agree that ${esc(firm)} may contact me about this assessment and use my answers to prepare advice, in line with the PDPA.</label>
     <p class="ferr" id="c-err" role="alert"></p>
     <div class="nav"><button class="btn" type="submit" id="c-submit">Send to ${esc(firm)}</button></div>
   </form>${contactLine}</section>`;
}
function sentHtml(a,s){
  const firm=cfg.firm||"our consultants";
  const msg=`Hi ${cfg.firm||""}, I completed the compliance readiness check for ${nameOf(a)} and would like a consultation. My reference code: ${s.code}`;
  const wa=cfg.phone?`https://wa.me/${cfg.phone.replace(/[^0-9]/g,"")}?text=${encodeURIComponent(msg)}`:"";
  if(s.direct)return `<div><span class="eyebrow">Sent</span><h2>Thanks, ${esc(s.name)}. Your assessment is with ${esc(firm)}.</h2></div>
    <p style="margin:0">A consultant will contact you ${esc(cfg.response||"shortly")}. Your reference is <span class="mono sel">${esc(s.ref)}</span>.</p>`;
  return `<div><span class="eyebrow">One more step</span><h2>Send your reference code to ${esc(firm)}</h2></div>
    <p style="margin:0;max-width:64ch">${ON_SITE?`Tap <strong>Email ${esc(firm)}</strong> to open your email with the message below already filled in, then press send. It holds your answers and contact details.`:"This page can't send your answers directly from here. Copy the message below, which holds your answers and contact details, and send it by email or WhatsApp."}</p>
    <textarea class="code" id="codeBox" rows="5" readonly aria-label="Message with reference code">${esc(msg)}</textarea>
    <div class="exports">${ON_SITE?`<a class="btn" href="${esc(mailtoHref(cfg.email,`Readiness check: ${nameOf(a)}`,msg))}">Email ${esc(firm)}</a>`:""}<button class="btn${ON_SITE?" plain":""}" type="button" id="copyCode">Copy message</button>${wa?`<a class="btn ghost" href="${esc(wa)}" target="_blank" rel="noopener">Open WhatsApp</a>`:""}<span class="toast" id="codeToast" aria-live="polite"></span></div>
    ${(cfg.email||cfg.phone)?`<p class="meta" style="margin:0">Send to: ${cfg.email?`<span class="sel">${esc(cfg.email)}</span>`:""}${cfg.email&&cfg.phone?" · ":""}${cfg.phone?`<span class="sel">${esc(cfg.phone)}</span>`:""}</p>`:""}`;
}
function wireContact(a){
  const f=$("#leadForm");
  if(!f){wireCopy();return}
  f.addEventListener("submit",async ev=>{
    ev.preventDefault();
    const v=id=>($("#"+id).value||"").trim();
    const err=$("#c-err");err.textContent="";
    const contact={name:v("c-name"),role:v("c-role"),email:v("c-email"),phone:v("c-phone"),timing:(document.querySelector('input[name="c-timing"]:checked')||{}).value||"",pref:(document.querySelector('input[name="c-pref"]:checked')||{}).value||"",note:v("c-note")};
    if(!contact.name){err.textContent="Enter your name so the consultant knows who to ask for.";$("#c-name").focus();return}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)){err.textContent="Enter a valid work email, for example name@company.com.";$("#c-email").focus();return}
    if(!$("#c-consent").checked){err.textContent="Tick the consent box so we can contact you.";$("#c-consent").focus();return}
    const btn=$("#c-submit");btn.disabled=true;btn.textContent="Sending…";
    const lead={id:"L"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),aid:a.id,submitted:Date.now(),company:nameOf(a),profile:clone(a.profile),answers:clone(a.answers),fw:clone(a.fw||[]),path:a.path,intake:clone(a.intake||{}),skipCheck:!!a.skipCheck,contact,status:"new",consent:true};
    const code=encodeLead(lead);
    let direct=false;
    if(DB&&UID){
      const ref=DB.doc("leads/"+UID);
      try{await ref.update({subs:{[lead.id]:lead}});direct=true}
      catch(e1){try{await ref.set({subs:{[lead.id]:lead}});direct=true}catch(e2){direct=false}}
    }else if(location.protocol==="file:"){localLeads.push(lead);writeLocalLeads();direct=true}
    leadSent[a.id]={direct,code,name:contact.name,ref:lead.id.toUpperCase()};
    $("#contact").innerHTML=sentHtml(a,leadSent[a.id]);wireCopy();
    $("#contact").scrollIntoView({block:"start"});
  });
}
function wireCopy(){
  const b=$("#copyCode");if(!b)return;
  b.addEventListener("click",()=>{const box=$("#codeBox");const t=$("#codeToast");
    navigator.clipboard.writeText(box.value).then(()=>{t.className="toast";t.textContent="Copied"}).catch(()=>{box.focus();box.select();t.className="toast";t.textContent="Selected. Press Ctrl+C or ⌘C to copy."})});
}

/* ===================== Reference codes ===================== */
const b64e=s=>{const bytes=new TextEncoder().encode(s);let bin="";bytes.forEach(b=>bin+=String.fromCharCode(b));return btoa(bin).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")};
const b64d=s=>{s=s.replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";const bin=atob(s);return new TextDecoder().decode(Uint8Array.from(bin,c=>c.charCodeAt(0)))};
const V1_ORDER=["P1","P21","P2","P3","P4","P5","P6","P7","P8","P9","P10","P11","P12","P13","P14","P15","P16","P17","P18","P19","P20"];
function encodeLead(l){return "ISO27-"+b64e(JSON.stringify({v:3,id:l.id,t:l.submitted,p:l.profile,f:l.fw,h:l.path,i:l.intake,k:l.skipCheck?1:0,a:PRACTICES.map(x=>({yes:"y",partly:"p",no:"n"})[l.answers[x.id]]||"-").join(""),c:l.contact}))}
function decodeLead(code){
  const m=String(code).match(/ISO27-([A-Za-z0-9_-]+)/);if(!m)throw new Error("No reference code found. It starts with ISO27-.");
  let o;try{o=JSON.parse(b64d(m[1]))}catch(e){throw new Error("This code is incomplete or damaged. Ask the client to copy the whole message again.")}
  if(!o||![1,2,3].includes(o.v))throw new Error("This code isn't from this readiness check.");
  const answers={};let profile,fw;
  if(o.v===1){const k=["name","industry","size","work","hosting","dev","data","it","suppliers","certs","driver"];profile={};k.forEach((x,i)=>profile[x]=o.p[i]);V1_ORDER.forEach((id,i)=>{const c=(o.a||"")[i];if(c&&c!=="-")answers[id]={y:"yes",p:"partly",n:"no"}[c]});fw=["iso27001"]}
  else{profile=o.p||{};fw=Array.isArray(o.f)?o.f.filter(id=>FW_BY_ID[id]):[];PRACTICES.forEach((x,i)=>{const c=(o.a||"")[i];if(c&&c!=="-")answers[x.id]={y:"yes",p:"partly",n:"no"}[c]})}
  return normLead({id:o.id||("L"+Date.now().toString(36)),submitted:o.t||Date.now(),company:profile.name||"Untitled",profile,answers,fw,path:o.h,intake:o.i||{},skipCheck:!!o.k,contact:o.c||{},status:"new",source:"code"});
}
function normLead(l){const a=norm({profile:l.profile,answers:l.answers,fw:l.fw,path:l.path,intake:l.intake});l.profile=a.profile;l.answers=a.answers;l.fw=a.fw;l.path=a.path;l.intake=a.intake;l.contact=l.contact||{};return l}

/* ===================== Leads store (consultant) ===================== */
let localLeads=(()=>{try{return JSON.parse(localStorage.getItem("iso27k-leads")||"[]").map(normLead)}catch(e){return []}})();
function writeLocalLeads(){try{localStorage.setItem("iso27k-leads",JSON.stringify(localLeads))}catch(e){}}
function allLeads(){return (leadsMode==="db"?leadsRemote:localLeads).slice().sort((x,y)=>y.submitted-x.submitted)}
async function saveLeadPatch(l,patch){
  Object.assign(l,patch);
  if(leadsMode==="db"&&DB){await DB.doc("leads/"+l._doc).update({subs:{[l._key]:patch}})}
  else{const i=localLeads.findIndex(x=>x.id===l.id);if(i>=0)localLeads[i]={...localLeads[i],...patch};writeLocalLeads()}
}
async function addImportedLead(l){
  if(leadsMode==="db"&&DB){await DB.doc("leads/imp-"+l.id).set({subs:{[l.id]:l}})}
  else{if(!localLeads.some(x=>x.id===l.id))localLeads.push(l);writeLocalLeads()}
}
async function deleteLead(l){
  if(leadsMode==="db"&&DB){const ref=DB.doc("leads/"+l._doc);const d=await ref.get();const subs={...((d.data()||{}).subs||{})};delete subs[l._key];Object.keys(subs).length?await ref.set({subs}):await ref.delete()}
  else{localLeads=localLeads.filter(x=>x.id!==l.id);writeLocalLeads()}
}
function temperature(l,pf){
  const p=l.profile;let s=0;
  s+={tender:3,reg:3,investor:2,internal:1}[p.driver]||0;
  s+={"3m":3,"6m":2,"12m":1,explore:0}[l.contact&&l.contact.timing]??1;
  if((SIZE_IX[p.size]??1)>=2)s++;
  if(pf.res.some(r=>isMust(r.level)))s++;
  if(pf.res.length>=3)s++;
  if(pf.readiness<50)s++;
  return s>=8?"Hot":s>=5?"Warm":"Cool";
}
const STATUSES=[["new","New"],["contacted","Contacted"],["meeting","Meeting booked"],["proposal","Proposal sent"],["won","Won"],["lost","Lost"]];

/* ===================== Consultant desk ===================== */
function renderDesk(){
  if(!isConsultant){go("home");return}
  const L=allLeads();
  const counts={Hot:0,Warm:0,Cool:0};let pipe=0;
  const rows=L.map(l=>{const pf=portfolio(effA(l));const t=temperature(l,pf);counts[t]++;if(!["won","lost"].includes(l.status))pipe+=(pf.consult.lo+pf.consult.hi)/2;
    return `<div class="row lead" role="button" tabindex="0" data-lead="${esc(l.id)}">
      <span class="who"><strong>${esc(l.company)}</strong><span class="meta">${esc(l.contact.name||"No contact name")}${l.contact.role?", "+esc(l.contact.role):""} · ${fmtDate(l.submitted)}${l.source==="code"?" · from code":""}</span><span class="chips">${fwChips(l.fw||[])}</span></span>
      ${bar(pf.readiness)}
      <span class="meta hi">Fees ${range(pf.consult)}<br>${esc((STATUSES.find(s=>s[0]===l.status)||STATUSES[0])[1])}</span>
      <span class="rowact"><span class="pill T-${t}">${t}</span></span></div>`}).join("");
  $("#view").innerHTML=`
   <div class="pagehead"><div><span class="eyebrow">Consultants only</span><h1>Consultant desk</h1>
     <p>Leads from completed self-assessments. Open one for a call brief covering every framework they chose, with talking points, evidence to check, cost and timeline.</p></div></div>
   <div class="steps two" role="tablist" aria-label="Desk sections">
     <button role="tab" type="button" data-desk="leads" aria-selected="${deskTab==="leads"}">Leads <span class="n">${L.length}</span></button>
     <button role="tab" type="button" data-desk="settings" aria-selected="${deskTab==="settings"}">Firm settings</button></div>
   <div id="deskview"></div>`;
  if(deskTab==="settings"){renderSettings();return}
  $("#deskview").innerHTML=`
   ${!cfg.email&&!cfg.phone?`<div class="banner"><span><strong>Add your firm's contact details</strong> so prospects know who they're sending their assessment to.</span><button class="btn small" type="button" data-desk="settings">Open settings</button></div>`:""}
   <div class="tiles" style="margin-bottom:14px">
     <div class="tile"><span class="v">${L.length}</span><span class="k">Leads</span></div>
     <div class="tile"><span class="v">${counts.Hot}</span><span class="k">Hot · ${counts.Warm} warm · ${counts.Cool} cool</span></div>
     <div class="tile lead"><span class="v">${money(pipe,1000)}</span><span class="k">Open pipeline, consulting fees (midpoint)</span></div>
   </div>
   <div class="list">${rows||`<div class="empty">No leads yet. When a business finishes the check and taps <strong>Talk to a consultant</strong>, it appears here. Clients who can't send directly will send you a reference code: paste it below.</div>`}</div>
   <section class="card" style="margin-top:16px"><h2>Add a lead from a reference code</h2>
     <p class="meta" style="margin:0">Paste the whole message the client sent you. The code starts with ISO27-.</p>
     <textarea id="impCode" rows="3" placeholder="Hi, I completed the compliance readiness check… ISO27-eyJ2Ijoy…" aria-label="Reference code"></textarea>
     <div class="exports"><button class="btn" type="button" id="impBtn">Add lead</button><span class="toast" id="impToast" aria-live="polite"></span></div></section>`;
  $("#impBtn").addEventListener("click",async()=>{const t=$("#impToast");t.className="toast";
    try{const l=decodeLead($("#impCode").value);await addImportedLead(l);$("#impCode").value="";if(leadsMode!=="db")renderDesk();const t2=$("#impToast");t2.className="toast";t2.textContent=`Added ${l.company}`}
    catch(e){t.className="toast err";t.textContent=e.message||"Couldn't add this lead."}});
}
function renderSettings(){
  $("#deskview").innerHTML=`<form class="card form" id="cfgForm" novalidate style="max-width:680px">
    <h2>Firm settings</h2><p class="meta" style="margin:0">Prospects see your firm name and contact details on the report. Day rate drives every cost estimate.</p>
    <div class="grid2">
      <div class="field"><label for="s-firm">Firm name</label><input type="text" id="s-firm" value="${esc(cfg.firm)}" placeholder="e.g. Acme Risk Advisory"></div>
      <div class="field"><label for="s-email">Enquiry email</label><input type="email" id="s-email" value="${esc(cfg.email)}" placeholder="hello@yourfirm.sg"></div>
      <div class="field"><label for="s-phone">Phone or WhatsApp</label><input type="tel" id="s-phone" value="${esc(cfg.phone)}" placeholder="+65 6123 4567"></div>
      <div class="field"><label for="s-rate">Consultant day rate (S$)</label><input type="number" id="s-rate" min="300" max="5000" step="50" value="${esc(cfg.rate)}"></div>
    </div>
    <div class="field"><label for="s-resp">Response promise shown to prospects</label><input type="text" id="s-resp" value="${esc(cfg.response)}"></div>
    <label class="consent"><input type="checkbox" id="s-show" ${cfg.showCost?"checked":""}> Show indicative audit and tool costs to prospects (Parang's own fees are never shown)</label>
    <div class="exports"><button class="btn" type="submit">Save settings</button><span class="toast" id="cfgToast" aria-live="polite"></span></div></form>`;
  $("#cfgForm").addEventListener("submit",async ev=>{ev.preventDefault();const t=$("#cfgToast");
    const rate=Number($("#s-rate").value);
    if(!(rate>=300&&rate<=5000)){t.className="toast err";t.textContent="Enter a day rate between S$300 and S$5,000.";return}
    cfg={firm:$("#s-firm").value.trim(),email:$("#s-email").value.trim(),phone:$("#s-phone").value.trim(),rate,response:$("#s-resp").value.trim()||CFG_DEFAULT.response,showCost:$("#s-show").checked};
    try{localStorage.setItem("iso27k-cfg",JSON.stringify(cfg))}catch(e){}
    if(DB){try{await DB.doc("config/firm").set(cfg);t.className="toast";t.textContent="Saved. Prospects see the new details."}catch(e){t.className="toast err";t.textContent="Saved on this device only. Only the owner or editors can change firm settings."}}
    else{t.className="toast";t.textContent="Saved on this device"}});
}

/* ===================== Consultant brief ===================== */
const DRIVER_TXT={tender:"a customer or tender requirement",reg:"a regulator's expectation",investor:"an investor, group or listing requirement",internal:"internal risk management"};
function renderBrief(){
  if(!isConsultant||!curLead){go(isConsultant?"desk":"home");return}
  const l=curLead,pf=portfolio(effA(l));
  $("#view").innerHTML=`
   <div class="wshead"><div class="crumb"><button class="linkbtn" type="button" ${l.preview?'data-back-report':'data-nav="desk"'}>← ${l.preview?"Back to report":"All leads"}</button></div></div>
   ${l.preview?`<div class="banner"><span><strong>Preview.</strong> This is the brief a consultant gets when this business sends its assessment.</span></div>`:""}
   <div class="exports" style="margin-bottom:14px">
     <button class="btn" type="button" id="dlBrief">Download brief</button>
     ${l.preview?"":`<label class="flabel" for="leadStatus" style="margin-left:auto">Status</label><select id="leadStatus" style="width:auto">${STATUSES.map(([v,t])=>`<option value="${v}" ${l.status===v?"selected":""}>${t}</option>`).join("")}</select>
     <button class="btn small plain" type="button" id="delLead">Delete lead</button>`}
     <span class="toast" id="toast" aria-live="polite"></span></div>
   <div id="delConfirm"></div>
   <div class="panel">${briefBody(l,pf)}</div>`;
  $("#dlBrief").addEventListener("click",()=>offer(fileBase({profile:l.profile})+" - consultant brief.html",exportShell(l.company+" – consultant brief",briefBody(l,pf)+`<p class="meta">Internal document. Prepared from the client's self-assessment; figures are indicative until validated.</p>`),null));
  if($("#leadStatus"))$("#leadStatus").addEventListener("change",async ev=>{const t=$("#toast");try{await saveLeadPatch(l,{status:ev.target.value});t.className="toast";t.textContent="Status saved"}catch(x){t.className="toast err";t.textContent="Couldn't save the status. Try again."}});
  if($("#delLead"))$("#delLead").addEventListener("click",()=>{$("#delConfirm").innerHTML=`<div class="confirm" style="margin-bottom:14px"><span>Delete the lead for <strong>${esc(l.company)}</strong>? This can't be undone.</span><button class="btn small danger" type="button" id="delYes">Delete</button><button class="btn small plain" type="button" id="delNo">Cancel</button></div>`;
    $("#delNo").addEventListener("click",()=>{$("#delConfirm").innerHTML=""});
    $("#delYes").addEventListener("click",async()=>{try{await deleteLead(l);curLead=null;go("desk")}catch(x){$("#delConfirm").innerHTML=`<p class="ferr">Couldn't delete this lead. Try again.</p>`}})});
}
function briefBody(l,pf){
  l=effA(l);
  const p=l.profile,c=l.contact||{},t=temperature(l,pf);
  const ids=pf.ids;
  const yesList=ids.filter(id=>l.answers[id]==="yes");
  const top=pf.gaps.slice(0,4);
  const timing=(TIMING.find(x=>x[0]===c.timing)||[,"Not stated"])[1];
  const sens=(p.data||[]).filter(d=>SENSITIVE.includes(d));
  const dataNames={pii:"customer personal data",nric:"NRIC numbers",card:"payment card data",health:"health data",children:"children's data",fin:"financial records"};
  const req=pf.res.filter(r=>isMust(r.level));
  const funds=[...new Set(pf.res.map(r=>r.f.fund).filter(Boolean))];
  const discovery=[
    `You said this is driven by ${DRIVER_TXT[p.driver]||"the business"}. Who is asking, and by when?`,
    ...pf.res.slice(0,5).map(r=>r.f.ask),
    ...top.map(g=>g.ask),
    p.it==="msp"||p.it==="mix"?"What does your IT provider's contract say about security monitoring, patching and incident support?":null,
    (p.data||[]).includes("nric")?"Why do you collect NRIC numbers, and could another identifier do instead?":null,
    "Which part of the business must be covered? A narrower scope is faster and cheaper."
  ].filter(Boolean).filter((q,i,arr)=>arr.indexOf(q)===i);
  const objections=[
    ["It's too expensive.",`Phase it: legal must-haves first, then the certificates customers ask for. Shared work already saves about ${Math.round(pf.saved)} consultant days versus separate projects.${funds.includes("cyber")?" CSA's CISO-as-a-Service can co-fund up to 70% of cyber consultancy for eligible SMEs.":""}`],
    ["Our IT vendor already handles this.","Certifications cover the management system: policies, risk decisions, supplier oversight and audits. A vendor runs tools but can't own those for the client."],
    ["We don't have time.",`We do the drafting. Client time is mainly workshops and evidence, about ${pf.clientDays} person-days across the programme.`],
    p.driver==="tender"?["The tender closes soon.","Narrow the first scope to the service in the tender, start with the quickest recognised mark, and confirm what evidence the buyer accepts in the meantime."]:null,
    pf.res.some(r=>r.f.fam==="Sustainability")?["Sustainability isn't urgent for us.","Customers' own climate targets include their suppliers. Being able to answer carbon questionnaires keeps you on supplier lists."]:null
  ].filter(Boolean);
  const pkgOf=r=>r.readiness<35?"Full implementation":r.readiness<=70?"Gap closure and audit support":"Readiness review and audit support";
  const fwRows=pf.res.map(r=>`<tr><td><strong>${esc(r.f.short)}</strong><span class="why">${esc(pkgOf(r))}</span></td><td>${lvlPill(r.level)}</td><td class="num">${r.readiness}%</td><td class="num">${r.days}</td><td class="num">${range(r.fees)}</td><td class="num">${r.ext&&r.ext.hi>0?range(r.ext):"—"}</td><td class="num">~${r.months} mo</td></tr>`).join("");
  const gapRows=pf.gaps.map(g=>{const tool=pf.tools.find(x=>x.id===g.id);
    return `<tr><td><span class="pill ${g.pr}">${g.pr}</span></td><td><strong>${esc(short(g.q))}</strong><span class="why">Now: ${cap(g.st)}. Target: ${esc(g.g)}</span><span class="why">We deliver: ${esc(g.wk)}</span><span class="chips">${fwChips(g.fws)}</span></td><td class="num">${g.days}</td><td class="num">${money(g.days*pf.rate)}</td><td class="num">${tool?`${money(tool.lo)}–${money(tool.hi)}`:"—"}</td></tr>`}).join("");
  const w=waves(pf);
  const recurs=pf.res.filter(r=>r.recur);
  return `
   <div class="briefhead"><div><span class="eyebrow">Consultant brief · ${fmtDate(l.submitted)}</span><h1>${esc(l.company)}</h1>
     <span class="meta">${esc(p.industry)} · ${esc(p.size)} staff · ${esc({private:"private company",sub:"part of a larger group",listed:"SGX-listed"}[p.status]||"")} · ${esc({cloud:"cloud only",hybrid:"cloud and own servers",onprem:"own server room"}[p.hosting]||"")}</span></div>
     <span class="pill T-${t} big">${t} lead</span></div>
   <section class="card"><h2>Contact</h2>
     <dl class="kv">
       <dt>Name</dt><dd>${esc(c.name||"Not given")}${c.role?`, ${esc(c.role)}`:""}</dd>
       <dt>Email</dt><dd class="sel">${esc(c.email||"—")}</dd>
       <dt>Phone</dt><dd class="sel">${esc(c.phone||"—")}</dd>
       <dt>Prefers</dt><dd>${esc(c.pref||"—")}</dd>
       <dt>Needs it</dt><dd>${esc(timing)}</dd>
       <dt>Driver</dt><dd>${esc(DRIVER_TXT[p.driver]||"—")}</dd>
       ${c.note?`<dt>Their note</dt><dd>"${esc(c.note)}"</dd>`:""}
     </dl></section>
   ${briefSituation(l,pf)}
   <div class="tiles">
     <div class="tile"><span class="v">${pf.readiness}%</span><span class="k">Self-assessed readiness</span></div>
     <div class="tile"><span class="v">${pf.res.length}</span><span class="k">Frameworks (${req.length} required or requested)</span></div>
     <div class="tile"><span class="v">~${pf.months}<span style="font-size:1rem;font-weight:600"> mo</span></span><span class="k">Programme length</span></div>
     <div class="tile lead"><span class="v">${range(pf.consult)}</span><span class="k">Consulting fees (${pf.days} days)</span></div>
   </div>
   <section class="card"><h2>Frameworks in play</h2>
     <div class="tablewrap"><table><thead><tr><th>Framework and package</th><th>Status</th><th class="num">Ready</th><th class="num">Days alone</th><th class="num">Fees alone</th><th class="num">External fees</th><th class="num">Time</th></tr></thead><tbody>${fwRows}</tbody></table></div>
     <p class="meta" style="margin:0">As one programme: ${pf.days} days instead of ${pf.standalone}, saving about ${money(pf.saved*pf.rate,1000)} in fees. Quote the programme, not the sum.</p></section>
   <section class="card"><h2>Recommended engagement</h2>
     <ol class="steps-list"><li>Call: confirm drivers, deadlines and scope (30 min).</li><li>Evidence review: validate the ${yesList.length} practices marked "Yes" (half day, remote).</li><li>Proposal: phased programme of ${pf.days} consultant days over about ${pf.months} months.</li><li>Kick-off: ${req.length?`start with ${req.map(r=>r.f.short).join(", ")}`:"start with the shared foundation: policy, risk assessment and inventory"}.</li></ol>
     <div class="phases">${w.map(x=>`<div class="phase"><span class="when">Months ${x.from}–${x.to}</span><h3>${esc(x.name)}</h3><ul>${x.rs.map(r=>`<li>${esc(r.f.short)}: ${esc(r.f.pitch)}</li>`).join("")}</ul></div>`).join("")}</div>
     ${funds.length?`<p style="margin:0"><strong>Funding to mention:</strong> ${funds.map(k=>esc(FUNDING[k])).join(" ")}</p>`:""}</section>
   <section class="card"><h2>Talking points</h2>
     <div class="talk"><h3>Open with</h3><p style="margin:0">"You've said this is driven by ${DRIVER_TXT[p.driver]||"the business"}. Across the ${pf.res.length} frameworks you looked at, you're at ${pf.readiness}% overall, with ${pf.gaps.filter(g=>g.pr==="High").length} high-priority gaps.${req.length?` ${req.map(r=>r.f.short).join(" and ")} ${req.length===1?"is":"are"} a must, so let's start there.`:""} Can I check a few answers with you?"</p></div>
     <div class="talk"><h3>Discovery questions</h3><ol>${discovery.map(q=>`<li>${esc(q)}</li>`).join("")}</ol></div>
     ${sens.length?`<div class="talk"><h3>Risk angle</h3><p style="margin:0">They hold ${sens.map(d=>dataNames[d]).join(", ")}. Raise breach exposure under the PDPA (penalties up to 10% of Singapore turnover above S$10 million, or S$1 million) and the 3-day PDPC notification rule.</p></div>`:""}
     <div class="talk"><h3>Likely objections</h3><dl class="obj">${objections.map(([o,a])=>`<dt>"${esc(o)}"</dt><dd>${esc(a)}</dd>`).join("")}</dl></div></section>
   <section class="card"><h2>Validate before you quote</h2>
     <p class="meta" style="margin:0">Self-assessments usually overrate. Ask for this evidence for each "Yes". Anything missing moves into scope and adds fees.</p>
     ${yesList.length?`<div class="tablewrap"><table><thead><tr><th>Marked Yes</th><th>Evidence to request</th></tr></thead><tbody>${yesList.map(id=>`<tr><td>${esc(short(P_BY_ID[id].q))}</td><td>${esc(P_BY_ID[id].ev)}</td></tr>`).join("")}</tbody></table></div>`:`<p style="margin:0">Nothing marked Yes. Expect a full implementation.</p>`}</section>
   <section class="card"><h2>Gaps to resolve, with effort and cost</h2>
     <div class="tablewrap"><table><thead><tr><th>Priority</th><th>Gap, target and frameworks</th><th class="num">Our days</th><th class="num">Fee at ${money(pf.rate,50)}/day</th><th class="num">Client tools, yearly</th></tr></thead>
     <tbody>${gapRows||`<tr><td colspan="5" class="muted">No gaps reported.</td></tr>`}
     <tr class="sub"><td></td><td>Framework set-up: scoping, documentation, internal audits and audit support for ${pf.res.length} framework${pf.res.length===1?"":"s"}</td><td class="num">${pf.baseDays}</td><td class="num">${money(pf.baseDays*pf.rate)}</td><td class="num">—</td></tr></tbody></table></div></section>
   <section class="card"><h2>Cost to completion</h2>
     <div class="tablewrap"><table class="cost"><thead><tr><th>Item</th><th>Paid to</th><th class="num">Low</th><th class="num">High</th></tr></thead><tbody>
       <tr><td>Consulting fees, ${pf.days} days at ${money(pf.rate,50)} (−10% to +15%)</td><td>${payPill("parang")}</td><td class="num">${money(pf.consult.lo)}</td><td class="num">${money(pf.consult.hi)}</td></tr>
       ${pf.res.filter(r=>r.ext&&r.ext.hi>0).map(r=>`<tr><td>${esc(r.f.short)}: ${esc(r.ext.label)}</td><td>${payPill("third",r.ext.who)}</td><td class="num">${money(r.ext.lo)}</td><td class="num">${money(r.ext.hi)}</td></tr>`).join("")}
       ${pf.tools.map(x=>`<tr><td>${esc(x.label)} (first year, only where a gap needs it)</td><td>${payPill("third",TOOL_WHO)}</td><td class="num">${money(x.lo)}</td><td class="num">${money(x.hi)}</td></tr>`).join("")}
       <tr class="total"><td>First-year total</td><td></td><td class="num">${money(pf.year1.lo,1000)}</td><td class="num">${money(pf.year1.hi,1000)}</td></tr>
       ${recurs.map(r=>`<tr class="sub"><td>${esc(r.f.short)}: ${esc(r.recur.label)}</td><td>${payPill("third",r.recur.who)}</td><td class="num">${money(r.recur.lo)}/yr</td><td class="num">${money(r.recur.hi)}/yr</td></tr>`).join("")}
       <tr><td>Client staff time</td><td>Internal</td><td class="num" colspan="2">about ${pf.clientDays} person-days</td></tr>
     </tbody></table></div>
     <p style="margin:0"><strong>Say this on the call:</strong> only the consulting line is Parang's fee. Audit, certification and tool costs go straight to independent providers the client contracts with. Certification bodies can't consult for the companies they certify, so they are always separate from us.</p>
     <p class="meta" style="margin:0">Indicative. Audit, assessment and tool prices vary by provider; confirm scope and quotes before proposing.</p></section>
   <section class="card"><h2>Other obligations to raise</h2><div class="oblig">${obligations(l).map(([ti,d])=>`<div><strong>${ti}</strong><span class="muted" style="font-size:.93rem">${d}</span></div>`).join("")||'<div><span class="muted">None flagged.</span></div>'}</div></section>`;
}

function briefSituation(l,pf){
  const it=l.intake||{},P=PATHS[l.path]||PATHS.full,rows=[];
  rows.push(["Came in through",`${P.name} route: "${P.title}"`]);
  if((it.goals||[]).length)rows.push(["Their goals",it.goals.map(g=>(GOALS.find(x=>x[0]===g)||[,g])[1]).join("; ")]);
  if(it.asker)rows.push(["Requested by",(ASKERS.find(x=>x[0]===it.asker)||[,it.asker])[1]]);
  if((it.asked||[]).length)rows.push(["They asked for",it.asked.map(id=>FW_BY_ID[id]?FW_BY_ID[id].short:id).join(", ")]);
  if(it.other)rows.push(["In the requester's words",`"${it.other}"`]);
  if(it.deadline)rows.push(["Deadline",(DEADLINES.find(x=>x[0]===it.deadline)||[,"—"])[1]]);
  if(it.conseq)rows.push(["If they miss it",(CONSEQ.find(x=>x[0]===it.conseq)||[,"—"])[1]]);
  if(it.budget)rows.push(["Budget",(BUDGETS.find(x=>x[0]===it.budget)||[,"—"])[1]]);
  if(it.lead)rows.push(["Internal lead",(LEADS.find(x=>x[0]===it.lead)||[,"—"])[1]]);
  const flags=situationFlags(l,pf);
  return `<section class="card"><h2>Their situation and expectations</h2>
   <dl class="kv">${rows.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
   ${flags.length?`<h3>Expectations to manage on the call</h3><dl class="obj">${flags.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`:`<p class="meta" style="margin:0">No budget, deadline or ownership concerns flagged.</p>`}
   <p class="meta" style="margin:0">Set expectations early: what's included, what they pay auditors directly, internal time of about ${commitment(pf)} hours a week, and that certificates need months of records.</p></section>`;
}

/* ===================== Library ===================== */
function renderLibrary(){
  $("#view").innerHTML=`
   <div class="pagehead"><div><span class="eyebrow">Reference</span><h1>Framework library</h1>
     <p>${FRAMEWORKS.length} frameworks the check covers, who needs each one, and how much of the work they share. Plus all 93 ISO 27001 Annex A controls.</p></div></div>
   <div class="steps two" role="tablist" aria-label="Library sections">
     <button role="tab" type="button" data-lib="frameworks" aria-selected="${libTab==="frameworks"}">Frameworks <span class="n">${FRAMEWORKS.length}</span></button>
     <button role="tab" type="button" data-lib="controls" aria-selected="${libTab==="controls"}">ISO 27001 controls <span class="n">93</span></button></div>
   <div id="libview"></div>`;
  libTab==="frameworks"?renderFwLib():renderCtlLib();
}
function renderFwLib(){
  const shareCount=f=>{const mine=fwPractices(f,{...PROFILE_DEFAULT,work:"hybrid",dev:"both",services:["saas","msp"],availability:"sla",ai:"build",customers:["consumers","gov","fi","hc"],markets:["eu"],payments:"direct",regulated:["mas","moh"]});const others=new Set();FRAMEWORKS.filter(g=>g!==f).forEach(g=>g.domains.forEach(d=>d.ps.forEach(id=>others.add(id))));return{n:mine.length,shared:mine.filter(id=>others.has(id)).length}};
  $("#libview").innerHTML=`<div class="filters" id="famF" style="margin-bottom:12px">${[["all","All"],...FAMILIES.map(f=>[f,f])].map(([v,l])=>`<button class="chip" data-fam="${esc(v)}" aria-pressed="${libFam===v}" type="button">${esc(l)}</button>`).join("")}</div>
   <div class="libgrid">${FRAMEWORKS.filter(f=>libFam==="all"||f.fam===libFam).map(f=>{const s=shareCount(f);return `<section class="card libcard"><div class="libtop">${famTile(f.fam)}<div><span class="eyebrow">${esc(f.fam)} · ${esc(f.kind)}</span><h2>${esc(f.short)}</h2><span class="meta">${esc(f.name)}</span></div></div>
     <p style="margin:0">${esc(f.what)}</p>
     <dl class="kv small"><dt>Who needs it</dt><dd>${esc(f.who)}</dd><dt>Issued by</dt><dd>${esc(f.issuer)}</dd><dt>Typical time</dt><dd>${f.months[0]}–${f.months[0]+f.months[1]} months</dd><dt>Shared work</dt><dd>${s.shared} of ${s.n} practices also count for other frameworks</dd></dl>
     <div class="ctrls">${f.domains.map(d=>`<span class="cid">${esc(d.n)}</span>`).join("")}</div></section>`}).join("")}</div>`;
  $("#famF").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;libFam=b.dataset.fam;renderFwLib()});
}
function renderCtlLib(){
  $("#libview").innerHTML=`<div class="libtools"><input type="search" id="libQ" placeholder="Search controls, e.g. backup, supplier, 8.24" value="${esc(libQ)}" aria-label="Search controls"></div>
   <div class="tablewrap"><table><thead><tr><th>Control</th><th>Title</th><th>Covered by practice</th><th>Can be excluded when</th></tr></thead><tbody id="libBody"></tbody></table></div>
   <p class="meta" id="libCount"></p>`;
  const draw=()=>{
    const q=libQ.toLowerCase();
    const rows=CONTROLS.filter(([id,name])=>!q||id.includes(q)||("a."+id).includes(q)||name.toLowerCase().includes(q));
    $("#libBody").innerHTML=rows.map(([id,name])=>{const pr=P_BY_ID[PRACTICE_OF[id]];
      return `<tr><td class="id">A.${id}</td><td>${esc(name)}<span class="why">${THEMES[id.split(".")[0]]}</span></td><td>${pr?esc(short(pr.q)):"—"}</td><td>${EXCLUDABLE[id]?esc(EXCLUDABLE[id]):'<span class="muted">Normally required</span>'}</td></tr>`}).join("")||`<tr><td colspan="4" class="muted">No controls match "${esc(libQ)}".</td></tr>`;
    $("#libCount").textContent=`Showing ${rows.length} of 93 controls.`;
  };
  draw();
  $("#libQ").addEventListener("input",e=>{libQ=e.target.value;draw()});
}

/* ===================== Global events ===================== */
document.addEventListener("click",e=>{
  const t=e.target.closest("[data-nav],[data-step],[data-copy],[data-del],[data-del-yes],[data-del-no],[data-open],[data-desk],[data-lead],[data-back-report],[data-rtab],[data-lib],[data-path],[data-switch],[data-change-path],[data-back-assess]");if(!t)return;
  if(t.dataset.path){startPath(t.dataset.path);return}
  if(t.dataset.switch){if(step==="profile")readProfile();cur.path=t.dataset.switch;touch();step=PATHS[cur.path].steps[0][0];go("assess");return}
  if("changePath" in t.dataset){if(step==="profile")readProfile();if(["goals","request"].includes(step))readIntake();pathPick="switch";go("start");return}
  if("backAssess" in t.dataset){go("assess");return}
  if(t.dataset.nav){if(t.dataset.nav==="home"){pendingDelete=null}go(t.dataset.nav);return}
  if(t.dataset.step){setStep(t.dataset.step);return}
  if(t.dataset.rtab){setRepTab(t.dataset.rtab);return}
  if(t.dataset.lib){libTab=t.dataset.lib;renderLibrary();return}
  if(t.dataset.copy){e.stopPropagation();copyExample();return}
  if(t.dataset.del){pendingDelete=t.dataset.del;renderHome();return}
  if(t.dataset.delYes){const id=t.dataset.delYes;pendingDelete=null;if(cur&&cur.id===id)cur=null;removeItem(id);renderHome();return}
  if("delNo" in t.dataset){pendingDelete=null;renderHome();return}
  if(t.dataset.desk){deskTab=t.dataset.desk;renderDesk();return}
  if(t.dataset.lead){curLead=allLeads().find(x=>x.id===t.dataset.lead)||null;if(curLead)go("brief");return}
  if("backReport" in t.dataset){go("assess",{step:"report"});return}
  if(t.dataset.open&&!e.target.closest("[data-stop]"))openItem(t.dataset.open);
});
document.addEventListener("keydown",e=>{
  if(!(e.key==="Enter"||e.key===" ")||!e.target.matches)return;
  if(e.target.matches(".row[data-open]")){e.preventDefault();openItem(e.target.dataset.open)}
  else if(e.target.matches(".row[data-lead],tr[data-rtab]")){e.preventDefault();e.target.click()}
});
/* Start straight into a route when linked as check.html#guided, #request or #direct */
(function(){let h="";try{h=(location.hash||"").slice(1)}catch(e){}
  if(PATHS[h]&&h!=="full"){pathPick="new";startPath(h);try{history.replaceState(null,"",location.pathname)}catch(e){}}
  else go("home");
})();

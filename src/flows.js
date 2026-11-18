/* ===================== Entry paths ===================== */
const PATHS={
 guided:{name:"Guided",title:"I'm not sure where to start",time:"About 15 minutes",
   desc:"Tell us what you want to achieve. We'll recommend where to start, explain what each step involves, and show realistic cost, time and effort before you commit.",
   gets:["A short plan: start here, next, later","What each step involves for your team","Budget and deadline fit"],
   steps:[["goals","Goals"],["profile","Business"],["plan","Your plan"],["practice","Quick check"],["report","Report"]]},
 request:{name:"Deadline",title:"A customer, tender or regulator is asking for something",time:"About 10 minutes",
   desc:"Tell us what was asked for and by when. We'll check whether the deadline is realistic and show the fastest credible route, including interim options.",
   gets:["Deadline check for each requirement","Interim options if time is short","Anything else you're required to do"],
   steps:[["request","The request"],["profile","Business"],["feasibility","Deadline check"],["practice","Practices"],["report","Report"]]},
 direct:{name:"Direct",title:"I know which framework I need",time:"About 5 minutes",
   desc:"Pick the frameworks, answer a few scoping questions, then rate your practices or skip straight to a quote request.",
   gets:["Scoped cost and timeline","Gap list for your chosen frameworks","Option to skip the self-check"],
   steps:[["choose","Choose"],["profile","Scoping"],["practice","Self-check"],["report","Report"]]},
 full:{name:"Full check",title:"Check everything",time:"About 25 minutes",
   desc:"Screen all 21 frameworks against a full business profile and rate every relevant practice.",
   gets:["Every framework marked required, recommended or optional","Complete gap list"],
   steps:[["profile","Business"],["frameworks","Frameworks"],["practice","Practices"],["report","Report"]]}
};
const GOALS=[["customers","Win or keep bigger customers and tenders"],["cyber","Protect the business from cyber attacks"],["law","Make sure we comply with the law"],["privacy","Handle customer data properly"],["continuity","Keep running through outages and disruption"],["ai","Use AI safely and responsibly"],["esg","Meet customers' and banks' sustainability demands"],["investor","Get ready for investors, a sale or a listing"]];
const GOAL_FW={customers:["iso27001","ct","ce","soc2","ecovadis","iso14001"],cyber:["ce","ct","nist","iso27001"],law:["pdpa","gdpr","pci","mas","health","im8","issb"],privacy:["pdpa","gdpr","iso27701"],continuity:["iso22301","iso20000","mas"],ai:["iso42001"],esg:["ghg","ecovadis","iso14001","iso50001","issb"],investor:["iso27001","soc2","nist","ghg","issb"]};
const BUDGETS=[["u20","Under S$20,000",20000],["20-50","S$20,000–50,000",50000],["50-150","S$50,000–150,000",150000],["150+","Over S$150,000",Infinity],["unsure","Not sure yet",Infinity]];
const DEADLINES=[["1","Within 1 month",1],["3","Within 3 months",3],["6","Within 6 months",6],["12","Within 12 months",12],["18","More than a year away",18],["none","No fixed deadline",Infinity]];
const LEADS=[["dedicated","Someone who can give 1–2 days a week"],["parttime","A manager with a few hours a week"],["none","No one yet"]];
const ASKERS=[["customer","A customer"],["tender","A tender or RFP"],["regulator","A regulator"],["parent","Investors or our parent group"],["insurer","Our cyber insurer"],["bank","Our bank or lender"]];
const CONSEQ=[["lose","We lose the deal or contract"],["penalty","Penalty or regulatory action"],["score","It scores points but isn't mandatory"],["unsure","Not sure"]];
const PLAIN={
 iso27001:"A certificate showing you manage information security properly. Recognised worldwide.",
 ce:"Singapore's entry-level cyber badge for SMEs. Quick and low cost.",
 ct:"Singapore's risk-based cyber mark, a step up from Cyber Essentials.",
 soc2:"An auditor's report on your security controls, expected by US and multinational buyers of software and IT services.",
 pci:"Card security rules you must follow if you take card payments.",
 nist:"A maturity score and roadmap. No certificate, but a clear picture of where you stand.",
 pdpa:"Singapore's data protection law, plus an optional trustmark to show you follow it.",
 gdpr:"Europe's data protection law. Applies if you serve people in the EU.",
 iso27701:"A privacy certificate that can sit alongside ISO 27001.",
 iso22301:"A certificate showing you can keep running through disruption.",
 mas:"MAS rules on technology risk and continuity for financial firms and their vendors.",
 iso20000:"A certificate for running IT services to agreed service levels.",
 iso42001:"A certificate for governing AI responsibly.",
 cloud:"Cloud security certifications for SaaS and cloud providers.",
 health:"Cyber and data rules for healthcare providers and their vendors.",
 im8:"Security rules agencies pass to their vendors.",
 ghg:"Measuring your carbon footprint so you can answer customers and set targets.",
 iso14001:"A certificate for managing your environmental impact.",
 iso50001:"A certificate for managing energy use and cost.",
 issb:"Mandatory climate disclosures for listed and large companies.",
 ecovadis:"A sustainability score that MNC customers use to rate suppliers."
};
const INTERIM={
 iso27001:["Get CSA Cyber Essentials or Cyber Trust first as an interim mark","Give the buyer a signed engagement letter and project plan","Narrow the scope to the service in the tender"],
 ce:["Fix the five basics first: assets, protection, updates, backup, response"],
 ct:["Start with Cyber Essentials, then step up to Cyber Trust"],
 soc2:["Do a Type I report first (controls at a point in time), then Type II after a 3-month observation period","Share an ISO 27001 certificate or a bridge letter if you have one"],
 pci:["Move to a hosted payment page or tokenisation to cut scope to a short self-assessment"],
 pdpa:["Fix the most visible items first: DPO, privacy notice, consent and breach plan"],
 gdpr:["Publish a GDPR-ready privacy notice and records of processing first"],
 iso22301:["Share a tested continuity plan and recovery targets while certification proceeds"],
 mas:["Agree a remediation plan and timeline with MAS or your bank customer"],
 iso20000:["Share SLA reports and your incident and change processes as evidence"],
 iso42001:["Publish an AI policy and inventory, and test key models with AI Verify"],
 cloud:["Share ISO 27001 and a cloud responsibility matrix while extensions proceed"],
 health:["Close patient data access and backup gaps first"],
 im8:["Agree a remediation plan with the agency and fix data classification and testing first"],
 ghg:["Report Scope 1 and 2 first from utility and fuel bills; estimate Scope 3 later"],
 iso14001:["Share your environmental policy and objectives; certification follows after 3 months of records"],
 iso50001:["Share an energy baseline and action plan first"],
 issb:["Disclose Scope 1 and 2 and governance first, using the phased timelines"],
 ecovadis:["Publish core policies before submitting; scores improve at the next rating"]
};
const JOURNEY={
 "Certification":[["Gap review and scoping","2–4 weeks"],["Build policies, risk assessment and controls","2–6 months"],["Run the system and keep records","at least 3 months"],["Internal audit and management review","2–4 weeks"],["Stage 1 (documents) and Stage 2 (evidence) audits","1–2 months"],["Certificate valid for 3 years, with yearly surveillance audits",""]],
 "Mark":[["Self-assessment against the mark's requirements","1–2 weeks"],["Fix gaps","1–3 months"],["Assessment by a CSA-appointed certification body","2–4 weeks"],["Mark awarded; renew before it expires",""]],
 "Attestation":[["Readiness assessment","2–4 weeks"],["Fix gaps and set up evidence collection","1–3 months"],["Optional Type I report: controls at a point in time","1–2 months"],["Observation period: controls must run and be evidenced","3–12 months"],["CPA firm tests controls and issues the Type II report","1–2 months"],["Repeat every year",""]],
 "Contractual standard":[["Confirm scope with your acquirer or payment provider","1–2 weeks"],["Reduce scope: tokenisation or hosted pages","1–3 months"],["Fix gaps and start quarterly scans","2–4 months"],["Self-assessment questionnaire, or a QSA assessment for larger volumes","1–2 months"],["Repeat every year",""]],
 "Maturity benchmark":[["Workshops and evidence review","2–3 weeks"],["Maturity scores and target profile","1–2 weeks"],["Prioritised roadmap","1 week"],["Re-score yearly",""]],
 "Reporting standard":[["Set boundaries and collect activity data: bills, fuel, travel","3–6 weeks"],["Calculate Scope 1 and 2, then screen Scope 3","2–6 weeks"],["Set targets and an action plan","2–4 weeks"],["Optional third-party verification","1–2 months"],["Repeat every year",""]],
 "Rating":[["Gather policies and evidence","3–6 weeks"],["Submit questionnaire and documents","1–2 weeks"],["Provider reviews and issues a scorecard","several weeks"],["Improve and get re-rated yearly",""]],
 "Regulation":[["Gap assessment against the rules","2–4 weeks"],["Fix gaps: policies, processes and controls","1–6 months"],["Train staff and assign owners","ongoing"],["No certificate: compliance is continuous, and regulators or customers may inspect",""]],
 "Disclosure regulation":[["Gap assessment against the disclosure rules","3–6 weeks"],["Build data collection and governance","2–6 months"],["Climate risk and scenario analysis","1–3 months"],["Publish with the annual report; assurance follows later",""]]
};
const journeyFor=f=>JOURNEY[f.kind]||JOURNEY[f.kind.startsWith("Regulation")||f.kind==="Contractual"?"Regulation":"Certification"];
const PROFILE_NEEDS={iso27001:["services","suppliers","it"],ce:["it","suppliers","ai"],ct:["it","suppliers","ai"],soc2:["markets","services","availability"],pci:["payments"],nist:["it"],pdpa:["customers"],gdpr:["markets"],iso27701:["markets","services"],iso22301:["availability"],mas:["regulated","customers"],iso20000:["services","availability"],iso42001:["ai"],cloud:["services"],health:["regulated"],im8:["customers"],ghg:["footprint","esgAsk"],iso14001:["footprint","esgAsk"],iso50001:["footprint"],issb:["footprint","esgAsk"],ecovadis:["footprint","esgAsk"]};
const CORE_Q=["name","industry","size","status","customers","driver","work","hosting","dev","data"];
const NOT_INCLUDED=["Audit, certification and rating fees: you pay the independent auditor, certification body or rating provider directly, not Parang","Software and tools, such as device management or carbon accounting","Hands-on IT changes: we specify them; your IT team or vendor implements","Legal opinions on contracts or regulations"];
const YOU_GET=["Policies, procedures and registers written for your business","Risk and impact assessments run with your team","Evidence pack organised for the auditor or assessor","Staff awareness session","Internal audit or readiness review before the external one","Support during audits, and help closing any findings"];
const SURPRISES=["Self-assessments are usually optimistic. We validate a sample of your \"Yes\" answers before quoting.","Certificates need months of records. The audit date can't be pulled forward by working harder.","There are yearly costs after year one: surveillance audits, renewals and tools.","Scope drives cost. Covering one service or site first is often faster and cheaper.","A certificate shows you manage risk. It doesn't guarantee you won't have an incident."];

function deadlineMonths(k){const d=DEADLINES.find(x=>x[0]===k);return d?d[2]:Infinity}
function budgetMax(k){const b=BUDGETS.find(x=>x[0]===k);return b?b[2]:Infinity}
/* Preview scoring: unanswered practices are assumed "Partly" */
function effA(a,assume){if(!assume&&!a.skipCheck)return a;const ans={...a.answers};PRACTICES.forEach(x=>{if(!ans[x.id])ans[x.id]="partly"});return{...a,answers:ans}}
function feas(f,months,dl){
  if(dl===Infinity)return{st:"none",txt:"No fixed deadline"};
  const need=months;
  if(need<=dl)return{st:"ok",txt:`Fits: about ${need} months needed, ${dl} available`};
  if(need<=dl*1.5)return{st:"tight",txt:`Tight: about ${need} months needed, ${dl} available`};
  return{st:"no",txt:`Won't fit: about ${need} months needed, ${dl} available`};
}
const FEAS_LABEL={ok:"Fits",tight:"Tight",no:"Won't fit",none:"No deadline"};
function goalMatches(a,f){return (a.intake.goals||[]).filter(g=>(GOAL_FW[g]||[]).includes(f.id)).length}
const FOUNDATION=["pdpa","ce","ghg","nist"];
function planTiers(a){
  const p=a.profile,pre=effA(a,true),B=budgetMax(a.intake.budget),goals=a.intake.goals||[];
  const cands=FRAMEWORKS.map(f=>{const s=f.screen(p)||{};const gm=goalMatches(a,f);let lvl=s.lvl||null;if(!lvl&&gm)lvl="optional";
    if(!lvl)return null;
    const r=fwResult(f,{...pre,fw:[f.id]});const cost=(r.fees.lo+r.fees.hi)/2+(r.ext?(r.ext.lo+r.ext.hi)/2:0);
    const score={required:100,recommended:30,optional:10}[lvl]+gm*15+(f.months[0]<=2?10:0)+(FOUNDATION.includes(f.id)?8:0)-cost/5000;
    return{f,lvl,why:s.why||[],gm,r,cost,score}}).filter(Boolean).sort((x,y)=>y.score-x.score);
  const start=[],used=new Set();let spend=0;
  const take=c=>{start.push(c);used.add(c.f.id);spend+=c.cost};
  const blocked=c=>["iso27701","cloud"].includes(c.f.id)&&!used.has("iso27001");
  cands.filter(c=>c.lvl==="required").forEach(take);
  goals.forEach(g=>{
    if(start.length>=3)return;
    if(start.some(c=>(GOAL_FW[g]||[]).includes(c.f.id)))return;
    const c=cands.find(c=>!used.has(c.f.id)&&(GOAL_FW[g]||[]).includes(c.f.id)&&!blocked(c)&&spend+c.cost<=B);
    if(c)take(c);
  });
  cands.forEach(c=>{if(start.length<3&&!used.has(c.f.id)&&c.lvl!=="optional"&&!blocked(c)&&spend+c.cost<=B)take(c)});
  if(!start.length&&cands.length)take(cands[0]);
  const rest=cands.filter(c=>!used.has(c.f.id));
  const next=rest.filter(c=>c.lvl==="recommended"||c.gm>0).slice(0,5);
  const later=rest.filter(c=>!next.includes(c));
  return{start,next,later,spend,B};
}
function commitment(pf){const hrs=Math.round(pf.clientDays*8/Math.max(1,pf.months*4.3));return hrs}
function expectBlock(f,r){
  const j=journeyFor(f);
  return `<div class="journey"><h3>What you're getting into</h3><ol class="jlist">${j.map(([s,d])=>`<li><span>${esc(s)}</span>${d?`<span class="meta">${esc(d)}</span>`:""}</li>`).join("")}</ol>
   <dl class="kv small">
     <dt>Paid to Parang</dt><dd>Consulting: ${range(r.fees)}</dd>
     <dt>Paid directly to others</dt><dd>${r.ext&&r.ext.hi>0?`${esc(r.ext.who)}: ${esc(r.ext.label)}, ${range(r.ext)}. ${esc(r.ext.how||"")}`:r.ext?`${esc(r.ext.who||"")}: ${esc(r.ext.label)}`:"No external audit or certificate fee"}</dd>
     ${r.recur?`<dt>Every year after</dt><dd>${esc(r.recur.label)}: ${money(r.recur.lo,500)}–${money(r.recur.hi,500).replace("S$","")}</dd>`:""}
     <dt>If time is short</dt><dd>${(INTERIM[f.id]||["Ask about a narrower first scope"]).map(esc).join(". ")}.</dd>
   </dl></div>`;
}
function engagementBlock(pf,a){
  const hrs=commitment(pf);const lead=a.intake&&a.intake.lead;
  return `<section class="card"><h2>How working with us runs</h2>
   <ol class="flowsteps">
     <li><strong>Free 30-minute review</strong><span class="meta">We go through your answers and confirm what you actually need.</span></li>
     <li><strong>Evidence check</strong><span class="meta">Half a day, remote. We look at a sample of what you marked "Yes".</span></li>
     <li><strong>Fixed-fee proposal</strong><span class="meta">Scope, phases, fees and what we need from you, in writing.</span></li>
     <li><strong>Delivery</strong><span class="meta">Monthly check-ins and a shared tracker so you always know where things stand.</span></li>
     <li><strong>Audit and after</strong><span class="meta">We support you through audits and help close any findings.</span></li>
   </ol>
   <div class="grid2 tight">
     <div><h3>What we need from you</h3><ul class="plain">
       <li>A management sponsor who can make decisions on risk and budget</li>
       <li>An internal lead with about <strong>${hrs} hours a week</strong> for ${pf.months} months${lead==="none"?' <span class="pill Medium">Not yet assigned</span>':""}</li>
       <li>Access to the people, systems and documents involved</li>
       <li>Decisions and evidence within agreed turnaround times</li></ul></div>
     <div><h3>What you get</h3><ul class="plain">${YOU_GET.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>
     <div><h3>Not included</h3><ul class="plain">${NOT_INCLUDED.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>
     <div><h3>Common surprises</h3><ul class="plain">${SURPRISES.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>
   </div></section>`;
}
function situationFlags(a,pf){
  const it=a.intake||{},flags=[];
  const B=budgetMax(it.budget);
  if(B!==Infinity&&pf.year1.lo>B)flags.push(["Budget",`Their budget (${(BUDGETS.find(b=>b[0]===it.budget)||[])[1]}) is below the low estimate of ${money(pf.year1.lo,1000)}. Propose phasing, a narrower scope, or grant support.`]);
  const dl=deadlineMonths(it.deadline);
  if(dl!==Infinity){const late=pf.res.filter(r=>r.months>dl);if(late.length)flags.push(["Deadline",`${late.map(r=>r.f.short).join(", ")} won't be complete within ${dl} months. Offer interim options and agree what the buyer will accept.`])}
  if(it.lead==="none")flags.push(["Internal lead","No one is assigned internally. Agree an owner before kick-off, or price in a fractional security or sustainability lead."]);
  if(a.skipCheck)flags.push(["Self-check skipped","Estimates assume 'Partly' for every practice. Validate before quoting."]);
  if(pf.res.length>=5&&it.path!=="direct")flags.push(["Scope",`${pf.res.length} frameworks at once is a lot. Recommend phasing: start with ${pf.res.filter(r=>isMust(r.level)).map(r=>r.f.short).join(", ")||pf.res[0].f.short}.`]);
  return flags;
}

/* ===================== Path screens ===================== */
function renderChooser(){
  const target=cur&&!cur.example&&pathPick==="switch";
  $("#view").innerHTML=`
   <div class="wshead">${target?`<div class="crumb"><button class="linkbtn" type="button" data-back-assess>← Back to ${esc(nameOf(cur))}</button></div>`:`<div class="crumb"><button class="linkbtn" type="button" data-nav="home">← All assessments</button></div>`}
     <span class="eyebrow">${target?"Change approach":"New assessment"}</span><h1>How can we help?</h1>
     <p class="muted" style="margin:0;max-width:62ch">Choose the route that fits where you are. ${target?"Your answers so far are kept.":"You can switch later without losing answers."}</p></div>
   <div class="pathgrid">${["guided","request","direct"].map(k=>{const P=PATHS[k];return `<button class="pathcard" type="button" data-path="${k}">${tile(PATH_IC[k][0],PATH_IC[k][1],"lg")}
     <span class="eyebrow">${esc(P.name)} · ${esc(P.time)}</span><strong class="ptitle">${esc(P.title)}</strong><span class="pdesc">${esc(P.desc)}</span>
     <ul class="plain">${P.gets.map(g=>`<li>${esc(g)}</li>`).join("")}</ul><span class="pgo">Start →</span></button>`}).join("")}</div>
   <p class="meta" style="margin-top:14px">Want to screen everything? <button class="linkbtn" type="button" data-path="full">Run the full check of all ${FRAMEWORKS.length} frameworks</button></p>`;
}
let pathPick="new";
function startPath(k){
  if(pathPick==="switch"&&cur&&!cur.example){cur.path=k;touch();step=PATHS[k].steps[0][0];go("assess");return}
  cur=blankAssessment();cur.path=k;items.push(cur);touch();step=PATHS[k].steps[0][0];go("assess");
}
function radios(name,opts,val){return `<div class="opts" role="radiogroup">${opts.map(([v,l],i)=>`<label class="opt"><input type="radio" name="${name}" id="${name}-${i}" value="${esc(v)}" ${val===v?"checked":""}>${esc(l)}</label>`).join("")}</div>`}
function checks(name,opts,vals){return `<div class="opts">${opts.map(([v,l],i)=>`<label class="opt"><input type="checkbox" name="${name}" id="${name}-${i}" value="${esc(v)}" ${(vals||[]).includes(v)?"checked":""}>${esc(l)}</label>`).join("")}</div>`}
function readIntake(){
  const it=cur.intake;const r=n=>{const e=document.querySelector(`input[name="${n}"]:checked`);return e?e.value:undefined};const c=n=>[...document.querySelectorAll(`input[name="${n}"]:checked`)].map(e=>e.value);
  if(document.querySelector('[name="i-goals"]'))it.goals=c("i-goals");
  ["budget","deadline","lead","asker","conseq"].forEach(k=>{if(document.querySelector(`[name="i-${k}"]`)){const v=r("i-"+k);if(v)it[k]=v}});
  if(document.querySelector('[name="i-asked"]'))it.asked=c("i-asked");
  const o=document.getElementById("i-other");if(o)it.other=o.value.trim();
  const n=document.getElementById("i-name");if(n)cur.profile.name=n.value.trim();
}
function wireIntake(){$("#stepview").querySelectorAll("input,textarea").forEach(el=>el.addEventListener("input",()=>{readIntake();touch();updateMeta()}))}
function renderGoals(){
  const it=cur.intake;
  $("#stepview").innerHTML=`<div class="panel">
   <section class="card intro"><h2>Let's start with what you want to achieve</h2><p class="meta" style="margin:0">No jargon needed. We'll translate your goals into the right standards, and be upfront about cost, time and effort.</p></section>
   <div class="grid2">
     <div class="q"><label class="lbl" for="i-name">Company name</label><input type="text" id="i-name" value="${esc(cur.profile.name)}" placeholder="e.g. Acme Pte Ltd" autocomplete="organization"></div>
     <div class="q" role="group" aria-labelledby="i-goals-l"><span class="lbl" id="i-goals-l">What do you want to achieve? Pick any.</span>${checks("i-goals",GOALS,it.goals)}</div>
     <div class="q" role="group" aria-labelledby="i-budget-l"><span class="lbl" id="i-budget-l">Rough budget for the first year</span><div class="help">Helps us suggest a sensible first step. It isn't a commitment.</div>${radios("i-budget",BUDGETS.map(b=>[b[0],b[1]]),it.budget)}</div>
     <div class="q" role="group" aria-labelledby="i-deadline-l"><span class="lbl" id="i-deadline-l">Is there a deadline?</span>${radios("i-deadline",DEADLINES.map(d=>[d[0],d[1]]),it.deadline)}</div>
     <div class="q" role="group" aria-labelledby="i-lead-l"><span class="lbl" id="i-lead-l">Who could lead this internally?</span><div class="help">Every successful project has an internal owner, even with a consultant.</div>${radios("i-lead",LEADS,it.lead)}</div>
   </div>
   <div class="nav"><span class="meta">Next, a few questions about the business.</span><button class="btn" data-step="profile" type="button">Next: about the business</button></div></div>`;
  wireIntake();
}
function renderRequest(){
  const it=cur.intake;
  $("#stepview").innerHTML=`<div class="panel">
   <section class="card intro"><h2>Tell us what was asked for</h2><p class="meta" style="margin:0">We'll check whether the deadline is realistic and show the fastest credible route.</p></section>
   <div class="grid2">
     <div class="q"><label class="lbl" for="i-name">Company name</label><input type="text" id="i-name" value="${esc(cur.profile.name)}" placeholder="e.g. Acme Pte Ltd" autocomplete="organization"></div>
     <div class="q" role="group" aria-labelledby="i-asker-l"><span class="lbl" id="i-asker-l">Who is asking?</span>${radios("i-asker",ASKERS,it.asker)}</div>
     <div class="q wide" role="group" aria-labelledby="i-asked-l"><span class="lbl" id="i-asked-l">What did they ask for? Pick any.</span><div class="help">Pick nothing if you're not sure. We'll work it out from your business profile.</div>
       ${FAMILIES.map(fm=>`<div class="askfam"><span class="meta">${esc(fm)}</span>${checks("i-asked",FRAMEWORKS.filter(f=>f.fam===fm).map(f=>[f.id,f.short]),it.asked)}</div>`).join("")}
       <label class="field" for="i-other"><span class="flabel">Anything else, in their words</span><textarea id="i-other" rows="2" placeholder='e.g. "Evidence of cyber security controls and a carbon reduction plan"'>${esc(it.other||"")}</textarea></label></div>
     <div class="q" role="group" aria-labelledby="i-deadline-l"><span class="lbl" id="i-deadline-l">By when?</span>${radios("i-deadline",DEADLINES.map(d=>[d[0],d[1]]),it.deadline)}</div>
     <div class="q" role="group" aria-labelledby="i-conseq-l"><span class="lbl" id="i-conseq-l">What happens if you miss it?</span>${radios("i-conseq",CONSEQ,it.conseq)}</div>
     <div class="q" role="group" aria-labelledby="i-lead-l"><span class="lbl" id="i-lead-l">Who could lead this internally?</span>${radios("i-lead",LEADS,it.lead)}</div>
   </div>
   <div class="nav"><span class="meta">Next, a few questions about the business.</span><button class="btn" data-step="profile" type="button">Next: about the business</button></div></div>`;
  wireIntake();
}
function renderChoose(){
  const sel=new Set(cur.fw||[]);
  $("#stepview").innerHTML=`<div class="panel">
   <section class="card intro"><h2>Which frameworks do you need?</h2><p class="meta" style="margin:0">Tick one or more. Not sure? <button class="linkbtn" type="button" data-switch="guided">Switch to the guided route</button> and keep your answers.</p></section>
   ${FAMILIES.map(fm=>`<section class="fwfam"><h2 class="famh">${famTile(fm)}${esc(fm)}</h2><div class="fwgrid">${FRAMEWORKS.filter(f=>f.fam===fm).map(f=>`<label class="fwcard${sel.has(f.id)?" on":""}"><input type="checkbox" data-fw="${f.id}" id="fw-${f.id}" ${sel.has(f.id)?"checked":""}>
     <span class="fwtop"><strong>${esc(f.short)}</strong><span class="meta">${esc(f.kind)}</span></span><span class="meta">${esc(PLAIN[f.id])}</span><span class="meta">Typically ${f.months[0]}–${f.months[0]+f.months[1]} months</span></label>`).join("")}</div></section>`).join("")}
   <div class="nav"><span class="meta" id="fwCount">${sel.size} selected</span><button class="btn" data-step="profile" type="button" id="chooseNext">Next: scoping questions</button></div></div>`;
  wireFwChecks();
}
function wireFwChecks(){
  $("#stepview").querySelectorAll("input[data-fw]").forEach(el=>el.addEventListener("change",()=>{
    const ids=[...document.querySelectorAll("input[data-fw]:checked")].map(e=>e.dataset.fw);
    cur.fw=FRAMEWORKS.map(f=>f.id).filter(id=>ids.includes(id));touch();updateMeta();
    el.closest(".fwcard").classList.toggle("on",el.checked);const c=$("#fwCount");if(c)c.textContent=`${cur.fw.length} selected`;
  }));
}
function renderPlan(){
  const a=cur,it=a.intake,T=planTiers(a);
  if(!a.fw)a.fw=T.start.map(c=>c.f.id);
  const sel=new Set(a.fw);const dl=deadlineMonths(it.deadline);
  const card=(c,tier)=>{const fz=feas(c.f,c.r.months,dl);return `<label class="plancard${sel.has(c.f.id)?" on":""}"><input type="checkbox" data-fw="${c.f.id}" id="fw-${c.f.id}" ${sel.has(c.f.id)?"checked":""}>
     <span class="fwtop"><strong>${esc(c.f.short)}</strong>${lvlPill(c.lvl)}</span>
     <span>${esc(PLAIN[c.f.id])}</span>
     ${c.why.length?`<ul class="why">${c.why.slice(0,2).map(w=>`<li>${esc(w)}</li>`).join("")}</ul>`:""}
     ${c.gm?`<span class="meta">Matches ${c.gm} of your goals</span>`:""}
     <span class="facts"><span><b>~${c.r.months} mo</b> to complete</span><span><b>${range(c.r.fees)}</b> Parang fees</span>${c.r.ext&&c.r.ext.hi>0?`<span><b>${range(c.r.ext)}</b> to the auditor</span>`:""}${dl!==Infinity?`<span class="feas F-${fz.st}">${FEAS_LABEL[fz.st]}</span>`:""}</span></label>`};
  const tier=(t,title,sub,list)=>list.length?`<section class="tier"><div class="tierhead"><h2>${title}</h2><span class="meta">${sub}</span></div><div class="fwgrid">${list.map(c=>card(c,t)).join("")}</div></section>`:"";
  const B=T.B;const bl=(BUDGETS.find(b=>b[0]===it.budget)||[])[1];
  const fit=B===Infinity?"":T.spend<=B?`<div class="note ok">The "Start here" step fits your budget of ${esc(bl)}: about ${money(T.spend,1000)} in the first year.</div>`:`<div class="note warn">The required items alone come to about ${money(T.spend,1000)}, above your budget of ${esc(bl)}. Options: spread the work over two financial years, narrow the scope, or use grant support where eligible.</div>`;
  const leadNote=it.lead==="none"?`<div class="note warn">You'll need an internal owner. Even with a consultant doing the drafting, someone inside must make decisions and gather evidence: expect a few hours a week.</div>`:"";
  $("#stepview").innerHTML=`<div class="panel">
   <section class="card intro"><h2>Your plan</h2><p style="margin:0">Based on your goals and business, here's where we'd start. Costs and times are first estimates, assuming you're partly there today. The quick check in the next step makes them sharper.</p>${fit}${leadNote}</section>
   ${tier("start","Start here","Required, or the best value for your goals",T.start)}
   ${tier("next","Next","Worth doing once the first step is done",T.next)}
   ${tier("later","Later, if relevant","Optional for now",T.later)}
   <details class="more"><summary>What every engagement involves</summary>${engagementBlock(portfolio(effA({...a,fw:T.start.map(c=>c.f.id)},true)),a)}</details>
   <div class="nav"><span class="meta" id="fwCount">${sel.size} selected for the quick check</span><button class="btn" data-step="practice" type="button">Next: quick check</button></div></div>`;
  wireFwChecks();
}
function renderFeasibility(){
  const a=cur,it=a.intake,p=a.profile,dl=deadlineMonths(it.deadline);
  const asked=(it.asked||[]).filter(id=>FW_BY_ID[id]);
  if(!a.fw)a.fw=asked.length?[...asked]:defaultFw(p);
  const pre=effA(a,true);
  const extraReq=screenAll(p).filter(s=>s.lvl==="required"&&!asked.includes(s.f.id)).map(s=>s.f);
  const askedRows=(asked.length?asked:a.fw).map(id=>{const f=FW_BY_ID[id];const r=fwResult(f,{...pre,fw:[id]});const fz=feas(f,r.months,dl);
    return `<div class="feasrow"><div class="fh"><strong>${esc(f.short)}</strong><span class="feas F-${fz.st}">${FEAS_LABEL[fz.st]}</span></div>
     <span class="meta">${esc(fz.txt)}. ${esc(PLAIN[f.id])}</span>
     ${fz.st!=="ok"&&fz.st!=="none"?`<div><strong>Fastest credible route</strong><ul class="plain">${(INTERIM[id]||[]).map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`:""}
     <label class="consent"><input type="checkbox" data-fw="${id}" ${a.fw.includes(id)?"checked":""}> Include in this assessment</label></div>`}).join("");
  const cq=it.conseq==="lose"||it.conseq==="penalty";
  $("#stepview").innerHTML=`<div class="panel">
   <section class="card intro"><h2>Deadline check</h2><p style="margin:0">${dl===Infinity?"No fixed deadline, so we can plan for the best long-term route.":`You have about <strong>${dl} month${dl===1?"":"s"}</strong>. Estimates assume you're partly there today; the next step sharpens them.`}</p>
     ${it.other?`<p class="meta" style="margin:0">They also asked for: "${esc(it.other)}". We'll map this in the free review.</p>`:""}
     ${!asked.length?`<p class="meta" style="margin:0">You didn't pick a specific framework, so we've matched what applies to your business.</p>`:""}</section>
   <section class="card"><h2>${asked.length?"What they asked for":"What applies to you"}</h2>${askedRows}</section>
   ${extraReq.length?`<section class="card"><h2>Also required for your business</h2><p class="meta" style="margin:0">Not part of this request, but the law or your contracts require them. Worth fixing alongside.</p>${extraReq.map(f=>`<label class="consent"><input type="checkbox" data-fw="${f.id}" ${a.fw.includes(f.id)?"checked":""}> <span><strong>${esc(f.short)}</strong>: ${esc(PLAIN[f.id])}</span></label>`).join("")}</section>`:""}
   ${cq&&dl!==Infinity?`<div class="note warn">Missing this deadline means ${it.conseq==="lose"?"losing the deal":"regulatory exposure"}. Ask the requester early what interim evidence they will accept, and get it in writing.</div>`:""}
   <div class="nav"><span class="meta" id="fwCount">${a.fw.length} selected</span><button class="btn" data-step="practice" type="button">Next: rate practices</button></div></div>`;
  $("#stepview").querySelectorAll("input[data-fw]").forEach(el=>el.addEventListener("change",()=>{
    const id=el.dataset.fw;const s=new Set(cur.fw);el.checked?s.add(id):s.delete(id);cur.fw=FRAMEWORKS.map(f=>f.id).filter(x=>s.has(x));touch();updateMeta();$("#fwCount").textContent=`${cur.fw.length} selected`}));
}

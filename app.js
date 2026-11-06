const CATS=["Loyer","Nourriture","Transport","Factures","Famille","Santé","Éducation","Loisirs","Achats","Autres"];
const INCOME=["Salaire","Activité / commerce","Freelance","Prime","Aide familiale","Autres revenus"];
const RESERVE=["Épargne","Fonds d’urgence","Projet","Provision factures","Autre provision"];
const ACCOUNT_DEFAULTS=[{id:"cash",name:"Espèces",icon:"💵",opening:0},{id:"wave",name:"Wave",icon:"🌊",opening:0},{id:"orange",name:"Orange Money",icon:"🟠",opening:0},{id:"bank",name:"Banque",icon:"🏦",opening:0}];
const ICONS={"Loyer":"⌂","Nourriture":"◉","Transport":"↗","Factures":"▤","Famille":"♡","Santé":"✚","Éducation":"▣","Loisirs":"✦","Achats":"◇","Autres":"•","Salaire":"▣","Activité / commerce":"↗","Freelance":"⌘","Prime":"✧","Aide familiale":"♡","Autres revenus":"＋","Épargne":"◎","Fonds d’urgence":"◈","Projet":"☆","Provision factures":"▤","Autre provision":"◷"};
const COLORS=["#16845b","#5579d8","#e6a23c","#a16ac5","#df6b6b","#46a6b3","#8b9aab","#d18a24","#638b6b","#9a7cbd"];
const KEY="mon-budget-fcfa-v2", today=new Date(), monthKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
const money=n=>new Intl.NumberFormat("fr-FR",{maximumFractionDigits:0}).format(Math.round(n||0))+" FCFA";
const dateText=s=>new Date(s+"T12:00:00").toLocaleDateString("fr-FR",{day:"2-digit",month:"short"});
const $=id=>document.getElementById(id);
const fresh=()=>({transactions:[],budgets:{},goals:[],accounts:ACCOUNT_DEFAULTS.map(a=>({...a}))});
let data;try{data=JSON.parse(localStorage.getItem(KEY))||fresh()}catch{data=fresh()}
if(!Array.isArray(data.accounts)||!data.accounts.length)data.accounts=ACCOUNT_DEFAULTS.map(a=>({...a}));
data.accounts=ACCOUNT_DEFAULTS.map(def=>({...def,...(data.accounts.find(a=>a.id===def.id)||{})}));
const save=()=>localStorage.setItem(KEY,JSON.stringify(data)), month=monthKey(today);
const txMonth=()=>data.transactions.filter(t=>monthKey(new Date(t.date+"T12:00:00"))===month);
const sum=(arr,type)=>arr.filter(t=>t.type===type).reduce((s,t)=>s+Number(t.amount),0);
const budget=()=>data.budgets[month]||{};
const spent=cat=>txMonth().filter(t=>t.type==="expense"&&t.category===cat).reduce((s,t)=>s+Number(t.amount),0);
const escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function accountBalance(id){
 const a=data.accounts.find(x=>x.id===id);if(!a)return 0;
 let value=Number(a.opening)||0;
 data.transactions.forEach(t=>{
  if(t.type==="income"&&t.accountId===id)value+=Number(t.amount);
  if(t.type==="expense"&&t.accountId===id)value-=Number(t.amount);
  if(t.type==="transfer"){if(t.fromAccountId===id)value-=Number(t.amount);if(t.toAccountId===id)value+=Number(t.amount);}
 });
 return value;
}
function totalReserves(){return sum(data.transactions,"reserve")}
function close(){document.querySelectorAll("dialog[open]").forEach(d=>d.close())}
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",close));
document.querySelectorAll("dialog").forEach(d=>d.addEventListener("click",e=>{if(e.target===d)d.close()}));
$("monthLabel").textContent=today.toLocaleDateString("fr-FR",{month:"long",year:"numeric"});
function accountOptions(select,selected){select.innerHTML=data.accounts.map(a=>`<option value="${a.id}" ${a.id===selected?"selected":""}>${a.icon} ${escape(a.name)}</option>`).join("")}
function render(){
 const tx=txMonth(),inc=sum(tx,"income"),exp=sum(tx,"expense"),res=sum(tx,"reserve"),cash=data.accounts.reduce((s,a)=>s+accountBalance(a.id),0),available=cash-totalReserves();
 $("available").textContent=money(available);$("available").style.color=available<0?"#ff9d9d":"white";
 $("incomeTotal").textContent=money(inc);$("expenseTotal").textContent=money(exp);$("reserveTotal").textContent=money(res);$("expenseSub").textContent=tx.filter(t=>t.type==="expense").length+" opération(s)";
 renderAccounts();renderBudget();renderTransactions();renderChart();renderGoals();renderAlerts(available);
}
function renderAccounts(){
 $("accounts").innerHTML=data.accounts.map(a=>`<article class="account-card"><div class="account-top"><span class="account-icon">${a.icon}</span><span class="account-name">${escape(a.name)}</span></div><strong>${money(accountBalance(a.id))}</strong><small>Solde du compte</small></article>`).join("");
}
function renderBudget(){
 const keys=Object.keys(budget()).filter(k=>Number(budget()[k])>0);
 $("budgetList").innerHTML=keys.length?keys.map(cat=>{const limit=Number(budget()[cat]),s=spent(cat),p=Math.min(100,s/limit*100),over=s>limit;return `<div><div class="budget-item-top"><strong>${ICONS[cat]||"•"} &nbsp;${escape(cat)}</strong><span>${money(s)} / ${money(limit)}</span></div><div class="progress"><span class="${over?"over":""}" style="width:${p}%"></span></div><div class="budget-hint">${over?"Dépassement de "+money(s-limit):money(limit-s)+" restant · "+Math.round(p)+" % utilisé"}</div></div>`}).join(""):'<div class="empty">Aucun budget défini pour ce mois.</div>';
}
function transactionMarkup(t){
 const typeName={income:"Revenu",expense:"Dépense",reserve:"Provision",transfer:"Transfert"};
 let account=t.type==="transfer"?`${data.accounts.find(a=>a.id===t.fromAccountId)?.name||"Compte"} → ${data.accounts.find(a=>a.id===t.toAccountId)?.name||"Compte"}`:data.accounts.find(a=>a.id===t.accountId)?.name||"Compte";
 const positive=t.type==="income",neutral=t.type==="transfer",sign=positive?"+":neutral?"↔":"−";
 return `<div class="transaction"><div class="tx-icon">${t.type==="transfer"?"⇄":ICONS[t.category]||"•"}</div><div class="tx-info"><strong>${escape(t.label)}</strong><small>${escape(t.category||"")} · ${escape(account)} · ${dateText(t.date)} · ${typeName[t.type]}</small></div><div class="tx-amount ${positive?"positive":neutral?"neutral":"negative"}">${sign} ${money(t.amount)}</div></div>`;
}
function renderTransactions(){const list=[...txMonth()].sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt-a.createdAt);$("transactions").innerHTML=list.length?list.slice(0,6).map(transactionMarkup).join(""):'<div class="empty">Aucune opération ce mois-ci.</div>';$("allTransactions").innerHTML=list.length?list.map(transactionMarkup).join(""):'<div class="empty">Aucune opération enregistrée.</div>'}
function renderChart(){
 const tx=txMonth().filter(t=>t.type==="expense"),totals={};tx.forEach(t=>totals[t.category]=(totals[t.category]||0)+Number(t.amount));
 const entries=Object.entries(totals).sort((a,b)=>b[1]-a[1]),canvas=$("expenseChart"),ctx=canvas.getContext("2d"),dpr=devicePixelRatio||1,size=190;
 canvas.width=size*dpr;canvas.height=size*dpr;canvas.style.width=size+"px";canvas.style.height=size+"px";ctx.scale(dpr,dpr);ctx.clearRect(0,0,size,size);
 const total=entries.reduce((s,e)=>s+e[1],0);$("chartEmpty").style.display=total?"none":"grid";if(!total){$("chartLegend").innerHTML="";return}
 let angle=-Math.PI/2;entries.forEach(([n,v],i)=>{const next=angle+v/total*Math.PI*2;ctx.beginPath();ctx.arc(95,95,75,angle,next);ctx.arc(95,95,47,next,angle,true);ctx.closePath();ctx.fillStyle=COLORS[i%COLORS.length];ctx.fill();angle=next});
 ctx.fillStyle="#172338";ctx.textAlign="center";ctx.font="700 14px system-ui";ctx.fillText(money(total).replace(" FCFA",""),95,92);ctx.fillStyle="#8793a4";ctx.font="10px system-ui";ctx.fillText("Dépensé",95,108);
 $("chartLegend").innerHTML=entries.slice(0,6).map(([n,v],i)=>`<div class="legend-item"><i class="dot" style="background:${COLORS[i%COLORS.length]}"></i><span>${escape(n)} · ${Math.round(v/total*100)}%</span></div>`).join("");
}
function renderGoals(){
 $("goals").innerHTML=data.goals.length?data.goals.map((g,i)=>{const p=Math.min(100,g.target?g.saved/g.target*100:0);return `<div><div class="goal-top"><strong>${escape(g.name)}</strong><span>${money(g.saved)} / ${money(g.target)}</span></div><div class="progress"><span style="width:${p}%"></span></div><div class="goal-foot"><span>${Math.round(p)} % atteint ${g.deadline?"· Échéance "+dateText(g.deadline):""}</span><button class="text-btn" data-goal="${i}">＋ Ajouter</button></div></div>`}).join(""):'<div class="empty">Crée ton premier objectif d’épargne.</div>';
 document.querySelectorAll("[data-goal]").forEach(b=>b.addEventListener("click",()=>{const i=Number(b.dataset.goal),raw=prompt("Montant à ajouter à cet objectif (FCFA) :");if(raw===null)return;const n=Number(raw);if(!Number.isFinite(n)||n<=0){alert("Entre un montant positif.");return}data.goals[i].saved+=n;save();render()}));
}
function renderAlerts(available){
 const alerts=[];Object.entries(budget()).forEach(([c,l])=>{const s=spent(c);if(s>l)alerts.push(`Budget dépassé pour ${c} : ${money(s-l)} au-dessus de l’enveloppe.`);else if(l>0&&s/l>=.8)alerts.push(`Attention : ${c} a consommé ${Math.round(s/l*100)} % de son budget.`)});
 if(available<0)alerts.unshift(`Ton solde disponible est négatif de ${money(-available)}. Vérifie tes opérations et provisions.`);
 $("alerts").innerHTML=alerts.map(a=>`<div class="alert">⚠ ${escape(a)}</div>`).join("");
}
function categories(type){return type==="income"?INCOME:type==="reserve"?RESERVE:CATS}
function updateType(){
 const type=document.querySelector('[name="type"]:checked').value,transfer=type==="transfer";
 $("singleAccountFields").hidden=transfer;$("transferFields").hidden=!transfer;
 if(transfer){accountOptions($("fromAccount"));accountOptions($("toAccount"),data.accounts[1]?.id)}
 else{$("transactionCategory").innerHTML=categories(type).map(c=>`<option>${escape(c)}</option>`).join("");accountOptions($("accountSelect"))}
}
function openTransaction(){
 $("transactionForm").reset();$("transactionForm").elements.date.value=today.toISOString().slice(0,10);
 document.querySelector('[name="type"][value="expense"]').checked=true;updateType();$("transactionDialog").showModal();
}
["addTransactionTop","mobileAdd"].forEach(id=>$(id).addEventListener("click",openTransaction));
document.querySelectorAll('[name="type"]').forEach(r=>r.addEventListener("change",updateType));
$("transactionForm").addEventListener("submit",e=>{
 e.preventDefault();const f=new FormData(e.currentTarget),type=f.get("type"),amount=Number(f.get("amount")),date=f.get("date");
 if(!Number.isFinite(amount)||amount<=0)return;
 const t={id:crypto.randomUUID?.()||String(Date.now()),type,label:f.get("label").trim(),amount,date,note:f.get("note"),createdAt:Date.now()};
 if(type==="transfer"){t.fromAccountId=f.get("fromAccountId");t.toAccountId=f.get("toAccountId");if(t.fromAccountId===t.toAccountId){alert("Choisis deux comptes différents.");return}if(amount>accountBalance(t.fromAccountId)){if(!confirm("Le transfert dépasse le solde estimé du compte de départ. Continuer ?"))return}}
 else{t.accountId=f.get("accountId");t.category=f.get("category");}
 data.transactions.push(t);save();close();render();
});
$("manageAccountsBtn").addEventListener("click",()=>{
 $("accountFields").innerHTML=data.accounts.map(a=>`<label><span>${a.icon} ${escape(a.name)} — solde de départ (FCFA)</span><input type="number" min="0" step="1" name="${a.id}" value="${Number(a.opening)||0}"></label>`).join("");
 $("accountsDialog").showModal();
});
$("accountsForm").addEventListener("submit",e=>{e.preventDefault();const f=new FormData(e.currentTarget);data.accounts.forEach(a=>a.opening=Math.max(0,Number(f.get(a.id))||0));save();close();render()});
$("editBudgetBtn").addEventListener("click",openBudget);$("mobileBudget").addEventListener("click",openBudget);
function openBudget(){$("budgetFields").innerHTML=CATS.map(c=>`<label><span>${ICONS[c]||"•"} ${c}</span><input type="number" min="0" name="${c}" value="${budget()[c]||""}" placeholder="0"></label>`).join("");$("budgetDialog").showModal()}
$("budgetForm").addEventListener("submit",e=>{e.preventDefault();const f=new FormData(e.currentTarget),b={};CATS.forEach(c=>{const n=Number(f.get(c));if(n>0)b[c]=n});data.budgets[month]=b;save();close();render()});
$("addGoalBtn").addEventListener("click",()=>$("goalDialog").showModal());$("mobileGoals").addEventListener("click",()=>$("goals").scrollIntoView({behavior:"smooth"}));
$("goalForm").addEventListener("submit",e=>{e.preventDefault();const f=new FormData(e.currentTarget);data.goals.push({name:f.get("name").trim(),target:Number(f.get("target")),saved:Number(f.get("saved")||0),deadline:f.get("deadline")});save();close();render()});
$("viewAllBtn").addEventListener("click",()=>$("historyDialog").showModal());
$("exportBtn").addEventListener("click",()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`mon-budget-sauvegarde-${month}.json`;a.click();URL.revokeObjectURL(url)});
let installPrompt;window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installPrompt=e;$("installBtn").hidden=false});
$("installBtn").addEventListener("click",async()=>{if(!installPrompt)return;installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$("installBtn").hidden=true});
if("serviceWorker"in navigator&&location.protocol!=="file:")addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
render();
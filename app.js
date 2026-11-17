'use strict';
/* TrilhaSaúde: dados persistidos no MySQL por uma API Node.js. */
const P={home:'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',file:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',bell:'<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',route:'<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6H15a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h6.5"/>',chat:'<path d="M4 5h16v11H9l-5 4z"/>',steth:'<path d="M6 3v6a4 4 0 0 0 8 0V3"/><path d="M10 13v2a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="11" r="2"/>',chev:'<path d="M9 6l6 6-6 6"/>',back:'<path d="M15 6l-6 6 6 6"/>',check:'<path d="M5 12l5 5 9-10"/>',trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',folder:'<path d="M3 6h7l2 3h9v11H3z"/>',share:'<path d="M12 3v12M7 8l5-5 5 5M5 14v6h14v-6"/>'};
const ic=n=>`<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=s=>document.querySelector(s);
const STEPS=[['Cadastro','Conta criada no app'],['Consulta inicial','Avaliação com a equipe de saúde'],['Coleta do exame','Material coletado para análise'],['Análise do resultado','O laboratório analisa o material'],['Retorno com a equipe','Conversa sobre o resultado']];
const STAT=[['Agendado',''],['Coletado','wait'],['Em análise','wait'],['Resultado disponível','ok']];
const S={tab:'home',sub:null,form:null,auth:'login',err:'',del:false,records:'results'};

/* ---------- API e sessão (cookie HttpOnly gerenciado pelo servidor) ---------- */
let currentUser = null;
const me=()=>currentUser;
const D=()=>currentUser.data;

async function api(path, method='GET', body) {
  let response;
  try {
    response=await fetch('/api'+path,{
      method,
      credentials:'same-origin',
      headers:body===undefined?{}:{'Content-Type':'application/json'},
      body:body===undefined?undefined:JSON.stringify(body)
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique se o Node.js e o MySQL estão ativos.');
  }
  const result=await response.json().catch(()=>({}));
  if(!response.ok) {
    const error=new Error(result.error||`Erro HTTP ${response.status}`);
    error.status=response.status;
    throw error;
  }
  return result;
}
async function load() {
  try { currentUser=await api('/me'); }
  catch(error) {
    if(error.status===401){currentUser=null;return;}
    throw error;
  }
}
function report(error) {
  if(error.status===401) {
    currentUser=null; S.err='Sua sessão expirou. Entre novamente.';render();
  } else alert(error.message);
}

/* ---------- Utilidades ---------- */
const fdt=v=>{const d=new Date(v);return isNaN(d)?'':d.toLocaleString('pt-BR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).replace('.','')};
const fd=v=>v?v.split('-').reverse().join('/'):'';
const greet=()=>{const h=new Date().getHours();return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite'};
const sorted=()=>[...D().appts].sort((a,b)=>new Date(a.date)-new Date(b.date));
const initial=()=>esc(me().name.trim()[0]?.toUpperCase()||'?');
/* ---------- Telas ---------- */
const apptRow=(a,full)=>{
  const past=new Date(a.date)<Date.now();
  return `<div class="row" ${full?'':'data-a="tab" data-v="consultas" role="button" tabindex="0"'}><span class="badge">${ic('steth')}</span><span class="t"><b>${esc(a.title)}</b><span class="s">${esc(a.who)}${a.who?' · ':''}${a.location?esc(a.location)+' · ':''}${fdt(a.date)}</span></span>${full?`<span class="acts">${past?'<span class="pill">Realizada</span>':`<button class="${a.ok?'pill ok':'btn ghost'}" data-a="conf" data-id="${a.id}">${a.ok?'Confirmada':'Confirmar'}</button>`}<button class="x" data-a="delA" data-id="${a.id}" aria-label="Excluir consulta">${ic('trash')}</button></span>`:ic('chev')}</div>`;
};
function home(){
  const d=D(),up=sorted().filter(a=>new Date(a.date)>=Date.now()).slice(0,2),first=esc(me().name.trim().split(' ')[0]);
  return `<div class="top"><div><small>${greet()}, ${first}</small><h1>Olá, ${first}!</h1><p class="sub">Vamos cuidar da sua saúde hoje?</p></div><button class="avatar" data-a="tab" data-v="perfil" aria-label="Abrir perfil">${initial()}</button></div>
  <div class="dashboard-grid">
    <div class="hero"><small>${d.done<5?'Seu exame está em andamento':'Jornada concluída'}</small><b>${d.done<5?'Você está no caminho certo':'Você concluiu todas as etapas'}</b><div class="bar"><i style="width:${d.done/5*100}%"></i></div><p>${d.done} de 5 etapas concluídas</p></div>
    <section class="quick-section"><div class="sec"><h2>Acessos rápidos</h2></div>
    <div class="quick"><button data-a="tab" data-v="consultas">${ic('cal')}Minhas consultas</button><button data-a="tab" data-v="exames">${ic('file')}Meus exames</button><button data-a="go" data-v="jornada">${ic('route')}Acompanhar jornada</button><button data-a="go" data-v="chat">${ic('chat')}Chat (demonstração)</button><button data-a="tab" data-v="registros">${ic('folder')}Resultados e documentos</button></div></section>
    <section class="appointments-section"><div class="sec"><h2>Próximos compromissos</h2><button class="link" data-a="tab" data-v="consultas">Ver todos</button></div>
    ${up.length?up.map(a=>apptRow(a,false)).join(''):'<p class="empty">Nenhum compromisso por aqui. Agende sua consulta na aba Consultas.</p>'}</section>
  </div>`;
}
function consultas(){
  const l=sorted();
  return `<div class="top"><div><h1>Consultas</h1><p class="sub">Seus compromissos de saúde</p></div><button class="btn" data-a="new" data-v="appt">Agendar</button></div>
  ${S.form=='appt'?`<form class="f" data-f="appt"><label>Tipo de consulta<input name="title" required maxlength="60" placeholder="Ex.: Consulta ginecológica"></label><label>Profissional ou local<input name="who" maxlength="60" placeholder="Ex.: Dra. Camila, UBS Centro"></label><label>Local<input name="location" maxlength="150" placeholder="Ex.: UBS Centro"></label><label>Profissional cadastrado (opcional)<select name="professionalId"><option value="">Não vincular</option>${D().professionals.map(p=>`<option value="${p.id}">${esc(p.name)}${p.specialty?` · ${esc(p.specialty)}`:''}</option>`).join('')}</select></label><label>Data e hora<input type="datetime-local" name="date" required></label><div class="two"><button class="btn">Salvar consulta</button><button type="button" class="btn ghost" data-a="cancel">Cancelar</button></div></form>`:''}
  <div style="margin-top:16px">${l.length?l.map(a=>apptRow(a,true)).join(''):'<p class="empty">Você ainda não agendou nenhuma consulta.</p>'}</div>`;
}
function exames(){
  const l=[...D().exams].sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  return `<div class="top"><div><h1>Exames</h1><p class="sub">Acompanhe o andamento de cada um</p></div><button class="btn" data-a="new" data-v="exam">Adicionar</button></div>
  ${S.form=='exam'?`<form class="f" data-f="exam"><label>Nome do exame<input name="name" required maxlength="60" placeholder="Ex.: Papanicolau"></label><label>Data<input type="date" name="date" required></label><label>Situação<select name="status">${STAT.map(s=>`<option>${s[0]}</option>`).join('')}</select></label><div class="two"><button class="btn">Salvar exame</button><button type="button" class="btn ghost" data-a="cancel">Cancelar</button></div></form>`:''}
  <div style="margin-top:16px">${l.length?l.map(e=>`<div class="row"><span class="badge">${ic('file')}</span><span class="t"><b>${esc(e.name)}</b><span class="s">${fd(e.date)}</span><select class="pill ${(STAT.find(s=>s[0]==e.status)||[])[1]||''}" data-st="${e.id}" aria-label="Situação de ${esc(e.name)}">${STAT.map(s=>`<option ${s[0]==e.status?'selected':''}>${s[0]}</option>`).join('')}</select></span><button class="link" data-a="resultOf" data-id="${e.id}">Resultados</button><button class="x" data-a="delE" data-id="${e.id}" aria-label="Excluir exame">${ic('trash')}</button></div>`).join(''):'<p class="empty">Nenhum exame cadastrado ainda.</p>'}</div>`;
}
// Área de registros integrada à jornada do paciente
const professionalOptions=()=>`<option value="">Não vincular</option>${D().professionals.map(p=>`<option value="${p.id}">${esc(p.name)}${p.specialty?' · '+esc(p.specialty):''}</option>`).join('')}`;
const fileLink=(kind,id,label='Baixar arquivo')=>`<a class="link" href="/api/${kind}/${id}/file" download>${label}</a>`;
const recordButtons=[['results','Resultados'],['referrals','Encaminhamentos'],['documents','Documentos'],['professionals','Profissionais']];
function registros(){
 const r=S.records;
 const actions=`<div class="record-tabs" aria-label="Categorias de registros">${recordButtons.map(([key,label])=>`<button class="${r===key?'active':''}" data-a="record" data-v="${key}" aria-pressed="${r===key}">${label}</button>`).join('')}</div>`;
 let body='';
 if(r==='results'){
   const list=D().results;
   body=`<div class="sec"><h2>Resultados de exames</h2><button class="btn" data-a="new" data-v="result">Adicionar resultado</button></div>
   ${S.form==='result'?`<form class="f record-form" data-f="result"><label>Exame<select name="examId" required>${D().exams.map(e=>`<option value="${e.id}" ${String(S.resultExam||'')===String(e.id)?'selected':''}>${esc(e.name)} · ${fd(e.date)}</option>`).join('')}</select></label><label>Data do resultado<input type="date" name="date" required></label><label>Descrição<textarea name="description" maxlength="5000" required placeholder="Informações referentes ao resultado"></textarea></label><label>Arquivo (opcional: PDF, JPG ou PNG, até 3 MB)<input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"></label><div class="two"><button class="btn" ${D().exams.length?'':'disabled'}>Salvar resultado</button><button type="button" class="btn ghost" data-a="cancel">Cancelar</button></div></form>`:''}
   ${list.length?list.map(item=>`<div class="row"><span class="badge">${ic('file')}</span><span class="t"><b>${esc(D().exams.find(e=>String(e.id)===String(item.examId))?.name||'Exame')}</b><span class="s">${fd(item.date)} · ${esc(item.description)}</span>${item.hasFile?fileLink('results',item.id,esc(item.fileName||'Baixar resultado')):''}</span><button class="x" data-a="delR" data-id="${item.id}" aria-label="Excluir resultado">${ic('trash')}</button></div>`).join(''):'<p class="empty">Nenhum resultado cadastrado.</p>'}`;
 }
 if(r==='referrals'){
   const list=D().referrals;
   body=`<div class="sec"><h2>Encaminhamentos</h2><button class="btn" data-a="new" data-v="referral">Adicionar</button></div>
   ${S.form==='referral'?`<form class="f record-form" data-f="referral"><label>Destino<input name="destination" maxlength="150" required placeholder="Ex.: Unidade especializada"></label><label>Motivo<textarea name="reason" maxlength="5000" required></textarea></label><label>Profissional associado (opcional)<select name="professionalId">${professionalOptions()}</select></label><label>Data do encaminhamento<input type="date" name="date" required></label><div class="two"><button class="btn">Salvar encaminhamento</button><button class="btn ghost" type="button" data-a="cancel">Cancelar</button></div></form>`:''}
   ${list.length?list.map(item=>`<div class="row"><span class="badge">${ic('route')}</span><span class="t"><b>${esc(item.destination)}</b><span class="s">${fd(item.date)} · ${esc(item.reason)}</span><select class="pill" data-ref-status="${item.id}" aria-label="Situação do encaminhamento">${['Pendente','Agendado','Concluído','Cancelado'].map(s=>`<option ${s===item.status?'selected':''}>${s}</option>`).join('')}</select></span><button class="x" data-a="delRef" data-id="${item.id}" aria-label="Excluir encaminhamento">${ic('trash')}</button></div>`).join(''):'<p class="empty">Nenhum encaminhamento cadastrado.</p>'}`;
 }
 if(r==='documents'){
   const list=D().documents;
   body=`<div class="sec"><h2>Meus documentos</h2><button class="btn" data-a="new" data-v="document">Enviar arquivo</button></div>
   ${S.form==='document'?`<form class="f record-form" data-f="document"><label>Nome do documento<input name="name" maxlength="150" required placeholder="Ex.: Pedido de exame"></label><label>Arquivo (PDF, JPG ou PNG, até 3 MB)<input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" required></label><div class="two"><button class="btn">Salvar documento</button><button type="button" class="btn ghost" data-a="cancel">Cancelar</button></div></form>`:''}
   ${list.length?list.map(item=>`<div class="row"><span class="badge">${ic('folder')}</span><span class="t"><b>${esc(item.name)}</b><span class="s">${fd(item.date)} · ${esc(item.fileName)}</span>${fileLink('documents',item.id)}</span><button class="x" data-a="delDoc" data-id="${item.id}" aria-label="Excluir documento">${ic('trash')}</button></div>`).join(''):'<p class="empty">Nenhum documento enviado.</p>'}`;
 }
 if(r==='professionals'){
   body=`<div class="sec"><h2>Profissionais cadastrados</h2><button class="btn" data-a="new" data-v="professional">Cadastrar</button></div><p class="sub">Cadastro demonstrativo compartilhado; profissionais ainda não são verificados por instituições.</p>
   ${S.form==='professional'?`<form class="f record-form" data-f="professional"><label>Nome<input name="name" maxlength="150" required></label><label>Especialidade<input name="specialty" maxlength="100"></label><label>Registro profissional<input name="registration" maxlength="50"></label><div class="two"><button class="btn">Salvar profissional</button><button type="button" class="btn ghost" data-a="cancel">Cancelar</button></div></form>`:''}
   <div style="margin-top:16px">${D().professionals.length?D().professionals.map(item=>`<div class="row"><span class="badge">${ic('steth')}</span><span class="t"><b>${esc(item.name)}</b><span class="s">${esc(item.specialty)}${item.registration?' · '+esc(item.registration):''}</span></span></div>`).join(''):'<p class="empty">Nenhum profissional cadastrado.</p>'}</div>`;
 }
 return `<div class="top"><div><h1>Registros de saúde</h1><p class="sub">Resultados, encaminhamentos, documentos e profissionais</p></div></div>${actions}${body}`;
}
async function readLocalFile(file){
 if(!file)return null;
 if(file.size>3*1024*1024)throw new Error('O arquivo deve ter até 3 MB.');
 if(!['application/pdf','image/png','image/jpeg'].includes(file.type))throw new Error('Envie um PDF, JPG ou PNG.');
 return {name:file.name,mime:file.type,base64:await new Promise((resolve,reject)=>{
  const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=()=>reject(new Error('Falha ao ler arquivo.'));r.readAsDataURL(file);
 })};
}
function jornada(){
  const n=D().done;
  return `<button class="back" data-a="tab" data-v="home">${ic('back')}Voltar</button><h1>Sua jornada</h1><p class="sub">${n} de 5 etapas concluídas</p>
  <div style="margin-top:18px">${STEPS.map((s,i)=>`<div class="step ${i<n?'done':i==n?'now':''}"><span class="c">${i<n?ic('check'):''}</span><div><b>${s[0]}</b><span>${s[1]}</span></div></div>`).join('')}</div>
  <div class="two f" style="flex-direction:row">${n<5?'<button class="btn" data-a="next">Concluir etapa atual</button>':''}${n>1?'<button class="btn ghost" data-a="undo">Desfazer última</button>':''}</div>`;
}
function notificacoes(){
  const l=D().notes;
  return `<div class="top"><div><h1>Notificações</h1><p class="sub">Avisos sobre exames e consultas</p></div>${l.length?'<button class="link" data-a="readall">Marcar lidas</button>':''}</div>
  <div style="margin-top:16px">${l.length?l.map(n=>`<div class="row" data-a="read" data-id="${n.id}" role="button" tabindex="0">${n.r?'<span style="width:9px"></span>':'<span class="dot"></span>'}<span class="t"><b>${esc(n.t)}</b><span class="s">${esc(n.s)}</span></span></div>`).join('')+'<button class="link" data-a="clearn">Limpar notificações</button>':'<p class="empty">Você não tem notificações.</p>'}</div>`;
}
function perfil(){
  const u=me();
  return `<div class="center" style="padding-top:8px"><div class="avatar" style="width:76px;height:76px;font-size:30px;margin:0 auto 10px">${initial()}</div><h1>${esc(u.name)}</h1><p class="sub">${esc(u.email)}</p></div>
  <form class="f" data-f="perfil"><label>Nome<input name="name" required maxlength="60" value="${esc(u.name)}"></label><label>Telefone<input name="phone" type="tel" maxlength="20" value="${esc(u.data.phone)}" placeholder="(81) 90000-0000"></label><label>Data de nascimento<input name="birthDate" type="date" value="${esc(u.data.birthDate||'')}"></label><button class="btn">Salvar perfil</button></form>
  <div class="row"><span class="t"><b>Lembretes de consulta</b><span class="s">Avisar 24 horas antes</span></span><button class="sw ${u.data.lemb?'on':''}" data-a="lemb" role="switch" aria-checked="${!!u.data.lemb}" aria-label="Lembretes de consulta"></button></div>
  <button class="btn ghost big" data-a="logout" style="margin-top:6px">Sair da conta</button>
  <button class="btn danger big" data-a="delacc" style="margin-top:10px">${S.del?'Toque de novo para excluir tudo':'Excluir minha conta'}</button>`;
}
function chat(){
  return `<div class="screen" id="cs"><button class="back" data-a="tab" data-v="home">${ic('back')}Voltar</button><h1>Chat demonstrativo</h1><p class="sub">Chat demonstrativo: não há equipe real conectada</p><div class="chat">${D().msgs.map(m=>`<div class="msg ${m.me?'me':'team'}">${esc(m.t)}</div>`).join('')}</div></div><form class="send" data-f="chat"><input name="t" id="inp" placeholder="Escreva sua mensagem" aria-label="Mensagem" autocomplete="off" maxlength="500"><button class="btn">Enviar</button></form>`;
}
function authView(){
  const c=S.auth=='cad';
  return `<div class="screen auth"><div class="logo" aria-hidden="true">🩺</div><h1>TrilhaSaúde</h1><p class="sub">Acompanhe seus exames e consultas em um só lugar</p>
  <form class="f" data-f="auth">${c?'<label>Nome<input name="name" required maxlength="60" autocomplete="name"></label>':''}<label>E-mail<input type="email" name="email" required autocomplete="email"></label><label>Senha<input type="password" name="password" required minlength="8" autocomplete="${c?'new-password':'current-password'}"></label>${S.err?`<p class="err" role="alert">${esc(S.err)}</p>`:''}<button class="btn big">${c?'Criar conta':'Entrar'}</button></form>
  <button class="link" data-a="mode">${c?'Já tenho conta. Entrar':'Ainda não tenho conta. Cadastrar'}</button></div>`;
}
const V={home,consultas,exames,jornada,notificacoes,perfil,registros};
const TABS=[['home','Início','home'],['consultas','Consultas','cal'],['exames','Exames','file'],['notificacoes','Notificações','bell'],['perfil','Perfil','user'],['registros','Registros','folder']];

function render(){
  const root=$('#app');
  if(!currentUser){root.innerHTML=authView();return}
  const cur=S.sub||S.tab,un=D().notes.filter(n=>!n.r).length;
  root.innerHTML=(cur=='chat'?chat():`<main class="screen" id="main-content">${V[cur]()}</main>`)+`<nav aria-label="Navegação principal"><div class="nav-brand"><span class="nav-brand-icon" aria-hidden="true">🩺</span><span><strong>TrilhaSaúde</strong><small>Área do paciente</small></span></div><div class="nav-items">${TABS.map(t=>`<button class="${S.tab==t[0]&&!S.sub?'on':''}" data-a="tab" data-v="${t[0]}" ${S.tab==t[0]&&!S.sub?'aria-current="page"':''}>${ic(t[2])}<span class="nav-label">${t[1]}</span>${t[0]=='notificacoes'&&un?`<span class="n">${un}</span>`:''}</button>`).join('')}</div></nav>`;
  const cs=$('#cs');if(cs){cs.scrollTop=cs.scrollHeight;$('#inp').focus()}
}

/* ---------- Ações enviadas para o MySQL pela API ---------- */
async function doAuth(v){
  S.err='';
  try {
    if(S.auth==='cad'){
      await api('/register','POST',{name:v.name.trim(),email:v.email.trim(),password:v.password});
    } else {
      await api('/login','POST',{email:v.email.trim(),password:v.password});
    }
    await load();
    S.tab='home';S.sub=null;
  } catch(error) {
    S.err=error.message;
  }
}

const ACT={
  tab:v=>{S.tab=v;S.sub=null;S.form=null;S.del=false},
  go:v=>{S.sub=v},
  mode:()=>{S.auth=S.auth==='cad'?'login':'cad';S.err=''},
  new:v=>{S.form=v},
  record:v=>{S.records=v;S.form=null},
  resultOf:(v,id)=>{S.tab='registros';S.sub=null;S.records='results';S.form='result';S.resultExam=id},
  delR:async(v,id)=>{await api(`/results/${id}`,'DELETE');return true},
  delRef:async(v,id)=>{await api(`/referrals/${id}`,'DELETE');return true},
  delDoc:async(v,id)=>{await api(`/documents/${id}`,'DELETE');return true},
  cancel:()=>{S.form=null},
  conf:async(v,id)=>{
    const a=D().appts.find(x=>String(x.id)===String(id));
    if(a){await api(`/appointments/${id}`,'PATCH',{ok:!a.ok});return true}
  },
  delA:async(v,id)=>{await api(`/appointments/${id}`,'DELETE');return true},
  delE:async(v,id)=>{await api(`/exams/${id}`,'DELETE');return true},
  next:async()=>{
    if(D().done<5){await api('/me/progress','PATCH',{done:D().done+1});return true}
  },
  undo:async()=>{
    if(D().done>1){await api('/me/progress','PATCH',{done:D().done-1});return true}
  },
  read:async(v,id)=>{await api(`/notifications/${id}/read`,'PATCH');return true},
  readall:async()=>{await api('/notifications/read-all','POST');return true},
  clearn:async()=>{await api('/notifications','DELETE');return true},
  lemb:async()=>{await api('/me/reminders','PATCH',{lemb:!D().lemb});return true},
  logout:async()=>{
    await api('/logout','POST');
    currentUser=null;S.tab='home';S.sub=null;S.form=null;S.auth='login';S.err='';
  },
  delacc:async()=>{
    if(!S.del){S.del=true;return}
    await api('/me','DELETE');
    currentUser=null;S.del=false;S.tab='home';S.auth='login';S.err='';
  }
};

$('#app').addEventListener('click',async e=>{
  const b=e.target.closest('[data-a]');if(!b)return;
  b.disabled=true;
  try {
    const reload=await ACT[b.dataset.a]?.(b.dataset.v,b.dataset.id);
    if(reload)await load();
    render();
  } catch(error) { report(error); b.disabled=false; }
});

$('#app').addEventListener('keydown',e=>{
  if((e.key==='Enter'||e.key===' ')&&e.target.matches('[role=button]')){
    e.preventDefault();e.target.click();
  }
});
$('#app').addEventListener('change',async e=>{
  const s=e.target.closest('[data-st],[data-ref-status]');if(!s)return;
  try {
    if(s.dataset.st)await api(`/exams/${s.dataset.st}`,'PATCH',{status:s.value});
    else await api(`/referrals/${s.dataset.refStatus}`,'PATCH',{status:s.value});
    await load();render();
  } catch(error) { report(error); }
});

$('#app').addEventListener('submit',async e=>{
  e.preventDefault();
  const f=e.target,k=f.dataset.f,v=Object.fromEntries(new FormData(f));
  const submit=f.querySelector('button:not([type="button"])');
  if(submit)submit.disabled=true;
  try {
    if(k==='auth')await doAuth(v);
    else if(k==='appt'){
      await api('/appointments','POST',{
        title:v.title.trim(),who:v.who.trim(),location:v.location.trim(),professionalId:v.professionalId||null,
        date:new Date(v.date).toISOString()
      });
      S.form=null;await load();
    }
    else if(k==='exam'){
      await api('/exams','POST',{name:v.name.trim(),date:v.date,status:v.status});
      S.form=null;await load();
    }
    else if(k==='perfil'){
      await api('/me/profile','PATCH',{name:v.name.trim(),phone:v.phone.trim(),birthDate:v.birthDate||null});
      await load();
    }
    else if(k==='professional'){
      await api('/professionals','POST',{name:v.name.trim(),specialty:v.specialty.trim(),registration:v.registration.trim()});
      S.form=null;await load();
    }
    else if(k==='referral'){
      await api('/referrals','POST',{destination:v.destination.trim(),reason:v.reason.trim(),professionalId:v.professionalId||null,date:v.date});
      S.form=null;await load();
    }
    else if(k==='result'){
      await api('/results','POST',{examId:v.examId,date:v.date,description:v.description.trim(),file:await readLocalFile(f.elements.file.files[0])});
      S.form=null;S.resultExam=null;await load();
    }
    else if(k==='document'){
      await api('/documents','POST',{name:v.name.trim(),file:await readLocalFile(f.elements.file.files[0])});
      S.form=null;await load();
    }
    else if(k==='chat'){
      const t=v.t.trim();if(!t)return;
      await api('/messages','POST',{text:t});
      await load();
    }
    render();
  } catch(error) {
    if(k==='auth'){S.err=error.message;render();}
    else {report(error);if(submit)submit.disabled=false;}
  }
});

(async()=>{
  $('#app').innerHTML='<div class="screen auth"><h1>TrilhaSaúde</h1><p class="sub">Conectando ao servidor...</p></div>';
  try {await load();render();}
  catch(error){$('#app').innerHTML=`<div class="screen auth"><h1>Erro de conexão</h1><p class="err">${esc(error.message)}</p><p class="sub">Inicie o projeto com npm start e verifique o MySQL.</p></div>`;}
})();

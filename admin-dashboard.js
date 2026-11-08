(() => {
 const URL='https://vxglqhgvtoxtcqydalpe.supabase.co';
 const KEY='sb_publishable_rbOQzEL4BSyEBjE8LzQbDQ_m-KN6Wiq';
 const ADMIN='buzilagheorghe111@gmail.com';
 const sb=window.supabase.createClient(URL,KEY);
 const $=id=>document.getElementById(id);
 let rows=[],filter='all';
 const labels={new:'Solicitare nouă',confirmed:'Confirmată',in_progress:'În lucru',waiting_parts:'Așteaptă piese',completed:'Finalizată',cancelled:'Anulată'};
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const note=(id,msg,cls='muted')=>{const e=$(id);e.textContent=msg;e.className=cls;};
 async function session(){const {data:{session}}=await sb.auth.getSession();await showSession(session);sb.auth.onAuthStateChange((_e,s)=>showSession(s));}
 async function showSession(s){
  const ok=!!s && (s.user.email||'').toLowerCase()===ADMIN;
  $('login-panel').hidden=ok;$('dashboard').hidden=!ok;$('logout').hidden=!ok;
  if(s&&!ok){await sb.auth.signOut();note('login-message','Acest cont nu are drepturi de administrator.','error');}
  if(ok)load();
 }
 $('login-form').addEventListener('submit',async e=>{e.preventDefault();const d=new FormData(e.currentTarget);const {error}=await sb.auth.signInWithPassword({email:d.get('email'),password:d.get('password')});note('login-message',error?error.message:'Autentificare reușită.',error?'error':'success');});
 $('reset-password').addEventListener('click',async()=>{const email=$('login-form').elements.email.value.trim();if(!email){note('login-message','Introdu adresa de e-mail.','error');return;}const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});note('login-message',error?error.message:'Dacă adresa există, vei primi un e-mail pentru resetarea parolei.',error?'error':'success');});
 $('logout').addEventListener('click',()=>sb.auth.signOut());
 $('refresh').addEventListener('click',load);
 $('filters').addEventListener('click',e=>{const b=e.target.closest('button[data-filter]');if(!b)return;filter=b.dataset.filter;document.querySelectorAll('#filters button').forEach(x=>x.classList.toggle('active',x===b));render();});
 async function load(){
  $('booking-list').innerHTML='<p class="empty">Se încarcă programările...</p>';
  const {data,error}=await sb.from('bookings').select('*').order('created_at',{ascending:false}).limit(300);
  if(error){$('booking-list').textContent='Nu pot încărca programările: '+error.message;return;}
  rows=data||[];counts();render();$('last-update').textContent='Actualizat: '+new Date().toLocaleTimeString('ro-RO');
 }
 function counts(){const c=s=>rows.filter(r=>r.status===s).length;$('count-new').textContent=c('new');$('count-confirmed').textContent=c('confirmed');$('count-progress').textContent=c('in_progress')+c('waiting_parts');$('count-completed').textContent=c('completed');}
 function render(){
  const list=$('booking-list'),shown=rows.filter(r=>filter==='all'||r.status===filter);
  if(!shown.length){list.innerHTML='<p class="empty">Nu există programări în această categorie.</p>';return;}
  list.innerHTML=shown.map(r=>{const date=r.preferred_date?new Date(r.preferred_date+'T12:00:00').toLocaleDateString('ro-RO'):'Data nespecificată';const status=labels[r.status]||r.status||'Necunoscută';return '<article class="booking"><div><h3>'+esc(r.car||r.masina||'Autovehicul nespecificat')+' · '+esc(r.name||r.nume||'Client')+'</h3><div class="muted">📅 '+esc(date)+' '+esc(r.preferred_time||r.ora||'')+' · 🔧 '+esc(r.service||r.serviciu||'')+'</div><div class="muted">☎ '+esc(r.phone||r.telefon||'')+' · '+esc(r.email||'')+'</div><div class="muted">Nr. auto: '+esc(r.registration_number||r.numar||'—')+' · Cod: '+esc(r.tracking_code||'—')+'</div><p class="muted">'+esc(r.description||r.descriere||'Fără descriere')+'</p><span class="status">'+esc(status)+'</span></div><div class="actions">'+actionButtons(r)+'</div></article>';}).join('');
  list.querySelectorAll('button[data-id]').forEach(b=>b.addEventListener('click',()=>change(b.dataset.id,b.dataset.status,b)));
 }
 function actionButtons(r){
  const opts=[['confirmed','Confirmă','green'],['in_progress','În lucru','amber'],['waiting_parts','Așteaptă piese','amber'],['completed','Finalizată','green'],['cancelled','Anulează','gray']];
  return opts.filter(o=>o[0]!==r.status).map(o=>'<button class="btn '+o[2]+'" data-id="'+esc(r.id)+'" data-status="'+o[0]+'">'+o[1]+'</button>').join('');
 }
 async function change(id,status,btn){
  if(!confirm('Schimbi starea programării în „'+labels[status]+'”?'))return;
  btn.disabled=true;
  const {error}=await sb.from('bookings').update({status,updated_at:new Date().toISOString()}).eq('id',id);
  if(error){note('dashboard-message','Eroare la salvare: '+error.message,'error');btn.disabled=false;return;}
  note('dashboard-message','Starea a fost actualizată.','success');await load();
 }
 session();
})();
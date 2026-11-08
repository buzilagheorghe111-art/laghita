(() => {
 const URL='https://vxglqhgvtoxtcqydalpe.supabase.co';
 const KEY='sb_publishable_rbOQzEL4BSyEBjE8LzQbDQ_m-KN6Wiq';
 const ADMIN='buzilagheorghe111@gmail.com';
 const sb=window.supabase.createClient(URL,KEY);
 const $=id=>document.getElementById(id);
 let rows=[],filter='all',recoveryMode=false;
 const labels={new:'Solicitare nouă',confirmed:'Confirmată',in_progress:'În lucru',waiting_parts:'Așteaptă piese',completed:'Finalizată',cancelled:'Anulată'};
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const note=(id,msg,cls='muted')=>{const e=$(id);if(e){e.textContent=msg;e.className=cls;}};
 function showRecovery(){recoveryMode=true;$('login-form').hidden=true;$('reset-password').hidden=true;$('new-password-form').hidden=false;note('login-message','Ai deschis linkul de recuperare. Alege o parolă nouă.','success');}
 async function session(){
  const {data:{session}}=await sb.auth.getSession();
  if(location.hash.includes('type=recovery')||location.hash.includes('access_token=')){showRecovery();}
  await showSession(session);
  sb.auth.onAuthStateChange((event,s)=>{
   if(event==='PASSWORD_RECOVERY')showRecovery();
   if(!recoveryMode)showSession(s);
  });
 }
 async function showSession(s){
  const ok=!!s&&(s.user.email||'').toLowerCase()===ADMIN;
  $('login-panel').hidden=ok||recoveryMode;$('dashboard').hidden=!ok;$('logout').hidden=!ok;
  if(s&&!ok&&!recoveryMode){await sb.auth.signOut();note('login-message','Acest cont nu are drepturi de administrator.','error');}
  if(ok&&!recoveryMode)load();
 }
 $('login-form').addEventListener('submit',async e=>{e.preventDefault();const d=new FormData(e.currentTarget);const {error}=await sb.auth.signInWithPassword({email:d.get('email'),password:d.get('password')});note('login-message',error?error.message:'Autentificare reușită.',error?'error':'success');});
 $('reset-password').addEventListener('click',async()=>{const email=$('login-form').elements.email.value.trim();if(!email){note('login-message','Introdu adresa de e-mail.','error');return;}const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});note('login-message',error?('Eroare: '+error.message):'Linkul de setare a parolei a fost solicitat. Verifică Inbox și Spam.',error?'error':'success');});
 $('new-password-form').addEventListener('submit',async e=>{e.preventDefault();const d=new FormData(e.currentTarget),p=d.get('password');if(p!==d.get('confirm')){note('password-message','Parolele nu coincid.','error');return;}if(p.length<8){note('password-message','Parola trebuie să aibă minimum 8 caractere.','error');return;}const {error}=await sb.auth.updateUser({password:p});if(error){note('password-message','Nu am putut salva parola: '+error.message,'error');return;}recoveryMode=false;history.replaceState(null,'',location.pathname);e.currentTarget.reset();$('new-password-form').hidden=true;$('login-form').hidden=false;$('reset-password').hidden=false;note('login-message','Parola a fost setată. Acum te poți autentifica.','success');await sb.auth.signOut();});
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
  list.querySelectorAll('button[data-id][data-status]').forEach(b=>b.addEventListener('click',()=>change(b.dataset.id,b.dataset.status,b)));
  list.querySelectorAll('button[data-delete-id]').forEach(b=>b.addEventListener('click',()=>deleteCompleted(b.dataset.deleteId,b)));
 }
 function actionButtons(r){const opts=[['confirmed','Confirmă','green'],['in_progress','În lucru','amber'],['waiting_parts','Așteaptă piese','amber'],['completed','Finalizată','green'],['cancelled','Anulează','gray']];const statusActions=opts.filter(o=>o[0]!==r.status).map(o=>'<button class="btn '+o[2]+'" data-id="'+esc(r.id)+'" data-status="'+o[0]+'">'+o[1]+'</button>').join('');const deleteAction=r.status==='completed'?'<button class="btn danger" data-delete-id="'+esc(r.id)+'">Șterge programarea</button>':'';return statusActions+deleteAction;}
 async function deleteCompleted(id,btn){
  const booking=rows.find(r=>String(r.id)===String(id));
  if(!booking||booking.status!=='completed'){note('dashboard-message','Poți șterge doar programări finalizate.','error');return;}
  if(!confirm('Ștergi definitiv această programare finalizată? Datele și istoricul ei, inclusiv codul de urmărire, nu vor mai fi disponibile. Acțiunea nu poate fi anulată.'))return;
  btn.disabled=true;
  const {error}=await sb.from('bookings').delete().eq('id',id).eq('status','completed');
  if(error){note('dashboard-message','Nu am putut șterge programarea: '+error.message,'error');btn.disabled=false;return;}
  note('dashboard-message','Programarea finalizată a fost ștearsă.','success');
  await load();
 }
 async function change(id,status,btn){if(!confirm('Schimbi starea programării în „'+labels[status]+'”?'))return;btn.disabled=true;const {error}=await sb.from('bookings').update({status,updated_at:new Date().toISOString()}).eq('id',id);if(error){note('dashboard-message','Eroare la salvare: '+error.message,'error');btn.disabled=false;return;}note('dashboard-message','Starea a fost actualizată. Se trimite notificarea către client...','success');
  const {data:mailData,error:mailError}=await sb.functions.invoke('send-status-email',{body:{booking_id:id,status}});
  if(mailError||!mailData?.success){
   const detail=mailData?.error||mailError?.message||'Eroare necunoscută';
   note('dashboard-message','Starea a fost salvată, dar e-mailul NU a putut fi trimis: '+detail,'error');
  }else{
   note('dashboard-message','Starea a fost actualizată și e-mailul a fost trimis clientului.','success');
  }
  await load();}
 session();
})();
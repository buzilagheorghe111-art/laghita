// Funcții suplimentare Service Auto La Ghiță
(() => {
 const select=document.getElementById('estimate-service'), result=document.getElementById('estimate-result');
 const whatsapp=document.getElementById('estimate-whatsapp');
 if(select&&result) select.addEventListener('change',()=>{
  if(!select.value){
   result.textContent='Alege un serviciu pentru a vedea intervalul orientativ.';
   if(whatsapp) whatsapp.href='https://wa.me/40741826476?text='+encodeURIComponent('Bună ziua! Doresc o estimare de preț.');
   return;
  }
  const [min,max]=select.value.split('-');
  const service=select.options[select.selectedIndex].text;
  result.textContent='Manoperă estimativă pentru '+service.toLocaleLowerCase('ro-RO')+': '+min+'–'+max+' lei. Piesele și lucrările suplimentare se calculează separat.';
  if(whatsapp) whatsapp.href='https://wa.me/40741826476?text='+encodeURIComponent('Bună ziua! Doresc o estimare pentru: '+service+'. Am văzut tariful orientativ de '+min+'–'+max+' lei pentru manoperă. Vă rog să-mi confirmați costul final.');
 });
 const date=document.querySelector('#booking-form input[name="data"]');
 if(date){const d=new Date();date.min=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
 const form=document.getElementById('booking-form');
 if(form) form.addEventListener('submit',()=>{const t=form.querySelector('[name="ora"]'),d=form.querySelector('[name="descriere"]');if(t&&t.value&&d&&!d.value.includes('Ora preferată:'))d.value=(d.value.trim()?d.value.trim()+'\n':'')+'Ora preferată: '+t.value;},{capture:true});
})();

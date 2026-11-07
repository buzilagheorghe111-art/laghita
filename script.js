const toggle=document.querySelector('.menu-toggle');const nav=document.querySelector('.nav');if(toggle&&nav){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');}));}document.getElementById('year').textContent=new Date().getFullYear();

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("booking-form");

  if (!form) return;

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const data = new FormData(form);

    const mesaj = `Bună! Doresc o programare la Service Auto La Ghiță.

Nume: ${data.get("nume")}
Telefon: ${data.get("telefon")}
Mașină: ${data.get("masina")}
Număr înmatriculare: ${data.get("numar") || "Nespecificat"}
Serviciu: ${data.get("serviciu")}
Data preferată: ${data.get("data")}
Descriere: ${data.get("descriere") || "Nespecificată"}`;

    const link = "https://wa.me/40741826476?text=" + encodeURIComponent(mesaj);

    window.open(link, "_blank");
  });
});

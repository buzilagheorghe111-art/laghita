
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');

if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  emailjs.init({
    publicKey: '-F-0IFD4YiOHej38_'
  });

  const form = document.getElementById('booking-form');

  if (!form) return;

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Se trimite...';

    const data = new FormData(form);

   const templateParams = {
  name: data.get('nume'),
  nume: data.get('nume'),
  telefon: data.get('telefon'),
  masina: data.get('masina'),
  numar: data.get('numar') || 'Nespecificat',
  serviciu: data.get('serviciu'),
  data: data.get('data'),
  descriere: data.get('descriere') || 'Nespecificata'
};

    try {
      await emailjs.send(
        'service_jl8199c',
        'template_7inrcsp',
        templateParams
      );

      alert('Solicitarea a fost trimisă cu succes! Vă vom contacta în curând.');
      form.reset();
    } catch (error) {
      console.error('Eroare EmailJS:', error);
      alert('Trimiterea a eșuat. Vă rugăm să încercați din nou sau să ne contactați telefonic.');
    } finally {
      button.disabled = false;
      button.textContent = 'Trimite solicitarea pe e-mail';
    }
  });
});

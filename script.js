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
  const form = document.getElementById('booking-form');
  if (!form) return;

  const button = form.querySelector('button[type="submit"]');
  const status = document.getElementById('booking-status');

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    if (!form.reportValidity()) return;

    button.disabled = true;
    const originalButtonText = button.textContent;
    button.textContent = 'Se trimite...';
    if (status) {
      status.textContent = 'Solicitarea se trimite. Te rugăm să aștepți.';
      status.dataset.state = 'loading';
    }

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });

      const responseText = await response.text();
      if (!response.ok) {
        throw new Error(responseText || ('Eroare HTTP ' + response.status));
      }

      form.reset();
      if (status) {
        status.textContent = 'Solicitarea a fost trimisă cu succes! Te vom contacta în curând.';
        status.dataset.state = 'success';
      } else {
        alert('Solicitarea a fost trimisă cu succes! Te vom contacta în curând.');
      }
    } catch (error) {
      console.error('Eroare la trimiterea programării:', error);
      if (status) {
        status.textContent = 'Nu am putut trimite solicitarea. Te rugăm să încerci din nou sau să ne suni la 0741 826 476.';
        status.dataset.state = 'error';
      } else {
        alert('Trimiterea a eșuat. Te rugăm să încerci din nou sau să ne suni la 0741 826 476.');
      }
    } finally {
      button.disabled = false;
      button.textContent = originalButtonText;
    }
  });
});

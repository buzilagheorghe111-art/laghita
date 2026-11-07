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

// Supabase project configuration.
// The publishable key is intended for browser use; table access is controlled by RLS.
const SUPABASE_URL = 'https://vxglqhgvtoxtcqydalpe.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_rbOQzEL4BSyEBjE8LzQbDQ_m-KN6Wiq';

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('booking-form');
  if (!form) return;

  const button = form.querySelector('button[type="submit"]');
  const status = document.getElementById('booking-status');

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    // Ignore honeypot submissions without sending them to either service.
    if (String(formData.get('honeypot') || '').trim()) return;

    button.disabled = true;
    const originalButtonText = button.textContent;
    button.textContent = 'Se trimite...';
    if (status) {
      status.textContent = 'Solicitarea se trimite. Te rugăm să aștepți.';
      status.dataset.state = 'loading';
    }

    const booking = {
      name: String(formData.get('nume') || '').trim(),
      phone: String(formData.get('telefon') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      car: String(formData.get('masina') || '').trim(),
      registration_number: String(formData.get('numar') || '').trim() || null,
      service: String(formData.get('serviciu') || '').trim(),
      preferred_date: String(formData.get('data') || ''),
      description: String(formData.get('descriere') || '').trim() || null,
      status: 'new'
    };

    let emailSent = false;

    try {
      // 1) Trimite mai întâi e-mailul prin Static Forms.
      const emailResponse = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });
      const emailText = await emailResponse.text();
      let emailResult = null;
      try {
        emailResult = emailText ? JSON.parse(emailText) : null;
      } catch (_) {
        emailResult = null;
      }

      if (!emailResponse.ok || !emailResult || emailResult.success !== true) {
        const details = (emailResult && (emailResult.error || emailResult.message)) || emailText || ('HTTP ' + emailResponse.status);
        console.error('Static Forms error:', emailResponse.status, details);
        throw new Error('Static Forms: ' + details + ' (HTTP ' + emailResponse.status + ')');
      }
      emailSent = true;

      // 2) Salvează programarea în Supabase.
      // Pentru cheia publishable se trimite apikey; nu o folosim ca JWT Bearer.
      const databaseResponse = await fetch(SUPABASE_URL + '/rest/v1/bookings', {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_PUBLISHABLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(booking)
      });
      const databaseText = await databaseResponse.text();

      if (!databaseResponse.ok) {
        console.error('Supabase error:', databaseResponse.status, databaseText);
        form.reset();
        if (status) {
          status.textContent = 'E-mailul a fost trimis cu succes, dar programarea nu a putut fi salvată în panoul de administrare. Te rugăm să ne contactezi telefonic la 0741 826 476. Nu retrimite formularul.';
          status.dataset.state = 'warning';
        } else {
          alert('E-mailul a fost trimis, dar salvarea în panoul de administrare a eșuat. Te rugăm să ne suni la 0741 826 476. Nu retrimite formularul.');
        }
        return;
      }

      form.reset();
      if (status) {
        status.textContent = 'Solicitarea a fost trimisă și înregistrată cu succes! Te vom contacta în curând.';
        status.dataset.state = 'success';
      } else {
        alert('Solicitarea a fost trimisă și înregistrată cu succes! Te vom contacta în curând.');
      }
    } catch (error) {
      console.error('Eroare la trimiterea programării:', error);
      if (emailSent) {
        form.reset();
        if (status) {
          status.textContent = 'E-mailul a fost trimis, dar a apărut o problemă la salvarea programării. Te rugăm să ne contactezi la 0741 826 476. Nu retrimite formularul.';
          status.dataset.state = 'warning';
        } else {
          alert('E-mailul a fost trimis, dar salvarea programării a eșuat. Te rugăm să ne suni la 0741 826 476. Nu retrimite formularul.');
        }
      } else if (status) {
        status.textContent = 'Static Forms a refuzat solicitarea: ' + String(error.message || error) + '. Te rugăm să ne contactezi la 0741 826 476.';
        status.dataset.state = 'error';
      } else {
        alert('Static Forms a refuzat solicitarea: ' + String(error.message || error) + '. Te rugăm să ne suni la 0741 826 476.');
      }
    } finally {
      button.disabled = false;
      button.textContent = originalButtonText;
    }
  });
});

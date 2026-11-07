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

    try {
      // Keep the existing Static Forms email delivery and also save the booking in Supabase.
      const [emailResponse, databaseResponse] = await Promise.all([
        fetch(form.action, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        }),
        fetch(SUPABASE_URL + '/rest/v1/bookings', {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_PUBLISHABLE_KEY,
            'Authorization': 'Bearer ' + SUPABASE_PUBLISHABLE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(booking)
        })
      ]);

      const [emailText, databaseText] = await Promise.all([
        emailResponse.text(),
        databaseResponse.text()
      ]);

      if (!emailResponse.ok || !databaseResponse.ok) {
        console.error('Booking delivery details:', {
          emailStatus: emailResponse.status,
          emailResponse: emailText,
          databaseStatus: databaseResponse.status,
          databaseResponse: databaseText
        });
        throw new Error('Email status: ' + emailResponse.status +
          '; database status: ' + databaseResponse.status);
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
      if (status) {
        status.textContent = 'Solicitarea nu a putut fi confirmată în toate sistemele. Te rugăm să ne suni la 0741 826 476 înainte de a retrimite.';
        status.dataset.state = 'error';
      } else {
        alert('Solicitarea nu a putut fi confirmată în toate sistemele. Te rugăm să ne suni la 0741 826 476.');
      }
    } finally {
      button.disabled = false;
      button.textContent = originalButtonText;
    }
  });
});

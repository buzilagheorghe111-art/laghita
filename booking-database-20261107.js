// Service Auto La Ghita: save booking to Supabase, then submit the original
// HTML form normally to Static Forms. Email delivery remains independent.
(() => {
  const SUPABASE_URL = 'https://vxglqhgvtoxtcqydalpe.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_rbOQzEL4BSyEBjE8LzQbDQ_m-KN6Wiq';

  const form = document.getElementById('booking-form');
  if (!form) return;

  let isSubmitting = false;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    isSubmitting = true;

    const button = form.querySelector('button[type="submit"]');
    const status = document.getElementById('booking-status');
    const originalButtonText = button ? button.textContent : '';

    if (button) {
      button.disabled = true;
      button.textContent = 'Se trimite...';
    }
    if (status) {
      status.textContent = 'Se înregistrează solicitarea...';
      status.dataset.state = 'pending';
    }

    const data = new FormData(form);
    const booking = {
      name: String(data.get('nume') || '').trim(),
      phone: String(data.get('telefon') || '').trim(),
      email: String(data.get('email') || '').trim(),
      car: String(data.get('masina') || '').trim(),
      registration_number: String(data.get('numar') || '').trim() || null,
      service: String(data.get('serviciu') || '').trim(),
      preferred_date: String(data.get('data') || ''),\n      preferred_time: String(data.get('ora') || '') || null,
      description: String(data.get('descriere') || '').trim() || null,
      status: 'new'
    };

    try {
      const response = await fetch(SUPABASE_URL + '/rest/v1/bookings', {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_PUBLISHABLE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_PUBLISHABLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(booking)
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error('Supabase HTTP ' + response.status + ': ' + detail);
      }
      console.info('Programarea a fost salvată în Supabase.');
      if (status) {
        status.textContent = 'Programarea a fost înregistrată. Se trimite e-mailul...';
        status.dataset.state = 'success';
      }
    } catch (error) {
      // Do not block or replace the known-good Static Forms email submission.
      console.error('Salvarea programării în Supabase a eșuat; e-mailul va fi trimis în continuare:', error);
      if (status) {
        status.textContent = 'Se trimite solicitarea prin e-mail...';
        status.dataset.state = 'pending';
      }
    }

    // Native submission is intentional: Static Forms previously failed with
    // browser fetch/CORS errors, while the normal HTML POST successfully sent email.
    HTMLFormElement.prototype.submit.call(form);
  });
})();

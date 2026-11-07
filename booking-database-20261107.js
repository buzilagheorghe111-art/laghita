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
    if (button) { button.disabled = true; button.textContent = 'Se trimite...'; }
    if (status) { status.textContent = 'Se înregistrează solicitarea...'; status.dataset.state = 'pending'; }

    const data = new FormData(form);
    const booking = {
      name: String(data.get('nume') || '').trim(),
      phone: String(data.get('telefon') || '').trim(),
      email: String(data.get('email') || '').trim(),
      car: String(data.get('masina') || '').trim(),
      registration_number: String(data.get('numar') || '').trim() || null,
      service: String(data.get('serviciu') || '').trim(),
      preferred_date: String(data.get('data') || ''),
      preferred_time: String(data.get('ora') || '') || null,
      description: String(data.get('descriere') || '').trim() || null,
      status: 'new'
    };

    try {
      const sendBooking = async (payload) => fetch(SUPABASE_URL + '/rest/v1/bookings', {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_PUBLISHABLE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_PUBLISHABLE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });

      let response = await sendBooking(booking);
      if (!response.ok) {
        const detail = await response.text();
        if (booking.preferred_time && (detail.includes('preferred_time') || detail.includes('PGRST204'))) {
          const legacyBooking = { ...booking };
          delete legacyBooking.preferred_time;
          response = await sendBooking(legacyBooking);
          if (!response.ok) throw new Error('Supabase HTTP ' + response.status + ': ' + await response.text());
        } else {
          throw new Error('Supabase HTTP ' + response.status + ': ' + detail);
        }
      }

      const savedRows = await response.json();
      const trackingCode = savedRows && savedRows[0] && savedRows[0].tracking_code;
      if (trackingCode) {
        let codeField = form.querySelector('input[name="cod_urmarire"]');
        if (!codeField) {
          codeField = document.createElement('input');
          codeField.type = 'hidden';
          codeField.name = 'cod_urmarire';
          form.appendChild(codeField);
        }
        codeField.value = trackingCode;
        if (status) {
          status.textContent = 'Programarea a fost înregistrată. Cod de urmărire: ' + trackingCode + '. Se trimite e-mailul...';
          status.dataset.state = 'success';
        }
      } else if (status) {
        status.textContent = 'Programarea a fost înregistrată. Se trimite e-mailul...';
        status.dataset.state = 'success';
      }
      console.info('Programarea a fost salvată în Supabase.');
    } catch (error) {
      console.error('Salvarea programării în Supabase a eșuat; e-mailul va fi trimis în continuare:', error);
      if (status) { status.textContent = 'Se trimite solicitarea prin e-mail...'; status.dataset.state = 'pending'; }
    }

    // Keep the known-good native Static Forms POST for email delivery.
    HTMLFormElement.prototype.submit.call(form);
  });
})();

'use strict';
function initBookingForm() {
  const form = document.getElementById('bookingForm');
  const successMsg = document.getElementById('successMsg');
  const submitBtn = form?.querySelector('.submit-btn');
  if (!form || !successMsg || !submitBtn) return;
  const dateInput = document.getElementById('pdate');
  if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];
  form.querySelectorAll('input[required], select[required]').forEach(el => {
    el.addEventListener('invalid', () => el.closest('.field')?.classList.add('invalid'));
    el.addEventListener('input', () => el.closest('.field')?.classList.remove('invalid'));
    el.addEventListener('change', () => el.closest('.field')?.classList.remove('invalid'));
  });
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const originalLabel = submitBtn.textContent;
    submitBtn.textContent = 'Sending\u2026';
    submitBtn.disabled = true;
    try {
      const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form), });
      const result = await res.json();
      if (result.success) { form.style.display = 'none'; successMsg.style.display = 'block'; }
      else { throw new Error(result.message || 'Submission failed'); }
    } catch (err) {
      console.error('[form]', err);
      submitBtn.textContent = originalLabel;
      submitBtn.disabled = false;
      const email = document.querySelector('input[name="to_email"]')?.value || 'the clinic';
      alert(`Something went wrong. Please try again, or reach us directly at ${email}.`);
    }
  });
}
document.addEventListener('DOMContentLoaded', initBookingForm);

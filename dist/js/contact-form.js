/**
 * contact-form.js — envia o formulário de contato via Web3Forms (fetch),
 * sem sair da página, com feedback de sucesso/erro traduzido via i18n.
 *
 * Progressive enhancement: o <form action="https://api.web3forms.com/submit">
 * já funciona nativamente mesmo se este script falhar (POST comum, sem JS) —
 * este módulo só melhora a experiência interceptando o submit.
 */

import { getTranslation } from './i18n.js';

const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

function setNoteState(note, message, state) {
  note.textContent = message;
  note.classList.remove(
    'contact-form__note--pending',
    'contact-form__note--success',
    'contact-form__note--error'
  );
  if (state) note.classList.add(`contact-form__note--${state}`);
}

function initContactForm() {
  const form = document.querySelector('#contact-form');
  const note = document.querySelector('#contact-form-note');
  const submitBtn = form?.querySelector('button[type="submit"]');
  if (!form || !note || !submitBtn) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // honeypot: se um bot preencher esse campo escondido, finge sucesso e não envia nada
    const honeypot = form.querySelector('input[name="botcheck"]');
    if (honeypot?.checked) return;

    submitBtn.disabled = true;
    setNoteState(note, getTranslation('contact.form.sendingMessage'), 'pending');

    try {
      const res = await fetch(WEB3FORMS_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      const data = await res.json();

      if (data.success) {
        setNoteState(note, getTranslation('contact.form.successMessage'), 'success');
        form.reset();
      } else {
        throw new Error(data.message || 'Web3Forms retornou success: false');
      }
    } catch (err) {
      console.error('[contact-form] erro ao enviar:', err);
      setNoteState(note, getTranslation('contact.form.errorMessage'), 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });
}

export { initContactForm };

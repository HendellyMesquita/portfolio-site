/**
 * contact-form.js — intercepta o submit do formulário de contato.
 *
 * O form ainda não está conectado a nenhum serviço de envio (ver README /
 * conversa sobre Web3Forms/Formspree/Netlify Forms). Sem isso, um <form
 * action="#"> simplesmente recarregaria a página sem enviar nada — uma
 * experiência quebrada e silenciosa. Este módulo intercepta o submit e
 * avisa a pessoa claramente, em vez disso.
 *
 * Quando o serviço real for escolhido, a função `handleSubmit` abaixo é o
 * único lugar que precisa mudar (troca o preventDefault + aviso por um
 * fetch() real para o endpoint do serviço).
 */

import { getTranslation } from './i18n.js';

function initContactForm() {
  const form = document.querySelector('#contact-form');
  const note = document.querySelector('#contact-form-note');
  if (!form || !note) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const pendingMessage = getTranslation('contact.form.pendingNotice');
    if (pendingMessage) note.textContent = pendingMessage;
    note.classList.add('contact-form__note--pending');
  });

  // Ao editar o formulário de novo, volta o aviso ao texto original (menos alarmante)
  form.addEventListener(
    'input',
    () => {
      note.classList.remove('contact-form__note--pending');
      const defaultMessage = getTranslation('contact.form.note');
      if (defaultMessage) note.textContent = defaultMessage;
    },
    { once: true }
  );
}

export { initContactForm };

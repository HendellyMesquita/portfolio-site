/**
 * terminal.js — simula digitação no terminal do hero.
 * Roda de novo sempre que o idioma muda (o texto vem do i18n).
 * Respeita prefers-reduced-motion: no-preference; caso contrário, exibe o texto direto.
 */

const TYPE_SPEED_MS = 28;

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

async function typeLine(el, text) {
  el.textContent = '';
  if (prefersReducedMotion()) {
    el.textContent = text;
    return;
  }
  for (const char of text) {
    el.textContent += char;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, TYPE_SPEED_MS));
  }
}

let running = false;

async function runTerminalSequence() {
  if (running) return;
  running = true;

  const outputEl = document.querySelector('[data-terminal-output]');
  if (!outputEl) {
    running = false;
    return;
  }

  const text = outputEl.getAttribute('data-terminal-text') || outputEl.textContent;
  await typeLine(outputEl, text);

  running = false;
}

/** Chamar após aplicar traduções: guarda o texto-alvo e reinicia a animação */
function primeTerminal() {
  const outputEl = document.querySelector('[data-terminal-output]');
  if (!outputEl) return;
  outputEl.setAttribute('data-terminal-text', outputEl.textContent);
  runTerminalSequence();
}

export { primeTerminal };

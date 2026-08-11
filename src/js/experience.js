/**
 * experience.js — calcula "anos de experiência" a partir de uma data de início,
 * sempre em relação à data atual. Não depende de i18n (é só um número).
 *
 * Uso no HTML:
 *   <strong data-exp-start="2021-11-01"></strong>
 */

function calculateFullYears(startDateStr) {
  const start = new Date(startDateStr);
  const now = new Date();

  let years = now.getFullYear() - start.getFullYear();
  const monthDiff = now.getMonth() - start.getMonth();
  const dayDiff = now.getDate() - start.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    years -= 1;
  }
  return Math.max(years, 0);
}

function updateExperienceStats() {
  document.querySelectorAll('[data-exp-start]').forEach((el) => {
    const startDate = el.getAttribute('data-exp-start');
    const years = calculateFullYears(startDate);
    el.textContent = `${years}+`;
  });
}

export { updateExperienceStats };

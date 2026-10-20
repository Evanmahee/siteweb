import { fetchAvisData } from './avis-data.js';
import onlinePhoto from '../assets/nefelie-online.png';
import roomPhoto from '../assets/coaching-presentiel.png';
import completePhoto from '../assets/nefelie-editorial.png';
import programPhoto from '../assets/nefelie-method.png';
import './contact-wizard.js';
import { sendContactEmail } from './contact-email.js';

const servicePhotos = [onlinePhoto, roomPhoto, completePhoto, programPhoto, roomPhoto];

document.querySelectorAll('[data-year]').forEach(el => {
  el.textContent = new Date().getFullYear();
});

(function initFixedHeader() {
  const header = document.querySelector('.header');
  const hero = document.querySelector('.hero');
  if (!header) return;

  let lastY = window.scrollY;

  function sync() {
    const y = window.scrollY;
    const heroBottom = hero ? hero.offsetTop + hero.offsetHeight : 120;
    const overLight = y > Math.max(24, heroBottom - 80);

    header.classList.toggle('is-scrolled', overLight);

    if (y <= 0) {
      header.classList.remove('is-compact');
    } else if (y < lastY) {
      header.classList.remove('is-compact');
    } else if (y > lastY) {
      header.classList.add('is-compact');
    }

    lastY = y;
  }

  sync();
  window.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync, { passive: true });
})();

// Native details remain fully usable without JavaScript.
const offers = [...document.querySelectorAll('.studio-offer')];
const photo = document.getElementById('service-photo');
function updateService(offer) {
  const title = offer.querySelector('.studio-offer-name').childNodes[0].textContent.trim();
  photo.src = servicePhotos[Number(offer.dataset.index) - 1];
  photo.alt = `${title} avec Néfélie`;
  document.getElementById('service-widget-title').textContent = title;
  document.getElementById('service-widget-price').textContent = offer.querySelector('.studio-offer-price').textContent;
  document.querySelectorAll('.studio-photo-progress i').forEach((item, index) => {
    item.classList.toggle('is-active', index + 1 === Number(offer.dataset.index));
  });
}
for (const offer of offers) {
  offer.addEventListener('toggle', () => {
    if (!offer.open) return;
    for (const other of offers) if (other !== offer) other.open = false;
    updateService(offer);
  });
}

let STUDIO_REVIEWS = [
  {
    name: 'Steph Lecourt',
    text: 'Une coach exceptionnelle ! En très peu de temps, elle m’a permis de progresser et d’atteindre des performances que je n’aurais jamais imaginées pour mon âge.',
  },
  {
    name: 'Steven Piquet',
    text: 'Je recommande à 100 % Nefelie comme coach : elle a su me faire dépasser mes limites et a toujours été de bon conseil. C’est pourquoi je renouvelle pour une année de suivi.',
  },
  {
    name: 'Faustine Chesneau',
    text: 'Néfélie m’a coachée sur plusieurs semaines et elle m’a apporté beaucoup en termes de technicité. Elle est très à l’écoute, arrangeante et fait preuve d’une grande pédagogie.',
  },
  {
    name: 'Marion Brochard',
    text: 'Je ne peux que recommander d’être accompagné·e par Néfélie ! Elle a été ma première coach sportive et je ne le regrette absolument pas.',
  },
  {
    name: 'Chistelle Becel',
    text: 'Je ne peux que recommander Néfélie comme coach ! Passionnée, souriante et très professionnelle, elle a su répondre à mes attentes. Etant une femme de 55 ans avec beaucoup de douleurs, elle a su s’adapter et me soulager grâce à des exercices précis ! Elle est de très bon conseil, vous pouvez y aller les yeux fermés.',
  },
  {
    name: 'Julia Chassing',
    text: 'J’ai adoré être accompagnée par Nefelie. Elle est à l’écoute, compréhensible. Elle a beaucoup de maîtrise et est très claire dans les explications. Je la conseille sans aucun doute ☺️',
  },
  {
    name: 'Jérémie c.',
    text: 'Je suis en suivi distanciel avec Néfélie depuis le Canada. Néfélie sait s’adapter et optimiser son coaching en fonction des besoins, des capacités et des problématiques. Passionnée et très investie, je vous recommande chaudement de la contacter !',
  },
  {
    name: 'Davy Ricaud',
    text: 'Néfélie est très à l’écoute, sait de quoi elle parle et est toujours souriante. Un grand merci à elle de m’avoir accompagné durant 3 mois.',
  },
  {
    name: 'Elif Tfkci',
    text: 'Je recommande vivement Néfélie ! Bienveillante et toujours à l’écoute, elle prend vraiment le temps d’expliquer chaque exercice et de montrer les mouvements pour que je progresse en toute sécurité. Grâce à son accompagnement motivant et professionnel, je me sens plus en confiance et j’avance à mon rythme. Une coach passionnée et investie comme on en trouve rarement ! 💪',
  },
  {
    name: 'Redha Boulfoul',
    text: 'J’ai la chance d’être accompagnée à distance par Nefelie, alors que je vis à Abu Dhabi, et c’est de loin l’un des meilleurs investissements que j’ai faits pour mon bien être. Grâce à son suivi sérieux et personnalisé, j’ai pu adopter un nouveau régime alimentaire sain, sans aucune sensation de privation, et j’ai réussi à perdre près de 8 kg en seulement trois mois. Dès le début, elle m’a donné des exercices adaptés à ma salle de sport, et nous entamons maintenant la phase de construction musculaire avec un programme sur mesure pour moi. Néfélie est très professionnelle : bilan hebdomadaire, toujours disponible pour répondre à mes questions, et elle prend même le temps de corriger ma technique à distance grâce aux vidéos que je lui transmets. Cet accompagnement a vraiment changé ma manière de m’alimenter et de m’entraîner. Je recommande Néfélie sans hésitation !',
  },
];

function initStudioReviewsRelay() {
  const root = document.querySelector('[data-studio-reviews-relay]');
  const slots = root?.querySelector('[data-reviews-slots]');
  const nextBtn = root?.querySelector('[data-reviews-next]');
  if (!root || !slots || !STUDIO_REVIEWS.length) return;

  const reduceMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let visibleCount = 3;
  let visibleIds = [];
  let cursor = 0;
  let replaceAt = 0;
  let timerId = null;
  let hoverPaused = false;
  let busy = false;
  let uid = 0;
  let generation = 0;

  function hasExpanded() {
    return slots.querySelectorAll('.studio-review--expanded').length > 0;
  }

  function isPaused() {
    return hoverPaused || root.contains(document.activeElement) || hasExpanded();
  }

  function slotCount() {
    const w = window.innerWidth;
    if (w <= 650) return 1;
    if (w <= 1000) return 2;
    return 3;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function createCard(review, reviewIndex) {
    const id = `studio-review-text-${++uid}`;
    const article = document.createElement('article');
    article.className = 'studio-review';
    article.dataset.reviewIndex = String(reviewIndex);
    article.innerHTML =
      '<span class="studio-quote-mark" aria-hidden="true">“</span>' +
      `<blockquote class="studio-review-text" id="${id}">${escapeHtml(review.text)}</blockquote>` +
      `<button type="button" class="studio-review-toggle" hidden aria-expanded="false" aria-controls="${id}">Voir plus</button>` +
      `<p class="studio-review-author">${escapeHtml(review.name)}<span>Avis Google</span></p>`;
    return article;
  }

  function measureToggle(card) {
    const text = card.querySelector('.studio-review-text');
    const btn = card.querySelector('.studio-review-toggle');
    if (!text || !btn) return;

    const wasExpanded = card.classList.contains('studio-review--expanded');
    card.classList.remove('studio-review--clamp', 'studio-review--expanded');
    btn.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = 'Voir plus';

    card.classList.add('studio-review--clamp');
    const overflow = text.scrollHeight - text.clientHeight > 2;
    if (overflow) {
      btn.hidden = false;
      if (wasExpanded) {
        card.classList.add('studio-review--expanded');
        btn.setAttribute('aria-expanded', 'true');
        btn.textContent = 'Cacher';
      }
    } else {
      card.classList.remove('studio-review--clamp');
    }
  }

  function measureAll() {
    slots.querySelectorAll('.studio-review').forEach(measureToggle);
  }

  function nextUnusedIndex() {
    for (let step = 0; step < STUDIO_REVIEWS.length; step += 1) {
      const idx = (cursor + step) % STUDIO_REVIEWS.length;
      if (!visibleIds.includes(idx)) {
        cursor = (idx + 1) % STUDIO_REVIEWS.length;
        return idx;
      }
    }
    const idx = cursor % STUDIO_REVIEWS.length;
    cursor = (idx + 1) % STUDIO_REVIEWS.length;
    return idx;
  }

  function paintInitial() {
    generation += 1;
    visibleCount = slotCount();
    slots.innerHTML = '';
    visibleIds = [];
    for (let i = 0; i < visibleCount; i += 1) {
      const idx = i % STUDIO_REVIEWS.length;
      visibleIds.push(idx);
      slots.appendChild(createCard(STUDIO_REVIEWS[idx], idx));
    }
    cursor = visibleCount % STUDIO_REVIEWS.length;
    replaceAt = 0;
    requestAnimationFrame(measureAll);
  }

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  async function relayOne() {
    if (busy || STUDIO_REVIEWS.length <= visibleCount) return;
    busy = true;
    const runGeneration = generation;

    const cards = [...slots.querySelectorAll('.studio-review')];
    const slotIndex = replaceAt % cards.length;
    const card = cards[slotIndex];
    const nextIndex = nextUnusedIndex();
    const nextReview = STUDIO_REVIEWS[nextIndex];

    if (!reduceMotion) {
      card.classList.add('is-leaving');
      await wait(280);
    }

    if (runGeneration !== generation || !card.isConnected) {
      busy = false;
      return;
    }
    const fresh = createCard(nextReview, nextIndex);
    if (!reduceMotion) fresh.classList.add('is-entering');
    card.replaceWith(fresh);
    visibleIds[slotIndex] = nextIndex;
    replaceAt = (slotIndex + 1) % visibleCount;

    requestAnimationFrame(() => {
      measureToggle(fresh);
      if (!reduceMotion) {
        requestAnimationFrame(() => fresh.classList.remove('is-entering'));
      }
    });

    await wait(reduceMotion ? 0 : 320);
    busy = false;
  }

  function stopTimer() {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
  }

  function syncTimer() {
    stopTimer();
    if (reduceMotion || isPaused() || document.hidden || STUDIO_REVIEWS.length <= visibleCount) return;
    timerId = window.setInterval(() => {
      if (!isPaused() && !busy) relayOne();
    }, 4200);
  }

  if (!root.dataset.reviewsBound) {
    root.dataset.reviewsBound = '1';

    root.addEventListener('click', (event) => {
      const btn = event.target.closest('.studio-review-toggle');
      if (!btn || !root.contains(btn) || btn.hidden) return;
      const card = btn.closest('.studio-review');
      if (!card) return;
      const on = card.classList.toggle('studio-review--expanded');
      btn.setAttribute('aria-expanded', on ? 'true' : 'false');
      btn.textContent = on ? 'Cacher' : 'Voir plus';
      syncTimer();
    });

    root.addEventListener('mouseenter', () => {
      hoverPaused = true;
      syncTimer();
    });
    root.addEventListener('mouseleave', () => {
      hoverPaused = false;
      syncTimer();
    });
    root.addEventListener('focusin', syncTimer);
    root.addEventListener('focusout', (event) => {
      if (!root.contains(event.relatedTarget)) {
        window.setTimeout(syncTimer, 0);
      }
    });

    nextBtn?.addEventListener('click', () => {
      relayOne().then(syncTimer);
    });

    document.addEventListener('visibilitychange', syncTimer);
    window.addEventListener(
      'resize',
      () => {
        const next = slotCount();
        if (next !== visibleCount) {
          paintInitial();
          syncTimer();
        } else {
          measureAll();
        }
      },
      { passive: true },
    );
  }

  paintInitial();
  document.fonts?.ready.then(measureAll);
  syncTimer();
}

async function bootStudioReviews() {
  const data = await fetchAvisData();
  const reviews = data?.reviews?.filter(review => typeof review.name === 'string' && typeof review.text === 'string' && review.text.trim());
  if (reviews?.length) STUDIO_REVIEWS = reviews;
  if (Number.isSafeInteger(data?.googleTotal) && data.googleTotal >= 0) {
    document.querySelectorAll('[data-review-total]').forEach(el => { el.textContent = data.googleTotal; });
  }
  initStudioReviewsRelay();
}
bootStudioReviews();

function initStudioMethodTabs() {
  const root = document.querySelector('[data-studio-tabs]');
  if (!root) return;

  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const panels = [...root.querySelectorAll('[role="tabpanel"]')];
  const prevBtn = root.querySelector('[data-tabs-prev]');
  const nextBtn = root.querySelector('[data-tabs-next]');
  const progress = root.querySelector('[data-tabs-progress]');
  const currentEl = root.querySelector('[data-tabs-current]');
  const total = tabs.length;
  if (!total || panels.length !== total) return;
  let index = 0;

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function setIndex(next) {
    index = ((next % total) + total) % total;

    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
    });

    panels.forEach((panel, i) => {
      const on = i === index;
      panel.classList.toggle('is-active', on);
      panel.toggleAttribute('hidden', !on);
    });

    if (progress) progress.style.width = `${((index + 1) / total) * 100}%`;
    if (currentEl) currentEl.textContent = pad(index + 1);
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      setIndex(Number(tab.dataset.tab) || 0);
    });
    tab.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        setIndex(index + 1);
        tabs[index]?.focus();
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        setIndex(event.key === 'Home' ? 0 : total - 1);
        tabs[index]?.focus();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        setIndex(index - 1);
        tabs[index]?.focus();
      }
    });
  });

  prevBtn?.addEventListener('click', () => setIndex(index - 1));
  nextBtn?.addEventListener('click', () => setIndex(index + 1));

  const totalEl = root.querySelector('[data-tabs-total]');
  if (totalEl) totalEl.textContent = pad(total);
  setIndex(0);
}

initStudioMethodTabs();

function initHomeContactForm() {
  const contactForm = document.getElementById('contact-form');
  if (!contactForm) return;

  const sourceAutreRow = contactForm.querySelector('.contact-dark__field-source-autre');
  function syncSourceAutreField() {
    if (!sourceAutreRow) return;
    const checked = contactForm.querySelector('input[name="source"]:checked');
    const show = checked && checked.value === 'autre';
    sourceAutreRow.toggleAttribute('hidden', !show);
    if (!show) {
      const inp = sourceAutreRow.querySelector('input');
      if (inp) inp.value = '';
    }
  }
  contactForm.querySelectorAll('input[name="source"]').forEach((r) => {
    r.addEventListener('change', syncSourceAutreField);
  });
  contactForm.addEventListener('reset', syncSourceAutreField);
  syncSourceAutreField();

  const submitBtn =
    contactForm.querySelector('.form-wizard__submit') ||
    contactForm.querySelector('.contact-dark__submit');
  const feedbackEl = document.getElementById('contact-form-feedback');
  const submitDefaultHtml = submitBtn ? submitBtn.innerHTML.trim() : 'Envoyer ma fiche →';
  const reduceMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const successHoldMs = reduceMotion ? 2200 : 3800;

  function resetSubmitButton() {
    if (!submitBtn) return;
    submitBtn.classList.remove('is-sending', 'is-success');
    submitBtn.disabled = false;
    submitBtn.removeAttribute('aria-busy');
    submitBtn.innerHTML = submitDefaultHtml;
  }

  function showSubmitSuccess() {
    if (!submitBtn) return;
    submitBtn.classList.remove('is-sending');
    submitBtn.classList.add('is-success');
    submitBtn.removeAttribute('aria-busy');
    submitBtn.innerHTML =
      '<span class="contact-dark__submit-check" aria-hidden="true">✓</span>' +
      '<span class="contact-dark__submit-label">Fiche envoyée</span>';

    if (feedbackEl) {
      feedbackEl.textContent =
        'Merci ! Ta fiche a bien été envoyée. Je te réponds sous 24–48h.';
      feedbackEl.removeAttribute('hidden');
    }

    window.setTimeout(() => {
      resetSubmitButton();
      if (feedbackEl) {
        feedbackEl.setAttribute('hidden', '');
        feedbackEl.textContent = '';
      }
      contactForm.reset();
      syncSourceAutreField();
      if (window.contactWizard && typeof window.contactWizard.setStep === 'function') {
        window.contactWizard.setStep(1);
      }
    }, successHoldMs);
  }

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!submitBtn || submitBtn.disabled) return;

    submitBtn.classList.remove('is-success');
    submitBtn.classList.add('is-sending');
    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-busy', 'true');
    submitBtn.innerHTML =
      '<span class="contact-dark__submit-spinner" aria-hidden="true"></span>' +
      '<span class="contact-dark__submit-label">Envoi en cours…</span>';

    if (feedbackEl) {
      feedbackEl.setAttribute('hidden', '');
      feedbackEl.textContent = '';
    }

    sendContactEmail(contactForm)
      .then(() => {
        showSubmitSuccess();
      })
      .catch((error) => {
        console.error('Échec de l’envoi du formulaire.');
        resetSubmitButton();
        if (feedbackEl) {
          feedbackEl.textContent =
            error.message || "L’envoi a échoué. Réessaie dans un instant.";
          feedbackEl.removeAttribute('hidden');
        }
      });
  });
}

initHomeContactForm();

// Keep autoplay decorative, user-controllable, and respectful of reduced motion.
(function initHeroVideo() {
  const video = document.getElementById('hero-video');
  const button = document.querySelector('.hero-video-toggle');
  if (!video || !button) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let userPaused = false;
  function syncButton() {
    button.setAttribute('aria-label', video.paused ? 'Lire la vidéo' : 'Mettre la vidéo en pause');
    button.querySelector('span').textContent = video.paused ? '▷' : 'Ⅱ';
  }
  function syncPlayback() {
    button.hidden = motion.matches || Boolean(video.error);
    if (motion.matches || userPaused || document.hidden) video.pause();
    else video.play().catch(syncButton);
    syncButton();
  }
  button.hidden = false;
  button.addEventListener('click', () => {
    userPaused = !video.paused;
    if (video.paused) video.play().catch(syncButton);
    else video.pause();
    syncButton();
  });
  video.addEventListener('play', syncButton);
  video.addEventListener('pause', syncButton);
  video.addEventListener('error', () => { video.hidden = true; button.hidden = true; });
  motion.addEventListener('change', syncPlayback);
  document.addEventListener('visibilitychange', syncPlayback);
  syncPlayback();
})();

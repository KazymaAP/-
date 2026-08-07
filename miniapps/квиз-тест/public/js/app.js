(function() {
  'use strict';

  const API_BASE = '/api';

  const state = {
    quiz: null,
    currentQuestion: 0,
    answers: [],
    result: null,
    completionId: null,
    shareUrl: null,
    startTime: null,
    isAnimating: false,
    showFeedback: false
  };

  const elements = {};

  function $(id) {
    return document.getElementById(id);
  }

  function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = $(screenId);
    if (screen) {
      screen.classList.add('active');
    }
  }

  function showToast(message, icon) {
    const toast = $('toast');
    const toastIcon = $('toast-icon');
    const toastMessage = $('toast-message');
    if (!toast || !toastIcon || !toastMessage) return;

    toastIcon.textContent = icon || '✓';
    toastMessage.textContent = message;
    toast.hidden = false;

    setTimeout(() => {
      toast.hidden = true;
    }, 3000);
  }

  async function apiCall(url, options = {}) {
    try {
      const response = await fetch(`${API_BASE}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async function loadQuiz() {
    try {
      const quizzes = await apiCall('/quiz');
      if (quizzes.length === 0) {
        throw new Error('Квизы не найдены');
      }

      const quizId = quizzes[0].id;
      state.quiz = await apiCall(`/quiz/${quizId}`);

      renderStartScreen();
      showScreen('start-screen');
    } catch (error) {
      showError(error.message);
    }
  }

  function renderStartScreen() {
    const quiz = state.quiz;
    if (!quiz) return;

    const titleEl = $('quiz-title');
    const descEl = $('quiz-description');
    const questionsCountEl = $('questions-count');
    const estimatedTimeEl = $('estimated-time');
    const completionsCountEl = $('completions-count');
    const benefitsListEl = $('benefits-list');

    if (titleEl) titleEl.textContent = quiz.title;
    if (descEl) descEl.textContent = quiz.description;

    const qCount = quiz.questions ? quiz.questions.length : 0;
    if (questionsCountEl) questionsCountEl.textContent = `${qCount} вопросов`;
    if (estimatedTimeEl) estimatedTimeEl.textContent = `~${Math.ceil(qCount * 0.5)} минуты`;

    const count = quiz.completions_count || 0;
    if (completionsCountEl) {
      completionsCountEl.textContent = formatCount(count);
    }

    if (benefitsListEl && quiz.benefits && quiz.benefits.length > 0) {
      benefitsListEl.innerHTML = quiz.benefits.map(b =>
        `<li class="benefit-item" role="listitem">${escapeHtml(b)}</li>`
      ).join('');
    }
  }

  function formatCount(n) {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M прошли`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K прошли`;
    const lastTwo = n % 100;
    const lastOne = n % 10;
    if (lastTwo >= 11 && lastTwo <= 19) return `${n} прошли`;
    if (lastOne === 1) return `${n} прошёл`;
    if (lastOne >= 2 && lastOne <= 4) return `${n} прошли`;
    return `${n} прошли`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function startQuiz() {
    state.currentQuestion = 0;
    state.answers = [];
    state.result = null;
    state.startTime = Date.now();

    renderQuestion();
    showScreen('question-screen');
  }

  function renderQuestion() {
    const quiz = state.quiz;
    if (!quiz || !quiz.questions) return;

    const question = quiz.questions[state.currentQuestion];
    if (!question) return;

    const total = quiz.questions.length;
    const current = state.currentQuestion + 1;
    const progress = (current / total) * 100;

    const counterEl = $('question-counter');
    const progressEl = $('progress-fill');
    const textEl = $('question-text');
    const answersEl = $('answers-container');
    const feedbackEl = $('question-feedback');
    const nextBtn = $('next-btn');

    if (counterEl) counterEl.textContent = `${current} из ${total}`;
    if (progressEl) {
      progressEl.style.width = `${progress}%`;
      const progressBar = progressEl.closest('.progress-bar');
      if (progressBar) progressBar.setAttribute('aria-valuenow', Math.round(progress));
    }
    if (textEl) textEl.textContent = question.text;

    if (answersEl) {
      answersEl.innerHTML = '';
      const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

      question.options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', 'false');
        btn.setAttribute('aria-label', `${letters[index]}. ${option.text}`);
        btn.setAttribute('tabindex', '0');
        btn.innerHTML = `
          <span class="answer-letter">${letters[index]}</span>
          <span class="answer-text">${escapeHtml(option.text)}</span>
        `;
        btn.addEventListener('click', () => selectAnswer(index));
        btn.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            selectAnswer(index);
          }
        });
        answersEl.appendChild(btn);
      });
    }

    if (feedbackEl) {
      feedbackEl.hidden = true;
      feedbackEl.className = 'question-feedback';
    }
    if (nextBtn) nextBtn.hidden = true;

    state.showFeedback = false;

    setTimeout(() => {
      if (textEl) textEl.focus();
    }, 100);
  }

  function selectAnswer(index) {
    if (state.showFeedback || state.isAnimating) return;

    const quiz = state.quiz;
    const question = quiz.questions[state.currentQuestion];

    state.answers[state.currentQuestion] = {
      questionId: question.id,
      optionIndex: index
    };

    state.showFeedback = true;

    const answersEl = $('answers-container');
    const buttons = answersEl ? answersEl.querySelectorAll('.answer-btn') : [];
    buttons.forEach((btn, i) => {
      btn.disabled = true;
      btn.setAttribute('aria-checked', i === index ? 'true' : 'false');
      if (i === index) {
        btn.classList.add('selected');
      }
    });

    const feedbackEl = $('question-feedback');
    const feedbackText = $('feedback-text');
    const nextBtn = $('next-btn');

    if (feedbackEl) {
      feedbackEl.hidden = false;
      const isLast = state.currentQuestion === quiz.questions.length - 1;

      feedbackText.textContent = 'Ответ принят!';
      feedbackEl.className = 'question-feedback';

      if (nextBtn) {
        nextBtn.hidden = false;
        nextBtn.textContent = isLast ? 'Узнать результат' : 'Следующий вопрос';
      }
    }

    trackEvent('answer_selected', {
      questionIndex: state.currentQuestion,
      optionIndex: index,
      questionText: question.text
    });
  }

  function nextQuestion() {
    if (state.isAnimating) return;

    const quiz = state.quiz;
    state.isAnimating = true;

    if (state.currentQuestion < quiz.questions.length - 1) {
      state.currentQuestion++;
      setTimeout(() => {
        renderQuestion();
        state.isAnimating = false;
      }, 200);
    } else {
      submitQuiz();
    }
  }

  async function submitQuiz() {
    try {
      showScreen('loading-screen');
      const timeSpent = Math.round((Date.now() - state.startTime) / 1000);

      const data = await apiCall('/quiz/submit', {
        method: 'POST',
        body: JSON.stringify({
          quizId: state.quiz.id,
          answers: state.answers,
          timeSpent: timeSpent
        })
      });

      state.result = data.result;
      state.completionId = data.completionId;
      state.shareUrl = data.shareUrl;

      renderResult();
      showScreen('result-screen');
      state.isAnimating = false;

      trackEvent('quiz_completed', {
        score: data.result.score,
        percentage: data.result.percentage,
        result: data.result.title,
        timeSpent
      });
    } catch (error) {
      showError(error.message);
      state.isAnimating = false;
    }
  }

  function renderResult() {
    const result = state.result;
    if (!result) return;

    const emojiEl = $('result-emoji');
    const titleEl = $('result-title');
    const subtitleEl = $('result-subtitle');
    const scoreNumber = $('score-number');
    const scoreMax = $('score-max');
    const scoreProgress = $('score-progress');
    const recommendationEl = $('result-recommendation');
    const promoCard = $('promo-card');
    const promoCode = $('promo-code');

    if (emojiEl) emojiEl.textContent = result.emoji || '🎯';
    if (titleEl) titleEl.textContent = `Ваш уровень: ${result.title}`;
    if (subtitleEl) subtitleEl.textContent = result.description;
    if (scoreNumber) scoreNumber.textContent = result.percentage;
    if (scoreMax) scoreMax.textContent = `/${result.maxScore}`;

    if (scoreProgress) {
      const circumference = 2 * Math.PI * 54;
      const offset = circumference - (result.percentage / 100) * circumference;
      scoreProgress.style.strokeDashoffset = offset;
      if (result.color) {
        scoreProgress.style.stroke = result.color;
      }
    }

    if (recommendationEl) {
      recommendationEl.textContent = result.recommendation;
    }

    if (promoCard && promoCode) {
      if (result.promoCode) {
        promoCard.hidden = false;
        promoCode.textContent = result.promoCode;
      } else {
        promoCard.hidden = true;
      }
    }

    const shareText = $('share-text');
    const shareResultTitle = $('share-result-title');
    const shareScore = $('share-score');

    if (shareText) {
      shareText.innerHTML = `Я прошёл квиз "${escapeHtml(state.quiz.title)}" и получил уровень: <strong>${escapeHtml(result.title)}</strong>! 🎯`;
    }
    if (shareResultTitle) shareResultTitle.textContent = result.title;
    if (shareScore) shareScore.textContent = `Мой результат: ${result.score}/${result.maxScore}`;
  }

  function showLeadForm() {
    showScreen('lead-screen');
    const nameInput = $('lead-name');
    if (nameInput) nameInput.focus();
  }

  function hideLeadForm() {
    showScreen('result-screen');
  }

  async function submitLead(event) {
    event.preventDefault();

    const nameInput = $('lead-name');
    const phoneInput = $('lead-phone');
    const emailInput = $('lead-email');
    const consentInput = $('lead-consent');
    const submitBtn = $('submit-lead-btn');

    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const consent = consentInput ? consentInput.checked : false;

    let hasErrors = false;

    clearErrors();

    if (!name || name.length < 2) {
      showFieldError('name-error', 'Имя должно содержать минимум 2 символа');
      if (nameInput) nameInput.classList.add('error');
      hasErrors = true;
    }

    if (phone && !/^\+?[0-9\s\-()]{7,20}$/.test(phone)) {
      showFieldError('phone-error', 'Некорректный формат телефона');
      if (phoneInput) phoneInput.classList.add('error');
      hasErrors = true;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showFieldError('email-error', 'Некорректный формат email');
      if (emailInput) emailInput.classList.add('error');
      hasErrors = true;
    }

    if (!consent) {
      showFieldError('consent-error', 'Необходимо согласие на обработку данных');
      hasErrors = true;
    }

    if (!phone && !email) {
      showFieldError('phone-error', 'Укажите телефон или email');
      hasErrors = true;
    }

    if (hasErrors) return;

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Отправка...';
    }

    try {
      await apiCall('/leads', {
        method: 'POST',
        body: JSON.stringify({
          completionId: state.completionId,
          name,
          phone: phone || undefined,
          email: email || undefined,
          consent
        })
      });

      showToast('Контакт сохранён! Мы свяжемся с вами.', '✓');
      showScreen('result-screen');

      trackEvent('lead_submitted', { name, hasPhone: !!phone, hasEmail: !!email });
    } catch (error) {
      showToast('Ошибка отправки. Попробуйте ещё раз.', '✗');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Отправить';
      }
    }
  }

  function showFieldError(errorId, message) {
    const el = $(errorId);
    if (el) {
      el.textContent = message;
      el.hidden = false;
    }
  }

  function clearErrors() {
    document.querySelectorAll('.form-error').forEach(el => {
      el.hidden = true;
      el.textContent = '';
    });
    document.querySelectorAll('.form-input').forEach(el => {
      el.classList.remove('error');
    });
  }

  function showShareScreen() {
    showScreen('share-screen');
  }

  function hideShareScreen() {
    showScreen('result-screen');
  }

  function shareToTelegram() {
    const text = getShareText();
    const url = `https://t.me/share/url?url=${encodeURIComponent(state.shareUrl || window.location.href)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');

    trackEvent('share_telegram', { text });
  }

  function copyShareLink() {
    const url = state.shareUrl || window.location.href;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        showToast('Ссылка скопирована!', '📋');
        const toast = $('share-toast');
        if (toast) {
          toast.hidden = false;
          setTimeout(() => { toast.hidden = true; }, 2000);
        }
      }).catch(() => {
        fallbackCopy(url);
      });
    } else {
      fallbackCopy(url);
    }

    trackEvent('share_copied', { url });
  }

  function fallbackCopy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Ссылка скопирована!', '📋');
      }).catch(() => {
        showToast('Не удалось скопировать', '✗');
      });
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        showToast('Ссылка скопирована!', '📋');
      } catch (e) {
        showToast('Не удалось скопировать', '✗');
      }
      document.body.removeChild(textarea);
    }
  }

  function getShareText() {
    const result = state.result;
    const quiz = state.quiz;
    if (!result || !quiz) return '';

    return `Я прошёл квиз "${quiz.title}" и получил уровень: ${result.title}! 🎯\n\nМой результат: ${result.score}/${result.maxScore}\n\nА ты какой? Пройди тест!`;
  }

  function copyPromo() {
    const promoCode = state.result && state.result.promoCode;
    if (!promoCode) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(promoCode).then(() => {
        showToast('Промокод скопирован!', '📋');
      }).catch(() => {
        showToast('Не удалось скопировать', '✗');
      });
    } else {
      showToast('Промокод: ' + promoCode, '📋');
    }
  }

  function restart() {
    state.currentQuestion = 0;
    state.answers = [];
    state.result = null;
    state.completionId = null;
    state.shareUrl = null;
    state.startTime = null;

    renderStartScreen();
    showScreen('start-screen');
  }

  function showError(message) {
    const messageEl = $('error-message');
    if (messageEl) messageEl.textContent = message;
    showScreen('error-screen');
  }

  function retry() {
    loadQuiz();
  }

  async function trackEvent(eventType, data) {
    try {
      await fetch(`${API_BASE}/analytics/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          data: {
            ...data,
            pageUrl: window.location.href,
            sessionId: getSessionId()
          }
        })
      }).catch(() => {});
    } catch (e) {
      // Silently ignore analytics failures
    }
  }

  function getSessionId() {
    let sessionId = sessionStorage.getItem('quiz_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('quiz_session_id', sessionId);
    }
    return sessionId;
  }

  function init() {
    loadQuiz();
  }

  window.app = {
    startQuiz,
    nextQuestion,
    showLeadForm,
    hideLeadForm,
    submitLead,
    shareResult: showShareScreen,
    hideShareScreen,
    shareToTelegram,
    copyShareLink,
    copyPromo,
    restart,
    retry,
    destroy() {
      state.quiz = null;
      state.currentQuestion = 0;
      state.answers = [];
      state.result = null;
      state.completionId = null;
      state.shareUrl = null;
      state.startTime = null;
      state.isAnimating = false;
      state.showFeedback = false;
      Object.keys(elements).forEach(k => delete elements[k]);

      // Clean up event listeners by cloning key interactive elements
      const screens = document.querySelectorAll('.screen');
      screens.forEach(screen => {
        const clone = screen.cloneNode(true);
        screen.replaceWith(clone);
      });
    }
  };

  function initQuiz() { init(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuiz);
  } else {
    initQuiz();
  }
})();

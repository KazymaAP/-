/**
 * Fitness Studio - UI Components
 * Reusable component rendering functions
 */

const Components = {
  /**
   * Render schedule item
   * @param {Object} item - Schedule item data
   * @returns {string} HTML string
   */
  renderScheduleItem(item) {
    const time = item.start_time || item.time || '';
    const endTime = item.end_time ? ` – ${item.end_time}` : '';
    const type = item.training_type_name || item.type || '';
    const trainer = item.trainer_name ? `с ${item.trainer_name}` : '';
    const available = item.available_slots !== undefined ? item.available_slots : -1;
    const capacity = item.capacity || 0;

    let statusClass = 'available';
    let statusText = 'Есть места';
    if (available === 0) {
      statusClass = 'full';
      statusText = 'Нет мест';
    } else if (available > 0 && available <= 3) {
      statusClass = 'few';
      statusText = `Осталось ${available}`;
    }

    const canBook = available !== 0 && Auth.isLoggedIn();

    return `
      <article class="schedule-item" data-id="${item.id || ''}" role="listitem">
        <div class="schedule-time">
          <span class="time-value">${Utils.escapeHtml(time)}${Utils.escapeHtml(endTime)}</span>
        </div>
        <div class="schedule-info">
          <h3 class="schedule-title">${Utils.escapeHtml(type)}</h3>
          <p class="schedule-trainer">${Utils.escapeHtml(trainer)}</p>
          <div class="schedule-meta">
            <span class="schedule-tag ${statusClass}">${Utils.escapeHtml(statusText)}</span>
            ${capacity ? `<span class="schedule-capacity">${available > 0 ? available : 0} / ${capacity}</span>` : ''}
          </div>
        </div>
        <div class="schedule-actions">
          <button 
            class="btn btn-primary btn-sm btn-book ${!canBook ? 'btn-book--disabled' : ''}" 
            data-id="${item.id || ''}"
            ${!canBook ? 'disabled' : ''}
            aria-label="${canBook ? 'Записаться на тренировку' : 'Нет мест или войдите для записи'}">
            ${canBook ? 'Записаться' : (available === 0 ? 'Занято' : 'Войти')}
          </button>
        </div>
      </article>
    `;
  },

  /**
   * Render trainer card
   * @param {Object} trainer - Trainer data
   * @returns {string} HTML string
   */
  renderTrainerCard(trainer) {
    const name = trainer.name || '';
    const specialization = trainer.specialization || '';
    const experience = trainer.experience ? `${trainer.experience} лет опыта` : '';
    const photo = trainer.photo || '';

    return `
      <article class="trainer-card" role="listitem">
        <div class="trainer-avatar">
          ${photo ? `<img src="${Utils.escapeHtml(photo)}" alt="" loading="lazy">` : 
            `<span class="avatar-placeholder">${Utils.escapeHtml(name.charAt(0))}</span>`}
        </div>
        <h3 class="trainer-name">${Utils.escapeHtml(name)}</h3>
        <p class="trainer-specialization">${Utils.escapeHtml(specialization)}</p>
        ${experience ? `<p class="trainer-experience">${Utils.escapeHtml(experience)}</p>` : ''}
        <button class="btn btn-secondary btn-sm trainer-details" data-id="${trainer.id || ''}">
          Подробнее
        </button>
      </article>
    `;
  },

  /**
   * Render membership card
   * @param {Object} plan - Membership plan data
   * @returns {string} HTML string
   */
  renderMembershipCard(plan) {
    const name = plan.name || '';
    const price = plan.price || 0;
    const period = plan.period || 'мес';
    const features = plan.features || [];
    const isPopular = plan.is_popular || false;
    const planId = plan.id || '';

    return `
      <article class="membership-card ${isPopular ? 'popular' : ''}" data-plan="${Utils.escapeHtml(planId)}">
        ${isPopular ? '<span class="membership-badge">Популярный</span>' : ''}
        <h3 class="membership-name">${Utils.escapeHtml(name)}</h3>
        <div class="membership-price">
          <span class="price-value">${Utils.formatPrice(price)}</span>
          <span class="price-period">₽/${period}</span>
        </div>
        <ul class="membership-features">
          ${features.map(f => `<li><span class="feature-check" aria-hidden="true">✓</span>${Utils.escapeHtml(f)}</li>`).join('')}
        </ul>
        <button class="btn ${isPopular ? 'btn-primary' : 'btn-secondary'} btn-membership btn-full" data-plan="${Utils.escapeHtml(planId)}">
          ${isPopular ? 'Выбрать' : 'Подробнее'}
        </button>
      </article>
    `;
  },

  /**
   * Render empty state
   * @param {string} icon - Icon emoji
   * @param {string} text - Message text
   * @param {string} actionHtml - Optional action HTML
   * @returns {string} HTML string
   */
  renderEmptyState(icon, text, actionHtml = '') {
    return `
      <div class="empty-state">
        <span class="empty-icon" aria-hidden="true">${icon}</span>
        <p class="empty-text">${Utils.escapeHtml(text)}</p>
        ${actionHtml}
      </div>
    `;
  },

  /**
   * Show toast notification
   * @param {string} message - Message text
   * @param {string} type - Type: 'success', 'error', 'warning'
   * @param {number} duration - Duration in ms
   */
  showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = message;

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Auto remove
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  /**
   * Show booking modal
   * @param {string|number} scheduleId - Schedule ID
   * @param {string} title - Training title
   * @param {string} time - Training time
   */
  showBookingModal(scheduleId, title, time) {
    // Remove existing modal
    const existing = document.querySelector('.modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="bookingModalTitle">
        <button class="modal-close" aria-label="Закрыть">&times;</button>
        <h2 id="bookingModalTitle" class="modal-title">Запись на тренировку</h2>
        <p class="modal-subtitle">${Utils.escapeHtml(title)}</p>
        <p class="modal-subtitle">${Utils.escapeHtml(time)}</p>
        <form id="bookingForm" novalidate>
          <div class="form-group">
            <label class="form-label" for="bookingName">Ваше имя *</label>
            <input type="text" class="form-input" id="bookingName" name="name" required autocomplete="name">
          </div>
          <div class="form-group">
            <label class="form-label" for="bookingPhone">Телефон *</label>
            <input type="tel" class="form-input" id="bookingPhone" name="phone" required autocomplete="tel" placeholder="+7 (999) 123-45-67">
          </div>
          <div class="form-group">
            <label class="form-label" for="bookingComment">Комментарий</label>
            <textarea class="form-input" id="bookingComment" name="comment" rows="3" placeholder="Пожелания, травмы, особые условия..."></textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-full">Подтвердить запись</button>
        </form>
        <p class="modal-note" hidden>Вы записаны! Подтверждение придет по SMS.</p>
      </div>
    `;

    document.body.appendChild(modal);

    // Focus trap and close handlers
    const closeBtn = modal.querySelector('.modal-close');
    const form = modal.querySelector('#bookingForm');

    const closeModal = () => {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 300);
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', function onKeydown(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', onKeydown);
      }
    });

    // Handle form submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = form.querySelector('#bookingName').value.trim();
      const phone = form.querySelector('#bookingPhone').value.trim();
      const comment = form.querySelector('#bookingComment').value.trim();

      if (!name || !phone) {
        Components.showToast('Заполните обязательные поля', 'error');
        return;
      }

      if (!Utils.validatePhone(phone)) {
        Components.showToast('Введите корректный номер телефона', 'error');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Записываем...';

      try {
        await API.booking.create({
          schedule_id: scheduleId,
          name,
          phone,
          comment
        });

        form.hidden = true;
        modal.querySelector('.modal-note').hidden = false;
        Components.showToast('Вы записаны на тренировку!', 'success');

        setTimeout(closeModal, 2000);
      } catch (error) {
        Components.showToast(error.message || 'Ошибка записи', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Подтвердить запись';
      }
    });

    // Trigger animation
    requestAnimationFrame(() => modal.classList.add('show'));

    // Phone mask
    const phoneInput = form.querySelector('#bookingPhone');
    phoneInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 0) {
        if (value[0] === '7' || value[0] === '8') value = value.substring(1);
        let formatted = '+7';
        if (value.length > 0) formatted += ' (' + value.substring(0, 3);
        if (value.length >= 3) formatted += ') ' + value.substring(3, 6);
        if (value.length >= 6) formatted += '-' + value.substring(6, 8);
        if (value.length >= 8) formatted += '-' + value.substring(8, 10);
        e.target.value = formatted;
      }
    });
  }
};

// Export for use in other modules
window.Components = Components;

// Also support ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Components;
}
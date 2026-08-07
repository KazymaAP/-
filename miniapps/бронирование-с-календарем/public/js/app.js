class BookingApp {
  constructor() {
    this.bookingManager = new BookingManager()
    this.calendar = null
    this.currentView = 'services'
    this.resources = []
    this.myBookings = []

    this.init()
  }

  init() {
    this.initTelegramWebApp()
    this.bindEvents()
    this.loadResources()

    if (this.currentView === 'services') {
      this.showView('services')
    }
  }

  initTelegramWebApp() {
    if (typeof window.Telegram !== 'undefined' && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      tg.expand()

      if (tg.colorScheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark')
      }

      tg.onEvent('themeChanged', () => {
        if (tg.colorScheme === 'dark') {
          document.documentElement.setAttribute('data-theme', 'dark')
        } else {
          document.documentElement.removeAttribute('data-theme')
        }
      })


    }
  }

  bindEvents() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view
        if (view === 'bookings') {
          this.loadMyBookings()
        }
        this.showView(view)
      })
    })

    document.getElementById('back-to-services')?.addEventListener('click', () => {
      this.showView('services')
    })

    document.getElementById('back-to-calendar')?.addEventListener('click', () => {
      this.showView('calendar')
    })

    document.getElementById('back-to-home')?.addEventListener('click', () => {
      this.bookingManager.reset()
      this.showView('services')
    })

    const form = document.getElementById('booking-form')
    if (form) {
      form.addEventListener('submit', (e) => this.handleBookingSubmit(e))
    }

    const phoneInput = document.getElementById('booking-phone')
    if (phoneInput) {
      phoneInput.addEventListener('input', (e) => {
        e.target.value = BookingUtils.formatPhone(e.target.value)
        this.validateForm()
      })
    }

    const nameInput = document.getElementById('booking-name')
    if (nameInput) {
      nameInput.addEventListener('input', () => this.validateForm())
    }

    const emailInput = document.getElementById('booking-email')
    if (emailInput) {
      emailInput.addEventListener('input', () => this.validateForm())
    }

    const agreeCheckbox = document.getElementById('booking-agree')
    if (agreeCheckbox) {
      agreeCheckbox.addEventListener('change', () => this.validateForm())
    }
  }

  showView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'))

    const targetView = document.getElementById(`view-${viewName}`)
    if (targetView) {
      targetView.classList.add('active')
    }

    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName)
      if (btn.dataset.view === viewName) {
        btn.setAttribute('aria-current', 'page')
      } else {
        btn.removeAttribute('aria-current')
      }
    })

    this.currentView = viewName

    if (viewName === 'services') {
      this.loadResources()
    }
  }

  async loadResources() {
    const container = document.getElementById('resources-list')
    if (!container) return

    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Загрузка услуг...</p>
      </div>
    `

    try {
      this.resources = await BookingAPI.getResources()

      if (this.resources.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 12h8"/>
            </svg>
            <p>Услуги пока не добавлены</p>
          </div>
        `
        return
      }

      const icons = {
        master: '✂️',
        table: '🪑',
        room: '🚪',
        service: '💫'
      }

      container.innerHTML = this.resources.map(resource => `
        <div class="resource-card" role="listitem" tabindex="0"
             data-resource-id="${resource.id}"
             aria-label="${BookingUtils.escapeHtml(resource.name)}, ${BookingUtils.formatPrice(resource.price)}">
          <div class="resource-icon" aria-hidden="true">
            ${icons[resource.type] || '💫'}
          </div>
          <div class="resource-info">
            <div class="resource-name">${BookingUtils.escapeHtml(resource.name)}</div>
            ${resource.description ? `<div class="resource-description">${BookingUtils.escapeHtml(resource.description)}</div>` : ''}
            <div class="resource-meta">
              <span class="resource-price">${BookingUtils.formatPrice(resource.price)}</span>
              <span class="resource-duration">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                ${resource.duration_minutes || 60} мин
              </span>
            </div>
          </div>
        </div>
      `).join('')

      container.querySelectorAll('.resource-card').forEach(card => {
        const handler = () => {
          const resourceId = parseInt(card.dataset.resourceId)
          const resource = this.resources.find(r => r.id === resourceId)
          if (resource) {
            this.selectResource(resource)
          }
        }
        card.addEventListener('click', handler)
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handler()
          }
        })
      })

    } catch (error) {
      container.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <p>Ошибка загрузки услуг</p>
          <button class="btn btn-secondary btn-sm" id="retry-resources" style="margin-top: 12px">
            Попробовать снова
          </button>
        </div>
      `
      document.getElementById('retry-resources')?.addEventListener('click', () => this.loadResources())
      this.showToast('Не удалось загрузить услуги', 'error')
    }
  }

  async selectResource(resource) {
    this.bookingManager.setResource(resource)
    this.showView('calendar')

    const container = document.getElementById('calendar-container')
    this.calendar = new BookingCalendar(container, {
      onDateSelect: (date) => this.handleDateSelect(date)
    })

    try {
      const today = new Date().toISOString().split('T')[0]
      const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const availability = await BookingAPI.getResourceAvailability(resource.id, today, maxDate)
      this.calendar.setAvailability(availability)
    } catch (error) {
      this.showToast('Не удалось загрузить расписание', 'error')
    }
  }

  async handleDateSelect(date) {
    const slotsSection = document.getElementById('time-slots-section')
    const slotsContainer = document.getElementById('time-slots')

    slotsSection.classList.remove('hidden')
    slotsContainer.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Загрузка свободного времени...</p>
      </div>
    `

    try {
      await this.bookingManager.loadSlotsForDate(date)
      const groups = this.bookingManager.getSlotGroups()

      let html = ''
      const hasAnySlots = Object.values(groups).some(g => g.length > 0)

      if (!hasAnySlots) {
        html = `
          <div class="empty-state">
            <p>Нет свободных слотов на эту дату</p>
          </div>
        `
      } else {
        for (const [period, slots] of Object.entries(groups)) {
          if (slots.length === 0) continue
          html += `<div class="slot-group-label">${BookingUtils.getPeriodLabel(period)}</div>`
          slots.forEach(slot => {
            const isSelected = this.bookingManager.selectedSlot?.id === slot.id
            html += `
              <button class="slot-btn ${isSelected ? 'selected' : ''}"
                      role="radio"
                      aria-checked="${isSelected}"
                      aria-label="${BookingUtils.formatTime(slot.start_time)}"
                      data-slot-id="${slot.id}">
                ${BookingUtils.formatTime(slot.start_time)}
              </button>
            `
          })
        }
      }

      slotsContainer.innerHTML = html

      slotsContainer.querySelectorAll('.slot-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const slotId = parseInt(btn.dataset.slotId)
          const slot = this.bookingManager.slots.find(s => s.id === slotId)
          if (slot) {
            this.handleSlotSelect(slot)
          }
        })
      })

    } catch (error) {
      slotsContainer.innerHTML = `
        <div class="empty-state">
          <p>Ошибка загрузки слотов</p>
          <button class="btn btn-secondary btn-sm" id="retry-slots" style="margin-top: 8px">
            Попробовать снова
          </button>
        </div>
      `
      document.getElementById('retry-slots')?.addEventListener('click', () => this.handleDateSelect(this.bookingManager.selectedDate))
      this.showToast('Не удалось загрузить доступное время', 'error')
    }
  }

  handleSlotSelect(slot) {
    if (!this.bookingManager.selectSlot(slot)) {
      this.showToast('Этот слот уже занят', 'error')
      return
    }

    document.querySelectorAll('.slot-btn').forEach(btn => {
      const isSelected = parseInt(btn.dataset.slotId) === slot.id
      btn.classList.toggle('selected', isSelected)
      btn.setAttribute('aria-checked', isSelected)
    })

    setTimeout(() => {
      this.showBookingForm()
    }, 200)
  }

  showBookingForm() {
    const summary = this.bookingManager.getBookingSummary()
    if (!summary) return

    const summaryContainer = document.getElementById('booking-summary')
    summaryContainer.innerHTML = `
      <div class="summary-row">
        <span class="summary-label">Услуга</span>
        <span class="summary-value">${BookingUtils.escapeHtml(summary.resource.name)}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Дата</span>
        <span class="summary-value">${summary.formattedDate}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Время</span>
        <span class="summary-value">${summary.formattedTime}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Стоимость</span>
        <span class="summary-value">${summary.price}</span>
      </div>
    `

    const nameInput = document.getElementById('booking-name')
    const phoneInput = document.getElementById('booking-phone')
    if (nameInput) nameInput.value = ''
    if (phoneInput) phoneInput.value = ''
    document.getElementById('booking-email').value = ''
    document.getElementById('booking-notes').value = ''
    document.getElementById('booking-agree').checked = false

    this.clearFormErrors()
    this.validateForm()

    this.showView('booking')
  }

  validateForm() {
    const name = document.getElementById('booking-name')?.value?.trim() || ''
    const phone = document.getElementById('booking-phone')?.value || ''
    const email = document.getElementById('booking-email')?.value || ''
    const agree = document.getElementById('booking-agree')?.checked || false

    let isValid = true

    this.clearFormErrors()

    if (name.length < 2) {
      this.showFieldError('name', 'Введите имя (минимум 2 символа)')
      isValid = false
    }

    if (!BookingUtils.validatePhone(phone)) {
      this.showFieldError('phone', 'Введите корректный телефон')
      isValid = false
    }

    if (email && !BookingUtils.validateEmail(email)) {
      this.showFieldError('email', 'Введите корректный email')
      isValid = false
    }

    if (!agree) {
      isValid = false
    }

    const submitBtn = document.getElementById('submit-booking')
    if (submitBtn) {
      submitBtn.disabled = !isValid
    }

    return isValid
  }

  showFieldError(field, message) {
    const input = document.getElementById(`booking-${field}`)
    const error = document.getElementById(`${field}-error`)
    if (input) input.classList.add('error')
    if (error) error.textContent = message
  }

  clearFormErrors() {
    document.querySelectorAll('.form-group input, .form-group textarea').forEach(el => {
      el.classList.remove('error')
    })
    document.querySelectorAll('.error-text').forEach(el => {
      el.textContent = ''
    })
  }

  async handleBookingSubmit(e) {
    e.preventDefault()

    if (!this.validateForm()) return

    const submitBtn = document.getElementById('submit-booking')
    const btnText = submitBtn.querySelector('.btn-text')
    const btnLoading = submitBtn.querySelector('.btn-loading')

    submitBtn.disabled = true
    btnText.textContent = 'Бронирование...'
    btnLoading.classList.remove('hidden')

    try {
      const formData = {
        name: document.getElementById('booking-name').value.trim(),
        phone: document.getElementById('booking-phone').value,
        email: document.getElementById('booking-email').value,
        notes: document.getElementById('booking-notes').value
      }

      const result = await this.bookingManager.createBooking(formData)

      this.showConfirmation(result.booking)
      this.showToast('Бронирование подтверждено!', 'success')

      if (typeof window.Telegram !== 'undefined' && window.Telegram.WebApp) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success')
      }

    } catch (error) {
      let message = 'Ошибка бронирования'

      if (error.status === 409) {
        message = 'Этот слот уже занят. Выберите другое время.'
      } else if (error.status === 400) {
        message = error.message || 'Проверьте введённые данные'
      } else if (error.message) {
        message = error.message
      }

      this.showToast(message, 'error')

      if (typeof window.Telegram !== 'undefined' && window.Telegram.WebApp) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('error')
      }
    } finally {
      submitBtn.disabled = false
      btnText.textContent = 'Подтвердить бронь'
      btnLoading.classList.add('hidden')
    }
  }

  showConfirmation(booking) {
    const container = document.getElementById('confirmation-details')
    if (!container) return

    container.innerHTML = `
      <div class="summary-row">
        <span class="summary-label">Номер</span>
        <span class="summary-value">#${booking.id}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Имя</span>
        <span class="summary-value">${BookingUtils.escapeHtml(booking.name)}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Дата</span>
        <span class="summary-value">${BookingUtils.formatDate(booking.date)}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Время</span>
        <span class="summary-value">${BookingUtils.formatTime(booking.start_time)} - ${BookingUtils.formatTime(booking.end_time)}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Телефон</span>
        <span class="summary-value">${BookingUtils.escapeHtml(booking.phone)}</span>
      </div>
    `

    this.showView('confirmation')
  }

  async loadMyBookings() {
    const container = document.getElementById('my-bookings-list')
    if (!container) return

    container.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Загрузка бронирований...</p>
      </div>
    `

    try {
      this.myBookings = await BookingAPI.getMyBookings()

      if (this.myBookings.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p>У вас пока нет бронирований</p>
            <button class="btn btn-primary btn-sm" id="goto-services" style="margin-top: 12px">
              Записаться
            </button>
          </div>
        `
      document.getElementById('goto-services')?.addEventListener('click', () => this.showView('services'))
        return
      }

      const statusLabels = {
        confirmed: 'Подтверждено',
        completed: 'Завершено',
        cancelled: 'Отменено',
        no_show: 'Неявка'
      }

      container.innerHTML = this.myBookings.map(booking => {
        const date = new Date(booking.date)
        const isPast = date < new Date()
        const canCancel = booking.status === 'confirmed' && !isPast

        return `
          <div class="booking-card">
            <div class="booking-card-header">
              <span class="booking-card-title">${BookingUtils.escapeHtml(booking.resource_name || 'Услуга')}</span>
              <span class="booking-status ${booking.status}">${statusLabels[booking.status] || booking.status}</span>
            </div>
            <div class="booking-card-details">
              <div>${BookingUtils.formatDate(booking.date)}, ${BookingUtils.formatTime(booking.start_time)} - ${BookingUtils.formatTime(booking.end_time)}</div>
              <div>${BookingUtils.escapeHtml(booking.user_name)}</div>
              ${booking.price ? `<div>${BookingUtils.formatPrice(booking.price)}</div>` : ''}
            </div>
            <div class="booking-card-actions">
              ${canCancel ? `
                <button class="btn btn-danger btn-sm" data-cancel-booking="${booking.id}">
                  Отменить
                </button>
              ` : ''}
              ${booking.status === 'completed' ? `
                <button class="btn btn-secondary btn-sm" data-rebook-resource="${booking.resource_id}">
                  Записаться снова
                </button>
              ` : ''}
            </div>
          </div>
        `
      }).join('')

      container.querySelectorAll('[data-cancel-booking]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.dataset.cancelBooking)
          this.cancelBooking(id)
        })
      })

      container.querySelectorAll('[data-rebook-resource]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.dataset.rebookResource)
          this.rebook(id)
        })
      })

    } catch (error) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Ошибка загрузки бронирований</p>
          <button class="btn btn-secondary btn-sm" id="retry-bookings" style="margin-top: 8px">
            Попробовать снова
          </button>
        </div>
      `
      document.getElementById('retry-bookings')?.addEventListener('click', () => this.loadMyBookings())
      this.showToast('Не удалось загрузить бронирования', 'error')
    }
  }

  async cancelBooking(bookingId) {
    const ok = await App.showConfirm('Отменить бронирование?', 'Вы уверены, что хотите отменить это бронирование?');
    if (!ok) return;

    try {
      await BookingAPI.cancelBooking(bookingId)
      this.showToast('Бронирование отменено', 'success')
      this.loadMyBookings()
    } catch (error) {
      const message = error.message || 'Не удалось отменить бронирование'
      this.showToast(message, 'error')
    }
  }

  rebook(resourceId) {
    const resource = this.resources.find(r => r.id === resourceId)
    if (resource) {
      this.selectResource(resource)
    } else {
      this.showView('services')
    }
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container')
    if (!container) return

    const toast = document.createElement('div')
    toast.className = `toast ${type}`
    toast.setAttribute('role', 'alert')
    toast.textContent = message

    container.appendChild(toast)

    setTimeout(() => {
      toast.style.opacity = '0'
      toast.style.transform = 'translateY(-100%)'
      setTimeout(() => toast.remove(), 300)
    }, 3000)
  }

  showConfirm(title, message) {
    return new Promise((resolve) => {
      const overlay = document.getElementById('modal-overlay')
      const titleEl = document.getElementById('modal-title')
      const messageEl = document.getElementById('modal-message')
      const cancelBtn = document.getElementById('modal-cancel')
      const confirmBtn = document.getElementById('modal-confirm')

      titleEl.textContent = title
      messageEl.textContent = message
      overlay.classList.remove('hidden')

      const cleanup = () => {
        overlay.classList.add('hidden')
        cancelBtn.removeEventListener('click', onCancel)
        confirmBtn.removeEventListener('click', onConfirm)
      }

      const onCancel = () => {
        cleanup()
        resolve(false)
      }

      const onConfirm = () => {
        cleanup()
        resolve(true)
      }

      cancelBtn.addEventListener('click', onCancel)
      confirmBtn.addEventListener('click', onConfirm)
    })
  }

  destroy() {
    // Clean up calendar instance
    if (this.calendar && typeof this.calendar.destroy === 'function') {
      this.calendar.destroy();
    }

    // Remove event listeners by cloning nodes
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
      modalOverlay.replaceWith(modalOverlay.cloneNode(true));
    }

    // Clear references
    this.bookingManager = null;
    this.calendar = null;
    this.resources = [];
    this.myBookings = [];
  }
}

let app
document.addEventListener('DOMContentLoaded', () => {
  app = new BookingApp()
})

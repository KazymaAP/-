const BookingUtils = {
  formatDate(date, options = {}) {
    const d = new Date(date)
    const defaults = { day: 'numeric', month: 'long', year: 'numeric' }
    return d.toLocaleDateString('ru-RU', { ...defaults, ...options })
  },

  formatTime(time) {
    if (!time) return ''
    return time.substring(0, 5)
  },

  formatPhone(value) {
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''

    let formatted = ''
    if (digits.length > 0) {
      formatted = '+7'
    }
    if (digits.length > 1) {
      const areaCode = digits.substring(1, 4)
      formatted += ` (${areaCode}`
    }
    if (digits.length > 4) {
      formatted += `) ${digits.substring(4, 7)}`
    }
    if (digits.length > 7) {
      formatted += `-${digits.substring(7, 9)}`
    }
    if (digits.length > 9) {
      formatted += `-${digits.substring(9, 11)}`
    }
    return formatted
  },

  validatePhone(phone) {
    const cleaned = phone.replace(/\D/g, '')
    return cleaned.length === 11 && (cleaned.startsWith('7') || cleaned.startsWith('8'))
  },

  validateEmail(email) {
    if (!email) return true
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  },

  escapeHtml(str) {
    if (!str) return ''
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
  },

  debounce(fn, delay) {
    let timeoutId
    return function (...args) {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => fn.apply(this, args), delay)
    }
  },

  throttle(fn, limit) {
    let inThrottle
    return function (...args) {
      if (!inThrottle) {
        fn.apply(this, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  },

  getRelativeDay(date) {
    const d = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    d.setHours(0, 0, 0, 0)

    const diff = d - today
    const days = Math.round(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Сегодня'
    if (days === 1) return 'Завтра'
    if (days === -1) return 'Вчера'
    return this.formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })
  },

  formatPrice(price) {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽'
  },

  getSlotPeriod(time) {
    const hour = parseInt(time.split(':')[0])
    if (hour < 12) return 'morning'
    if (hour < 17) return 'afternoon'
    return 'evening'
  },

  getPeriodLabel(period) {
    const labels = {
      morning: 'Утро',
      afternoon: 'День',
      evening: 'Вечер'
    }
    return labels[period] || period
  }
}

if (typeof window !== 'undefined') {
  window.BookingUtils = BookingUtils
}

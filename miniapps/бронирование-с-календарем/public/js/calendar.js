class BookingCalendar {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container
    this.currentDate = new Date()
    this.selectedDate = null
    this.availability = {}
    this.onDateSelect = options.onDateSelect || (() => {})
    this.maxAdvanceDays = options.maxAdvanceDays || 30

    this.monthNames = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ]
    this.weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

    this.render()
  }

  render() {
    if (!this.container) return

    const year = this.currentDate.getFullYear()
    const month = this.currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startOffset = (firstDay.getDay() + 6) % 7
    const daysInMonth = lastDay.getDate()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const maxDate = new Date(today)
    maxDate.setDate(maxDate.getDate() + this.maxAdvanceDays)

    let html = `
      <div class="calendar-header">
        <span class="calendar-month">${this.monthNames[month]} ${year}</span>
        <div class="calendar-nav">
          <button class="cal-prev" aria-label="Предыдущий месяц" ${month === today.getMonth() && year === today.getFullYear() ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <button class="cal-next" aria-label="Следующий месяц">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="calendar-weekdays">
        ${this.weekdays.map(d => `<div class="weekday">${d}</div>`).join('')}
      </div>
      <div class="calendar-days">
    `

    for (let i = 0; i < startOffset; i++) {
      const prevDate = new Date(year, month, -startOffset + i + 1)
      html += `<button class="calendar-day other-month" disabled aria-hidden="true">${prevDate.getDate()}</button>`
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      date.setHours(0, 0, 0, 0)
      const dateStr = date.toISOString().split('T')[0]

      const isToday = date.getTime() === today.getTime()
      const isPast = date < today
      const isMaxExceeded = date > maxDate
      const isSelected = this.selectedDate && date.getTime() === this.selectedDate.getTime()
      const isDisabled = isPast || isMaxExceeded

      let classes = ['calendar-day']
      if (isToday) classes.push('today')
      if (isSelected) classes.push('selected')
      if (isDisabled) classes.push('disabled')

      let availDot = ''
      if (!isDisabled && this.availability[dateStr]) {
        const avail = this.availability[dateStr]
        const ratio = avail.available / (avail.total || 1)
        if (ratio > 0.5) {
          availDot = '<span class="availability-dot available"></span>'
        } else if (ratio > 0) {
          availDot = '<span class="availability-dot limited"></span>'
        } else {
          availDot = '<span class="availability-dot none"></span>'
        }
      }

      html += `
        <button class="${classes.join(' ')}"
                data-date="${dateStr}"
                ${isDisabled ? 'disabled' : ''}
                aria-label="${BookingUtils.formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}"
                ${isSelected ? 'aria-selected="true"' : ''}>
          ${day}
          ${availDot}
        </button>
      `
    }

    const remainingCells = 42 - (startOffset + daysInMonth)
    for (let i = 1; i <= remainingCells; i++) {
      html += `<button class="calendar-day other-month" disabled aria-hidden="true">${i}</button>`
    }

    html += '</div>'

    this.container.innerHTML = html

    this.container.querySelector('.cal-prev')?.addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1)
      this.render()
    })

    this.container.querySelector('.cal-next')?.addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1)
      this.render()
    })

    this.container.querySelectorAll('.calendar-day:not(.disabled):not(.other-month)').forEach(btn => {
      btn.addEventListener('click', () => {
        const dateStr = btn.dataset.date
        this.selectDate(new Date(dateStr + 'T00:00:00'))
      })
    })
  }

  selectDate(date) {
    this.selectedDate = date
    this.render()
    this.onDateSelect(date)
  }

  setAvailability(data) {
    this.availability = {}
    data.forEach(item => {
      this.availability[item.date] = {
        total: parseInt(item.total_slots),
        booked: parseInt(item.booked_slots),
        available: parseInt(item.available_slots)
      }
    })
    this.render()
  }

  goToToday() {
    this.currentDate = new Date()
    this.render()
  }

  destroy() {
    this.container.innerHTML = ''
  }
}

if (typeof window !== 'undefined') {
  window.BookingCalendar = BookingCalendar
}

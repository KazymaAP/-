const BookingAPI = {
  baseURL: '/api',

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }

    const telegramId = this.getTelegramId()
    if (telegramId) {
      config.headers['X-Telegram-Id'] = telegramId
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw {
          status: response.status,
          message: data.error || data.errors?.join(', ') || 'Произошла ошибка',
          data
        }
      }

      return data
    } catch (error) {
      if (error.status) throw error
      throw {
        status: 0,
        message: 'Ошибка сети. Проверьте подключение к интернету.',
        data: null
      }
    }
  },

  getTelegramId() {
    if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
      try {
        const user = window.Telegram.WebApp.initDataUnsafe?.user
        return user?.id || null
      } catch (e) {
        return null
      }
    }
    return null
  },

  async getResources(type = null) {
    const params = type ? `?type=${encodeURIComponent(type)}` : ''
    return this.request(`/resources${params}`)
  },

  async getResource(id) {
    return this.request(`/resources/${encodeURIComponent(id)}`)
  },

  async getResourceAvailability(id, dateFrom, dateTo) {
    let params = `?date_from=${encodeURIComponent(dateFrom)}`
    if (dateTo) params += `&date_to=${encodeURIComponent(dateTo)}`
    return this.request(`/resources/${encodeURIComponent(id)}/availability${params}`)
  },

  async getSlots(date, resourceId) {
    return this.request(`/bookings/slots?date=${encodeURIComponent(date)}&resource_id=${encodeURIComponent(resourceId)}`)
  },

  async createBooking(data) {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  async getMyBookings() {
    return this.request('/bookings/my')
  },

  async cancelBooking(id) {
    return this.request(`/bookings/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    })
  },

  async getAllBookings(params = {}) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/bookings?${query}`)
  }
}

if (typeof window !== 'undefined') {
  window.BookingAPI = BookingAPI
}

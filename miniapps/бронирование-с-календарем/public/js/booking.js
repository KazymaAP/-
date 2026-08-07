class BookingManager {
  constructor() {
    this.selectedResource = null
    this.selectedDate = null
    this.selectedSlot = null
    this.slots = []
    this.calendar = null
  }

  setResource(resource) {
    this.selectedResource = resource
    this.selectedDate = null
    this.selectedSlot = null
  }

  async loadSlotsForDate(date) {
    if (!this.selectedResource) return []

    const dateStr = date.toISOString().split('T')[0]
    this.selectedDate = date
    this.selectedSlot = null

    try {
      this.slots = await BookingAPI.getSlots(dateStr, this.selectedResource.id)
      return this.slots
    } catch (error) {
      throw error
    }
  }

  selectSlot(slot) {
    if (slot.is_available === false || slot.is_available === 'false') {
      return false
    }
    this.selectedSlot = slot
    return true
  }

  getSlotGroups() {
    if (!this.slots.length) return {}

    const groups = {
      morning: [],
      afternoon: [],
      evening: []
    }

    this.slots.forEach(slot => {
      if (slot.is_available === false || slot.is_available === 'false') return
      const period = BookingUtils.getSlotPeriod(slot.start_time)
      groups[period].push(slot)
    })

    return groups
  }

  async createBooking(formData) {
    if (!this.selectedSlot || !this.selectedResource) {
      throw new Error('Не выбран слот или ресурс')
    }

    const bookingData = {
      slot_id: this.selectedSlot.id,
      resource_id: this.selectedResource.id,
      name: formData.name.trim(),
      phone: formData.phone,
      email: formData.email || null,
      notes: formData.notes || null
    }

    return BookingAPI.createBooking(bookingData)
  }

  getBookingSummary() {
    if (!this.selectedSlot || !this.selectedResource) return null

    return {
      resource: this.selectedResource,
      date: this.selectedDate,
      slot: this.selectedSlot,
      formattedDate: BookingUtils.formatDate(this.selectedDate, { weekday: 'long', day: 'numeric', month: 'long' }),
      formattedTime: `${BookingUtils.formatTime(this.selectedSlot.start_time)} - ${BookingUtils.formatTime(this.selectedSlot.end_time)}`,
      price: BookingUtils.formatPrice(this.selectedResource.price)
    }
  }

  reset() {
    this.selectedDate = null
    this.selectedSlot = null
    this.slots = []
  }
}

if (typeof window !== 'undefined') {
  window.BookingManager = BookingManager
}

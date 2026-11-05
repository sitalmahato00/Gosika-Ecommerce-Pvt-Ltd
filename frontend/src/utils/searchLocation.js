const STORAGE_KEY = 'gosika_search_location'

export function getSearchLocation() {
  try {
    const location = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null')
    if (
      Number.isFinite(location?.latitude) &&
      Number.isFinite(location?.longitude)
    ) {
      return location
    }
  } catch {
    return null
  }

  return null
}

export function saveSearchLocation(latitude, longitude) {
  const location = { latitude, longitude }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(location))
  return location
}

export function clearSearchLocation() {
  sessionStorage.removeItem(STORAGE_KEY)
}

import api from '../api/client'

export async function downloadVendorDocument(url, filename) {
  const response = await api.get(url, {
    responseType: 'blob',
    skipCache: true,
  })
  const objectUrl = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000)
}

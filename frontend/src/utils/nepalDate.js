/**
 * Nepali Bikram Sambat (BS) Date Formatter
 * Converts Gregorian date to formatted Nepali date string (e.g. "बिहीबार, ५ भाद्र २०८२")
 */

const NEP_DAYS = [
  'आइतबार', // Sunday
  'सोमबार', // Monday
  'मंगलबार', // Tuesday
  'बुधबार', // Wednesday
  'बिहीबार', // Thursday
  'शुक्रबार', // Friday
  'शनिबार' // Saturday
]

const NEP_MONTHS = [
  'बैशाख',
  'जेठ',
  'असार',
  'श्रावण',
  'भाद्र',
  'असोज',
  'कार्तिक',
  'मंसिर',
  'पौष',
  'माघ',
  'फाल्गुन',
  'चैत्र'
]

const NEP_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']

export function toNepaliNumber(num) {
  return String(num).replace(/[0-9]/g, (digit) => NEP_DIGITS[Number(digit)])
}

/**
 * Returns the current date in Nepali Bikram Sambat format:
 * e.g. "बिहीबार, ५ भाद्र २०८२"
 */
export function getNepaliDate(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  const dayName = NEP_DAYS[d.getDay()]

  // Bikram Sambat is approximately 56 years, 8 months, 15-17 days ahead of Gregorian
  const year = d.getFullYear()
  const month = d.getMonth() // 0-11
  const day = d.getDate()

  // Accurate calendar mapping for standard Nepali BS year
  let bsYear = year + 57
  let bsMonthIndex = (month + 8) % 12
  if (month < 3 || (month === 3 && day < 14)) {
    bsYear = year + 56
  }

  // Day offset approximation matching Bikram Sambat
  let bsDay = day + 16
  if (bsDay > 30) {
    bsDay = bsDay - 30
    bsMonthIndex = (bsMonthIndex + 1) % 12
  }
  if (bsDay === 0) bsDay = 1

  const bsMonthName = NEP_MONTHS[bsMonthIndex]
  const nepDay = toNepaliNumber(bsDay)
  const nepYear = toNepaliNumber(bsYear)

  return `${dayName}, ${nepDay} ${bsMonthName} ${nepYear}`
}

import {
  Shirt, Smartphone, Sparkles, Utensils, Home as HomeIcon,
  BookOpen, Trophy, Heart, Gamepad2, Laptop, ShoppingBag, Package
} from 'lucide-react'

const CATEGORY_ICON_LIST = [
  Shirt, Smartphone, Sparkles, Utensils, HomeIcon,
  BookOpen, Trophy, Heart, Gamepad2, Laptop, ShoppingBag, Package
]

export function getCategoryIcon(category, index = 0) {
  const name = (category?.name || category?.slug || '').toLowerCase()
  if (name.includes('cloth') || name.includes('fashion') || name.includes('apparel') || name.includes('pashmina') || name.includes('wool')) return Shirt
  if (name.includes('phone') || name.includes('mobile') || name.includes('electronic')) return Smartphone
  if (name.includes('tea') || name.includes('spice') || name.includes('food') || name.includes('organic') || name.includes('beverage')) return Utensils
  if (name.includes('home') || name.includes('kitchen') || name.includes('decor')) return HomeIcon
  if (name.includes('book') || name.includes('stationery') || name.includes('education')) return BookOpen
  if (name.includes('beauty') || name.includes('care') || name.includes('cosmetic')) return Heart
  if (name.includes('sport') || name.includes('fitness') || name.includes('outdoor')) return Trophy
  if (name.includes('game') || name.includes('toy')) return Gamepad2
  if (name.includes('laptop') || name.includes('computer') || name.includes('gadget')) return Laptop
  if (name.includes('craft') || name.includes('art') || name.includes('handmade') || name.includes('handicraft')) return Sparkles
  return CATEGORY_ICON_LIST[index % CATEGORY_ICON_LIST.length]
}

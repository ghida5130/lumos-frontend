const tempImages = import.meta.glob('/src/assets/images/temp/*.{jpg,png}', {
  eager: true,
  import: 'default',
})

const categoryPrefixes = {
  식당: 'r',
  관광지: 'g',
  숙소: 's',
}

function getStableImageIndex(seed, length) {
  const text = String(seed ?? '')
  let hash = 0

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % 2147483647
  }

  return hash % length
}

export function getPlaceImage(imageUrl, category, seed) {
  if (typeof imageUrl === 'string' && imageUrl.trim()) {
    return imageUrl
  }

  const prefix = categoryPrefixes[category]

  if (!prefix) {
    return ''
  }

  const candidates = Object.entries(tempImages)
    .filter(([path]) => new RegExp(`/temp/${prefix}\\d+\\.(jpg|png)$`).test(path))
    .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath))
    .map(([, image]) => image)

  if (!candidates.length) {
    return ''
  }

  return candidates[getStableImageIndex(seed ?? category, candidates.length)]
}

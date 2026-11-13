// Accept current Django and older imported media shapes without mixing the two images.
export function offerMediaUrl(value, resolve = value => value) {
  const url = typeof value === 'string' ? value : value?.data?.attributes?.url || value?.data?.url || value?.url
  return typeof url === 'string' && url ? resolve(url) : ''
}
export function normalizeOffer(item, resolve) {
  const attrs = item.attributes || item
  const image = offerMediaUrl(attrs.image, resolve), background = offerMediaUrl(attrs.background, resolve)
  return { id: item.id, ...attrs, image: image || background, background }
}
export function offerBackground(offer, fallback = '') {
  return offer?.background || offer?.image || fallback
}

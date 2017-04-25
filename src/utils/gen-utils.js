export const __internals__ = {
  date: null
}

/**
 * generates a random uuid
 * @returns {string} a uuid-v4 formatted string
 */
export const genUuid = () => {
  let d = __internals__.date ? __internals__.date : new Date().getTime()
  const $uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
        .replace(/[xy]/g, c => {
          const r = (d + Math.random() * 16) % 16 | 0
          d = Math.floor(d / 16)
          return (c === 'x' ? r : r & 0x3 | 0x8).toString(16)
        })
  return $uuid
}

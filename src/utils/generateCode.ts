/**
 * Generate a random 4-letter uppercase code for group identification
 * @returns A 4-character uppercase string
 */
export function generateGroupCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let code = ''

  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length)
    code += characters[randomIndex]
  }

  return code
}

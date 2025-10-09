import bcrypt from 'bcryptjs'

const password = process.argv[2]
if (!password) {
  console.error('Usage: node scripts/hash-password.mjs <password>')
  process.exit(1)
}
const salt = await bcrypt.genSalt(10)
const hash = await bcrypt.hash(password, salt)
console.log(hash)

const bcrypt = require("bcryptjs");

const password = process.argv[2];
if (!password) {
  console.error('Gebruik: npm run hash-password -- "jouw-wachtwoord"');
  process.exit(1);
}

bcrypt.hash(password, 10).then((hash) => {
  console.log(hash);
});

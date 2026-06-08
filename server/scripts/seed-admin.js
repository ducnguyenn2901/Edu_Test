const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const required = ['MONGODB_URI', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing env: ${missing.join(', ')}`);
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });

  const email = String(process.env.ADMIN_EMAIL).toLowerCase();
  const name = process.env.ADMIN_NAME || 'Admin';
  const password = String(process.env.ADMIN_PASSWORD);

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name,
      email,
      password,
      role: 'admin',
      status: 'active',
    });
    console.log(`Created admin: ${email}`);
  } else {
    user.name = name || user.name;
    user.role = 'admin';
    user.status = 'active';
    user.password = password;
    await user.save();
    console.log(`Updated admin: ${email}`);
  }

  await mongoose.disconnect();
};

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

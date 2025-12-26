const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const dbString = process.env.DB.replace('<db_password>', process.env.DB_PASSWORD);

async function initWallets() {
  try {
    await mongoose.connect(dbString);
    console.log('✅ Connected to database');

    const Member = require('./models/MemberModel');
    const PointWallet = require('./models/point_walletModel');

    const members = await Member.find();
    console.log(`📋 Found ${members.length} members`);

    let created = 0;
    let existing = 0;

    for (const m of members) {
      const wallet = await PointWallet.findOne({ member_mail: m.mail });
      if (!wallet) {
        await PointWallet.create({ 
          member_mail: m.mail, 
          total_points: 0 
        });
        console.log(`  ✅ Created wallet for: ${m.mail}`);
        created++;
      } else {
        console.log(`  ⏭️ Wallet exists for: ${m.mail} (${wallet.total_points} pts)`);
        existing++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Created: ${created} wallets`);
    console.log(`   Already existed: ${existing} wallets`);

    const allWallets = await PointWallet.find();
    console.log(`\n💰 All wallets in database:`);
    allWallets.forEach(w => {
      console.log(`   ${w.member_mail}: ${w.total_points} points`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

initWallets();

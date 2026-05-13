const { Payment, Account } = require('./src/models');
async function run() {
  const accounts = await Account.findAll();
  for (let acc of accounts) {
    const total = await Payment.sum('amount', { where: { account_id: acc.id } }) || 0;
    acc.balance = total;
    await acc.save();
    console.log(`Account ${acc.name} updated to ${total}`);
  }
}
run();

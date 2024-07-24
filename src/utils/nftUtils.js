const axios = require('axios');

const BASESCAN_API_KEY = 'AWK7I8SHEWKFB9Q714SFEEV37M444RW1HD';
const PUNKAPEPEN_CONTRACT_ADDRESS = '0xf39be779905d16fe23b2cc1297dc3e759d2daa11';

async function checkIfUserHasNFT(address) {
  try {
    const url = `https://api.basescan.org/api?module=account&action=tokenbalance&contractaddress=${PUNKAPEPEN_CONTRACT_ADDRESS}&address=${address}&tag=latest&apikey=${BASESCAN_API_KEY}`;
    const response = await axios.get(url);
    const balance = response.data.result;

    return balance > 0;
  } catch (error) {
    console.error('Error checking NFT balance:', error);
    throw error;
  }
}

module.exports = { checkIfUserHasNFT };

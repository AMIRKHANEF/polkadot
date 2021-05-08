'use strict';
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
require('dotenv').config();
const Dot = require('./dot/Dot');

if (process.env.PARACHAIN_NAME === 'westend') {
    let network = 'westend';
    async function main(){
        const provider = new WsProvider('wss://westend-rpc.polkadot.io');
        const api = await ApiPromise.create({ provider });
    
        // Dot.createSenderAddr(network); // first uncomment this line to create sender address and being save in database
        // const receiver = await Dot.createReceiverAddr(network); // when sender address created successfully comment above line and uncomment following lines
        // const senderPair = await Dot.getSenderInfo();
        // Dot.checkSenderInfo(api, senderPair.address);
        // Dot.checkReceiverInfo(api, receiver);
        // Dot.signTx(api, senderPair, receiver);
    }
    main().catch(console.error).finally();

} else if(process.env.PARACHAIN_NAME === 'rococo'){
    network = 'rococo';

} else {
    console.log("Enter parachain name in .env file!!!");
}

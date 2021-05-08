const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { hexToU8a, isHex, stringToU8a, u8aToHex, u8aToString } = require('@polkadot/util');
const { mnemonicGenerate } = require('@polkadot/util-crypto');
const keyring = new Keyring({ type: 'sr25519'});
var mongoose = require('mongoose');
require('dotenv').config();

let wnd = 1000000000000;

var WalletSchema = new mongoose.Schema({
    coinSymbol: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    mnemonic: {
        type: String,
        trim: true
    },
    creationTime: Date
});
const Wallet = mongoose.model("senderInfo", WalletSchema);

const url = process.env.DATABASE_URL;
//connect to MongoDB
mongoose.connect(url, {
  //  useMongoClient: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
});


module.exports = {
    async createSenderAddr(_network){
        try{
            const mnemonic = mnemonicGenerate();
            const senderPair = keyring.addFromMnemonic(mnemonic);
            console.log(` Sender address just created on ${_network}: ${senderPair.address}!`);
            this.saveSenderInfo(mnemonic, senderPair.address);
        } catch (error){
            console.log(` Error in "createSenderAddr" section!!!\n ${error}`);
        }
    },
    saveSenderInfo(_mnemonic, _senderAddr){
        // add some mongodb code
        try{

            const wallet = new Wallet({
                coinSymbol: 'WND',
                address: _senderAddr,
                mnemonic: _mnemonic,
                creationTime: Date.now()
            });
            wallet.save();
            console.log(' Sender information saved on database successfully!')
        } catch(error){
            console.log(` Error in "saveSenderInfo" section!!!\n ${error}`);
        }
    },
    async getSenderInfo(){
        // add some mongodb code
        let result = await Wallet.find();
        const sender = keyring.addFromMnemonic(result[0].mnemonic);
        return sender;
    },
    async createReceiverAddr(_network){
        try{
            const mnemonic = mnemonicGenerate();
            const receiverPair = keyring.addFromMnemonic(mnemonic);
            console.log(` Receiver address just created on ${_network}: ${receiverPair.address}!`);
            return receiverPair.address;
        } catch (error){
            console.log(` Error in "createReceiverAddr" section!!!\n ${error}`);
        }
    },
    async signTx(_api, _sender, _receiver){
        try{
            const tx = _api.tx.balances.transfer(_receiver, 10000000000);
            console.log('signing transaction!');
            const txHash = await tx.signAndSend(_sender, ({ status }) => {
                console.log(` Current status is ${status.type}`);
            if(status.type == 'Finalized'){
                this.checkSenderInfo(_api, _sender.address);
                this.checkReceiverInfo(_api, _receiver);
            }});
        } catch (error){
            console.log(` Error while signing transaction!!!\n ${error}`);
        }
    },
    async checkSenderInfo(_api, _senderAddr){
        try{
            let { data: { free: previousFree }, nonce: previousNonce } = await _api.query.system.account(_senderAddr);
            console.log(` ${_senderAddr} has a balance of ${previousFree / wnd} wnd, nonce ${previousNonce} !`);
        } catch (error){
            console.log(` Error in "checkSenderInfo" section!!\n ${error}`);
        }
    },
    async checkReceiverInfo(_api, _ReceiverAddr){
        try{
            let { data: { free: previousFree }, nonce: previousNonce } = await _api.query.system.account(_ReceiverAddr);
            console.log(` ${_ReceiverAddr} has a balance of ${previousFree/ wnd} wnd, nonce ${previousNonce} !`);
        } catch (error){
            console.log(` Error in "checkReceiverInfo" section!!\n ${error}`);
        }
    }
}
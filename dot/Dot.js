const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { hexToU8a, isHex, stringToU8a, u8aToHex, u8aToString } = require('@polkadot/util');
const { mnemonicGenerate } = require('@polkadot/util-crypto');
const keyring = new Keyring({ type: 'sr25519'});
var mongoose = require('mongoose');
require('dotenv').config();
const db = require('../data/database');
const Wallet = require('../data/model/walletSchema');

let wnd = 1000000000000;

// var WalletSchema = new mongoose.Schema({
//     coinSymbol: {
//         type: String,
//         trim: true
//     },
//     address: {
//         type: String,
//         trim: true
//     },
//     mnemonic: {
//         type: String,
//         trim: true
//     },
//     creationTime: Date
// });
// const Wallet = mongoose.model("senderInfo", WalletSchema);

// const url = process.env.DATABASE_URL;
// //connect to MongoDB
// mongoose.connect(url, {
//   //  useMongoClient: true,
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   useCreateIndex: true,
//   useFindAndModify: false
// });


module.exports = {
    async createAddr(_network, _save){
        try{
            const mnemonic = mnemonicGenerate();
            const Pair = keyring.addFromMnemonic(mnemonic);
            console.log(` Address just created on ${_network}: ${Pair.address}!`);
            if (_save){
            this.saveSenderInfo(mnemonic, Pair.address);
            } else if (!_save){
                return Pair.address;
            }
        } catch (error){
            console.log(` Error in "createAddr" section!!!\n ${error}`);
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
    async signTx(_api, _sender, _receiver){
        try{
            const value = 10000000000;
            const tx = _api.tx.balances.transfer(_receiver, value);
            console.log('signing transaction!');
            const fee = await this.calculateFee(_api, tx, _sender, _receiver);
            let balance = await this.getBalanceOf(_api, _sender.address);
            if (balance >= (fee + (value / wnd))){
                const txHash = await tx.signAndSend(_sender, ({ status }) => {
                    console.log(` Current status is ${status.type}`);
                    if(status.type == 'Finalized'){
                        this.checkInfo(_api, _sender.address);
                        this.checkInfo(_api, _receiver);
                    }
                });
            } else {
                console.log(' Not enough balance!!!');
            }
        } catch (error){
            console.log(` Error while signing transaction!!!\n ${error}`);
        }
    },
    async checkInfo(_api, _Addr){
        try{
            let { data: { free: Free }, nonce: Nonce } = await _api.query.system.account(_Addr);
            console.log(` ${_Addr} has a balance of ${Free / wnd} wnd, nonce ${Nonce} !`);
        } catch (error){
            console.log(` Error in "checkInfo" section!!\n ${error}`);
        }
    },
    async calculateFee(_api, _tx, _sender, _receiver){
        const fee = await _tx.paymentInfo(_sender);
        console.log(` The transaction fee estimate is : ${fee.partialFee / wnd} wnd!`);
        return (fee.partialFee) / wnd;
    },
    async getBalanceOf(_api, _addr){
        try{
            let { data: { free: Free }} = await _api.query.system.account(_addr);
            return Free / wnd;
        } catch(err) {
            console.log('error' + err);
        }
    }
}

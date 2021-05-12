const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { hexToU8a, isHex, stringToU8a, u8aToHex, u8aToString } = require('@polkadot/util');
const { mnemonicGenerate } = require('@polkadot/util-crypto');
const keyring = new Keyring({ type: 'sr25519'});
var mongoose = require('mongoose');
require('dotenv').config();
const db = require('../data/database');
const Wallet = require('../data/model/walletSchema');

// let sender = '5FWDgrgi5vgLhVPtvvdNcfP8k8fkC7j2weC4FGEGNTraa8HN';

let wnd = 1000000000000;
function ShortAddr(_address) {
    return _address.substr(0, 5) + '...' + _address.substr(-5, 5)
}
function getUrl(_network) {
    switch(_network){
        case 'westend':
            return provider = new WsProvider('wss://westend-rpc.polkadot.io');
        case 'rococo':
            return provider = new WsProvider('wss://rococo-rpc.polkadot.io');
        default:
            return provider = new WsProvider('wss://westend-rpc.polkadot.io');
    }
}

module.exports = {
    /**
   * @notice create an address based on a random mnemonic
   * @param {String} _network the network name that address has created on
   * @param {bolean} _save Whether to being save in the database or not
   * @returns an address() or save to database
   */
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

    /**
     * saves the created sender information
     * @param {string} _mnemonic 
     * @param {string} _senderAddr 
     */
    saveSenderInfo(_mnemonic, _senderAddr){
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

    /**
     * find the senders informations from database and retrieve the pair from mnemonic
     * @returns sender pair
     */
    async getSenderInfo(){
        let result = await Wallet.find();
        const sender = keyring.addFromMnemonic(result[0].mnemonic);
        return sender;
    },

    /**
     * 
     * Creates the transaction and checks that the sender has sufficient inventory
     */
    async signTx(_api, _sender, _receiver){
        try{
            const value = 10000000000;
            const tx = _api.tx.balances.transfer(_receiver, value);
            console.log('signing transaction!');

            const fee = await this.calculateFee(_api, tx, _sender);
            let balance = await this.getBalanceOf(_api, _sender.address);

            if (balance >= (fee + (value / wnd))){
                const txHash = await tx.signAndSend(_sender, ({ status }) => {
                    console.log(` Current status is ${status.type}`);
                    if(status.type == 'Finalized'){
                        // this.checkInfo(_api, _sender.address, _receiver);
                    }
                });
            } else {
                console.log(' Not enough balance!!!');
            }
        } catch (error){
            console.log(` Error while signing transaction!!!\n ${error}`);
        }
    },

    /**
     * shows sender and receiver balances and nonces
     */
    async checkInfo(_api, _SenderAddr, _ReceiverAddr){
        try{
            const unsub = await _api.query.system.account.multi([_SenderAddr, _ReceiverAddr], (balances) => {
                const [{ data: { free: SFree }, nonce: SNonce }, { data: { free: RFree }, nonce: RNonce }] = balances;
                console.log(` Sender ${ShortAddr(_SenderAddr)} has a balance of ${SFree / wnd} wnd, nonce ${SNonce} !`);
                console.log(` Receiver ${ShortAddr(_ReceiverAddr)} has a balance of ${RFree / wnd} wnd, nonce ${RNonce} !`);
            });
        } catch (error){
            console.log(` Error in "checkInfo" section!!\n ${error}`);
        }
    },

    /**
     * 
     * @returns calculated transaction fee
     */
    async calculateFee(_api, _tx, _sender){
        const fee = await _tx.paymentInfo(_sender);
        console.log(` The transaction fee estimate is : ${fee.partialFee / wnd} wnd!`);
        return (fee.partialFee) / wnd;
    },
    /**
     * 
     * @returns the balance of given address
     */
    async getBalanceOf(_addr, _network){
        try{
            const provider = getUrl(_network);
            const api = await ApiPromise.create({ provider });
            let { data: { free: Free }} = await api.query.system.account(_addr);
            return Free / wnd;
        } catch(err) {
            console.log('error' + err);
        }
    }
}

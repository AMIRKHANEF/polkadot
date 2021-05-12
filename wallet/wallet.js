var mongoose = require('mongoose');

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
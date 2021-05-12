var mongoose = require('mongoose');

var WalletSchema = new mongoose.Schema({
    email: {
        type: String,
        // unique: true,
        // required: true, TODO:must be required
        trim: true
    },
    coinSymbol: {
        type: String,
        trim: true
    },
    wif: {
        type: String,
        required: false,
    },
    price: {
        type: String,
        trim: false
    },
    address: {
        type: String,
        trim: true
    },
    mnemonic: {
        type: String,
    },
    description: {
        type: String,
        required: false
    },
    creationTime: Date
});
const Wallet = mongoose.model("senderInfo", WalletSchema);

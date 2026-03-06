"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var cors_1 = require("cors");
var dotenv = require("dotenv");
var supabase_js_1 = require("@supabase/supabase-js");
dotenv.config();
var app = (0, express_1.default)();
var port = process.env.PORT || 3001;
// Supabase Setup
var supabaseUrl = process.env.SUPABASE_URL || '';
var supabaseKey = process.env.SUPABASE_ANON_KEY || '';
var supabase = null;
if (supabaseUrl && supabaseKey) {
    try {
        supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
    }
    catch (err) {
        console.error("Failed to initialize Supabase:", err);
    }
}
else {
    console.warn("⚠️ SUPABASE_URL or SUPABASE_ANON_KEY is missing. Backend will return 500s for DB requests.");
}
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:3000',
        'https://basedrop.vercel.app',
        /\.vercel\.app$/ // Allow all Vercel previews
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express_1.default.json());
app.get('/', function (req, res) {
    res.send('BaseDrop Backend is running');
});
// Create Payment Link
app.post('/api/payments', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, amount, token, sender_wallet, payment_id, _b, data, error;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _a = req.body, amount = _a.amount, token = _a.token, sender_wallet = _a.sender_wallet, payment_id = _a.payment_id;
                if (!amount || !token || !sender_wallet || !payment_id) {
                    return [2 /*return*/, res.status(400).json({ error: 'Missing required fields' })];
                }
                return [4 /*yield*/, supabase
                        .from('payments')
                        .insert([
                        {
                            payment_id: payment_id,
                            amount: amount,
                            token: token,
                            sender_wallet: sender_wallet,
                            expires_at: req.body.expires_at || null,
                            status: 'unclaimed'
                        }
                    ])];
            case 1:
                _b = _c.sent(), data = _b.data, error = _b.error;
                if (error) {
                    return [2 /*return*/, res.status(500).json({ error: error.message })];
                }
                res.status(201).json({ message: 'Payment link created', data: data });
                return [2 /*return*/];
        }
    });
}); });
// Get Payment Details
app.get('/api/payments/:payment_id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var payment_id, _a, data, error;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                payment_id = req.params.payment_id;
                if (!supabase)
                    return [2 /*return*/, res.status(500).json({ error: 'Database not configured' })];
                return [4 /*yield*/, supabase
                        .from('payments')
                        .select('*')
                        .eq('payment_id', payment_id)
                        .single()];
            case 1:
                _a = _b.sent(), data = _a.data, error = _a.error;
                if (error) {
                    return [2 /*return*/, res.status(404).json({ error: 'Payment not found' })];
                }
                res.json(data);
                return [2 /*return*/];
        }
    });
}); });
// Claim Payment (Update status)
app.post('/api/payments/:payment_id/claim', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var payment_id, _a, receiver_wallet, tx_hash, _b, data, error;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                payment_id = req.params.payment_id;
                _a = req.body, receiver_wallet = _a.receiver_wallet, tx_hash = _a.tx_hash;
                if (!supabase)
                    return [2 /*return*/, res.status(500).json({ error: 'Database not configured' })];
                return [4 /*yield*/, supabase
                        .from('payments')
                        .update({
                        status: 'claimed',
                        receiver_wallet: receiver_wallet,
                        tx_hash: tx_hash
                    })
                        .eq('payment_id', payment_id)];
            case 1:
                _b = _c.sent(), data = _b.data, error = _b.error;
                if (error) {
                    return [2 /*return*/, res.status(500).json({ error: error.message })];
                }
                res.json({ message: 'Payment claimed updated in DB', data: data });
                return [2 /*return*/];
        }
    });
}); });
app.listen(port, function () {
    console.log("Server listening at http://localhost:".concat(port));
});
exports.default = app;

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'state.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return { alertChats: [], lastPrice: null };
  }
}

let state = load();

function save() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(state, null, 2));
}

function enableAlerts(chatId) {
  if (!state.alertChats.includes(chatId)) {
    state.alertChats.push(chatId);
    save();
  }
}

function disableAlerts(chatId) {
  const before = state.alertChats.length;
  state.alertChats = state.alertChats.filter((id) => id !== chatId);
  if (state.alertChats.length !== before) save();
}

function isAlertsEnabled(chatId) {
  return state.alertChats.includes(chatId);
}

function getAlertChats() {
  return [...state.alertChats];
}

function getLastPrice() {
  return state.lastPrice;
}

function setLastPrice(price) {
  state.lastPrice = price;
  save();
}

module.exports = {
  enableAlerts,
  disableAlerts,
  isAlertsEnabled,
  getAlertChats,
  getLastPrice,
  setLastPrice,
};

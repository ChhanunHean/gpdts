const fs = require('fs');
const path = require('path');

let currentData = null;

function loadInitialData() {
  try {
    const filePath = path.join(__dirname, '../data/event.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      currentData = JSON.parse(raw);
    }
  } catch (e) {
    console.error('Store: failed to load initial event.json', e.message);
  }
}

loadInitialData();

function getData() {
  if (!currentData) {
    loadInitialData();
  }
  return currentData;
}

function saveData(newData) {
  currentData = newData;
  try {
    const filePath = path.join(__dirname, '../data/event.json');
    fs.writeFileSync(filePath, JSON.stringify(newData), 'utf8');
  } catch (e) {
    // Expected on serverless Vercel lambdas with read-only root
  }
  return true;
}

module.exports = { getData, saveData };

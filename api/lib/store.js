const fs = require('fs');
const path = require('path');

const BLOB_URL = 'https://ufgqdcmeisxinoe2.public.blob.vercel-storage.com/gpdts-state.json';
let currentData = null;

function loadLocalFallback() {
  try {
    const filePath = path.join(__dirname, '../data/event.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      currentData = JSON.parse(raw);
    }
  } catch (e) {
    console.error('Store: failed to load local event.json', e.message);
  }
}

// Initial load
loadLocalFallback();

function getData() {
  if (!currentData) {
    loadLocalFallback();
  }
  return currentData;
}

async function getLatestData() {
  try {
    // Attempt fetch from persistent Vercel Blob store
    const res = await fetch(`${BLOB_URL}?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const live = await res.json();
      if (live && live.students && Array.isArray(live.students)) {
        currentData = live;
        return currentData;
      }
    }
  } catch (e) {
    console.warn('Store: could not fetch from Blob, using local fallback:', e.message);
  }
  return getData();
}

async function saveData(newData) {
  currentData = newData;

  // 1. Try writing locally (works in local dev, ignored on serverless)
  try {
    const filePath = path.join(__dirname, '../data/event.json');
    fs.writeFileSync(filePath, JSON.stringify(newData), 'utf8');
  } catch (e) {}

  // 2. Persist to Vercel Blob (permanent across all lambdas, cold starts, and reloads)
  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = require('@vercel/blob');
      await put('gpdts-state.json', JSON.stringify(newData), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true
      });
      console.log('Store: successfully persisted to Vercel Blob');
    }
  } catch (e) {
    console.error('Store: failed to persist to Blob:', e.message);
  }

  return true;
}

module.exports = { getData, getLatestData, saveData };

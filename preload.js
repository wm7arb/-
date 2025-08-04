const { contextBridge } = require('electron');
const fs = require('fs');
const path = require('path');

const tokenPath = path.join(__dirname, 'tokens.txt');

contextBridge.exposeInMainWorld('api', {
  readTokens: () => {
    if (!fs.existsSync(tokenPath)) return [];
    return fs.readFileSync(tokenPath, 'utf-8').split('\n').filter(Boolean);
  },
  saveTokens: (content) => {
    fs.writeFileSync(tokenPath, content.trim());
  }
});

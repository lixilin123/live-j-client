import electron from  'electron';
import path from 'path';
import fs from 'fs';
// const electron = window.require('electron');
// const path = window.require('path');
// const fs = window.require('fs');

class Store {
  constructor(opts) {
    const userDataPath = (electron.app || electron.remote.app).getPath('userData');
    this.path = path.join(userDataPath, opts.configName + '.json');
    this.data = parseDataFile(this.path, opts.defaults);
  }
  get(key) {
    return this.data[key];
  }
  set(key, val) {
    this.data[key] = val;
    fs.writeFileSync(this.path, JSON.stringify(this.data));
  }
}
const parseDataFile = (filePath, defaults) => {
    try {
      return JSON.parse(fs.readFileSync(filePath));
    } catch(error) {
      return defaults;
    }
  }

export default Store;
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');
const readline = require('readline');
const fsPromise = fs.promises;

const rootDir = process.cwd();
const themeRoot = 'example';
const theme = process.argv[2]||'weibo';
const pkgInfo = require(rootDir + '/package.json');

const remoteRepo = "malacca/react-native-splashbg@master";
const remoteApi = "https://data.jsdelivr.com/v1/package/gh/" + remoteRepo;
const remoteFile = path => ("https://cdn.jsdelivr.net/gh/" +remoteRepo+ '/' + themeRoot + '/' + theme + '/' + path);

function stdout(str, headerless) {
  process.stdout.write((headerless ? '' : '\x1b[32mInfo:\x1b[0m ') + str + "\n");
}

function stderr(str) {
  process.stderr.write('\x1b[31mError:\x1b[0m ' + str + "\n");
}

async function confirm(message) {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(message + ' [Y/n]:', async answer => {
        rl.close();
        answer = answer.trim().toLowerCase();
        resolve(answer == '' || [ 'yes', 'y' ].indexOf(answer) > -1);
    });
  });
}

async function download(url, dir, file) {
  await fsPromise.mkdir(dir, {recursive: true});
  const dest = path.join(dir, file);
  const fileStream = fs.createWriteStream(dest);
  return new Promise((resolve, reject) => {
    https.get(url, function(response) {
      response.pipe(fileStream);
      fileStream.on('finish', function() {
        fileStream.close(resolve);
      });
    }).on('error', error => {
      reject(error)
    })
  })
}

function getBody(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode != 200) {
        reject("response statusCode is: " + res.statusCode);
        return;
      }
      var body = '';
      res.on('data', chunk => {
        body += chunk;
      });
      res.on('end', function(){
        resolve(body);
      });
    }).on('error', error => {
      reject(error)
    })
  });
}

async function getJson(url) {
  const body = await getBody(url);
  return JSON.parse(body);
}

async function downFiles(json, topPaths) {
  json.files.forEach(async item => {
    if ('directory' == item.type) {
      await downFiles(item, [...topPaths, item.name]);
    } else if ('file' == item.type) {
      const dir = path.join.apply(null, topPaths).replace('~project~', pkgInfo.name);
      const url = remoteFile(topPaths.join('/') + '/' + item.name).replace('~project~', 'project');
      stdout('  ' + path.join(dir, item.name), true);
      await download(url, path.join(rootDir, dir), item.name);
    }
  })
}

async function init() {
  if (!(await confirm('This may overwrite the project file, continue?'))) {
    return;
  }
  stdout('fecth [' +theme+ '] file list...');
  const parent = [remoteRepo];
  const package = await getJson(remoteApi);
  const themeDir = getSubdir(package, themeRoot + '/' + theme, parent);

  stdout('download [' +theme+ '] Android files...');
  const androidFiles = getSubdir(themeDir, "android", [...parent]);
  await downFiles(androidFiles, ['android']);

  stdout('download [' +theme+ '] iOS files...');
  const iOSFiles = getSubdir(themeDir, "ios/project", [...parent]);
  await downFiles(iOSFiles, ['ios', '~project~']);
}

function getSubdir(json, subdir, parent) {
  let dirs = subdir.split('/'), dir;
  while(undefined !== (dir = dirs.shift())) {
    parent.push(dir);
    if (!Array.isArray(json.files)) {
      throw "get dir [" + parent.join('/') + "] failed";
    }
    json = json.files.find(
      item => "directory" == item.type && dir == item.name
    );
  }
  return json;
}

(async() => {
  try {
    await init();
  } catch (e) {
    stderr(e);
  }
})();

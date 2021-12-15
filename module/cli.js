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

const remoteBranch = 'master';
const remoteRepo = "malacca/react-native-splashbg";
const remoteApi = "https://api.github.com/repos/" +remoteRepo+ '/git/trees/' +remoteBranch+ '?recursive=1';

// api.github.com 可访问, githubusercontent.com 国内访问不顺畅, 下载文件借助 jsdelivr
const lastCommit = {sha: null};
const remoteFile = path => ("https://cdn.jsdelivr.net/gh/" +remoteRepo+ '@' +lastCommit.sha+ '/' + path);
// const remoteFile = path => ("https://raw.githubusercontent.com/" +remoteRepo+ '/' +remoteBranch+ '/' + path);

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

function getBody(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'splashbg',
      }
    }, res => {
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

async function download(url, file) {
  const files = file.split('/');
  const fileName = files.pop();
  const dir = path.join(rootDir, path.join.apply(null, files));
  const dest = path.join(dir, fileName);
  await fsPromise.mkdir(dir, {recursive: true});
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

async function downFiles(tree, topPath) {
  const localDir = topPath.replace('~project~', pkgInfo.name);
  const remoteDir = (themeRoot + '/' + theme + '/' + topPath + '/').replace('~project~', 'project');
  const remoteDirLen = remoteDir.length;
  tree.forEach(async item => {
    if (item.type !== 'blob' || !item.path.startsWith(remoteDir)) {
      return;
    }
    const url = remoteFile(item.path);
    const file = localDir + '/' + item.path.substr(remoteDirLen);
    stdout('  ' + file, true);
    await download(url, file);
  });
}

async function init() {
  if (!(await confirm('This may overwrite the project file, continue?'))) {
    return;
  }
  stdout('fecth [' +theme+ '] file tree...');
  const package = await getJson(remoteApi);
  if (!('tree' in package) || !Array.isArray(package.tree)) {
    throw "get package [" + remoteRepo + "] tree failed";
  }
  lastCommit.sha = package.sha;

  stdout('download [' +theme+ '] Android files...');
  await downFiles(package.tree, 'android');

  stdout('download [' +theme+ '] iOS files...');
  await downFiles(package.tree, 'ios/~project~');
}

(async() => {
  try {
    await init();
  } catch (e) {
    stderr(e);
  }
})();

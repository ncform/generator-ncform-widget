'use strict';

const fs = require('fs');
const childProcess = require('child_process');
const replace = require('replace-in-file');
const logger = require('./logger');

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

/**
 * 根据标识定位位置，并将提供的内容追加到该位置
 *
 * @param {
 *  haystack, // 要处理的内容
 *  splicable, // 追加的内容, 是数组类型，如['', '']。当isAppend=true时，数组中的字符串项会串连成一行；当isAppend=false时，数组中的每一项字符串都会以换行符拼接起来
 *  needle, // 查找的标识
 *  isAppend, // 是否追加到该行，默认是false
 *  appendAfter, // 追加到该行的位置，是插入行首还是行尾。默认是行尾。只有isAppend为true时有效。
 *  insertPrev // 是否插入到该行的前端还是后面。默认是后面。只有isAppend为false时有效
 * }
 *
 * @returns string 处理过后的内容
 */
function rewrite({
  haystack,
  splicable,
  needle,
  isAppend = false,
  appendAfter = true,
  insertPrev = false
}) {
  // Check if splicable is already in the body text
  const re = new RegExp(splicable.map(line => 's*' + escapeRegExp(line)).join('\n'));

  if (re.test(haystack)) {
    return haystack;
  }

  const lines = haystack.split('\n');

  let otherwiseLineIndex = 0;
  lines.forEach((line, i) => {
    if (line.indexOf(needle) !== -1) {
      otherwiseLineIndex = i;
    }
  });

  let spaces = 0;
  while (lines[otherwiseLineIndex].charAt(spaces) === ' ') {
    spaces += 1;
  }

  let spaceStr = '';
  while ((spaces -= 1) >= 0) {
    spaceStr += ' ';
  }

  /**
   * 追加到该行的开始部分: isAppend=true appendAfter=true
   * 追加到该行的末尾部分: isAppend=true appendAfter=false
   * 插入到该行的前面一行: insertPrev=true
   * 追加到该行的后面一行: insertPrev=false default
   */
  if (isAppend) {
    // 追回到该行
    if (appendAfter) {
      lines[otherwiseLineIndex] += splicable.join('');
    } else {
      lines[otherwiseLineIndex] = splicable.join('') + lines[otherwiseLineIndex];
    }
  } else {
    // 插入新行
    const n = insertPrev ? 0 : 1;
    lines.splice(
      otherwiseLineIndex + n,
      0,
      splicable.map(line => spaceStr + line).join('\n')
    );
  }

  return lines.join('\n');
}

/**
 * 根据标识定位位置，并将提供的内容追到该位置，文件将被重写成最新内容
 *
 * @param {
 *  filePath, // 文件路径
 *  splicable, // 追加的内容, 是数组类型，如['', '']。当isAppend=true时，数组中的字符串项会串连成一行；当isAppend=false时，数组中的每一项字符串都会以换行符拼接起来
 *  needle, // 查找的标识
 *  isAppend, // 是否追加到该行，默认是false
 *  appendAfter, // 追加到该行的位置，是插入行首还是行尾。默认是行尾。只有isAppend为true时有效。
 *  insertPrev // 是否插入到该行的前端还是后面。默认是后面。只有isAppend为false时有效
 * }
 */
function rewriteFile({
  filePath,
  splicable,
  needle,
  isAppend = false,
  appendAfter = true,
  insertPrev = false
}) {
  const fullPath = filePath;
  const haystack = fs.readFileSync(fullPath, 'utf8');
  const body = rewrite({
    haystack,
    splicable,
    needle,
    isAppend,
    appendAfter,
    insertPrev
  });

  fs.writeFileSync(fullPath, body);
}

/**
 * 执行控制台命令
 *
 * 注意：不要执行输出内容过多的命令，如`npm i --verbose`，要改成`npm i`。否则会报缓存区溢出的错误
 *
 * @param cmd string
 *
 * @returns promise
 */
function exec(cmd) {
  return new Promise((resolve, reject) => {
    childProcess.exec(cmd, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

/**
 * 替换文件内容
 * @param {String} baseDir
 * @param {Object} replaceInfo {'from keyword': 'to keyword'}
 * @param {Array} ignores ['node_modules/**']
 */
async function replaceFiles(baseDir, replaceInfo, ignores) {
  const from = Object.keys(replaceInfo).map(key => new RegExp(key, 'g'));
  const to = Object.values(replaceInfo);
  const options = {
    files: `${baseDir}/**/*.*`,
    from,
    to,
    ignore: ignores
  };
  try {
    const changes = await replace(options);
    logger.green('Modified files:', changes.join(',\\n'));
  } catch (error) {
    logger.red('Error occurred:', error);
  }
}

module.exports = {
  rewrite,
  rewriteFile,
  exec,
  replaceFiles
};

'use strict';

const chalk = require('chalk');

const log = function(...value) {
  console.log.apply(this, value);
};

log.log = function(...value) {
  console.log.apply(this, value);
};

log.green = function(...value) {
  console.log(chalk.green.apply(this, value));
};

log.blue = function(...value) {
  console.log(chalk.blue.apply(this, value));
};

log.red = function(...value) {
  console.log(chalk.red.apply(this, value));
};

log.yellow = function(...value) {
  console.log(chalk.yellow.apply(this, value));
};

log.magenta = function(...value) {
  console.log(chalk.magenta.apply(this, value));
};

log.cyan = function(...value) {
  console.log(chalk.cyan.apply(this, value));
};

log.white = function(...value) {
  console.log(chalk.white.apply(this, value));
};

log.gray = function(...value) {
  console.log(chalk.gray.apply(this, value));
};

module.exports = log;

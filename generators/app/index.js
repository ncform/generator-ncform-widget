'use strict';

const chalk = require('chalk');
const yosay = require('yosay');
const extend = require('deep-extend');
const s = require('underscore.string');
const Generator = require('yeoman-generator');
const fs = require('fs-extra');

const logger = require('./logger');
const utils = require('./utils');

module.exports = class extends Generator {
  /**
   * Init
   */
  init() {
    this.props = {};
    this.conflicter.force = true; // 冲突直接替换, 不再询问
  }

  /**
   * 检查git是否安装
   */
  checkForGit() {
    return utils.exec('git --version');
  }

  /**
   * 打印欢迎信息
   */
  welcomeMessage() {
    logger.log(yosay(
      'Welcome to the ' + chalk.red('generator-ncform-widget') + ' generator!'
    ));
  }

  /**
   * 询问项目的所在目录名
   */
  promptForFolder() {
    const prompt = {
      name: 'name',
      message: 'What would you like to call your ncform widget?',
      default: 'nc-demo'
    };

    return this.prompt(prompt).then(props => {
      this.props.name = props.name;
    });
  }

  /**
   * Clone seed project
   */
  cloneRepo() {
    logger.green('Cloning the remote seed repo.......');
    return utils
      .exec(
        'git clone https://github.com/ncform/ncform-widget-seed.git --branch master --single-branch ' +
          this.props.name
      )
      .then(() => {
        this.destinationRoot(this.destinationPath(this.props.name));
      });
  }

  /**
   * 删除clone下来的种子项目的git信息
   */
  rmGitInfo() {
    fs.removeSync(this.destinationPath('.git'));
  }

  /**
   * 询问项目的基本信息
   */
  getPrompts() {
    const prompts = [
      {
        name: 'appDescription',
        message: 'How would you describe your ncform widget?',
        default: ''
      },
      {
        name: 'appKeywords',
        message: 'How would you describe your ncform widget in comma seperated keywords?',
        default: 'ncform,widget'
      },
      {
        name: 'appAuthor',
        message: 'What is your company/author name?'
      }
    ];

    return this.prompt(prompts).then(props => {
      this.props.appName = this.props.name;
      this.props.appDescription = props.appDescription;
      this.props.appKeywords = props.appKeywords;
      this.props.appAuthor = props.appAuthor;

      this.props.slugifiedAppName = s(this.props.appName)
        .underscored()
        .slugify()
        .value(); // value: demo-name
      this.props.camelAppName = s(this.props.slugifiedAppName)
        .camelize()
        .value(); // value: demoName
      this.props.firstCapCamelAppName = s(this.props.camelAppName)
        .capitalize()
        .value(); // value: DemoName
      this.props.humanizedAppName = s(this.props.slugifiedAppName)
        .humanize()
        .value(); // value: Demo name
      this.props.titleAppName = s(this.props.humanizedAppName)
        .titleize()
        .value(); // value: Demo Name
    });
  }

  /**
   * 替换关键字标识
   */
  replaceKeywords() {
    return utils.replaceFiles(
      this.destinationPath(),
      {
        // 'Daniel Panel': this.props.titleAppName,
        // '\\[author name\\]': this.props.appAuthor,
        'nc-demo': this.props.slugifiedAppName,
        '@ncform/ncform-widget-seed': this.props.slugifiedAppName,
        'NcDemo': this.props.firstCapCamelAppName,
      },
      ['node_modules/**']
    );
  }

   /**
   * 更新package.json数据
   */
  updatePackage() {
    const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});
    extend(pkg, {
      name: this.props.slugifiedAppName,
      description: this.props.appDescription,
      author: this.props.appAuthor,
      keywords: this.props.appKeywords.split(',')
    });
    return this.fs.writeJSON(this.destinationPath('package.json'), pkg);
  }

  /**
   * 安装依赖module
   */
  install() {
    logger.green('Running npm install for you....');
    logger.green('This may take a couple minutes.');

    this.installDependencies({
      bower: false,
      npm: true,
      callback() {
        logger.log('');
        logger.green('------------------------------------------');
        logger.green('Your ncform widget project is ready!');
        logger.log('');
        logger.green('To Get Started, run the following command:');
        logger.log('');
        logger.yellow('cd ' + this.props.name + ' && npm run serve');
        logger.log('');
        logger.green('Happy Hacking!');
        logger.green('------------------------------------------');
      }
    });
  }
};

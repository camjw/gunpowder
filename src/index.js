const colors = require('colors');
const matchers = require('./matchers');
const Blank = require('./blank')

const gunpowder = {
  SILENT: false
};

const repeat = (str, n) => Array(n).join(str);
const indent = n => repeat('  ', n);
const indentLines = (str, n) => indent(n) + str.replace(/\n/g, `\n${indent(n)}`);

const runEveryAfterEach = () => {
  afterEachStack.forEach((level) => level.forEach(cb => cb()));
};

const runEveryBeforeEach = () => {
  beforeEachStack.forEach((level) => level.forEach(cb => cb()));
};

const summary = { success: 0, fail: 0, disabled: 0 };

const beforeEachStack = [ [] ];
const afterEachStack = [ [] ];

let indentLevel = 0

const collection = (title, cb) => {
  beforeEachStack.push([])
  afterEachStack.push([])

  indentLevel += 1;
  console.log(`\n${indent(indentLevel)}⇨ ${title}`.yellow);
  cb();
  indentLevel -= 1;

  beforeEachStack.pop()
  afterEachStack.pop()
};

waitsForAndRuns = function(escapeFunction, runFunction, escapeTime=5000) {
  // check the escapeFunction every millisecond so as soon as it is met we can escape the function
  let interval = setInterval(function() {
    if (escapeFunction()) {
      clearMe();
      runFunction();
    }
  }, 1);

  // in case we never reach the escapeFunction, we will time out
  // at the escapeTime
  let timeOut = setTimeout(function() {
    clearMe();
    runFunction();
  }, escapeTime);

  // clear the interval and the timeout
  function clearMe(){
    clearInterval(interval);
    clearTimeout(timeOut);
  }
};

const runAsync = (block) => {
  return function() {
    let done = false;
    let complete = function() { done = true; };

    waitsForAndRuns(function() {
      return done;
    }, function() {
      block(complete);
    });
  };
}

function AsyncTest(spec){
    this.spec = spec;
  }

AsyncTest.prototype.ensure = function(description, block){
  ensure(description, runAsync(block));
};


const ensure = (title, cb) => {
  runEveryBeforeEach()

  try{
    cb();
    console.log(`${indent(indentLevel + 1)}${' PASSED '.bgGreen.black} ${title.green}`);
    summary.success += 1;
  } catch(e) {
    console.log(`${indent(indentLevel + 1)}${' FAILED '.bgRed.black} ${title.red}`);
    console.log(indentLines(e.stack.red, indentLevel + 1));
    summary.fail += 1;
  }

  runEveryAfterEach()
};

const xensure = (title, cb) => {
  console.log(`${indent(indentLevel + 1)}${' DISABLED '.bgWhite.black} ${title.gray}`);
  summary.disabled += 1;
};



const assert = (val) => {
  if (val) return true;

  throw new Error('Assertion failed.');
};

Object.assign(assert, matchers);

const end = () => {
  console.log(`\n.......\n`);
  console.log('Test summary:\n');
  console.log(`  Success: ${summary.success}`.green);
  console.log(`  Fail: ${summary.fail}`.red);
  console.log(`  Disabled: ${summary.disabled}\n\n`.gray);

  if (summary.fail > 0) process.exit(1);
  process.exit(0);
};

const beforeAll = cb => cb();

const afterAll = cb => cb();

const beforeEach = (cb) => {
  beforeEachStack[beforeEachStack.length - 1].push(cb);
};

const afterEach = (cb) => {
  afterEachStack[afterEachStack.length - 1].push(cb);
};

const options = { assert, ensure, xensure, end, collection, beforeEach,
                  beforeAll, afterAll, afterEach, Blank, runAsync, AsyncTest,
                  waitsForAndRuns };

module.exports = Object.assign(gunpowder, options);

/**
 * Logger for rstack-agents CLI. Prefixes every line with `[rstack]`.
 */

import chalk from 'chalk';

const PREFIX = chalk.bold.magenta('[rstack]');

export const log = {
  info(message) {
    console.log(`${PREFIX} ${message}`);
  },
  success(message) {
    console.log(`${PREFIX} ${chalk.green(message)}`);
  },
  warn(message) {
    console.warn(`${PREFIX} ${chalk.yellow(message)}`);
  },
  error(message) {
    console.error(`${PREFIX} ${chalk.red(message)}`);
  }
};

export default log;

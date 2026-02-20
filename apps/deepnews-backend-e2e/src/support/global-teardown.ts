import { killPort } from '@nx/node/utils';
/* eslint-disable */

module.exports = async function () {
  // Put clean up logic here (e.g. stopping services, docker-compose, etc.).
  // Hint: `globalThis` is shared between setup and teardown.
  const port = process.env.PORT ? Number(process.env.PORT) : 3335;
  try {
    await killPort(port);
  } catch (e) {
    console.warn(
      `Could not kill port ${port}, it might have already been closed.`
    );
  }
  console.log(globalThis.__TEARDOWN_MESSAGE__);
};

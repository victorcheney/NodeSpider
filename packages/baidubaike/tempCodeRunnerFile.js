try {
    for (let i = 0, len = region.length; i < len; i++) {
      const res = await delay(500, region[i], len, i);
      const key = Object.keys(res)[0];
      const val = Object.values(res)[0];
      // rst += `${key} ${val}\r\n`;
      stream.write(`${key}\t${val}\r\n`);
    }
  } catch (error) {
    console.error(error);
    spinner.stop();
  }
const http = require("http");
const axios = require("axios");
const cheerio = require("cheerio");
const ora = require("ora");

const spinner = ora("Loading unicorns");

setTimeout(() => {
  spinner.color = "yellow";
  spinner.text = "Loading rainbows";
}, 1000);

let region = [];

// 获取国家行政区划
async function fetchCountRegion() {
  try {
    const res = await axios.get(
      "https://baike.baidu.com/item/%E5%B7%B4%E8%A5%BF/5422#4"
    );

    const $ = cheerio.load(res.data);
    const rst = $("div.para");
    rst.each(function (node) {
      const para = $(this);
      if (node === 39) {
        para.children().each(function () {
          region.push($(this).text());
        });
      }
    });
    region = region.map((item) => item.trim()).filter((item) => item);
  } catch (error) {
    console.error(error);
  }

  return region;
}

/* const rst = fetchCountRegion().then((res) => {
  console.log(res);
}); */

// 获取州信息
async function fetchStateInfo(name) {
  let state = { [name]: "" };
  try {
    const res = await axios.get(
      `https://baike.baidu.com/item/${encodeURIComponent(name)}`
    );
    const $ = cheerio.load(res.data);
    $(".basicInfo-item.name").each(function (index) {
      const node = $(this);
      if ("外文名" === node.text()) {
        state[name] = node.next().text().trim();
      }
    });
  } catch (error) {
    console.error(error);
  }

  return state;
}

// 循环获取所有州的外文名称
async function runningLoop() {
  let rst = [];
  spinner.start();
  await fetchCountRegion();
  try {
    for (let i = 0, len = region.length; i < len; i++) {
      const res = await delay(1500, region[i], len, i);
      rst.push(res);
    }
    console.log(rst);
  } catch (error) {
    console.error(error);
  }
}

function delay(ms, name, len, i) {
  return new Promise((resolve, reject) => {
    spinner.text = `[${len}/${i}] ${name} starting...`;
    setTimeout(async function () {
      const res = await fetchStateInfo(name);
      if (i >= len) {
        spinner.stop();
      }
      resolve(res);
    }, ms);
  });
}

runningLoop();

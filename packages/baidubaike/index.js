const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");
const ora = require("ora");
const fse = require("fs-extra");

const filePath = path.join(__dirname, "/dist/brazil.txt");

const spinner = ora("Loading ...");

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
          // region.push($(this).text()); // 名称
          region.push([$(this).text(), $(this).attr("href")]); // href链接
        });
      }
    });
    region = region
      .map((item) => {
        item[0] = item[0].trim();
        return item;
      })
      .filter((item) => item[0] && !item[0].includes("["));
  } catch (error) {
    console.error(error);
  }

  return region;
}

// 获取州信息
async function fetchStateInfo(item) {
  let [name, href] = item;
  let state = { [name]: "" };
  const tempUrl = href ? href : `/item/${encodeURIComponent(name)}`;
  try {
    const res = await axios.get(`https://baike.baidu.com${tempUrl}`);
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
  const stream = fse.createWriteStream(filePath);
  await fetchCountRegion();
  console.log(region);
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
}

function delay(ms, item, len, i) {
  return new Promise((resolve, reject) => {
    spinner.text = `[${len}/${i + 1}] ${item[0]} starting...`;
    setTimeout(async function () {
      const res = await fetchStateInfo(item);
      if (i + 1 >= len) {
        spinner.stop();
      }
      resolve(res);
    }, ms);
  });
}

runningLoop();

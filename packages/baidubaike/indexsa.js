/*
 * @Description: 获取南非行政数据
 * @Author: chenfengtao
 * @Date: 2022-08-18 15:40:54
 * @LastEditors: chenfengtao
 * @LastEditTime: 2022-08-19 17:15:15
 */

const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");
const ora = require("ora");
const fse = require("fs-extra");

const filePath = path.join(__dirname, "/dist/sa.txt");

const spinner = ora("Loading ...");

let region = [];

// 获取国家行政区划
async function fetchCountRegion() {
  try {
    const res = await axios.get(
      "https://baike.baidu.com/item/%E5%8D%97%E9%9D%9E%E5%85%B1%E5%92%8C%E5%9B%BD/1910574?fromtitle=%E5%8D%97%E9%9D%9E&fromid=127666#4"
    );

    const $ = cheerio.load(res.data);
    const rst = $("table td[width='254'] .para");
    rst.each(function (node) {
      const para = $(this);
      region.push($(this).text());
    });
    region = region.map((item) => item.trim()).filter((item) => item);
  } catch (error) {
    console.error(error);
  }

  return region;
}

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
  let rst = "";
  const stream = fse.createWriteStream(filePath);
  spinner.start();
  await fetchCountRegion();
  try {
    for (let i = 0, len = region.length; i < len; i++) {
      const res = await delay(500, region[i], len, i);
      const key = Object.keys(res)[0];
      const val = Object.values(res)[0];
      // rst += `${key} ${val}\r\n`;
      stream.write(`${key}\t${val}\r\n`);
    }
    console.log(rst);
  } catch (error) {
    console.error(error);
  }
}

function delay(ms, name, len, i) {
  return new Promise((resolve, reject) => {
    spinner.text = `[${len}/${i + 1}] ${name} starting...`;
    setTimeout(async function () {
      const res = await fetchStateInfo(name);
      if (i + 1 >= len) {
        spinner.stop();
      }
      resolve(res);
    }, ms);
  });
}

runningLoop();

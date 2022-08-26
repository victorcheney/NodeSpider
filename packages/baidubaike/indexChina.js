/*
 * @Description: 获取中国行政区数据
 * @Author: chenfengtao
 * @Date: 2022-08-18 15:40:54
 * @LastEditors: chenfengtao
 * @LastEditTime: 2022-08-26 17:11:07
 */

const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");
const ora = require("ora");
const fse = require("fs-extra");

const filePath = path.join(__dirname, "/dist/china.txt");

const spinner = ora("Loading ...");

let region = [];

// 获取国家行政区划
async function fetchCountRegion() {
  try {
    const res = await axios.get(
      "https://baike.baidu.com/item/%E7%9C%81%E7%BA%A7%E8%A1%8C%E6%94%BF%E5%8C%BA/4805340"
    );

    const $ = cheerio.load(res.data);
    const rst = $(".para");
    rst.each(function (index, node) {
      const para = $(this);
      if (index > 2 && index < 7) {
        para.children().each(function () {
          region.push([$(this).text(), $(this).attr("href")]); // href链接
        });
      }
    });
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
        const text = node
          .next()
          .text()
          .replace(/\n/g, "")
          .replace(/\[.\]/g, " ")
          .split("/t");
        state[name] = text[0].trim();
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
      const res = await delay(200, region[i], len, i);
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

const puppeteer = require("puppeteer");
const fs = require("fs");
const unique = [];

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: [`--window-size=1680,820`],
    defaultViewport: null
  });
  const listPage = await browser.newPage();
  await listPage.goto("https://www.cpubenchmark.net/CPU_mega_page.html");
  await listPage.waitForSelector(".input-sm");
  await listPage.select(".input-sm", "-1");
  await listPage.waitForSelector(".odd a");
  let cpus = await listPage.evaluate(() => {
    return [...document.querySelectorAll(".odd a, .even a")].map(link => link.href);
  });
  await listPage.close();
  const data = require("./data/cpu.json");
  async function getCPULink() {
    const page = await browser.newPage();
    while (true) {
      const url = cpus.shift();
      if (!url) {
        break;
      }
      try {
        await page.goto(url);
        await page.waitForSelector("li[style*=\"border: solid red\"]");
        const detailsURL = await page.evaluate(() => {
          return document.querySelector("li[style*=\"border: solid red\"] a").href;
        });
        await page.goto(detailsURL);
        await page.waitForSelector(".cpuname");
        // const getText = selector => page.evaluate(selector => document.querySelector(selector)?.textContent, selector);
        /*
        const detailsMap = {
          Class: "class",
          Socket: "socket",
          Clockspeed: "base_clock",
          "Turbo Speed": "turbo_clock",
          Cores: "cores",
          "Typical TDP": "tdp",
          "CPU FirstSeen on Charts": "release",
          "Overall Rank": "passmark_rank"
        }
        */
        const details = {
          name: await page.evaluate(() => document.querySelector(".cpuname")?.textContent),
          stats: await page.evaluate(() => {
            return document.querySelector(".desc").textContent.split("\n").filter(a => /\d/.test(a))
          }),
          /*
          ...(await page.evaluate(detailsMap => {
            return Object.fromEntries([...document.querySelectorAll(".desc p")].map(p => {
              const [key, value] = p.textContent.split(":");
              return [detailsMap[key], value?.trim()];
            }).filter(([key]) => key))
          }, detailsMap))
          */
          ...(await page.evaluate(() => {
            return Object.fromEntries([...document.querySelectorAll("#test-suite-results tr")].map(tr => {
              return [tr.querySelector("th").textContent, tr.querySelector("td").textContent];
            }))
          }))
        }
        data.push(details);
        if (true) {
          fs.writeFileSync("./data/cpu.json", JSON.stringify(data));
        }
        console.log(data.length);
      } catch {
        // just skip anything which errors
        console.log(url);
      }
      
    }
    await page.close();
  }
  for (let i = 0; i < 12; i++) {
    getCPULink();
  }
})();

"li[style*=\"border: solid red\"]"
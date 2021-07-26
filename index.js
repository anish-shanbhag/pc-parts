const puppeteer = require("puppeteer");
const fs = require("fs");

async function writeTemp(data) {
  fs.writeFileSync("./temp.json", JSON.stringify(data, null, 2))
}

async function scrapeCPUs () {
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
  const data = [];
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
        // just retry anything which errors
        console.log(url);
        cpus.push(url);
      }
      
    }
    await page.close();
  }
  for (let i = 0; i < 12; i++) {
    getCPULink();
  }
}

async function cleanCPUs() {
  let cpus = require("./data/cpu.json");
  cpus = cpus.sort((a, b) => a.name.localeCompare(b.name));
  for (const cpu of cpus) {
    const updatedBenchmarks = {};
    for (const key in cpu) {
      if (key != "name" && key != "stats") {
        const newKey = key.toLowerCase().replaceAll(" ", "_");
        const value = parseFloat(cpu[key].match(/[\d\.,]+/)[0].replaceAll(",", ""));
        delete cpu[key];
        updatedBenchmarks[newKey] = value;
      }
    }
    if (!cpu.stats[0].includes(":")) {
      cpu.stats.shift();
    }
    const statsMap = {
      "Class:  (\\w+)": "class",
      "Socket: (.+) Clockspeed": "socket",
      "Clockspeed": ["base_clock"],
      "Turbo Speed": ["turbo_clock"],
      "Cores": ["cores"],
      "Typical TDP": ["tdp"],
      "CPU First Seen on Charts:\\s+(Q.{6})": "release",
      "Overall Rank": ["overall_rank"],
      "\\t(\\d+)": ["cpu_mark_rating"],
      "Single Thread Rating": ["single_thread_rating"],
      "Cross-Platform Rating": ["cross_platform_rating"],
      "Samples": ["samples"],
      "CPU Mark": ["old_cpu_mark_rating"],
      "Thread": ["old_single_thread_rating"]
    }
    for (const stat in statsMap) {
      for (const string of cpu.stats) {
        let regex = stat.includes("(") ? stat : stat + ":\\s+([\\d\\.,]+)";
        const match = string.match(new RegExp(regex));
        if (match) {
          let value = match[1].trim();
          if (Array.isArray(statsMap[stat])) value = parseFloat(value.replaceAll(",", ""));
          cpu[statsMap[stat]] = value;
        }
      }
    }
    delete cpu["stats"];
    Object.assign(cpu, updatedBenchmarks);
  }
  fs.writeFileSync("./data/cpu_cleaned.json", JSON.stringify(cpus, null, 2))
}

cleanCPUs();
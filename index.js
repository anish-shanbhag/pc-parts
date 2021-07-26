const puppeteer = require("puppeteer");
const fs = require("fs");

async function write(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

async function writeTemp(data) {
  write("./temp/json", data);
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
      if (!url) break;
      try {
        await page.goto(url);
        await page.waitForSelector("li[style*=\"border: solid red\"]");
        const detailsURL = await page.evaluate(() => {
          return document.querySelector("li[style*=\"border: solid red\"] a").href;
        });
        await page.goto(detailsURL);
        await page.waitForSelector(".cpuname");
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
        write("./data/cpu.json", data);
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
        const newKey = "test_suite_" + key.toLowerCase().replaceAll(" ", "_");
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
      "CPU First Seen on Charts:\\s+(Q.{6})": "release_quarter",
      "Overall Rank": ["cpu_mark_overall_rank"],
      "\\t(\\d+)": ["cpu_mark_rating"],
      "Single Thread Rating": ["cpu_mark_single_thread_rating"],
      "Cross-Platform Rating": ["cpu_mark_cross_platform_rating"],
      "Samples": ["cpu_mark_samples"],
      "CPU Mark": ["old_cpu_mark_rating"],
      "Thread": ["old_cpu_mark_single_thread_rating"]
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
    if (cpu.release_quarter) {
      const [quarter, year] = cpu.release_quarter.split(" ");
      cpu.release_quarter = (parseInt(year) - 2008) * 4 + parseInt(quarter[1]);
    }
    cpu.name = cpu.name.replace(/ @.+Hz/, "");
    delete cpu["stats"];
    Object.assign(cpu, updatedBenchmarks);
  }
  write("./data/cpu_cleaned.json", cpus);
}

async function filterCPUs() {
  let cpus = require("./data/cpu_cleaned.json");
  write("./data/cpu_filtered.json", cpus.filter(cpu => {
    return ["Desktop", "Laptop"].includes(cpu.class);
  }));
}
//cleanCPUs();
filterCPUs();
const puppeteer = require("puppeteer");
const fs = require("fs");

async function write(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

async function writeTemp(data) {
  write("./temp/json", data);
}

async function startScraping(url) {
  const browser = await puppeteer.launch({
    headless: false,
    args: [`--window-size=1000,700`],
    defaultViewport: null
  });
  const page = await browser.newPage();
  await page.goto(url);
  return [browser, page];
}

async function scrapeCPUMark() {
  const [browser, listPage] = await startScraping(
    "https://www.cpubenchmark.net/CPU_mega_page.html"
  );
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
      "Threads": ["threads"],
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
    if (cpu.name === "AMD Ryzen 5 3500C") cpu.release_quarter = "Q4 2020";
    if (cpu.release_quarter) {
      const [quarter, year] = cpu.release_quarter.split(" ");
      cpu.release_quarter = (parseInt(year) - 2007) * 4 + parseInt(quarter[1]);
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

async function scrapeUserBenchmark() {
  const cpus = require("./data/cpu_userbenchmark.json");
  const remaining = cpus.filter(cpu => !cpu.market_share && cpu.userbenchmark_score === undefined);
  const [browser] = await startScraping(
    "about:blank"
  );
  let completed = cpus.length - remaining.length;
  async function scrape() {
    const cpu = remaining.shift();
    if (!cpu) return;
    // await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 5000));
    console.log("Starting " + cpu.name);
    const page = await browser.newPage();
    let intercept = false;
    await page.setRequestInterception(true);
    page.on("request", req => {
      if (!intercept) { req.continue(); return; }
      if (req.resourceType() === "font" || req.resourceType() === "image") {
        req.abort();
      } else if (req.resourceType() === "stylesheet" && intercept) {
        req.abort();
      } else {
        req.continue();
      }
    });
    try {
      await page.goto("https://cpu.userbenchmark.com/Search?searchTerm=" + cpu.name.replaceAll("-", " "), { waitFor: "domcontentloaded" });
      await page.waitForSelector(".stealthlink, #searchForm, .btn-success");
      if (await page.$(".btn-success")) {
        console.log("Manually overriding");
        await page.evaluate(() => document.querySelector(".btn-success").click());
        await page.waitForSelector(".stealthlink, #searchForm");
      }
      if (await page.$("#searchForm")) {
        const link = await page.$(".tl-tag");
        if (link) {
          await page.goto(await page.$eval(".tl-tag", a => a.href), { waitFor: "domcontentloaded" });
          await page.waitForSelector(".stealthlink");
        } else {
          // console.log("Skipped " + cpu.name);
          await page.close();
          console.log(++completed + " completed (skipped " + cpu.name + ")");
          cpu.market_share = {};
          write("./data/cpu_userbenchmark.json", cpus);
          scrape();
          return;
        }
      }
      const stats = await page.evaluate(cpu => {
        const stats = {};
        const efpsElement = document.querySelector(".productgrid-cap.semi-strong");
        if (efpsElement) {
          stats.userbenchmark_efps = parseInt(efpsElement.textContent.split(" ")[1]);
        }
        const conclusion = document.querySelector(".conclusion").textContent.split(" ");
        stats.userbenchmark_score = parseFloat(conclusion[3].slice(0, -1));
        stats.userbenchmark_rank = parseInt(conclusion[4].slice(1, -2));
        const samplesText = document.querySelector(".lighterblacktext.medp").textContent;
        stats.userbenchmark_samples = parseInt(samplesText.split(" ")[2].replaceAll(",", ""));
        const benchmarkNames = ["memory_latency", "1_core", "2_core", "4_core", "8_core", "64_core"];
        [...document.querySelectorAll(".mcs-hl-col")].forEach(td => {
          const value = parseFloat(td.textContent.split(" ")[1].replaceAll(",", ""));
          stats["userbenchmark_" + benchmarkNames.shift()] = value;
        });
        if (window.data) {
          stats.market_share = cpu.market_share ?? {};
          window.data.labels.forEach((label, i) => {
            stats.market_share[label] = window.data.datasets[0].data[i];
          });
        }
        return stats;
      }, cpu);
      if (stats.market_share) {
        const url = await page.evaluate(() => window.location.href);
        for (let year = 2020; year > 2015; year--) {
          intercept = false;
          await page.goto(`https://web.archive.org/web/${year}*/${url}`, { waitFor: "domcontentloaded" });
          await page.waitForSelector(".month-day-container, .error");
          if (await page.$(".error")) {
            console.log(`Archive doesn't exist for ${cpu.name} (skipping)`);
            break;
          } else if (await page.$(".s2xx")) {
            const archiveUrl = await page.evaluate(() => {
              const div = [...document.querySelectorAll(".s2xx")].pop().parentElement.parentElement;
              return div.querySelector("a").href;
            });
            const start = Date.now();
            intercept = true;
            page.goto(archiveUrl).catch(() => { });
            await page.waitForFunction(() => {
              return window.data || document.querySelector(".supermutedtext, .btn-success") || location.href.includes("ipblacklisted");
            }, { polling: 500, timeout: 60000 });
            stats.market_share = await page.evaluate(async stats => {
              if (window.data) {
                window.data.labels.forEach((label, i) => {
                  stats.market_share[label] = window.data.datasets[0].data[i];
                });
              }
              return stats.market_share;
            }, stats);
            console.log(`Done with ${year} for ${cpu.name} in ${Date.now() - start} ms`);
          }
        }
      }
      Object.assign(cpu, stats);
      write("./data/cpu_userbenchmark.json", cpus);
      console.log(++completed + " completed (" + cpu.name + " just finished)");
      await page.close();
      scrape();
    } catch (e) {
      console.log("Retrying " + cpu.name + " due to timeout");
      remaining.push(cpu);
      await page.close(); 
      await new Promise(resolve => setTimeout(resolve, 30000));
      scrape();
    }
  }
  for (let i = 0; i < 1; i++) {
    scrape();
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  write("./data/cpu_userbenchmark.json", cpus);
}
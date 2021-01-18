import puppeteer from "puppeteer";
import d3 from "d3";
import fs from "fs/promises";


const dashboardUrl = "https://datastudio.google.com/embed/reporting/c14a5cfc-cab7-4812-848c-0369173148ab/page/hOMwB";
const dataFile = "data/vaccines_cumulative.csv";

const today = d3.timeFormat("%Y-%m-%d")(d3.utcHour.offset(Date.now(), -2));
const yesterday = d3.timeFormat("%Y-%m-%d")(d3.timeDay.offset(Date.parse(today), -1));

const vaccinesTotal = await getTotalVaccinations();
const vaccineData = await getFileContent();
vaccineData.push(`${yesterday},Belgium,${vaccinesTotal}`);
await writeFileContent(vaccineData);

async function getTotalVaccinations() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(dashboardUrl);
  await page.waitForTimeout(5000);
  const totalVaccinated = await page.evaluate(() => +document.querySelector('.scorecard-component').textContent.trim().replaceAll(/[.,]/g, ""));
  await browser.close();
  return totalVaccinated;
}

async function getFileContent() {
  return (await fs.readFile(dataFile, 'utf8'))
    .split("\n")
    .filter(line => !line.includes(yesterday));
}

async function writeFileContent(content) {
  return fs.writeFile(dataFile, content.join("\n"), "utf8");
}


import puppeteer from "puppeteer";
import d3 from "d3";
import fs from "fs/promises";


const dashboardUrl = "https://datastudio.google.com/embed/reporting/c14a5cfc-cab7-4812-848c-0369173148ab/page/hOMwB";
const dataFile = "data/vaccines_cumulative.csv";

const today = d3.timeFormat("%Y-%m-%d")(d3.utcHour.offset(Date.now(), -2));
const yesterday = d3.timeFormat("%Y-%m-%d")(d3.timeDay.offset(Date.parse(today), -1));

const vaccinesTotal = await getTotalVaccinations();
const vaccineData = await getFileContent();
vaccineData.push(`"${yesterday}","Belgium",${vaccinesTotal.belgium}`);
vaccineData.push(`"${yesterday}","Brussels",${vaccinesTotal.brussels}`);
vaccineData.push(`"${yesterday}","Flanders",${vaccinesTotal.flanders}`);
vaccineData.push(`"${yesterday}","Wallonia",${vaccinesTotal.wallonia}`);
await writeFileContent(vaccineData);

async function getTotalVaccinations() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(dashboardUrl);
  await page.waitForTimeout(10000);
  const belgiumVaccinated = await page.evaluate(() => +document.querySelector('.scorecard-component').textContent.trim().replaceAll(/[.,]/g, ""));
  const brusselsVaccinated = await page.evaluate(() => +document.querySelector('[title="Brussels"]').parentElement.querySelector(":nth-child(2)").textContent.trim().replaceAll(/[.,]/g, ""));
  const flandersVaccinated = await page.evaluate(() => +document.querySelector('[title="Flanders"]').parentElement.querySelector(":nth-child(2)").textContent.trim().replaceAll(/[.,]/g, ""));
  const walloniaVaccinated = await page.evaluate(() => +document.querySelector('[title="Wallonia"]').parentElement.querySelector(":nth-child(2)").textContent.trim().replaceAll(/[.,]/g, ""));
  await browser.close();
  return {belgium: belgiumVaccinated, brussels: brusselsVaccinated, flanders: flandersVaccinated, wallonia: walloniaVaccinated};
}

async function getFileContent() {
  return (await fs.readFile(dataFile, 'utf8'))
    .split("\n")
    .filter(line => !line.includes(yesterday))
    .filter(line => line !== "");
}

async function writeFileContent(content) {
  return fs.writeFile(dataFile, content.join("\n"), "utf8");
}


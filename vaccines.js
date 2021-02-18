import d3 from "d3";
import fetch from "node-fetch";
import fs from "fs/promises";

const fileUrl = "https://epistat.sciensano.be/Data/COVID19BE_VACC.json";
const dataFile = "data/vaccines_cumulative.csv";

const today = d3.timeFormat("%Y-%m-%d")(d3.utcHour.offset(Date.now(), -2));
const yesterday = d3.timeFormat("%Y-%m-%d")(d3.timeDay.offset(Date.parse(today), -2));

const vaccinesTotal = await getTotalVaccinations();
const vaccineData = await getFileContent();
vaccineData.push(`"${yesterday}","Belgium",${vaccinesTotal.belgium}`);
vaccineData.push(`"${yesterday}","Brussels",${vaccinesTotal.brussels}`);
vaccineData.push(`"${yesterday}","Flanders",${vaccinesTotal.flanders}`);
vaccineData.push(`"${yesterday}","Wallonia",${vaccinesTotal.wallonia}`);
vaccineData.push(`"${yesterday}","Ostbelgien",${vaccinesTotal.ostbelgien}`);
await writeFileContent(vaccineData);

async function getTotalVaccinations() {
  const rawData = await (await fetch(fileUrl)).json();
  const belgiumVaccinated = d3.sum(rawData, d => d.COUNT);
  const brusselsVaccinated = d3.sum(rawData.filter(d => d.REGION === "Brussels"), d => d.COUNT);
  const flandersVaccinated = d3.sum(rawData.filter(d => d.REGION === "Flanders"), d => d.COUNT);
  const walloniaVaccinated = d3.sum(rawData.filter(d => d.REGION === "Wallonia"), d => d.COUNT);
  const ostbelgienVaccinated = d3.sum(rawData.filter(d => d.REGION === "Ostbelgien"), d => d.COUNT);
  return {belgium: belgiumVaccinated, brussels: brusselsVaccinated, flanders: flandersVaccinated, wallonia: walloniaVaccinated, ostbelgien: ostbelgienVaccinated};
}

async function getFileContent() {
  console.log(yesterday);
  return (await fs.readFile(dataFile, 'utf8'))
    .split("\n")
    .filter(line => !line.includes(yesterday))
    .filter(line => line !== "");
}

async function writeFileContent(content) {
  return fs.writeFile(dataFile, content.join("\n"), "utf8");
}


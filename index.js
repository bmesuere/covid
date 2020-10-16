import fs from "fs/promises";
import fetch from "node-fetch";
import d3 from "d3";

const casesUrl = "https://epistat.sciensano.be/Data/COVID19BE_CASES_AGESEX.json";
const testsUrl = "https://epistat.sciensano.be/Data/COVID19BE_tests.json";
const hospiUrl = "https://epistat.sciensano.be/Data/COVID19BE_HOSP.json";
const deathsUrl = "https://epistat.sciensano.be/Data/COVID19BE_MORT.json";

// we only want it to be a new day after 4 am -> -4
// utc offset -> +2
const today = d3.timeFormat("%Y-%m-%d")(d3.utcHour.offset(Date.now(), -2));
const d_1 = d3.timeFormat("%Y-%m-%d")(d3.timeDay.offset(Date.parse(today), -1));
const d_2 = d3.timeFormat("%Y-%m-%d")(d3.timeDay.offset(Date.parse(today), -2));
const d_3 = d3.timeFormat("%Y-%m-%d")(d3.timeDay.offset(Date.parse(today), -3));

async function processData(url, key, w = 7) {
  const rawData = await (await fetch(url)).json();
  const groupedByDay = d3.rollup(rawData, v => d3.sum(v, d => d[key]), d => d.DATE);
  const firstDay = rawData.map(d => d.DATE).filter(d => d).sort()[0];
  const result = [];
  let i = 0;

  for (let date = firstDay; date !== today; date = addDay(date)) {
    const element = {DATE: date};
    const value = groupedByDay.get(date) || 0;
    const avg = (d3.sum(result.slice(-1 * (w - 1)), d => d[key]) + value) / w;

    element[key] = value;
    element["AVERAGE"] = avg;

    i++;
    result.push(element);
  }

  return result;
}

function addDay(date) {
  return d3.timeFormat("%Y-%m-%d")(d3.timeDay.offset(Date.parse(date), 1));
}

function CSVLine(data) {
  return data.map(d => JSON.stringify(d)).join(",");
}

function toCSV(data) {
  let result = [CSVLine(Object.keys(data[0]))];
  return result.concat(data.map(d => CSVLine(Object.values(d)))).join("\n");
}

async function generateFile(url, field, filename, filter = []) {
  let data = await processData(url, field);
  data = data.filter(d => !filter.includes(d.DATE));
  await fs.writeFile(filename, toCSV(data));
}

generateFile(casesUrl, "CASES", "data/cases.csv", [today, d_1, d_2, d_3]);
generateFile(testsUrl, "TESTS_ALL", "data/tests.csv", [today, d_1, d_2, d_3]);
generateFile(hospiUrl, "NEW_IN", "data/hospi.csv", [today]);
generateFile(deathsUrl, "DEATHS", "data/deaths.csv", [today, d_1, d_2, d_3]);
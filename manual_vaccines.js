import fs from "fs/promises";
import d3 from "d3";

let result = [];
const outputFile = "data/manual_VACC.csv";
const header = ["Date", "Region", "Province", "AgeGroup", "Gender", "PartlyVaccinated", "FullyVaccinated"];
const regions = ["Brussels", "Flanders", "Wallonia"];
const dateFormat = d3.timeFormat("%Y-%m-%d");

for (let i = 0; i < regions.length; i++) {
  const region = regions[i];
  const data = await getFileContent("csv/" + region + ".csv");
  data.forEach(line => {
    result.push([dateFormat(new Date(line[0])), region, "NA", "NA", "NA", +line[1], line[2] ? +line[2] : 0]);
  });
}

result.sort((a, b) => d3.ascending(a[0], b[0]));
let csv = CSVLine(header) + "\n";
csv += toCSV(result);
await fs.writeFile(outputFile, csv);


async function getFileContent(file) {
  return (await fs.readFile(file, 'utf8'))
    .split("\r\n")
    .filter(line => !line.includes("Date"))
    .map(line => line.split(","))
    .map(line => [line[0] + line[1], line[2], line[3]]);
}

function CSVLine(data) {
  return data.map(d => JSON.stringify(d)).join(",");
}

function toCSV(data) {
  return data.map(d => CSVLine(d)).join("\n");
}
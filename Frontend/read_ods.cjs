const xlsx = require('xlsx');
const fs = require('fs');

try {
    const workbook = xlsx.readFile("D:\\NexusMicro\\DOC's\\confecciones JULIO.ods");
    const data = {};
    workbook.SheetNames.forEach(sheetName => {
        data[sheetName] = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 }).slice(0, 100); 
    });
    fs.writeFileSync('D:\\NexusMicro\\Frontend\\ods_dump.json', JSON.stringify(data, null, 2));
    console.log("Dump successful.");
} catch (e) {
    console.error("Error reading file:", e);
}

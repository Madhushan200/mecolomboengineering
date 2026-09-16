const ExcelJS = require('exceljs');
const fs = require('fs');

async function inspect() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('C:\\Users\\ME\\Downloads\\COSTING SIMPLIFIED.xlsx');
  
  console.log('Worksheet Count:', wb.worksheets.length);
  wb.eachSheet((ws) => {
    console.log(`\n================ SHEET: ${ws.name} (Rows: ${ws.rowCount}, Cols: ${ws.columnCount}) ================`);
    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const rowVals = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        let val = cell.value;
        if (val && typeof val === 'object') {
          if (val.formula) val = `[FORMULA: =${val.formula} => ${val.result}]`;
          else if (val.richText) val = val.richText.map(t => t.text).join('');
          else if (val.text) val = val.text;
        }
        rowVals.push(`C${colNumber}: ${val}`);
      });
      if (rowVals.length > 0) {
        console.log(`R${rowNumber} | ` + rowVals.join(' | '));
      }
    });
  });
}

inspect().catch(err => console.error('Error reading excel:', err));

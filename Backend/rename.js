const fs = require('fs');
const path = require('path');

const directories = [
  path.join(__dirname, 'src', 'controllers'),
  path.join(__dirname, 'src', 'services'),
];

const routesDir = path.join(__dirname, 'src', 'routes');
const controllersDir = path.join(__dirname, 'src', 'controllers');

// Step 1: Rename files in controllers and services
const renames = [];

for (const dir of directories) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.match(/^[A-Z]/) && file.endsWith('.js')) {
      const oldPath = path.join(dir, file);
      // Windows is case-insensitive, we rename to temp first
      const newFileName = file.charAt(0).toLowerCase() + file.slice(1);
      const tempPath = path.join(dir, 'TEMP_' + newFileName);
      const newPath = path.join(dir, newFileName);
      
      fs.renameSync(oldPath, tempPath);
      fs.renameSync(tempPath, newPath);
      console.log(`Renamed ${file} to ${newFileName} in ${path.basename(dir)}`);
      
      renames.push({ old: file.replace('.js', ''), new: newFileName.replace('.js', '') });
    }
  }
}

// Step 2: Update required statements in routes
if (fs.existsSync(routesDir)) {
  const routesFiles = fs.readdirSync(routesDir);
  for (const file of routesFiles) {
    if (file.endsWith('.js')) {
      const filePath = path.join(routesDir, file);
      let content = fs.readFileSync(filePath, 'utf8');
      let changed = false;
      
      for (const mapping of renames) {
        // e.g., "../controllers/Category.controller" -> "../controllers/category.controller"
        const oldImport = `../controllers/${mapping.old}`;
        const newImport = `../controllers/${mapping.new}`;
        if (content.includes(oldImport)) {
          content = content.replace(new RegExp(oldImport, 'g'), newImport);
          changed = true;
        }
      }
      
      if (changed) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated imports in ${file}`);
      }
    }
  }
}

// Step 3: Update required statements in controllers (they might import services)
// Note: We'll do a simple generic replace in controllers
for (const file of fs.readdirSync(controllersDir)) {
  if (file.endsWith('.js')) {
    const filePath = path.join(controllersDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;
    for (const mapping of renames) {
      const oldImport = `../services/${mapping.old}`;
      const newImport = `../services/${mapping.new}`;
      if (content.includes(oldImport)) {
        content = content.replace(new RegExp(oldImport, 'g'), newImport);
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated imports in ${file}`);
    }
  }
}

console.log("Renaming process completed successfully.");

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const modulesDir = path.join(srcDir, 'modules');

// Helper to find all JS files
function getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getAllFiles(filePath, fileList);
        } else if (file.endsWith('.js')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const allFiles = getAllFiles(modulesDir);

// Map of all modules: basename -> absolute path
const fileMap = {};
allFiles.forEach(f => {
    fileMap[path.basename(f, '.js')] = f;
});

allFiles.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // 1. Fix any require that contains 'modules/' but is broken
    // The previous script might have generated requires like require('../../modules/auth/authController')
    // We can clean this up by finding the actual file and using path.relative
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
    
    content = content.replace(requireRegex, (match, importStr) => {
        // If it points to models, services, middlewares etc that stayed in src/
        // they should be ../../middlewares/xxx since we are in src/modules/domain/
        // But let's only fix the broken ones that point to moved files
        
        const baseName = path.basename(importStr, '.js').toLowerCase();
        
        // Find matching key case-insensitively
        const matchedKey = Object.keys(fileMap).find(k => k.toLowerCase() === baseName);
        
        if (matchedKey) {
            const targetPath = fileMap[matchedKey];
            let relPath = path.relative(path.dirname(filePath), targetPath);
            relPath = relPath.replace(/\\/g, '/'); // Windows to Unix slashes
            relPath = relPath.replace(/\.js$/, ''); // Remove extension
            
            if (!relPath.startsWith('.')) {
                relPath = './' + relPath;
            }
            
            changed = true;
            return `require('${relPath}')`;
        }
        
        // Fix for files that weren't moved (like middlewares) but the depth changed.
        // If it starts with ../../../modules, it's definitely broken
        if (importStr.includes('modules/')) {
             // Already handled by the fileMap block above if the file exists
        }

        return match;
    });

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
    }
});

console.log('Imports fixed!');

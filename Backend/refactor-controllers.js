const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'src', 'controllers');

function refactorControllers() {
    const files = fs.readdirSync(controllersDir).filter(f => f.endsWith('.js'));
    let totalChanges = 0;

    for (const file of files) {
        const filePath = path.join(controllersDir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;

        // 1. Add "next" argument to async controller functions.
        // e.g. const createUser = async (req, res) => {  -> const createUser = async (req, res, next) => {
        content = content.replace(/async\s*\(\s*req\s*,\s*res\s*\)\s*=>/g, 'async (req, res, next) =>');

        // 2. Replace catch blocks:
        // catch (error) { res.status(400).json({ success: false, message: error.message }); }
        // or catch (error) { res.status(500).json(...) }
        // With catch (error) { next(error); }
        content = content.replace(/catch\s*\(\s*(error|err|e)\s*\)\s*\{\s*(return\s+)?res\.status\([^)]+\)\.json\([^)]+\)\;?\s*\}/g, 'catch ($1) {\n        next($1);\n    }');

        // Try more greedy match if multi-line json payload
        // E.g.: catch (error) {
        //     res.status(400).json({
        //         success: false,
        //         message: error.message
        //     });
        // }
        // Replace with simply `next(error);`
        content = content.replace(/catch\s*\(\s*(error|err|e)\s*\)\s*\{\s*(return\s+)?res\.status\(\d{3}\)\.json\(\{[\s\S]*?\}\)\;?\s*\}/g, 'catch ($1) {\n        next($1);\n    }');

        // 3. Optional: replace success responses with res.success
        // Actually, returning res.status(200).json({ success: true, data: result }) is mostly fine, we could leave it
        // Or we just rely on `res.success(result)`. Let's leave the success path as is, as it's already consistent enough (success: true, data: ...)

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Refactored: ${file}`);
            totalChanges++;
        }
    }
    
    console.log(`\n🎉 Refactoring complete. Modified ${totalChanges} files.`);
}

refactorControllers();

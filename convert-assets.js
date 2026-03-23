// convert-obj-to-glb.mjs
import obj2gltf from 'obj2gltf';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const srcDir = path.join(__dirname, 'assets', 'OBJ', 'weapons');
const destDir = path.join(__dirname, 'public', 'assets', 'glb', 'weapons');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

function getFiles(dir, allFiles = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getFiles(fullPath, allFiles);
        } else if (file.toLowerCase().endsWith('.obj')) {
            allFiles.push(fullPath);
        }
    }
    return allFiles;
}

const objFiles = getFiles(srcDir);
const total = objFiles.length;
let completed = 0;
let failed = 0;

console.log(`\n🚀 Starting conversion of ${total} .obj files using obj2gltf...\n`);

const options = {
    binary: true,
    // You can add more options here if needed, e.g.:
    // materials: true,
    // metallicRoughness: true,
    // specularGlossiness: false,
};

async function convertFile(objPath) {
    const relative = path.relative(srcDir, objPath);
    const glbPath = path.join(destDir, relative.replace(/\.obj$/i, '.glb'));
    const glbDir = path.dirname(glbPath);

    if (!fs.existsSync(glbDir)) {
        fs.mkdirSync(glbDir, { recursive: true });
    }

    try {
        const glbBuffer = await obj2gltf(objPath, options);
        fs.writeFileSync(glbPath, glbBuffer);
        completed++;
        console.log(`✅ [${completed}/${total}] CONVERTED: ${relative}`);
    } catch (error) {
        completed++;
        failed++;
        console.error(`❌ [${completed}/${total}] FAILED: ${relative} → ${error.message}`);
    }
}

async function main() {
    for (const file of objFiles) {
        await convertFile(file);
    }

    console.log('\n' + '─'.repeat(40));
    console.log('         Conversion Finished');
    console.log('─'.repeat(40));
    console.log(`Total files:     ${total}`);
    console.log(`Successfully converted: ${completed - failed}`);
    console.log(`Failed:          ${failed}`);
    console.log('─'.repeat(40) + '\n');
}

main().catch(err => {
    console.error('Unexpected error during batch conversion:', err);
    process.exitCode = 1;
});
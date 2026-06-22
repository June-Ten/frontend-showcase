import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const roots = ['src/assets', 'public']
const quality = 80

function walkPngFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkPngFiles(fullPath, files)
    } else if (/\.png$/i.test(entry.name)) {
      files.push(fullPath)
    }
  }

  return files
}

let converted = 0
let skipped = 0
let failed = 0

for (const root of roots) {
  const pngFiles = walkPngFiles(root)

  for (const pngPath of pngFiles) {
    const webpPath = pngPath.replace(/\.png$/i, '.webp')

    try {
      const pngStat = fs.statSync(pngPath)
      const webpExists = fs.existsSync(webpPath)
      const webpStat = webpExists ? fs.statSync(webpPath) : null

      if (webpStat && webpStat.mtimeMs >= pngStat.mtimeMs) {
        skipped += 1
        continue
      }

      await sharp(pngPath).webp({ quality }).toFile(webpPath)

      const before = (pngStat.size / 1024).toFixed(1)
      const after = (fs.statSync(webpPath).size / 1024).toFixed(1)
      const ratio = ((1 - fs.statSync(webpPath).size / pngStat.size) * 100).toFixed(1)
      console.log(`${pngPath} -> ${webpPath} (${before}KB -> ${after}KB, -${ratio}%)`)
      converted += 1
    } catch (error) {
      failed += 1
      console.error(`Failed: ${pngPath}`, error)
    }
  }
}

console.log(`\nDone. converted=${converted}, skipped=${skipped}, failed=${failed}`)

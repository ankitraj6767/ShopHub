import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function getFiles(dir) {
  const result = [];
  const files = readdirSync(dir);
  for (const file of files) {
    const fullPath = join(dir, file);
    if (statSync(fullPath).isDirectory()) {
      result.push(...getFiles(fullPath));
    } else if (fullPath.endsWith('.jsx')) {
      result.push(fullPath);
    }
  }
  return result;
}

const files = getFiles('frontend/src/components/ui');

files.forEach(file => {
  const content = readFileSync(file, 'utf-8');
  const buttonRegex = /<button[^>]*>[\s\S]*?<\/button>/g;
  let match;
  while ((match = buttonRegex.exec(content)) !== null) {
    const buttonTagFull = match[0];
    const openTagMatch = buttonTagFull.match(/<button[^>]*>/);
    if (!openTagMatch) continue;

    const openTag = openTagMatch[0];
    const innerHtml = buttonTagFull.replace(openTag, '').replace(/<\/button>$/, '');

    const textOnly = innerHtml.replace(/<[^>]+>/g, '').trim();

    if (!openTag.includes('aria-label') && (textOnly.length === 0 || textOnly.match(/^[0-9]+$/))) {
      console.log(`File: ${file}`);
      console.log(`Missing aria-label on icon button: \n${openTag}\n${innerHtml}\n</button>\n`);
    }
  }
});

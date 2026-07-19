import { readFileSync } from 'fs';
const content = readFileSync('frontend/src/components/ui/LiveChatWidget.jsx', 'utf-8');
const buttonRegex = /<button[^>]*>[\s\S]*?<\/button>/g;
let match;
while ((match = buttonRegex.exec(content)) !== null) {
  const buttonTag = match[0];
  if (!buttonTag.includes('aria-label') && (buttonTag.includes('Fi') || buttonTag.includes('Icon'))) {
    console.log(buttonTag);
    console.log("----");
  }
}

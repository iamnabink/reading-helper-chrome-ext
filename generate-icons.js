import sharp from 'sharp';
import { existsSync } from 'fs';
import { join } from 'path';

const iconSizes = [16, 32, 48, 128];
const sourceIcon = 'icons/icon.png';
const outputDir = 'icons';

async function generateIcons() {
  try {
    // Check if source icon exists
    if (!existsSync(sourceIcon)) {
      console.error(`❌ Source icon not found: ${sourceIcon}`);
      process.exit(1);
    }

    console.log(`📸 Generating icons from ${sourceIcon}...`);

    // Generate each size
    for (const size of iconSizes) {
      const outputPath = join(outputDir, `icon${size}.png`);
      
      await sharp(sourceIcon)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ Generated ${outputPath} (${size}x${size})`);
    }

    console.log('\n🎉 All icons generated successfully!');
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

generateIcons();


const Jimp = require('jimp');

async function removeBlackBackground(inputPath, outputPath) {
    try {
        const image = await Jimp.read(inputPath);
        
        // Loop over every pixel
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
            var red   = this.bitmap.data[idx + 0];
            var green = this.bitmap.data[idx + 1];
            var blue  = this.bitmap.data[idx + 2];
            
            // The black background is very dark. 
            // The logo has vibrant colors. Let's make anything below a threshold transparent.
            if (red < 45 && green < 45 && blue < 45) {
                this.bitmap.data[idx + 3] = 0; // Set Alpha to 0
            } else {
                // simple anti-aliasing blending for near black colors
                if (red < 70 && green < 70 && blue < 70) {
                    this.bitmap.data[idx + 3] = 100; // Semi transparent for edges
                }
            }
        });

        await image.writeAsync(outputPath);
        console.log('Successfully removed background and saved to ' + outputPath);
    } catch (error) {
        console.error('Error processing image:', error);
    }
}

async function run() {
    await removeBlackBackground('C:\\Users\\AKHIL\\Downloads\\LOGO.jpeg', 'd:\\AKHIL\\ESTIMATION\\frontend\\public\\logo.png');
    // For the assets folder, just copy the new transparent one over
    const fs = require('fs');
    fs.copyFileSync('d:\\AKHIL\\ESTIMATION\\frontend\\public\\logo.png', 'd:\\AKHIL\\ESTIMATION\\frontend\\src\\assets\\logo.jpg');
    console.log('Copied to src/assets as well.');
}

run();

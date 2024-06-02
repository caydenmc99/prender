const puppeteer = require("puppeteer");
require("dotenv").config();

const scrapeLogic = async () => {
  const browser = await puppeteer.launch({
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ],
    executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
  });

  const page = await browser.newPage();

  // Function to perform the scraping
  const scrape = async () => {
    try {
      await page.goto("https://hrznlabs.com/");

      // Extract all the text from the page
      const pageContent = await page.evaluate(() => document.body.innerText);

      // Print the extracted text
      console.log(pageContent);
    } catch (e) {
      console.error(e);
    }
  };

  // Run the scraping function every 10 seconds
  setInterval(scrape, 10000);
};

// Run the scrapeLogic function when the script is executed
scrapeLogic();
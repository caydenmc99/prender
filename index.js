const express = require("express");
const puppeteer = require("puppeteer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

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

  const scrape = async () => {
    try {
      await page.goto("https://www.aiamastery.com/", { timeout: 30000 });

      // Extract all the text from the page
      const pageContent = await page.evaluate(() => document.body.innerText);

      // Print the extracted text
      console.log(pageContent);
    } catch (e) {
      console.error("Error during scraping:", e);
    }
  };

  // Run the scraping function every 10 seconds
  setInterval(scrape, 30000);
};

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  // Start the scraping process
  scrapeLogic();
});
const puppeteer = require("puppeteer");
const express = require("express");
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

  // Function to perform the scraping
  const scrape = async () => {
    try {
      await page.goto("https://hrznlabs.com/", { timeout: 6000 }); // Increase the timeout to 60 seconds

      // Extract all the text from the page
      const pageContent = await page.evaluate(() => document.body.innerText);

      // Print the extracted text
      console.log(pageContent);
    } catch (e) {
      console.error("Error during scraping:", e);
    }
  };

  // Run the scraping function every 10 seconds
  setInterval(scrape, 10000);
};

// Function to log a message every 10 seconds
const logMessage = () => {
  console.log("Server is still running...");
};

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  // Run the scrapeLogic function when the server starts
  scrapeLogic();
  // Log a message every 10 seconds
  setInterval(logMessage, 10000);
});
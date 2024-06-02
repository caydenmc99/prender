const puppeteer = require("puppeteer");
require("dotenv").config();

const scrapeLogic = async (res) => {
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

  try {
    const page = await browser.newPage();

    await page.goto("https://www.aiamastery.com/", { timeout: 30000 }); // Increase the timeout to 60 seconds

    // Extract all the text from the page
    const pageContent = await page.evaluate(() => document.body.innerText);

    // Print the extracted text
    console.log(pageContent);
    res.send(pageContent);
  } catch (e) {
    console.error("Error during scraping:", e);
    res.send(`Something went wrong while running Puppeteer: ${e}`);
  } finally {
    await browser.close();
  }
};

module.exports = { scrapeLogic };
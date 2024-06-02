const axios = require("axios");
const fs = require("fs");
const puppeteer = require("puppeteer");
const express = require("express");
const Parser = require("rss-parser");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

// Create an instance of the Parser class
const parser = new Parser();

// Hardcoded configuration
const config = {
  rssUrl:
    "https://www.upwork.com/ab/feed/jobs/rss?paging=NaN-undefined&q=ai&sort=recency&api_params=1&securityToken=8f4b8e5f993ec8b834b95dc2df774ff6e23ced67cf6f210e4e4178595b88215e16709a56164d3037c0165ab473c298c97fbcaae124408b3fc63c510edb2253b5&userUid=1313721826954805248&orgUid=1650943632177328128",
  anthropicApiKey:
    "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",
  cookiesFilePath: "./cookie.json",
};

const ANTHROPIC_API_KEY =
  "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";

// Claude API URL
const CLAUDE_URL = "https://api.anthropic.com/v1/messages";

// Load cookies from cookies.json
let cookies = [];
try {
  cookies = JSON.parse(fs.readFileSync(config.cookiesFilePath, "utf8"));
  console.log("Cookies loaded successfully.");
} catch (err) {
  console.error("Error loading cookies:", err);
}

// Sanitize sameSite attribute
cookies = cookies.map((cookie) => {
  if (
    cookie.sameSite !== "Strict" &&
    cookie.sameSite !== "Lax" &&
    cookie.sameSite !== "None"
  ) {
    delete cookie.sameSite;
  }
  return cookie;
});

async function generateCoverLetter(jobSummary) {
  console.log("Generating cover letter...");
  try {
    const response = await axios.post(
      CLAUDE_URL,
      {
        model: "claude-3-haiku-20240307",
        messages: [
          {
            role: "user",
            content: `Please generate a message based on this framwork: Hi there! you are in the right place! My role as a [Insert The Title The Client Asks For] is to help you [Insert The Primary Client Need]. Lets schedule a brief call to align on your objectives; at the very least, Ill point you in the right direction. Here in my calendly link: https://calendly.com/horizonlabsai/discovery-call Give me a message for this job:\n\n${jobSummary} \n\n GIVE ONLY THE MESSAGE NOTHING ELSE.`,
          },
        ],
        max_tokens: 1024,
      },
      {
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "content-type": "application/json",
          "anthropic-version": "2023-06-01",
        },
      }
    );

    const data = response.data;
    console.log("Claude API response:", data);
    return data.content[0].text;
  } catch (err) {
    console.error("Error generating cover letter:", err);
    throw err;
  }
}

async function loadUpworkWithCookies(jobSummary, jobLink) {
  try {
    // Generate a random delay between 1 and 3 minutes
    const delayInMilliseconds =
      Math.floor(Math.random() * (3 - 1 + 1) + 1) * 60 * 1000;

    console.log(
      `Waiting for ${
        delayInMilliseconds / 60000
      } minutes before running the automation...`
    );

    // Wait for the specified delay
    await new Promise((resolve) => setTimeout(resolve, delayInMilliseconds));

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

    console.log("Setting cookies...");
    await page.setCookie(...cookies);

    // Extract the required part from the link
    const linkParts = jobLink.split("_");
    const requiredPart = linkParts[linkParts.length - 1].split("?")[0];

    // Create the apply URL
    const applyUrl = `https://www.upwork.com/ab/proposals/job/${requiredPart}/apply/`;

    console.log("Navigating to apply URL:", applyUrl);
    await page.goto(applyUrl);

    console.log("Waiting for 3 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Generate cover letter using Claude API
    const coverLetter = await generateCoverLetter(jobSummary);
    console.log("Generated Cover Letter:", coverLetter);

    console.log("Typing cover letter...");
    await page.type('[aria-labelledby="cover_letter_label"]', coverLetter);

    // Click on the dropdown based on the text inside it
    const dropdownFound = await page.evaluate(() => {
      const dropdownToggle = document.querySelector(
        ".air3-dropdown-toggle-label.ellipsis"
      );
      if (
        dropdownToggle &&
        dropdownToggle.textContent.trim() === "Select a frequency"
      ) {
        dropdownToggle.click();
        return true;
      }
      return false;
    });

    if (dropdownFound) {
      console.log("Found 'Select a frequency' dropdown.");

      // Wait for the dropdown options to appear
      await page.waitForSelector(".air3-menu-item");

      console.log("Clicking on the 'Never' option...");
      // Click on the "Never" option using tabindex attribute
      await page.evaluate(() => {
        const neverOption = document.querySelector(
          'li.air3-menu-item[tabindex="0"]'
        );
        if (neverOption) {
          neverOption.click();
        }
      });
    } else {
      console.log(
        'Dropdown for selecting frequency not found. Clicking on the "By project" radio button.'
      );

      // Click on the specific "By project" radio button
      await page.evaluate(() => {
        const radioButtons = document.querySelectorAll(
          'input[type="radio"][name="milestoneMode"]'
        );
        for (const radioButton of radioButtons) {
          if (radioButton.value === "default") {
            radioButton.click();
            break;
          }
        }
      });

      console.log("Waiting for 3 seconds after clicking the radio button...");
      // Wait for 3 seconds after clicking the radio button
      await new Promise((resolve) => setTimeout(resolve, 3000));

      console.log("Clicking on the 'Select a duration' dropdown...");
      // Click on the "Select a duration" dropdown
      await page.evaluate(() => {
        const dropdownToggle = document.querySelector(
          ".air3-dropdown-toggle-label.ellipsis"
        );
        if (
          dropdownToggle &&
          dropdownToggle.textContent.trim() === "Select a duration"
        ) {
          dropdownToggle.click();
        }
      });

      console.log("Waiting for 3 seconds after clicking the dropdown...");
      // Wait for 3 seconds after clicking the dropdown
      await new Promise((resolve) => setTimeout(resolve, 3000));

      console.log("Clicking on the 'Less than 1 month' option...");
      // Click on the "Less than 1 month" option
      await page.evaluate(() => {
        const options = document.querySelectorAll("li.air3-menu-item");
        for (const option of options) {
          if (option.textContent.trim() === "Less than 1 month") {
            option.click();
            break;
          }
        }
      });
    }

    console.log(
      "Waiting for 3 seconds before clicking the 'Submit proposal' button..."
    );
    // Wait for 3 seconds before clicking the "Submit proposal" button
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log("Clicking the 'Submit proposal' or 'Send for' button...");
    // Click the "Submit proposal" button or any button containing "Send for"
    await page.evaluate(() => {
      const buttons = document.querySelectorAll("button");
      for (const button of buttons) {
        const buttonText = button.textContent.trim();
        if (
          buttonText === "Submit proposal" ||
          buttonText.includes("Send for")
        ) {
          button.click();
          break;
        }
      }
    });

    console.log("Waiting for 3 seconds before checking the checkbox...");
    // Wait for 3 seconds before checking the checkbox
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log("Checking the checkbox...");
    // Check the checkbox
    await page.evaluate(() => {
      const checkbox = document.querySelector(
        'input.air3-checkbox-input[type="checkbox"]'
      );
      if (checkbox) {
        checkbox.click();
      }
    });

    console.log("Waiting for 3 seconds before clicking the 'Submit' button...");
    // Wait for 3 seconds before clicking the "Submit" button
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log("Clicking the 'Continue to submit' or 'Submit' button...");
    // Click the "Continue to submit" button or the "Submit" button
    await page.evaluate(() => {
      const buttons = document.querySelectorAll("button");
      for (const button of buttons) {
        const buttonText = button.textContent.trim();
        if (
          (buttonText.includes("Continue") &&
            buttonText.includes("to submit")) ||
          buttonText === "Submit"
        ) {
          button.click();
          break;
        }
      }
    });

    console.log("Waiting for 5 seconds after clicking the 'Submit' button...");
    // Wait for 5 seconds after clicking the "Submit" button
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log("Closing browser...");
    await browser.close();
  } catch (err) {
    console.error("Error in loadUpworkWithCookies:", err);
    throw err;
  }
}

async function checkForUpdates() {
  try {
    console.log("Fetching RSS feed:", config.rssUrl);
    const response = await axios.get(config.rssUrl);
    const feed = await parser.parseString(response.data);
    const currentTime = new Date();
    const oneMinuteAgo = new Date(currentTime.getTime() - 60000); // 60000 milliseconds = 1 minute
    const newEntries = feed.items.filter((entry) => {
      const pubDate = new Date(entry.pubDate);
      return pubDate >= oneMinuteAgo;
    });

    if (newEntries.length > 0) {
      console.log(`Found ${newEntries.length} new entries:`);
      for (const entry of newEntries) {
        console.log(`- ${entry.title}`);
        await loadUpworkWithCookies(entry.contentSnippet, entry.link);
      }
    } else {
      console.log("No new entries found.");
    }
  } catch (err) {
    console.error("Error fetching or parsing RSS feed:", err);
  }
}

const scrapeLogic = async () => {
  // Check for updates every 1 minute
  console.log("Starting the script...");
  setInterval(checkForUpdates, 60000);
};

app.get("/", (req, res) => {
  res.send("Render Puppeteer server is up and running!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  // Start the scraping process
  scrapeLogic();
});
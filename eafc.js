import express from "express";
import { chromium } from "playwright";

const app = express();
app.use(express.json());

app.get("/eafc/stats", async (req, res) => {
  const clubId = req.query.clubId;
  if (!clubId) return res.status(400).json({ error: "Missing clubId" });

  const url = `https://proclubs.ea.com/api/fc/members/stats?platform=common-gen5&clubId=${clubId}`;

  try {
    const browser = await chromium.launch({
      headless: false,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled"
      ]
    });

    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 60000
    });

    const content = await page.content();

    const match = content.match(/\{[\s\S]*\}/);
    const json = match ? JSON.parse(match[0]) : null;

    await browser.close();

    if (!json) {
      return res.status(500).json({ error: "Could not extract JSON" });
    }

    return res.json(json);

  } catch (err) {
    console.error("Erro Playwright:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(3005, () => {
  console.log("EAFC Scraper rodando na porta 3005");
});

const API_URL = 'http://localhost:3333/api/news';

const variations = [
  // Tech > AI
  { parent: 'tech', id: 'ai', title: "Google Gemini 2.0 beats GPT-4 in coding", summary: "Benchmark results show massive improvements in Python and C++ generation." },
  { parent: 'tech', id: 'ai', title: "Anthropic Claude 3 Opus creates its own language", summary: "Researchers puzzled by emergent communication behavior." },
  { parent: 'tech', id: 'ai', title: "Mistral Large is now open source", summary: "A huge win for the open source AI community." },
  
  // Tech > Crypto > BTC
  { parent: 'crypto', id: 'btc', title: "MicroStrategy buys another 10,000 BTC", summary: "Michael Saylor continues his aggressive accumulation strategy." },
  { parent: 'crypto', id: 'btc', title: "Bitcoin Halving: Miners revenue analysis", summary: "How the reduced block reward impacts profitability." },
  
  // Tech > Crypto > ETH
  { parent: 'crypto', id: 'eth', title: "Vitalik Buterin proposes new roadmap", summary: "Focus shifts to decentralization and censorship resistance." },
  { parent: 'crypto', id: 'eth', title: "BlackRock files for Ethereum ETF", summary: "Institutional interest in the second largest crypto is growing." },

  // Tech > Startups
  { parent: 'tech', id: 'startups', title: "Y Combinator W25 batch demo day", summary: "Top trends include generative AI, defense tech, and biotech." },
  { parent: 'tech', id: 'startups', title: "Revolut valuation hits $45B", summary: "The fintech giant is preparing for a potential IPO." },

  // Finance > Markets
  { parent: 'finance', id: 'markets', title: "Nvidia surpasses Apple in market cap", summary: "AI chip demand drives NVDA to new heights." },
  { parent: 'finance', id: 'markets', title: "Oil prices jump on geopolitical tensions", summary: "Supply chain concerns worry global markets." },
  { parent: 'finance', id: 'markets', title: "European markets close mixed", summary: "DAX up, CAC 40 down as ECB decision looms." },

  // Finance > Economy
  { parent: 'finance', id: 'economy', title: "US Job report beats expectations", summary: "Unemployment rate stays low, signaling economic resilience." },
  { parent: 'finance', id: 'economy', title: "China deflation fears grow", summary: "Consumer prices fall for the third consecutive month." },

  // Science > Space
  { parent: 'science', id: 'space', title: "NASA finds water on Mars surface", summary: "New rover data confirms ancient riverbeds." },
  { parent: 'science', id: 'space', title: "Blue Origin lands contract for lunar base", summary: "Jeff Bezos' company will help build infrastructure on the Moon." },
  { parent: 'science', id: 'space', title: "James Webb Telescope spots oldest galaxy", summary: "Images from the dawn of the universe rewrite cosmology." },

  // Science > Biotech
  { parent: 'science', id: 'biotech', title: "Neuralink chip lets patient play chess", summary: "Brain-computer interface shows promising results in human trials." },
  { parent: 'science', id: 'biotech', title: "Moderna announces cancer vaccine progress", summary: "Phase 3 trials show increased survival rates." },
  { parent: 'science', id: 'biotech', title: "New antibiotic discovered in deep sea", summary: "Could be the solution to drug-resistant bacteria." }
];

async function seed() {
  console.log('🌱 Seeding 20+ articles into DeepNews...');

  for (const item of variations) {
    const tag = `${item.parent}:${item.id}`;
    const article = {
      title: item.title,
      link: `https://news.example.com/${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      content: item.summary + " This is a generated article for testing purposes. It contains filler text to simulate a real news body.",
      source: "SeedBot V2",
      tags: [tag]
    };

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(article)
      });
      if (res.ok) console.log(`✅ [${tag}] ${article.title}`);
      else console.log(`❌ Failed: ${article.title}`);
    } catch (e) {
      console.error(`❌ Error: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 50));
  }
  console.log('Done!');
}

seed();

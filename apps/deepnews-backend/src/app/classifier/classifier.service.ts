import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

export interface ClassificationResult {
    tags: string[];
    summary: string;
    keyPoints: string[];
    sentiment: 'positive' | 'negative' | 'neutral';
    readingTime: number;
    htmlContent: string;
}

@Injectable()
export class ClassifierService {
  private readonly logger = new Logger(ClassifierService.name);
  private openai: OpenAI;
  private taxonomy: any[]; // Updated type

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ 
          apiKey,
          timeout: 30 * 1000, // 30 seconds timeout
          maxRetries: 2 // Internal library retries
      });
      this.logger.log('OPENAI_API_KEY is set. AI classification will function.', apiKey);
    } else {
      this.logger.warn('OPENAI_API_KEY not found. AI classification will be mocked.');
    } 

    this.loadTaxonomy();
  }

  private loadTaxonomy() {
    try {
        const taxonomyPath = path.join(process.cwd(), 'apps/deepnews-backend/src/assets/categories.json');
        if (fs.existsSync(taxonomyPath)) {
             const data = fs.readFileSync(taxonomyPath, 'utf8');
             this.taxonomy = JSON.parse(data);
        } else {
            this.logger.warn(`Taxonomy file not found at ${taxonomyPath}`);
            this.taxonomy = [];
        }
    } catch (err) {
        this.logger.error('Failed to load taxonomy', err);
    }
  }

  async filterDuplicates(candidates: { title: string, url: string }[], history: { title: string, url: string }[]): Promise<number[]> {
      if (!this.openai || history.length === 0 || candidates.length === 0) {
          // If no AI or no history, assume all are new (except exact URL match which is handled elsewhere)
          return candidates.map((_, index) => index);
      }

      const prompt = `
      You are an expert news editor in charge of deduplication.
      
      TASK:
      Compare the "CANDIDATES" list against the "HISTORY" list.
      Identify candidates that cover the SAME event or topic as any article in the history.
      
      CRITERIA FOR DUPLICATE:
      - Same specific event (e.g. "Apple launches iPhone 16" vs "iPhone 16 released by Apple").
      - Same breaking news topic reported by different sources.
      - If a candidate adds SIGNIFICANT new information or a different angle, keep it.
      - If it's just a rehash of the same news, discard it.
      
      HISTORY (Already published):
      ${JSON.stringify(history.map(h => h.title), null, 2)}
      
      CANDIDATES (To evaluate):
      ${JSON.stringify(candidates.map((c, i) => ({ index: i, title: c.title })), null, 2)}
      
      OUTPUT:
      Return a strictly valid JSON array of numbers (indices) representing the articles that are UNIQUE and should be published.
      Example: [0, 2, 4]
      `;

      try {
          const completion = await this.openai.chat.completions.create({
              messages: [
                  { role: 'system', content: 'You are a strict JSON deduplication API.' },
                  { role: 'user', content: prompt }
              ],
              model: 'gpt-4o-mini',
              temperature: 0.0,
          });

          const result = completion.choices[0].message.content;
          const cleanResult = result.replace(/```json|```/g, '').trim();
          const indices = JSON.parse(cleanResult);
          
          if (Array.isArray(indices)) {
              return indices;
          }
          return candidates.map((_, i) => i); // Fallback: keep all

      } catch (error) {
          this.logger.warn('Deduplication failed, skipping filter', error);
          return candidates.map((_, i) => i); // Fallback
      }
  }

  async classify(title: string, content = ''): Promise<ClassificationResult> {
    if (!this.openai) {
        return this.getFallbackClassification(title, content);
    }

    const prompt = `
    You are an expert news analyst and classifier.
    
    TAXONOMY:
    ${JSON.stringify(this.taxonomy.map(t => ({id: t.id, label: t.label, keywords: t.keywords})), null, 2)}

    TASK:
    Analyze the article and return a structured analysis.
    
    RULES:
    1. **Tags**: Assign top-level and specific sub-tags based on the taxonomy.
    2. **Summary**: Write a compelling 2-sentence summary.
    3. **Key Points**: Extract 3 bullet points summarizing the main facts.
    4. **Sentiment**: Analyze the tone (positive, negative, or neutral).
    5. **Reading Time**: Estimate reading time in minutes (integer).
    6. **HTML Content**: Rewrite the provided article snippet into clean, semantic HTML. 
       - Use <h2> for section headers.
       - Use <p> for paragraphs.
       - Use <ul>/<li> for lists if appropriate.
       - Use <blockquote> for quotes.
       - Ensure it is ready to be injected into a <div> (no <html> or <body> tags).
    
    OUTPUT FORMAT (Strict JSON):
    {
      "tags": ["tech", "tech:ai"],
      "summary": "...",
      "keyPoints": ["...", "..."],
      "sentiment": "neutral",
      "readingTime": 5,
      "htmlContent": "<h2>Title</h2><p>...</p>"
    }

    Article Title: "${title}"
    Article Snippet: "${content ? content.substring(0, 2000) : 'No content provided'}"
    `;

    // Retry Logic (3 attempts)
    let attempts = 0;
    const maxAttempts = 2;
    
    while (attempts < maxAttempts) {
        try {
            const completion = await this.openai.chat.completions.create({
                messages: [
                    { role: 'system', content: 'You are a strict JSON analysis API.' },
                    { role: 'user', content: prompt }
                ],
                model: 'gpt-4o-mini',
                temperature: 0.1,
                max_tokens: 500,
            });

            const result = completion.choices[0].message.content;
            const cleanResult = result.replace(/```json|```/g, '').trim();
            return JSON.parse(cleanResult);

        } catch (error) {
            attempts++;
            this.logger.warn(`AI Classification failed (Attempt ${attempts}/${maxAttempts}): ${error.message}`);
            
            // Don't retry on 401 (Auth) or 429 (Quota) as they are likely permanent
            if (error.status === 401 || error.status === 429) {
                break;
            }
            
            if (attempts < maxAttempts) {
                // Exponential backoff: 1s, 2s, 4s
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
            }
        }
    }

    // If all retries failed
    return this.getFallbackClassification(title, content);
  }

  private cleanMarkdownToHtml(content: string): string {
      // Advanced Markdown to HTML converter for fallback
      let htmlContent = content
          // Remove common artifacts
          .replace(/\[\.\.\.\]/g, '') // Remove truncation markers
          .replace(/\[\+ \d+ chars\]/g, '') // Remove char counts
          .replace(/^#+\s+/gm, '') // Remove starting headers markers completely for cleaner look
          .replace(/(\r\n|\n|\r)/gm, '<br>') // Handle newlines
          .replace(/(<br>\s*){2,}/g, '</p><p>') // Double break -> New Paragraph
          .replace(/<br>/g, ' ') // Single break -> Space (to merge broken lines)
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
          .replace(/<p>\s*<\/p>/g, ''); // Remove empty paragraphs

      // Clean up artifacts left by regex
      htmlContent = htmlContent
         .replace(/E&E News PM/g, '')
         .replace(/Climatewire/g, '')
         .replace(/Greenwire/g, '')
         .replace(/Written by .*?$/gm, '');

      // Wrap in initial paragraph if not already
      if (!htmlContent.startsWith('<p>')) {
          htmlContent = `<p>${htmlContent}</p>`;
      }
      
      // Ensure we have at least some structure
      if (htmlContent.length < 100) {
          htmlContent += '<p><em>Click the link above to read the full story at the source.</em></p>';
      }
      return htmlContent;
  }

  private getFallbackClassification(title: string, content: string): ClassificationResult {
      const fallbackTags = new Set<string>();
      const text = (title + ' ' + content).toLowerCase();
      
      // Helper to check keywords
      const check = (keywords: string[], tag: string) => {
          if (keywords.some(k => text.includes(k.toLowerCase()))) {
              fallbackTags.add(tag);
          }
      };

      // Tech
      check(['AI', 'Artificial Intelligence', 'LLM', 'GPT', 'Neural'], 'tech:ai');
      check(['Crypto', 'Bitcoin', 'BTC', 'Blockchain', 'Ethereum'], 'tech:crypto');
      check(['Apple', 'Google', 'Microsoft', 'Software', 'Cyber'], 'tech');

      // Finance
      check(['Stock', 'Market', 'Nasdaq', 'S&P', 'Trade', 'Inflation', 'Economy'], 'finance:markets');
      check(['Bank', 'Fed', 'Rates'], 'finance');

      // Science
      check(['Space', 'NASA', 'Mars', 'Rocket', 'Orbit'], 'science:space');
      check(['Health', 'Virus', 'Vaccine', 'Doctor', 'Medical', 'Bio'], 'health');

      // Politics
      check(['Election', 'Vote', 'Congress', 'Senate', 'Law', 'Policy'], 'politics');

      if (fallbackTags.size === 0) fallbackTags.add('uncategorized');

      return {
          tags: Array.from(fallbackTags),
          summary: content.substring(0, 150) + '...',
          keyPoints: ['Content analysis unavailable', 'Please read full article', 'Auto-generated fallback'],
          sentiment: 'neutral',
          readingTime: Math.ceil(content.length / 1000), // Crude estimation
          htmlContent: this.cleanMarkdownToHtml(content)
      };
  }
}
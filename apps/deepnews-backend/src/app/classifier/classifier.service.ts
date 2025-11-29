import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ClassifierService {
  private readonly logger = new Logger(ClassifierService.name);
  private openai: OpenAI;
  private taxonomy: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
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

  async classify(title: string, content: string = ''): Promise<string[]> {
    if (!this.openai) {
        const mockTags = [];
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('bitcoin') || lowerTitle.includes('btc')) mockTags.push('btc', 'crypto');
        if (lowerTitle.includes('ai') || lowerTitle.includes('gpt')) mockTags.push('ai', 'tech');
        
        // Simulation de nouveaux tags avec parent
        if (lowerTitle.includes('quantum')) mockTags.push('science:quantum');
        if (lowerTitle.includes('inflation')) mockTags.push('finance:inflation');
        
        if (mockTags.length > 0) {
             this.logger.log(`[MOCK AI] Classified "${title}" as ${JSON.stringify(mockTags)}`);
             return mockTags;
        }
        return ['uncategorized'];
    }

    const prompt = `
    You are an expert news classifier.
    Here is the taxonomy of interest categories:
    ${JSON.stringify(this.taxonomy, null, 2)}

    Your task:
    Analyze the following news article.
    1. Assign it to existing category IDs from the taxonomy if possible.
    2. If the article fits a NEW specific topic not in the taxonomy, create a new tag ID.
       IMPORTANT: For new tags, you MUST prefix them with the closest existing PARENT category ID followed by a colon.
       Format: "parentId:newTagId" (e.g. "science:quantum-computing", "finance:euro-bond").

    Return ONLY a valid JSON array of strings (IDs).
    Do NOT return markdown formatting like \`\`\`json. Just the raw array.

    Article Title: "${title}"
    Article Snippet: "${content.substring(0, 500)}"
    `;

    try {
        const completion = await this.openai.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'gpt-4o-mini',
            temperature: 0.1,
        });

        const result = completion.choices[0].message.content;
        const cleanResult = result.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanResult);

    } catch (error) {
        this.logger.error('AI Classification failed', error);
        return ['error-classification'];
    }
  }
}

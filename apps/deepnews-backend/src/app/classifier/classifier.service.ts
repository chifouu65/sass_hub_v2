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
        // Note: En prod, utiliser process.cwd() peut varier selon le déploiement.
        // Pour le dev local Nx, on pointe vers le fichier source.
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
        // Mock simple basé sur des mots-clés pour tester sans payer l'API
        const mockTags = [];
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('bitcoin') || lowerTitle.includes('btc')) mockTags.push('btc', 'crypto');
        if (lowerTitle.includes('ai') || lowerTitle.includes('gpt')) mockTags.push('ai', 'tech');
        
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
    Analyze the following news article and assign it to the most specific categories from the taxonomy above.
    Return ONLY a valid JSON array of category IDs (e.g. ["btc", "crypto", "finance"]). 
    Do NOT return markdown formatting like \`\`\`json. Just the raw array.

    Article Title: "${title}"
    Article Snippet: "${content.substring(0, 500)}"
    `;

    try {
        const completion = await this.openai.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'gpt-4o-mini',
            temperature: 0.1, // Faible température pour être déterministe
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


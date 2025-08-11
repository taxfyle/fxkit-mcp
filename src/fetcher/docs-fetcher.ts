import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { CachedContent, DocumentationSection, CodeExample } from '../types.js';

const BASE_URL = 'https://taxfyle.github.io/FxKit';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export class DocumentationFetcher {
  private cache: Map<string, CachedContent> = new Map();

  private isValidCache(cached: CachedContent): boolean {
    return Date.now() - cached.timestamp < cached.ttl;
  }

  private getCached(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && this.isValidCache(cached)) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: CACHE_TTL_MS
    });
  }

  async fetchPage(path: string): Promise<string | null> {
    const url = `${BASE_URL}${path}`;
    const cached = this.getCached(url);
    if (cached) return cached;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Failed to fetch ${url}: ${response.status}`);
        return null;
      }
      const html = await response.text();
      this.setCache(url, html);
      return html;
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      return null;
    }
  }

  extractContent(html: string): DocumentationSection {
    const $ = cheerio.load(html);
    
    // Remove navigation and footer elements
    $('nav').remove();
    $('footer').remove();
    $('.sidebar').remove();
    
    const title = $('h1').first().text() || 'FxKit Documentation';
    const content = $('main').text() || $('article').text() || $('.content').text() || '';
    
    // Extract code examples
    const examples: CodeExample[] = [];
    $('pre code').each((_, elem) => {
      const $elem = $(elem);
      const code = $elem.text();
      const language = $elem.attr('class')?.replace('language-', '') || 'csharp';
      const $prevElem = $elem.parent().prev();
      const description = $prevElem.is('p') ? $prevElem.text() : '';
      
      examples.push({
        title: description.split('.')[0] || 'Example',
        code,
        language,
        description
      });
    });

    return {
      title,
      url: '',
      content: content.trim(),
      examples
    };
  }

  async getDocumentation(path: string): Promise<DocumentationSection | null> {
    const html = await this.fetchPage(path);
    if (!html) return null;
    
    const section = this.extractContent(html);
    section.url = `${BASE_URL}${path}`;
    return section;
  }

  async getAllSections(): Promise<DocumentationSection[]> {
    const paths = [
      '/',
      '/getting-started',
      '/core/option',
      '/core/result',
      '/core/validation',
      '/core/unit',
      '/compiler/',
      '/compiler/enum-match',
      '/compiler/union',
      '/compiler/lambda',
      '/compiler/transformer',
      '/testing/'
    ];

    const sections = await Promise.all(
      paths.map(path => this.getDocumentation(path))
    );

    return sections.filter((s): s is DocumentationSection => s !== null);
  }

  async searchDocumentation(query: string): Promise<DocumentationSection[]> {
    const allSections = await this.getAllSections();
    const lowerQuery = query.toLowerCase();
    
    return allSections.filter(section => 
      section.title.toLowerCase().includes(lowerQuery) ||
      section.content.toLowerCase().includes(lowerQuery) ||
      section.examples?.some(ex => 
        ex.code.toLowerCase().includes(lowerQuery) ||
        ex.description?.toLowerCase().includes(lowerQuery)
      )
    );
  }

  clearCache(): void {
    this.cache.clear();
  }
}
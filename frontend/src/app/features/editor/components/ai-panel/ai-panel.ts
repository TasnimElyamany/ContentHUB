import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AiService } from '../../services/ai';

interface Attempt {
  content: string;
  score: number;
  index: number;
}

@Component({
  selector: 'app-ai-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  templateUrl: './ai-panel.html',
  styleUrl: './ai-panel.scss',
})
export class AiPanel implements OnInit {
  @Input() documentId = '';
  @Input() quillInstance: any = null;

  @Output() close = new EventEmitter<void>();
  @Output() contentChanged = new EventEmitter<void>();

  private aiService = inject(AiService);
  private snackBar = inject(MatSnackBar);

  private selectionRange: { index: number; length: number } | null = null;

  // ── Panel state ─────────────────────────────────────────────────────────────
  aiPanelTab = signal<'generate' | 'enhance' | 'research'>('generate');
  isAIProcessing = signal(false);
  aiError = signal('');
  aiCreditsRemaining = signal<number | null>(null);

  // ── Quality mode ─────────────────────────────────────────────────────────────
  /** When on: auto-retries until confidence ≥ threshold or max attempts reached */
  qualityModeEnabled = signal(false);
  readonly CONFIDENCE_THRESHOLD = 70;
  readonly MAX_ATTEMPTS = 3;
  attempts = signal<Attempt[]>([]);
  currentAttempt = signal(0);
  bestAttempt = signal<Attempt | null>(null);

  // ── Generate tab ─────────────────────────────────────────────────────────────
  aiPrompt = signal('');
  aiTone = signal('professional');
  aiLength = signal('medium');
  aiResult = signal('');

  // ── Enhance tab ──────────────────────────────────────────────────────────────
  selectedText = signal('');

  // ── Research tab ─────────────────────────────────────────────────────────────
  researchMode = signal<'ask' | 'factcheck' | 'sources'>('ask');
  researchQuery = signal('');
  researchResult = signal('');
  researchError = signal('');
  isResearching = signal(false);

  toneOptions = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual',       label: 'Casual' },
    { value: 'friendly',     label: 'Friendly' },
    { value: 'creative',     label: 'Creative' },
  ];

  lengthOptions = [
    { value: 'short',  label: 'Short (1–2 paragraphs)' },
    { value: 'medium', label: 'Medium (3–5 paragraphs)' },
    { value: 'long',   label: 'Long (6+ paragraphs)' },
  ];

  ngOnInit(): void {
    this.loadAICredits();
  }

  // ─── Credits ────────────────────────────────────────────────────────────────

  loadAICredits(): void {
    this.aiService.getCredits().subscribe({
      next: (credits) => this.aiCreditsRemaining.set(credits.remaining),
      error: () => {},
    });
  }

  // ─── Generate ───────────────────────────────────────────────────────────────

  generateAIContent(): void {
    if (!this.aiPrompt().trim()) {
      this.snackBar.open('Please enter a prompt.', 'Close', { duration: 3000 });
      return;
    }
    if (!this.documentId || this.documentId === 'new') {
      this.snackBar.open('Please save the document first.', 'Close', { duration: 3000 });
      return;
    }

    this.isAIProcessing.set(true);
    this.aiResult.set('');
    this.aiError.set('');
    this.attempts.set([]);
    this.bestAttempt.set(null);
    this.currentAttempt.set(0);

    if (this.qualityModeEnabled()) {
      this.runQualityLoop(1);
    } else {
      this.runSingleGenerate();
    }
  }

  private runSingleGenerate(): void {
    this.aiService.generate({
      prompt: this.aiPrompt(),
      tone: this.aiTone() as any,
      length: this.aiLength() as any,
      documentId: this.documentId,
    }).subscribe({
      next: (response) => {
        this.aiResult.set(response.result);
        this.aiCreditsRemaining.set(response.creditsRemaining);
        this.isAIProcessing.set(false);
      },
      error: (err) => {
        this.aiError.set(err.error?.error || err.error?.message || 'AI generation failed.');
        this.isAIProcessing.set(false);
      },
    });
  }

  private runQualityLoop(attemptNum: number): void {
    this.currentAttempt.set(attemptNum);

    this.aiService.generate({
      prompt: this.aiPrompt(),
      tone: this.aiTone() as any,
      length: this.aiLength() as any,
      documentId: this.documentId,
    }).subscribe({
      next: (response) => {
        const score = this.scoreContent(response.result, this.aiPrompt(), this.aiLength());
        const attempt: Attempt = { content: response.result, score, index: attemptNum };

        this.attempts.update((prev) => [...prev, attempt]);
        this.aiCreditsRemaining.set(response.creditsRemaining);

        const best = this.attempts().reduce((a, b) => a.score > b.score ? a : b);
        this.bestAttempt.set(best);

        if (score >= this.CONFIDENCE_THRESHOLD || attemptNum >= this.MAX_ATTEMPTS) {
          // Done — surface the best result
          this.aiResult.set(best.content);
          this.isAIProcessing.set(false);
        } else {
          // Score too low, try again
          this.runQualityLoop(attemptNum + 1);
        }
      },
      error: (err) => {
        this.aiError.set(err.error?.error || err.error?.message || 'AI generation failed.');
        this.isAIProcessing.set(false);
      },
    });
  }

  /**
   * Scores generated content 0–100 across four dimensions:
   *  - Length match vs requested target (30 pts)
   *  - Lexical diversity / word variety (30 pts)
   *  - No repeated sentences (20 pts)
   *  - Keyword coverage from prompt (20 pts)
   */
  private scoreContent(html: string, prompt: string, targetLength: string): number {
    const text = html.replace(/<[^>]*>/g, '').trim();
    const words = text.split(/\s+/).filter(Boolean);
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);

    // 1. Length match
    const expected = targetLength === 'short' ? 120 : targetLength === 'medium' ? 350 : 750;
    const lengthScore = Math.min(30, 30 * (Math.min(words.length, expected) / expected));

    // 2. Lexical diversity
    const uniqueWords = new Set(words.map((w) => w.toLowerCase().replace(/[^a-z]/g, '')));
    const diversityScore = words.length > 0 ? 30 * (uniqueWords.size / words.length) : 0;

    // 3. No repeated sentences
    const uniqueSentences = new Set(sentences.map((s) => s.trim().toLowerCase()));
    const repScore = sentences.length > 0 ? 20 * (uniqueSentences.size / sentences.length) : 20;

    // 4. Keyword coverage
    const keywords = prompt.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    const contentLower = text.toLowerCase();
    const covered = keywords.filter((kw) => contentLower.includes(kw)).length;
    const kwScore = keywords.length > 0 ? 20 * (covered / keywords.length) : 20;

    return Math.round(lengthScore + diversityScore + repScore + kwScore);
  }

  regenerateAI(): void {
    this.generateAIContent();
  }

  declineAIContent(): void {
    this.aiResult.set('');
    this.aiPrompt.set('');
    this.attempts.set([]);
    this.bestAttempt.set(null);
  }

  insertAIContent(): void {
    if (!this.aiResult() || !this.quillInstance) return;
    const length = this.quillInstance.getLength();
    this.quillInstance.clipboard.dangerouslyPasteHTML(length - 1, this.aiResult());
    this.aiResult.set('');
    this.aiPrompt.set('');
    this.attempts.set([]);
    this.bestAttempt.set(null);
    this.contentChanged.emit();
    this.snackBar.open('Content inserted.', 'Close', { duration: 2000 });
  }

  copyAIContent(): void {
    if (!this.aiResult()) return;
    const div = document.createElement('div');
    div.innerHTML = this.aiResult();
    navigator.clipboard.writeText(div.textContent || div.innerText).then(() => {
      this.snackBar.open('Copied to clipboard!', 'Close', { duration: 2000 });
    });
  }

  // ─── Enhance ────────────────────────────────────────────────────────────────

  enhanceText(action: string): void {
    if (!this.quillInstance) return;

    const range = this.quillInstance.getSelection();
    const text = range ? this.quillInstance.getText(range.index, range.length) : '';

    if (!text.trim()) {
      this.snackBar.open('Select some text in the editor first.', 'Close', { duration: 3000 });
      return;
    }
    if (!this.documentId || this.documentId === 'new') {
      this.snackBar.open('Please save the document first.', 'Close', { duration: 3000 });
      return;
    }

    this.selectionRange = range;
    this.selectedText.set(text);
    this.isAIProcessing.set(true);
    this.aiResult.set('');
    this.aiError.set('');

    this.aiService.enhance({
      text,
      action: action as any,
      tone: action === 'tone' ? (this.aiTone() as any) : undefined,
      documentId: this.documentId,
    }).subscribe({
      next: (response) => {
        this.aiResult.set(response.result);
        this.aiCreditsRemaining.set(response.creditsRemaining);
        this.isAIProcessing.set(false);
      },
      error: (err) => {
        this.aiError.set(err.error?.error || err.error?.message || 'AI enhancement failed.');
        this.isAIProcessing.set(false);
      },
    });
  }

  replaceSelectedText(): void {
    if (!this.aiResult() || !this.quillInstance || !this.selectionRange) return;
    const { index, length } = this.selectionRange;
    this.quillInstance.deleteText(index, length);
    this.quillInstance.clipboard.dangerouslyPasteHTML(index, this.aiResult());
    this.aiResult.set('');
    this.selectedText.set('');
    this.selectionRange = null;
    this.contentChanged.emit();
    this.snackBar.open('Text replaced.', 'Close', { duration: 2000 });
  }

  // ─── Research ────────────────────────────────────────────────────────────────

  runResearch(): void {
    const mode = this.researchMode();

    if (mode === 'factcheck') {
      const range = this.quillInstance?.getSelection();
      const text = range ? this.quillInstance.getText(range.index, range.length) : this.selectedText();
      if (!text.trim()) {
        this.snackBar.open('Select some text in the editor to fact-check.', 'Close', { duration: 3000 });
        return;
      }
      this.selectedText.set(text);
    } else {
      if (!this.researchQuery().trim()) {
        this.snackBar.open('Please enter a question or topic.', 'Close', { duration: 3000 });
        return;
      }
    }

    if (!this.documentId || this.documentId === 'new') {
      this.snackBar.open('Please save the document first.', 'Close', { duration: 3000 });
      return;
    }

    this.isResearching.set(true);
    this.researchResult.set('');
    this.researchError.set('');

    this.aiService.research({
      action: mode,
      query: mode !== 'factcheck' ? this.researchQuery() : undefined,
      text: mode === 'factcheck' ? this.selectedText() : undefined,
      documentId: this.documentId,
    }).subscribe({
      next: (response) => {
        this.researchResult.set(response.result);
        this.aiCreditsRemaining.set(response.creditsRemaining);
        this.isResearching.set(false);
      },
      error: (err) => {
        this.researchError.set(err.error?.error || err.error?.message || 'Research failed.');
        this.isResearching.set(false);
      },
    });
  }

  clearResearch(): void {
    this.researchResult.set('');
    this.researchError.set('');
    this.researchQuery.set('');
  }

  confidenceLabel(score: number): string {
    if (score >= 80) return 'High';
    if (score >= 60) return 'Medium';
    return 'Low';
  }

  confidenceClass(score: number): string {
    if (score >= 80) return 'conf-high';
    if (score >= 60) return 'conf-medium';
    return 'conf-low';
  }

  setTabByIndex(index: number): void {
    this.aiPanelTab.set(index === 0 ? 'generate' : index === 1 ? 'enhance' : 'research');
  }

  toggleQualityMode(): void {
    this.qualityModeEnabled.update((v) => !v);
  }
}

import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { QuillModule } from 'ngx-quill';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { Auth } from '../../../../core/services/auth';
import { DocumentService } from '../../../dashboard/services/document';
import { AiService } from '../../services/ai';
import { Document } from '../../../../models/document.model';

@Component({
  selector: 'app-editor',
  imports: [
    CommonModule,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    QuillModule,
    MatMenuModule,
  ],
  templateUrl: './editor.html',
  styleUrl: './editor.scss',
})
export class Editor implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(Auth);
  private documentService = inject(DocumentService);
  private aiService = inject(AiService);

  private destroy$ = new Subject<void>();
  private saveSubject$ = new Subject<void>();

  documentId = signal<string>('');
  document = signal<Document | null>(null);
  isLoading = signal(false);

  title = signal<string>('Untitled Document');
  content = signal<string>('');
  saveStatus = signal<'saved' | 'saving' | 'Unsaved'>('saved');

  showAIPanel = signal<boolean>(false);
  aiPanelTab = signal<'generate' | 'enhance' | 'research'>('generate');
  isAIProcessing = signal<boolean>(false);
  aiError = signal<string>('');

  aiPrompt = signal<string>('');
  aiTone = signal<string>('professional');
  aiLength = signal<string>('medium');
  selectedText = signal<string>('');
  aiResult = signal<string>('');
  aiCreditsRemaining = signal<number | null>(null);

  showComments = signal<boolean>(false);
  comments = signal<any[]>([]);

  collaborators = signal<string[]>([]);

  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ header: 1 }, { header: 2 }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ script: 'sub' }, { script: 'super' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ direction: 'rtl' }],
      [{ size: ['small', false, 'large', 'huge'] }],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ color: [] }, { background: [] }],
      [{ font: [] }],
      [{ align: [] }],
      ['clean'],
      ['link', 'image', 'video'],
    ],
  };

  toneOptions = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'creative', label: 'Creative' },
  ];

  lengthOptions = [
    { value: 'short', label: 'Short (1-2 paragraphs)' },
    { value: 'medium', label: 'Medium (3-5 paragraphs)' },
    { value: 'long', label: 'Long (6+ paragraphs)' },
  ];

  ngOnInit(): void {
    this.documentId.set(this.route.snapshot.params['id']);

    //auto-save: triggers 2s after last change
    this.saveSubject$
      .pipe(debounceTime(2000), takeUntil(this.destroy$))
      .subscribe(() => {
        this.saveDocument();
      });

    this.loadDocument();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDocument(): void {
    const docId = this.documentId();

    if (docId === 'new') {
      const workspaceId = this.route.snapshot.queryParams['workspace'];
      if (workspaceId) {
        this.createNewDocument(workspaceId);
      } else {
        this.title.set('Untitled Document');
        this.content.set('');
      }
    } else {
      this.loadExistingDocument(docId);
    }
  }

  createNewDocument(workspaceId: string): void {
    this.isLoading.set(true);
    this.documentService
      .createDocument({
        title: 'Untitled Document',
        workspaceId,
        content: '',
      })
      .subscribe({
        next: (doc) => {
          this.document.set(doc);
          this.documentId.set(doc._id);
          this.title.set(doc.title);
          this.content.set(doc.content);
          this.saveStatus.set('saved');
          this.isLoading.set(false);
          this.router.navigate(['/editor', doc._id], { replaceUrl: true });
          console.log('Document created:', doc._id);
        },
        error: (err) => {
          console.error('Failed to create document:', err);
          this.isLoading.set(false);
          this.title.set('Untitled Document');
          this.content.set('');
        },
      });
  }

  loadExistingDocument(id: string): void {
    this.isLoading.set(true);
    this.documentService.getDocument(id).subscribe({
      next: (doc) => {
        this.document.set(doc);
        this.title.set(doc.title);
        this.content.set(doc.content);
        this.saveStatus.set('saved');
        this.isLoading.set(false);
        console.log('Document loaded:', doc._id);
      },
      error: (err) => {
        console.error('Failed to load document:', err);
        this.isLoading.set(false);
        alert('Failed to load document. Returning to dashboard.');
        this.router.navigate(['/dashboard']);
      },
    });
  }

  OnContentChanged(event: any): void {
    this.content.set(event.html || '');
    this.saveStatus.set('Unsaved');
    this.saveSubject$.next();
  }

  OnTitleChanged(): void {
    this.saveStatus.set('Unsaved');
    this.saveSubject$.next();
  }

  saveDocument(): void {
    const doc = this.document();
    if (!doc) return;

    this.saveStatus.set('saving');
    this.documentService
      .updateDocument(doc._id, {
        title: this.title(),
        content: this.content(),
      })
      .subscribe({
        next: (updatedDoc) => {
          this.document.set(updatedDoc);
          this.saveStatus.set('saved');
          console.log('Document saved:', updatedDoc._id);
        },
        error: (err) => {
          console.error('Failed to save document:', err);
          this.saveStatus.set('Unsaved');
        },
      });
  }

  toggleAIPanel(): void {
    this.showAIPanel.update((value) => !value);
    if (this.showAIPanel() && this.aiCreditsRemaining() === null) {
      this.loadAICredits();
    }
  }

  toggleComments(): void {
    this.showComments.update((value) => !value);
  }

  switchAITab(tab: 'generate' | 'enhance' | 'research'): void {
    this.aiPanelTab.set(tab);
  }

  loadAICredits(): void {
    this.aiService.getCredits().subscribe({
      next: (credits) => {
        this.aiCreditsRemaining.set(credits.remaining);
      },
      error: (err) => {
        console.error('Failed to load AI credits:', err);
      },
    });
  }

  generateAIContent(): void {
    if (!this.aiPrompt()) {
      alert('Please enter a prompt for the AI.');
      return;
    }

    const docId = this.documentId();
    if (!docId || docId === 'new') {
      alert('Please save the document first before using AI features.');
      return;
    }

    this.isAIProcessing.set(true);
    this.aiResult.set('');
    this.aiError.set('');

    this.aiService
      .generate({
        prompt: this.aiPrompt(),
        tone: this.aiTone() as 'professional' | 'casual' | 'creative' | 'friendly',
        length: this.aiLength() as 'short' | 'medium' | 'long',
        documentId: docId,
      })
      .subscribe({
        next: (response) => {
          this.aiResult.set(response.result);
          this.aiCreditsRemaining.set(response.creditsRemaining);
          this.isAIProcessing.set(false);
        },
        error: (err) => {
          console.error('AI generation error:', err);
          this.aiError.set(err.error?.error || err.error?.message || 'AI generation failed. Please try again.');
          this.isAIProcessing.set(false);
        },
      });
  }

  insertAIContent(): void {
    if (!this.aiResult()) return;
    const currentContent = this.content();
    this.content.set(currentContent + '\n' + this.aiResult());
    this.aiResult.set('');
    this.aiPrompt.set('');
    this.saveStatus.set('Unsaved');
    this.saveSubject$.next();
  }

  copyAIContent(): void {
    if (!this.aiResult()) return;

    const tempDiv = globalThis.document.createElement('div');
    tempDiv.innerHTML = this.aiResult();
    const text = tempDiv.textContent || tempDiv.innerText;

    navigator.clipboard.writeText(text).then(() => {
      alert('AI-generated content copied to clipboard.');
    });
  }

  regenerateAI(): void {
    this.generateAIContent();
  }

  enhanceText(action: string): void {
    const selection = window.getSelection();
    const selectedText = selection?.toString() || '';
    if (!selectedText) {
      alert('Please select some text to enhance.');
      return;
    }

    const docId = this.documentId();
    if (!docId || docId === 'new') {
      alert('Please save the document first before using AI features.');
      return;
    }

    this.selectedText.set(selectedText);
    this.isAIProcessing.set(true);
    this.aiResult.set('');
    this.aiError.set('');

    this.aiService
      .enhance({
        text: selectedText,
        action: action as 'improve' | 'grammar' | 'shorten' | 'expand' | 'tone',
        tone: action === 'tone'
          ? (this.aiTone() as 'professional' | 'casual' | 'friendly')
          : undefined,
        documentId: docId,
      })
      .subscribe({
        next: (response) => {
          this.aiResult.set(response.result);
          this.aiCreditsRemaining.set(response.creditsRemaining);
          this.isAIProcessing.set(false);
        },
        error: (err) => {
          console.error('AI enhance error:', err);
          this.aiError.set(err.error?.error || err.error?.message || 'AI enhancement failed. Please try again.');
          this.isAIProcessing.set(false);
        },
      });
  }

  replaceSelectedText(): void {
    if (!this.aiResult()) return;
    alert('Text replacement feature - will be implemented with Quill API');
    this.aiResult.set('');
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  shareDocument(): void {
    alert('Share feature - coming soon!');
  }

  exportDocument(format: string): void {
    alert(`Export as ${format} - coming soon!`);
  }

  get wordCount(): number {
    const text = this.content().replace(/<[^>]*>/g, '');
    return text.split(/\s+/).filter((word) => word.length > 0).length;
  }

  get characterCount(): number {
    const text = this.content().replace(/<[^>]*>/g, '');
    return text.length;
  }

  get saveStatusIcon(): string {
    const status = this.saveStatus();
    if (status === 'saved') return 'cloud_done';
    if (status === 'saving') return 'cloud_upload';
    return 'cloud_off';
  }

  get saveStatusText(): string {
    const status = this.saveStatus();
    if (status === 'saved') return 'All changes saved';
    if (status === 'saving') return 'Saving...';
    return 'Unsaved changes';
  }
}

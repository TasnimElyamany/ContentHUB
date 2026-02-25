import { Component, OnInit, OnDestroy, inject, signal, HostListener } from '@angular/core';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { QuillModule } from 'ngx-quill';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { DocumentService } from '../../../dashboard/services/document';
import { AiService } from '../../services/ai';
import { Document } from '../../../../models/document.model';
import { CommentsSidebar } from '../comments-sidebar/comments-sidebar';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../../shared/components/confirm-dialog/confirm-dialog';

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
    MatSnackBarModule,
    MatDialogModule,
    QuillModule,
    MatMenuModule,
    CommentsSidebar,
  ],
  templateUrl: './editor.html',
  styleUrl: './editor.scss',
})
export class Editor implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private documentService = inject(DocumentService);
  private aiService = inject(AiService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  private destroy$ = new Subject<void>();
  private saveSubject$ = new Subject<void>();
  private quillInstance: any = null;
  private selectionRange: { index: number; length: number } | null = null;

  documentId = signal<string>('');
  document = signal<Document | null>(null);
  isLoading = signal(false);

  title = signal<string>('Untitled Document');
  content = signal<string>('');
  status = signal<'draft' | 'published' | 'archived'>('draft');
  saveStatus = signal<'saved' | 'saving' | 'unsaved'>('saved');

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
  commentCount = signal<number>(0);

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

    this.saveSubject$
      .pipe(debounceTime(1000), takeUntil(this.destroy$))
      .subscribe(() => {
        this.saveDocument();
      });

    this.loadDocument();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onEditorCreated(quill: any): void {
    this.quillInstance = quill;
  }

  loadDocument(): void {
    const docId = this.documentId();
    if (docId === 'new') {
      const workspaceId: string | undefined = this.route.snapshot.queryParams['workspace'];
      this.createNewDocument(workspaceId);
    } else {
      this.loadExistingDocument(docId);
    }
  }

  createNewDocument(workspaceId?: string): void {
    this.isLoading.set(true);
    const payload: { title: string; content: string; workspaceId?: string } = {
      title: 'Untitled Document',
      content: '',
    };
    if (workspaceId) payload.workspaceId = workspaceId;
    this.documentService
      .createDocument(payload)
      .subscribe({
        next: (doc) => {
          this.document.set(doc);
          this.documentId.set(doc._id);
          this.title.set(doc.title);
          this.content.set(doc.content);
          this.status.set(doc.status);
          this.saveStatus.set('saved');
          this.isLoading.set(false);
          this.router.navigate(['/editor', doc._id], { replaceUrl: true });
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
        this.status.set(doc.status);
        this.saveStatus.set('saved');
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load document:', err);
        this.isLoading.set(false);
        this.snackBar.open('Failed to load document.', 'Close', { duration: 4000 });
        this.router.navigate(['/dashboard']);
      },
    });
  }

  // ─── Ctrl+S / Cmd+S ────────────────────────────────────────────────────────

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      this.saveDocument();
    }
  }

  OnContentChanged(_event: any): void {
    // Do NOT update the content signal here — doing so causes a feedback loop:
    // content.set() → [ngModel] updates → ngx-quill writeValue → text-change → ngModelChange → repeat.
    // The debounce timer would never fire. Instead, read live content from the Quill instance.
    this.saveStatus.set('unsaved');
    this.saveSubject$.next();
  }

  OnTitleChanged(): void {
    this.saveStatus.set('unsaved');
    this.saveSubject$.next();
  }

  onTitleFocus(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    input.value = '';
    this.title.set('');
  }

  onTitleBlur(): void {
    if (!this.title().trim()) {
      this.title.set('Untitled Document');
      this.saveSubject$.next();
    }
  }

  saveDocument(): void {
    const doc = this.document();
    if (!doc) return;

    const liveContent = this.quillInstance?.root.innerHTML ?? this.content();
    this.saveStatus.set('saving');
    this.documentService
      .updateDocument(doc._id, { title: this.title(), content: liveContent })
      .subscribe({
        next: (updatedDoc) => {
          this.document.set(updatedDoc);
          this.content.set(liveContent); // keep signal in sync after a successful save
          this.saveStatus.set('saved');
        },
        error: (err) => {
          console.error('Failed to save document:', err);
          this.saveStatus.set('unsaved');
        },
      });
  }

  // ─── Export ────────────────────────────────────────────────────────────────

  exportDocument(format: string): void {
    switch (format) {
      case 'pdf':   this.exportAsPdf();      break;
      case 'docx':  this.exportAsDocx();     break;
      case 'markdown': this.exportAsMarkdown(); break;
    }
  }

  private exportAsPdf(): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.snackBar.open('Popup blocked. Please allow popups to export PDF.', 'Close', { duration: 4000 });
      return;
    }
    const liveContent = this.quillInstance?.root.innerHTML ?? this.content();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${this.title()}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; line-height: 1.6; color: #333; }
          h1 { font-size: 2rem; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; margin-bottom: 1.5rem; }
          h2 { font-size: 1.5rem; } h3 { font-size: 1.25rem; }
          p { margin: 0 0 1em; }
          blockquote { border-left: 4px solid #ccc; padding-left: 1em; margin: 1em 0; color: #666; }
          pre { background: #f4f4f4; padding: 1em; border-radius: 4px; overflow-x: auto; }
          code { background: #f4f4f4; padding: 0.2em 0.4em; border-radius: 3px; font-size: 0.9em; }
          ul, ol { margin: 1em 0; padding-left: 2em; }
          img { max-width: 100%; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <h1>${this.title()}</h1>
        ${liveContent}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  }

  private exportAsDocx(): void {
    const liveContent = this.quillInstance?.root.innerHTML ?? this.content();
    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office'
            xmlns:w='urn:schemas-microsoft-com:office:word'
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12pt; }
          h1 { font-size: 24pt; } h2 { font-size: 18pt; } h3 { font-size: 14pt; }
          p { margin: 0 0 12pt; }
        </style>
      </head>
      <body>
        <h1>${this.title()}</h1>
        ${liveContent}
      </body>
      </html>`;

    const blob = new Blob([wordHtml], { type: 'application/msword' });
    this.triggerDownload(blob, `${this.sanitizeFilename(this.title())}.doc`);
  }

  private exportAsMarkdown(): void {
    const liveContent = this.quillInstance?.root.innerHTML ?? this.content();
    const markdown = `# ${this.title()}\n\n${this.htmlToMarkdown(liveContent)}`;
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    this.triggerDownload(blob, `${this.sanitizeFilename(this.title())}.md`);
  }

  private htmlToMarkdown(html: string): string {
    return html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gis, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gis, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gis, '### $1\n\n')
      .replace(/<h4[^>]*>(.*?)<\/h4>/gis, '#### $1\n\n')
      .replace(/<h5[^>]*>(.*?)<\/h5>/gis, '##### $1\n\n')
      .replace(/<h6[^>]*>(.*?)<\/h6>/gis, '###### $1\n\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gis, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gis, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gis, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gis, '*$1*')
      .replace(/<code[^>]*>(.*?)<\/code>/gis, '`$1`')
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, '> $1\n\n')
      .replace(/<li[^>]*>(.*?)<\/li>/gis, '- $1\n')
      .replace(/<ul[^>]*>(.*?)<\/ul>/gis, '$1\n')
      .replace(/<ol[^>]*>(.*?)<\/ol>/gis, '$1\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gis, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gis, '[$2]($1)')
      .replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*>/gis, '![$1]($2)')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = globalThis.document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    this.snackBar.open(`Downloaded as ${filename}`, 'Close', { duration: 3000 });
  }

  private sanitizeFilename(name: string): string {
    return name.replace(/[^a-z0-9_\- ]/gi, '_').trim() || 'document';
  }

  // ─── Publish ───────────────────────────────────────────────────────────────

  publishDocument(): void {
    const doc = this.document();
    if (!doc) return;
    const newStatus = this.status() === 'published' ? 'draft' : 'published';
    const label = newStatus === 'published' ? 'Publish' : 'Unpublish';
    const msg =
      newStatus === 'published'
        ? 'Make this document publicly visible?'
        : 'Move this document back to draft?';
    const data: ConfirmDialogData = { title: label, message: msg, confirmLabel: label };
    const ref = this.dialog.open(ConfirmDialogComponent, { width: '360px', data });
    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.documentService.updateDocument(doc._id, { status: newStatus }).subscribe({
        next: (updated) => {
          this.document.set(updated);
          this.status.set(updated.status);
          this.snackBar.open(
            newStatus === 'published' ? 'Document published!' : 'Moved to draft',
            'Close',
            { duration: 3000 }
          );
        },
        error: () =>
          this.snackBar.open('Failed to update status', 'Close', { duration: 4000 }),
      });
    });
  }

  // ─── Share ─────────────────────────────────────────────────────────────────

  copyDocumentLink(): void {
    navigator.clipboard.writeText(window.location.href).then(() => {
      this.snackBar.open('Link copied to clipboard!', 'Close', { duration: 3000 });
    });
  }

  shareDocument(): void {
    this.snackBar.open('Share via email - coming soon!', 'Close', { duration: 3000 });
  }

  // ─── Comments ──────────────────────────────────────────────────────────────

  toggleComments(): void {
    this.showComments.update((v) => !v);
  }

  onCommentCountChange(count: number): void {
    this.commentCount.set(count);
  }

  // ─── AI Panel ──────────────────────────────────────────────────────────────

  toggleAIPanel(): void {
    this.showAIPanel.update((value) => !value);
    if (this.showAIPanel() && this.aiCreditsRemaining() === null) {
      this.loadAICredits();
    }
  }

  switchAITab(tab: 'generate' | 'enhance' | 'research'): void {
    this.aiPanelTab.set(tab);
  }

  loadAICredits(): void {
    this.aiService.getCredits().subscribe({
      next: (credits) => this.aiCreditsRemaining.set(credits.remaining),
      error: (err) => console.error('Failed to load AI credits:', err),
    });
  }

  generateAIContent(): void {
    if (!this.aiPrompt()) {
      this.snackBar.open('Please enter a prompt for the AI.', 'Close', { duration: 3000 });
      return;
    }
    const docId = this.documentId();
    if (!docId || docId === 'new') {
      this.snackBar.open('Please save the document first.', 'Close', { duration: 3000 });
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
          this.aiError.set(err.error?.error || err.error?.message || 'AI generation failed.');
          this.isAIProcessing.set(false);
        },
      });
  }

  insertAIContent(): void {
    if (!this.aiResult() || !this.quillInstance) return;

    const length = this.quillInstance.getLength();
    this.quillInstance.clipboard.dangerouslyPasteHTML(length - 1, this.aiResult());
    this.aiResult.set('');
    this.aiPrompt.set('');
    this.saveStatus.set('unsaved');
    this.saveSubject$.next();
    this.snackBar.open('Content inserted.', 'Close', { duration: 2000 });
  }

  copyAIContent(): void {
    if (!this.aiResult()) return;
    const tempDiv = globalThis.document.createElement('div');
    tempDiv.innerHTML = this.aiResult();
    navigator.clipboard.writeText(tempDiv.textContent || tempDiv.innerText).then(() => {
      this.snackBar.open('Copied to clipboard!', 'Close', { duration: 2000 });
    });
  }

  regenerateAI(): void {
    this.generateAIContent();
  }

  enhanceText(action: string): void {
    if (!this.quillInstance) return;

    const range = this.quillInstance.getSelection();
    const selectedText = range ? this.quillInstance.getText(range.index, range.length) : '';

    if (!selectedText.trim()) {
      this.snackBar.open('Please select some text in the editor first.', 'Close', { duration: 3000 });
      return;
    }

    const docId = this.documentId();
    if (!docId || docId === 'new') {
      this.snackBar.open('Please save the document first.', 'Close', { duration: 3000 });
      return;
    }

    // Store range so replaceSelectedText can use it later
    this.selectionRange = range;
    this.selectedText.set(selectedText);
    this.isAIProcessing.set(true);
    this.aiResult.set('');
    this.aiError.set('');

    this.aiService
      .enhance({
        text: selectedText,
        action: action as 'improve' | 'grammar' | 'shorten' | 'expand' | 'tone',
        tone: action === 'tone' ? (this.aiTone() as 'professional' | 'casual' | 'friendly') : undefined,
        documentId: docId,
      })
      .subscribe({
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
    this.saveStatus.set('unsaved');
    this.saveSubject$.next();

    this.aiResult.set('');
    this.selectedText.set('');
    this.selectionRange = null;
    this.snackBar.open('Text replaced.', 'Close', { duration: 2000 });
  }

  // ─── Navigation ────────────────────────────────────────────────────────────

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  // ─── Stats ─────────────────────────────────────────────────────────────────

  get wordCount(): number {
    const text = (this.quillInstance?.root.innerHTML ?? this.content()).replace(/<[^>]*>/g, '');
    return text.split(/\s+/).filter((word: string) => word.length > 0).length;
  }

  get characterCount(): number {
    return (this.quillInstance?.root.innerHTML ?? this.content()).replace(/<[^>]*>/g, '').length;
  }

  get saveStatusIcon(): string {
    const s = this.saveStatus();
    if (s === 'saved') return 'cloud_done';
    if (s === 'saving') return 'cloud_upload';
    return 'cloud_off';
  }

  get saveStatusText(): string {
    const s = this.saveStatus();
    if (s === 'saved') return 'All changes saved';
    if (s === 'saving') return 'Saving...';
    return 'Unsaved changes';
  }
}

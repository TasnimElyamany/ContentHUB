import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-text-selection-toolbar',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: './text-selection-toolbar.html',
  styleUrl: './text-selection-toolbar.scss',
})
export class TextSelectionToolbar implements OnChanges, OnDestroy {
  @Input() quillInstance: any = null;
  @Output() actionTriggered = new EventEmitter<{
    action: string;
    text: string;
    range: { index: number; length: number };
  }>();

  isVisible = signal(false);
  position = signal({ top: 0, left: 0 });

  private currentRange: { index: number; length: number } | null = null;
  private currentText = '';
  private selectionHandler = this.onSelectionChange.bind(this);

  readonly actions = [
    { key: 'improve', icon: 'auto_fix_high', label: 'Improve' },
    { key: 'expand',  icon: 'expand',        label: 'Expand'  },
    { key: 'shorten', icon: 'compress',      label: 'Shorten' },
    { key: 'tone',    icon: 'palette',       label: 'Tone'    },
    { key: 'grammar', icon: 'spellcheck',    label: 'Grammar' },
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['quillInstance']) {
      const prev = changes['quillInstance'].previousValue;
      if (prev) prev.off('selection-change', this.selectionHandler);
      if (this.quillInstance) {
        this.quillInstance.on('selection-change', this.selectionHandler);
      }
    }
  }

  ngOnDestroy(): void {
    this.quillInstance?.off('selection-change', this.selectionHandler);
  }

  private onSelectionChange(range: any): void {
    if (!range || range.length === 0) {
      this.isVisible.set(false);
      return;
    }

    const text = this.quillInstance.getText(range.index, range.length);
    if (!text.trim()) {
      this.isVisible.set(false);
      return;
    }

    this.currentRange = range;
    this.currentText = text;

    const bounds = this.quillInstance.getBounds(range.index, range.length);
    const editorRect = this.quillInstance.root.getBoundingClientRect();

    this.position.set({
      top: editorRect.top + bounds.top - 52,
      left: editorRect.left + bounds.left + bounds.width / 2,
    });
    this.isVisible.set(true);
  }

  trigger(event: MouseEvent, action: string): void {
    event.preventDefault();
    if (!this.currentRange || !this.currentText) return;
    this.actionTriggered.emit({
      action,
      text: this.currentText,
      range: this.currentRange,
    });
    this.isVisible.set(false);
  }
}

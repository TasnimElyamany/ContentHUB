import {
  Component, Input, Output, EventEmitter,
  OnChanges, OnDestroy, SimpleChanges, signal, computed, NgZone, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface Command {
  key: string;
  group: string;
  icon: string;
  label: string;
  desc: string;
}

@Component({
  selector: 'app-slash-command-palette',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './slash-command-palette.html',
  styleUrl: './slash-command-palette.scss',
})
export class SlashCommandPalette implements OnChanges, OnDestroy {
  @Input() quillInstance: any = null;
  @Output() commandSelected = new EventEmitter<{ command: string }>();

  isVisible = signal(false);
  position = signal({ top: 0, left: 0 });
  lineHintVisible = signal(false);
  lineHintPosition = signal({ top: 0, left: 0 });
  searchQuery = signal('');
  selectedIndex = signal(0);

  private zone = inject(NgZone);
  private slashIndex = -1;
  private textChangeHandler = this.onTextChange.bind(this);
  private keydownHandler = this.onKeydown.bind(this);
  private cursorMoveHandler = this.onCursorMove.bind(this);

  readonly commands: Command[] = [
    { key: 'ask-ai',        group: 'AI',      icon: 'auto_awesome',         label: 'Ask AI',          desc: 'Generate content with AI'    },
    { key: 'improve',       group: 'AI',      icon: 'auto_fix_high',        label: 'Improve Writing', desc: 'Enhance your text'            },
    { key: 'meeting-notes', group: 'AI',      icon: 'mic',                  label: 'Meeting Notes',   desc: 'Generate meeting notes'       },
    { key: 'outline',       group: 'AI',      icon: 'format_list_bulleted', label: 'Outline',         desc: 'Generate an outline'          },
    { key: 'research',      group: 'AI',      icon: 'search',               label: 'Research',        desc: 'Research a topic'             },
    { key: 'h1',            group: 'Content', icon: 'title',                label: 'Heading 1',       desc: 'Large section heading'        },
    { key: 'h2',            group: 'Content', icon: 'title',                label: 'Heading 2',       desc: 'Medium section heading'       },
    { key: 'h3',            group: 'Content', icon: 'title',                label: 'Heading 3',       desc: 'Small section heading'        },
    { key: 'bullet',        group: 'Content', icon: 'format_list_bulleted', label: 'Bullet List',     desc: 'Unordered list'               },
    { key: 'number',        group: 'Content', icon: 'format_list_numbered', label: 'Numbered List',   desc: 'Ordered list'                 },
    { key: 'quote',         group: 'Content', icon: 'format_quote',         label: 'Quote',           desc: 'Blockquote'                   },
    { key: 'code',          group: 'Content', icon: 'code',                 label: 'Code Block',      desc: 'Code snippet'                 },
    { key: 'date',          group: 'Insert',  icon: 'calendar_today',       label: 'Date',            desc: "Insert today's date"          },
    { key: 'divider',       group: 'Insert',  icon: 'horizontal_rule',      label: 'Divider',         desc: 'Horizontal rule'              },
  ];

  filteredCommands = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return q
      ? this.commands.filter(c => c.label.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q))
      : this.commands;
  });

  groupedCommands = computed(() => {
    const result: { name: string; commands: (Command & { globalIndex: number })[] }[] = [];
    let idx = 0;
    for (const group of ['AI', 'Content', 'Insert']) {
      const cmds = this.filteredCommands()
        .filter(c => c.group === group)
        .map(c => ({ ...c, globalIndex: idx++ }));
      if (cmds.length) result.push({ name: group, commands: cmds });
    }
    return result;
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['quillInstance']) {
      const prev = changes['quillInstance'].previousValue;
      if (prev) {
        prev.off('text-change', this.textChangeHandler);
        prev.root.removeEventListener('keydown', this.keydownHandler);
      }
      if (this.quillInstance) {
        this.quillInstance.on('text-change', this.textChangeHandler);
        this.quillInstance.root.addEventListener('mouseup', this.cursorMoveHandler);
        this.quillInstance.root.addEventListener('keyup', this.cursorMoveHandler);
        this.quillInstance.root.addEventListener('keydown', this.keydownHandler, true);
      }
    }
  }

  ngOnDestroy(): void {
    this.quillInstance?.off('text-change', this.textChangeHandler);
    this.quillInstance?.root.removeEventListener('mouseup', this.cursorMoveHandler);
    this.quillInstance?.root.removeEventListener('keyup', this.cursorMoveHandler);
    this.quillInstance?.root.removeEventListener('keydown', this.keydownHandler, true);
  }

  private onTextChange(_delta: any, _old: any, source: string): void {
    if (source !== 'user') return;

    setTimeout(() => {
      this.zone.run(() => {
        const sel = this.quillInstance?.getSelection();
        if (!sel) { this.isVisible.set(false); return; }

        const textBefore = this.quillInstance.getText(0, sel.index);
        const lastSlash = textBefore.lastIndexOf('/');

        if (lastSlash === -1) { this.isVisible.set(false); return; }

        const between = textBefore.slice(lastSlash + 1);
        if (between.includes(' ') || between.includes('\n')) { this.isVisible.set(false); return; }

        this.slashIndex = lastSlash;
        this.searchQuery.set(between.toLowerCase());
        this.selectedIndex.set(0);

        const bounds = this.quillInstance.getBounds(lastSlash);
        const editorRect = this.quillInstance.root.getBoundingClientRect();
        this.position.set({
          top: editorRect.top + bounds.top + bounds.height + 6,
          left: editorRect.left + bounds.left,
        });
        this.isVisible.set(true);
      });
    }, 0);
  }

  private onCursorMove(): void {
    setTimeout(() => {
      this.zone.run(() => {
        if (this.isVisible()) { this.lineHintVisible.set(false); return; }
        const sel = this.quillInstance?.getSelection();
        if (!sel || sel.length > 0) { this.lineHintVisible.set(false); return; }
        const [line, offset] = this.quillInstance.getLine(sel.index);
        const lineStart = sel.index - offset;
        const lineText = this.quillInstance.getText(lineStart, (line?.length() ?? 1) - 1);
        if (lineText.length > 0) { this.lineHintVisible.set(false); return; }
        const bounds = this.quillInstance.getBounds(sel.index);
        const r = this.quillInstance.root.getBoundingClientRect();
        this.lineHintPosition.set({
          top: r.top + bounds.top + (bounds.height - 16) / 2,
          left: r.left + bounds.left + 2,
        });
        this.lineHintVisible.set(true);
      });
    }, 0);
  }

  private onKeydown(e: KeyboardEvent): void {
    if (!this.isVisible()) return;
    const total = this.filteredCommands().length;
    this.zone.run(() => {
      if (e.key === 'ArrowDown')  { e.preventDefault(); this.selectedIndex.update(i => (i + 1) % total); }
      else if (e.key === 'ArrowUp')   { e.preventDefault(); this.selectedIndex.update(i => (i - 1 + total) % total); }
      else if (e.key === 'Enter')     { e.preventDefault(); const cmd = this.filteredCommands()[this.selectedIndex()]; if (cmd) this.executeCommand(cmd); }
      else if (e.key === 'Escape')    { this.isVisible.set(false); }
    });
  }

  execute(event: MouseEvent, cmd: Command & { globalIndex: number }): void {
    event.preventDefault();
    this.executeCommand(cmd);
  }

  private executeCommand(cmd: Command): void {
    const deleteLen = 1 + this.searchQuery().length;
    this.quillInstance.deleteText(this.slashIndex, deleteLen);
    this.quillInstance.setSelection(this.slashIndex, 0);

    switch (cmd.key) {
      case 'h1':     this.quillInstance.format('header', 1); break;
      case 'h2':     this.quillInstance.format('header', 2); break;
      case 'h3':     this.quillInstance.format('header', 3); break;
      case 'bullet': this.quillInstance.format('list', 'bullet'); break;
      case 'number': this.quillInstance.format('list', 'ordered'); break;
      case 'quote':  this.quillInstance.format('blockquote', true); break;
      case 'code':   this.quillInstance.format('code-block', true); break;
      case 'date':
        this.quillInstance.insertText(this.slashIndex, new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
        break;
      case 'divider':
        this.quillInstance.insertText(this.slashIndex, '\n');
        break;
      default:
        this.commandSelected.emit({ command: cmd.key });
    }

    this.isVisible.set(false);
    this.searchQuery.set('');
  }
}

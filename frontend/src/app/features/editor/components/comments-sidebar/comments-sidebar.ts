import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import { CommentService } from '../../services/comment';
import { Comment } from '../../../../models/comment.model';

@Component({
  selector: 'app-comments-sidebar',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  templateUrl: './comments-sidebar.html',
  styleUrl: './comments-sidebar.scss',
})
export class CommentsSidebar implements OnInit, OnChanges {
  @Input() documentId = '';
  @Output() countChange = new EventEmitter<number>();

  private commentService = inject(CommentService);

  comments = signal<Comment[]>([]);
  isLoading = signal(false);

  newCommentText = '';
  replyingTo = signal<string | null>(null);
  replyText = '';
  editingId = signal<string | null>(null);
  editText = '';

  ngOnInit(): void {
    if (this.documentId && this.documentId !== 'new') {
      this.loadComments();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const id = changes['documentId']?.currentValue;
    if (id && id !== 'new') {
      this.loadComments();
    }
  }

  loadComments(): void {
    if (!this.documentId || this.documentId === 'new') return;
    this.isLoading.set(true);
    this.commentService.getComments(this.documentId).subscribe({
      next: (comments) => {
        this.comments.set(comments);
        this.countChange.emit(comments.length);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  addComment(): void {
    if (!this.newCommentText.trim() || !this.documentId || this.documentId === 'new') return;
    this.commentService
      .createComment(this.documentId, {
        content: this.newCommentText.trim(),
        position: { start: 0, end: 0 },
      })
      .subscribe({
        next: (comment) => {
          this.comments.update((list) => [comment, ...list]);
          this.countChange.emit(this.comments().length);
          this.newCommentText = '';
        },
      });
  }

  startReply(commentId: string): void {
    this.replyingTo.set(commentId);
    this.replyText = '';
  }

  cancelReply(): void {
    this.replyingTo.set(null);
    this.replyText = '';
  }

  submitReply(commentId: string): void {
    if (!this.replyText.trim()) return;
    this.commentService.replyToComment(commentId, this.replyText.trim()).subscribe({
      next: (updated) => {
        this.comments.update((list) =>
          list.map((c) => (c._id === commentId ? updated : c))
        );
        this.replyingTo.set(null);
        this.replyText = '';
      },
    });
  }

  resolveComment(commentId: string): void {
    this.commentService.resolveComment(commentId).subscribe({
      next: (updated) => {
        this.comments.update((list) =>
          list.map((c) => (c._id === commentId ? updated : c))
        );
      },
    });
  }

  deleteComment(commentId: string): void {
    this.commentService.deleteComment(commentId).subscribe({
      next: () => {
        this.comments.update((list) => list.filter((c) => c._id !== commentId));
        this.countChange.emit(this.comments().length);
      },
    });
  }

  startEdit(comment: Comment): void {
    this.editingId.set(comment._id);
    this.editText = comment.content;
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editText = '';
  }

  submitEdit(commentId: string): void {
    if (!this.editText.trim()) return;
    this.commentService.updateComment(commentId, this.editText.trim()).subscribe({
      next: (updated) => {
        this.comments.update((list) =>
          list.map((c) => (c._id === commentId ? updated : c))
        );
        this.editingId.set(null);
        this.editText = '';
      },
    });
  }

  timeAgo(date: Date | string): string {
    const now = new Date();
    const then = new Date(date);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  getInitials(name?: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}

# Document Features Implementation Plan

## 1. Export (PDF, DOCX, Markdown) — No npm installs needed

**PDF** — Open a styled print window and call `window.print()`

- New window gets document title as `<h1>` + Quill HTML content + print CSS
- Browser native print dialog handles PDF saving

**DOCX** — Word-compatible HTML Blob download

- Wrap content in Word-namespace HTML, create Blob with `application/msword`
- Trigger download as `title.doc` — opens in Word / LibreOffice

**Markdown** — Regex-based HTML→Markdown conversion (no library)

- Handle: h1-h4, strong/b, em/i, code, blockquote, ul/ol/li, p, br, a, img, HTML entities
- Trigger download as `title.md`

**Replace `alert()` in export/share** with `MatSnackBar` toasts.

---

## 2. Comments System

### Backend — already complete, no changes needed

All routes exist: GET/POST `/comments/documents/:id/comments`, PUT/DELETE/resolve/reply on `/comments/:id`

### Frontend — fully implement `CommentsSidebar` component

**comments-sidebar.ts** — standalone component with:

- `@Input() documentId: string`
- `@Output() countChange = new EventEmitter<number>()`
- Injects `CommentService` and `Auth`
- Signals: `comments`, `isLoading`, `showNewForm`, `newCommentText`, `replyingTo`, `replyText`
- Methods: `loadComments()`, `addComment()`, `replyToComment()`, `resolveComment()`, `deleteComment()`
- Calls `countChange.emit(comments().length)` after any mutation

**comments-sidebar.html** — full UI:

- Header with "Comments" title + "Add Comment" button
- Empty state (no comments)
- New comment form (textarea + Save/Cancel)
- Comment list: author avatar/initials, name, date, content, action buttons (Reply, Resolve, Delete)
- Nested replies under each comment

**editor.ts** changes:

- Replace the inline comments div in `editor.html` with `<app-comments-sidebar>`
- Pass `[documentId]="documentId()"` and listen to `(countChange)` to update the badge
- Remove `comments` signal (now managed by sidebar)
- Add `CommentsSidebar` to imports array

**editor.html** changes:

- Replace the inline comments sidebar div with `<app-comments-sidebar>`

---

## 3. AI Text Replacement (Quill API)

**editor.ts** changes:

- Add `private quillInstance: any = null` field
- Add `onEditorCreated(quill: any)` method to store the instance
- Add `selectionRange: { index: number; length: number } | null = null` field
- In `enhanceText()`: capture `this.quillInstance.getSelection()` BEFORE the API call to remember what was selected
- Implement real `replaceSelectedText()`:
  ```
  const range = this.selectionRange;
  if (range && this.quillInstance) {
    this.quillInstance.deleteText(range.index, range.length);
    this.quillInstance.clipboard.dangerouslyPasteHTML(range.index, this.aiResult());
    this.content.set(this.quillInstance.root.innerHTML);
    this.saveSubject$.next();
  }
  ```

**editor.html** changes:

- Add `(onEditorCreated)="onEditorCreated($event)"` to `<quill-editor>`

---

## 4. Replace remaining alert() calls with MatSnackBar

In `editor.ts`:

- Inject `MatSnackBar`
- Replace `alert('AI-generated content copied...')` → snackbar
- Replace `alert('Please enter a prompt...')` → snackbar
- Replace `alert('Please select some text...')` → snackbar
- Replace `alert('Please save the document first...')` → snackbar
- Replace `alert('Failed to load document...')` → snackbar + navigate
- Add `MatSnackBarModule` to imports

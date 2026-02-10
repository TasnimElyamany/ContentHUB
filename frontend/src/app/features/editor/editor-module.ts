import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EditorRoutingModule } from './editor-routing-module';
import { QuillModule } from 'ngx-quill';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    EditorRoutingModule,
    QuillModule.forRoot()
  ]
})
export class EditorModule { }

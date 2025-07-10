import { Component, Input } from '@angular/core';

import { Book } from '../../books/models/book';
import { MatListSubheaderCssMatStyler } from '@angular/material/list';
import { AddCommasPipe } from '@example-app/shared/pipes/add-commas.pipe';

@Component({
  selector: 'bc-book-authors',
  template: `
    <h5 mat-subheader>Written By:</h5>
    <span>
      {{ authors | bcAddCommas }}
    </span>
  `,
  styles: [
    `
      h5 {
        margin-bottom: 5px;
      }
    `,
  ],
  imports: [MatListSubheaderCssMatStyler, AddCommasPipe],
})
export class BookAuthorsComponent {
  @Input() book!: Book;

  get authors() {
    return this.book.volumeInfo.authors;
  }
}

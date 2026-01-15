import { Component, input } from '@angular/core';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
})
export class Header {
  title = input.required<string>();
  subtitle = input.required<string | undefined>();
}

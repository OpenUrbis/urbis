import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'lib-forbidden',
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './forbidden.html',
})
export class Forbidden {}

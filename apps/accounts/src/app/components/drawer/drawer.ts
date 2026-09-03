import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Sidenav } from './components/sidenav/sidenav';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import {
  HlmSidebarComponent,
  HlmSidebarContentDirective,
  HlmSidebarWrapperDirective,
} from '../../../../projects/shared/src/public-api';

@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    Sidenav,
    TranslateModule,
    HlmSidebarComponent,
    HlmSidebarContentDirective,
    HlmSidebarWrapperDirective,
  ],
  templateUrl: './drawer.html',
})
export class Drawer {}

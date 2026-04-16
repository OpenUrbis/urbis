import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { Sidenav } from './components/sidenav/sidenav';
import { Rails } from './components/rails/rails';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-drawer',
  imports: [
    MatSidenavModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    Sidenav,
    Rails,
    TranslateModule,
  ],
  templateUrl: './drawer.html',
  styleUrl: './drawer.scss',
})
export class Drawer {}

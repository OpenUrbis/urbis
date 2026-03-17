import { CommonModule } from '@angular/common';
import { Component, ElementRef, signal, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-hero',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss'
})
export class HeroComponent {
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<any>;
  status = signal(false);
  ended = signal(false);
  toogle() {
    if(this.ended() === true) {
      this.ended.set(false);

      this.videoPlayer.nativeElement.play()
      this.status.set(true);
      return;
    }
    if (this.status() === false) {
      this.videoPlayer.nativeElement.play()
      this.status.set(true);
      return;
    }
    this.videoPlayer.nativeElement.pause()
    this.status.set(false);
    return;
  }
}

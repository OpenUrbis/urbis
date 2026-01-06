import { Directive, ElementRef, HostListener, input } from '@angular/core';

@Directive({
  selector: 'img[fallbackSrc]',
  standalone: true,
})
export class ImageFallbackDirective {
  fallbackSrc = input.required<string>();

  constructor(private el: ElementRef<HTMLImageElement>) {}

  @HostListener('error')
  onError() {
    const imgElement = this.el.nativeElement;
    const fallback = this.fallbackSrc();

    if (imgElement.src === fallback || imgElement.src.endsWith(fallback)) {
      console.warn('Fallback image also failed to load:', fallback);
      return;
    }

    imgElement.src = fallback;
  }
}

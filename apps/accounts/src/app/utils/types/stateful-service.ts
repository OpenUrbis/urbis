import { signal, WritableSignal } from '@angular/core';

export abstract class StatefulService<T> {
  protected state: WritableSignal<T>;
  protected setStateProperty(property: keyof T, value: T[keyof T]) {
    this.state.set({
      ...this.state(),
      [property]: value,
    });
  }
  constructor(initialState: T) {
    this.state = signal<T>(initialState);
  }
}

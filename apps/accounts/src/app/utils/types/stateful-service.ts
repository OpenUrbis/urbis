import { signal, WritableSignal, Signal } from '@angular/core';

export abstract class StatefulService<T> {
  protected _state: WritableSignal<T>;
  public state: Signal<T>;
  protected setStateProperty(property: keyof T, value: T[keyof T]) {
    this._state.set({
      ...this._state(),
      [property]: value,
    });
  }
  constructor(initialState: T) {
    this._state = signal<T>(initialState);
    this.state = this._state.asReadonly();
  }
}

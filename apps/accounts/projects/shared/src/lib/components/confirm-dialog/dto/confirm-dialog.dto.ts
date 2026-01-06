export interface ConfirmDialogPreferences {
  /** Result mode
   * @type {'reject'|'resolve'}
   * Result mode for promise, with reject or resolve when user select false
   * @default 'resolve'
   */
  resultMode: 'reject' | 'resolve';
  /**
   * Reason string for rejection when resultMode is 'reject' (optional, default: 'User cancelled').
   */
  rejectReason?: string;
}

/**
 * Interface for the data passed to the ConfirmDialogComponent.
 */
export interface ConfirmDialogData {
  /**
   * The main title text for the dialog (required).
   */
  title: string;
  /**
   * The descriptive text for the dialog (optional).
   */
  description?: string;
  /**
   * Text for the confirm button (optional, default: 'Sim').
   */
  confirmText?: string;
  /**
   * Text for the cancel button (optional, default: 'Não').
   */
  cancelText?: string;
  /**
   * Color for the confirm button (optional, default: 'primary').
   */
  confirmColor?: 'primary' | 'accent' | 'warn';
  /**
   * Color for the cancel button (optional, default: 'basic').
   */
  cancelColor?: 'primary' | 'accent' | 'warn' | 'basic';
}

import { inject } from '@angular/core';
import { ConfirmDialog } from '../confirm-dialog';
import {
  ConfirmDialogData,
  ConfirmDialogPreferences,
} from '../dto/confirm-dialog.dto';
import { HlmDialogService } from '../../../ui/dialog/hlm-dialog.service';

export const useConfirmDialog = () => {
  const dialog = inject(HlmDialogService);

  const open = async (
    data: ConfirmDialogData,
    preferences: ConfirmDialogPreferences = { resultMode: 'resolve' },
  ): Promise<boolean> => {
    const { resultMode, rejectReason } = preferences;

    const dialogRef = dialog.open(ConfirmDialog, { data, width: '400px' });
    const value = await dialogRef.afterClosed();

    if (value === true) return true;
    if (resultMode === 'resolve') return false;

    throw {
      message: rejectReason ?? 'Rejected confirmation',
      internalMessage: true,
    };
  };

  return open;
};

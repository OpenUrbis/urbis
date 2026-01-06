import { inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from '../confirm-dialog';
import {
  ConfirmDialogData,
  ConfirmDialogPreferences,
} from '../dto/confirm-dialog.dto';

export const useConfirmDialog = () => {
  const dialog = inject(MatDialog);

  const open = async (
    data: ConfirmDialogData,
    preferences: ConfirmDialogPreferences = { resultMode: 'resolve' },
  ): Promise<boolean> => {
    const { resultMode, rejectReason } = preferences;
    return new Promise((resolve, reject) => {
      const dialogRef = dialog.open(ConfirmDialog, { data });
      dialogRef.afterClosed().subscribe((value: boolean | any) => {
        if (value === true) resolve(true);
        else if (resultMode === 'resolve') resolve(false);
        else
          reject({
            message: rejectReason ?? 'Rejected confirmation',
            internalMessage: true,
          });
      });
    });
  };

  return open;
};

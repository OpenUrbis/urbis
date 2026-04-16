import { TestBed } from '@angular/core/testing';
import { useConfirmDialog } from './confirm-dialog';
import { MatDialog } from '@angular/material/dialog';

describe('useConfirmDialog', () => {
  it('should be created', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: MatDialog, useValue: {} }
      ]
    });
    
    const confirmDialog = TestBed.runInInjectionContext(() => useConfirmDialog());
    expect(confirmDialog).toBeTruthy();
  });
});

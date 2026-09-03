import { PermissionScopePipe } from './permission-scope-pipe';

describe('PermissionScopePipe', () => {
  it('create an instance', () => {
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', [
      'get',
    ]);
    const pipe = new PermissionScopePipe(translateServiceSpy);
    expect(pipe).toBeTruthy();
  });
});

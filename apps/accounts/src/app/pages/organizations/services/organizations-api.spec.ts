import { TestBed } from '@angular/core/testing';

import { OrganizationsApi } from './organizations-api';

describe('OrganizationsApi', () => {
  let service: OrganizationsApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrganizationsApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

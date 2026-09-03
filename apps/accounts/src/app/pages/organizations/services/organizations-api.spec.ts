import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { OrganizationsApi } from './organizations-api';

describe('OrganizationsApi', () => {
  let service: OrganizationsApi;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(OrganizationsApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

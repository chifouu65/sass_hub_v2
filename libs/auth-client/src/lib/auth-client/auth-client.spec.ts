import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthClient } from './auth-client';

describe('AuthClient', () => {
  let component: AuthClient;
  let fixture: ComponentFixture<AuthClient>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthClient],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthClient);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

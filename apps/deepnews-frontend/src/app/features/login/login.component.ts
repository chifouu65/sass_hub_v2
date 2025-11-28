import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [CommonModule],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  ngOnInit() {
    this.loginWithHub();
  }

  loginWithHub() {
    const hubUrl = 'http://localhost:4200/login';
    const returnUrl = encodeURIComponent('http://localhost:4201/callback');
    window.location.href = `${hubUrl}?returnUrl=${returnUrl}`;
  }
}

import { Component } from '@angular/core';

@Component({
    selector: 'app-blank',
    template: `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh;">
            <span>invalid url</span>
        </div>
    `,
    standalone: false
})
export class BlankComponent {}

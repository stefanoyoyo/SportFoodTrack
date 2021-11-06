import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CycletteRoutingModule } from './cyclette-routing.module';
import { CycletteComponent } from './cyclette.component';
import { MatSelectModule } from '@angular/material/select';
import { MatInput, MatInputModule } from '@angular/material/input';
import { TimerModule } from 'src/app/common/timer/timer.module';


@NgModule({
  declarations: [CycletteComponent],
  exports: [CycletteComponent],
  imports: [
    CommonModule,
    TimerModule,
    CycletteRoutingModule,
    MatSelectModule,
    MatInputModule
  ]
})
export class CycletteModule { }

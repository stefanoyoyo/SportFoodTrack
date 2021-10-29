import { Component, OnInit } from '@angular/core';
import { CustomTrainingService } from 'src/services/App/Custom training/custom-training.service';
import { AssetsService } from 'src/services/Helpers/assets/assets.service';

@Component({
  selector: 'app-run',
  templateUrl: './run.component.html',
  styleUrls: ['./run.component.scss'],
})
export class RunComponent implements OnInit {

  constructor(private assets: AssetsService, 
    private componentService: CustomTrainingService) { 
      this.asyncConstructor();
    }
    
  asyncConstructor() {
    throw new Error('Method not implemented.');
  }


  ngOnInit() {}

}

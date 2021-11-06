import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { CustomTrainingService } from 'src/services/App/Custom training/custom-training.service';
import { AssetsService } from 'src/services/Helpers/assets/assets.service';

@Component({
  selector: 'app-cyclette',
  templateUrl: './cyclette.component.html',
  styleUrls: ['./cyclette.component.scss'],
})
export class CycletteComponent implements OnInit, OnChanges, OnDestroy {

  resistances: object[];
  legsPositions: object[];

  choosenResistance: string;
  choosenPosition: string;

  consumedKcal: number = 0;
  canConsumeKcalShow = false;

  @Input() expiredTime;
  canShowNextTrain: boolean = false;

  @Output() timeExpired = new EventEmitter();

  constructor(private assets: AssetsService, 
    private componentService: CustomTrainingService) { 
    this.asyncConstructor()
  }


  ngOnDestroy(): void {
    console.log('cyclette destroyed');
  }

  ngOnChanges(changes: SimpleChanges): void {
  }

  //#region kcal consume
  
  /* Algorithm estimating the kcal consume after training for the specfied time */
  estimateKcalConsume(millisec: number): number {
    console.log('fire');
    const HOUR_CALORIES = 672;
    const secondCalories = HOUR_CALORIES / 3600; // 0.186666
    const kcal = secondCalories * (millisec / 1000);
    return kcal;
  }

  getTrainingMillisec(expiredTime: string): number {
    const tokens = expiredTime.split(':');
    const minutes = this.getMillisecs(tokens[0], tokens[1], tokens[2] );
    return minutes;
  }

  getMillisecs(hours: string, minutes: string, seconds: string):number {
    const millisecsCalc = (parseInt(hours)*1000*60*60) + (parseInt(minutes) * 1000*60) +  (parseInt(seconds) * 1000);
    return millisecsCalc;
  }

  //#endregion


  async asyncConstructor() {
    const cyclette = await this.getSubmenu();
    this.resistances = this.getResistances(cyclette);
    this.legsPositions = this.getLegPositions(cyclette);
  }

  //#region getters

  private getLegPositions(cyclette: string): object[] {
    return JSON.parse(cyclette).legsPosition;
  }

  private getResistances(cyclette: string): object[] {
    return JSON.parse(cyclette).resistance;
  }

  async getSubmenu() : Promise<string> {
    const struments = await this.assets.getFile('assets/struments-menu-cyclette.json');
    return JSON.stringify(struments);
  }
  //#endregion

  optionClick() {
    if (this.isSubmenuComplete()) {
      this.setCyclette();
    }
  }

  /**Method setting the tapis roulant submenu completeness status */
  setCyclette() {
    let val = 
      this.componentService.customTrainingsComplete
        .filter(x => x['training'] === 'Cyclette')[0];
    val['isComplete'] = true;
    console.log('fire')
    console.log(this.componentService.customTrainingsComplete)
  }

  //#region checks
  isSubmenuComplete(): boolean {
    return this.choosenResistance != null && this.choosenPosition != null; 
  }
  //#endregion

  //#region timer component

  /**
   * Listener for time events from chrono-timer component
   * @param event stirng representing the time emitted 
   */
   definedTime(event) {
    this.componentService.definedTime = event;
  }

  actualTime(time: string){
  }

  
  /**Method managing what happen when the timer is expired */ 
  onExpiredTimer(event) {
    this.expiredTime = event;

    this.canConsumeKcalShow = true;
    this.canShowNextTrain = true;
    this.componentService.definedTime = event.timeExpired;

    const millisec = this.getTrainingMillisec(this.componentService.definedTime);
    this.consumedKcal = this.estimateKcalConsume(millisec);

    this.timeExpired.emit(event);
  }

  //#endregion

  ngOnInit() {}

}

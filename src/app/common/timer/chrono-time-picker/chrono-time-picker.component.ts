import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from "@angular/core";
import { StringHelper } from "src/helpers/StringHelper";
import { ChronoTimePickerService } from "src/services/App/Time/Chrono time picker/chrono-time-picker.service";
import { TimeSharedService } from "src/services/App/Time/time-shared.service";
import { StorageService } from "src/services/Services/storage/storage.service";


@Component({
  selector: 'app-chrono-time-picker',
  templateUrl: './chrono-time-picker.component.html',
  styleUrls: ['./chrono-time-picker.component.scss'],
})
export class ChronoTimePickerComponent implements OnInit, OnChanges, OnDestroy {

  //#region fields
  timepickerText = 'Click to open timepicker!';
  inputClockClick = false;

  time = '';

  @Output() definedTime = new EventEmitter();
  @Output() actualTime = new EventEmitter<string>();
  @Output() timeExpired = new EventEmitter<object>();

  @Input() canCountdownStart = true;

  //#endregion

  @Input() chronoType: string = "";

  hour = '0';
  minutes = '0';
  seconds = '0';
  totalTime = '0';

  intervalTimer: any;

  constructor(private chronoService: ChronoTimePickerService,
    private timeShared: TimeSharedService,
    private storage: StorageService) { }

  ngOnDestroy(): void {
    clearInterval(this.intervalTimer);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["chronoType"]) {
      this.chronoType = changes["chronoType"].currentValue;
    }
  }

  ngOnInit() { }

  //#region  checks

  /**
   * Method checking whether the timepicker to 
   * @returns a boolean condition
   */
  isBasic(): boolean {
    return this.chronoType === 'basic';
  }

  /**
   * Method checking whether the timepicker to show is 
   * a clock close to a time setter
   * @returns a boolean condition 
   */
  isTimeClock(): boolean {
    return this.chronoType === 'time-clock';
  }

  /**
   * Method checking whether the timepicker to show is 
   * a clock close to an input element
   * @returns a boolean condition
   */
  isInputClock(): boolean {
    return this.chronoType === 'input-clock';
  }
  //#endregion

  /**
   * Click event listener over input click element.  
   */
  InputClockClicked(): void {
    this.inputClockClick = !this.inputClockClick;
  }

  //#region chrono-time-picker

  //#region subscribers

  /**
   * Event listener for a time selection from
   * the clock widget.
   * It's triggered when 'ok' button is pressed.
   * @param value hour gotten from the widget
   */
  timeChanged(value) {
    this.time = value;
    this.definedTime.emit(value);
    this.clearTimer();

    const hour = this.fixHour(value.split(':')[0]);
    const minutes = this.fixHour(value.split(':')[1]);
    this.timepickerText = this.getTimeText(hour, minutes, null);

    this.startTimer(value);
  }

  /* Method to start the timer. */
  startTimer(time: string): void {
    if (!this.canCountdownStart) {
      this.timeExpired.emit(this.getTimeExpired());
      return;
    }
    this.hour = this.fixHour(time.split(':')[0]);
    this.minutes = this.fixMinutes(time.split(':')[1]);
    this.totalTime = this.setTotalTime();

    let millisec: number = this.chronoService.calcMillisec(parseInt(this.hour), parseInt(this.minutes));

    /** FUNZIONA! */
    // https://gist.github.com/bemson/57dffb89ee7b28d63a29
    // https://stackoverflow.com/questions/49171791/web-worker-onmessage-uncaught-syntaxerror-unexpected-token
    function workerRunner() {
      /**Codice del service worker */
      self.onmessage = function (event) {
        console.log('service received message!')
        let millisec = event.data.millisec; 
        this.intervalTimer = setInterval(() => {
          millisec -= 1000;
          const timeCalculations = {
            millisec: millisec,
            hour: -1,
            minutes: -1,
            seconds: -1,
            timeShared: '',
            timepickerText : ''
          };
          if (millisec > 0) {
            // Saving hour, minutes and seconds
            const buildtime = new Date(millisec);
            timeCalculations.hour = buildtime.getHours();
            timeCalculations.minutes = buildtime.getMinutes();
            timeCalculations.seconds = buildtime.getSeconds();
            timeCalculations.timeShared = msToTime(millisec);
          } else {
            timeCalculations.timepickerText = `Time expired!`;
            this.timeExpired.emit(this.getTimeExpired());
            clearInterval(this.intervalTimer);
          }
          //Invio oggetto con i dati elaborati dal worker service
          self.postMessage(timeCalculations, null);
        }, 1000);
        // Ricezione messaggio da parte del worker
        self.postMessage('launched worker...', null);
      }.bind(this);

      function msToTime(milliseconds: number): string {
        var ms = milliseconds % 1000;
        milliseconds = (milliseconds - ms) / 1000;
        var secs = milliseconds % 60;
        milliseconds = (milliseconds - secs) / 60;
        var mins = milliseconds % 60;
        var hrs = (milliseconds - mins) / 60;
        // Building the timer string
        return pad(hrs, 2) + ':' + pad(mins, 2) + ':' + pad(secs, 2) + '.' + pad(ms, 2);
      }

      function pad(n, z): string {
        z = z || 2;
        return ('00' + n).slice(-z);
      }
    }
    const workerBlob = new Blob([`(${workerRunner})()`]), //'('+workerRunner+')()'
    workerBlobUrl = URL.createObjectURL(workerBlob),
    worker = new Worker(workerBlobUrl);
    /**Ricezione messaggio dal servizio */
    worker.onmessage = function(event) {
      if (event.data.millisec > 0) {
        this.hour = this.fixHour(event.data.timeShared.split(':')[0]);
        this.minutes = this.fixMinutes(event.data.timeShared.split(':')[1]);
        this.seconds = this.fixMinutes(event.data.timeShared.split(':')[2]);
        this.timeShared.timepickerText = this.msToTime(event.data.millisec);
        // Saving the time in the ionic storage
        this.storage.set('timer', this.timeShared.timepickerText)
      } else {
        this.timeShared.timepickerText = event.data.timepickerText;
      }
    }.bind(this);
    /**Invio messaggio al servizio */
    worker.postMessage({
      millisec: millisec
    });
  }

  // #region calculating time

  /**Method calculating and building the time shown in the timer. */
  msToTime(milliseconds: number): string {
    var ms = milliseconds % 1000;
    milliseconds = (milliseconds - ms) / 1000;
    var secs = milliseconds % 60;
    milliseconds = (milliseconds - secs) / 60;
    var mins = milliseconds % 60;
    var hrs = (milliseconds - mins) / 60;
    // Building the timer string
    return this.pad(hrs, 2) + ':' + this.pad(mins, 2) + ':' + this.pad(secs, 2) + '.' + this.pad(ms, 2);
  }

  // Pad to 2 or 3 digits, default is 2
  pad(n, z): string {
    z = z || 2;
    return ('00' + n).slice(-z);
  }

  //#endregion

  setTotalTime(): string {
    return `${this.hour}:${this.minutes}:${this.seconds}`
  }

  /**Method making an object containing the expired emitted time */
  getTimeExpired(): object {
    const obj = {
      time: this.totalTime
    };
    return obj;
  }


  //#endregion

  //#region timer

  //#endregion

  //#region time selected as string

  /**Method getting the string to show when the user selects a time from the timepicker */
  getTimeText(hour: any, minutes: string, seconds: string): string {
    const hourword = parseInt(hour) > 1 ? 'hours' : 'hour';
    const minutesword = parseInt(minutes) > 1 ? 'minutes' : 'minute';
    let timetext = null;

    if (seconds == null) {
      timetext = `You have selected ${hour} ${hourword} and ${minutes} ${minutesword}`;
    } else {
      const secondsword = parseInt(seconds) > 1 ? 'seconds' : 'second';
      timetext = `Countdown now is ${hour} ${hourword} : ${minutes} ${minutesword} : ${seconds} ${secondsword}`;
    }

    return timetext;
  }

  //#region fix times

  /**Method to remove the '0' if its the first char */
  private fixHour(hour: string) {
    const isFirstZero = hour.charAt(0) === '0';
    if (isFirstZero) {
      hour = hour.replace('0', '');
    }
    return hour;
  }


  /**Method to remove the '0' if its the first char */
  private fixMinutes(minutes: string) {
    const isFirstZero = minutes.charAt(0) === '0';
    if (isFirstZero) {
      minutes = minutes.replace('0', '');
    }
    return minutes;
  }
  //#endregion

  /**Method clearing the timer when the user selects another time
   * from timepicker
   */
  clearTimer() {
    if (this.intervalTimer != null) {
      clearInterval(this.intervalTimer);
    }
  }


  //#endregion

  //#endregion

}

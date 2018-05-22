import { interval } from "rxjs/observable/interval";
import { map } from "rxjs/operators";

import museCsv from "../../dataset/muse-lsl.csv";
import { sample } from "rxjs/operator/sample";

// Code splitting: dynaically importing the csv so it is not included in the main bundle
// @TODO: not currently working, webpack bug: https://twitter.com/castillo__io/status/975585584486916096
// export const getMuseCsv = async () =>
//   await import(/* webpackChunkName: "museCsv" */
//   "../../dataset/muse-lsl.csv").then(
//     csv => csv.map(row => row.slice(1, 5)) // filter channel data
//   );

const NUM_CHANNELS = 4;
const SAMPLING_RATE = 256;

let sinCounter = 0;

// filter channel data
const museData = museCsv.map(row => row.slice(1, 5));

const createMockRow = length => Array.from({ length }, () => Math.random());

const createSineRow = (length, freq, samplingRate) => {
  sinCounter++;
  return Array.from(
    { length },
    () => Math.sin(sinCounter / (samplingRate / freq / (Math.PI * 2))) * 100
  );
};

const getCsvRow = (csv, interval) => csv[interval % csv.length];

const injectNaNs = (data, [min, max]) =>
  data.map(value => (value > min && value < max ? NaN : value));

/*
 * Creates a stream of pre-recorded EEG data that can be used for testing
 * Default data was collected from Muse 2016 with muse-lsl: staring at software 
 */
export const createEEG = ({
  channels = NUM_CHANNELS,
  samplingRate = SAMPLING_RATE,
  mock = false,
  NaNRange = [0, 0],
  sine = false,
  csv = museData
} = {}) =>
  interval(1000 / samplingRate).pipe(
    map(interval => {
      const timestamp = Date.now();
      let row = [];
      if (sine) {
        row = createSineRow(channels, sine, samplingRate);
      } else {
        row = mock ? createMockRow(channels) : getCsvRow(csv, interval);
      }
      const data = injectNaNs(row, NaNRange);
      return { timestamp, data };
    })
  );

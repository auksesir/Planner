// src/reportWebVitals.js
import { onCLS, onFID, onINP, onLCP } from 'web-vitals';

const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    onCLS(onPerfEntry);
    onFID(onPerfEntry);
    onLCP(onPerfEntry);
    onINP(onPerfEntry);
  }
};

export default reportWebVitals;


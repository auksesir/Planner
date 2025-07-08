import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux'; // Import Provider from react-redux
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import store from './store'; // Import your Redux store
import './styles/index.css';

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

root.render(
  <Provider store={store}>
    
      <App />
      <ToastContainer />
  </Provider>
);

reportWebVitals((metric) => {
  (`[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)} ms`);
});

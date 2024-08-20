import ReactDOM from 'react-dom/client';

import App from './App';

import {
  ReactFlowProvider
} from '@xyflow/react';
import './index.css';


ReactDOM.createRoot(document.getElementById('root')!).render(
  <ReactFlowProvider>
    <App />
  </ReactFlowProvider>
);

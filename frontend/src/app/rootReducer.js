import { combineReducers } from '@reduxjs/toolkit';
import flowReducer from '../features/flow/flowSlice';
import apiReducer from '../features/api/apiSlice';

const rootReducer = combineReducers({
  flow: flowReducer,
  api: apiReducer,
});

export default rootReducer;
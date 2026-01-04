import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer';

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['flow/setNodes', 'flow/setEdges'],
        ignoredPaths: ['flow.nodes', 'flow.edges'],
      },
    }),
});

export default store;